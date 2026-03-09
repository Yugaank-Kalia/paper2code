"use server";

import { auth } from "@clerk/nextjs/server";
import { eq, desc } from "drizzle-orm";
import { db } from "@/index";
import { papers, chunks } from "@/src/db/schema";
import { sql } from "drizzle-orm";

export type PaperSummary = {
  id: string;
  title: string | null;
  authors: string[];
  tags: string[];
  year: number | null;
  source: string | null;
  createdAt: Date | null;
  chunkCount: number;
};

export type GetUserPapersResult =
  | { status: "unauthorized" }
  | { status: "ok"; papers: PaperSummary[] };

export async function getUserPapers(): Promise<GetUserPapersResult> {
  const { userId } = await auth();

  if (!userId) {
    return { status: "unauthorized" };
  }

  const userPapers = await db
    .select({
      id: papers.id,
      title: papers.title,
      authors: papers.authors,
      tags: papers.tags,
      year: papers.year,
      source: papers.source,
      createdAt: papers.createdAt,
      chunkCount: sql<number>`cast(count(${chunks.id}) as integer)`,
    })
    .from(papers)
    .leftJoin(chunks, eq(chunks.paperId, papers.id))
    .where(eq(papers.userId, userId))
    .groupBy(papers.id)
    .orderBy(desc(papers.createdAt));

  return {
    status: "ok",
    papers: userPapers.map((p) => ({
      ...p,
      authors: (p.authors ?? []) as string[],
      tags: (p.tags ?? []) as string[],
    })),
  };
}
