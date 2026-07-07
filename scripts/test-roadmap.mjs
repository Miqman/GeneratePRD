import { getAIProvider } from "../lib/ai/provider.js";
import { ROADMAP_PROMPT } from "../lib/prd-prompt.js";
import * as dotenv from "dotenv";
import { expand } from "dotenv-expand";

expand(dotenv.config({ path: ".env.local" }));

const mockPRD = `
# PRD — Aplikasi Booking Lapangan

## 1. Overview
Aplikasi ini adalah platform pemesanan lapangan yang dirancang untuk mengatasi proses manual. Pelanggan kesulitan melihat ketersediaan lapangan secara real-time. Aplikasi ini akan menghemat waktu dengan fitur utama pengecekan jadwal dan pemesanan cepat.

## 2. Requirements
* **Akses Real-time:** Pelanggan dapat melihat ketersediaan slot secara real-time.
* **Notifikasi WhatsApp:** Pengguna menerima konfirmasi pesanan via WhatsApp.

## 3. Core Features
### Fase 1: Booking Lapangan [High]
Memungkinkan pengguna memilih slot dan memesan lapangan secara langsung.
* **Peta Lapangan:** Tampilan visual letak lapangan.
* **Pemesanan Instan:** Pengguna dapat membayar langsung dan mendapat konfirmasi.
`;

async function run() {
  try {
    const aiProvider = await getAIProvider();
    console.log("Calling AI Provider to generate roadmap...");
    const rawResult = await aiProvider.generateText(
      ROADMAP_PROMPT("id"),
      `PRD Content:\n\n${mockPRD}`
    );
    console.log("\n--- Raw Result from AI ---");
    console.log(rawResult);
    console.log("-------------------------\n");

    const cleaned = rawResult
      .trim()
      .replace(/^```json\s*/i, "")
      .replace(/\s*```$/i, "")
      .trim();

    const parsed = JSON.parse(cleaned);
    console.log("✅ Parsed successfully! Result is an array with", parsed.length, "features.");
  } catch (err) {
    console.error("❌ Test failed:", err);
  }
}

run();
