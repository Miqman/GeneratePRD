"use client";

import { useEffect, useRef, useState } from "react";
import {
  Search, ShoppingCart, History, User, LayoutDashboard, Bell, Settings,
  Map, Calendar, MessageSquare, CreditCard, Star, Package, FileText,
  BarChart, Shield, Zap, Globe, Layers, RefreshCw, Loader2,
} from "lucide-react";
import type { RoadmapFeature, PrdTask } from "@/lib/types";
import { FeatureDetailPanel } from "./FeatureDetailPanel";

const ICON_MAP: Record<string, React.ElementType> = {
  Search, ShoppingCart, History, User, LayoutDashboard, Bell, Settings,
  Map, Calendar, MessageSquare, CreditCard, Star, Package, FileText,
  BarChart, Shield, Zap, Globe, Layers,
};

const STATUS_COLORS = {
  planned: "bg-surface-container text-text-secondary border-border-subtle",
  in_progress: "bg-amber-500/10 text-amber-400 border-amber-500/30",
  done: "bg-primary/10 text-primary border-primary/30",
};

const STATUS_DOT = {
  planned: "bg-text-secondary/40",
  in_progress: "bg-amber-400",
  done: "bg-primary",
};

const STATUS_LABEL = {
  planned: "Direncanakan",
  in_progress: "Dikerjakan",
  done: "Selesai",
};

interface RoadmapTabProps {
  sessionId: string;
}

export function RoadmapTab({ sessionId }: RoadmapTabProps) {
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lines, setLines] = useState<{ x1: number; y1: number; x2: number; y2: number }[]>([]);

  const fetchFeatures = async () => {
    try {
      const res = await fetch(`/api/prd/${sessionId}/roadmap`);
      if (res.ok) {
        const data = await res.json();
        setFeatures(data.features || []);
      }
    } catch {
      // silently fail
    } finally {
      setLoading(false);
    }
  };

  const generateRoadmap = async () => {
    setGenerating(true);
    try {
      const res = await fetch(`/api/prd/${sessionId}/roadmap`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setFeatures(data.features || []);
      }
    } catch {
      // silently fail
    } finally {
      setGenerating(false);
    }
  };

  useEffect(() => {
    fetchFeatures();
  }, [sessionId]);

  // Calculate SVG lines from center node to feature nodes
  useEffect(() => {
    if (!containerRef.current || features.length === 0) return;

    const recalcLines = () => {
      const container = containerRef.current;
      if (!container) return;

      const centerNode = container.querySelector<HTMLElement>("[data-node='center']");
      const featureNodes = container.querySelectorAll<HTMLElement>("[data-node='feature']");
      if (!centerNode || featureNodes.length === 0) return;

      const containerRect = container.getBoundingClientRect();
      const centerRect = centerNode.getBoundingClientRect();
      const cx = centerRect.right - containerRect.left;
      const cy = centerRect.top + centerRect.height / 2 - containerRect.top;

      const newLines: typeof lines = [];
      featureNodes.forEach((node) => {
        const rect = node.getBoundingClientRect();
        const fx = rect.left - containerRect.left;
        const fy = rect.top + rect.height / 2 - containerRect.top;
        newLines.push({ x1: cx, y1: cy, x2: fx, y2: fy });
      });
      setLines(newLines);
    };

    // Small delay to let DOM settle
    const t = setTimeout(recalcLines, 100);
    return () => clearTimeout(t);
  }, [features, selectedFeature]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Memuat roadmap...</span>
        </div>
      </div>
    );
  }

  if (features.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-5 px-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Layers className="w-7 h-7 text-primary" />
        </div>
        <div>
          <p className="text-base font-semibold text-on-surface mb-1">Roadmap belum tersedia</p>
          <p className="text-sm text-text-secondary max-w-xs">
            AI akan memecah core features dari PRD menjadi spesifikasi fitur dan task detail.
          </p>
        </div>
        <button
          onClick={generateRoadmap}
          disabled={generating}
          className="flex items-center gap-2 px-5 py-2.5 bg-primary text-on-primary rounded-lg font-semibold text-sm hover:bg-primary-fixed transition-all disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed"
        >
          {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
          {generating ? "Membuat roadmap..." : "Generate Roadmap"}
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-hidden relative">
      {/* Roadmap canvas */}
      <div
        ref={containerRef}
        className="flex-1 relative flex items-center overflow-auto px-8 py-10"
        style={{ minHeight: "400px" }}
      >
        {/* SVG lines */}
        <svg
          ref={svgRef}
          className="absolute inset-0 pointer-events-none"
          style={{ width: "100%", height: "100%" }}
        >
          {lines.map((line, i) => (
            <line
              key={i}
              x1={line.x1}
              y1={line.y1}
              x2={line.x2}
              y2={line.y2}
              stroke="currentColor"
              strokeWidth="1.5"
              className="text-border-subtle opacity-60"
              strokeDasharray="0"
            />
          ))}
        </svg>

        {/* Layout: center node + feature nodes */}
        <div className="flex items-center gap-20 w-full">
          {/* Center node */}
          <div
            data-node="center"
            className="shrink-0 w-44 bg-surface-container-high rounded-xl border border-primary/30 px-4 py-5 shadow-lg shadow-primary/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center">
                <FileText className="w-3.5 h-3.5 text-primary" />
              </div>
              <span className="text-xs text-text-secondary font-medium">PRD</span>
            </div>
            <p className="text-sm font-bold text-on-surface leading-tight">Project Roadmap</p>
            <p className="text-xs text-text-secondary mt-1">Perencanaan</p>
          </div>

          {/* Feature nodes */}
          <div className="flex flex-col gap-4 flex-1 max-w-sm">
            {features.map((feature, idx) => {
              const Icon = ICON_MAP[feature.icon] || Layers;
              const taskCount = feature.tasks?.length ?? 0;
              const doneCount = feature.tasks?.filter((t: PrdTask) => t.status === "selesai").length ?? 0;
              const status = (feature.status as keyof typeof STATUS_COLORS) || "planned";

              return (
                <button
                  key={feature.id}
                  data-node="feature"
                  onClick={() => setSelectedFeature(feature)}
                  className={`text-left px-4 py-3 rounded-xl border transition-all duration-200 cursor-pointer hover:shadow-md group animate-fade-in-up ${
                    selectedFeature?.id === feature.id
                      ? "border-primary/50 bg-primary/5 shadow-md"
                      : "border-border-subtle bg-surface-container-high hover:border-primary/30"
                  }`}
                  style={{ animationDelay: `${idx * 60}ms` }}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="w-4 h-4 text-text-secondary group-hover:text-primary transition-colors" />
                      <span className="text-sm font-semibold text-on-surface">{feature.name}</span>
                    </div>
                    <span className="text-text-secondary opacity-40 group-hover:opacity-70 transition-opacity">›</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2">
                    <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${STATUS_DOT[status]}`} />
                      {STATUS_LABEL[status]}
                    </span>
                    {taskCount > 0 && (
                      <span className="text-xs text-text-secondary opacity-60">
                        {doneCount}/{taskCount}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Regenerate button */}
        <button
          onClick={generateRoadmap}
          disabled={generating}
          className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary bg-surface-container border border-border-subtle rounded-lg hover:border-primary/30 hover:text-primary transition-all cursor-pointer disabled:opacity-50"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {generating ? "Generating..." : "Generate ulang"}
        </button>
      </div>

      {/* Feature Detail Panel */}
      {selectedFeature && (
        <FeatureDetailPanel
          feature={selectedFeature}
          onClose={() => setSelectedFeature(null)}
        />
      )}
    </div>
  );
}
