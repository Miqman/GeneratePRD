import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdFeatures, prdTasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { getAIProvider } from "@/lib/ai/provider";
import { ROADMAP_PROMPT } from "@/lib/prd-prompt";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import type { RoadmapFeature } from "@/lib/types";

export const maxDuration = 300;

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership
    const prdSession = await db.query.prdSessions.findFirst({
      where: eq(prdSessions.id, id),
    });
    if (!prdSession || prdSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Fetch features with tasks
    const features = await db.query.prdFeatures.findMany({
      where: eq(prdFeatures.sessionId, id),
      orderBy: [asc(prdFeatures.order)],
      with: { tasks: { orderBy: [asc(prdTasks.order)] } },
    });

    return NextResponse.json({ features });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Verify ownership + get PRD content
    const prdSession = await db.query.prdSessions.findFirst({
      where: eq(prdSessions.id, id),
      with: { versions: { orderBy: (v, { desc }) => [desc(v.versionNumber)], limit: 1 } },
    });
    if (!prdSession || prdSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    const latestVersion = prdSession.versions?.[0];
    if (!latestVersion?.content) {
      return NextResponse.json({ error: "No PRD content found" }, { status: 400 });
    }

    // Generate roadmap via AI
    const language = (prdSession.language as "id" | "en") || "id";
    const aiProvider = await getAIProvider();
    const rawJson = await aiProvider.generateText(
      ROADMAP_PROMPT(language),
      `PRD Content:\n\n${latestVersion.content}`
    );

    // Parse AI response
    let featuresData: RoadmapFeature[];
    try {
      const match = rawJson.match(/\[[\s\S]*\]/);
      if (!match) throw new Error("No array found in response");
      featuresData = JSON.parse(match[0]);
      if (!Array.isArray(featuresData)) throw new Error("Expected array");
    } catch (parseError) {
      console.error("Roadmap JSON parsing failed. Raw response was:", rawJson);
      console.error("Parsing error details:", parseError);
      return NextResponse.json({ error: "AI returned invalid JSON for roadmap" }, { status: 500 });
    }

    // Delete existing features (cascade deletes tasks too)
    await db.delete(prdFeatures).where(eq(prdFeatures.sessionId, id));

    // Insert new features and tasks
    const insertedFeatures: RoadmapFeature[] = [];
    for (let i = 0; i < featuresData.length; i++) {
      const f = featuresData[i];
      const featureId = nanoid();

      await db.insert(prdFeatures).values({
        id: featureId,
        sessionId: id,
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

      // Insert tasks for this feature
      const tasks = f.tasks || [];
      for (let j = 0; j < tasks.length; j++) {
        const t = tasks[j];
        await db.insert(prdTasks).values({
          id: nanoid(),
          sessionId: id,
          featureId,
          featureName: f.name,
          title: t.title || "Untitled Task",
          description: t.description || "",
          status: "belum_mulai",
          priority: t.priority === "opsional" ? "opsional" : "utama",
          order: j,
        });
      }

      insertedFeatures.push({ ...f, id: featureId, sessionId: id, createdAt: new Date().toISOString() });
    }

    // Refetch with tasks
    const finalFeatures = await db.query.prdFeatures.findMany({
      where: eq(prdFeatures.sessionId, id),
      orderBy: [asc(prdFeatures.order)],
      with: { tasks: { orderBy: [asc(prdTasks.order)] } },
    });

    return NextResponse.json({ features: finalFeatures });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Roadmap generation error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
