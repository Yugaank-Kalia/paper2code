"use client";

import dynamic from "next/dynamic";

export const DeletePaperButton = dynamic(
    () => import("@/components/delete-paper-button").then((m) => m.DeletePaperButton),
    { ssr: false }
);
