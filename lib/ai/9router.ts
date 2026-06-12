import type { AIProvider } from "./provider";

// ============================================================
// 9router Adapter — aktif saat AI_PROVIDER=9router
// 9router menggunakan OpenAI-compatible API dengan base URL custom.
// Set env vars:
//   NINEROUTER_BASE_URL   — misal: https://api.9router.com/v1
//   NINEROUTER_API_KEY    — API key dari 9router
//   NINEROUTER_MODEL      — model combo, misal: "combo-gpt4o-claude"
// ============================================================

const BASE_URL =
  process.env.NINEROUTER_BASE_URL || "https://api.9router.com/v1";
const API_KEY = process.env.NINEROUTER_API_KEY || "";
const MODEL = process.env.NINEROUTER_MODEL || "gpt-4o";

async function chatCompletion(
  systemPrompt: string,
  userContent: string,
  maxTokens = 4096
): Promise<string> {
  const response = await fetch(`${BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: maxTokens,
      stream: false, // paksa non-streaming agar response berupa JSON biasa
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => response.statusText);
    throw new Error(`9router API error [${response.status}]: ${errorBody}`);
  }

  const data = await response.json();

  // Support both OpenAI-style and possible custom response shapes
  const content =
    data?.choices?.[0]?.message?.content ??
    data?.content ??
    data?.text;

  if (!content) {
    throw new Error("9router: Tidak ada konten dalam respons AI.");
  }

  return content as string;
}

const ninerouterProvider: AIProvider = {
  async generatePRD(prompt: string, language: "id" | "en"): Promise<string> {
    const { PRD_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    // PRD lengkap butuh token besar — gunakan max yang didukung model
    return chatCompletion(PRD_SYSTEM_PROMPT(language), prompt, 8192);
  },

  async revisePRD(
    currentPRD: string,
    instruction: string,
    language: "id" | "en"
  ): Promise<string> {
    const { REVISE_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const userContent = `PRD saat ini:\n\n${currentPRD}\n\n---\n\nInstruksi revisi: ${instruction}`;
    // Revisi juga perlu token besar karena mengembalikan PRD lengkap
    return chatCompletion(REVISE_SYSTEM_PROMPT(language), userContent, 8192);
  },

  async clarify(prompt: string, language: "id" | "en"): Promise<string> {
    const { CLARIFY_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    // Use lower temperature for deterministic JSON output
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: CLARIFY_SYSTEM_PROMPT(language) },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 512,
        stream: false,
      }),
    });
    if (!response.ok) {
      const err = await response.text().catch(() => response.statusText);
      throw new Error(`9router clarify error [${response.status}]: ${err}`);
    }
    const data = await response.json();
    return (
      data?.choices?.[0]?.message?.content ?? data?.content ?? data?.text ?? "{}"
    );
  },
};

export default ninerouterProvider;
