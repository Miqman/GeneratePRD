"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FileText, Plus, Trash2, Clock, X } from "lucide-react";
import type { PRDSession } from "@/lib/types";
import { formatDistanceToNow } from "@/lib/utils-date";

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const pathname = usePathname();
  const [sessions, setSessions] = useState<PRDSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      loadSessions();
    }
  }, [open]);

  const loadSessions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/prd");
      if (res.ok) {
        const data = await res.json();
        setSessions(data.sessions || []);
      }
    } catch {
      // silent
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    await fetch(`/api/prd/${id}`, { method: "DELETE" });
    setSessions((prev) => prev.filter((s) => s.id !== id));
  };

  // Group sessions by date
  const grouped = groupByDate(sessions);

  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent
        side="left"
        showCloseButton={false}
        className="w-72 bg-card border-border p-0 flex flex-col"
      >
        <SheetHeader className="px-4 py-4 border-b border-border/50">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <button
                onClick={onClose}
                className="p-1 rounded-md hover:bg-muted/60 text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <SheetTitle className="text-sm font-extrabold text-foreground tracking-tight">
                Rancang<span className="text-primary">.ai</span>
              </SheetTitle>
            </div>
            <Link href="/" onClick={onClose}>
              <Button
                id="new-prd-btn"
                size="sm"
                className="h-7 px-2.5 text-xs gap-1 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/30 hover:border-primary/50 cursor-pointer"
                variant="ghost"
              >
                <Plus className="w-3 h-3" />
                Baru
              </Button>
            </Link>
          </div>
        </SheetHeader>

        <ScrollArea className="flex-1">
          <div className="px-3 py-3">
            {isLoading ? (
              <div className="space-y-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-14 rounded-lg bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : sessions.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center space-y-3">
                <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center">
                  <FileText className="w-6 h-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-sm font-medium text-foreground">Belum ada PRD</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    Buat PRD pertamamu di halaman utama
                  </p>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                {Object.entries(grouped).map(([dateLabel, items]) => (
                  <div key={dateLabel}>
                    <p className="text-xs text-muted-foreground/60 font-medium px-2 mb-1.5 uppercase tracking-wider">
                      {dateLabel}
                    </p>
                    <div className="space-y-1">
                      {items.map((session) => {
                        const isActive = pathname === `/prd/${session.id}`;
                        return (
                          <Link
                            key={session.id}
                            href={`/prd/${session.id}`}
                            onClick={onClose}
                            className={`group flex items-start gap-2.5 rounded-lg px-3 py-2.5 transition-all ${isActive
                                ? "bg-primary/15 border border-primary/30"
                                : "hover:bg-muted/60 border border-transparent"
                              }`}
                          >
                            <FileText
                              className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? "text-primary" : "text-muted-foreground"
                                }`}
                            />
                            <div className="flex-1 min-w-0">
                              <p
                                className={`text-xs font-medium leading-snug line-clamp-2 ${isActive ? "text-foreground" : "text-muted-foreground"
                                  }`}
                              >
                                {session.title}
                              </p>
                              <div className="flex items-center gap-1.5 mt-1">
                                <Clock className="w-2.5 h-2.5 text-muted-foreground/50" />
                                <span className="text-muted-foreground/50 text-[10px]">
                                  {formatDistanceToNow(new Date(session.createdAt))}
                                </span>
                                {session.versions && session.versions.length > 1 && (
                                  <Badge
                                    variant="secondary"
                                    className="text-[9px] px-1 py-0 h-4 bg-primary/10 text-primary border-0"
                                  >
                                    v{session.versions[0]?.versionNumber}
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <button
                              onClick={(e) => handleDelete(session.id, e)}
                              className="opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:text-destructive text-muted-foreground/50"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </ScrollArea>
      </SheetContent>
    </Sheet>
  );
}

function groupByDate(sessions: PRDSession[]): Record<string, PRDSession[]> {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 86400000);
  const weekAgo = new Date(today.getTime() - 7 * 86400000);

  const groups: Record<string, PRDSession[]> = {};

  for (const s of sessions) {
    const d = new Date(s.createdAt);
    const day = new Date(d.getFullYear(), d.getMonth(), d.getDate());

    let label: string;
    if (day >= today) label = "Hari ini";
    else if (day >= yesterday) label = "Kemarin";
    else if (day >= weekAgo) label = "7 hari terakhir";
    else
      label = d.toLocaleDateString("id-ID", { month: "long", year: "numeric" });

    if (!groups[label]) groups[label] = [];
    groups[label].push(s);
  }

  return groups;
}
