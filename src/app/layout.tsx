import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AlchMate — OSRS High Alchemy Tracker & Bond Roadmap",
  description: "Live High Alchemy profit tracker, 229 Crafting calculators, and Bond progression roadmap for Old School RuneScape.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0d0f12] text-[#e0e6ed] antialiased">
        {children}
      </body>
    </html>
  );
}
