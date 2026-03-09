import { createClient } from "@supabase/supabase-js";

export const supabase = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SECRET_KEY!
);

/** Produces a stable, storage-safe filename from a paper title and its ID. */
export function getPaperFilename(title: string, paperId: string): string {
    const sanitized = title
        .replace(/\.pdf$/i, "")
        .replace(/[^a-zA-Z0-9\-_.]/g, "_")
        .replace(/_+/g, "_")
        .replace(/^_|_$/g, "");
    return `${sanitized}-${paperId}.pdf`;
}