"use client";

import { useState } from "react";
import { GitFork, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";

interface ForkButtonProps {
  sessionId: string;
}

export function ForkButton({ sessionId }: ForkButtonProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleFork = async () => {
    if (loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/prd/${sessionId}/fork`, { method: "POST" });
      if (!res.ok) throw new Error("Fork gagal");
      const data = await res.json();
      router.push(`/prd/${data.newSessionId}`);
    } catch (err) {
      console.error("Fork error:", err);
      alert("Gagal menduplikat sesi PRD. Coba lagi.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      id="fork-btn"
      onClick={handleFork}
      disabled={loading}
      className="flex items-center gap-2 px-4 py-2 border border-border-subtle text-text-primary text-sm rounded-lg hover:border-primary/40 hover:text-primary hover:bg-primary/5 transition-all duration-200 active:scale-[0.98] cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed font-medium"
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <GitFork className="w-4 h-4" />
      )}
      {loading ? "Menduplikat..." : "Fork Plan Ini"}
    </button>
  );
}
