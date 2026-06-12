import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, accounts, sessions } from "@/lib/db/schema";
import { eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function POST() {
  // Only allow in development
  if (process.env.NODE_ENV !== "development") {
    return NextResponse.json({ error: "Not allowed" }, { status: 403 });
  }

  const email = "demo@prdforge.ai";
  const password = "password123";
  const name = "Demo User";

  try {
    // Hapus user lama (cascade ke sessions & accounts)
    const [existingUser] = await db
      .select({ id: users.id })
      .from(users)
      .where(eq(users.email, email))
      .limit(1);

    if (existingUser) {
      // Hapus sessions
      await db.delete(sessions).where(eq(sessions.userId, existingUser.id));
      // Hapus accounts
      await db.delete(accounts).where(eq(accounts.userId, existingUser.id));
      // Hapus user
      await db.delete(users).where(eq(users.id, existingUser.id));
    }

    // Buat akun baru
    const result = await auth.api.signUpEmail({
      body: { email, password, name },
    });

    if (result.user) {
      return NextResponse.json({
        message: existingUser
          ? "Demo account recreated successfully"
          : "Demo account created",
        user: { id: result.user.id, email: result.user.email },
      });
    }

    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
