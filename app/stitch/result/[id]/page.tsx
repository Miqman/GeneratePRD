"use client";

import { useEffect, useState, use, useMemo } from "react";
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
  Sparkles,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

type StitchResult = {
  sessionId: string;
  designMd: string;
  stitchPrompt: string;
  metadata: {
    screenshotCount: number;
    projectName?: string;
    analyzedAt: string;
    model?: string;
  };
};

type ActivePanel = "design" | "stitch";
type ViewMode = "preview" | "raw";

/** Pisah YAML frontmatter dari body markdown */
function parseDesignMd(raw: string): { frontmatter: string; body: string } {
  const match = raw.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (match) {
    return { frontmatter: match[1].trim(), body: match[2].trim() };
  }
  return { frontmatter: "", body: raw.trim() };
}

/** Ekstrak warna hex dari frontmatter untuk preview visual */
function extractColors(frontmatter: string): { name: string; hex: string }[] {
  const colors: { name: string; hex: string }[] = [];
  const lines = frontmatter.split("\n");
  let inColors = false;
  for (const line of lines) {
    if (line.trim() === "colors:") { inColors = true; continue; }
    if (inColors) {
      if (line.match(/^\w/) && !line.includes(":")) { inColors = false; continue; }
      if (line.match(/^\s{2}\w/) && !line.includes("colors:")) {
        const m = line.match(/^\s{2}([\w-]+):\s*"(#[0-9a-fA-F]{3,8})"/);
        if (m) colors.push({ name: m[1], hex: m[2] });
      } else if (!line.startsWith(" ")) {
        inColors = false;
      }
    }
  }
  return colors.slice(0, 12); // max 12 warna
}

export default function StitchResultPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [result, setResult] = useState<StitchResult | null>(null);
  const [activePanel, setActivePanel] = useState<ActivePanel>("design");
  const [viewMode, setViewMode] = useState<ViewMode>("preview");
  const [copiedDesign, setCopiedDesign] = useState(false);
  const [copiedStitch, setCopiedStitch] = useState(false);

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

  const { frontmatter, body } = useMemo(
    () => parseDesignMd(result?.designMd || ""),
    [result?.designMd]
  );

  const colors = useMemo(() => extractColors(frontmatter), [frontmatter]);

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
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[200px] bg-primary/4 blur-[120px] rounded-full pointer-events-none z-0" />

      {/* ── Navbar ── */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-border/50 bg-background/90 backdrop-blur-sm shrink-0 z-10 relative">
        <div className="flex items-center gap-2.5 min-w-0 flex-1">
          <Link href="/stitch">
            <button
              id="back-btn"
              className="w-8 h-8 flex items-center justify-center rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          </Link>
          <Link href="/" className="flex items-center shrink-0">
            <span className="font-extrabold text-foreground text-sm tracking-tight">
              Rancang<span className="text-primary">.ai</span>
            </span>
          </Link>
          {result.metadata.projectName && (
            <>
              <span className="text-border/50">/</span>
              <span className="text-sm text-muted-foreground truncate max-w-[160px]">
                {result.metadata.projectName}
              </span>
            </>
          )}
        </div>

        {/* Tab switcher — center */}
        <div className="flex items-center gap-1 bg-muted/60 rounded-lg p-0.5">
          <button
            onClick={() => setActivePanel("design")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activePanel === "design"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <FileCode2 className="w-3.5 h-3.5" />
            DESIGN.md
          </button>
          <button
            onClick={() => setActivePanel("stitch")}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all cursor-pointer ${
              activePanel === "stitch"
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Stitch Prompt
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1.5 flex-1 justify-end">
          <ThemeToggle />
          <Link href="/stitch">
            <button
              id="analyze-new-btn"
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs text-muted-foreground hover:text-foreground border border-border/60 hover:border-border rounded-lg transition-colors cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Baru
            </button>
          </Link>
          <button
            id="download-btn"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary/10 text-primary hover:bg-primary/20 rounded-lg transition-colors cursor-pointer border border-primary/20"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Download .md</span>
          </button>
        </div>
      </header>

      {/* ── Main Content ── */}
      <div className="flex-1 overflow-hidden relative z-10">

        {/* ═══ DESIGN.md PANEL ═══ */}
        {activePanel === "design" && (
          <div className="h-full flex flex-col">
            {/* Panel toolbar */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-border/40 bg-muted/20 shrink-0">
              <div className="flex items-center gap-3">
                {/* View toggle */}
                <div className="flex items-center gap-0.5 bg-muted/60 rounded-md p-0.5">
                  <button
                    onClick={() => setViewMode("preview")}
                    title="Preview"
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${
                      viewMode === "preview" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setViewMode("raw")}
                    title="Raw markdown"
                    className={`w-6 h-6 flex items-center justify-center rounded transition-colors cursor-pointer ${
                      viewMode === "raw" ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5" />
                  </button>
                </div>
                <span className="text-xs text-muted-foreground">
                  {viewMode === "preview" ? "Preview rendered" : "Raw markdown"}
                </span>
              </div>
              <button
                id="copy-design-btn"
                onClick={handleCopyDesign}
                className={`flex items-center gap-1.5 px-2.5 py-1 text-xs rounded-md transition-colors cursor-pointer ${
                  copiedDesign
                    ? "text-green-400 bg-green-400/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {copiedDesign ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                {copiedDesign ? "Tersalin!" : "Salin semua"}
              </button>
            </div>

            {/* Panel content */}
            <div className="flex-1 overflow-auto">
              {viewMode === "raw" ? (
                <pre className="p-6 text-xs font-mono text-foreground/75 leading-relaxed whitespace-pre-wrap break-words">
                  {result.designMd}
                </pre>
              ) : (
                <div className="max-w-3xl mx-auto px-6 py-8 space-y-8">

                  {/* Color Palette Visual — if detected */}
                  {colors.length > 0 && (
                    <div>
                      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                        Color Tokens
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {colors.map((c) => (
                          <div
                            key={c.name}
                            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border border-border/50 bg-muted/30 text-xs"
                            title={c.hex}
                          >
                            <div
                              className="w-4 h-4 rounded-full border border-border/50 shrink-0"
                              style={{ backgroundColor: c.hex }}
                            />
                            <span className="text-muted-foreground">{c.name}</span>
                            <span className="font-mono text-foreground/60">{c.hex}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* YAML Frontmatter — collapsible raw view */}
                  {frontmatter && (
                    <details className="group">
                      <summary className="flex items-center gap-2 cursor-pointer text-xs text-muted-foreground hover:text-foreground transition-colors list-none select-none">
                        <span className="inline-flex items-center justify-center w-4 h-4 rounded border border-border/60 text-[10px] group-open:rotate-90 transition-transform">▶</span>
                        Raw Tokens (YAML frontmatter)
                      </summary>
                      <pre className="mt-3 p-4 rounded-xl border border-border/40 bg-muted/30 text-xs font-mono text-foreground/60 leading-relaxed whitespace-pre-wrap overflow-auto max-h-64">
                        {frontmatter}
                      </pre>
                    </details>
                  )}

                  {/* Rendered markdown body */}
                  <div className="prose prose-sm prose-invert max-w-none
                    prose-headings:text-foreground prose-headings:font-semibold prose-headings:tracking-tight
                    prose-h2:text-base prose-h2:border-b prose-h2:border-border/30 prose-h2:pb-2 prose-h2:mt-8
                    prose-h3:text-sm prose-h3:text-foreground/90
                    prose-p:text-muted-foreground prose-p:leading-relaxed
                    prose-li:text-muted-foreground prose-li:leading-relaxed
                    prose-strong:text-foreground
                    prose-code:text-primary prose-code:bg-primary/10 prose-code:px-1.5 prose-code:py-0.5 prose-code:rounded prose-code:text-xs prose-code:font-mono
                    prose-pre:bg-muted/50 prose-pre:border prose-pre:border-border/40 prose-pre:rounded-xl
                    prose-table:text-xs prose-th:text-foreground prose-th:font-semibold prose-td:text-muted-foreground
                    prose-blockquote:border-primary/40 prose-blockquote:text-muted-foreground
                    prose-hr:border-border/30
                  ">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {body}
                    </ReactMarkdown>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ═══ STITCH PROMPT PANEL ═══ */}
        {activePanel === "stitch" && (
          <div className="h-full flex flex-col items-center justify-start overflow-auto py-8 px-4">
            <div className="w-full max-w-2xl space-y-5">

              {/* Header */}
              <div className="text-center">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-3">
                  <Wand2 className="w-3.5 h-3.5" />
                  AI-Generated Prompt
                </div>
                <h2 className="text-xl font-bold text-foreground mb-1.5">Stitch Prompt</h2>
                <p className="text-sm text-muted-foreground">
                  Prompt siap pakai untuk generate UI dengan AI tools di bawah
                </p>
              </div>

              {/* Compatible tools */}
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {[
                  { name: "Stitch", color: "text-blue-400 bg-blue-400/10 border-blue-400/20" },
                  { name: "v0", color: "text-foreground bg-muted border-border/60" },
                  { name: "Bolt", color: "text-orange-400 bg-orange-400/10 border-orange-400/20" },
                  { name: "Midjourney", color: "text-purple-400 bg-purple-400/10 border-purple-400/20" },
                ].map((tool) => (
                  <span
                    key={tool.name}
                    className={`text-xs px-3 py-1 rounded-full border font-medium ${tool.color}`}
                  >
                    {tool.name}
                  </span>
                ))}
              </div>

              {/* Prompt card — main content */}
              <div
                onClick={handleCopyStitch}
                className="w-full rounded-2xl border border-border/60 bg-muted/30 p-6 cursor-pointer hover:border-primary/40 hover:bg-primary/3 transition-all group relative"
              >
                <p className="text-sm text-foreground leading-7 font-mono">
                  {result.stitchPrompt}
                </p>
                <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-muted text-xs text-muted-foreground">
                    <Copy className="w-3 h-3" />
                    Klik untuk salin
                  </div>
                </div>
              </div>

              {/* Copy button — prominent */}
              <button
                id="copy-stitch-btn"
                onClick={handleCopyStitch}
                className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-semibold text-sm transition-all cursor-pointer ${
                  copiedStitch
                    ? "bg-green-500/20 text-green-400 border border-green-500/30"
                    : "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/20"
                }`}
              >
                {copiedStitch ? (
                  <>
                    <Check className="w-4 h-4" />
                    Tersalin ke clipboard!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Salin Stitch Prompt
                  </>
                )}
              </button>

              {/* Metadata card */}
              <div className="rounded-xl border border-border/40 bg-muted/20 p-4">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                  Info Analisis
                </p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Screenshot</p>
                    <p className="text-sm font-semibold text-foreground">{result.metadata.screenshotCount} file</p>
                  </div>
                  {result.metadata.projectName && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Proyek</p>
                      <p className="text-sm font-semibold text-foreground truncate">{result.metadata.projectName}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-xs text-muted-foreground mb-0.5">Dianalisis</p>
                    <p className="text-sm font-semibold text-foreground">
                      {new Date(result.metadata.analyzedAt).toLocaleTimeString("id-ID", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                  {result.metadata.model && (
                    <div>
                      <p className="text-xs text-muted-foreground mb-0.5">Model</p>
                      <p className="text-sm font-semibold text-foreground font-mono">{result.metadata.model}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Switch to DESIGN.md */}
              <button
                onClick={() => setActivePanel("design")}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-foreground border border-border/50 hover:border-border transition-colors cursor-pointer"
              >
                <FileCode2 className="w-4 h-4" />
                Lihat DESIGN.md lengkap
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
