import { relations } from 'drizzle-orm';
import { user, session, account } from './auth-schema';
import { papers, chunks, generatedCode } from './schema';

export const userRelations = relations(user, ({ many }) => ({
	sessions: many(session, { relationName: 'userSessions' }),
	accounts: many(account, { relationName: 'userAccounts' }),
	papers: many(papers, { relationName: 'userPapers' }),
	chunks: many(chunks, { relationName: 'userChunks' }),
	generatedCode: many(generatedCode, { relationName: 'userGeneratedCode' }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
	user: one(user, {
		relationName: 'userSessions',
		fields: [session.userId],
		references: [user.id],
	}),
}));

export const accountRelations = relations(account, ({ one }) => ({
	user: one(user, {
		relationName: 'userAccounts',
		fields: [account.userId],
		references: [user.id],
	}),
}));

export const papersRelations = relations(papers, ({ one, many }) => ({
	user: one(user, {
		relationName: 'userPapers',
		fields: [papers.userId],
		references: [user.id],
	}),
	chunks: many(chunks, { relationName: 'paperChunks' }),
	generatedCode: many(generatedCode, { relationName: 'paperGeneratedCode' }),
}));

export const chunksRelations = relations(chunks, ({ one }) => ({
	paper: one(papers, {
		relationName: 'paperChunks',
		fields: [chunks.paperId],
		references: [papers.id],
	}),
	user: one(user, {
		relationName: 'userChunks',
		fields: [chunks.userId],
		references: [user.id],
	}),
}));

export const generatedCodeRelations = relations(generatedCode, ({ one }) => ({
	paper: one(papers, {
		relationName: 'paperGeneratedCode',
		fields: [generatedCode.paperId],
		references: [papers.id],
	}),
	user: one(user, {
		relationName: 'userGeneratedCode',
		fields: [generatedCode.userId],
		references: [user.id],
	}),
}));
