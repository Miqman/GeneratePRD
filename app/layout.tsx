import type { Metadata } from "next";
import { Manrope, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";

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
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"),
  openGraph: {
    title: "Rancang.ai - AI Document Generator",
    description: "Rancang dokumen spesifikasi produkmu secara otomatis menggunakan AI. Dari PRD, design.md, hingga stitch spec.",
    url: "https://rancang.ai",
    siteName: "Rancang.ai",
    locale: "id_ID",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Rancang.ai - AI Document Generator",
    description: "Rancang dokumen spesifikasi produkmu secara otomatis menggunakan AI. Dari PRD, design.md, hingga stitch spec.",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id" suppressHydrationWarning>
      <body className={`${manrope.variable} ${jetbrainsMono.variable} antialiased font-body-md`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
          <TooltipProvider>
            {children}
            <Toaster
              position="bottom-right"
              toastOptions={{
                className: "bg-card border border-border text-foreground",
              }}
            />
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
