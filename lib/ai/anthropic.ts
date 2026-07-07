import type { AIProvider } from "./provider";
import type { AgenticChatResult } from "../types";
import { AGENTIC_CHAT_SYSTEM_PROMPT } from "../prd-prompt";

// ============================================================
// Anthropic Claude Adapter — aktif saat AI_PROVIDER=anthropic
// ============================================================

const anthropicProvider: AIProvider = {
  async generatePRD(prompt: string, language: "id" | "en", complexity?: "simple" | "medium" | "complex"): Promise<string> {
    const { PRD_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        system: PRD_SYSTEM_PROMPT(language, complexity),
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  },

  async revisePRD(
    currentPRD: string,
    instruction: string,
    language: "id" | "en"
  ): Promise<string> {
    const { REVISE_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        system: REVISE_SYSTEM_PROMPT(language),
        messages: [
          {
            role: "user",
            content: `PRD saat ini:\n\n${currentPRD}\n\n---\n\nInstruksi revisi: ${instruction}`,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.content[0].text;
  },


  async agenticChat(
    currentPRD: string,
    messages: Array<{ role: string; content: string }>,
    language: "id" | "en"
  ): Promise<AgenticChatResult> {
    // Anthropic tool use format
    const systemPrompt = AGENTIC_CHAT_SYSTEM_PROMPT(language);
    const prdContext = `Current PRD:\n\n${currentPRD}`;
    const fullMessages = [
      { role: "user", content: prdContext },
      ...messages.map(m => ({
        role: m.role === "system" ? "user" : m.role,
        content: m.content,
      })),
    ];

    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 2048,
        system: systemPrompt,
        messages: fullMessages,
        tools: [
          {
            name: "update_prd",
            description: "Revise the PRD document based on the user's request. Call this whenever the user wants to change, add, remove, or update any part of the PRD.",
            input_schema: {
              type: "object",
              properties: {
                revisionInstruction: {
                  type: "string",
                  description: "Detailed instruction describing exactly what to change in the PRD.",
                },
                sectionsAffected: {
                  type: "array",
                  items: { type: "string" },
                  description: "List of section names affected. Example: ['Requirements', 'Core Features'].",
                },
                changeType: {
                  type: "string",
                  enum: ["normal", "destructive"],
                  description: "normal = small changes. destructive = removes section, changes scope.",
                },
                revisionSummary: {
                  type: "string",
                  description: "Short summary of the change in max 10 words.",
                },
              },
              required: ["revisionInstruction", "sectionsAffected", "changeType", "revisionSummary"],
            },
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.statusText}`);
    }

    const data = await response.json();
    const content = data.content || [];

    // Check for tool use
    const toolUse = content.find((b: any) => b.type === "tool_use");
    const textBlock = content.find((b: any) => b.type === "text");

    if (toolUse) {
      return {
        type: "edit",
        message: textBlock?.text || "",
        toolInput: toolUse.input,
      };
    }

    return {
      type: "discussion",
      message: textBlock?.text || "",
    };
  },

  async clarify(prompt: string, language: "id" | "en", techStack?: string): Promise<string> {
    const { CLARIFY_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const userContent = techStack
      ? `Product description:\n${prompt}\n\nTech stack already chosen by user:\n${techStack}`
      : prompt;
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 1024,
        system: CLARIFY_SYSTEM_PROMPT(language),
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);
    const data = await response.json();
    return data.content[0].text;
  },

  async generateText(systemPrompt: string, userContent: string): Promise<string> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": process.env.ANTHROPIC_API_KEY!,
        "anthropic-version": "2023-06-01",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.ANTHROPIC_MODEL || "claude-3-5-sonnet-20241022",
        max_tokens: 8192,
        system: systemPrompt,
        messages: [{ role: "user", content: userContent }],
      }),
    });
    if (!response.ok) throw new Error(`Anthropic API error: ${response.statusText}`);
    const data = await response.json();
    return data.content[0].text;
  },
};

export default anthropicProvider;
