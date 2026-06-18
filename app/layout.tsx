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
  title: "Rancang.ai - AI Document Generator",
  description:
    "Rancang dokumen spesifikasi produkmu secara otomatis menggunakan AI. Dari PRD, design.md, hingga stitch spec — semua dalam hitungan detik.",
  keywords: "PRD, design spec, product requirements, AI, product management, generator, rancang",
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
