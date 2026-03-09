"use client";

import { Toaster } from "sonner";

export function ToastProvider() {
  return (
    <Toaster
      theme="system"
      position="top-center"
      richColors
      expand
    />
  );
}
