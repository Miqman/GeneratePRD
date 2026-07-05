// ============================================================
// Shared TypeScript Types
// ============================================================

export interface PRDSession {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  language: "id" | "en";
  techStack?: TechStackEntry[] | null;
  techStackMode?: "ai" | "self" | null;
  createdAt: string;
  updatedAt: string;
  versions?: PRDVersion[];
  messages?: ChatMessage[];
  currentVersion?: PRDVersion;
  features?: RoadmapFeature[];
  tasks?: PrdTask[];
}

export interface PRDVersion {
  id: string;
  sessionId: string;
  versionNumber: number;
  content: string; // markdown
  changeDescription: string | null;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: "user" | "assistant";
  content: string;
  createdAt: string;
  revisionProposal?: {
    instruction: string;
    summary: string;
  };
  revisionApplied?: boolean;
}

export interface AgenticChatResult {
  type: "discussion" | "edit";
  message: string;
  toolInput?: {
    revisionInstruction: string;
    sectionsAffected: string[];
    changeType: "normal" | "destructive";
    revisionSummary: string;
  };
}

export interface GeneratePRDRequest {
  prompt: string;
  language: "id" | "en";
  complexity?: "simple" | "medium" | "complex";
  techStack?: TechStackEntry[] | null;
  techStackMode?: "ai" | "self" | null;
}

export interface RevisePRDRequest {
  instruction: string;
}

export interface PRDSection {
  id: string;
  title: string;
  anchor: string;
}

// ============================================================
// Tech Stack
// ============================================================

export interface TechStackEntry {
  layer: string;       // "Frontend", "Backend", "Database", dll
  technology: string;  // "Next.js", "PostgreSQL", dll
  reason: string;      // alasan pemilihan
}

export interface TechStackFormData {
  frontend?: string;
  backend?: string;
  database?: string;
  orm?: string;
  auth?: string;
  hosting?: string;
  styling?: string;
  [key: string]: string | undefined;
}

// ============================================================
// Roadmap & Tasks
// ============================================================

export interface SubFeature {
  name: string;
  description: string;
}

export interface RoadmapFeature {
  id: string;
  sessionId: string;
  name: string;
  phase: string;           // "Fase 1"
  priority: "high" | "medium" | "low";
  description: string;
  goal: string;
  doneWhen: string[];
  subFeatures: SubFeature[];
  icon: string;            // lucide icon name
  status: "planned" | "in_progress" | "done";
  order: number;
  taskCount?: number;
  tasks?: PrdTask[];
  createdAt: string;
}

export type TaskStatus = "belum_mulai" | "dikerjakan" | "selesai" | "gagal";
export type TaskPriority = "utama" | "opsional";

export interface PrdTask {
  id: string;
  sessionId: string;
  featureId: string;
  featureName: string;
  title: string;
  description: string;
  status: TaskStatus;
  priority: TaskPriority;
  order: number;
  createdAt: string;
  updatedAt: string;
}

// ============================================================
// PRD Sections (for sidebar navigation)
// ============================================================

export const PRD_SECTIONS: PRDSection[] = [
  { id: "overview", title: "1. Overview", anchor: "overview" },
  { id: "requirements", title: "2. Requirements", anchor: "requirements" },
  { id: "core-features", title: "3. Core Features", anchor: "core-features" },
  { id: "user-flows", title: "4. User Flows", anchor: "user-flows" },
  { id: "architecture", title: "5. Architecture", anchor: "architecture" },
  {
    id: "design-constraints",
    title: "6. Design & Technical Constraints",
    anchor: "design-constraints",
  },
  {
    id: "database-schema",
    title: "7. Database Schema",
    anchor: "database-schema",
  },
  { id: "tech-stack", title: "8. Tech Stack & Next Steps", anchor: "tech-stack" },
];
