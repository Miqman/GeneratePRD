// ============================================================
// AI Provider Interface
// ============================================================

export interface AIProvider {
  generatePRD(prompt: string, language: "id" | "en"): Promise<string>;
  revisePRD(currentPRD: string, instruction: string, language: "id" | "en"): Promise<string>;
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
