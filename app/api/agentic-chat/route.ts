import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdVersions, chatMessages } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAIProvider } from "@/lib/ai/provider";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

// POST /api/agentic-chat — unified agentic chat (discuss + direct edit via tool calling)
export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { sessionId, messages, currentPrd, language } = body as {
      sessionId: string;
      messages: Array<{ role: string; content: string }>;
      currentPrd: string;
      language: "id" | "en";
    };

    if (!sessionId || !messages?.length || !currentPrd) {
      return NextResponse.json(
        { error: "sessionId, messages, and currentPrd are required" },
        { status: 400 }
      );
    }

    // Verify session ownership
    const prdSession = await db.query.prdSessions.findFirst({
      where: and(
        eq(prdSessions.id, sessionId),
        eq(prdSessions.userId, session.user.id)
      ),
    });

    if (!prdSession) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get latest version for DB operations
    const latestVersion = await db.query.prdVersions.findFirst({
      where: eq(prdVersions.sessionId, sessionId),
      orderBy: [desc(prdVersions.versionNumber)],
    });

    if (!latestVersion) {
      return NextResponse.json({ error: "Version not found" }, { status: 404 });
    }

    // Save user message to DB
    const lastUserMsg = messages[messages.length - 1];
    if (lastUserMsg?.role === "user") {
      await db.insert(chatMessages).values({
        id: nanoid(),
        sessionId,
        role: "user",
        content: lastUserMsg.content,
      });
    }

    // Call AI with agentic chat (tool calling)
    const aiProvider = await getAIProvider();
    const result = await aiProvider.agenticChat(
      currentPrd,
      messages,
      language || (prdSession.language as "id" | "en")
    );

    if (result.type === "discussion") {
      // Save assistant message
      const assistantMsgId = nanoid();
      await db.insert(chatMessages).values({
        id: assistantMsgId,
        sessionId,
        role: "assistant",
        content: result.message,
        metadata: { action: "discussion" },
      });

      await db
        .update(prdSessions)
        .set({ updatedAt: new Date() })
        .where(eq(prdSessions.id, sessionId));

      return NextResponse.json({
        type: "discussion",
        message: result.message,
        assistantMessageId: assistantMsgId,
      });
    }

    // Tool call detected — apply revision
    const { revisionInstruction, sectionsAffected, changeType, revisionSummary } =
      result.toolInput!;

    // Revise PRD via AI
    const revisedContent = await aiProvider.revisePRD(
      currentPrd,
      revisionInstruction,
      language || (prdSession.language as "id" | "en")
    );

    // Create new version
    const newVersionNumber = latestVersion.versionNumber + 1;
    const newVersionId = nanoid();

    await db.insert(prdVersions).values({
      id: newVersionId,
      sessionId,
      versionNumber: newVersionNumber,
      content: revisedContent,
      changeDescription: revisionSummary || "Revisi dari agentic chat",
    });

    // Save assistant message with edit metadata
    const assistantMsgId = nanoid();
    await db.insert(chatMessages).values({
      id: assistantMsgId,
      sessionId,
      role: "assistant",
      content: result.message || `PRD diperbarui: ${revisionSummary}`,
      metadata: {
        action: "edit",
        sectionsAffected,
        changeType,
        revisionSummary,
        versionNumber: newVersionNumber,
      },
    });

    await db
      .update(prdSessions)
      .set({ updatedAt: new Date() })
      .where(eq(prdSessions.id, sessionId));

    return NextResponse.json({
      type: "edit",
      message: result.message,
      updatedPrd: revisedContent,
      versionId: newVersionId,
      versionNumber: newVersionNumber,
      sectionsAffected,
      changeType,
      revisionSummary,
      assistantMessageId: assistantMsgId,
    });
  } catch (error) {
    console.error("Agentic chat error:", error);
    return NextResponse.json(
      { error: "Failed to process agentic chat message" },
      { status: 500 }
    );
  }
}
