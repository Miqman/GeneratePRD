"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "@/lib/auth-client";
import Link from "next/link";
import { toast } from "sonner";
import {
  Upload,
  X,
  ImagePlus,
  Loader2,
  Sparkles,
  ArrowLeft,
  FileCode2,
  Wand2,
} from "lucide-react";
import { ThemeToggle } from "@/components/layout/ThemeToggle";

type UploadedImage = {
  file: File;
  preview: string;
  id: string;
};

type AnalyzeStep = {
  label: string;
  done: boolean;
};

const STEPS: AnalyzeStep[] = [
  { label: "Menganalisis palet warna & tipografi...", done: false },
  { label: "Mengekstrak komponen UI...", done: false },
  { label: "Memetakan sistem spacing & elevasi...", done: false },
  { label: "Membuat DESIGN.md...", done: false },
  { label: "Membuat Stitch Prompt...", done: false },
];

export default function StitchPage() {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const [images, setImages] = useState<UploadedImage[]>([]);
  const [projectName, setProjectName] = useState("");
  const [description, setDescription] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [steps, setSteps] = useState<AnalyzeStep[]>(STEPS);
  const [currentStep, setCurrentStep] = useState(-1);
  const [isDragging, setIsDragging] = useState(false);

  // Auth redirect — must be in useEffect, not render body
  useEffect(() => {
    if (!isPending && !session?.user) {
      router.push("/login");
    }
  }, [isPending, session, router]);

  const addImages = useCallback((files: FileList | File[]) => {
    const fileArr = Array.from(files);
    setImages((prev) => {
      const remaining = 5 - prev.length;
      if (remaining <= 0) {
        toast.error("Maksimal 5 screenshot");
        return prev;
      }
      const toAdd = fileArr.slice(0, remaining);
      const newImages: UploadedImage[] = [];

      for (const file of toAdd) {
        if (!["image/png", "image/jpeg", "image/webp", "image/gif"].includes(file.type)) {
          toast.error(`Format tidak didukung: ${file.name}`);
          continue;
        }
        if (file.size > 10 * 1024 * 1024) {
          toast.error(`File terlalu besar (max 10MB): ${file.name}`);
          continue;
        }
        newImages.push({
          file,
          preview: URL.createObjectURL(file),
          id: `${Date.now()}-${Math.random()}`,
        });
      }
      return [...prev, ...newImages];
    });
  }, []);

  // Support paste image
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (isAnalyzing) return;
      const items = e.clipboardData?.items;
      if (!items) return;

      const pastedFiles: File[] = [];
      for (let i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image") !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            pastedFiles.push(file);
          }
        }
      }

      if (pastedFiles.length > 0) {
        addImages(pastedFiles);
        toast.success("Gambar berhasil ditempel (paste)!");
      }
    };

    window.addEventListener("paste", handlePaste);
    return () => {
      window.removeEventListener("paste", handlePaste);
    };
  }, [isAnalyzing, addImages]);

  const removeImage = (id: string) => {
    setImages((prev) => {
      const img = prev.find((i) => i.id === id);
      if (img) URL.revokeObjectURL(img.preview);
      return prev.filter((i) => i.id !== id);
    });
  };

  // ⚠️ useCallback HARUS sebelum early return agar tidak melanggar Rules of Hooks
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files) addImages(e.dataTransfer.files);
  }, [images]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => setIsDragging(false);

  // Early return SETELAH semua hooks
  if (isPending || !session?.user) return null;

  // Simulate step progress during analysis

  const simulateSteps = () => {
    const delays = [800, 1600, 2400, 3600, 4800];
    delays.forEach((delay, i) => {
      setTimeout(() => {
        setCurrentStep(i);
        setSteps((prev) =>
          prev.map((s, idx) => (idx < i ? { ...s, done: true } : s))
        );
      }, delay);
    });
  };

  const handleAnalyze = async () => {
    if (images.length === 0) {
      toast.error("Upload minimal 1 screenshot");
      return;
    }

    setIsAnalyzing(true);
    setSteps(STEPS.map((s) => ({ ...s, done: false })));
    setCurrentStep(0);
    simulateSteps();

    try {
      const formData = new FormData();
      images.forEach((img) => formData.append("images", img.file));
      if (projectName) formData.append("projectName", projectName);
      if (description) formData.append("description", description);

      const res = await fetch("/api/stitch/analyze", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Analisis gagal");
      }

      // Encode result to pass via URL (stored in sessionStorage)
      sessionStorage.setItem(`stitch_${data.sessionId}`, JSON.stringify(data));
      router.push(`/stitch/result/${data.sessionId}`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Terjadi kesalahan";
      toast.error(msg);
      setIsAnalyzing(false);
      setCurrentStep(-1);
      setSteps(STEPS);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Ambient glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[700px] h-[300px] bg-primary/4 blur-[120px] rounded-full pointer-events-none" />

      {/* Navbar */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-6 py-3 border-b border-border/50 bg-background/80 backdrop-blur-sm">
        <Link
          href="/"
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
        >
          <ArrowLeft className="w-4 h-4" />
          <span className="font-extrabold text-foreground">
            Rancang<span className="text-primary">.ai</span>
          </span>
        </Link>
        <span className="text-border/80">·</span>
        <span className="text-sm text-muted-foreground">Stitch & DESIGN.md Generator</span>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-12 max-w-3xl mx-auto w-full">
        {/* Hero */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-medium mb-4">
            <Wand2 className="w-3.5 h-3.5" />
            AI Vision Analysis
          </div>
          <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight mb-3">
            Generate{" "}
            <span className="text-primary">DESIGN.md</span>
            {" & "}
            <span className="text-primary">Stitch Prompt</span>
          </h1>
          <p className="text-muted-foreground text-base max-w-xl mx-auto leading-relaxed">
            Upload screenshot web atau app, dan AI akan menganalisis design system
            secara otomatis — warna, tipografi, komponen, spacing, dan lebih.
          </p>
        </div>

        {/* Upload Zone */}
        <div className="w-full space-y-5">
          {/* Drop Area */}
          <div
            ref={dropRef}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => !isAnalyzing && images.length < 5 && fileInputRef.current?.click()}
            className={`relative w-full rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer
              ${isDragging
                ? "border-primary/70 bg-primary/5 scale-[1.01]"
                : images.length > 0
                  ? "border-border/40 bg-surface-container-high/50"
                  : "border-border/60 bg-surface-container-high/30 hover:border-primary/40 hover:bg-primary/3"
              }
              ${isAnalyzing ? "pointer-events-none opacity-60" : ""}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              multiple
              className="hidden"
              onChange={(e) => e.target.files && addImages(e.target.files)}
            />

            {images.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mb-4">
                  <ImagePlus className="w-7 h-7 text-primary/70" />
                </div>
                <p className="text-sm font-medium text-foreground mb-1">
                  Drag & drop atau tempel (paste) screenshot di sini
                </p>
                <p className="text-xs text-muted-foreground mb-3">
                  atau tekan Ctrl+V / klik untuk memilih file
                </p>
                <p className="text-xs text-muted-foreground/60">
                  PNG, JPG, WebP · Max 10MB per file · Hingga 5 screenshot
                </p>
              </div>
            ) : (
              <div className="p-4">
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
                  {images.map((img) => (
                    <div key={img.id} className="relative group aspect-video rounded-lg overflow-hidden border border-border/60">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={img.preview}
                        alt={img.file.name}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <button
                          onClick={(e) => { e.stopPropagation(); removeImage(img.id); }}
                          className="w-7 h-7 rounded-full bg-red-500/80 flex items-center justify-center hover:bg-red-500 transition-colors"
                        >
                          <X className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                    </div>
                  ))}
                  {images.length < 5 && (
                    <div
                      onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                      className="aspect-video rounded-lg border-2 border-dashed border-border/40 flex items-center justify-center hover:border-primary/40 transition-colors cursor-pointer"
                    >
                      <Upload className="w-5 h-5 text-muted-foreground/50" />
                    </div>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-3 text-center">
                  {images.length}/5 screenshot · {images.length < 5 ? "Klik + untuk menambah" : "Maksimal tercapai"}
                </p>
              </div>
            )}
          </div>

          {/* Optional inputs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Nama Proyek <span className="text-muted-foreground/50">(opsional)</span>
              </label>
              <input
                type="text"
                value={projectName}
                onChange={(e) => setProjectName(e.target.value)}
                placeholder="Contoh: linear-design-system"
                disabled={isAnalyzing}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-high border border-border/60 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Konteks Tambahan <span className="text-muted-foreground/50">(opsional)</span>
              </label>
              <input
                type="text"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Contoh: dark SaaS marketing page"
                disabled={isAnalyzing}
                className="w-full px-3 py-2 rounded-lg bg-surface-container-high border border-border/60 text-sm text-foreground placeholder-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/20 transition-colors disabled:opacity-50"
              />
            </div>
          </div>

          {/* Analyze Button */}
          <button
            id="analyze-btn"
            onClick={handleAnalyze}
            disabled={isAnalyzing || images.length === 0}
            className="w-full flex items-center justify-center gap-2.5 py-3 px-6 rounded-xl bg-primary text-primary-foreground font-semibold text-sm transition-all hover:bg-primary/90 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none shadow-lg shadow-primary/20"
          >
            {isAnalyzing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            {isAnalyzing ? "Menganalisis..." : "Analisis & Generate"}
          </button>
        </div>

        {/* Progress Steps */}
        {isAnalyzing && (
          <div className="w-full mt-8 rounded-xl border border-border/50 bg-surface-container-high/50 p-5 space-y-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
              Progress Analisis
            </p>
            {steps.map((step, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 text-sm transition-all duration-300 ${
                  i < currentStep
                    ? "text-primary"
                    : i === currentStep
                      ? "text-foreground"
                      : "text-muted-foreground/40"
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-all ${
                    i < currentStep
                      ? "bg-primary border-primary text-primary-foreground"
                      : i === currentStep
                        ? "border-primary/60 bg-primary/10"
                        : "border-border/40 bg-transparent"
                  }`}
                >
                  {i < currentStep ? (
                    <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  ) : i === currentStep ? (
                    <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  ) : null}
                </div>
                <span>{step.label}</span>
              </div>
            ))}
          </div>
        )}

        {/* Info Cards */}
        {!isAnalyzing && (
          <div className="w-full mt-10 grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="rounded-xl border border-border/50 bg-surface-container-high/30 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileCode2 className="w-4 h-4 text-primary" />
                </div>
                <span className="font-semibold text-sm text-foreground">DESIGN.md</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Dokumen design system lengkap: color tokens, typography scale, spacing system, komponen, dan panduan implementasi.
              </p>
            </div>
            <div className="rounded-xl border border-border/50 bg-surface-container-high/30 p-4">
              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                  <Wand2 className="w-4 h-4 text-secondary" />
                </div>
                <span className="font-semibold text-sm text-foreground">Stitch Prompt</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Prompt siap pakai untuk Stitch (Google), v0 (Vercel), Bolt, atau Midjourney untuk mereplikasi design language.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
