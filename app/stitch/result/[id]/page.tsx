"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import {
  ArrowLeft,
  Copy,
  Download,
  Check,
  Code2,
  Eye,
  Wand2,
  FileCode2,
  RotateCcw,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type StitchResult = {
  sessionId: string;
  designMd: string;
  stitchPrompt: string;
  metadata: {
    screenshotCount: number;
    projectName?: string;
    analyzedAt: string;
  };
};

type ViewMode = "preview" | "raw";

export default function StitchResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<StitchResult | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [copiedDesign, setCopiedDesign] = useState(false);
  const [copiedStitch, setCopiedStitch] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "stitch">("design");

  useEffect(() => {
    const stored = sessionStorage.getItem(`stitch_${id}`);
    if (!stored) {
      toast.error("Hasil tidak ditemukan. Kembali dan analisis ulang.");
      router.push("/stitch");
      return;
    }
    try {
      setResult(JSON.parse(stored));
    } catch {
      router.push("/stitch");
    }
  }, [id, router]);

  const handleCopyDesign = async () => {
    if (!result?.designMd) return;
    await navigator.clipboard.writeText(result.designMd);
    setCopiedDesign(true);
    toast.success("DESIGN.md tersalin!");
    setTimeout(() => setCopiedDesign(false), 2000);
  };

  const handleCopyStitch = async () => {
    if (!result?.stitchPrompt) return;
    await navigator.clipboard.writeText(result.stitchPrompt);
    setCopiedStitch(true);
    toast.success("Stitch Prompt tersalin!");
    setTimeout(() => setCopiedStitch(false), 2000);
  };

  const handleDownload = () => {
    if (!result?.designMd) return;
    const blob = new Blob([result.designMd], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const slug =
      result.metadata.projectName
        ?.toLowerCase()
        .replace(/[^a-z0-9]/g, "-")
        .slice(0, 30) || "design";
    a.download = `DESIGN-${slug}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("DESIGN.md berhasil diunduh!");
  };

  if (!result) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          <span className="text-sm">Memuat hasil...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/4 blur-[100px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-background/80 backdrop-blur-sm shrink-0 z-10">
        <div className="flex items-center gap-2.5 min-w-0">
          <Link href="/stitch">
            <button
              id="back-btn"
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/" className="flex items-center">
            <span className="font-extrabold text-foreground text-sm tracking-tight hidden sm:block">
              Rancang<span className="text-primary">.ai</span>
            </span>
          </Link>
          {result.metadata.projectName && (
            <>
              <span className="text-border/60">·</span>
              <span className="text-sm text-muted-foreground truncate max-w-[200px]">
                {result.metadata.projectName}
              </span>
            </>
          )}
        </div>

        {/* Actions */}
        <div className="ml-auto flex items-center gap-1.5">
          <Link href="/stitch">
            <button
              id="analyze-new-btn"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 hover:border-border rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Analisis Baru
            </button>
          </Link>
          <button
            id="download-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors cursor-pointer border border-primary/20"
          >
            <Download className="w-3.5 h-3.5" />
            Download .md
          </button>
        </div>
      </header>

      {/* Content — two panel on desktop, tabs on mobile */}
      <div className="flex-1 flex overflow-hidden">
        {/* LEFT PANEL — DESIGN.md */}
        <div className="flex-1 flex flex-col min-w-0 border-r border-border/40">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-surface-container-high/30 shrink-0">
            <div className="flex items-center gap-2">
              <FileCode2 className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">DESIGN.md</span>
              <span className="text-xs text-muted-foreground/60 bg-muted px-2 py-0.5 rounded-full">
                {result.metadata.screenshotCount} screenshot
              </span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setViewMode("preview")}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === "preview" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setViewMode("raw")}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                  viewMode === "raw" ? "text-primary bg-primary/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                <Code2 className="w-3.5 h-3.5" />
              </button>
              <button
                id="copy-design-btn"
                onClick={handleCopyDesign}
                className={`w-7 h-7 flex items-center justify-center rounded-md transition-colors cursor-pointer ${
                  copiedDesign ? "text-green-400 bg-green-400/10" : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {copiedDesign ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Panel Content */}
          <div className="flex-1 overflow-auto">
            {viewMode === "raw" ? (
              <pre className="p-5 text-xs font-mono text-foreground/80 leading-relaxed whitespace-pre-wrap break-words">
                {result.designMd}
              </pre>
            ) : (
              <div className="p-6 prose prose-sm prose-invert max-w-none
                prose-headings:text-foreground prose-headings:font-semibold
                prose-p:text-muted-foreground prose-p:leading-relaxed
                prose-li:text-muted-foreground
                prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-code:text-xs
                prose-pre:bg-surface-container-high prose-pre:border prose-pre:border-border/50
                prose-table:text-xs prose-th:text-foreground prose-td:text-muted-foreground
                prose-strong:text-foreground
                prose-hr:border-border/40
              ">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {result.designMd}
                </ReactMarkdown>
              </div>
            )}
          </div>
        </div>

        {/* RIGHT PANEL — Stitch Prompt */}
        <div className="w-[360px] xl:w-[420px] shrink-0 flex flex-col hidden md:flex">
          {/* Panel Header */}
          <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-surface-container-high/30 shrink-0">
            <div className="flex items-center gap-2">
              <Wand2 className="w-4 h-4 text-secondary-foreground" />
              <span className="text-sm font-semibold text-foreground">Stitch Prompt</span>
            </div>
            <button
              id="copy-stitch-btn"
              onClick={handleCopyStitch}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                copiedStitch
                  ? "text-green-400 bg-green-400/10"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              {copiedStitch ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copiedStitch ? "Tersalin!" : "Salin"}
            </button>
          </div>

          {/* Stitch Prompt Content */}
          <div className="flex-1 overflow-auto p-5 flex flex-col gap-4">
            {/* Usage Labels */}
            <div className="flex flex-wrap gap-2">
              {["Stitch", "v0", "Bolt", "Midjourney"].map((tool) => (
                <span
                  key={tool}
                  className="text-xs px-2 py-0.5 rounded-full bg-muted border border-border/50 text-muted-foreground"
                >
                  {tool}
                </span>
              ))}
            </div>

            {/* Prompt Box */}
            <div
              onClick={handleCopyStitch}
              className="flex-1 rounded-xl border border-border/60 bg-surface-container-high/50 p-4 cursor-pointer hover:border-primary/30 hover:bg-primary/3 transition-all group relative"
            >
              <p className="text-sm text-foreground/90 leading-relaxed font-mono">
                {result.stitchPrompt}
              </p>
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              </div>
            </div>

            <p className="text-xs text-muted-foreground/60 text-center">
              Klik prompt untuk menyalin
            </p>

            {/* Metadata */}
            <div className="rounded-lg border border-border/40 bg-surface-container-high/30 p-3 space-y-1.5">
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                Info Analisis
              </p>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Screenshot dianalisis</span>
                  <span className="text-foreground font-medium">{result.metadata.screenshotCount}</span>
                </div>
                {result.metadata.projectName && (
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Nama proyek</span>
                    <span className="text-foreground font-medium">{result.metadata.projectName}</span>
                  </div>
                )}
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Dianalisis pada</span>
                  <span className="text-foreground font-medium">
                    {new Date(result.metadata.analyzedAt).toLocaleTimeString("id-ID", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Sheet for Stitch Prompt */}
      <div className="md:hidden border-t border-border/40 bg-surface-container-high/80 backdrop-blur-sm p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-1.5">
            <Wand2 className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-semibold text-foreground">Stitch Prompt</span>
          </div>
          <button
            onClick={handleCopyStitch}
            className="flex items-center gap-1 text-xs text-primary cursor-pointer"
          >
            {copiedStitch ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
            {copiedStitch ? "Tersalin!" : "Salin"}
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-mono line-clamp-3">
          {result.stitchPrompt}
        </p>
      </div>
    </div>
  );
}
