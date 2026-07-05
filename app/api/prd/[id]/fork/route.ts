import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdVersions, chatMessages, prdFeatures, prdTasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Find original session and verify ownership
    const originalSession = await db.query.prdSessions.findFirst({
      where: eq(prdSessions.id, id),
      with: {
        versions: { orderBy: [asc(prdVersions.versionNumber)] },
        features: {
          orderBy: [asc(prdFeatures.order)],
          with: { tasks: { orderBy: [asc(prdTasks.order)] } },
        },
      },
    });

    if (!originalSession || originalSession.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Create new session (fork)
    const newSessionId = nanoid();
    await db.insert(prdSessions).values({
      id: newSessionId,
      userId: session.user.id,
      title: `${originalSession.title} (Fork)`,
      prompt: originalSession.prompt,
      language: originalSession.language,
      techStack: originalSession.techStack as any,
      techStackMode: originalSession.techStackMode,
    });

    // Copy all versions
    for (const version of originalSession.versions || []) {
      await db.insert(prdVersions).values({
        id: nanoid(),
        sessionId: newSessionId,
        versionNumber: version.versionNumber,
        content: version.content,
        changeDescription: version.changeDescription,
      });
    }

    // Copy features and tasks (reset task status to "belum_mulai")
    for (const feature of originalSession.features || []) {
      const newFeatureId = nanoid();
      await db.insert(prdFeatures).values({
        id: newFeatureId,
        sessionId: newSessionId,
        name: feature.name,
        phase: feature.phase,
        priority: feature.priority,
        description: feature.description,
        goal: feature.goal,
        doneWhen: feature.doneWhen as string[],
        subFeatures: feature.subFeatures as any,
        icon: feature.icon,
        status: "planned", // reset status
        order: feature.order,
      });

      for (const task of feature.tasks || []) {
        await db.insert(prdTasks).values({
          id: nanoid(),
          sessionId: newSessionId,
          featureId: newFeatureId,
          featureName: task.featureName,
          title: task.title,
          description: task.description,
          status: "belum_mulai", // always reset on fork
          priority: task.priority,
          order: task.order,
        });
      }
    }

    return NextResponse.json({ newSessionId });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error("Fork session error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
