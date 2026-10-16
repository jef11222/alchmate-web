import type { Metadata, Viewport } from "next";
import "./globals.css";
import { AlchMateProvider } from "../context/AlchMateContext";
import StagingGate from "../components/StagingGate";
import Navbar from "../components/Navbar";
import CommunityTierBanner from "../components/CommunityTierBanner";
import PlayerHUD from "../components/PlayerHUD";

export const metadata: Metadata = {
  title: "AlchMate — OSRS Economic Intelligence Platform",
  description: "Live High Alchemy profit tracker, 229 Crafting calculators, 4H GE Limit Timers, and Bond progression roadmap for Old School RuneScape.",
  manifest: "/manifest.json",
  icons: {
    icon: "/favicon.ico",
  },
};

export const viewport: Viewport = {
  themeColor: "#0d0f12",
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-[#0d0f12] text-[#e0e6ed] antialiased flex flex-col">
        <AlchMateProvider>
          <StagingGate>
            <CommunityTierBanner />
            <Navbar />
            <main className="flex-1 pb-16">
              {children}
            </main>
            <PlayerHUD />
          </StagingGate>
        </AlchMateProvider>
      </body>
    </html>
  );
}
