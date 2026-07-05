// Relations for Drizzle ORM query builder
import { relations } from "drizzle-orm";
import {
  users,
  prdSessions,
  prdVersions,
  chatMessages,
  prdFeatures,
  prdTasks,
  sessions,
  accounts,
} from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  prdSessions: many(prdSessions),
  sessions: many(sessions),
  accounts: many(accounts),
}));

export const prdSessionsRelations = relations(prdSessions, ({ one, many }) => ({
  user: one(users, {
    fields: [prdSessions.userId],
    references: [users.id],
  }),
  versions: many(prdVersions),
  messages: many(chatMessages),
  features: many(prdFeatures),
  tasks: many(prdTasks),
}));

export const prdVersionsRelations = relations(prdVersions, ({ one }) => ({
  session: one(prdSessions, {
    fields: [prdVersions.sessionId],
    references: [prdSessions.id],
  }),
}));

export const chatMessagesRelations = relations(chatMessages, ({ one }) => ({
  session: one(prdSessions, {
    fields: [chatMessages.sessionId],
    references: [prdSessions.id],
  }),
}));

export const prdFeaturesRelations = relations(prdFeatures, ({ one, many }) => ({
  session: one(prdSessions, {
    fields: [prdFeatures.sessionId],
    references: [prdSessions.id],
  }),
  tasks: many(prdTasks),
}));

export const prdTasksRelations = relations(prdTasks, ({ one }) => ({
  session: one(prdSessions, {
    fields: [prdTasks.sessionId],
    references: [prdSessions.id],
  }),
  feature: one(prdFeatures, {
    fields: [prdTasks.featureId],
    references: [prdFeatures.id],
  }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, {
    fields: [sessions.userId],
    references: [users.id],
  }),
}));

export const accountsRelations = relations(accounts, ({ one }) => ({
  user: one(users, {
    fields: [accounts.userId],
    references: [users.id],
  }),
}));
