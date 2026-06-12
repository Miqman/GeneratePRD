"use client";

import { useMemo, useEffect, useRef } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { FileText } from "lucide-react";

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

function extractSections(content: string): Section[] {
  const lines = content.split("\n");
  const sections: Section[] = [];

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
      sections.push({ id: anchor, title, level: 2, anchor });
    } else if (h3Match && sections.length > 0) {
      const title = h3Match[1].trim();
      const anchor = title
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/-+/g, "-");
      sections.push({ id: anchor, title, level: 3, anchor });
    }
  }

  return sections;
}

export function PRDStructurePanel({
  content,
  activeSection,
  onSectionClick,
}: PRDStructurePanelProps) {
  const sections = useMemo(() => extractSections(content), [content]);
  const navRef = useRef<HTMLElement>(null);

  const handleClick = (section: Section) => {
    onSectionClick(section.id);
    const el = document.getElementById(`section-${section.anchor}`);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
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
    <aside className="w-52 shrink-0 border-r border-border/60 bg-card/30 flex flex-col overflow-hidden hidden md:flex">
      {/* Header */}
      <div className="px-4 py-3 border-b border-border/40">
        <div className="flex items-center gap-2">
          <FileText className="w-3.5 h-3.5 text-primary shrink-0" />
          <p className="text-xs font-semibold text-foreground leading-tight">
            PRD — Project Requirements Document
          </p>
        </div>
      </div>

      {/* Sections list */}
      <ScrollArea className="flex-1">
        <nav ref={navRef} className="px-2 py-3 space-y-0.5">
          {sections.map((section) => {
            const isActive = activeSection === section.id;
            return (
              <button
                key={section.id}
                data-section-id={section.id}
                onClick={() => handleClick(section)}
                className={`w-full text-left transition-all rounded-md group ${
                  section.level === 2 ? "px-2.5 py-1.5" : "pl-5 pr-2.5 py-1"
                } ${
                  isActive
                    ? section.level === 2
                      ? "bg-primary/12 text-primary"
                      : "text-primary/80"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                <span
                  className={`leading-snug block ${
                    section.level === 2
                      ? "text-xs font-medium"
                      : "text-[11px] font-normal"
                  }`}
                >
                  {section.level === 3 && (
                    <span className="text-muted-foreground/40 mr-1">—</span>
                  )}
                  {section.title}
                </span>
              </button>
            );
          })}
        </nav>
      </ScrollArea>
    </aside>
  );
}
