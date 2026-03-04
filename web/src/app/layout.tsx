import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";

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
    <html lang="en">
      <body>
        <div className="app-layout">
          <Sidebar />
          <main className="main-content">{children}</main>
        </div>
      </body>
    </html>
  );
}
