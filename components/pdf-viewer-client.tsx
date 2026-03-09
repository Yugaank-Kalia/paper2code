"use client";

import dynamic from "next/dynamic";

export const PDFViewerClient = dynamic(
  () => import("@/components/pdf-viewer").then((m) => m.PDFViewer),
  { ssr: false }
);
