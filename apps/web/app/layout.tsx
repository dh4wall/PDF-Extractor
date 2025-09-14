import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";
import { Navbar } from "@/components/navbar";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "PDF Dashboard - Invoice Extraction",
  description: "AI-powered PDF invoice data extraction and management dashboard",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={`${inter.className} bg-gray-50`}>
        <Navbar />
        <main>{children}</main>
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}