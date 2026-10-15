'use client';

import React from 'react';
import Link from 'next/link';

export default function InstructionsPage() {
  return (
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="flex items-center gap-3">
          <span className="text-3xl">📖</span>
          <div>
            <h1 className="text-2xl font-bold text-amber-400">Player Guide & RuneLite Plugin Setup</h1>
            <p className="text-sm text-neutral-400 mt-1">
              Master the AlchMate ecosystem: from linking your live RuneLite client to bypassing 4-hour buy limits on World 308.
            </p>
          </div>
        </div>
      </div>

      {/* Guide Navigation Shortcuts */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <a
          href="#plugin-setup"
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-3 rounded-xl text-center text-xs font-semibold text-neutral-300 hover:text-amber-400 transition"
        >
          🔌 Plugin Setup
        </a>
        <a
          href="#zero-to-alch"
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-3 rounded-xl text-center text-xs font-semibold text-neutral-300 hover:text-amber-400 transition"
        >
          🔰 Zero-to-Alch Guide
        </a>
        <a
          href="#w308-trading"
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-3 rounded-xl text-center text-xs font-semibold text-neutral-300 hover:text-amber-400 transition"
        >
          🛡️ W308 Bulk Trading
        </a>
        <a
          href="#bank-tags"
          className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 p-3 rounded-xl text-center text-xs font-semibold text-neutral-300 hover:text-amber-400 transition"
        >
          🏷️ Bank Tag Import
        </a>
      </div>

      {/* Section 1: RuneLite Plugin Setup */}
      <section id="plugin-setup" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <span className="text-xl">🔌</span>
          <h2 className="text-lg font-bold text-neutral-100">Step 1: Installing & Linking the RuneLite Plugin</h2>
        </div>

        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            AlchMate includes an in-game RuneLite plugin that automatically reads your inventory coins, nature runes, and bank alch supplies in real time.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">1. Download Plugin</span>
              <p className="text-xs text-neutral-400">
                Download the compiled <code className="text-amber-300 font-mono">AlchMatePlugin.jar</code> from the homepage or release artifacts.
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">2. Copy to Plugin Folder</span>
              <p className="text-xs text-neutral-400">
                Place the JAR in your RuneLite external plugins folder:
                <br />
                <code className="text-[11px] text-neutral-300 font-mono block mt-1 bg-neutral-900 p-1 rounded">
                  ~/.runelite/plugins/
                </code>
              </p>
            </div>

            <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">3. Enable In-Game</span>
              <p className="text-xs text-neutral-400">
                Launch RuneLite, open the Plugin Hub sidebar, search for &quot;AlchMate&quot;, and toggle it ON. Your live coins and nats will sync immediately!
              </p>
            </div>
          </div>

          <div className="bg-emerald-950/20 border border-emerald-800/40 p-3 rounded-lg text-xs text-emerald-300 flex items-center gap-2">
            <span>✅</span>
            <span>
              <strong>Dual Mode Bridge:</strong> The plugin communicates locally with the Desktop Companion via <code className="font-mono">127.0.0.1:18833</code> and seamlessly syncs to the Web App via your private sync token!
            </span>
          </div>
        </div>
      </section>

      {/* Section 2: Zero-to-Alch Beginner Checklist */}
      <section id="zero-to-alch" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <span className="text-xl">🔰</span>
          <h2 className="text-lg font-bold text-neutral-100">Step 2: The &quot;Zero-to-Alch&quot; Beginner Roadmap</h2>
        </div>

        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            If you are starting on a fresh account or new to Old School RuneScape economics, follow this exact progression to turn 100k coins into millions:
          </p>

          <div className="space-y-3">
            <div className="flex items-start gap-3 bg-neutral-950 p-3.5 rounded-lg border border-neutral-800">
              <span className="text-base">1️⃣</span>
              <div>
                <strong className="text-neutral-100 block">Level 55 Magic Requirement:</strong>
                <span className="text-xs text-neutral-400">
                  High Alchemy requires Level 55 Magic. You can achieve this in under 3 hours by splashing Wind Strike/Fire Strike on a Seagull in Port Sarim, or casting Curse and Camelot Teleports.
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-neutral-950 p-3.5 rounded-lg border border-neutral-800">
              <span className="text-base">2️⃣</span>
              <div>
                <strong className="text-neutral-100 block">Equip a Staff of Fire:</strong>
                <span className="text-xs text-neutral-400">
                  High Alchemy consumes 5 Fire Runes and 1 Nature Rune per cast. Wielding any Fire Staff (Fire Staff, Lava Staff, Tome of Fire) provides unlimited fire runes, reducing your per-cast cost strictly to 1 Nature Rune!
                </span>
              </div>
            </div>

            <div className="flex items-start gap-3 bg-neutral-950 p-3.5 rounded-lg border border-neutral-800">
              <span className="text-base">3️⃣</span>
              <div>
                <strong className="text-neutral-100 block">Use the &quot;My Cash Stack&quot; Filter:</strong>
                <span className="text-xs text-neutral-400">
                  Head over to the <Link href="/alch" className="text-amber-400 underline font-semibold">High Alch Suite</Link> and click your starting budget (e.g. <code className="text-emerald-400 font-mono">[ 100k ]</code> or <code className="text-emerald-400 font-mono">[ 500k ]</code>). The table automatically isolates high-ROI consumables and affordable rune items you can purchase immediately!
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Section 3: World 308 Bulk Trading & Anti-Scam Verification */}
      <section id="w308-trading" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <span className="text-xl">🛡️</span>
          <h2 className="text-lg font-bold text-neutral-100">Step 3: World 308 Bulk Trading & Anti-Scam Guide</h2>
        </div>

        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            Grand Exchange buy limits prevent players from buying more than 70 rune weapons/armor every 4 hours. To alch for 4 to 12 hours a day without stopping, players use player-to-player bulk trading on <strong>World 308</strong>.
          </p>

          <div className="bg-neutral-950 p-4 rounded-lg border border-neutral-800 space-y-3">
            <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">How World 308 Works:</h4>
            <ul className="list-disc list-inside text-xs text-neutral-300 space-y-1.5 leading-relaxed">
              <li>
                <strong>Location:</strong> Varrock West Bank on World 308 (F2P).
              </li>
              <li>
                <strong>Clan Chat:</strong> Join Clan Chat as guest: <code className="text-amber-300 font-mono font-bold">&quot;Varrock Mob&quot;</code> or look for smithers advertising in public chat.
              </li>
              <li>
                <strong>Unlimited Volume:</strong> 99 Smithers craft thousands of Rune 2h swords, Rune battleaxes, and Adamant platebodies daily. They sell them directly to alchers in noted bulk stacks at GE mid/low price.
              </li>
              <li>
                <strong>Zero Grand Exchange Tax:</strong> Player-to-player trades have <strong>0% tax</strong>, meaning both buyers and sellers make more gold than using the GE!
              </li>
            </ul>
          </div>

          {/* Anti Scam Warning */}
          <div className="bg-red-950/30 border border-red-700/50 p-4 rounded-lg space-y-2">
            <div className="flex items-center gap-2 text-sm font-bold text-red-400">
              <span>⚠️</span>
              <span>Crucial Anti-Scam Warning for Bulk Trades:</span>
            </div>
            <p className="text-xs text-red-200/90 leading-relaxed">
              Always verify the second trade screen carefully! Dishonest traders occasionally attempt to swap noted <strong className="text-white">Rune 2h swords</strong> (alch 38,400 gp) for visually identical noted <strong className="text-white">Mithril 2h swords</strong> (alch 2,600 gp) or Adamant items. Hover over the noted items and ensure the name text reads &quot;Rune&quot; before accepting!
            </p>
          </div>
        </div>
      </section>

      {/* Section 4: 1-Click RuneLite Bank Tag Import */}
      <section id="bank-tags" className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-neutral-800 pb-3">
          <span className="text-xl">🏷️</span>
          <h2 className="text-lg font-bold text-neutral-100">Step 4: 1-Click RuneLite Bank Tag Generator</h2>
        </div>

        <div className="space-y-4 text-sm text-neutral-300">
          <p>
            Organizing your bank for high alching takes seconds with AlchMate&apos;s bank tag exporter:
          </p>

          <ol className="list-decimal list-inside text-xs text-neutral-300 space-y-2">
            <li>
              In the <Link href="/alch" className="text-amber-400 underline font-semibold">High Alch Suite</Link>, add items to your Cart or select top items.
            </li>
            <li>
              Click the <code className="text-emerald-400 font-mono bg-neutral-950 px-2 py-0.5 rounded border border-neutral-800">📋 Copy Bank Tag</code> button in the cart summary bar.
            </li>
            <li>
              Open RuneLite in-game and make sure the official <strong>&quot;Bank Tags&quot;</strong> plugin is enabled.
            </li>
            <li>
              Open your bank, right-click the plus (+) icon at the top of the bank tab bar, and choose <strong>&quot;Import Tag Tab&quot;</strong>.
            </li>
            <li>
              Press <code className="bg-neutral-950 px-1.5 py-0.5 rounded border border-neutral-800 text-neutral-200">Ctrl + V</code>. RuneLite will create a dedicated &quot;AlchMate&quot; tab containing all your alch items!
            </li>
          </ol>
        </div>
      </section>
    </div>
  );
}
