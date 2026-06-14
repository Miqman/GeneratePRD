// ============================================================
// AI Provider Interface
// ============================================================

import type { AgenticChatResult } from "../types";

export interface AIProvider {
  generatePRD(prompt: string, language: "id" | "en", complexity?: "simple" | "medium" | "complex"): Promise<string>;
  revisePRD(currentPRD: string, instruction: string, language: "id" | "en"): Promise<string>;
  /** Chat about the PRD with intent detection. Returns raw JSON string from the model. */
  chatPRD(currentPRD: string, message: string, language: "id" | "en"): Promise<string>;
  /** Streaming chat about the PRD. Returns ReadableStream that yields SSE events. */
  chatPRDStream(
    currentPRD: string,
    message: string,
    language: "id" | "en"
  ): Promise<ReadableStream<string>>;
  /** Agentic chat with tool calling — can discuss or directly edit PRD. */
  agenticChat(
    currentPRD: string,
    messages: Array<{ role: string; content: string }>,
    language: "id" | "en"
  ): Promise<AgenticChatResult>;
  /** Evaluate if a prompt needs clarification. Returns raw JSON string from the model. */
  clarify(prompt: string, language: "id" | "en"): Promise<string>;
}

// Factory: pilih provider berdasarkan env var AI_PROVIDER
export async function getAIProvider(): Promise<AIProvider> {
  const provider = process.env.AI_PROVIDER || "mock";

  switch (provider) {
    case "openai":
      return (await import("./openai")).default;
    case "anthropic":
      return (await import("./anthropic")).default;
    case "gemini":
      return (await import("./gemini")).default;
    case "9router":
      return (await import("./9router")).default;
    case "mock":
    default:
      return (await import("./mock")).default;
  }
}

/**
 * Truncate PRD content for chat to avoid exceeding model context windows.
 * Keeps the first ~6000 chars (~1500 tokens) which covers the overview and key sections.
 */
export function truncatePRDForChat(prd: string, maxChars = 6000): string {
  if (prd.length <= maxChars) return prd;
  return prd.slice(0, maxChars) + "\n\n... [PRD truncated for brevity] ...";
}

/**
 * Parse chat JSON response with robust fallback extraction.
 * Handles: plain JSON, code fences, surrounding text.
 */
export function parseChatResponse(raw: string): {
  action: string;
  response: string;
  revisionInstruction?: string;
  revisionSummary?: string;
} {
  const fallback = { action: "discussion" as const, response: raw };

  // 1. Try direct parse (after trim)
  const trimmed = raw.trim();
  try {
    return JSON.parse(trimmed);
  } catch {
    // continue
  }

  // 2. Strip code fences: ```json ... ``` or ``` ... ```
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1].trim());
    } catch {
      // continue
    }
  }

  // 3. Extract first balanced JSON object
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch {
      // continue
    }
  }

  return fallback;
}
