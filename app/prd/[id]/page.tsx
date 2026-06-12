"use client";

import { useEffect, useState, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { FileText, Menu, Eye, Code2, Download, Copy, ChevronDown, Loader2, Check } from "lucide-react";
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
  const [isRevising, setIsRevising] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");

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
        (s.messages || []).slice().reverse()
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

  const handleRevise = async (instruction: string) => {
    if (!instruction.trim() || isRevising) return;
    setIsRevising(true);

    // Optimistic: add user message
    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId: id,
      role: "user",
      content: instruction,
      createdAt: new Date().toISOString(),
    };
    setChatMessages((prev) => [...prev, tempUserMsg]);

    try {
      const res = await fetch(`/api/prd/${id}/revise`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });

      if (!res.ok) throw new Error("Revisi gagal");
      const data = await res.json();

      const newVersion: PRDVersion = {
        id: data.versionId,
        sessionId: id,
        versionNumber: data.versionNumber,
        content: data.content,
        changeDescription: instruction.slice(0, 100),
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

      // Add AI response message
      const aiMsg: ChatMessage = {
        id: `ai-${Date.now()}`,
        sessionId: id,
        role: "assistant",
        content: `PRD diperbarui ke **Version ${data.versionNumber}**. Perubahan diterapkan sesuai instruksimu.`,
        createdAt: new Date().toISOString(),
      };
      setChatMessages((prev) => [...prev, aiMsg]);
      toast.success(`PRD diperbarui ke Version ${data.versionNumber}`);
    } catch {
      toast.error("Gagal merevisi PRD. Silakan coba lagi.");
      setChatMessages((prev) => prev.filter((m) => m.id !== tempUserMsg.id));
    } finally {
      setIsRevising(false);
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
              prd<span className="text-primary">forge</span>.ai
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
              className={`w-8 h-8 flex items-center justify-center rounded-md transition-colors cursor-pointer ${viewMode === "code" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"}`}
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

      {/* Three-panel layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT: Structure navigation */}
        <PRDStructurePanel
          content={currentVersion.content}
          activeSection={activeSection}
          onSectionClick={setActiveSection}
        />

        {/* CENTER: PRD Content */}
        <PRDContentPanel
          content={currentVersion.content}
          viewMode={viewMode}
          onSectionVisible={setActiveSection}
          isRevising={isRevising}
        />

        {/* RIGHT: Chat revision */}
        <PRDChatPanel
          messages={chatMessages}
          onRevise={handleRevise}
          isRevising={isRevising}
        />
      </div>
    </div>
  );
}
