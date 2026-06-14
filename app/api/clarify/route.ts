import { NextRequest, NextResponse } from "next/server";
import { getAIProvider } from "@/lib/ai/provider";
import { CLARIFY_SYSTEM_PROMPT } from "@/lib/prd-prompt";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { prompt, language = "id" } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Prompt minimal 10 karakter" },
        { status: 400 }
      );
    }

    const aiProvider = await getAIProvider();

    // Use generatePRD as a generic chat call by re-using the provider interface.
    // We pass the clarify system prompt via a thin wrapper.
    const raw = await aiProvider.clarify(prompt.trim(), language);

    // Sanitise: strip any accidental markdown code fences the model may add
    const cleaned = raw
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    let parsed: { needsClarification: boolean; complexity?: "simple" | "medium" | "complex"; questions?: any[] };
    try {
      parsed = JSON.parse(cleaned);

      // Validasi struktur minimal
      if (typeof parsed.needsClarification !== "boolean") {
        throw new Error("Invalid response structure");
      }

      // Ensure complexity is present, default to "medium" if missing
      if (!parsed.complexity || !["simple", "medium", "complex"].includes(parsed.complexity)) {
        parsed.complexity = "medium";
      }
    } catch {
      console.warn("Clarify: invalid JSON from model:", cleaned);
      // Fail SAFE: kalau model gagal, lebih baik tanya ke user
      // daripada generate PRD yang potentially vague
      parsed = {
        needsClarification: true,
        complexity: "medium",
        questions: [
          { text: "Siapa yang akan lebih sering pakai aplikasi ini?", type: "choice", choices: ["Pemain/pelanggan", "Pemilik/pengelola", "Keduanya"] },
          { text: "Masalah apa yang paling sering terjadi saat proses ini dilakukan secara manual sekarang?", type: "open" },
        ],
      };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Clarify error:", error);
    return NextResponse.json({
      needsClarification: true,
      complexity: "medium",
      questions: [
        { text: "Siapa yang akan lebih sering pakai aplikasi ini?", type: "choice", choices: ["Pemain/pelanggan", "Pemilik/pengelola", "Keduanya"] },
        { text: "Masalah apa yang paling sering terjadi saat proses ini dilakukan secara manual sekarang?", type: "open" },
      ],
    });
  }
}
