// client/src/app/layout.tsx (Componente del servidor)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/providers/tanstack/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ModalProvider } from "@/providers/modals/modal-providers";
import { HeaderWrapper } from "@/components/HeaderWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ChatGPT Clone",
  description: "A Next.js 15 application that replicates ChatGPT interface",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <HeaderWrapper />
          <ModalProvider>{children}</ModalProvider>
          <Toaster />
        </ReactQueryProvider>
      </body>
    </html>
  );
}
