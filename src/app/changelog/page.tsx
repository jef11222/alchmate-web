'use client';

import React, { useState } from 'react';

interface ReleaseNote {
  version: string;
  date: string;
  title: string;
  platforms: ('Web' | 'Plugin')[];
  highlights: string[];
  details: {
    category: string;
    items: string[];
  }[];
}

const RELEASES: ReleaseNote[] = [
  {
    version: 'v2.0.0',
    date: 'October 2026',
    title: 'The Modular Web Suite & QuantScapers Hover Engine',
    platforms: ['Web', 'Plugin'],
    highlights: [
      'Multi-page App Router architecture with 8 dedicated hubs',
      'QuantScapers-style real-time Item Hover Cards with 5m liquidity diagnostics',
      'Proportional Two-Stage Freedom Progress Bar with live split ratio',
      'Persistent Player HUD bottom bar & PWA offline standalone support',
      '1-Click RuneLite Bank Tag Generator & Fill Probability badges',
    ],
    details: [
      {
        category: '🌐 Web Application',
        items: [
          'Deconstructed monolithic layout into high-speed App Router pages (/alch, /crafting, /bond, /timers, /session, /instructions, /changelog).',
          'Rich interactive Item Hover Cards showing 5m volume velocity, spread %, net profit/alch, quote freshness, and 1-tick warnings.',
          'Fixed Grand Exchange tax calculation to strictly enforce Jagex 1% rule (0% for < 100 gp, capped at 5M gp).',
          'Added 1-Tap Mobile Card View for effortless second-screen phone usage.',
          'Added authentic Web Audio synth chime and audio settings modal.',
          'Added 24-hour server cache for Wiki mapping endpoint, preventing rate limits.',
        ],
      },
      {
        category: '🔌 RuneLite Plugin',
        items: [
          'In-game overlay displaying live Alchs/hr, Profit/hr, and Two-Stage Bond Progress directly above inventory.',
          'RuneLite Plugin Hub compliant: 100% client-side privacy with zero telemetry sent to third-party servers.',
          'Capture GE buy limit cooldowns, inventory coins, nature runes, and magic XP drops.',
        ],
      },
    ],
  },
  {
    version: 'v1.2.0',
    date: 'September 2026',
    title: 'World 308 Anvil Intelligence & Bulk Trading Engine',
    platforms: ['Web'],
    highlights: [
      'Added W308 Smither/Crafter mode calculating raw ore forge margins',
      'Anti-Scam verification guide and trade-screen visual alerts',
      'Overnight dip sniper watchlist with 48h percentile calculation',
    ],
    details: [
      {
        category: '🌐 Web Application',
        items: [
          'Added W308 trade sheet with live ask/bid spreads and bulk margins.',
          'Added quick filters for Rune armor, bows, battlestaves, and dragonhide.',
          'Overnight 25th percentile (Safe Bid) and 10th percentile (Deep Bid) pricing.',
        ],
      },
    ],
  },
  {
    version: 'v1.0.0',
    date: 'August 2026',
    title: 'Genesis Release: Web Suite & RuneLite Plugin',
    platforms: ['Web', 'Plugin'],
    highlights: [
      'Initial release of AlchMate RuneLite plugin',
      'Initial release of Next.js cloud web platform',
    ],
    details: [
      {
        category: '🚀 Core Platform',
        items: [
          'High Alchemy margin tracker with instant and patient pricing.',
          'Grand Exchange 4-hour cooldown tracker.',
          'Live OSRS Wiki Weird Gloop API integration.',
        ],
      },
    ],
  },
];

export default function ChangelogPage() {
  const [filterPlatform, setFilterPlatform] = useState<string>('all');

  const filteredReleases = RELEASES.filter((r) => {
    if (filterPlatform === 'all') return true;
    return r.platforms.includes(filterPlatform as any);
  });

  return (
    <div className="space-y-6 max-w-5xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📋</span>
              <h1 className="text-xl md:text-2xl font-bold text-amber-400">Ecosystem Changelog & Release Notes</h1>
            </div>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Track updates across the AlchMate Web App and the official RuneLite Plugin.
            </p>
          </div>

          {/* Platform Filter Buttons */}
          <div className="flex items-center gap-1.5 bg-neutral-950 p-1.5 rounded-lg border border-neutral-800 text-xs">
            <button
              onClick={() => setFilterPlatform('all')}
              className={`px-3 py-1 rounded font-semibold transition ${
                filterPlatform === 'all'
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              All Releases
            </button>
            <button
              onClick={() => setFilterPlatform('Web')}
              className={`px-3 py-1 rounded font-semibold transition ${
                filterPlatform === 'Web'
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              🌐 Web
            </button>
            <button
              onClick={() => setFilterPlatform('Plugin')}
              className={`px-3 py-1 rounded font-semibold transition ${
                filterPlatform === 'Plugin'
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  : 'text-neutral-400 hover:text-neutral-200'
              }`}
            >
              🔌 Plugin
            </button>
          </div>
        </div>
      </div>

      {/* Release List */}
      <div className="space-y-6">
        {filteredReleases.map((release) => (
          <div
            key={release.version}
            className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 shadow-md space-y-4"
          >
            {/* Version & Date */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
              <div>
                <div className="flex items-center gap-3">
                  <span className="text-xl font-black text-amber-400 font-mono">{release.version}</span>
                  <h2 className="text-base font-bold text-neutral-100">{release.title}</h2>
                </div>
                <span className="text-xs text-neutral-500 mt-0.5 block">{release.date}</span>
              </div>

              {/* Platform Badges */}
              <div className="flex items-center gap-1.5">
                {release.platforms.map((p) => {
                  const badgeColor =
                    p === 'Web'
                      ? 'bg-blue-500/10 text-blue-400 border-blue-500/30'
                      : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
                  return (
                    <span
                      key={p}
                      className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${badgeColor}`}
                    >
                      {p === 'Web' && '🌐 Web'}
                      {p === 'Plugin' && '🔌 Plugin'}
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Highlights */}
            <div className="bg-neutral-950/70 border border-neutral-800/80 rounded-lg p-3.5 space-y-2">
              <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
                ✨ Key Highlights
              </span>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs text-neutral-300">
                {release.highlights.map((h, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <span className="text-emerald-400">✔</span>
                    <span>{h}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Detailed Changes */}
            <div className="space-y-4 pt-1">
              {release.details.map((section, idx) => (
                <div key={idx} className="space-y-1.5">
                  <h4 className="text-xs font-bold text-neutral-300 uppercase tracking-wider">
                    {section.category}
                  </h4>
                  <ul className="list-disc list-inside text-xs text-neutral-400 space-y-1 pl-1">
                    {section.items.map((item, i) => (
                      <li key={i} className="leading-relaxed">
                        {item}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
