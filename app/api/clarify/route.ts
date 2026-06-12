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

    let parsed: { needsClarification: boolean; questions?: string[] };
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      // If the model failed to produce valid JSON, assume no clarification needed
      console.warn("Clarify: model returned non-JSON, skipping clarification:", cleaned);
      parsed = { needsClarification: false };
    }

    return NextResponse.json(parsed);
  } catch (error) {
    console.error("Clarify error:", error);
    // Fail gracefully — don't block PRD generation on clarification errors
    return NextResponse.json({ needsClarification: false });
  }
}
