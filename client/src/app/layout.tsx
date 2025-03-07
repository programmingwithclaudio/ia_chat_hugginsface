// client/src/app/layout.tsx (Componente del servidor)
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ReactQueryProvider } from "@/providers/tanstack/query-provider";
import { Toaster } from "@/components/ui/sonner";
import { ModalProvider } from "@/providers/modals/modal-providers";
import { HeaderWrapper } from "@/components/HeaderWrapper";
import { ThemeProvider } from "@/providers/dashboard/theme-provider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "OakChat AI",
  description: "A Next.js 15 application that OakChat AI",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <ReactQueryProvider>
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <HeaderWrapper />
            <ModalProvider>{children}</ModalProvider>
            <Toaster />
          </ThemeProvider>
        </ReactQueryProvider>
      </body>
    </html>
  );
}
