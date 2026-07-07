// ============================================================
// AI Provider Interface
// ============================================================

import type { AgenticChatResult } from "../types";

export interface AIProvider {
  generatePRD(prompt: string, language: "id" | "en", complexity?: "simple" | "medium" | "complex"): Promise<string>;
  revisePRD(currentPRD: string, instruction: string, language: "id" | "en"): Promise<string>;
  /** Agentic chat with tool calling — can discuss or directly edit PRD. */
  agenticChat(
    currentPRD: string,
    messages: Array<{ role: string; content: string }>,
    language: "id" | "en"
  ): Promise<AgenticChatResult>;
  /** Evaluate if a prompt needs clarification. Returns raw JSON string from the model. */
  clarify(prompt: string, language: "id" | "en", techStack?: string): Promise<string>;
  /** Generic text generation with a system prompt and user content. Returns raw string from model. */
  generateText(systemPrompt: string, userContent: string): Promise<string>;
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
