"use client";

import { useState, useRef, useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Send, Loader2, Bot, User, MessageSquare } from "lucide-react";
import type { ChatMessage } from "@/lib/types";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface PRDChatPanelProps {
  messages: ChatMessage[];
  onRevise: (instruction: string) => void;
  isRevising: boolean;
}

const REVISION_SUGGESTIONS = [
  "Tambahkan detail database schema",
  "Perluas bagian user flow",
  "Tambahkan estimasi waktu development",
  "Perbaiki tech stack dengan lebih detail",
];

export function PRDChatPanel({
  messages,
  onRevise,
  isRevising,
}: PRDChatPanelProps) {
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isRevising]);

  const handleSend = () => {
    if (!input.trim() || isRevising) return;
    onRevise(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  const applySuggestion = (suggestion: string) => {
    setInput(suggestion);
    textareaRef.current?.focus();
  };

  return (
    <aside className="w-72 xl:w-80 shrink-0 border-l border-border/60 bg-card/20 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40 shrink-0">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-3.5 h-3.5 text-primary" />
          <h3 className="text-xs font-semibold text-foreground">Revisi PRD</h3>
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5">
          Instruksikan AI untuk merevisi bagian tertentu
        </p>
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto px-3 py-3 space-y-3"
      >
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-3 py-8">
            <div className="w-10 h-10 rounded-xl bg-muted/50 flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-muted-foreground/50" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-medium text-foreground">Belum ada revisi</p>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Minta AI untuk mengubah atau menambahkan konten PRD
              </p>
            </div>

            {/* Suggestions */}
            <div className="w-full mt-2 space-y-1.5">
              <p className="text-[10px] text-muted-foreground/60 text-left px-1">Coba ini:</p>
              {REVISION_SUGGESTIONS.map((s, i) => (
                <button
                  key={i}
                  onClick={() => applySuggestion(s)}
                  className="w-full text-left text-[11px] text-muted-foreground bg-muted/30 hover:bg-muted/60 border border-border/50 hover:border-border rounded-lg px-3 py-2 transition-all"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`flex gap-2 animate-fade-in-up ${
                  msg.role === "user" ? "flex-row-reverse" : "flex-row"
                }`}
              >
                {/* Avatar */}
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${
                    msg.role === "user"
                      ? "bg-primary/20 border border-primary/30"
                      : "bg-muted border border-border"
                  }`}
                >
                  {msg.role === "user" ? (
                    <User className="w-3 h-3 text-primary" />
                  ) : (
                    <Bot className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>

                {/* Bubble */}
                <div
                  className={`max-w-[85%] rounded-xl px-3 py-2 text-[11px] leading-relaxed ${
                    msg.role === "user"
                      ? "bg-primary/15 border border-primary/25 text-foreground"
                      : "bg-muted/50 border border-border/50 text-muted-foreground"
                  }`}
                >
                  {msg.role === "assistant" ? (
                    <div className="prose prose-xs prose-invert max-w-none [&>*]:text-[11px] [&>*]:text-muted-foreground [&_strong]:text-foreground">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  ) : (
                    msg.content
                  )}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {isRevising && (
              <div className="flex gap-2 animate-fade-in-up">
                <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center shrink-0">
                  <Bot className="w-3 h-3 text-muted-foreground" />
                </div>
                <div className="bg-muted/50 border border-border/50 rounded-xl px-3 py-2.5 flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-typing-dot" />
                  <span className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-typing-dot" />
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border/40 shrink-0 space-y-2">
        {messages.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {REVISION_SUGGESTIONS.slice(0, 2).map((s, i) => (
              <button
                key={i}
                onClick={() => applySuggestion(s)}
                className="text-[10px] text-muted-foreground/70 bg-muted/30 hover:bg-muted/60 border border-border/40 rounded-md px-2 py-1 transition-all"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div className="flex gap-2 items-end">
          <Textarea
            ref={textareaRef}
            id="revision-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Instruksikan revisi... (Ctrl+Enter untuk kirim)"
            className="min-h-[60px] max-h-[120px] resize-none text-[11px] bg-muted/30 border-border/50 focus:border-primary/40 placeholder:text-muted-foreground/50 rounded-xl"
            disabled={isRevising}
          />
          <Button
            id="send-revision-btn"
            size="sm"
            onClick={handleSend}
            disabled={!input.trim() || isRevising}
            className="w-8 h-8 p-0 shrink-0 bg-primary hover:bg-primary/90 disabled:opacity-30 rounded-lg"
          >
            {isRevising ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <Send className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
        <p className="text-[10px] text-muted-foreground/40 text-right">
          Ctrl+Enter untuk kirim
        </p>
      </div>
    </aside>
  );
}
