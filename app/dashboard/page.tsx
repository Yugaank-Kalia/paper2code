import { redirect } from "next/navigation";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { UploadPaperDialog } from "@/components/upload-paper-dialog";
import { getUserPapers } from "@/app/dashboard/actions/get-papers";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DeletePaperButton } from "@/components/delete-paper-button-client";
import {
  BookOpenIcon,
  CalendarDays,
  Laptop,
  FileText,
  Layers,
  TagIcon,
  Code,
  FileDown,
} from "lucide-react";

export default async function DashboardPage() {
  const result = await getUserPapers();

  if (result.status === "unauthorized") {
    redirect("/sign-in");
  }

  const { papers } = result;

  return (
    <>
      <div className="min-h-screen bg-background bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-size-[24px_24px]">

        {/* Decorative gradient blobs */}
        <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          <div className="absolute h-125 w-125 bg-primary/5 blur-[120px] rounded-full -top-40 -right-40" />
          <div className="absolute h-100 w-100 bg-purple-500/5 blur-[100px] rounded-full bottom-0 -left-40" />
        </div>

        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">

          {/* Page Header */}
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-10">
            <div>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
                My Papers
              </h1>
              <p className="mt-1 text-muted-foreground">
                {papers.length === 0
                  ? "Upload your first paper to get started"
                  : `${papers.length} paper${papers.length === 1 ? "" : "s"} uploaded`}
              </p>
            </div>
            <UploadPaperDialog text="Upload Paper" />
          </div>

          {/* Papers Grid */}
          {papers.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {papers.map((paper) => (
                <Card key={paper.id} className="flex flex-col h-full border-border/50 bg-card/50 backdrop-blur-xs transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="shrink-0 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 transition-colors group-hover:bg-primary/20">
                        <BookOpenIcon className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <CardTitle className="text-base leading-snug line-clamp-2">
                          {paper.title || "Untitled Paper"}
                        </CardTitle>
                        {paper.source && (
                          <CardDescription className="mt-1 flex items-center gap-1 text-xs">
                            <Laptop className="h-3 w-3" />
                            {paper.source}
                          </CardDescription>
                        )}
                      </div>
                      <DeletePaperButton paperId={paper.id} paperTitle={paper.title} />
                    </div>
                  </CardHeader>

                  <CardContent className="flex-1 pt-0 space-y-3">
                    {/* Authors */}
                    {paper.authors.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {paper.authors.slice(0, 3).map((author, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[10px] font-normal border-border/50 px-1.5 py-0"
                          >
                            {author}
                          </Badge>
                        ))}
                        {paper.authors.length > 3 && (
                          <Badge
                            variant="outline"
                            className="text-[10px] font-normal border-border/50 px-1.5 py-0"
                          >
                            +{paper.authors.length - 3}
                          </Badge>
                        )}
                      </div>
                    )}

                    {/* Tags */}
                    {paper.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        <TagIcon className="h-3 w-3 text-muted-foreground mt-0.5" />
                        {paper.tags.slice(0, 3).map((tag, i) => (
                          <Badge
                            key={i}
                            variant="outline"
                            className="text-[10px] bg-primary/5 text-primary border-primary/20 px-1.5 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}

                    {/* Bottom metadata row */}
                    <div className="flex items-center justify-between pt-2 border-t border-border/30 text-xs text-muted-foreground">
                      <span className="inline-flex items-center gap-1">
                        <Layers className="h-3 w-3" />
                        {paper.chunkCount} chunk{paper.chunkCount === 1 ? "" : "s"}
                      </span>
                      {paper.year && (
                        <span className="inline-flex items-center gap-1">
                          <CalendarDays className="h-3 w-3" />
                          {paper.year}
                        </span>
                      )}
                      {paper.createdAt && (
                        <span>
                          {new Date(paper.createdAt).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </CardContent>

                  <CardFooter className="pt-0 grid grid-cols-2 gap-2 w-full mt-auto">
                    <Button variant="outline" className="col-span-1 cursor-pointer gap-2" asChild>
                      <Link href={`/dashboard/pdf/${paper.id}`} rel="noopener noreferrer">
                        <FileDown className="h-4 w-4" />
                        View PDF
                      </Link>
                    </Button>

                    <Button variant="outline" className="col-span-1 cursor-pointer gap-2" asChild>
                      <Link href={`/dashboard/chunks/${paper.id}`}>
                        <Layers className="h-4 w-4" />
                        View Chunks
                      </Link>
                    </Button>

                    <Button className="col-span-2 cursor-pointer gap-2" asChild>
                      <Link href={`/dashboard/code/${paper.id}`}>
                        <Code className="h-4 w-4" />
                        View Code
                      </Link>
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            /* Empty State */
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-muted/50 mb-6">
                <FileText className="h-10 w-10 text-muted-foreground/40" />
              </div>
              <h2 className="text-xl font-semibold mb-2">No papers yet</h2>
              <p className="text-muted-foreground mb-8 max-w-sm">
                Upload a research paper to extract its content, chunk it for semantic search, and convert it to code.
              </p>
              <UploadPaperDialog text="Upload Paper" />
            </div>
          )}
        </div>
      </div>
    </>
  );
}
