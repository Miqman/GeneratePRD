import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { STITCH_SYSTEM_PROMPT, buildStitchUserPrompt } from "@/lib/stitch-prompt";

// Max 5 images, 10MB each
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export async function POST(req: NextRequest) {
  // Auth check
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const projectName = formData.get("projectName") as string | null;
    const description = formData.get("description") as string | null;
    const imageFiles = formData.getAll("images") as File[];

    // Validation
    if (!imageFiles || imageFiles.length === 0) {
      return NextResponse.json({ error: "Minimal 1 screenshot diperlukan" }, { status: 400 });
    }
    if (imageFiles.length > MAX_IMAGES) {
      return NextResponse.json({ error: `Maksimal ${MAX_IMAGES} screenshot` }, { status: 400 });
    }
    for (const file of imageFiles) {
      if (file.size > MAX_FILE_SIZE) {
        return NextResponse.json({ error: `File "${file.name}" terlalu besar (max 10MB)` }, { status: 400 });
      }
      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json({ error: `Format file tidak didukung: ${file.type}` }, { status: 400 });
      }
    }

    // Convert images to base64 for Gemini Vision
    const imageParts = await Promise.all(
      imageFiles.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        return {
          inlineData: {
            mimeType: file.type,
            data: base64,
          },
        };
      })
    );

    // Call Gemini Vision API
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const userPrompt = buildStitchUserPrompt(
      imageFiles.length,
      projectName || undefined,
      description || undefined
    );

    const geminiRes = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: STITCH_SYSTEM_PROMPT }],
        },
        contents: [
          {
            parts: [
              { text: userPrompt },
              ...imageParts,
            ],
          },
        ],
        generationConfig: {
          temperature: 0.3,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!geminiRes.ok) {
      const errBody = await geminiRes.text();
      console.error("Gemini Vision error:", errBody);
      throw new Error(`Gemini Vision API error: ${geminiRes.statusText}`);
    }

    const geminiData = await geminiRes.json();
    const rawText: string = geminiData.candidates?.[0]?.content?.parts?.[0]?.text || "";

    // Parse JSON from AI response
    let designMd = "";
    let stitchPrompt = "";

    try {
      // Try to extract JSON from the response (handle markdown code blocks)
      const jsonMatch =
        rawText.match(/```json\s*([\s\S]*?)```/) ||
        rawText.match(/```\s*([\s\S]*?)```/) ||
        [null, rawText];

      const jsonStr = jsonMatch[1]?.trim() || rawText.trim();
      const parsed = JSON.parse(jsonStr);
      designMd = parsed.designMd || "";
      stitchPrompt = parsed.stitchPrompt || "";
    } catch {
      // If JSON parsing fails, try to extract manually
      console.warn("Could not parse JSON from Gemini response, using raw text");
      designMd = rawText;
      stitchPrompt = "Could not extract stitch prompt — see DESIGN.md for full analysis.";
    }

    if (!designMd) {
      throw new Error("AI tidak menghasilkan output yang valid. Coba lagi.");
    }

    // Generate a unique session ID
    const sessionId = `stitch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      sessionId,
      designMd,
      stitchPrompt,
      metadata: {
        screenshotCount: imageFiles.length,
        projectName: projectName || null,
        analyzedAt: new Date().toISOString(),
      },
    });
  } catch (err) {
    console.error("Stitch analyze error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
