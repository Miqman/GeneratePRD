import { getAIProvider } from "../lib/ai/provider.js";
import * as dotenv from "dotenv";
import { expand } from "dotenv-expand";

expand(dotenv.config({ path: ".env.local" }));

async function testPrompt(prompt) {
  try {
    const aiProvider = await getAIProvider();
    console.log(`\n--- Testing Prompt: "${prompt}" ---`);
    const result = await aiProvider.clarify(prompt, "id");
    console.log("Raw output:");
    console.log(result);
    // Try parsing
    const cleaned = result
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();
    const parsed = JSON.parse(cleaned);
    console.log("Parsed successfully!");
  } catch (err) {
    console.error("Test failed for prompt:", prompt, err);
  }
}

async function run() {
  await testPrompt("Aplikasi resep makanan sehat");
  await testPrompt("Sistem manajemen karyawan untuk kantor cabang");
}

run();
