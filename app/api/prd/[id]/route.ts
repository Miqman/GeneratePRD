import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdVersions, chatMessages } from "@/lib/db/schema";
import { eq, desc, and } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/prd/[id] — get a single session with all versions and chat
export async function GET(
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

    const prdSession = await db.query.prdSessions.findFirst({
      where: and(
        eq(prdSessions.id, id),
        eq(prdSessions.userId, session.user.id)
      ),
      with: {
        versions: {
          orderBy: [desc(prdVersions.versionNumber)],
        },
        messages: {
          orderBy: [desc(chatMessages.createdAt)],
        },
      },
    });

    if (!prdSession) {
      return NextResponse.json({ error: "Sesi PRD tidak ditemukan" }, { status: 404 });
    }

    return NextResponse.json({ session: prdSession });
  } catch (error) {
    console.error("Get PRD session error:", error);
    return NextResponse.json({ error: "Gagal memuat sesi PRD" }, { status: 500 });
  }
}

// DELETE /api/prd/[id] — delete a session
export async function DELETE(
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

    await db
      .delete(prdSessions)
      .where(
        and(eq(prdSessions.id, id), eq(prdSessions.userId, session.user.id))
      );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete PRD session error:", error);
    return NextResponse.json({ error: "Gagal menghapus sesi" }, { status: 500 });
  }
}
