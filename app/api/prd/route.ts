import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { prdSessions, prdVersions } from "@/lib/db/schema";
import { eq, desc } from "drizzle-orm";
import { headers } from "next/headers";

// GET /api/prd — list all sessions for current user
export async function GET() {
  try {
    const session = await auth.api.getSession({
      headers: await headers(),
    });

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sessions = await db.query.prdSessions.findMany({
      where: eq(prdSessions.userId, session.user.id),
      orderBy: [desc(prdSessions.updatedAt)],
      with: {
        versions: {
          orderBy: [desc(prdVersions.versionNumber)],
          limit: 1,
        },
      },
    });

    return NextResponse.json({ sessions });
  } catch (error) {
    console.error("List PRD sessions error:", error);
    return NextResponse.json({ error: "Gagal memuat sesi PRD" }, { status: 500 });
  }
}
