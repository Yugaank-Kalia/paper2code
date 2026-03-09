"use client";

import { useEffect, useState } from "react";
import { CodeViewer } from "@/components/code-viewer";
import { generateCode, getGeneratedCode, type CodeBlock } from "@/app/dashboard/actions/generate-code";

import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Loader2, AlertCircle, Code } from "lucide-react";


type Props = {
    paperId: string;
    initialBlocks: CodeBlock[] | null;
};

type LoadingState = "checking" | "generating" | "done";

export function CodeBlocksView({ paperId, initialBlocks }: Props) {
    const [blocks, setBlocks] = useState<CodeBlock[] | null>(initialBlocks);
    const [error, setError] = useState<string | null>(null);
    const [loadingState, setLoadingState] = useState<LoadingState>(initialBlocks ? "done" : "checking");

    useEffect(() => {
        // If server already provided cached blocks, nothing to do
        if (initialBlocks) return;

        // 1. Fast cache check first
        getGeneratedCode(paperId).then((result) => {
            if (result.status === "ok") {
                setBlocks(result.codeBlocks);
                setLoadingState("done");
            } else {
                // Not cached — show spinner and generate
                setLoadingState("generating");
                generateCode(paperId).then((genResult) => {
                    if (genResult.status === "ok") {
                        setBlocks(genResult.codeBlocks);
                    } else if (genResult.status === "error") {
                        setError(genResult.message);
                    } else {
                        setError("Unauthorized. Please sign in.");
                    }
                    setLoadingState("done");
                });
            }
        });
    }, [paperId, initialBlocks]);

    // ── Spinner (generating for the first time) ───────────────────────────────
    if (loadingState === "generating") {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-4 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm">Generating Python implementation…</p>
                <p className="text-xs opacity-60">This may take a few minutes for large papers.</p>
            </div>
        );
    }

    // ── Skeleton (cache hit, loading from DB) ─────────────────────────────────
    if (loadingState === "checking") {
        return (
            <div className="space-y-8">
                <Skeleton className="h-4 w-36" />
                {[...Array(3)].map((_, i) => (
                    <div key={i} className="space-y-3">
                        <div className="flex items-start gap-3">
                            <Skeleton className="h-8 w-8 shrink-0 rounded-lg" />
                            <div className="space-y-2 flex-1">
                                <Skeleton className="h-4 w-48" />
                                <Skeleton className="h-3 w-72" />
                            </div>
                        </div>
                        <Skeleton className="h-64 w-full rounded-xl" />
                    </div>
                ))}
            </div>
        );
    }

    // ── Error ─────────────────────────────────────────────────────────────────
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-32 gap-3 text-muted-foreground">
                <AlertCircle className="h-8 w-8 text-destructive" />
                <p className="text-sm font-medium">Failed to generate code</p>
                <p className="text-xs opacity-70 max-w-sm text-center">{error}</p>
            </div>
        );
    }

    // ── Results ───────────────────────────────────────────────────────────────
    return (
        <div className="space-y-8">
            <p className="text-sm text-muted-foreground">
                {blocks!.length} code block{blocks!.length === 1 ? "" : "s"} generated
            </p>

            {blocks!.map((block, i) => (
                <div key={i} className="space-y-3">
                    <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                            <Code className="h-4 w-4 text-primary" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h2 className="font-semibold text-base">{block.title}</h2>
                                <Badge variant="outline" className="text-[10px] px-1.5 py-0 border-primary/20 text-primary bg-primary/5">
                                    Python
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">{block.description}</p>
                        </div>
                    </div>
                    <CodeViewer code={block.code} language="python" />
                </div>
            ))}
        </div>
    );
}
