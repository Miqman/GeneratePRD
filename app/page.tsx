"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  Loader2,
  LogIn,
  FileText,
  Globe,
  ArrowUp,
  History,
  Menu,
  MessageSquareQuote,
  SkipForward,
  Wand2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { useSession, signOut } from "@/lib/auth-client";
import Link from "next/link";
import { Sidebar } from "@/components/layout/Sidebar";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

type PageState = "idle" | "clarifying" | "generating";

type Question = {
  text: string;
  type: "open" | "choice";
  choices?: string[];
};

export default function LandingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [pageState, setPageState] = useState<PageState>("idle");
  const [charCount, setCharCount] = useState(0);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [selectedMode, setSelectedMode] = useState<"prd" | "stitch" | null>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut();
    window.location.href = "/login";
  };

  // Clarification state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [complexity, setComplexity] = useState<"simple" | "medium" | "complex">("medium");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Tunggu session selesai di-fetch sebelum memutuskan redirect
  if (isPending) return null;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setCharCount(e.target.value.length);
  };

  /** Step 1: Hit /api/clarify, then decide whether to show questions or jump straight to generate */
  const handleGenerate = async () => {
    if (!prompt.trim() || prompt.trim().length < 10) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }

    setPageState("generating"); // show spinner while clarifying

    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), language }),
      });

      const data = await res.json();

      // Capture complexity from clarify response
      if (data.complexity && ["simple", "medium", "complex"].includes(data.complexity)) {
        setComplexity(data.complexity);
      }

      if (data.needsClarification && data.questions?.length > 0) {
        // Show questions
        const formattedQuestions: Question[] = data.questions.map((q: any) =>
          typeof q === "string" ? { text: q, type: "open" } : q
        );
        setQuestions(formattedQuestions);
        setAnswers({});
        setPageState("clarifying");
      } else {
        // No clarification needed — generate directly
        await doGenerate({});
      }
    } catch {
      // If clarify fails, proceed to generate anyway
      await doGenerate({});
    }
  };

  /** Step 2: Actual generation call (with optional answers) */
  const doGenerate = async (answersMap: Record<string, string>) => {
    setPageState("generating");
    setErrorMsg(null);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          language,
          answers: answersMap,
          complexity,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error || `HTTP ${res.status}`);
      }
      router.push(`/prd/${data.sessionId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("doGenerate error:", msg);
      setErrorMsg(msg);
      setPageState("idle");
    }
  };

  const handleSubmitAnswers = () => doGenerate(answers);
  const handleSkipClarification = () => doGenerate({});

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleGenerate();
    }
  };

  const applyExample = (example: string) => {
    setPrompt(example);
    setCharCount(example.length);
    textareaRef.current?.focus();
  };
  void applyExample; // suppress unused warning

  const isGenerating = pageState === "generating";

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-body-md selection:bg-primary/30 selection:text-primary relative overflow-x-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* TopNavBar */}
      <header className="bg-background flex justify-between items-center w-full px-gutter py-4 z-50 sticky top-0 backdrop-blur-md bg-opacity-90">
        <div className="flex items-center gap-stack-sm">
          {/* Burger menu — only shown when logged in */}
          {session?.user && (
            <button
              id="sidebar-toggle"
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-md text-text-secondary hover:text-foreground hover:bg-surface-container-high transition-colors cursor-pointer"
              aria-label="Buka riwayat PRD"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}
          <Link href="/" className="flex items-center gap-stack-sm">
            <span className="text-body-lg font-body-lg font-extrabold text-on-surface tracking-tight">
              Rancang<span className="text-primary">.ai</span>
            </span>
          </Link>
        </div>
        <div className="flex items-center gap-stack-md">
          <ThemeToggle />
          {session?.user ? (
            <div ref={userMenuRef} className="relative">
              <button
                id="user-avatar-btn"
                onClick={() => setUserMenuOpen((prev) => !prev)}
                aria-label="Menu akun"
                className="w-9 h-9 rounded-full bg-primary-container text-on-primary-container flex items-center justify-center font-bold text-label-md select-none cursor-pointer hover:ring-2 hover:ring-primary/40 transition-all"
              >
                {(session.user.name || session.user.email || "U")[0].toUpperCase()}
              </button>

              {userMenuOpen && (
                <div className="absolute right-0 top-11 w-52 rounded-xl border border-border-subtle bg-surface-container-high shadow-xl shadow-black/30 z-50 overflow-hidden animate-fade-in-up">
                  <div className="px-4 py-3 border-b border-border-subtle">
                    {session.user.name && (
                      <p className="text-sm font-semibold text-on-surface truncate">{session.user.name}</p>
                    )}
                    <p className="text-xs text-text-secondary truncate">{session.user.email}</p>
                  </div>
                  <button
                    id="logout-btn"
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                      <polyline points="16 17 21 12 16 7" />
                      <line x1="21" y1="12" x2="9" y2="12" />
                    </svg>
                    Keluar
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link href="/login">
              <Button variant="outline" size="sm" className="gap-2 text-xs border-border-subtle hover:border-primary/50 cursor-pointer">
                <LogIn className="w-3.5 h-3.5" />
                Masuk
              </Button>
            </Link>
          )}
        </div>
      </header>

      {/* Main Canvas */}
      <main className="flex-1 flex flex-col items-center justify-center px-gutter w-full max-w-container-max mx-auto py-section-gap relative z-10 pb-[100px]">
        {/* Hero Section */}
        <div className="text-center mb-8 w-full flex flex-col items-center">
          <h1 className="text-headline-lg-mobile md:text-headline-xl font-headline-lg-mobile md:font-headline-xl text-on-surface tracking-tight mb-3">
            Rancang dokumen produkmu
          </h1>
          <p className="text-body-sm md:text-body-lg font-body-sm md:font-body-lg text-text-secondary max-w-lg mx-auto leading-relaxed">
            Pilih jenis dokumen yang ingin kamu generate dengan AI.
          </p>
        </div>

        {/* ─── Mode Selector Cards ─── */}
        {selectedMode === null && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8 max-w-2xl">
            {/* PRD Card */}
            <button
              id="select-prd-btn"
              onClick={() => setSelectedMode("prd")}
              className="group text-left p-6 rounded-xl border border-border-subtle bg-surface-container-high hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]"
            >
              <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <h2 className="text-base font-bold text-on-surface mb-1.5 group-hover:text-primary transition-colors">
                Generate PRD
              </h2>
              <p className="text-sm text-text-secondary leading-relaxed">
                Ubah ide mentah menjadi Product Requirements Document lengkap siap pakai.
              </p>
              <div className="mt-4 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                Mulai Generate →
              </div>
            </button>

            {/* Stitch Card */}
            <Link href="/stitch" id="select-stitch-btn">
              <div className="group text-left p-6 rounded-xl border border-border-subtle bg-surface-container-high hover:border-secondary/60 hover:bg-secondary/5 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-[0.98] h-full">
                <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Wand2 className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1.5 group-hover:text-secondary transition-colors">
                  Generate DESIGN.md
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Upload screenshot web & app, generate DESIGN.md lengkap + Stitch Prompt siap pakai.
                </p>
                <div className="mt-4 text-xs text-secondary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Upload Screenshot →
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* Back to mode selector when PRD mode is active */}
        {selectedMode === "prd" && (
          <div className="w-full flex items-center gap-3 mb-5">
            <button
              onClick={() => setSelectedMode(null)}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
            >
              ← Kembali
            </button>
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Generate PRD</span>
            </div>
          </div>
        )}

        {/* ─── Error Banner ─── */}
        {errorMsg && pageState === "idle" && (
          <div className="w-full mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
            <span className="text-red-400 text-sm mt-0.5">⚠</span>
            <div className="flex-1">
              <p className="text-sm font-medium text-red-400">Gagal membuat PRD</p>
              <p className="text-xs text-red-400/70 mt-0.5 font-mono break-all">{errorMsg}</p>
            </div>
            <button onClick={() => setErrorMsg(null)} className="text-red-400/50 hover:text-red-400 text-xs cursor-pointer">✕</button>
          </div>
        )}

        {/* ─── IDLE: Input Console — only shown when PRD mode selected ─── */}
        {pageState === "idle" && selectedMode === "prd" && (
          <div className="w-full bg-surface-container-high rounded-xl border border-border-subtle p-6 relative focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300 shadow-lg group">
            <Textarea
              ref={textareaRef}
              id="prompt-input"
              value={prompt}
              onChange={handlePromptChange}
              onKeyDown={handleKeyDown}
              placeholder="Contoh: 'Aplikasi pelacak keuangan harian terintegrasi dengan WhatsApp bot, memiliki dashboard grafik pengeluaran bulanan dan kategori otomatis...'"
              className="w-full bg-transparent text-text-primary font-body-md text-body-md placeholder-text-secondary focus:ring-0 border-none resize-none p-0 outline-none leading-relaxed min-h-[100px]"
            />
            {/* Bottom Action Bar */}
            <div className="flex items-center justify-between mt-stack-md pt-stack-sm border-t border-border-subtle/50">
              {/* Language Selector */}
              <Select value={language} onValueChange={(v) => setLanguage(v as "id" | "en")}>
                <SelectTrigger
                  id="language-select"
                  className="text-label-sm font-label-sm text-text-secondary hover:text-text-primary flex items-center gap-2 px-3 py-1.5 rounded bg-surface-container border border-border-subtle transition-colors cursor-pointer h-auto focus:ring-0 focus:ring-offset-0 focus-visible:ring-0"
                >
                  <Globe className="w-4 h-4 opacity-70" />
                  <span>{language === "id" ? "Bahasa Indonesia" : "English"}</span>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="id" className="text-xs">Bahasa Indonesia</SelectItem>
                  <SelectItem value="en" className="text-xs">English</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex items-center gap-3">
                {charCount > 0 && (
                  <span className="text-text-secondary opacity-60 text-xs">{charCount} karakter</span>
                )}
                <Button
                  id="generate-btn"
                  onClick={handleGenerate}
                  disabled={prompt.trim().length < 10}
                  className="bg-primary text-on-primary p-3 rounded-lg hover:bg-primary-fixed transition-all duration-200 hover:shadow-[0_0_20px_rgba(94,237,137,0.25)] active:scale-95 flex items-center justify-center w-10 h-10 shrink-0 cursor-pointer disabled:opacity-40"
                >
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* ─── GENERATING: Spinner ─── */}
        {isGenerating && (
          <div className="w-full bg-surface-container-high rounded-xl border border-border-subtle p-8 flex flex-col items-center gap-4 shadow-lg animate-fade-in-up">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Loader2 className="w-6 h-6 text-primary animate-spin" />
            </div>
            <div className="text-center">
              <p className="text-body-md font-medium text-on-surface">
                {questions.length > 0 ? "Mengecek kejelasan prompt..." : "Membangun PRD Anda..."}
              </p>
              <p className="text-label-sm text-text-secondary mt-1">
                AI sedang bekerja, harap tunggu sebentar
              </p>
            </div>
          </div>
        )}

        {/* ─── CLARIFYING: Questions ─── */}
        {pageState === "clarifying" && (
          <div className="w-full bg-surface-container-high rounded-xl border border-primary/30 p-6 shadow-lg animate-fade-in-up">
            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquareQuote className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-body-md font-semibold text-on-surface">Boleh saya tanya dulu?</p>
                <p className="text-label-sm text-text-secondary mt-0.5">
                  Jawaban ini membantu AI membuat PRD yang lebih akurat. <strong className="text-primary/80 font-medium">Jawab yang menurut Anda penting saja, tidak perlu semua.</strong>
                </p>
              </div>
            </div>

            {/* Prompt preview */}
            <div className="mb-5 px-3 py-2 bg-surface-container rounded-lg border border-border-subtle text-label-sm text-text-secondary line-clamp-2 italic">
              &ldquo;{prompt}&rdquo;
            </div>

            {/* Questions */}
            <div className="space-y-6">
              {questions.map((q, i) => {
                const qText = q.text.replace(/\s*\(choices?:.*?\)/i, "");
                return (
                  <div key={i} className="flex flex-col gap-2.5">
                    <label
                      htmlFor={`clarify-q-${i}`}
                      className="text-label-sm font-medium text-text-primary flex items-start gap-2 leading-relaxed"
                    >
                      <span className="w-5 h-5 rounded-full bg-primary/15 text-primary text-xs flex items-center justify-center font-bold shrink-0 mt-0.5">
                        {i + 1}
                      </span>
                      {qText}
                    </label>

                    {q.type === "choice" && q.choices && q.choices.length > 0 ? (
                      <div className="flex flex-wrap gap-2 pl-7">
                        {q.choices.map((choice) => (
                          <button
                            key={choice}
                            onClick={() => setAnswers((prev) => ({ ...prev, [q.text]: choice }))}
                            className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${answers[q.text] === choice
                                ? "bg-primary text-on-primary border-primary font-medium shadow-[0_0_10px_rgba(94,237,137,0.2)]"
                                : "bg-surface-container text-text-secondary border-border-subtle hover:border-primary/50"
                              }`}
                          >
                            {choice}
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="pl-7">
                        <input
                          id={`clarify-q-${i}`}
                          type="text"
                          value={answers[q.text] ?? ""}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.text]: e.target.value }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleSubmitAnswers();
                            }
                          }}
                          placeholder="Ketik jawaban singkat jika ada..."
                          className="w-full bg-surface-container text-text-primary text-body-sm px-3 py-2.5 rounded-lg border border-border-subtle focus:border-primary/60 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder-text-secondary/50"
                        />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-3 mt-6">
              <Button
                id="submit-answers-btn"
                onClick={handleSubmitAnswers}
                className="flex-1 bg-primary text-on-primary hover:bg-primary-fixed transition-all duration-200 hover:shadow-[0_0_20px_rgba(94,237,137,0.25)] active:scale-[0.98] cursor-pointer font-semibold"
              >
                <ArrowUp className="w-4 h-4 mr-2" />
                Buat PRD Sekarang
              </Button>
              <button
                id="skip-clarify-btn"
                onClick={handleSkipClarification}
                className="flex items-center gap-1.5 text-label-sm text-text-secondary hover:text-text-primary transition-colors cursor-pointer px-3 py-2 rounded-lg hover:bg-surface-container"
              >
                <SkipForward className="w-3.5 h-3.5" />
                Lewati
              </button>
            </div>
          </div>
        )}

        {/* Secondary Action */}
        <button
          onClick={() => {
            if (session?.user) {
              setSidebarOpen(true);
            } else {
              router.push("/login");
            }
          }}
          className="mt-stack-lg text-label-md font-label-md text-text-secondary hover:text-primary inline-flex items-center gap-stack-sm transition-colors duration-200 group cursor-pointer"
        >
          <History className="w-[18px] h-[18px] group-hover:text-primary transition-colors opacity-70 group-hover:opacity-100" />
          <span>Lihat riwayat PRD sebelumnya</span>
        </button>
      </main>

      {/* Footer */}
      <footer className="fixed bottom-0 w-full bg-transparent flex justify-center items-center gap-stack-md py-stack-md border-t border-border-subtle/10 backdrop-blur-sm z-40">
        <span className="text-label-sm font-label-sm text-text-secondary">Product by Miq Dev</span>
        <span className="text-border-subtle text-xs">|</span>
        <div className="flex items-center gap-stack-md">
          <a className="text-label-sm font-label-sm text-text-secondary hover:text-primary transition-colors duration-200 inline-flex items-center gap-1" href="#">
            Discord
          </a>
          <a className="text-label-sm font-label-sm text-text-secondary hover:text-primary transition-colors duration-200 inline-flex items-center gap-1" href="#">
            YouTube
          </a>
        </div>
      </footer>

      {/* Ambient glow */}
      <div className="fixed top-1/4 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none -z-10" />
    </div>
  );
}
