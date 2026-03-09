"use client";

import dynamic from "next/dynamic";
import { dracula } from "react-code-blocks";
import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "./ui/button";

const CodeBlock = dynamic(
    () => import("react-code-blocks").then((m) => m.CodeBlock),
    { ssr: false }
);

type CodeViewerProps = {
    code: string;
    language?: string;
};

export function CodeViewer({ code, language = "python" }: CodeViewerProps) {
    const [copied, setCopied] = useState(false);

    function handleCopy() {
        navigator.clipboard.writeText(code).then(() => {
            setCopied(true);
            setTimeout(() => setCopied(false), 5000);
        });
    }

    return (
        <div className="relative rounded-xl overflow-hidden border border-border/50 shadow-xl text-sm">
            <Button
                onClick={handleCopy}
                className="absolute top-2.5 right-2.5 z-10 flex items-center gap-1.5 rounded-md bg-white/10 px-2 py-1 text-xs text-white/70 hover:bg-white/20 hover:text-white transition-colors"
                aria-label="Copy code"
            >
                {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                {copied ? "Copied" : "Copy"}
            </Button>
            <CodeBlock
                text={code}
                language={language}
                showLineNumbers
                theme={dracula}
                wrapLongLines={false}
            />
        </div>
    );
}
