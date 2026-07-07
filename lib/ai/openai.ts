import type { AIProvider } from "./provider";
import { truncatePRDForChat } from "./provider";
import type { AgenticChatResult } from "../types";
import { AGENTIC_CHAT_SYSTEM_PROMPT, AGENTIC_UPDATE_PRD_TOOL, parseAgenticResponse } from "../prd-prompt";

/** Parse OpenAI-compatible SSE stream and yield text deltas */
async function* parseOpenAISSE(response: Response): AsyncGenerator<string> {
  const reader = response.body!.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });

    const lines = buffer.split("\n");
    buffer = lines.pop() || ""; // keep incomplete line

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || !trimmed.startsWith("data: ")) continue;
      const payload = trimmed.slice(6);
      if (payload === "[DONE]") return;
      try {
        const parsed = JSON.parse(payload);
        const delta = parsed.choices?.[0]?.delta?.content;
        if (delta) yield delta;
      } catch {
        // skip malformed lines
      }
    }
  }
}

/** Create a ReadableStream from an OpenAI-compatible streaming response */
function openAIStreamToReadable(response: Response): ReadableStream<string> {
  const gen = parseOpenAISSE(response);
  return new ReadableStream<string>({
    async pull(controller) {
      const { value, done } = await gen.next();
      if (done) controller.close();
      else controller.enqueue(value);
    },
  });
}

// ============================================================
// OpenAI Adapter — aktif saat AI_PROVIDER=openai
// ============================================================

const openaiProvider: AIProvider = {
  async generatePRD(prompt: string, language: "id" | "en", complexity?: "simple" | "medium" | "complex"): Promise<string> {
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
          { role: "system", content: PRD_SYSTEM_PROMPT(language, complexity) },
          { role: "user", content: prompt },
        ],
        temperature: 0.7,
        max_tokens: 8192,
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
        max_tokens: 8192,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  async chatPRD(
    currentPRD: string,
    message: string,
    language: "id" | "en"
  ): Promise<string> {
    const { CHAT_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const truncatedPRD = truncatePRDForChat(currentPRD);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT(language) },
          {
            role: "user",
            content: `Current PRD:\n\n${truncatedPRD}\n\n---\n\nUser message: ${message}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
    return data.choices[0].message.content;
  },

  async chatPRDStream(
    currentPRD: string,
    message: string,
    language: "id" | "en"
  ): Promise<ReadableStream<string>> {
    const { CHAT_SYSTEM_PROMPT } = await import("@/lib/prd-prompt");
    const truncatedPRD = truncatePRDForChat(currentPRD);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: CHAT_SYSTEM_PROMPT(language) },
          {
            role: "user",
            content: `Current PRD:\n\n${truncatedPRD}\n\n---\n\nUser message: ${message}`,
          },
        ],
        temperature: 0.7,
        max_tokens: 1024,
        stream: true,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    return openAIStreamToReadable(response);
  },

  async agenticChat(
    currentPRD: string,
    messages: Array<{ role: string; content: string }>,
    language: "id" | "en"
  ): Promise<AgenticChatResult> {
    const systemPrompt = AGENTIC_CHAT_SYSTEM_PROMPT(language);
    const prdContext = `Current PRD:\n\n${currentPRD}`;
    const fullMessages = [
      { role: "system", content: systemPrompt },
      { role: "system", content: prdContext },
      ...messages,
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: fullMessages,
        tools: [AGENTIC_UPDATE_PRD_TOOL],
        tool_choice: "auto",
        temperature: 0.7,
        max_tokens: 2048,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.statusText}`);
    }

    const data = await response.json();
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
          { role: "user", content: userContent },
        ],
        temperature: 0.1,
        max_tokens: 1024,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content;
  },

  async generateText(systemPrompt: string, userContent: string): Promise<string> {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: process.env.OPENAI_MODEL || "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userContent },
        ],
        temperature: 0.3,
        max_tokens: 8192,
      }),
    });
    if (!response.ok) throw new Error(`OpenAI API error: ${response.statusText}`);
    const data = await response.json();
    return data.choices[0].message.content;
  },
};

export default openaiProvider;
