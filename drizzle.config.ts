import { defineConfig } from "drizzle-kit";
import { config } from "dotenv";
import { expand } from "dotenv-expand";

// drizzle-kit tidak membaca .env.local secara otomatis (itu khusus Next.js)
// Jadi kita load manual di sini
expand(config({ path: ".env.local" }));

export default defineConfig({
  schema: "./lib/db/schema.ts",
  out: "./drizzle/migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  verbose: true,
  strict: true,
});
