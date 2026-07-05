"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, Circle, Clock, CheckCircle2, XCircle, Layers } from "lucide-react";
import type { PrdTask, TaskStatus } from "@/lib/types";

const COLUMNS: { key: TaskStatus; label: string; icon: React.ElementType; color: string; headerColor: string }[] = [
  { key: "belum_mulai", label: "Belum Mulai", icon: Circle, color: "text-text-secondary", headerColor: "border-border-subtle" },
  { key: "dikerjakan", label: "Dikerjakan", icon: Clock, color: "text-amber-400", headerColor: "border-amber-400/50" },
  { key: "selesai", label: "Selesai", icon: CheckCircle2, color: "text-primary", headerColor: "border-primary/50" },
  { key: "gagal", label: "Gagal", icon: XCircle, color: "text-red-400", headerColor: "border-red-400/50" },
];

const FEATURE_COLORS = [
  "bg-primary/10 text-primary border-primary/20",
  "bg-secondary/10 text-secondary border-secondary/20",
  "bg-amber-500/10 text-amber-400 border-amber-500/20",
  "bg-purple-500/10 text-purple-400 border-purple-500/20",
  "bg-blue-500/10 text-blue-400 border-blue-500/20",
  "bg-rose-500/10 text-rose-400 border-rose-500/20",
];

interface TaskBoardProps {
  sessionId: string;
}

export function TaskBoard({ sessionId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<PrdTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(true);

  // Build feature → color index map
  const featureColorMap = useRef<Record<string, number>>({});
  const colorCounter = useRef(0);
  const getFeatureColor = (featureName: string) => {
    if (featureColorMap.current[featureName] === undefined) {
      featureColorMap.current[featureName] = colorCounter.current % FEATURE_COLORS.length;
      colorCounter.current++;
    }
    return FEATURE_COLORS[featureColorMap.current[featureName]];
  };

  const fetchTasks = useCallback(async (silent = false) => {
    if (!isActiveRef.current) return;
    if (!silent) setLoading(true);
    try {
      const res = await fetch(`/api/prd/${sessionId}/tasks`);
      if (res.ok && isActiveRef.current) {
        const data = await res.json();
        setTasks(data.tasks || []);
      }
    } catch {
      // silently fail
    } finally {
      if (!silent) setLoading(false);
    }
  }, [sessionId]);

  useEffect(() => {
    isActiveRef.current = true;
    fetchTasks();

    // Poll every 5 seconds for AI agent updates
    pollingRef.current = setInterval(() => fetchTasks(true), 5000);
    return () => {
      isActiveRef.current = false;
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [fetchTasks]);

  const handleStatusChange = async (task: PrdTask, newStatus: TaskStatus) => {
    setUpdatingId(task.id);
    try {
      const res = await fetch(`/api/prd/${sessionId}/tasks/${task.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setTasks((prev) =>
          prev.map((t) => (t.id === task.id ? { ...t, status: newStatus } : t))
        );
      }
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm">Memuat tasks...</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Layers className="w-6 h-6 text-primary" />
        </div>
        <div>
          <p className="text-base font-semibold text-on-surface mb-1">Belum ada task</p>
          <p className="text-sm text-text-secondary max-w-xs">
            Generate roadmap terlebih dahulu dari tab Roadmap. Task akan muncul di sini secara otomatis.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex overflow-x-auto gap-4 p-5 min-h-0">
      {COLUMNS.map(({ key, label, icon: Icon, color, headerColor }) => {
        const columnTasks = tasks.filter((t) => t.status === key);
        return (
          <div key={key} className="flex flex-col w-72 shrink-0">
            {/* Column header */}
            <div className={`flex items-center gap-2 px-3 pb-3 border-b mb-3 ${headerColor}`}>
              <Icon className={`w-4 h-4 ${color}`} />
              <span className="text-sm font-semibold text-on-surface">{label}</span>
              <span className="ml-auto text-xs text-text-secondary bg-surface-container px-2 py-0.5 rounded-full border border-border-subtle">
                {columnTasks.length}
              </span>
            </div>

            {/* Task cards */}
            <div className="flex flex-col gap-2.5 flex-1 overflow-y-auto pb-2">
              {columnTasks.length === 0 ? (
                <div className="flex-1 flex items-center justify-center py-10">
                  <p className="text-xs text-text-secondary/50">Kosong</p>
                </div>
              ) : (
                columnTasks.map((task) => (
                  <div
                    key={task.id}
                    className="bg-surface-container-high border border-border-subtle rounded-xl p-3.5 hover:border-primary/20 transition-all group"
                  >
                    {/* Feature badge */}
                    <div className={`inline-flex text-[10px] px-2 py-0.5 rounded-full border font-medium mb-2 ${getFeatureColor(task.featureName)}`}>
                      {task.featureName}
                    </div>

                    {/* Task title */}
                    <p className="text-sm font-semibold text-on-surface leading-snug mb-1.5 line-clamp-2">
                      {task.title}
                    </p>

                    {/* Description */}
                    <p className="text-xs text-text-secondary leading-relaxed line-clamp-2 mb-3">
                      {task.description}
                    </p>

                    {/* Footer: priority + status change */}
                    <div className="flex items-center justify-between">
                      <span className={`text-[10px] px-2 py-0.5 rounded-full border ${
                        task.priority === "utama"
                          ? "bg-red-500/10 text-red-400 border-red-500/20"
                          : "bg-surface-container text-text-secondary border-border-subtle"
                      }`}>
                        {task.priority === "utama" ? "Utama" : "Opsional"}
                      </span>

                      {/* Status change dropdown */}
                      <div className="relative">
                        <select
                          value={task.status}
                          onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                          disabled={updatingId === task.id}
                          className="text-[10px] bg-surface-container border border-border-subtle rounded-lg px-2 py-1 text-text-secondary cursor-pointer hover:border-primary/30 transition-colors appearance-none pr-5 disabled:opacity-50 outline-none"
                        >
                          <option value="belum_mulai">Belum mulai</option>
                          <option value="dikerjakan">Dikerjakan</option>
                          <option value="selesai">Selesai</option>
                          <option value="gagal">Gagal</option>
                        </select>
                        {updatingId === task.id && (
                          <Loader2 className="w-3 h-3 animate-spin absolute right-1.5 top-1/2 -translate-y-1/2 text-primary" />
                        )}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
