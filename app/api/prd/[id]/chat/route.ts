import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdVersions, chatMessages } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { getAIProvider, parseChatResponse } from "@/lib/ai/provider";
import { headers } from "next/headers";
import { nanoid } from "nanoid";

// POST /api/prd/[id]/chat — conversational PRD chat with streaming
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
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    const body = await request.json();
    const { message } = body;

    if (!message || typeof message !== "string") {
      return new Response(
        JSON.stringify({ error: "Message is required" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const prdSession = await db.query.prdSessions.findFirst({
      where: and(
        eq(prdSessions.id, id),
        eq(prdSessions.userId, session.user.id)
      ),
    });

    if (!prdSession) {
      return new Response(JSON.stringify({ error: "Session not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get latest version content for AI context
    const latestVersion = await db.query.prdVersions.findFirst({
      where: eq(prdVersions.sessionId, id),
      orderBy: [desc(prdVersions.versionNumber)],
    });

    if (!latestVersion) {
      return new Response(JSON.stringify({ error: "Version not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Save user message to DB
    const userMsgId = nanoid();
    await db.insert(chatMessages).values({
      id: userMsgId,
      sessionId: id,
      role: "user",
      content: message,
    });

    // Call AI chat with streaming
    const aiProvider = await getAIProvider();
    const aiStream = await aiProvider.chatPRDStream(
      latestVersion.content,
      message,
      prdSession.language as "id" | "en"
    );

    // Phase 1: Accumulate the full AI stream (raw JSON tokens)
    const reader = aiStream.getReader();
    const decoder = new TextDecoder();
    let fullRaw = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullRaw += typeof value === "string" ? value : decoder.decode(value, { stream: true });
    }

    // Phase 2: Parse the complete JSON response reliably
    const chatResponse = parseChatResponse(fullRaw);
    const responseText = chatResponse.response || fullRaw;

    // Phase 3: Stream the clean text to the client via SSE
    const encoder = new TextEncoder();

    const sseStream = new ReadableStream({
      async start(controller) {
        const sendEvent = (event: string, data: object) => {
          controller.enqueue(
            encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
          );
        };

        try {
          // Send initial metadata
          sendEvent("start", { userMessageId: userMsgId });

          // Stream response text in small chunks for typing effect
          // Split by characters but keep markdown structure intact
          const CHUNK_SIZE = 4; // characters per chunk for smooth typing
          for (let i = 0; i < responseText.length; i += CHUNK_SIZE) {
            const chunk = responseText.slice(i, i + CHUNK_SIZE);
            sendEvent("text", { text: chunk });
            // Small delay between chunks for natural typing feel
            await new Promise((r) => setTimeout(r, 8));
          }

          // Build metadata
          const metadata: Record<string, unknown> = { action: chatResponse.action };
          let revisionProposal = null;

          if (chatResponse.action === "revision" && chatResponse.revisionInstruction) {
            metadata.revisionProposal = {
              instruction: chatResponse.revisionInstruction,
              summary:
                chatResponse.revisionSummary ||
                chatResponse.revisionInstruction.slice(0, 50),
            };
            revisionProposal = {
              instruction: chatResponse.revisionInstruction,
              summary:
                chatResponse.revisionSummary ||
                chatResponse.revisionInstruction.slice(0, 50),
            };
          }

          // Save assistant message to DB
          const assistantMsgId = nanoid();
          await db.insert(chatMessages).values({
            id: assistantMsgId,
            sessionId: id,
            role: "assistant",
            content: responseText,
            metadata,
          });

          // Update session updatedAt
          await db
            .update(prdSessions)
            .set({ updatedAt: new Date() })
            .where(eq(prdSessions.id, id));

          // Send done event with final metadata
          sendEvent("done", {
            assistantMessageId: assistantMsgId,
            action: chatResponse.action,
            revisionProposal,
          });

          controller.close();
        } catch (error) {
          console.error("Chat stream error:", error);
          sendEvent("error", { message: "Failed to process chat" });
          controller.close();
        }
      },
    });

    return new Response(sseStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache",
        Connection: "keep-alive",
      },
    });
  } catch (error) {
    console.error("Chat PRD error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process chat message" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
