'use client';

import React from 'react';
import Link from 'next/link';
import { 
  Flame, 
  Coins, 
  Hammer, 
  Ticket, 
  Clock, 
  ShieldCheck, 
  CheckCircle2, 
  ArrowRight, 
  TrendingUp, 
  Sparkles,
  Download,
  AlertTriangle,
  Cpu
} from 'lucide-react';
import { useAlchMate, AlchItem } from '../context/AlchMateContext';
import ItemHoverCard from '../components/ItemHoverCard';

function formatGp(val: number): string {
  if (!val || val === 0) return '0 gp';
  if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return `${val.toLocaleString()} gp`;
}

export default function HomePage() {
  const { priceData, loading, effectiveNatPrice } = useAlchMate();
  const [hoveredItem, setHoveredItem] = React.useState<AlchItem | null>(null);
  const [hoverPos, setHoverPos] = React.useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Top 5 trending alch items
  const trendingAlchs = React.useMemo(() => {
    if (!priceData?.items) return [];
    return priceData.items
      .filter((it) => it.hourly_profit > 0 && it.volume >= 50)
      .sort((a, b) => b.hourly_profit - a.hourly_profit)
      .slice(0, 5);
  }, [priceData]);

  const bondPrice = priceData?.bond?.patient_bid || priceData?.bond?.bid || 11750000;
  const bondSavings = priceData?.bond?.savings || 420000;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-12">
      {/* Hero Welcome Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#161a24] via-[#12151e] to-[#0c0e14] border border-[#262f42] p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 max-w-3xl space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Old School RuneScape Economic Intelligence</span>
          </div>

          <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight leading-tight">
            Stop guessing your alchs. <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-yellow-300">
              Maximize every single cast.
            </span>
          </h1>

          <p className="text-neutral-300 text-sm md:text-base leading-relaxed">
            Real-time Grand Exchange margins, 229 verified production crafting recipes, 4-hour buy limit tracking, and the authentic 14-day Bond Freedom Roadmap.
          </p>

          {/* 3-Step Quick Goal Switcher */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2">
            <Link
              href="/alch"
              className="group p-4 rounded-2xl bg-[#181d28]/80 hover:bg-[#202738] border border-[#2a3449] hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-amber-500/10 text-amber-400 group-hover:scale-110 transition-transform">
                  <Coins className="w-5 h-5" />
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-amber-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Make Gold Now</h3>
                <p className="text-xs text-neutral-400 mt-0.5">High Alch margins & W308 bulk trading</p>
              </div>
            </Link>

            <Link
              href="/crafting"
              className="group p-4 rounded-2xl bg-[#181d28]/80 hover:bg-[#202738] border border-[#2a3449] hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:scale-110 transition-transform">
                  <Hammer className="w-5 h-5" />
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-emerald-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Train Skills for Profit</h3>
                <p className="text-xs text-neutral-400 mt-0.5">229 recipes with exact 1% GE tax</p>
              </div>
            </Link>

            <Link
              href="/bond"
              className="group p-4 rounded-2xl bg-[#181d28]/80 hover:bg-[#202738] border border-[#2a3449] hover:border-amber-500/40 transition-all flex flex-col justify-between"
            >
              <div className="flex items-center justify-between mb-3">
                <span className="p-2 rounded-xl bg-cyan-500/10 text-cyan-400 group-hover:scale-110 transition-transform">
                  <Ticket className="w-5 h-5" />
                </span>
                <ArrowRight className="w-4 h-4 text-neutral-500 group-hover:text-cyan-400 transition-colors" />
              </div>
              <div>
                <h3 className="font-bold text-white text-sm">Roadmap to a Bond</h3>
                <p className="text-xs text-neutral-400 mt-0.5">Two-stage freedom engine & cushion</p>
              </div>
            </Link>
          </div>
        </div>
      </section>

      {/* Newbie Section: "Zero-to-Alch" Interactive 3-Step Checklist */}
      <section className="bg-[#141721] border border-[#262e40] rounded-2xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 border-b border-[#202636] pb-4">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-400" />
              Zero-to-Alch: Newbie Starter Checklist
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Follow these three fundamental rules before spending your first coin on alchemy supplies.
            </p>
          </div>
          <span className="text-xs font-mono font-semibold px-2.5 py-1 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20">
            F2P & P2P Friendly
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-[#191e2a] border border-[#2b3548] p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-amber-500/20 flex items-center justify-center text-xs">1</span>
              <span>Level 55 Magic Required</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              High Level Alchemy unlocks strictly at <strong>level 55 Magic</strong>. Need XP to get there?
            </p>
            <Link
              href="/crafting"
              className="inline-flex items-center gap-1 text-xs text-amber-400 hover:text-amber-300 font-bold pt-1"
            >
              Open Level 1–55 Training Guide &rarr;
            </Link>
          </div>

          <div className="bg-[#191e2a] border border-[#2b3548] p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-emerald-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-emerald-500/20 flex items-center justify-center text-xs">2</span>
              <span>Equip a Staff of Fire</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              High Alch requires 1 Nature Rune and 5 Fire Runes. <strong>Always equip a Fire Staff</strong> (Staff of Fire, Fire Battlestaff, or Mystic Fire Staff) to get unlimited free fire runes.
            </p>
          </div>

          <div className="bg-[#191e2a] border border-[#2b3548] p-5 rounded-xl space-y-2">
            <div className="flex items-center gap-2 text-cyan-400 font-bold text-sm">
              <span className="w-6 h-6 rounded-full bg-cyan-500/20 flex items-center justify-center text-xs">3</span>
              <span>Patient Nature Rune Buying</span>
            </div>
            <p className="text-xs text-neutral-300 leading-relaxed">
              Never insta-buy Nature Runes at peak daytime prices. Place patient buy orders overnight or use Explorer&apos;s Ring for 30 daily zero-cost casts. Current live Nat: <strong>{effectiveNatPrice} gp</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* World 308 Anti-Scam / Safe-Trade Verification Banner */}
      <section className="bg-[#1a202c] border border-amber-500/30 rounded-2xl p-6 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
          <span>World 308 Safe Trading Guide — Avoid Common Trade Window Tricks:</span>
        </div>
        <p className="text-xs text-neutral-200 leading-relaxed">
          When buying bulk noted alchables (Rune 2h swords, Rune battleaxes, Rune platelegs) in World 308 Varrock West Bank, <strong>always double-check the second trade screen</strong>. Confirm the noted items are genuine <strong>Rune</strong> (not Mithril or Adamantite swapped at the last second), and verify the total gold equals <code className="bg-[#12151e] px-1.5 py-0.5 rounded text-amber-300">quantity &times; unit price</code> before accepting.
        </p>
      </section>

      {/* Trending Top 5 Alch Workhorses Live Preview */}
      <section className="space-y-4">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              Live Trending Alch Opportunities
            </h2>
            <p className="text-xs text-neutral-400">
              Real-time prices from the official OSRS Wiki API (updated every 60s)
            </p>
          </div>
          <Link
            href="/alch"
            className="text-xs text-amber-400 hover:text-amber-300 font-bold flex items-center gap-1"
          >
            View Full Table ({priceData?.items?.length || 0} items) &rarr;
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {loading ? (
            Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="h-32 bg-[#141721] rounded-2xl animate-pulse border border-[#242b3b]" />
            ))
          ) : (
            trendingAlchs.map((item) => (
              <div
                key={item.id}
                className="bg-[#141721] border border-[#242b3b] hover:border-amber-500/40 p-4 rounded-2xl space-y-2 transition-all flex flex-col justify-between cursor-pointer"
                onMouseEnter={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  const x = Math.min(window.innerWidth - 340, Math.max(10, rect.left));
                  const y = Math.min(window.innerHeight - 480, Math.max(10, rect.top - 100));
                  setHoverPos({ x, y });
                  setHoveredItem(item);
                }}
                onMouseLeave={() => setHoveredItem(null)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <img
                      src={`https://static.runelite.net/cache/item/icon/${item.id}.png`}
                      alt={item.name}
                      className="w-7 h-7 object-contain shrink-0"
                      onError={(e) => { e.currentTarget.style.display = 'none'; }}
                    />
                    <span className="font-bold text-white text-xs line-clamp-1">{item.name}</span>
                  </div>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                    item.members ? 'bg-purple-500/10 text-purple-300' : 'bg-emerald-500/10 text-emerald-300'
                  }`}>
                    {item.members ? 'P2P' : 'F2P'}
                  </span>
                </div>

                <div className="space-y-1 font-mono text-xs">
                  <div className="flex justify-between text-neutral-400">
                    <span>Buy:</span>
                    <strong className="text-white">{item.buy_price.toLocaleString()} gp</strong>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Profit ea:</span>
                    <strong className="text-emerald-400">+{item.profit.toLocaleString()} gp</strong>
                  </div>
                  <div className="flex justify-between text-neutral-400">
                    <span>Rate:</span>
                    <strong className="text-amber-400">+{Math.round(item.hourly_profit / 1000)}k/hr</strong>
                  </div>
                </div>

                <Link
                  href="/alch"
                  className="w-full text-center py-1.5 rounded-lg bg-[#191e28] hover:bg-amber-500 hover:text-black text-neutral-300 font-bold text-[11px] transition-all border border-[#262e3f]"
                >
                  Analyze &rarr;
                </Link>
              </div>
            ))
          )}
        </div>
      </section>

      {/* RuneLite Plugin CTA Banner */}
      <section className="bg-gradient-to-r from-[#17202e] to-[#121620] border border-[#2b3952] rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-2xl font-black text-white">AlchMate RuneLite Plugin</h2>
          <p className="text-xs md:text-sm text-neutral-300 max-w-xl">
            Track your alchemy efficiency with our 100% local in-game overlay, side panel launcher, profit rate tracker, and 1-click Bank Tag integration.
          </p>
        </div>
        <Link
          href="/instructions"
          className="shrink-0 px-6 py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm shadow-lg shadow-amber-500/25 transition-all flex items-center gap-2"
        >
          <Cpu className="w-4 h-4" />
          <span>Local Hub Guide &rarr;</span>
        </Link>
      </section>
      {/* Floating Hover Info Card */}
      {hoveredItem && (
        <div
          className="fixed z-50 pointer-events-none transition-all duration-75"
          style={{ left: `${hoverPos.x}px`, top: `${hoverPos.y}px` }}
        >
          <ItemHoverCard item={hoveredItem} natPrice={effectiveNatPrice} />
        </div>
      )}
    </div>
  );
}
