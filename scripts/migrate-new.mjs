// Script to run only the new migration (add new columns and tables)
// Run with: node --env-file=.env.local scripts/migrate-new.mjs
// OR: node scripts/migrate-new.mjs (dotenv loaded manually)

import postgres from "postgres";
import * as dotenv from "dotenv";
import { expand } from "dotenv-expand";

expand(dotenv.config({ path: ".env.local" }));

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  console.error("DATABASE_URL is not set in .env.local");
  process.exit(1);
}

const sql = postgres(DATABASE_URL, {
  max: 1,
  connect_timeout: 30,
  idle_timeout: 30,
});

async function migrate() {
  console.log("🚀 Running new schema migration...");

  try {
    // 1. Add new columns to prd_sessions
    console.log("Adding columns to prd_sessions...");
    await sql`ALTER TABLE "prd_sessions" ADD COLUMN IF NOT EXISTS "tech_stack" jsonb`;
    await sql`ALTER TABLE "prd_sessions" ADD COLUMN IF NOT EXISTS "tech_stack_mode" text`;
    console.log("✅ prd_sessions updated");

    // 2. Create prd_features table
    console.log("Creating prd_features table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "prd_features" (
        "id" text PRIMARY KEY NOT NULL,
        "session_id" text NOT NULL REFERENCES "prd_sessions"("id") ON DELETE cascade,
        "name" text NOT NULL,
        "phase" text NOT NULL,
        "priority" text NOT NULL,
        "description" text NOT NULL,
        "goal" text NOT NULL,
        "done_when" jsonb NOT NULL,
        "sub_features" jsonb NOT NULL,
        "icon" text DEFAULT 'Layers',
        "status" text DEFAULT 'planned' NOT NULL,
        "order" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `;
    console.log("✅ prd_features created");

    // 3. Create prd_tasks table
    console.log("Creating prd_tasks table...");
    await sql`
      CREATE TABLE IF NOT EXISTS "prd_tasks" (
        "id" text PRIMARY KEY NOT NULL,
        "session_id" text NOT NULL REFERENCES "prd_sessions"("id") ON DELETE cascade,
        "feature_id" text NOT NULL REFERENCES "prd_features"("id") ON DELETE cascade,
        "feature_name" text NOT NULL,
        "title" text NOT NULL,
        "description" text NOT NULL,
        "status" text DEFAULT 'belum_mulai' NOT NULL,
        "priority" text DEFAULT 'utama' NOT NULL,
        "order" integer DEFAULT 0 NOT NULL,
        "created_at" timestamp with time zone DEFAULT now() NOT NULL,
        "updated_at" timestamp with time zone DEFAULT now() NOT NULL
      )
    `;
    console.log("✅ prd_tasks created");

    console.log("\n🎉 Migration completed successfully!");
  } catch (err) {
    console.error("❌ Migration failed:", err);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

migrate();
