import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdVersions } from "@/lib/db/schema";
import { getAIProvider } from "@/lib/ai/provider";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

// Allow up to 5 minutes — PRD generation with large token budgets can take a while
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { prompt, language = "id", answers } = body;

    if (!prompt || typeof prompt !== "string" || prompt.trim().length < 10) {
      return NextResponse.json(
        { error: "Prompt minimal 10 karakter" },
        { status: 400 }
      );
    }

    // If user answered clarification questions, append context to the prompt
    let enrichedPrompt = prompt.trim();
    if (answers && typeof answers === "object" && Object.keys(answers).length > 0) {
      const answersText = Object.entries(answers as Record<string, string>)
        .filter(([, v]) => v.trim())
        .map(([q, a]) => `- ${q}\n  Jawaban: ${a.trim()}`)
        .join("\n");
      if (answersText) {
        enrichedPrompt += `\n\n---\nInformasi tambahan dari pengguna:\n${answersText}`;
      }
    }

    // Generate PRD via AI provider
    const aiProvider = await getAIProvider();
    const prdContent = await aiProvider.generatePRD(enrichedPrompt, language);

    // Extract title from prompt (first 60 chars)
    const title =
      prompt.trim().slice(0, 60) + (prompt.length > 60 ? "..." : "");

    // Create session in DB
    const sessionId = nanoid();
    const versionId = nanoid();

    await db.insert(prdSessions).values({
      id: sessionId,
      userId: session.user.id,
      title,
      prompt: prompt.trim(),
      language,
    });

    await db.insert(prdVersions).values({
      id: versionId,
      sessionId,
      versionNumber: 1,
      content: prdContent,
      changeDescription: "Versi awal",
    });

    return NextResponse.json({
      sessionId,
      versionId,
      content: prdContent,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Generate PRD error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
