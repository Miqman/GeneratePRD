#!/usr/bin/env node

/**
 * Seed script — creates the demo account via the API route.
 *
 * Prerequisite: dev server must be running (npm run dev).
 *
 * Usage:
 *   node scripts/seed-demo.mjs
 */

const BASE_URL = process.env.BASE_URL || "http://localhost:3000";

async function main() {
  const email = "demo@prdforge.ai";
  const password = "password123";

  console.log("🚀  Creating demo account…");
  console.log(`   Email:    ${email}`);
  console.log(`   Password: ${password}`);
  console.log();

  try {
    const res = await fetch(`${BASE_URL}/api/seed`, { method: "POST" });
    const data = await res.json();

    if (res.ok) {
      console.log(`✅  ${data.message}`);
      if (data.user) console.log(`   ID: ${data.user.id}`);
    } else {
      console.error("❌ ", data.error || res.statusText);
      process.exit(1);
    }
  } catch (err) {
    console.error("❌  Cannot reach the dev server.");
    console.error("   Make sure `npm run dev` is running on http://localhost:3000");
    console.error();
    console.error("   Then run:  node scripts/seed-demo.mjs");
    process.exit(1);
  }
}

main();
