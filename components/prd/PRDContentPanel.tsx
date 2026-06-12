"use client";

import { useCallback, useRef, useMemo } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { MermaidDiagram } from "./MermaidDiagram";

interface PRDContentPanelProps {
  content: string;
  viewMode: "preview" | "code";
  onSectionVisible: (sectionId: string) => void;
  isRevising: boolean;
}

// Custom heading renderer that adds IDs for scroll tracking
function HeadingWithId({
  level,
  children,
  ...props
}: {
  level: number;
  children: React.ReactNode;
  [key: string]: unknown;
}) {
  const text = typeof children === "string" ? children : "";
  const id = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");

  const Tag = `h${level}` as React.ElementType;
  return (
    <Tag id={`section-${id}`} {...props}>
      {children}
    </Tag>
  );
}

/**
 * Walk the offsetParent chain to get an element's top position
 * relative to a specific ancestor container.
 */
function getOffsetTopRelativeTo(el: HTMLElement, container: HTMLElement): number {
  let top = 0;
  let current: HTMLElement | null = el;
  while (current && current !== container) {
    top += current.offsetTop;
    current = current.offsetParent as HTMLElement | null;
  }
  return top;
}

export function PRDContentPanel({
  content,
  viewMode,
  onSectionVisible,
  isRevising,
}: PRDContentPanelProps) {
  // scrollRef: the native scrollable div — we attach onScroll directly here
  const scrollRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastActiveSectionRef = useRef<string>("");

  const handleScroll = useCallback(() => {
    const scroll = scrollRef.current;
    const container = containerRef.current;
    if (!scroll || !container) return;

    const headings = Array.from(
      container.querySelectorAll("h2[id], h3[id]")
    ) as HTMLElement[];
    if (headings.length === 0) return;

    const scrollTop = scroll.scrollTop;
    const threshold = 130; // px from top of scroll container

    // Find the last heading whose top (relative to scroll container) is within threshold
    let active = headings[0];
    for (const heading of headings) {
      const headingTop = getOffsetTopRelativeTo(heading, scroll);
      if (headingTop <= scrollTop + threshold) {
        active = heading;
      } else {
        break;
      }
    }

    const activeSectionId = active.id.replace("section-", "");
    if (activeSectionId !== lastActiveSectionRef.current) {
      lastActiveSectionRef.current = activeSectionId;
      onSectionVisible(activeSectionId);
    }
  }, [onSectionVisible]);

  if (isRevising) {
    return (
      <main className="flex-1 min-h-0 overflow-hidden flex flex-col">
        <ScrollArea className="flex-1 h-full">
          <div className="max-w-3xl mx-auto px-8 py-8 space-y-4">
            <div className="flex items-center gap-3 py-4 px-5 rounded-xl bg-primary/8 border border-primary/20 mb-6">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot" />
                <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot" />
                <span className="w-2 h-2 rounded-full bg-primary animate-typing-dot" />
              </div>
              <span className="text-sm text-muted-foreground">
                AI sedang merevisi PRD...
              </span>
            </div>
            <Skeleton className="h-8 w-3/4 bg-muted/50" />
            <Skeleton className="h-4 w-full bg-muted/30" />
            <Skeleton className="h-4 w-5/6 bg-muted/30" />
            <Skeleton className="h-4 w-4/5 bg-muted/30" />
            <div className="pt-4">
              <Skeleton className="h-6 w-1/3 bg-muted/50 mb-3" />
              <Skeleton className="h-4 w-full bg-muted/30" />
              <Skeleton className="h-4 w-11/12 bg-muted/30 mt-2" />
              <Skeleton className="h-4 w-4/5 bg-muted/30 mt-2" />
            </div>
          </div>
        </ScrollArea>
      </main>
    );
  }

  // Memoize markdown components to avoid destroying and re-creating elements on every scroll/render
  const markdownComponents = useMemo(
    () => ({
      h1: ({ children, ...props }: any) => (
        <HeadingWithId level={1} {...props}>
          {children}
        </HeadingWithId>
      ),
      h2: ({ children, ...props }: any) => (
        <HeadingWithId level={2} {...props}>
          {children}
        </HeadingWithId>
      ),
      h3: ({ children, ...props }: any) => (
        <HeadingWithId level={3} {...props}>
          {children}
        </HeadingWithId>
      ),
      code({ className, children, ...rest }: any) {
        const lang = /language-(\w+)/.exec(className ?? "")?.[1];
        if (lang === "mermaid") {
          return <MermaidDiagram chart={String(children).replace(/\n$/, "")} />;
        }
        return (
          <code className={className} {...rest}>
            {children}
          </code>
        );
      },
    }),
    []
  );

  return (
    <main className="flex-1 min-h-0 overflow-hidden flex flex-col bg-background">
      {/*
        Native div with overflow-y-auto instead of Radix ScrollArea.
        This lets us attach onScroll directly — no need to hunt for
        [data-radix-scroll-area-viewport] deep inside Radix's DOM.
      */}
      <div
        ref={scrollRef}
        onScroll={handleScroll}
        className="prd-scroll flex-1 min-h-0 overflow-y-auto overflow-x-hidden"
      >
        <div
          ref={containerRef}
          className="max-w-3xl mx-auto px-6 md:px-10 py-8 animate-fade-in-up"
        >
          {viewMode === "preview" ? (
            <div className="prd-content">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                components={markdownComponents}
              >
                {content}
              </ReactMarkdown>
            </div>
          ) : (
            <div className="relative">
              <div className="sticky top-0 right-0 flex justify-end mb-2">
                <span className="text-xs text-muted-foreground/50 bg-card px-2 py-1 rounded border border-border/50">
                  Markdown Source
                </span>
              </div>
              <pre className="text-xs leading-relaxed font-mono text-muted-foreground bg-card border border-border rounded-xl p-6 overflow-x-auto whitespace-pre-wrap break-words">
                {content}
              </pre>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
