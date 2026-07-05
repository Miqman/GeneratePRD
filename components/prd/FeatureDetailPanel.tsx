"use client";

import { X, Target, CheckCircle2, Puzzle, ListTodo } from "lucide-react";
import type { RoadmapFeature, PrdTask } from "@/lib/types";

const TASK_STATUS_COLORS = {
  belum_mulai: "bg-surface-container border-border-subtle text-text-secondary",
  dikerjakan: "bg-amber-500/10 border-amber-500/30 text-amber-400",
  selesai: "bg-primary/10 border-primary/30 text-primary",
  gagal: "bg-red-500/10 border-red-500/30 text-red-400",
};

const TASK_STATUS_DOT = {
  belum_mulai: "bg-text-secondary/30",
  dikerjakan: "bg-amber-400",
  selesai: "bg-primary",
  gagal: "bg-red-400",
};

const PRIORITY_BADGE = {
  utama: "bg-red-500/10 text-red-400 border-red-500/20",
  opsional: "bg-surface-container text-text-secondary border-border-subtle",
};

interface FeatureDetailPanelProps {
  feature: RoadmapFeature;
  onClose: () => void;
}

export function FeatureDetailPanel({ feature, onClose }: FeatureDetailPanelProps) {
  const tasks = feature.tasks || [];
  const doneCount = tasks.filter((t: PrdTask) => t.status === "selesai").length;

  return (
    <div className="w-[380px] shrink-0 h-full flex flex-col border-l border-border-subtle bg-surface-container-high overflow-y-auto animate-fade-in-up">
      {/* Header */}
      <div className="sticky top-0 bg-surface-container-high border-b border-border-subtle px-5 py-4 z-10">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
              <Target className="w-4 h-4 text-primary" />
            </div>
            <h2 className="font-bold text-on-surface text-sm truncate">{feature.name}</h2>
          </div>
          <button
            onClick={onClose}
            className="w-6 h-6 flex items-center justify-center rounded text-text-secondary hover:text-on-surface hover:bg-surface-container transition-colors cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="flex items-center gap-2 mt-2.5 flex-wrap">
          <span className="text-xs px-2 py-0.5 rounded-full bg-surface-container border border-border-subtle text-text-secondary">
            {feature.phase}
          </span>
          <span className={`text-xs px-2 py-0.5 rounded-full border ${
            feature.priority === "high"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : feature.priority === "medium"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-surface-container text-text-secondary border-border-subtle"
          }`}>
            {feature.priority === "high" ? "Prioritas Tinggi" : feature.priority === "medium" ? "Prioritas Sedang" : "Prioritas Rendah"}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 px-5 py-4 space-y-6">
        {/* Description */}
        <p className="text-sm text-text-secondary leading-relaxed">{feature.description}</p>

        {/* Specification: Goal + Done When */}
        <div>
          <p className="text-xs font-bold text-text-secondary uppercase tracking-wider mb-3">Spesifikasi</p>

          <div className="mb-4">
            <div className="flex items-center gap-1.5 mb-1.5">
              <Target className="w-3.5 h-3.5 text-primary" />
              <h3 className="text-sm font-semibold text-on-surface">Tujuan</h3>
            </div>
            <p className="text-sm text-text-secondary leading-relaxed pl-5">{feature.goal}</p>
          </div>

          {feature.doneWhen && feature.doneWhen.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
                <h3 className="text-sm font-semibold text-on-surface">Selesai bila</h3>
              </div>
              <ul className="space-y-1.5 pl-5">
                {feature.doneWhen.map((criteria: string, i: number) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-text-secondary">
                    <span className="w-1.5 h-1.5 rounded-full bg-primary/50 mt-2 shrink-0" />
                    {criteria}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Sub-features */}
        {feature.subFeatures && feature.subFeatures.length > 0 && (
          <div>
            <div className="flex items-center gap-1.5 mb-3">
              <Puzzle className="w-3.5 h-3.5 text-text-secondary" />
              <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                Sub-fitur ({feature.subFeatures.length})
              </p>
            </div>
            <div className="space-y-2">
              {feature.subFeatures.map((sf: { name: string; description: string }, i: number) => (
                <div key={i} className="p-3 rounded-lg bg-surface-container border border-border-subtle">
                  <p className="text-sm font-semibold text-on-surface mb-0.5">{sf.name}</p>
                  <p className="text-xs text-text-secondary leading-relaxed">{sf.description}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tasks */}
        {tasks.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-1.5">
                <ListTodo className="w-3.5 h-3.5 text-text-secondary" />
                <p className="text-xs font-bold text-text-secondary uppercase tracking-wider">
                  Task ({tasks.length})
                </p>
              </div>
              {doneCount > 0 && (
                <span className="text-xs text-primary">
                  {doneCount}/{tasks.length} selesai
                </span>
              )}
            </div>
            <div className="space-y-1.5">
              {tasks.map((task: PrdTask) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2.5 p-2.5 rounded-lg hover:bg-surface-container transition-colors"
                >
                  <span className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${TASK_STATUS_DOT[task.status as keyof typeof TASK_STATUS_DOT] || TASK_STATUS_DOT.belum_mulai}`} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-on-surface leading-snug line-clamp-2">{task.title}</p>
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded border shrink-0 ${PRIORITY_BADGE[task.priority as keyof typeof PRIORITY_BADGE] || PRIORITY_BADGE.utama}`}>
                    {task.priority}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
