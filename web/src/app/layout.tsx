import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import { ThemeProvider } from "@/context/ThemeContext";

export const metadata: Metadata = {
  title: "OrderOCR — AI-Powered Work Order Extraction",
  description:
    "Extract, manage, and export work order data using AI-powered OCR with Gemini 2.5 Flash.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="bg-slate-50 dark:bg-[#0b0f1a] text-slate-900 dark:text-slate-100 min-h-screen">
        <ThemeProvider>
          <div className="flex min-h-screen">
            <Sidebar />
            <main className="flex-1 ml-[260px] p-8 relative z-[1]">{children}</main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
