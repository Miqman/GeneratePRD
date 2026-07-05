"use client";

import { useState } from "react";
import { ChevronDown, Download, Archive, Terminal, Check, Loader2 } from "lucide-react";
import type { PRDVersion, RoadmapFeature, PrdTask } from "@/lib/types";

interface ImplementasiDropdownProps {
  sessionId: string;
  prdContent: string;
  title: string;
  language: "id" | "en";
}

export function ImplementasiDropdown({ sessionId, prdContent, title, language }: ImplementasiDropdownProps) {
  const [open, setOpen] = useState(false);
  const [loadingZip, setLoadingZip] = useState(false);
  const [loadingPrompt, setLoadingPrompt] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState(false);

  const downloadPRD = () => {
    const blob = new Blob([prdContent], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}-prd.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    setOpen(false);
  };

  const downloadZip = async () => {
    setLoadingZip(true);
    setOpen(false);
    try {
      // Dynamically import jszip
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();

      // Add PRD.md
      zip.file("PRD.md", prdContent);

      // Fetch features and tasks
      const [featRes, taskRes] = await Promise.all([
        fetch(`/api/prd/${sessionId}/roadmap`),
        fetch(`/api/prd/${sessionId}/tasks`),
      ]);

      if (featRes.ok) {
        const { features } = await featRes.json() as { features: RoadmapFeature[] };
        const featFolder = zip.folder("features");
        features.forEach((f: RoadmapFeature, i: number) => {
          const idx = String(i + 1).padStart(2, "0");
          const slug = f.name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
          const content = [
            `# ${f.name}`,
            `\n**Fase:** ${f.phase} | **Prioritas:** ${f.priority}`,
            `\n## Deskripsi\n${f.description}`,
            `\n## Tujuan\n${f.goal}`,
            `\n## Selesai Bila\n${(f.doneWhen || []).map((d: string) => `- ${d}`).join("\n")}`,
            `\n## Sub-fitur\n${(f.subFeatures || []).map((s: { name: string; description: string }) => `### ${s.name}\n${s.description}`).join("\n\n")}`,
          ].join("\n");
          featFolder?.file(`${idx}-${slug}.md`, content);
        });
      }

      if (taskRes.ok) {
        const { tasks } = await taskRes.json() as { tasks: PrdTask[] };
        zip.file("tasks.json", JSON.stringify(tasks, null, 2));
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${title.replace(/[^a-z0-9-]/gi, "-").toLowerCase()}-bundle.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("ZIP generation failed:", err);
      alert("Gagal membuat ZIP. Pastikan package jszip terpasang.");
    } finally {
      setLoadingZip(false);
    }
  };

  const copyAgentPrompt = async () => {
    setLoadingPrompt(true);
    try {
      const taskRes = await fetch(`/api/prd/${sessionId}/tasks`);
      const tasks: PrdTask[] = taskRes.ok ? (await taskRes.json()).tasks : [];
      const apiBase = window.location.origin;
      const agentKey = process.env.NEXT_PUBLIC_AGENT_API_KEY || "<YOUR_AGENT_API_KEY>";

      const taskList = tasks
        .filter((t) => t.status === "belum_mulai" || t.status === "dikerjakan")
        .slice(0, 20)
        .map((t, i) => `${i + 1}. [${t.featureName}] ${t.title}\n   ID: ${t.id}\n   ${t.description}`)
        .join("\n\n");

      const prompt = [
        `# Instruksi untuk AI Agent — ${title}`,
        ``,
        `Kamu adalah developer yang akan mengimplementasikan fitur-fitur berikut berdasarkan PRD.`,
        ``,
        `## PRD Summary`,
        prdContent.slice(0, 2000),
        `... [PRD dipotong untuk brevity]`,
        ``,
        `## Daftar Task yang Perlu Dikerjakan`,
        taskList || "(belum ada task — generate roadmap terlebih dahulu di halaman PRD)",
        ``,
        `## Instruksi`,
        `1. Kerjakan task satu per satu secara urut.`,
        `2. Setelah task selesai, update statusnya via API:`,
        `   \`\`\``,
        `   PATCH ${apiBase}/api/prd/${sessionId}/tasks/<TASK_ID>`,
        `   Headers: X-Agent-Key: ${agentKey}`,
        `   Body: {"status": "selesai"}`,
        `   \`\`\``,
        `3. Status yang valid: belum_mulai | dikerjakan | selesai | gagal`,
        `4. Tandai "dikerjakan" saat mulai, "selesai" setelah selesai.`,
        `5. Jika task gagal, set "gagal" dan lanjut ke task berikutnya.`,
        ``,
        `Mulai dari task nomor 1. Buat kodenya, test, lalu update status.`,
      ].join("\n");

      await navigator.clipboard.writeText(prompt);
      setCopiedPrompt(true);
      setTimeout(() => setCopiedPrompt(false), 3000);
    } catch {
      alert("Gagal menyalin ke clipboard.");
    } finally {
      setLoadingPrompt(false);
      setOpen(false);
    }
  };

  return (
    <div className="relative">
      <button
        id="implementasi-btn"
        onClick={() => setOpen((prev) => !prev)}
        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold text-sm rounded-lg transition-all duration-200 hover:shadow-[0_0_16px_rgba(245,158,11,0.3)] active:scale-[0.98] cursor-pointer"
      >
        Mulai Implementasi
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-11 w-56 rounded-xl border border-border-subtle bg-surface-container-high shadow-xl z-50 overflow-hidden animate-fade-in-up">
            {/* Download PRD */}
            <button
              onClick={downloadPRD}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-surface-container transition-colors cursor-pointer"
            >
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center">
                <Download className="w-3.5 h-3.5 text-primary" />
              </div>
              <div className="text-left">
                <p className="font-medium">Download PRD</p>
                <p className="text-xs text-text-secondary">Unduh .md file</p>
              </div>
            </button>

            {/* Download ZIP */}
            <button
              onClick={downloadZip}
              disabled={loadingZip}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-60"
            >
              <div className="w-7 h-7 rounded-lg bg-secondary/10 flex items-center justify-center">
                {loadingZip ? <Loader2 className="w-3.5 h-3.5 text-secondary animate-spin" /> : <Archive className="w-3.5 h-3.5 text-secondary" />}
              </div>
              <div className="text-left">
                <p className="font-medium">Download ZIP</p>
                <p className="text-xs text-text-secondary">PRD + features + tasks</p>
              </div>
            </button>

            <div className="border-t border-border-subtle/50" />

            {/* Copy agent prompt */}
            <button
              onClick={copyAgentPrompt}
              disabled={loadingPrompt}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-text-primary hover:bg-surface-container transition-colors cursor-pointer disabled:opacity-60"
            >
              <div className="w-7 h-7 rounded-lg bg-amber-500/10 flex items-center justify-center">
                {loadingPrompt
                  ? <Loader2 className="w-3.5 h-3.5 text-amber-400 animate-spin" />
                  : copiedPrompt
                  ? <Check className="w-3.5 h-3.5 text-primary" />
                  : <Terminal className="w-3.5 h-3.5 text-amber-400" />}
              </div>
              <div className="text-left">
                <p className="font-medium">
                  {copiedPrompt ? "Tersalin!" : "Prompt AI Agent"}
                </p>
                <p className="text-xs text-text-secondary">Copy prompt ke clipboard</p>
              </div>
            </button>
          </div>
        </>
      )}
    </div>
  );
}
