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
  Bot,
  Settings,
  Check,
  ChevronRight,
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
import type { TechStackEntry } from "@/lib/types";

type FlowStep = "selectMode" | "input" | "techStack" | "techStackForm" | "clarify" | "generating";

type Question = {
  text: string;
  type: "open" | "choice" | "multi-choice";
  choices?: string[];
};

// Tech stack layer definitions with chip options
const TECH_LAYERS = [
  {
    key: "frontend",
    label: "Frontend / Framework",
    options: ["Next.js", "React", "Vue.js", "Svelte", "Nuxt.js"],
  },
  {
    key: "backend",
    label: "Backend / API",
    options: ["Next.js API Routes", "Express.js", "Fastify", "NestJS", "Hono"],
  },
  {
    key: "database",
    label: "Database",
    options: ["PostgreSQL", "MySQL", "SQLite", "MongoDB", "Supabase"],
  },
  {
    key: "orm",
    label: "ORM / Query Builder",
    options: ["Drizzle ORM", "Prisma", "TypeORM", "Mongoose"],
  },
  {
    key: "auth",
    label: "Authentication",
    options: ["Better Auth", "NextAuth.js", "Clerk", "Supabase Auth"],
  },
  {
    key: "hosting",
    label: "Hosting / Deployment",
    options: ["Vercel", "Railway", "Fly.io", "VPS (Ubuntu)", "Netlify"],
  },
  {
    key: "styling",
    label: "Styling / UI",
    options: ["Tailwind CSS + shadcn/ui", "Tailwind CSS", "Vanilla CSS", "Chakra UI"],
  },
] as const;

type LayerKey = (typeof TECH_LAYERS)[number]["key"];

export default function LandingPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();

  // Flow state
  const [flowStep, setFlowStep] = useState<FlowStep>("selectMode");
  const [prompt, setPrompt] = useState("");
  const [language, setLanguage] = useState<"id" | "en">("id");
  const [charCount, setCharCount] = useState(0);

  // Tech stack state
  const [techStackMode, setTechStackMode] = useState<"ai" | "self" | null>(null);
  const [techStackForm, setTechStackForm] = useState<Record<LayerKey, string>>({
    frontend: "",
    backend: "",
    database: "",
    orm: "",
    auth: "",
    hosting: "",
    styling: "",
  });
  const [customInputs, setCustomInputs] = useState<Record<LayerKey, string>>({
    frontend: "",
    backend: "",
    database: "",
    orm: "",
    auth: "",
    hosting: "",
    styling: "",
  });
  const [aiTechStack, setAiTechStack] = useState<TechStackEntry[] | null>(null);

  // Clarify state
  const [questions, setQuestions] = useState<Question[]>([]);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [otherSelected, setOtherSelected] = useState<Record<number, boolean>>({});
  const [customOtherText, setCustomOtherText] = useState<Record<number, string>>({});
  const [complexity, setComplexity] = useState<"simple" | "medium" | "complex">("medium");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // UI state
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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

  if (isPending) return null;

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setPrompt(e.target.value);
    setCharCount(e.target.value.length);
  };

  /** Step 0: Select mode card → show textarea */
  const handleSelectPRD = () => {
    setFlowStep("input");
    // Focus textarea after render
    setTimeout(() => textareaRef.current?.focus(), 50);
  };

  /** Step 1: Submit prompt → go to tech stack selection */
  const handleSubmitPrompt = () => {
    if (!prompt.trim() || prompt.trim().length < 10) return;
    if (!session?.user) {
      router.push("/login");
      return;
    }
    setFlowStep("techStack");
  };

  /** Step 2a: User chooses "AI pick stack" */
  const handleSelectAiStack = async () => {
    setTechStackMode("ai");
    setFlowStep("generating"); // show spinner while fetching AI stack + clarify

    try {
      // Fetch AI-determined tech stack (fire and forget for display)
      const stackRes = await fetch("/api/tech-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: prompt.trim(), language }),
      });
      if (stackRes.ok) {
        const stackData = await stackRes.json();
        setAiTechStack(stackData.techStack || null);
      }
    } catch {
      // Not critical — AI stack preview is cosmetic
    }

    await runClarify(null);
  };

  /** Step 2b: User chooses "Fill own stack" → show form */
  const handleSelectSelfStack = () => {
    setTechStackMode("self");
    setFlowStep("techStackForm");
  };

  /** Step 2b continued: Submit stack form → clarify */
  const handleSubmitStackForm = async () => {
    setFlowStep("generating");
    await runClarify(buildTechStackEntries());
  };

  /** Build TechStackEntry[] from form selections */
  const buildTechStackEntries = (): TechStackEntry[] => {
    return TECH_LAYERS
      .map((layer) => {
        const selected = techStackForm[layer.key];
        const custom = customInputs[layer.key].trim();
        const technology = custom || selected;
        return technology
          ? { layer: layer.label, technology, reason: "Dipilih oleh developer" }
          : null;
      })
      .filter(Boolean) as TechStackEntry[];
  };

  /** Run clarify API */
  const runClarify = async (techStack: TechStackEntry[] | null) => {
    try {
      const res = await fetch("/api/clarify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          language,
          techStack: techStack || undefined,
        }),
      });

      const data = await res.json();
      if (data.complexity && ["simple", "medium", "complex"].includes(data.complexity)) {
        setComplexity(data.complexity);
      }

      if (data.needsClarification && data.questions?.length > 0) {
        const formattedQuestions: Question[] = data.questions.map((q: any) =>
          typeof q === "string" ? { text: q, type: "open" } : q
        );
        setQuestions(formattedQuestions);
        setAnswers({});
        setOtherSelected({});
        setCustomOtherText({});
        setFlowStep("clarify");
      } else {
        await doGenerate({}, techStack);
      }
    } catch {
      await doGenerate({}, techStack);
    }
  };

  /** Final generation */
  const doGenerate = async (
    answersMap: Record<string, string>,
    techStack: TechStackEntry[] | null = null
  ) => {
    setFlowStep("generating");
    setErrorMsg(null);
    try {
      const finalTechStack =
        techStack ||
        (techStackMode === "self" ? buildTechStackEntries() : aiTechStack);

      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt.trim(),
          language,
          answers: answersMap,
          complexity,
          techStack: finalTechStack,
          techStackMode,
        }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `HTTP ${res.status}`);
      router.push(`/prd/${data.sessionId}`);
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      console.error("doGenerate error:", msg);
      setErrorMsg(msg);
      setFlowStep("input");
    }
  };

  const handleSubmitAnswers = () => {
    const finalAnswers = { ...answers };
    questions.forEach((q, i) => {
      if (otherSelected[i]) {
        const textVal = (customOtherText[i] || "").trim();
        if (textVal) {
          if (q.type === "choice") {
            finalAnswers[q.text] = textVal;
          } else if (q.type === "multi-choice") {
            const current = answers[q.text] || "";
            const list = current ? current.split(", ").map(x => x.trim()).filter(Boolean) : [];
            list.push(textVal);
            finalAnswers[q.text] = list.join(", ");
          }
        }
      }
    });
    doGenerate(finalAnswers);
  };
  const handleSkipClarification = () => doGenerate({});

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmitPrompt();
    }
  };

  const goBack = () => {
    if (flowStep === "input") setFlowStep("selectMode");
    else if (flowStep === "techStack") setFlowStep("input");
    else if (flowStep === "techStackForm") setFlowStep("techStack");
    else if (flowStep === "clarify") setFlowStep(techStackMode === "self" ? "techStackForm" : "techStack");
  };

  const isGenerating = flowStep === "generating";

  return (
    <div className="min-h-screen bg-background text-text-primary flex flex-col font-body-md selection:bg-primary/30 selection:text-primary relative overflow-x-hidden">
      <Sidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* TopNavBar */}
      <header className="bg-background flex justify-between items-center w-full px-gutter py-4 z-50 sticky top-0 backdrop-blur-md bg-opacity-90">
        <div className="flex items-center gap-stack-sm">
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
            {flowStep === "selectMode" && "Pilih jenis dokumen yang ingin kamu generate dengan AI."}
            {flowStep === "input" && "Ceritakan ide proyekmu, AI akan membuat PRD lengkap untukmu."}
            {flowStep === "techStack" && "Siapa yang tentukan tech stack project ini?"}
            {flowStep === "techStackForm" && "Pilih teknologi yang ingin kamu gunakan."}
            {flowStep === "clarify" && "Bantu AI pahami proyekmu lebih baik."}
            {flowStep === "generating" && "AI sedang bekerja untuk kamu..."}
          </p>
        </div>

        {/* ─── Step breadcrumb ─── */}
        {flowStep !== "selectMode" && flowStep !== "generating" && (
          <div className="flex items-center gap-2 mb-6 text-xs text-text-secondary">
            <button onClick={goBack} className="hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
              ← Kembali
            </button>
            <span className="text-border-subtle">·</span>
            <span className={flowStep === "input" ? "text-primary font-medium" : ""}>Prompt</span>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className={flowStep === "techStack" || flowStep === "techStackForm" ? "text-primary font-medium" : ""}>
              Tech Stack
            </span>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span className={flowStep === "clarify" ? "text-primary font-medium" : ""}>Clarify</span>
            <ChevronRight className="w-3 h-3 opacity-40" />
            <span>Generate</span>
          </div>
        )}

        {/* ─── STEP 0: Pilih Jenis Dokumen ─── */}
        {flowStep === "selectMode" && (
          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl animate-fade-in-up">
            {/* PRD Card */}
            <button
              id="select-prd-btn"
              onClick={handleSelectPRD}
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
                Mulai buat PRD →
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
                  Upload screenshot web &amp; app, generate DESIGN.md lengkap + Stitch Prompt siap pakai.
                </p>
                <div className="mt-4 text-xs text-secondary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Upload Screenshot →
                </div>
              </div>
            </Link>
          </div>
        )}

        {/* ─── STEP 1: Input Prompt PRD ─── */}
        {flowStep === "input" && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            {/* Error Banner */}
            {errorMsg && (
              <div className="w-full mb-4 px-4 py-3 rounded-lg bg-red-500/10 border border-red-500/30 flex items-start gap-3">
                <span className="text-red-400 text-sm mt-0.5">⚠</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-red-400">Gagal membuat PRD</p>
                  <p className="text-xs text-red-400/70 mt-0.5 font-mono break-all">{errorMsg}</p>
                </div>
                <button onClick={() => setErrorMsg(null)} className="text-red-400/50 hover:text-red-400 text-xs cursor-pointer">✕</button>
              </div>
            )}

            {/* Input Console */}
            <div className="w-full bg-surface-container-high rounded-xl border border-border-subtle p-6 relative focus-within:border-primary/60 focus-within:ring-1 focus-within:ring-primary/20 transition-all duration-300 shadow-lg">
              <Textarea
                ref={textareaRef}
                id="prompt-input"
                value={prompt}
                onChange={handlePromptChange}
                onKeyDown={handleKeyDown}
                placeholder="Contoh: 'Aplikasi pelacak keuangan harian terintegrasi dengan WhatsApp bot, memiliki dashboard grafik pengeluaran bulanan dan kategori otomatis...'"
                className="w-full bg-transparent text-text-primary font-body-md text-body-md placeholder-text-secondary focus:ring-0 border-none resize-none p-0 outline-none leading-relaxed min-h-[120px]"
              />
              <div className="flex items-center justify-between mt-stack-md pt-stack-sm border-t border-border-subtle/50">
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
                    onClick={handleSubmitPrompt}
                    disabled={prompt.trim().length < 10}
                    className="bg-primary text-on-primary p-3 rounded-lg hover:bg-primary-fixed transition-all duration-200 hover:shadow-[0_0_20px_rgba(94,237,137,0.25)] active:scale-95 flex items-center justify-center w-10 h-10 shrink-0 cursor-pointer disabled:opacity-40"
                  >
                    <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── STEP: Tech Stack Selector ─── */}
        {flowStep === "techStack" && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            {/* Prompt preview */}
            <div className="mb-6 px-4 py-3 bg-surface-container rounded-xl border border-border-subtle text-label-sm text-text-secondary line-clamp-2 italic">
              &ldquo;{prompt}&rdquo;
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* AI Picks */}
              <button
                id="stack-ai-btn"
                onClick={handleSelectAiStack}
                className="group text-left p-6 rounded-xl border border-border-subtle bg-surface-container-high hover:border-primary/50 hover:bg-primary/5 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-primary/10 active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1.5 group-hover:text-primary transition-colors">
                  AI yang tentukan
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  AI pilih tech stack terbaik berdasarkan skala, tim, dan kebutuhan spesifik proyekmu.
                </p>
                <div className="mt-4 text-xs text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Biarkan AI pilihkan →
                </div>
              </button>

              {/* Self Picks */}
              <button
                id="stack-self-btn"
                onClick={handleSelectSelfStack}
                className="group text-left p-6 rounded-xl border border-border-subtle bg-surface-container-high hover:border-secondary/60 hover:bg-secondary/5 transition-all duration-200 cursor-pointer hover:shadow-lg hover:shadow-secondary/10 active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-lg bg-secondary/10 border border-secondary/20 flex items-center justify-center mb-4 group-hover:bg-secondary/20 transition-colors">
                  <Settings className="w-5 h-5 text-secondary" />
                </div>
                <h2 className="text-base font-bold text-on-surface mb-1.5 group-hover:text-secondary transition-colors">
                  Saya isi sendiri
                </h2>
                <p className="text-sm text-text-secondary leading-relaxed">
                  Kontrol penuh atas pilihan teknologi. AI akan mengikuti stack yang kamu tentukan.
                </p>
                <div className="mt-4 text-xs text-secondary font-medium opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1">
                  Pilih teknologi →
                </div>
              </button>
            </div>
          </div>
        )}

        {/* ─── STEP: Tech Stack Form ─── */}
        {flowStep === "techStackForm" && (
          <div className="w-full max-w-2xl animate-fade-in-up">
            <div className="bg-surface-container-high rounded-xl border border-border-subtle p-6 shadow-lg">
              <h2 className="text-base font-semibold text-on-surface mb-5">Pilih tech stack kamu</h2>
              <div className="space-y-5">
                {TECH_LAYERS.map((layer) => (
                  <div key={layer.key}>
                    <p className="text-label-sm font-medium text-text-primary mb-2.5">{layer.label}</p>
                    <div className="flex flex-wrap gap-2">
                      {layer.options.map((opt) => {
                        const isSelected = techStackForm[layer.key] === opt && !customInputs[layer.key];
                        return (
                          <button
                            key={opt}
                            type="button"
                            onClick={() => {
                              setTechStackForm((prev) => ({ ...prev, [layer.key]: opt }));
                              setCustomInputs((prev) => ({ ...prev, [layer.key]: "" }));
                            }}
                            className={`text-xs px-3.5 py-1.5 rounded-full border transition-all cursor-pointer flex items-center gap-1.5 ${
                              isSelected
                                ? "bg-primary text-on-primary border-primary font-medium shadow-[0_0_10px_rgba(94,237,137,0.2)]"
                                : "bg-surface-container text-text-secondary border-border-subtle hover:border-primary/50"
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3" />}
                            {opt}
                          </button>
                        );
                      })}
                      {/* Custom input toggle */}
                      {!customInputs[layer.key] ? (
                        <button
                          type="button"
                          onClick={() => {
                            setCustomInputs((prev) => ({ ...prev, [layer.key]: " " }));
                            setTechStackForm((prev) => ({ ...prev, [layer.key]: "" }));
                          }}
                          className="text-xs px-3.5 py-1.5 rounded-full border border-dashed border-border-subtle text-text-secondary hover:border-primary/40 transition-all cursor-pointer"
                        >
                          + Lainnya
                        </button>
                      ) : (
                        <input
                          type="text"
                          autoFocus
                          value={customInputs[layer.key].trim()}
                          onChange={(e) =>
                            setCustomInputs((prev) => ({ ...prev, [layer.key]: e.target.value }))
                          }
                          onBlur={() => {
                            if (!customInputs[layer.key].trim()) {
                              setCustomInputs((prev) => ({ ...prev, [layer.key]: "" }));
                            }
                          }}
                          placeholder="Ketik nama teknologi..."
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/40 bg-surface-container text-text-primary outline-none focus:ring-1 focus:ring-primary/30 w-36"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center gap-3 mt-6 pt-4 border-t border-border-subtle/50">
                <Button
                  id="stack-form-submit"
                  onClick={handleSubmitStackForm}
                  className="flex-1 bg-primary text-on-primary hover:bg-primary-fixed transition-all duration-200 hover:shadow-[0_0_20px_rgba(94,237,137,0.25)] active:scale-[0.98] cursor-pointer font-semibold"
                >
                  Lanjut ke Clarify
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
                <button
                  onClick={handleSubmitStackForm}
                  className="text-xs text-text-secondary hover:text-text-primary transition-colors cursor-pointer px-3 py-2"
                >
                  Lewati
                </button>
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
        {flowStep === "clarify" && (
          <div className="w-full bg-surface-container-high rounded-xl border border-primary/30 p-6 shadow-lg animate-fade-in-up">
            {/* Header */}
            <div className="flex items-start gap-3 mb-5">
              <div className="w-9 h-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
                <MessageSquareQuote className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-body-md font-semibold text-on-surface">Boleh saya tanya dulu?</p>
                <p className="text-label-sm text-text-secondary mt-0.5">
                  Jawaban ini membantu AI membuat PRD yang lebih akurat.{" "}
                  <strong className="text-primary/80 font-medium">Jawab yang menurut Anda penting saja, tidak perlu semua.</strong>
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
                      <div className="flex flex-col gap-2 pl-7">
                        <div className="flex flex-wrap gap-2">
                          {q.choices.map((choice) => {
                            const isSelected = answers[q.text] === choice && !otherSelected[i];
                            return (
                              <button
                                key={choice}
                                onClick={() => {
                                  setOtherSelected((prev) => ({ ...prev, [i]: false }));
                                  setAnswers((prev) => ({ ...prev, [q.text]: choice }));
                                }}
                                className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer ${
                                  isSelected
                                    ? "bg-primary text-on-primary border-primary font-medium shadow-[0_0_10px_rgba(94,237,137,0.2)]"
                                    : "bg-surface-container text-text-secondary border-border-subtle hover:border-primary/50"
                                }`}
                              >
                                {choice}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              setOtherSelected((prev) => ({ ...prev, [i]: true }));
                              setAnswers((prev) => ({ ...prev, [q.text]: "" }));
                            }}
                            className={`text-xs px-3.5 py-1.5 rounded-full border border-dashed transition-colors cursor-pointer ${
                              otherSelected[i]
                                ? "bg-primary text-on-primary border-primary font-medium shadow-[0_0_10px_rgba(94,237,137,0.2)]"
                                : "bg-surface-container text-text-secondary border-border-subtle hover:border-primary/50"
                            }`}
                          >
                            + Lainnya
                          </button>
                        </div>
                        {otherSelected[i] && (
                          <input
                            type="text"
                            placeholder="Masukkan pilihan kustom Anda..."
                            value={customOtherText[i] || ""}
                            onChange={(e) =>
                              setCustomOtherText((prev) => ({ ...prev, [i]: e.target.value }))
                            }
                            className="mt-2 w-full max-w-md bg-surface-container text-text-primary text-body-sm px-3 py-2 rounded-lg border border-primary/40 focus:border-primary/60 outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        )}
                      </div>
                    ) : q.type === "multi-choice" && q.choices && q.choices.length > 0 ? (
                      <div className="flex flex-col gap-2 pl-7">
                        <div className="flex flex-wrap gap-2">
                          {q.choices.map((choice) => {
                            const current = answers[q.text] || "";
                            const selectedList = current ? current.split(", ").map(x => x.trim()) : [];
                            const isSelected = selectedList.includes(choice);

                            return (
                              <button
                                key={choice}
                                onClick={() => {
                                  setAnswers((prev) => {
                                    const currentVal = prev[q.text] || "";
                                    let items = currentVal ? currentVal.split(", ").map(x => x.trim()).filter(Boolean) : [];
                                    if (items.includes(choice)) {
                                      items = items.filter((x) => x !== choice);
                                    } else {
                                      items.push(choice);
                                    }
                                    return { ...prev, [q.text]: items.join(", ") };
                                  });
                                }}
                                className={`text-xs px-3.5 py-1.5 rounded-full border transition-colors cursor-pointer flex items-center gap-1 ${
                                  isSelected
                                    ? "bg-primary text-on-primary border-primary font-medium shadow-[0_0_10px_rgba(94,237,137,0.2)]"
                                    : "bg-surface-container text-text-secondary border-border-subtle hover:border-primary/50"
                                }`}
                              >
                                {isSelected && <Check className="w-3 h-3" />}
                                {choice}
                              </button>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => {
                              setOtherSelected((prev) => ({ ...prev, [i]: !prev[i] }));
                            }}
                            className={`text-xs px-3.5 py-1.5 rounded-full border border-dashed transition-colors cursor-pointer ${
                              otherSelected[i]
                                ? "bg-primary text-on-primary border-primary font-medium shadow-[0_0_10px_rgba(94,237,137,0.2)]"
                                : "bg-surface-container text-text-secondary border-border-subtle hover:border-primary/50"
                            }`}
                          >
                            + Lainnya
                          </button>
                        </div>
                        {otherSelected[i] && (
                          <input
                            type="text"
                            placeholder="Masukkan pilihan kustom tambahan..."
                            value={customOtherText[i] || ""}
                            onChange={(e) =>
                              setCustomOtherText((prev) => ({ ...prev, [i]: e.target.value }))
                            }
                            className="mt-2 w-full max-w-md bg-surface-container text-text-primary text-body-sm px-3 py-2 rounded-lg border border-primary/40 focus:border-primary/60 outline-none focus:ring-1 focus:ring-primary/20"
                          />
                        )}
                      </div>
                    ) : (
                      <div className="pl-7">
                        <textarea
                          id={`clarify-q-${i}`}
                          rows={3}
                          value={answers[q.text] ?? ""}
                          onChange={(e) =>
                            setAnswers((prev) => ({ ...prev, [q.text]: e.target.value }))
                          }
                          placeholder="Ketik jawaban Anda di sini..."
                          className="w-full bg-surface-container text-text-primary text-body-sm px-3 py-2.5 rounded-lg border border-border-subtle focus:border-primary/60 focus:ring-1 focus:ring-primary/20 outline-none transition-all placeholder-text-secondary/50 resize-y min-h-[80px]"
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
        {flowStep === "selectMode" && (
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
        )}
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
