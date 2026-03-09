import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChunkViewer } from "@/components/chunk-viewer";
import { getPaperWithChunks } from "@/app/dashboard/actions/get-paper-with-chunks";
import {
  ArrowLeft,
  BookOpenIcon,
  CalendarDays,
  Laptop,
  Hash,
  Layers,
  Coins,
  TagIcon,
  UserIcon,
} from "lucide-react";

export default async function PaperDetailPage({
  params,
}: {
  params: Promise<{ paperId: string }>;
}) {
  const { paperId } = await params;

  const result = await getPaperWithChunks(paperId);

  if (result.status === "unauthorized") {
    redirect("/sign-in");
  }

  if (result.status === "not_found") {
    notFound();
  }

  const { paper, chunks } = result;

  const totalTokens = chunks.reduce((sum: number, c) => sum + (c.tokens ?? 0), 0);
  const uniqueSections = new Set(chunks.map((c) => c.section).filter(Boolean));
  const authors = (paper.authors ?? []) as string[];
  const tags = (paper.tags ?? []) as string[];

  return (
    <>
      <div className="min-h-screen bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]">

        {/* Decorative gradient blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute h-125 w-125 bg-primary/5 blur-[120px] rounded-full -top-40 -left-40" />
          <div className="absolute h-100 w-100 bg-purple-500/5 blur-[100px] rounded-full top-1/2 -right-40" />
          <div className="absolute h-75 w-75 bg-sky-500/5 blur-[80px] rounded-full -bottom-20 left-1/3" />
        </div>

        <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8">

          {/* Back link */}
          <Link href="/dashboard">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6 gap-1.5 text-muted-foreground hover:text-foreground cursor-pointer"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
          </Link>

          {/* ─── Paper Header ─── */}
          <section className="mb-10">
            <div className="flex items-start gap-4 mb-6">
              <div className="shrink-0 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                <BookOpenIcon className="h-6 w-6 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-bold tracking-tight sm:text-4xl leading-tight">
                  {paper.title || "Untitled Paper"}
                </h1>

                {/* Authors */}
                {authors.length > 0 && (
                  <div className="mt-3 flex flex-wrap items-center gap-2">
                    <UserIcon className="h-4 w-4 text-muted-foreground" />
                    {authors.map((author, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className="text-xs font-normal border-border/50"
                      >
                        {author}
                      </Badge>
                    ))}
                  </div>
                )}

                {/* Metadata row */}
                <div className="mt-4 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  {paper.year && (
                    <span className="inline-flex items-center gap-1.5">
                      <CalendarDays className="h-3.5 w-3.5" />
                      {paper.year}
                    </span>
                  )}
                  {paper.source && (
                    <span className="inline-flex items-center gap-1.5">
                      <Laptop className="h-3.5 w-3.5" />
                      {paper.source}
                    </span>
                  )}
                  {paper.doi && (
                    <a
                      href={`https://doi.org/${paper.doi}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 hover:text-primary transition-colors"
                    >
                      <Hash className="h-3.5 w-3.5" />
                      {paper.doi}
                    </a>
                  )}
                </div>

                {/* Tags */}
                {tags.length > 0 && (
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <TagIcon className="h-4 w-4 text-muted-foreground" />
                    {tags.map((tag, i) => (
                      <Badge
                        key={i}
                        className="text-xs bg-primary/10 text-primary border-primary/20 hover:bg-primary/20"
                        variant="outline"
                      >
                        {tag}
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ─── Stats Bar ─── */}
          <section className="mb-10 grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Card className="border-border/50 bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center gap-3 pb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10">
                  <Layers className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Chunks</p>
                  <CardTitle className="text-2xl">{chunks.length}</CardTitle>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-border/50 bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center gap-3 pb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-amber-500/10">
                  <Coins className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Tokens</p>
                  <CardTitle className="text-2xl">
                    {totalTokens.toLocaleString()}
                  </CardTitle>
                </div>
              </CardHeader>
            </Card>

            <Card className="border-border/50 bg-card/60 backdrop-blur-xs">
              <CardHeader className="flex flex-row items-center gap-3 pb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-500/10">
                  <Hash className="h-4 w-4 text-violet-600 dark:text-violet-400" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Sections</p>
                  <CardTitle className="text-2xl">
                    {uniqueSections.size || "—"}
                  </CardTitle>
                </div>
              </CardHeader>
            </Card>
          </section>

          {/* ─── Chunks ─── */}
          <section>
            <h2 className="text-xl font-semibold mb-1">Paper Chunks</h2>
            <p className="text-sm text-muted-foreground mb-6">
              The paper has been split into {chunks.length} chunks for semantic search and code generation.
            </p>

            <ChunkViewer chunks={chunks} />
          </section>
        </div>
      </div>
    </>
  );
}
