import {
  pgTable,
  text,
  timestamp,
  integer,
  jsonb
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: text("id").primaryKey(), // Clerk user ID
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const papers = pgTable("papers", {
  id: text("id").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  title: text("title"),
  // array of author names
  authors: jsonb("authors").$type<string[]>().notNull().default([]),

  year: integer("year"),
  doi: text("doi"),
  source: text("source"), // e.g. "arxiv", "local_upload"

  // array of tags
  tags: jsonb("tags").$type<string[]>().default([]),

  rawText: text("raw_text").notNull(),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});

export const chunks = pgTable("chunks", {
  id: text("id").primaryKey(),

  paperId: text("paper_id")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  chunkIndex: integer("chunk_index").notNull(), // order within paper
  section: text("section"), // "abstract", "introduction", etc.

  text: text("text").notNull(),

  // embedding stored as JSON array; swap to a vector type if you use pgvector
  embedding: jsonb("embedding").$type<number[]>().notNull(),

  tokens: integer("tokens"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow()
});

export const generatedCode = pgTable("code", {
  id: text("id").primaryKey(),

  paperId: text("paper_id")
    .notNull()
    .references(() => papers.id, { onDelete: "cascade" }),

  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),

  // JSON array of { title, description, code } objects returned by the model
  codeBlocks: jsonb("code_blocks")
    .$type<{ title: string; description: string; code: string }[]>()
    .notNull()
    .default([]),

  model: text("model"),

  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow()
});
