"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/index";
import { papers } from "@/src/db/schema";
import { eq, and } from "drizzle-orm";
import { supabase, getPaperFilename } from "@/lib/supabase";

export type GetPdfResult =
  | { status: "unauthorized" }
  | { status: "not-found" }
  | { status: "ok"; pdfBase64: string };

export async function getPdf(paperId: string): Promise<GetPdfResult> {
  const { userId } = await auth();

  if (!userId) {
    return { status: "unauthorized" };
  }

  // Ensure the paper exists AND belongs to the user
  const [paper] = await db
    .select({ id: papers.id, title: papers.title })
    .from(papers)
    .where(and(eq(papers.id, paperId), eq(papers.userId, userId)))
    .limit(1);

  if (!paper) {
    return { status: "not-found" };
  }

  const filename = getPaperFilename(paper.title ?? paper.id, paper.id);

  const { data, error } = await supabase.storage
    .from(userId)
    .download(filename);

  if (error || !data) {
    console.error("Failed to download PDF from Supabase Storage:", error);
    return { status: "not-found" };
  }

  const buffer = Buffer.from(await data.arrayBuffer());
  return { status: "ok", pdfBase64: buffer.toString("base64") };
}

