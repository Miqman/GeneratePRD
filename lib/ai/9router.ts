import type { AIProvider } from "./provider";
import type { AgenticChatResult } from "../types";
import { AGENTIC_CHAT_SYSTEM_PROMPT, AGENTIC_UPDATE_PRD_TOOL, parseAgenticResponse } from "../prd-prompt";

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
const TIMEOUT_MS = 120_000; // 120s —9router perlu waktu connect ke upstream model

async function fetchJSON(
  label: string,
  body: Record<string, unknown>
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

  try {
    const response = await fetch(`${BASE_URL}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(body),
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorBody = await response.text().catch(() => response.statusText);
      throw new Error(`[${response.status}]: ${errorBody}`);
    }

    return await response.json();
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      throw new Error(`9router ${label}: timeout after ${TIMEOUT_MS / 1000}s — upstream model unreachable`);
    }
    throw err instanceof Error
      ? new Error(`9router ${label}: ${err.message}`)
      : err;
  } finally {
    clearTimeout(timeoutId);
  }
}

function extractContent(data: Record<string, unknown>): string {
  const content =
    (data as any)?.choices?.[0]?.message?.content ??
    (data as any)?.choices?.[0]?.text ??
    (data as any)?.content ??
    (data as any)?.text;

  if (!content) {
    const finishReason = (data as any)?.choices?.[0]?.finish_reason ?? "unknown";
    console.error("[9router] Empty response. finish_reason:", finishReason);
    throw new Error(
      `9router: No content in AI response (finish_reason: ${finishReason}). The PRD may be too large for the model's context window.`
    );
  }

  return content as string;
}

const ninerouterProvider: AIProvider = {
  async generatePRD(prompt: string, language: "id" | "en", complexity?: "simple" | "medium" | "complex"): Promise<string> {
    const { PRD_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const data = await fetchJSON("generatePRD", {
      model: MODEL,
      messages: [
        { role: "system", content: PRD_SYSTEM_PROMPT(language, complexity) },
        { role: "user", content: prompt },
      ],
      temperature: 0.7,
      max_tokens: 8192,
      stream: false,
    });
    return extractContent(data);
  },

  async revisePRD(currentPRD: string, instruction: string, language: "id" | "en"): Promise<string> {
    const { REVISE_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const userContent = `PRD saat ini:\n\n${currentPRD}\n\n---\n\nInstruksi revisi: ${instruction}`;
    const data = await fetchJSON("revisePRD", {
      model: MODEL,
      messages: [
        { role: "system", content: REVISE_SYSTEM_PROMPT(language) },
        { role: "user", content: userContent },
      ],
      temperature: 0.7,
      max_tokens: 8192,
      stream: false,
    });
    return extractContent(data);
  },

  async agenticChat(
    currentPRD: string,
    messages: Array<{ role: string; content: string }>,
    language: "id" | "en"
  ): Promise<AgenticChatResult> {
    const systemPrompt = AGENTIC_CHAT_SYSTEM_PROMPT(language);
    const prdContext = `Current PRD:\n\n${currentPRD}`;
    const data = await fetchJSON("agenticChat", {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "system", content: prdContext },
        ...messages,
      ],
      tools: [AGENTIC_UPDATE_PRD_TOOL],
      tool_choice: "auto",
      temperature: 0.7,
      max_tokens: 2048,
      stream: false,
    });
    const parsed = parseAgenticResponse(data);

    if (parsed.type === "text") {
      return { type: "discussion", message: parsed.text };
    } else {
      return {
        type: "edit",
        message: parsed.confirmationText,
        toolInput: parsed.toolInput,
      };
    }
  },

  async clarify(prompt: string, language: "id" | "en", techStack?: string): Promise<string> {
    const { CLARIFY_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const userContent = techStack
      ? `Product description:\n${prompt}\n\nTech stack already chosen by user:\n${techStack}`
      : prompt;
    const data = await fetchJSON("clarify", {
      model: MODEL,
      messages: [
        { role: "system", content: CLARIFY_SYSTEM_PROMPT(language) },
        { role: "user", content: userContent },
      ],
      temperature: 0.1,
      max_tokens: 1024,
      stream: false,
    });
    return extractContent(data);
  },

  async generateText(systemPrompt: string, userContent: string): Promise<string> {
    const data = await fetchJSON("generateText", {
      model: MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userContent },
      ],
      temperature: 0.3,
      max_tokens: 8192,
      stream: false,
    });
    return extractContent(data);
  },
};

export default ninerouterProvider;
