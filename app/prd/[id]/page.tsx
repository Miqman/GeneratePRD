"use client";

import { useEffect, useState, useCallback, use, useRef } from "react";
import { useRouter } from "next/navigation";
import { Menu, Eye, Code2, Download, Copy, ChevronDown, Loader2, Check, MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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
import type { PRDSession, PRDVersion, ChatMessage } from "@/lib/types";
import { toast } from "sonner";
import Link from "next/link";
import { useSession } from "@/lib/auth-client";

type ViewMode = "preview" | "code";

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
  const [activeTab, setActiveTab] = useState<"document" | "chat">("document");
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

    // Optimistic: add user message to chat UI
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: id,
      role: "user",
      content: message,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    // Add to conversation history
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

      // Add assistant message to conversation history
      conversationHistoryRef.current = [
        ...conversationHistoryRef.current,
        { role: "assistant", content: data.message },
      ];

      if (data.type === "discussion") {
        // Show AI discussion in chat
        const assistantMsg: ChatMessage = {
          id: data.assistantMessageId || `assistant-${Date.now()}`,
          sessionId: id,
          role: "assistant",
          content: data.message,
          createdAt: new Date().toISOString(),
        };
        // Replace temp user msg ID with server ID, add assistant msg
        setChatMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          { ...tempUserMsg, id: `user-${Date.now()}` },
          assistantMsg,
        ]);
      } else if (data.type === "edit") {
        // Save previous version for undo
        previousPrdRef.current = currentVersion;

        // Update PRD immediately (optimistic)
        const newVersion: PRDVersion = {
          id: data.versionId,
          sessionId: id,
          versionNumber: data.versionNumber,
          content: data.updatedPrd,
          changeDescription: data.revisionSummary || "Revisi dari agentic chat",
          createdAt: new Date().toISOString(),
        };
        setCurrentVersion(newVersion);
        setSession((prev) =>
          prev
            ? { ...prev, versions: [newVersion, ...(prev.versions || [])] }
            : prev
        );

        // Show AI confirmation in chat
        const assistantMsg: ChatMessage = {
          id: data.assistantMessageId || `assistant-${Date.now()}`,
          sessionId: id,
          role: "assistant",
          content: data.message || `PRD diperbarui: ${data.revisionSummary}`,
          createdAt: new Date().toISOString(),
        };
        setChatMessages((prev) => [
          ...prev.filter((m) => m.id !== tempUserMsg.id),
          { ...tempUserMsg, id: `user-${Date.now()}` },
          assistantMsg,
        ]);

        // Show toast with undo
        const isDestructive = data.changeType === "destructive";
        const toastFn = isDestructive ? toast.warning : toast.success;
        toastFn(`PRD diperbarui: ${data.revisionSummary}`, {
          action: {
            label: "Undo",
            onClick: () => {
              if (previousPrdRef.current) {
                setCurrentVersion(previousPrdRef.current);
                toast.info("PRD dikembalikan ke versi sebelumnya");
                previousPrdRef.current = null;
              }
            },
          },
          duration: 8000,
        });
      }
    } catch {
      toast.error("Gagal memproses pesan. Silakan coba lagi.");
      // Remove temp user message
      setChatMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
      // Remove from conversation history
      conversationHistoryRef.current = conversationHistoryRef.current.slice(0, -1);
    } finally {
      setIsStreaming(false);
    }
  };

  const handleCopy = async () => {
    if (!currentVersion?.content) return;
    await navigator.clipboard.writeText(currentVersion.content);
    setCopied(true);
    toast.success("Markdown tersalin ke clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    if (!currentVersion?.content) return;
    const blob = new Blob([currentVersion.content], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const filename = (session?.title || "prd")
      .slice(0, 30)
      .replace(/[^a-zA-Z0-9\s]/g, "")
      .trim()
      .replace(/\s+/g, "-")
      .toLowerCase();
    a.download = `${filename}-v${currentVersion.versionNumber}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("File PRD berhasil diunduh!");
  };

  const versions = session?.versions || [];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Memuat PRD...</span>
        </div>
      </div>
    );
  }

  if (!session || !currentVersion) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground text-sm">PRD tidak ditemukan</p>
          <Link href="/">
            <Button variant="outline" size="sm">Kembali ke beranda</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Navbar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/60 bg-card/50 backdrop-blur-sm shrink-0 z-10">
        {/* Left: Burger + Logo */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Button
            id="sidebar-toggle"
            variant="ghost"
            size="sm"
            className="w-8 h-8 p-0 text-muted-foreground hover:text-foreground hover:bg-muted"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu className="w-4 h-4" />
          </Button>
          <Link href="/" className="flex items-center gap-1.5 shrink-0">
            <span className="font-extrabold text-foreground text-sm tracking-tight hidden sm:block">
              Rancang<span className="text-primary">.ai</span>
            </span>
          </Link>

          {/* Version Selector */}
          {versions.length > 0 && (
            <DropdownMenu>
              <DropdownMenuTrigger
                id="version-selector"
                className="inline-flex items-center gap-1.5 h-7 px-2.5 text-xs border border-border/60 bg-secondary/30 hover:bg-secondary text-foreground rounded-md transition-colors cursor-pointer"
              >
                <span className="text-muted-foreground">Version</span>
                {currentVersion.versionNumber}
                <ChevronDown className="w-3 h-3 text-muted-foreground" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="min-w-[200px]">
                {versions.map((v) => (
                  <DropdownMenuItem
                    key={v.id}
                    onClick={() => handleVersionSelect(v)}
                    className={`text-xs gap-2 ${currentVersion.id === v.id ? "text-primary" : ""}`}
                  >
                    <span className="font-medium shrink-0">v{v.versionNumber}</span>
                    <span className="text-muted-foreground truncate">
                      {v.changeDescription || "Versi awal"}
                    </span>
                    {currentVersion.id === v.id && (
                      <Check className="w-3 h-3 ml-auto shrink-0 text-primary" />
                    )}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>

        {/* Right: Action Icons */}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          {/* Preview toggle */}
          <Tooltip>
            <TooltipTrigger
              id="preview-btn"
              onClick={() => setViewMode(viewMode === "preview" ? "code" : "preview")}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${viewMode === "preview" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              {viewMode === "preview" ? <Eye className="w-4 h-4" /> : <Code2 className="w-4 h-4" />}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">
              {viewMode === "preview" ? "Lihat kode (Markdown)" : "Lihat preview"}
            </TooltipContent>
          </Tooltip>

          {/* Code view */}
          <Tooltip>
            <TooltipTrigger
              id="code-view-btn"
              onClick={() => setViewMode("code")}
              className={`w-8 h-8 hidden sm:flex items-center justify-center rounded-md transition-colors cursor-pointer ${viewMode === "code" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              <Code2 className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Lihat kode Markdown</TooltipContent>
          </Tooltip>

          {/* Download */}
          <Tooltip>
            <TooltipTrigger
              id="download-btn"
              onClick={handleDownload}
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Unduh sebagai .md</TooltipContent>
          </Tooltip>

          {/* Copy */}
          <Tooltip>
            <TooltipTrigger
              id="copy-btn"
              onClick={handleCopy}
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${copied ? "text-green-400 bg-green-400/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </TooltipTrigger>
            <TooltipContent side="bottom" className="text-xs">Salin Markdown</TooltipContent>
          </Tooltip>

          {/* User avatar */}
          {authSession?.user && (
            <div className="w-7 h-7 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-xs font-semibold ml-1">
              {(authSession.user.name || authSession.user.email || "U")[0].toUpperCase()}
            </div>
          )}
        </div>
      </header>

      {/* Mobile tabs for switching between Document and Chat */}
      <div className="flex md:hidden border-b border-border/60 bg-muted/10 shrink-0">
        <button
          onClick={() => setActiveTab("document")}
          className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === "document"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <Eye className="w-3.5 h-3.5" />
          Dokumen
        </button>
        <button
          onClick={() => setActiveTab("chat")}
          className={`flex-1 py-3 text-xs font-semibold border-b-2 transition-all flex items-center justify-center gap-2 ${
            activeTab === "chat"
              ? "border-primary text-primary bg-primary/5"
              : "border-transparent text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Diskusi
          {chatMessages.length > 0 && (
            <span className="ml-1 px-1.5 py-0.5 text-[9px] bg-primary text-primary-foreground rounded-full leading-none font-bold">
              {chatMessages.length}
            </span>
          )}
        </button>
      </div>

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Structure navigation */}
        <PRDStructurePanel
          content={currentVersion.content}
          activeSection={activeSection}
          onSectionClick={setActiveSection}
        />

        {/* CENTER: PRD Content */}
        <div className={`flex-1 min-h-0 ${activeTab === "document" ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
          <PRDContentPanel
            content={currentVersion.content}
            viewMode={viewMode}
            onSectionVisible={setActiveSection}
            isRevising={false}
          />
        </div>

        {/* RIGHT: Chat */}
        <div className={`flex-1 md:flex-none ${activeTab === "chat" ? "flex flex-col" : "hidden md:flex md:flex-col"}`}>
          <PRDChatPanel
            messages={chatMessages}
            onChat={handleChat}
            isStreaming={isStreaming}
          />
        </div>
      </div>
    </div>
  );
}
