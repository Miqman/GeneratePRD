import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdTasks } from "@/lib/db/schema";
import { eq, and } from "drizzle-orm";
import { headers } from "next/headers";

const VALID_STATUSES = ["belum_mulai", "dikerjakan", "selesai", "gagal"] as const;
type TaskStatus = typeof VALID_STATUSES[number];

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; taskId: string }> }
) {
  try {
    const { id, taskId } = await params;

    // Support both session auth (user) and API key auth (AI agent external)
    const agentKey = request.headers.get("X-Agent-Key");
    const isAgentAuth = agentKey && agentKey === process.env.AGENT_API_KEY;

    if (!isAgentAuth) {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      // Verify task belongs to user's session
      const prdSession = await db.query.prdSessions.findFirst({
        where: eq(prdSessions.id, id),
      });
      if (!prdSession || prdSession.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const body = await request.json();
    const { status } = body;

    if (!status || !VALID_STATUSES.includes(status as TaskStatus)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(", ")}` },
        { status: 400 }
      );
    }

    // Update the task
    await db
      .update(prdTasks)
      .set({
        status: status as TaskStatus,
        updatedAt: new Date(),
      })
      .where(and(eq(prdTasks.id, taskId), eq(prdTasks.sessionId, id)));

    const updatedTask = await db.query.prdTasks.findFirst({
      where: and(eq(prdTasks.id, taskId), eq(prdTasks.sessionId, id)),
    });

    if (!updatedTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    return NextResponse.json({ task: updatedTask });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
