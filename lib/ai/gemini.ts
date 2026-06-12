import type { AIProvider } from "./provider";
import { truncatePRDForChat } from "./provider";

// ============================================================
// Google Gemini Adapter — aktif saat AI_PROVIDER=gemini
// ============================================================

const geminiProvider: AIProvider = {
  async generatePRD(prompt: string, language: "id" | "en"): Promise<string> {
    const { PRD_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: PRD_SYSTEM_PROMPT(language) }],
        },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.7,
          maxOutputTokens: 8192,
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },

  async revisePRD(
    currentPRD: string,
    instruction: string,
    language: "id" | "en"
  ): Promise<string> {
    const { REVISE_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: REVISE_SYSTEM_PROMPT(language) }],
        },
        contents: [
          {
            parts: [
              {
                text: `PRD saat ini:\n\n${currentPRD}\n\n---\n\nInstruksi revisi: ${instruction}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },

  async chatPRD(
    currentPRD: string,
    message: string,
    language: "id" | "en"
  ): Promise<string> {
    const { CHAT_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const truncatedPRD = truncatePRDForChat(currentPRD);
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: CHAT_SYSTEM_PROMPT(language) }],
        },
        contents: [
          {
            parts: [
              {
                text: `Current PRD:\n\n${truncatedPRD}\n\n---\n\nUser message: ${message}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },

  async chatPRDStream(
    currentPRD: string,
    message: string,
    language: "id" | "en"
  ): Promise<ReadableStream<string>> {
    const { CHAT_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const truncatedPRD = truncatePRDForChat(currentPRD);
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:streamGenerateContent?alt=sse&key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: CHAT_SYSTEM_PROMPT(language) }],
        },
        contents: [
          {
            parts: [
              {
                text: `Current PRD:\n\n${truncatedPRD}\n\n---\n\nUser message: ${message}`,
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 1024 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    // Parse Gemini SSE stream (data: {candidates:[{content:{parts:[{text}]}}]})
    const reader = response.body!.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    return new ReadableStream<string>({
      async pull(controller) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) { controller.close(); return; }
          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";
          for (const line of lines) {
            const t = line.trim();
            if (!t.startsWith("data: ")) continue;
            try {
              const p = JSON.parse(t.slice(6));
              const text = p.candidates?.[0]?.content?.parts?.[0]?.text;
              if (text) { controller.enqueue(text); return; }
            } catch { /* skip */ }
          }
        }
      },
    });
  },

  async clarify(prompt: string, language: "id" | "en"): Promise<string> {
    const { CLARIFY_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: CLARIFY_SYSTEM_PROMPT(language) }] },
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 512 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },
};

export default geminiProvider;
