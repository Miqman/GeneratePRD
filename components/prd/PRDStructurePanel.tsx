"use client";

import { useMemo, useState, useEffect, useRef } from "react";
import { FileText, ChevronRight } from "lucide-react";

interface PRDStructurePanelProps {
  content: string;
  activeSection: string;
  onSectionClick: (section: string) => void;
}

interface Section {
  id: string;
  title: string;
  level: number;
  anchor: string;
}

interface SectionGroup {
  id: string;
  title: string;
  anchor: string;
  children: Section[];
}

function extractSectionGroups(content: string): SectionGroup[] {
  const lines = content.split("\n");
  const groups: SectionGroup[] = [];
  let currentGroup: SectionGroup | null = null;

  for (const line of lines) {
    const h2Match = line.match(/^## (.+)/);
    const h3Match = line.match(/^### (.+)/);

    if (h2Match) {
      const title = h2Match[1].trim();
      const anchor = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      currentGroup = { id: anchor, title, anchor, children: [] };
      groups.push(currentGroup);
    } else if (h3Match && currentGroup) {
      const title = h3Match[1].trim();
      const anchor = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      currentGroup.children.push({ id: anchor, title, level: 3, anchor });
    }
  }

  return groups;
}

export function PRDStructurePanel({
  content,
  activeSection,
  onSectionClick,
}: PRDStructurePanelProps) {
  const groups = useMemo(() => extractSectionGroups(content), [content]);
  const navRef = useRef<HTMLElement>(null);
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  const toggleExpand = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleClick = (anchor: string) => {
    onSectionClick(anchor);
    const el = document.getElementById(`section-${anchor}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const handleGroupClick = (group: SectionGroup) => {
    handleClick(group.anchor);
    // Auto-expand when clicking the group header
    if (!expanded[group.id]) {
      setExpanded((prev) => ({ ...prev, [group.id]: true }));
    }
  };

  // Auto-scroll active nav item into view when activeSection changes
  useEffect(() => {
    if (!navRef.current) return;
    const activeEl = navRef.current.querySelector<HTMLElement>(
      `[data-section-id="${activeSection}"]`
    );
    if (activeEl) {
      activeEl.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [activeSection]);

  return (
    <aside className="flex flex-col overflow-hidden hidden md:flex">
      {/* Header */}
      <div className="px-4 py-3 shrink-0">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs font-semibold text-foreground leading-tight">
            PRD — Project Requirements Document
          </p>
        </div>
      </div>

      {/* Sections list — native scroll div (same approach as PRDContentPanel) */}
      <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">
        <nav ref={navRef} className="px-2 py-3 space-y-0.5">
          {groups.map((group) => {
            const isActive = activeSection === group.id;
            const hasChildren = group.children.length > 0;
            const isExpanded = !!expanded[group.id];

            return (
              <div key={group.id}>
                <div
                  className={`w-full text-left transition-all rounded-md px-2.5 py-1.5 flex items-center gap-1 group ${isActive
                    ? "bg-primary/12 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                    }`}
                >
                  {hasChildren ? (
                    <button
                      onClick={(e) => toggleExpand(group.id, e)}
                      className="p-0.5 rounded hover:bg-muted/50 shrink-0"
                      aria-label={isExpanded ? "Collapse" : "Expand"}
                    >
                      <ChevronRight
                        className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? "rotate-90" : ""
                          } ${isActive ? "text-primary/60" : "text-muted-foreground/40"}`}
                      />
                    </button>
                  ) : (
                    <span className="w-4 shrink-0" />
                  )}
                  <button
                    data-section-id={group.id}
                    onClick={() => handleGroupClick(group)}
                    className="flex-1 min-w-0 text-left"
                  >
                    <span className="text-xs font-medium leading-snug block truncate">
                      {group.title}
                    </span>
                  </button>
                </div>

                {/* Collapsible sub-sections */}
                {hasChildren && isExpanded && (
                  <div className="mt-0.5 space-y-0.5">
                    {group.children.map((child) => {
                      const isChildActive = activeSection === child.id;
                      return (
                        <button
                          key={child.id}
                          data-section-id={child.id}
                          onClick={() => handleClick(child.anchor)}
                          className={`w-full text-left transition-all rounded-md pl-7 pr-2.5 py-1 ${isChildActive
                            ? "text-primary/80"
                            : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            }`}
                        >
                          <span className="text-[11px] font-normal leading-snug block">
                            <span className="text-muted-foreground/40 mr-1">—</span>
                            {child.title}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}
