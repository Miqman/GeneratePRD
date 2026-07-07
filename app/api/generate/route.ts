import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdVersions, prdFeatures, prdTasks } from "@/lib/db/schema";
import { getAIProvider } from "@/lib/ai/provider";
import { ROADMAP_PROMPT } from "@/lib/prd-prompt";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import type { TechStackEntry, RoadmapFeature } from "@/lib/types";

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
    const { prompt, language = "id", answers, complexity, techStack, techStackMode } = body;

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

    // If user chose their own tech stack, append it to prompt so AI doesn't override it
    if (techStackMode === "self" && techStack && Array.isArray(techStack)) {
      const stackText = (techStack as TechStackEntry[])
        .map((s) => `- ${s.layer}: ${s.technology}`)
        .join("\n");
      enrichedPrompt += `\n\n---\nTech stack yang WAJIB digunakan (sudah dipilih user, jangan ubah):\n${stackText}`;
    }

    // Generate PRD via AI provider
    const aiProvider = await getAIProvider();
    const prdContent = await aiProvider.generatePRD(enrichedPrompt, language, complexity);

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
      techStack: techStack || null,
      techStackMode: techStackMode || null,
    });

    await db.insert(prdVersions).values({
      id: versionId,
      sessionId,
      versionNumber: 1,
      content: prdContent,
      changeDescription: "Versi awal",
    });

    // Trigger roadmap generation in the background (non-blocking)
    generateRoadmapBackground(sessionId, prdContent, language as "id" | "en", aiProvider).catch(
      (err) => console.error("Background roadmap generation failed:", err)
    );

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

/**
 * Background roadmap generation — fires after PRD is returned to user.
 * Saves features and tasks to DB so Roadmap tab has data immediately on load.
 */
async function generateRoadmapBackground(
  sessionId: string,
  prdContent: string,
  language: "id" | "en",
  aiProvider: Awaited<ReturnType<typeof getAIProvider>>
) {
  try {
    const rawJson = await aiProvider.generateText(
      ROADMAP_PROMPT(language),
      `PRD Content:\n\n${prdContent}`
    );

    let featuresData: RoadmapFeature[];
    try {
      const cleaned = rawJson.replace(/^```json\n?/, "").replace(/\n?```$/, "").trim();
      featuresData = JSON.parse(cleaned);
      if (!Array.isArray(featuresData)) throw new Error("Expected array");
    } catch (parseError) {
      console.error("Roadmap background JSON parsing failed. Raw response was:", rawJson);
      console.error("Parsing error details:", parseError);
      return;
    }

    for (let i = 0; i < featuresData.length; i++) {
      const f = featuresData[i];
      const featureId = nanoid();

      await db.insert(prdFeatures).values({
        id: featureId,
        sessionId,
        name: f.name || "Untitled Feature",
        phase: f.phase || "Fase 1",
        priority: f.priority || "medium",
        description: f.description || "",
        goal: f.goal || "",
        doneWhen: f.doneWhen || [],
        subFeatures: f.subFeatures || [],
        userStories: f.userStories || [],
        icon: f.icon || "Layers",
        status: "planned",
        order: i,
      });

      const tasks = f.tasks || [];
      for (let j = 0; j < tasks.length; j++) {
        const t = tasks[j];
        await db.insert(prdTasks).values({
          id: nanoid(),
          sessionId,
          featureId,
          featureName: f.name,
          title: t.title || "Untitled Task",
          description: t.description || "",
          status: "belum_mulai",
          priority: t.priority === "opsional" ? "opsional" : "utama",
          order: j,
        });
      }
    }
  } catch (err) {
    console.error("generateRoadmapBackground error:", err);
  }
}
