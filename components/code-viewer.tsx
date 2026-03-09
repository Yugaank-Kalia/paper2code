"use client";

import dynamic from "next/dynamic";
import { dracula } from "react-code-blocks";

const CodeBlock = dynamic(
    () => import("react-code-blocks").then((m) => m.CodeBlock),
    { ssr: false }
);

type CodeViewerProps = {
    code: string;
    language?: string;
};

export function CodeViewer({ code, language = "python" }: CodeViewerProps) {
    return (
        <div className="rounded-xl overflow-hidden border border-border/50 shadow-xl text-sm">
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
