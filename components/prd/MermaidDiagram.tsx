"use client";

import { useEffect, useRef, useState } from "react";

interface MermaidDiagramProps {
  chart: string;
}

let mermaidInitialized = false;

/** Reserved words in Mermaid erDiagram that cause parse errors when used as attribute names */
const MERMAID_ERD_RESERVED = new Set([
  "type", "end", "direction", "link", "style", "class",
]);

/** Sanitize erDiagram syntax to avoid Mermaid parse errors */
function sanitizeMermaidChart(chart: string): string {
  return chart
    .split("\n")
    .map((line) => {
      const trimmed = line.trim();
      // Match erDiagram attribute lines: "datatype name [PK|FK|...]"
      const match = trimmed.match(/^(\w+)\s+(\w+)(\s+(?:PK|FK|UK|PF).*)?$/);
      if (match) {
        const [, dataType, attrName, rest] = match;
        if (MERMAID_ERD_RESERVED.has(attrName.toLowerCase())) {
          const indent = line.match(/^(\s*)/)?.[1] || "";
          return `${indent}${dataType} ${attrName}_name${rest || ""}`;
        }
      }
      return line;
    })
    .join("\n");
}

export function MermaidDiagram({ chart }: MermaidDiagramProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [svg, setSvg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function render() {
      try {
        const mermaid = (await import("mermaid")).default;

        if (!mermaidInitialized) {
          mermaid.initialize({
            startOnLoad: false,
            theme: "dark",
            themeVariables: {
              background: "transparent",
              primaryColor: "#5eed89",
              primaryTextColor: "#e2e8f0",
              primaryBorderColor: "#334155",
              lineColor: "#94a3b8",
              secondaryColor: "#1e293b",
              tertiaryColor: "#0f172a",
              edgeLabelBackground: "#1e293b",
              fontFamily: "Manrope, sans-serif",
              fontSize: "13px",
              // Sequence diagram specific
              actorBkg: "#1e293b",
              actorBorder: "#334155",
              actorTextColor: "#e2e8f0",
              actorLineColor: "#475569",
              signalColor: "#94a3b8",
              signalTextColor: "#e2e8f0",
              labelBoxBkgColor: "#0f172a",
              labelBoxBorderColor: "#334155",
              labelTextColor: "#e2e8f0",
              loopTextColor: "#e2e8f0",
              noteBorderColor: "#334155",
              noteBkgColor: "#1e293b",
              noteTextColor: "#e2e8f0",
              activationBorderColor: "#5eed89",
              activationBkgColor: "#1e293b",
            },
          });
          mermaidInitialized = true;
        }

        const id = `mermaid-${Math.random().toString(36).slice(2)}`;
        const sanitizedChart = sanitizeMermaidChart(chart.trim());
        const { svg: renderedSvg } = await mermaid.render(id, sanitizedChart);
        if (!cancelled) {
          setSvg(renderedSvg);
          setError(null);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Mermaid render error:", err);
          setError(err instanceof Error ? err.message : "Diagram render failed");
        }
      }
    }

    render();
    return () => {
      cancelled = true;
    };
  }, [chart]);

  if (error) {
    return (
      <div className="my-4 rounded-lg border border-amber-500/30 bg-amber-500/5 px-4 py-3">
        <p className="text-xs text-amber-400 font-mono mb-2">⚠ Diagram syntax error</p>
        <pre className="text-xs text-muted-foreground font-mono whitespace-pre-wrap break-words">
          {chart}
        </pre>
      </div>
    );
  }

  if (!svg) {
    return (
      <div
        ref={containerRef}
        className="my-4 h-32 rounded-lg bg-surface-container animate-pulse flex items-center justify-center"
      >
        <span className="text-xs text-muted-foreground">Rendering diagram…</span>
      </div>
    );
  }

  return (
    <div
      className="my-6 overflow-x-auto rounded-xl border border-border-subtle bg-surface-container p-4"
      dangerouslySetInnerHTML={{ __html: svg }}
    />
  );
}
