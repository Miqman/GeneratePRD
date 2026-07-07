import { pgTable, text, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";

// ============================================================
// APP TABLES
// ============================================================

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name"),
  emailVerified: boolean("email_verified").default(false).notNull(),
  image: text("image"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prdSessions = pgTable("prd_sessions", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  prompt: text("prompt").notNull(),
  language: text("language").notNull().default("id"),
  techStack: jsonb("tech_stack"),        // { layer, technology, reason }[] | null
  techStackMode: text("tech_stack_mode"), // "ai" | "self" | null
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prdVersions = pgTable("prd_versions", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => prdSessions.id, { onDelete: "cascade" }),
  versionNumber: integer("version_number").notNull(),
  content: text("content").notNull(),
  changeDescription: text("change_description"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const chatMessages = pgTable("chat_messages", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => prdSessions.id, { onDelete: "cascade" }),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prdFeatures = pgTable("prd_features", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => prdSessions.id, { onDelete: "cascade" }),
  name: text("name").notNull(),              // "Jelajah Slot"
  phase: text("phase").notNull(),            // "Fase 1"
  priority: text("priority").notNull(),      // "high" | "medium" | "low"
  description: text("description").notNull(), // 1–2 kalimat
  goal: text("goal").notNull(),              // tujuan fitur
  doneWhen: jsonb("done_when").notNull(),    // string[]
  subFeatures: jsonb("sub_features").notNull(), // { name, description, goal?, doneWhen? }[]
  userStories: jsonb("user_stories"),            // string[] | null — "As a X, I want Y, so that Z"
  icon: text("icon").default("Layers"),      // lucide icon name
  status: text("status").notNull().default("planned"), // "planned" | "in_progress" | "done"
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const prdTasks = pgTable("prd_tasks", {
  id: text("id").primaryKey(),
  sessionId: text("session_id")
    .notNull()
    .references(() => prdSessions.id, { onDelete: "cascade" }),
  featureId: text("feature_id")
    .notNull()
    .references(() => prdFeatures.id, { onDelete: "cascade" }),
  featureName: text("feature_name").notNull(), // denormalized
  title: text("title").notNull(),
  description: text("description").notNull(),
  status: text("status").notNull().default("belum_mulai"), // "belum_mulai" | "dikerjakan" | "selesai" | "gagal"
  priority: text("priority").notNull().default("utama"),   // "utama" | "opsional"
  order: integer("order").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
});

// ============================================================
// BETTER AUTH TABLES
// ============================================================

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at"),
  updatedAt: timestamp("updated_at"),
});
