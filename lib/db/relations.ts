// Relations for Drizzle ORM query builder
import { relations } from "drizzle-orm";
import {
  users,
  prdSessions,
  prdVersions,
  chatMessages,
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
