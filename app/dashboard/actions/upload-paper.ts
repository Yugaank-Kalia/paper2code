"use server";

import { auth } from "@clerk/nextjs/server";
import { db } from "@/index";
import { chunks, papers, users } from "@/src/db/schema";
import { extractTextFromUpload } from "@/lib/extractText";
import { chunkText } from "@/lib/chunking";
import { embedTextBatch } from "@/lib/embeddings";
import { supabase, getPaperFilename } from "@/lib/supabase";
import { eq, and } from "drizzle-orm";

export type UploadPaperResult =
  | { status: "unauthorized" }
  | { status: "error"; message: string }
  | {
      status: "ok";
      paperId: string;
      chunkCount: number;
      filename: string;
      originalName: string;
      size: number;
    };

export async function uploadPaper(
  formData: FormData
): Promise<UploadPaperResult> {
  const { userId } = await auth();

  if (!userId) {
    return { status: "unauthorized" };
  }

  const file = formData.get("file") as File | null;
  
  if (!file) {
    return { status: "error", message: "No file provided" };
  }

  // check if file exists in papers directory
  const name = file.name;
  const exists = await db.select().from(papers).where(and(eq(papers.title, name), eq(papers.userId, userId))).limit(1);

  if (exists.length > 0) {
    return { status: "error", message: "File already exists, please upload a different file." };
  }

  // Validate file type
  const allowedTypes = ["application/pdf", "text/plain", "text/markdown"];
  if (!allowedTypes.includes(file.type)) {
    return {
      status: "error",
      message: "Invalid file type. Please upload PDF, TXT, or MD files.",
    };
  }

  try {
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const paperId = crypto.randomUUID();
    const rawTitle = (formData.get("title") as string | null) ?? file.name;
    const filename = getPaperFilename(rawTitle, paperId);

    // Ensure per-user bucket exists
    await supabase.storage.createBucket(userId, {
      public: false,
      fileSizeLimit: 52428800, // 50MB
    }).catch(() => {
      // Bucket already exists — ignore error
    });

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from(userId)
      .upload(filename, buffer, { contentType: file.type, upsert: false });

    if (uploadError) {
      return { status: "error", message: `Storage upload failed: ${uploadError.message}` };
    }

    let rawText = await extractTextFromUpload(file);
    if (!rawText) {
      return { status: "error", message: "No extractable text found in file." };
    }
    
    // PostgreSQL doesn't allow null characters (0x00) in text fields
    rawText = rawText.replace(/\0/g, "");

    await db.insert(users).values({ id: userId }).onConflictDoNothing();

    await db.insert(papers).values({
      id: paperId,
      userId,
      title: rawTitle, // Use the original title for the DB
      source: "local_upload",
      rawText,
    });

    const chunkRows = chunkText(rawText);
    const embeddingBatchSize = 32;

    for (
      let offset = 0;
      offset < chunkRows.length;
      offset += embeddingBatchSize
    ) {
      const currentBatch = chunkRows.slice(offset, offset + embeddingBatchSize);
      const embeddings = await embedTextBatch(
        currentBatch.map((item) => item.text)
      );

      await db.insert(chunks).values(
        currentBatch.map((item, index) => ({
          id: crypto.randomUUID(),
          paperId,
          userId,
          chunkIndex: item.chunkIndex,
          section: item.section,
          text: item.text,
          embedding: embeddings[index] ?? [],
          tokens: item.tokens,
        }))
      );
    }

    return {
      status: "ok",
      paperId,
      chunkCount: chunkRows.length,
      filename,
      originalName: file.name,
      size: file.size,
    };
  } catch (error) {
    console.error("Upload error:", error);
    return { status: "error", message: "Failed to upload file" };
  }
}
