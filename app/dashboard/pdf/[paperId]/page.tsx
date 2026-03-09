import { getPdf } from "@/app/dashboard/actions/get-pdf";
import { redirect, notFound } from "next/navigation";
import { PDFViewerClient } from "@/components/pdf-viewer-client";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

export default async function PDFPage({ params }: { params: Promise<{ paperId: string }> }) {
  const { paperId } = await params;
  const result = await getPdf(paperId);

  if (result.status === "unauthorized") {
    redirect("/sign-in");
  }

  if (result.status === "not-found") {
    notFound();
  }

  return (
    <>
      <div className="min-h-[calc(100vh-65px)] bg-background">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="mb-6 flex items-center justify-between">
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="gap-2 text-muted-foreground hover:text-foreground cursor-pointer">
                <ArrowLeft className="h-4 w-4" />
                Back
              </Button>
            </Link>
          </div>
          
          <PDFViewerClient base64Pdf={result.pdfBase64} />
        </div>
      </div>
    </>
  )
}
