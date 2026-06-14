// ============================================================
// Shared TypeScript Types
// ============================================================

export interface PRDSession {
  id: string;
  userId: string;
  title: string;
  prompt: string;
  language: "id" | "en";
  createdAt: string;
  updatedAt: string;
  versions?: PRDVersion[];
  messages?: ChatMessage[];
  currentVersion?: PRDVersion;
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
}

export interface RevisePRDRequest {
  instruction: string;
}

export interface PRDSection {
  id: string;
  title: string;
  anchor: string;
}

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
