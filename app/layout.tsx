import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";
import { ClerkProvider } from "@clerk/nextjs";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"),
  title: "paper-to-code",
  description: "Turn academic papers into working PyTorch implementations using RAG and a LLM.",
  openGraph: {
    title: "paper-to-code",
    description: "Turn academic papers into working PyTorch implementations using RAG and a LLM.",
    type: "website",
    images: [
      {
        url: "/open-graph.png",
        width: 1482,
        height: 1886,
        alt: "paper-to-code",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "paper-to-code",
    description: "Turn academic papers into working PyTorch implementations using RAG and a local LLM.",
    images: ["/open-graph.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistMono.variable} ${geistSans.variable} ${geistMono.className} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
    </ClerkProvider>
  );
}
