"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Menu, Eye, Code2, Copy, Check, MessageSquare,
  Map, ListTodo, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";
import { PRDStructurePanel } from "@/components/prd/PRDStructurePanel";
import { PRDContentPanel } from "@/components/prd/PRDContentPanel";
import { PRDChatPanel } from "@/components/prd/PRDChatPanel";
import { RoadmapTab } from "@/components/prd/RoadmapTab";
import { TaskBoard } from "@/components/prd/TaskBoard";
import { ImplementasiDropdown } from "@/components/prd/ImplementasiDropdown";
import { ForkButton } from "@/components/prd/ForkButton";
import type { PRDSession, PRDVersion, ChatMessage } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

type ViewMode = "preview" | "code";
type MainTab = "prd" | "roadmap" | "task" | "chat";

export default function PRDEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const { data: authSession } = useSession();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [session, setSession] = useState<PRDSession | null>(null);
  const [currentVersion, setCurrentVersion] = useState<PRDVersion | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isStreaming, setIsStreaming] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const [mainTab, setMainTab] = useState<MainTab>("prd");
  const previousPrdRef = useRef<PRDVersion | null>(null);
  const conversationHistoryRef = useRef<Array<{ role: string; content: string }>>([]);

  const loadSession = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/prd/${id}`);
      if (!res.ok) {
        if (res.status === 401) router.push("/login");
        else router.push("/");
        return;
      }
      const data = await res.json();
      const s: PRDSession = data.session;
      setSession(s);
      setCurrentVersion(s.versions?.[0] || null);
      setChatMessages(
        (s.messages || []).slice().reverse().map((m: ChatMessage & { metadata?: { action?: string; revisionProposal?: { instruction: string; summary: string }; revisionApplied?: boolean } }) => ({
          ...m,
          revisionProposal: m.metadata?.revisionProposal || undefined,
          revisionApplied: m.metadata?.revisionApplied || false,
        }))
      );
    } catch {
      router.push("/");
    } finally {
      setIsLoading(false);
    }
  }, [id, router]);

  useEffect(() => {
    loadSession();
  }, [loadSession]);

  const handleVersionSelect = (version: PRDVersion) => {
    setCurrentVersion(version);
  };

  const handleChat = async (message: string) => {
    if (!message.trim() || isStreaming || !currentVersion) return;
    setIsStreaming(true);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: id,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    conversationHistoryRef.current = [
      ...conversationHistoryRef.current,
      { role: "user", content: message },
    ];

    try {
      const res = await fetch("/api/agentic-chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: id,
          messages: conversationHistoryRef.current,
          currentPrd: currentVersion.content,
          language: session?.language || "id",
        }),
      });

      if (!res.ok) throw new Error("Agentic chat failed");
      const data = await res.json();

      conversationHistoryRef.current = [
        ...conversationHistoryRef.current,
        { role: "assistant", content: data.message },
      ];

      if (data.type === "discussion") {
        const assistantMsg: ChatMessage = {
          id: `assist-${Date.now()}`,
          sessionId: id,
          role: "assistant",
          content: data.message,
          createdAt: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, assistantMsg]);
      } else if (data.type === "edit") {
        if (data.updatedPrd && data.updatedPrd !== currentVersion.content) {
          previousPrdRef.current = currentVersion;
        }

        if (data.updatedPrd) {
          const newVersion: PRDVersion = {
            id: data.versionId || `local-${Date.now()}`,
            sessionId: id,
            versionNumber: (currentVersion?.versionNumber || 0) + 1,
            content: data.updatedPrd,
            changeDescription: data.revisionSummary || "Chat revision",
            createdAt: new Date().toISOString(),
          };
          setCurrentVersion(newVersion);
          setSession((prev) =>
            prev
              ? {
                  ...prev,
                  versions: [newVersion, ...(prev.versions || [])],
                }
              : prev
          );
        }

        const editMsg: ChatMessage = {
          id: `edit-${Date.now()}`,
          sessionId: id,
          role: "assistant",
          content: data.message || "PRD telah diperbarui.",
          createdAt: new Date().toISOString(),
        };
        setChatMessages((prev) => [...prev, editMsg]);

        if (data.changeType === "destructive") {
          toast.warning("Perubahan besar diterapkan ke PRD");
        } else {
          toast.success("PRD berhasil diperbarui");
        }
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `err-${Date.now()}`,
        sessionId: id,
        role: "assistant",
        content: "Maaf, terjadi kesalahan saat memproses permintaan Anda.",
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopyMarkdown = async () => {
    if (!currentVersion?.content) return;
    try {
      await navigator.clipboard.writeText(currentVersion.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Gagal menyalin teks");
    }
  };

  const TAB_CONFIG: { key: MainTab; label: string; icon: React.ElementType }[] = [
    { key: "prd", label: "PRD", icon: FileText },
    { key: "roadmap", label: "Roadmap", icon: Map },
    { key: "task", label: "Task", icon: ListTodo },
    { key: "chat", label: "Chat", icon: MessageSquare },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
          <p className="text-sm text-text-secondary">Memuat PRD...</p>
        </div>
      </div>
    );
  }

  if (!session) return null;

  const prdContent = currentVersion?.content || "";
  const language = (session.language as "id" | "en") || "id";
  const displayTitle =
    session.title.length > 40
      ? session.title.slice(0, 40) + "…"
      : session.title;

  return (
    <div className="h-screen bg-background text-text-primary flex flex-col font-body-md overflow-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* ─── Navbar ─── */}
      <header className="flex items-center justify-between px-4 h-14 border-b border-border-subtle shrink-0 gap-3 z-40 relative bg-background">
        {/* Left */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-foreground hover:bg-surface-container-high transition-colors cursor-pointer shrink-0"
          >
            <Menu className="w-4 h-4" />
          </button>
          <Link href="/" className="text-sm font-extrabold text-on-surface tracking-tight shrink-0">
            Rancang<span className="text-primary">.ai</span>
          </Link>
          <span className="text-border-subtle hidden sm:block">·</span>
          <span className="text-sm text-text-secondary truncate hidden sm:block max-w-[200px]">
            {displayTitle}
          </span>
          {/* Version badge */}
          {session.versions && session.versions.length > 0 && (
            <span className="text-xs bg-surface-container border border-border-subtle text-text-secondary px-2 py-0.5 rounded-full shrink-0 hidden md:block">
              v{currentVersion?.versionNumber || 1}
            </span>
          )}
        </div>

        {/* Right */}
        <div className="flex items-center gap-2 shrink-0">
          <ThemeToggle />
          <ForkButton sessionId={id} />
          <ImplementasiDropdown
            sessionId={id}
            prdContent={prdContent}
            title={session.title}
            language={language}
          />
        </div>
      </header>

      {/* ─── Tab Bar ─── */}
      <div className="flex items-center gap-1 px-4 border-b border-border-subtle shrink-0 bg-background z-30">
        {TAB_CONFIG.map(({ key, label, icon: Icon }) => (
          <button
            key={key}
            id={`tab-${key}`}
            onClick={() => setMainTab(key)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all cursor-pointer -mb-px ${
              mainTab === key
                ? "border-primary text-primary"
                : "border-transparent text-text-secondary hover:text-on-surface hover:border-border-subtle"
            }`}
          >
            <Icon className="w-4 h-4" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Tab Content ─── */}
      <div className="flex-1 flex overflow-hidden min-h-0">

        {/* PRD Tab */}
        {mainTab === "prd" && (
          <>
            {/* Structure Panel */}
            <div className="w-56 shrink-0 border-r border-border-subtle hidden lg:flex flex-col overflow-hidden">
              <PRDStructurePanel
                content={prdContent}
                activeSection={activeSection}
                onSectionClick={setActiveSection}
              />
            </div>

            {/* Content Panel */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
              {/* Toolbar */}
              <div className="flex items-center justify-between px-4 py-2 border-b border-border-subtle shrink-0">
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setViewMode("preview")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      viewMode === "preview"
                        ? "bg-surface-container text-on-surface"
                        : "text-text-secondary hover:text-on-surface"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                    Preview
                  </button>
                  <button
                    onClick={() => setViewMode("code")}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-colors cursor-pointer ${
                      viewMode === "code"
                        ? "bg-surface-container text-on-surface"
                        : "text-text-secondary hover:text-on-surface"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                    Markdown
                  </button>
                </div>

                <Tooltip>
                  <TooltipTrigger
                    render={
                      <button
                        onClick={handleCopyMarkdown}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium text-text-secondary hover:text-on-surface transition-colors cursor-pointer"
                      >
                        {copied ? <Check className="w-3.5 h-3.5 text-primary" /> : <Copy className="w-3.5 h-3.5" />}
                        {copied ? "Tersalin" : "Salin"}
                      </button>
                    }
                  />
                  <TooltipContent>Salin sebagai Markdown</TooltipContent>
                </Tooltip>
              </div>

              <PRDContentPanel
                content={prdContent}
                viewMode={viewMode}
                onSectionVisible={setActiveSection}
                isRevising={isStreaming}
              />
            </div>
          </>
        )}

        {/* Roadmap Tab */}
        {mainTab === "roadmap" && (
          <RoadmapTab sessionId={id} />
        )}

        {/* Task Tab */}
        {mainTab === "task" && (
          <TaskBoard sessionId={id} />
        )}

        {/* Chat Tab */}
        {mainTab === "chat" && (
          <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
            <PRDChatPanel
              messages={chatMessages}
              onChat={handleChat}
              isStreaming={isStreaming}
            />
          </div>
        )}
      </div>
    </div>
  );
}
