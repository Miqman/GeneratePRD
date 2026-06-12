import type { AIProvider } from "./provider";

// ============================================================
// OpenAI Adapter — aktif saat AI_PROVIDER=openai
// ============================================================

const openaiProvider: AIProvider = {
  async generatePRD(prompt: string, language: "id" | "en"): Promise<string> {
    const { PRD_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: PRD_SYSTEM_PROMPT(language) },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  async revisePRD(
    currentPRD: string,
    instruction: string,
    language: "id" | "en"
  ): Promise<string> {
    const { REVISE_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: REVISE_SYSTEM_PROMPT(language) },
          {
            role: "user",
            content: `PRD saat ini:\n\n${currentPRD}\n\n---\n\nInstruksi revisi: ${instruction}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 4096,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },
  async clarify(prompt: string, language: "id" | "en"): Promise<string> {
    const { CLARIFY_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: CLARIFY_SYSTEM_PROMPT(language) },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 512,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content;
  },
};

export default openaiProvider;
