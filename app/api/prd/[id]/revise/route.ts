import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdVersions, chatMessages } from "@/lib/db/schema";
import { eq, desc, and, count } from "drizzle-orm";
import { getAIProvider } from "@/lib/ai/provider";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

// POST /api/prd/[id]/revise — revise PRD and create new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { instruction } = body;

    if (!instruction || typeof instruction !== "string") {
      return NextResponse.json({ error: "Instruksi revisi diperlukan" }, { status: 400 });
    }

    // Get current session with latest version
    const prdSession = await db.query.prdSessions.findFirst({
      where: and(
        eq(prdSessions.id, id),
        eq(prdSessions.userId, session.user.id)
      ),
    });

    if (!prdSession) {
      return NextResponse.json({ error: "Sesi PRD tidak ditemukan" }, { status: 404 });
    }

    // Get latest version
    const latestVersion = await db.query.prdVersions.findFirst({
      where: eq(prdVersions.sessionId, id),
      orderBy: [desc(prdVersions.versionNumber)],
    });

    if (!latestVersion) {
      return NextResponse.json({ error: "Versi PRD tidak ditemukan" }, { status: 404 });
    }

    // Save user message
    await db.insert(chatMessages).values({
      id: nanoid(),
      sessionId: id,
      role: "user",
      content: instruction,
    });

    // Revise PRD via AI
    const aiProvider = await getAIProvider();
    const revisedContent = await aiProvider.revisePRD(
      latestVersion.content,
      instruction,
      prdSession.language as "id" | "en"
    );

    // Create new version
    const newVersionNumber = latestVersion.versionNumber + 1;
    const newVersionId = nanoid();

    await db.insert(prdVersions).values({
      id: newVersionId,
      sessionId: id,
      versionNumber: newVersionNumber,
      content: revisedContent,
      changeDescription: instruction.slice(0, 100),
    });

    // Save assistant message
    await db.insert(chatMessages).values({
      id: nanoid(),
      sessionId: id,
      role: "assistant",
      content: `PRD telah diperbarui ke **Version ${newVersionNumber}**. Perubahan: ${instruction.slice(0, 100)}`,
    });

    // Update session updatedAt
    await db
      .update(prdSessions)
      .set({ updatedAt: new Date() })
      .where(eq(prdSessions.id, id));

    return NextResponse.json({
      versionId: newVersionId,
      versionNumber: newVersionNumber,
      content: revisedContent,
    });
  } catch (error) {
    console.error("Revise PRD error:", error);
    return NextResponse.json(
      { error: "Gagal merevisi PRD. Silakan coba lagi." },
      { status: 500 }
    );
  }
}
