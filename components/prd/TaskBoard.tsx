"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { Loader2, ChevronDown } from "lucide-react";
import type { PrdTask, TaskStatus } from "@/lib/types";

const COLUMNS: {
  key: TaskStatus;
  label: string;
  color: string;
}[] = [
  { key: "belum_mulai", label: "Belum mulai", color: "text-muted-foreground" },
  { key: "dikerjakan", label: "Dikerjakan", color: "text-amber-500" },
  { key: "selesai", label: "Selesai", color: "text-emerald-500" },
  { key: "gagal", label: "Gagal", color: "text-red-500" },
];

interface TaskBoardProps {
  sessionId: string;
}

export function TaskBoard({ sessionId }: TaskBoardProps) {
  const [tasks, setTasks] = useState<PrdTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [selectedFeature, setSelectedFeature] = useState<string>("all");
  const pollingRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isActiveRef = useRef(true);

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

  const getStatusIcon = (status: TaskStatus, className = "size-3.5") => {
    switch (status) {
      case "selesai":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} shrink-0 text-emerald-500`}
          >
            <path
              d="M5 14L8.5 17.5L19 6.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
            />
          </svg>
        );
      case "gagal":
        return (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            className={`${className} shrink-0 text-red-500`}
          >
            <path
              d="M22 12C22 6.47715 17.5228 2 12 2C6.47715 2 2 6.47715 2 12C2 17.5228 6.47715 22 12 22C17.5228 22 22 17.5228 22 12Z"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
            <path
              d="M14.9994 15L9 9M9.00064 15L15 9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        );
      case "dikerjakan":
        return (
          <svg
            viewBox="0 0 24 24"
            fill="none"
            aria-hidden="true"
            className={`animate-spin ${className} shrink-0 text-amber-500`}
          >
            <circle
              cx="12"
              cy="12"
              r="9"
              stroke="currentColor"
              strokeOpacity="0.25"
              strokeWidth="3"
            />
            <path
              d="M21 12a9 9 0 0 0-9-9"
              stroke="currentColor"
              strokeWidth="3"
              strokeLinecap="round"
            />
          </svg>
        );
      case "belum_mulai":
      default:
        return (
          <span className={`${className} shrink-0 rounded-full border-2 border-border`} />
        );
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="flex items-center gap-3 text-text-secondary">
          <Loader2 className="w-5 h-5 animate-spin" />
          <span className="text-sm font-medium">Memuat tasks...</span>
        </div>
      </div>
    );
  }

  if (tasks.length === 0) {
    return (
      <div className="flex-1 flex items-center justify-center flex-col gap-4 text-center px-6">
        <div className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6 text-primary"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6.429 9.75L2.25 12l4.179 2.25m0-4.5l5.571 3 5.571-3m-11.142 0L12 7.5l5.571 2.25m0 0L21.75 12l-4.179 2.25m0 0l-5.571 3-5.571-3"
            />
          </svg>
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

  // Filter features
  const uniqueFeatures = Array.from(new Set(tasks.map((t) => t.featureName).filter(Boolean)));
  const filteredTasks = selectedFeature === "all"
    ? tasks
    : tasks.filter((t) => t.featureName === selectedFeature);

  const totalTasks = tasks.length;
  const completedTasks = tasks.filter((t) => t.status === "selesai").length;
  const progressPercentage = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  return (
    <div className="min-h-0 flex-1 overflow-hidden flex flex-col">
      <div className="mx-auto flex h-full w-full max-w-6xl flex-col p-4 sm:p-6 min-h-0">
        {/* Top Banner / Info */}
        <p className="text-xs text-text-secondary mb-4 text-center shrink-0">
          Status task diperbarui otomatis oleh agent saat mengerjakan lewat CLI dan langsung muncul di board ini — kamu tidak perlu mengubahnya manual.
        </p>

        {/* Info Row: Filter + Progress Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-5 bg-surface-container/20 p-4 rounded-2xl border border-border-subtle/30 shrink-0">
          {/* Dropdown Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedFeature}
              onChange={(e) => setSelectedFeature(e.target.value)}
              className="appearance-none bg-surface-container-high border border-border-subtle rounded-xl px-4 py-2 pr-10 text-xs font-bold text-on-surface cursor-pointer hover:border-primary/30 transition-colors outline-none min-w-[180px] w-full sm:w-auto"
            >
              <option value="all">Semua fitur</option>
              {uniqueFeatures.map((feat) => (
                <option key={feat} value={feat}>
                  {feat}
                </option>
              ))}
            </select>
            <ChevronDown className="w-3.5 h-3.5 text-text-secondary absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Progress Bar Track */}
          <div className="flex-1 flex items-center gap-3 w-full">
            <div className="flex-1 bg-surface-container-highest dark:bg-surface-container h-2 rounded-full overflow-hidden relative">
              <div
                className="bg-primary h-full transition-all duration-500 ease-out rounded-full"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>

            {/* Completed Text */}
            <span className="text-xs font-bold text-text-secondary shrink-0 min-w-[80px] text-right">
              {completedTasks}/{totalTasks} selesai
            </span>
          </div>
        </div>

        {/* Columns Grid */}
        <div className="grid min-h-0 flex-1 auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {COLUMNS.map(({ key, label, color }) => {
            const columnTasks = filteredTasks.filter((t) => t.status === key);
            return (
              <div
                key={key}
                className="flex min-h-0 flex-col rounded-xl border border-border bg-muted/30"
              >
                {/* Column Header */}
                <div className="flex shrink-0 items-center justify-between px-3 py-2.5">
                  <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                    {getStatusIcon(key, "size-3.5")}
                    {label}
                  </span>
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {columnTasks.length}
                  </span>
                </div>

                {/* Task Cards Container */}
                <div className="no-scrollbar flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto px-2 pb-2">
                  {columnTasks.length === 0 ? (
                    <p className="px-2 py-3 text-center text-xs text-muted-foreground/60">Kosong</p>
                  ) : (
                    columnTasks.map((task) => (
                      <div
                        key={task.id}
                        className="rounded-lg border border-border bg-card p-3 flex flex-col justify-between gap-3 shrink-0"
                      >
                        <div>
                          {/* Card Header (Feature + Priority) */}
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <span className="flex min-w-0 items-center gap-1.5">
                              {getStatusIcon(task.status, "size-3.5")}
                              <span className="truncate text-[11px] font-medium text-muted-foreground">
                                {task.featureName}
                              </span>
                            </span>
                            <span className="flex shrink-0 items-center gap-1.5">
                              {task.priority === "utama" ? (
                                <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-semibold text-primary">
                                  <svg width="11" height="10" viewBox="0 0 11 10" className="shrink-0">
                                    <rect x="0" y="6" width="2.5" height="4" rx="0.5" fill="currentColor" opacity="1"></rect>
                                    <rect x="4" y="3" width="2.5" height="7" rx="0.5" fill="currentColor" opacity="1"></rect>
                                    <rect x="8" y="0" width="2.5" height="10" rx="0.5" fill="currentColor" opacity="1"></rect>
                                  </svg>
                                  Utama
                                </span>
                              ) : (
                                <span className="text-muted-foreground/80 text-[10px] font-medium">
                                  Opsional
                                </span>
                              )}
                            </span>
                          </div>

                          {/* Task Title */}
                          <p className="text-sm font-medium text-foreground leading-snug">
                            {task.title}
                          </p>

                          {/* Description */}
                          <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">
                            {task.description}
                          </p>
                        </div>

                        {/* Dropdown status update */}
                        <div className="flex items-center justify-between pt-2.5 border-t border-border/40 shrink-0">
                          <span className="text-[10px] font-medium text-muted-foreground/70">Status</span>
                          <div className="relative">
                            <select
                              value={task.status}
                              onChange={(e) => handleStatusChange(task, e.target.value as TaskStatus)}
                              disabled={updatingId === task.id}
                              className="text-[10px] font-bold bg-muted border border-border rounded-lg px-2.5 py-1 text-muted-foreground cursor-pointer hover:text-foreground transition-colors appearance-none pr-6 disabled:opacity-50 outline-none"
                            >
                              <option value="belum_mulai">Belum mulai</option>
                              <option value="dikerjakan">Dikerjakan</option>
                              <option value="selesai">Selesai</option>
                              <option value="gagal">Gagal</option>
                            </select>
                            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                            {updatingId === task.id && (
                              <Loader2 className="w-3 h-3 animate-spin absolute -left-4.5 top-1/2 -translate-y-1/2 text-primary" />
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
      </div>
    </div>
  );
}
