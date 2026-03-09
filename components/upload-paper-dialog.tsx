"use client";

import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ArrowRight, LoaderCircle, Upload } from "lucide-react";
import { useRouter } from "next/navigation";
import { uploadPaper } from "@/app/dashboard/actions/upload-paper";

export function UploadPaperDialog({ text }: { text: string }) {
  const { isLoaded, userId } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>("");

  const router = useRouter();

  const handleGetStartedClick = () => {
    if (!isLoaded) return;
    if (!userId) {
      router.push("/sign-up");
      return;
    }
    setIsOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    if (file) {
      setFileName(file.name);
    }
  };

  const handleUpload = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const file = formData.get("paper") as File;

    if (!file) {
      toast.error("Please select a file");
      return;
    }

    setIsLoading(true);

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", file);

      const result = await uploadPaper(uploadFormData);

      if (result.status === "unauthorized") {
        router.push("/sign-up");
        return;
      }

      if (result.status === "error") {
        toast.error("Upload failed", { description: result.message });
        setFileName("");
        return;
      }

      setIsOpen(false);
      setFileName("");
      router.push(`/dashboard`);
      toast.success("Paper uploaded successfully!", {
        description: `${result.originalName} (${(result.size / 1024 / 1024).toFixed(2)} MB)`,
      });
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload paper", {
        description: "Please try again or contact support",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialog open={isOpen} onOpenChange={setIsOpen}>
      <Button size="lg" className="gap-2" onClick={handleGetStartedClick}>
        { text === 'Get Started' ? <>{text} <ArrowRight className="h-4 w-4" /></> : text }
      </Button>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Upload Your Paper</AlertDialogTitle>
          <AlertDialogDescription>
            Select a PDF or research paper to convert into code
          </AlertDialogDescription>
        </AlertDialogHeader>

        <form onSubmit={handleUpload} className="space-y-4">
          <div className="flex items-center justify-center w-full py-6">
            <label
              htmlFor="paper-upload"
              className="flex flex-col items-center justify-center w-full h-64 border-2 border-dashed border-border rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition"
            >
              {isLoading ? (
                <div className="flex h-full w-full flex-col items-center justify-center gap-2">
                  <LoaderCircle className="h-6 w-6 animate-spin text-primary" />
                  <p className="text-sm text-muted-foreground">Uploading...</p>
                </div>
              ) : (
                <>
                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">
                  {fileName || "Click to upload or drag and drop"}
                </p>
                {fileName && (
                  <p className="text-xs text-primary mt-1">{fileName}</p>
                )}
              </div>
                <Input
                  id="paper-upload"
                  name="paper"
                  type="file"
                  accept=".pdf,.txt,.md"
                  onChange={handleFileChange}
                  className="hidden"
                  disabled={isLoading}
                />
                </>
              )}
            </label>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <AlertDialogCancel asChild>
              <Button disabled={isLoading} variant="outline">Cancel</Button>
            </AlertDialogCancel>
            <Button type="submit" disabled={isLoading || !fileName}>
              {isLoading ? (
                <>
                  Uploading...
                </>
              ) : (
                "Upload Paper"
              )}
            </Button>
          </div>
        </form>
      </AlertDialogContent>
    </AlertDialog>
  );
}
