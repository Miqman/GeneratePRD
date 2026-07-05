import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { getAIProvider } from "@/lib/ai/provider";
import { TECH_STACK_AI_PROMPT } from "@/lib/prd-prompt";
import { headers } from "next/headers";
import type { TechStackEntry } from "@/lib/types";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, language = "id" } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Prompt minimal 10 karakter" },
        { status: 400 }
      );
    }

    const aiProvider = await getAIProvider();
    const rawJson = await aiProvider.generateText(
      TECH_STACK_AI_PROMPT(language as "id" | "en"),
      prompt.trim()
    );

    // Parse and validate
    let techStack: TechStackEntry[];
    try {
      const cleaned = rawJson.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      techStack = JSON.parse(cleaned);
      if (!Array.isArray(techStack)) throw new Error("Expected array");
    } catch {
      return NextResponse.json(
        { error: "AI returned invalid tech stack JSON" },
        { status: 500 }
      );
    }

    return NextResponse.json({ techStack });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Tech stack AI error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
