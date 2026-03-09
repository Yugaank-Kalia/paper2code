"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  ChevronDown,
  ChevronUp,
  Hash,
  Coins,
  FileText,
} from "lucide-react";

type Chunk = {
  id: string;
  chunkIndex: number;
  section: string | null;
  text: string;
  tokens: number | null;
  createdAt: Date | null;
};

const SECTION_COLORS: Record<string, string> = {
  abstract:
    "bg-violet-500/15 text-violet-700 dark:text-violet-300 border-violet-500/25",
  introduction:
    "bg-sky-500/15 text-sky-700 dark:text-sky-300 border-sky-500/25",
  methods:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  methodology:
    "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border-emerald-500/25",
  results:
    "bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/25",
  discussion:
    "bg-orange-500/15 text-orange-700 dark:text-orange-300 border-orange-500/25",
  conclusion:
    "bg-rose-500/15 text-rose-700 dark:text-rose-300 border-rose-500/25",
  references:
    "bg-slate-500/15 text-slate-700 dark:text-slate-300 border-slate-500/25",
  related_work:
    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  "related work":
    "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border-indigo-500/25",
  experiments:
    "bg-teal-500/15 text-teal-700 dark:text-teal-300 border-teal-500/25",
  appendix:
    "bg-gray-500/15 text-gray-700 dark:text-gray-300 border-gray-500/25",
};

const DEFAULT_SECTION_COLOR =
  "bg-primary/10 text-primary border-primary/20";

function getSectionColor(section: string | null): string {
  if (!section) return DEFAULT_SECTION_COLOR;
  return SECTION_COLORS[section.toLowerCase()] ?? DEFAULT_SECTION_COLOR;
}

const TEXT_TRUNCATE_LENGTH = 400;

function ChunkCard({
  chunk,
  index,
}: {
  chunk: Chunk;
  index: number;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const needsTruncation = chunk.text.length > TEXT_TRUNCATE_LENGTH;

  const displayText =
    !isExpanded && needsTruncation
      ? chunk.text.slice(0, TEXT_TRUNCATE_LENGTH) + "…"
      : chunk.text;

  return (
    <div
      className="group relative"
      style={{
        animationDelay: `${Math.min(index * 30, 300)}ms`,
        animationFillMode: "both",
      }}
    >
      <Card className="relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-xs transition-all duration-300 hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5">
        {/* Accent bar */}
        <div className="absolute top-0 left-0 h-full w-1 bg-linear-to-b from-primary/60 to-primary/10 opacity-0 transition-opacity duration-300 group-hover:opacity-100" />

        <CardHeader className="flex flex-row items-start gap-3 pb-3">
          <div className="flex shrink-0 items-center justify-center h-8 w-8 rounded-md bg-muted text-xs font-bold text-muted-foreground">
            {chunk.chunkIndex}
          </div>

          <div className="flex flex-1 flex-wrap items-center gap-2">
            {chunk.section && (
              <Badge
                variant="outline"
                className={`text-xs font-medium ${getSectionColor(chunk.section)}`}
              >
                <FileText className="mr-1 h-3 w-3" />
                {chunk.section}
              </Badge>
            )}

            {chunk.tokens && (
              <Badge
                variant="outline"
                className="text-xs font-normal text-muted-foreground border-border/50"
              >
                <Coins className="mr-1 h-3 w-3" />
                {chunk.tokens.toLocaleString()} tokens
              </Badge>
            )}
          </div>
        </CardHeader>

        <CardContent className="pt-0">
          <p className="whitespace-pre-wrap text-sm leading-relaxed text-foreground/85 font-mono">
            {displayText}
          </p>

          {needsTruncation && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
              className="mt-3 h-7 gap-1.5 text-xs text-muted-foreground hover:text-primary cursor-pointer"
            >
              {isExpanded ? (
                <>
                  <ChevronUp className="h-3 w-3" />
                  Show less
                </>
              ) : (
                <>
                  <ChevronDown className="h-3 w-3" />
                  Show more
                </>
              )}
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export function ChunkViewer({ chunks }: { chunks: Chunk[] }) {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChunks = useMemo(() => {
    if (!searchQuery.trim()) return chunks;
    const q = searchQuery.toLowerCase();
    return chunks.filter(
      (chunk) =>
        chunk.text.toLowerCase().includes(q) ||
        (chunk.section && chunk.section.toLowerCase().includes(q))
    );
  }, [chunks, searchQuery]);

  const sections = useMemo(() => {
    const s = new Set(chunks.map((c) => c.section).filter(Boolean));
    return Array.from(s) as string[];
  }, [chunks]);

  return (
    <div className="space-y-6">
      {/* Search & Filter Bar */}
      <div className="sticky top-18.25 z-40 -mx-1 px-1 py-3 bg-background/80 backdrop-blur-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search chunks by text or section name…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9 bg-muted/30 border-border/50 focus:border-primary/50 transition-colors"
          />
          {searchQuery && (
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
              {filteredChunks.length} / {chunks.length}
            </span>
          )}
        </div>

        {/* Section quick-filters */}
        {sections.length > 1 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            <Button
              variant={searchQuery === "" ? "default" : "ghost"}
              size="sm"
              className="h-6 text-xs cursor-pointer"
              onClick={() => setSearchQuery("")}
            >
              All
            </Button>
            {sections.map((section) => (
              <Button
                key={section}
                variant={
                  searchQuery.toLowerCase() === section.toLowerCase()
                    ? "default"
                    : "ghost"
                }
                size="sm"
                className="h-6 text-xs cursor-pointer"
                onClick={() =>
                  setSearchQuery(
                    searchQuery.toLowerCase() === section.toLowerCase()
                      ? ""
                      : section
                  )
                }
              >
                {section}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Chunk list */}
      {filteredChunks.length > 0 ? (
        <div className="space-y-4">
          {filteredChunks.map((chunk, index) => (
            <ChunkCard key={chunk.id} chunk={chunk} index={index} />
          ))}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Search className="h-12 w-12 text-muted-foreground/30 mb-4" />
          <p className="text-lg font-medium text-muted-foreground">
            No chunks found
          </p>
          <p className="text-sm text-muted-foreground/70 mt-1">
            Try adjusting your search query
          </p>
        </div>
      )}
    </div>
  );
}
