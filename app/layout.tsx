import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains",
  display: "swap",
});

export const metadata: Metadata = {
  title: "prdforge.ai - AI PRD Generator",
  description:
    "Generate Product Requirements Document (PRD) secara otomatis menggunakan AI. Masukkan ide produkmu, dapatkan PRD lengkap dalam hitungan detik.",
  keywords: "PRD, product requirements document, AI, product management, generator",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" className="dark">
      <body className={`${manrope.variable} ${jetbrainsMono.variable} antialiased font-body-md`}>
        <TooltipProvider>
          {children}
          <Toaster
            theme="dark"
            position="bottom-right"
            toastOptions={{
              style: {
                background: "#151c27",
                border: "1px solid #374151",
                color: "#f3f4f6",
              },
            }}
          />
        </TooltipProvider>
      </body>
    </html>
  );
}
