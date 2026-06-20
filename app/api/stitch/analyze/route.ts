import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { headers } from "next/headers";
import { STITCH_SYSTEM_PROMPT, buildStitchUserPrompt } from "@/lib/stitch-prompt";

// Max 5 images, 10MB each
const MAX_IMAGES = 5;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// 9router config — gunakan model khusus vision (comboGemini)
const BASE_URL = process.env.NINEROUTER_BASE_URL || "https://api.9router.com/v1";
const API_KEY = process.env.NINEROUTER_API_KEY || "";
const VISION_MODEL = process.env.NINEROUTER_VISION_MODEL || "comboGemini";

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
        return NextResponse.json(
          { error: `File "${file.name}" terlalu besar (max 10MB)` },
          { status: 400 }
        );
      }
      const validTypes = ["image/png", "image/jpeg", "image/webp", "image/gif"];
      if (!validTypes.includes(file.type)) {
        return NextResponse.json(
          { error: `Format file tidak didukung: ${file.type}` },
          { status: 400 }
        );
      }
    }

    // Convert images to base64 for OpenAI-compatible vision format
    const imageContentParts = await Promise.all(
      imageFiles.map(async (file) => {
        const bytes = await file.arrayBuffer();
        const base64 = Buffer.from(bytes).toString("base64");
        return {
          type: "image_url",
          image_url: {
            url: `data:${file.type};base64,${base64}`,
            detail: "high",
          },
        };
      })
    );

    const userPrompt = buildStitchUserPrompt(
      imageFiles.length,
      projectName || undefined,
      description || undefined
    );

    // Build messages with vision content (OpenAI-compatible multimodal format)
    const messages = [
      { role: "system", content: STITCH_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: userPrompt },
          ...imageContentParts,
        ],
      },
    ];

    // Call 9router with comboGemini model
    const res = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: VISION_MODEL,
        messages,
        temperature: 0.3,
        max_tokens: 8192,
        stream: false,
      }),
    });

    if (!res.ok) {
      const errBody = await res.text().catch(() => res.statusText);
      console.error("[stitch] 9router error:", errBody);
      throw new Error(`9router API error [${res.status}]: ${errBody}`);
    }

    const resData = await res.json();
    const rawText: string =
      resData?.choices?.[0]?.message?.content ??
      resData?.choices?.[0]?.text ??
      resData?.content ??
      "";

    if (!rawText) {
      throw new Error("AI tidak menghasilkan output. Coba lagi.");
    }

    // Parse JSON from AI response (handle markdown code blocks)
    let designMd = "";
    let stitchPrompt = "";

    try {
      const jsonMatch =
        rawText.match(/```json\s*([\s\S]*?)```/) ||
        rawText.match(/```\s*([\s\S]*?)```/) ||
        [null, rawText];

      const jsonStr = jsonMatch[1]?.trim() || rawText.trim();
      const parsed = JSON.parse(jsonStr);
      designMd = parsed.designMd || "";
      stitchPrompt = parsed.stitchPrompt || "";
    } catch {
      console.warn("[stitch] Could not parse JSON from AI response, using raw text");
      designMd = rawText;
      stitchPrompt = "Could not extract stitch prompt — see DESIGN.md for full analysis.";
    }

    if (!designMd) {
      throw new Error("AI tidak menghasilkan DESIGN.md yang valid. Coba lagi.");
    }

    const sessionId = `stitch_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    return NextResponse.json({
      sessionId,
      designMd,
      stitchPrompt,
      metadata: {
        screenshotCount: imageFiles.length,
        projectName: projectName || null,
        analyzedAt: new Date().toISOString(),
        model: VISION_MODEL,
      },
    });
  } catch (err) {
    console.error("[stitch] analyze error:", err);
    const message = err instanceof Error ? err.message : "Terjadi kesalahan server";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
