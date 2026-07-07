import type { AIProvider } from "./provider";
import type { AgenticChatResult } from "../types";
import { AGENTIC_CHAT_SYSTEM_PROMPT } from "../prd-prompt";

// ============================================================
// Google Gemini Adapter — aktif saat AI_PROVIDER=gemini
// ============================================================

const geminiProvider: AIProvider = {
  async generatePRD(prompt: string, language: "id" | "en", complexity?: "simple" | "medium" | "complex"): Promise<string> {
    const { PRD_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: {
          parts: [{ text: PRD_SYSTEM_PROMPT(language, complexity) }],
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


  async agenticChat(
    currentPRD: string,
    messages: Array<{ role: string; content: string }>,
    language: "id" | "en"
  ): Promise<AgenticChatResult> {
    const systemPrompt = AGENTIC_CHAT_SYSTEM_PROMPT(language);
    const prdContext = `Current PRD:\n\n${currentPRD}`;
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;

    const contents = [
      { role: "user", parts: [{ text: prdContext }] },
      ...messages.map(m => ({
        role: m.role === "assistant" ? "model" : "user",
        parts: [{ text: m.content }],
      })),
    ];

    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        tools: [
          {
            function_declarations: [
              {
                name: "update_prd",
                description: "Revise the PRD document based on the user's request.",
                parameters: {
                  type: "object",
                  properties: {
                    revisionInstruction: {
                      type: "string",
                      description: "Detailed instruction describing exactly what to change.",
                    },
                    sectionsAffected: {
                      type: "array",
                      items: { type: "string" },
                      description: "List of section names affected. Example: ['Requirements', 'Core Features'].",
                    },
                    changeType: {
                      type: "string",
                      enum: ["normal", "destructive"],
                      description: "normal or destructive.",
                    },
                    revisionSummary: {
                      type: "string",
                      description: "Short summary in max 10 words.",
                    },
                  },
                  required: ["revisionInstruction", "sectionsAffected", "changeType", "revisionSummary"],
                },
              },
            ],
          },
        ],
        generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
      }),
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.statusText}`);
    }

    const data = await response.json();
    const parts = data.candidates?.[0]?.content?.parts || [];

    // Check for function call
    const funcCall = parts.find((p: any) => p.functionCall);
    const textPart = parts.find((p: any) => p.text);

    if (funcCall?.functionCall?.name === "update_prd") {
      return {
        type: "edit",
        message: textPart?.text || "",
        toolInput: funcCall.functionCall.args,
      };
    }

    return {
      type: "discussion",
      message: textPart?.text || "",
    };
  },

  async clarify(prompt: string, language: "id" | "en", techStack?: string): Promise<string> {
    const { CLARIFY_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const userContent = techStack
      ? `Product description:\n${prompt}\n\nTech stack already chosen by user:\n${techStack}`
      : prompt;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: CLARIFY_SYSTEM_PROMPT(language) }] },
        contents: [{ parts: [{ text: userContent }] }],
        generationConfig: { temperature: 0.1, maxOutputTokens: 1024 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },

  async generateText(systemPrompt: string, userContent: string): Promise<string> {
    const model = process.env.GEMINI_MODEL || "gemini-1.5-pro";
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${process.env.GEMINI_API_KEY}`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: userContent }] }],
        generationConfig: { temperature: 0.3, maxOutputTokens: 8192 },
      }),
    });
    if (!response.ok) throw new Error(`Gemini API error: ${response.statusText}`);
    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  },
};

export default geminiProvider;
