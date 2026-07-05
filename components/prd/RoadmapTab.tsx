"use client";

import { useEffect, useState } from "react";
import {
  Search, ShoppingCart, History, User, LayoutDashboard, Bell, Settings,
  Map, Calendar, MessageSquare, CreditCard, Star, Package, FileText,
  BarChart, Shield, Zap, Globe, Layers, RefreshCw, Loader2, Maximize2,
} from "lucide-react";
import type { RoadmapFeature, PrdTask } from "@/lib/types";
import { FeatureDetailPanel } from "./FeatureDetailPanel";
import {
  ReactFlow,
  Background,
  Controls,
  ReactFlowProvider,
  useNodesState,
  useEdgesState,
  useReactFlow,
  Handle,
  Position,
  type Node,
  type Edge,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";

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

// ============================================================
// Custom Nodes
// ============================================================

function RootNode({ data }: { data: { label: string } }) {
  return (
    <div className="w-48 bg-surface-container-high rounded-xl border border-primary/30 px-4 py-4 shadow-lg shadow-primary/5 text-left">
      <div className="flex items-center gap-2 mb-2">
        <div className="w-6 h-6 rounded bg-primary/20 flex items-center justify-center shrink-0">
          <FileText className="w-3.5 h-3.5 text-primary" />
        </div>
        <span className="text-[10px] text-text-secondary font-mono">PRD</span>
      </div>
      <p className="text-xs font-bold text-on-surface leading-tight">{data.label}</p>
      <p className="text-[10px] text-text-secondary mt-1">Project Roadmap</p>
      <Handle type="source" position={Position.Right} className="!bg-primary !w-2 !h-2" />
    </div>
  );
}

function PhaseNode({ data }: { data: { label: string } }) {
  return (
    <div className="w-48 bg-surface-container rounded-xl border border-border-subtle px-4 py-3 shadow-md text-left">
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded bg-text-secondary/10 flex items-center justify-center shrink-0">
          <Calendar className="w-3.5 h-3.5 text-text-secondary" />
        </div>
        <span className="text-xs font-bold text-on-surface truncate">{data.label}</span>
      </div>
      <Handle type="target" position={Position.Left} className="!bg-border-subtle !w-2 !h-2" />
      <Handle type="source" position={Position.Right} className="!bg-primary/50 !w-2 !h-2" />
    </div>
  );
}

function FeatureNode({ data }: { data: { feature: RoadmapFeature; isSelected: boolean } }) {
  const { feature, isSelected } = data;
  if (!feature) return null;

  const Icon = ICON_MAP[feature.icon] || Layers;
  const taskCount = feature.tasks?.length ?? 0;
  const doneCount = feature.tasks?.filter((t: PrdTask) => t.status === "selesai").length ?? 0;
  const status = (feature.status as keyof typeof STATUS_COLORS) || "planned";

  return (
    <div
      className={`w-64 text-left px-4 py-3.5 rounded-xl border bg-surface-container-high/90 backdrop-blur transition-all duration-200 hover:shadow-md relative ${
        isSelected
          ? "border-primary bg-primary/5 shadow-md shadow-primary/5"
          : "border-border-subtle hover:border-primary/30"
      }`}
    >
      <Handle type="target" position={Position.Left} className="!bg-primary/50 !w-2 !h-2" />
      
      <div className="flex items-center gap-2 mb-1.5 min-w-0">
        <div className="p-1 rounded bg-surface-container border border-border-subtle shrink-0">
          <Icon className="w-3.5 h-3.5 text-text-secondary" />
        </div>
        <span className="text-xs font-semibold text-on-surface truncate">{feature.name}</span>
      </div>

      <p className="text-[11px] text-text-secondary line-clamp-2 leading-normal mb-2.5">
        {feature.description}
      </p>

      <div className="flex items-center justify-between mt-auto">
        <span className={`flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded-full border ${STATUS_COLORS[status]}`}>
          <span className={`w-1 h-1 rounded-full ${STATUS_DOT[status]}`} />
          {STATUS_LABEL[status]}
        </span>
        
        <div className="flex items-center gap-1.5">
          <span className={`text-[9px] px-1.5 py-0.5 rounded-full border font-mono ${
            feature.priority === "high"
              ? "bg-red-500/10 text-red-400 border-red-500/20"
              : feature.priority === "medium"
              ? "bg-amber-500/10 text-amber-400 border-amber-500/20"
              : "bg-surface-container text-text-secondary border-border-subtle"
          }`}>
            {feature.priority.toUpperCase()}
          </span>
          {taskCount > 0 && (
            <span className="text-[10px] font-mono text-text-secondary opacity-60">
              {doneCount}/{taskCount}
            </span>
          )}
        </div>
      </div>
      
      <Handle type="source" position={Position.Right} className="!bg-primary/50 !w-2 !h-2" />
    </div>
  );
}

const nodeTypes = {
  rootNode: RootNode,
  phaseNode: PhaseNode,
  featureNode: FeatureNode,
};

// ============================================================
// Canvas Component
// ============================================================

interface RoadmapCanvasProps {
  features: RoadmapFeature[];
  selectedFeature: RoadmapFeature | null;
  setSelectedFeature: (feature: RoadmapFeature | null) => void;
  generateRoadmap: () => void;
  generating: boolean;
}

function RoadmapCanvas({
  features,
  selectedFeature,
  setSelectedFeature,
  generateRoadmap,
  generating,
}: RoadmapCanvasProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState<Node>([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
  const { fitView } = useReactFlow();

  const buildGraph = (featuresList: RoadmapFeature[]) => {
    if (featuresList.length === 0) return;

    // 1. Group by phase
    const phaseMap: Record<string, RoadmapFeature[]> = {};
    featuresList.forEach((f) => {
      if (!phaseMap[f.phase]) {
        phaseMap[f.phase] = [];
      }
      phaseMap[f.phase].push(f);
    });

    // Sort phases
    const phases = Object.keys(phaseMap).sort((a, b) => {
      const aNum = parseInt(a.replace(/^\D+/g, "")) || 0;
      const bNum = parseInt(b.replace(/^\D+/g, "")) || 0;
      return aNum - bNum || a.localeCompare(b);
    });

    // Find max features in any phase to calculate centerY
    let maxFeatures = 1;
    phases.forEach((p) => {
      maxFeatures = Math.max(maxFeatures, phaseMap[p].length);
    });

    const spacingY = 160;
    const centerY = Math.max(250, ((maxFeatures - 1) * spacingY) / 2 + 100);

    const newNodes: Node[] = [];
    const newEdges: Edge[] = [];

    // Add Root Node
    newNodes.push({
      id: "root",
      type: "rootNode",
      data: { label: "Project Roadmap" },
      position: { x: 50, y: centerY + 20 },
    });

    // Keep track of previous phase node id to link phase-to-phase
    let prevPhaseNodeId = "root";

    phases.forEach((phaseName, colIdx) => {
      const phaseNodeId = `phase-${colIdx}`;
      const phaseFeatures = phaseMap[phaseName] || [];

      // Add Phase Node
      newNodes.push({
        id: phaseNodeId,
        type: "phaseNode",
        data: { label: phaseName },
        position: { x: 320 + colIdx * 650, y: centerY + 45 },
      });

      // Connect prev phase (or root) to this phase node
      newEdges.push({
        id: `edge-${prevPhaseNodeId}-${phaseNodeId}`,
        source: prevPhaseNodeId,
        target: phaseNodeId,
        style: { stroke: "var(--color-primary)", strokeWidth: 2, opacity: 0.8 },
        type: "smoothstep",
      });

      prevPhaseNodeId = phaseNodeId;

      // Add Feature Nodes for this phase
      const N = phaseFeatures.length;
      phaseFeatures.forEach((feature, fIdx) => {
        const featureNodeId = `feature-${feature.id}`;
        const yPos = centerY - ((N - 1) * spacingY) / 2 + fIdx * spacingY + 50;

        newNodes.push({
          id: featureNodeId,
          type: "featureNode",
          data: {
            feature,
            isSelected: selectedFeature?.id === feature.id,
          },
          position: { x: 320 + colIdx * 650 + 260, y: yPos },
        });

        // Style edge based on status
        let edgeStyle: React.CSSProperties = { stroke: "var(--color-border-subtle)", strokeWidth: 1.5, opacity: 0.6 };
        let edgeClass = "";

        if (feature.status === "done") {
          edgeStyle = { stroke: "var(--color-primary)", strokeWidth: 2, opacity: 0.9 };
        } else if (feature.status === "in_progress") {
          edgeStyle = { stroke: "#f59e0b", strokeWidth: 2, opacity: 0.9 };
          edgeClass = "animate-edge-dash";
        }

        newEdges.push({
          id: `edge-${phaseNodeId}-${featureNodeId}`,
          source: phaseNodeId,
          target: featureNodeId,
          style: edgeStyle,
          className: edgeClass,
          type: "smoothstep",
        });
      });
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  useEffect(() => {
    buildGraph(features);
  }, [features]);

  // Sync selected feature changes
  useEffect(() => {
    setNodes((prevNodes) =>
      prevNodes.map((node) => {
        if (node.type === "featureNode") {
          return {
            ...node,
            data: {
              ...node.data,
              isSelected: (node.data as any).feature?.id === selectedFeature?.id,
            },
          };
        }
        return node;
      })
    );
  }, [selectedFeature, setNodes]);

  const onNodeClick = (_event: React.MouseEvent, node: Node) => {
    if (node.type === "featureNode" && (node.data as any)?.feature) {
      setSelectedFeature((node.data as any).feature as RoadmapFeature);
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden relative">
      <style>{`
        @keyframes edge-dash {
          from {
            stroke-dashoffset: 20;
          }
          to {
            stroke-dashoffset: 0;
          }
        }
        .animate-edge-dash {
          stroke-dasharray: 6 4;
          animation: edge-dash 1.2s linear infinite;
        }
        .react-flow__handle {
          border: 1px solid var(--color-background) !important;
        }
        .react-flow__controls-button {
          background: var(--color-surface-container) !important;
          border-bottom: 1px solid var(--color-border-subtle) !important;
          color: var(--color-on-surface) !important;
          fill: currentColor !important;
        }
        .react-flow__controls-button:hover {
          background: var(--color-surface-container-high) !important;
        }
        .react-flow__controls-button svg {
          fill: currentColor !important;
        }
      `}</style>

      {/* React Flow Viewport Container */}
      <div className="flex-1 h-full relative min-h-[400px]">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onNodeClick={onNodeClick}
          nodeTypes={nodeTypes}
          fitView
          fitViewOptions={{ padding: 0.15 }}
          minZoom={0.2}
          maxZoom={1.5}
          proOptions={{ hideAttribution: true }}
          className="bg-transparent"
        >
          <Background color="var(--color-border-subtle)" gap={16} size={1} style={{ opacity: 0.3 }} />
          <Controls className="!bg-surface-container !border-border-subtle !text-on-surface" />
        </ReactFlow>
      </div>

      {/* Floating Canvas Actions */}
      <div className="absolute bottom-4 right-4 flex items-center gap-2 z-10">
        <button
          onClick={() => fitView({ duration: 300, padding: 0.15 })}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary bg-surface-container border border-border-subtle rounded-lg hover:border-primary/30 hover:text-primary transition-all cursor-pointer shadow-md"
          title="Fit view"
        >
          <Maximize2 className="w-3 h-3" />
          Focus
        </button>
        <button
          onClick={generateRoadmap}
          disabled={generating}
          className="flex items-center gap-2 px-3 py-1.5 text-xs text-text-secondary bg-surface-container border border-border-subtle rounded-lg hover:border-primary/30 hover:text-primary transition-all cursor-pointer disabled:opacity-50 shadow-md"
        >
          {generating ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
          {generating ? "Generating..." : "Generate ulang"}
        </button>
      </div>
    </div>
  );
}

// ============================================================
// Main Tab Wrapper
// ============================================================

interface RoadmapTabProps {
  sessionId: string;
}

export function RoadmapTab({ sessionId }: RoadmapTabProps) {
  const [features, setFeatures] = useState<RoadmapFeature[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState<RoadmapFeature | null>(null);

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
      <ReactFlowProvider>
        <RoadmapCanvas
          features={features}
          selectedFeature={selectedFeature}
          setSelectedFeature={setSelectedFeature}
          generateRoadmap={generateRoadmap}
          generating={generating}
        />
      </ReactFlowProvider>

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
