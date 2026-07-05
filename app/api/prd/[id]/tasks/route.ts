import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdTasks } from "@/lib/db/schema";
import { eq, asc } from "drizzle-orm";
import { headers } from "next/headers";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Support both session auth (user in browser) and API key auth (AI agent)
    const agentKey = request.headers.get("X-Agent-Key");
    const isAgentAuth = agentKey && agentKey === process.env.AGENT_API_KEY;

    if (!isAgentAuth) {
      const session = await auth.api.getSession({ headers: await headers() });
      if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

      const prdSession = await db.query.prdSessions.findFirst({
        where: eq(prdSessions.id, id),
      });
      if (!prdSession || prdSession.userId !== session.user.id) {
        return NextResponse.json({ error: "Not found" }, { status: 404 });
      }
    }

    const tasks = await db.query.prdTasks.findMany({
      where: eq(prdTasks.sessionId, id),
      orderBy: [asc(prdTasks.order)],
    });

    return NextResponse.json({ tasks });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
