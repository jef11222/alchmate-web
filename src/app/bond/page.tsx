'use client';

import React, { useState, useMemo, useEffect } from 'react';
import { useAlchMate } from '@/context/AlchMateContext';

const CUSHION_OPTIONS = [
  { label: '3,000,000 gp (Bare Minimum)', value: 3000000, desc: 'Bare minimum needed for a small stack of rune items.' },
  { label: '5,000,000 gp (Lean / Aggressive)', value: 5000000, desc: 'Enough to utilize 3-4 GE slots simultaneously.' },
  { label: '8,000,000 gp (Recommended Balanced)', value: 8000000, desc: 'Optimal starting capital to utilize all 8 GE slots for 1.2M+ gp/hr profit!' },
  { label: '12,000,000 gp (Safe Operating Cushion)', value: 12000000, desc: 'Comfortable cushion allowing overnight buy orders without halting daily alching.' },
  { label: '15,000,000 gp (High-Roller Capital)', value: 15000000, desc: 'High-margin dragonhide bodies and barrows flipping capital.' },
];

const PLAYTIME_OPTIONS = [
  { label: '2 Hours / Day (Casual)', hours: 2 },
  { label: '4 Hours / Day (Steady)', hours: 4 },
  { label: '6 Hours / Day (Dedicated)', hours: 6 },
  { label: '8 Hours / Day (Grinder)', hours: 8 },
  { label: '12 Hours / Day (Hardcore Speedrun)', hours: 12 },
];

const METHOD_OPTIONS = [
  { label: '⚡ Live Active Session Rate', rate: 0 },
  { label: 'F2P Pure High Alch (~780k gp/hr)', rate: 780000 },
  { label: 'F2P Mixed Flipping & Alch (~600k gp/hr)', rate: 600000 },
  { label: 'P2P Members High Alch (~1,200k gp/hr)', rate: 1200000 },
  { label: 'P2P Members Alch + Herb Runs (~1,600k gp/hr)', rate: 1600000 },
];

const SUSTAINER_TIERS = [
  { daily: '35 - 45 mins / day', hrs: 9.2, rateM: 1.2, milestone: '🪙 Infinite Membership (Zero real cash ever again)', badge: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
  { daily: '2 Hours / day', hrs: 28.0, rateM: 1.2, milestone: '⚔️ Mid-Tier Gear (Abyssal whip, Fury, Dragon boots)', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
  { daily: '4 Hours / day', hrs: 56.0, rateM: 1.2, milestone: '🛡️ High-Tier Gear (Bandos tassets, Ahrim\'s, Blowpipe)', badge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-bold' },
  { daily: '6 Hours / day', hrs: 84.0, rateM: 1.2, milestone: '💎 100M+ Bank (Full Zenyte jewelry, Fang)', badge: 'bg-teal-500/10 text-teal-400 border-teal-500/20 font-bold' },
  { daily: '8 Hours / day', hrs: 112.0, rateM: 1.2, milestone: '🏹 Bossing Ready (Bow of Faerdhinen, Crystal armour)', badge: 'bg-amber-500/10 text-amber-400 border-amber-500/20 font-bold' },
  { daily: '12 Hours / day', hrs: 168.0, rateM: 1.2, milestone: '👑 Economy Master (+190M liquid surplus every 14 days!)', badge: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/20 font-bold' },
];

function parseGp(val: string | number): number {
  if (typeof val === 'number') return val;
  if (!val) return 0;
  const clean = val.toString().toLowerCase().trim().replace(/,/g, '');
  if (clean.endsWith('m') || clean.endsWith('kk')) return Math.round(parseFloat(clean) * 1000000);
  if (clean.endsWith('k')) return Math.round(parseFloat(clean) * 1000);
  if (clean.endsWith('b')) return Math.round(parseFloat(clean) * 1000000000);
  return parseInt(clean, 10) || 0;
}

export default function BondRoadmapPage() {
  const { priceData, loading, refreshPrices, showToast, totalNetWorth, userCoins, sessionLog } = useAlchMate();

  // Market Bond Data
  const bond = priceData?.bond;
  const bondAsk = bond?.ask || 12100000;
  const bondSafeBid = bond?.patient_bid || bond?.bid || 11750000;
  const bondSavings = bond?.savings || Math.max(0, bondAsk - bondSafeBid);
  const min7d = bond?.min_7d || 11200000;
  const max7d = bond?.max_7d || 12400000;
  const dailyVol = bond?.daily_vol || 12500;

  // Custom User Inputs
  const [wealthInput, setWealthInput] = useState<string>('0');
  const [hasManuallyEditedWealth, setHasManuallyEditedWealth] = useState(false);
  const [cushion, setCushion] = useState<number>(8000000);
  const [playtimeHours, setPlaytimeHours] = useState<number>(4);
  const [earningMethod, setEarningMethod] = useState<number>(780000); // 780k default F2P

  // Auto-sync wealthInput whenever totalNetWorth or userCoins updates from Cloud Sync
  useEffect(() => {
    if (!hasManuallyEditedWealth) {
      const val = totalNetWorth > 0 ? totalNetWorth : userCoins > 0 ? userCoins : 0;
      if (val > 0) {
        setWealthInput(val.toLocaleString());
      }
    }
  }, [totalNetWorth, userCoins, hasManuallyEditedWealth]);

  const userWealth = useMemo(() => parseGp(wealthInput), [wealthInput]);
  const bondCost = bondSafeBid;
  const totalGoal = bondCost + cushion;

  // Sync wealth from context
  const handleAutoSync = () => {
    const val = totalNetWorth > 0 ? totalNetWorth : userCoins > 0 ? userCoins : 0;
    setWealthInput(val.toLocaleString());
    setHasManuallyEditedWealth(false);
    showToast(`Synced wealth from game: ${val.toLocaleString()} gp`);
  };

  // Copy patient bid
  const handleCopyBid = () => {
    navigator.clipboard.writeText(bondCost.toString());
    showToast(`Copied Patient Dip Bid: ${bondCost.toLocaleString()} gp!`);
  };

  // Progress Calculations
  const splitRatio = totalGoal > 0 ? (bondCost / totalGoal) * 100 : 60;
  const bondProgressPct = bondCost > 0 ? Math.min(100, (userWealth / bondCost) * 100) : 0;
  const cushionAcc = Math.max(0, userWealth - bondCost);
  const cushionProgressPct = cushion > 0 ? Math.min(100, (cushionAcc / cushion) * 100) : 0;

  // Calculate live session rate when "⚡ Live Active Session Rate" (rate: 0) is selected
  const liveSessionRate = useMemo(() => {
    if (sessionLog && sessionLog.length > 0) {
      const totalProfit = sessionLog.reduce((acc, s) => acc + (s.netProfit || 0), 0);
      const totalCasts = sessionLog.reduce((acc, s) => acc + (s.qty || 1), 0);
      const avgProfitPerCast = totalCasts > 0 ? totalProfit / totalCasts : 650;
      return Math.max(100000, Math.round(avgProfitPerCast * 1200));
    }
    return 780000;
  }, [sessionLog]);

  // Pace Calculations
  const neededGp = Math.max(0, totalGoal - userWealth);
  const grindRate = earningMethod > 0 ? earningMethod : liveSessionRate;
  const totalHoursNeeded = grindRate > 0 ? neededGp / grindRate : 0;
  const daysNeeded = playtimeHours > 0 ? totalHoursNeeded / playtimeHours : 0;
  const castsNeeded = Math.round(totalHoursNeeded * 1200);
  const magicXpGained = castsNeeded * 65;

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">🎟️</span>
              <h1 className="text-xl md:text-2xl font-bold text-amber-400">Old School Bond Roadmap & 14-Day Freedom Engine</h1>
            </div>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Track live Old School Bond market prices (Item ID 13190), plan your transition from F2P to Members, and simulate perpetual self-funding membership using High Alchemy profits.
            </p>
          </div>
          <button
            onClick={() => refreshPrices()}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border border-neutral-700 rounded-lg text-sm font-semibold transition"
          >
            <span>🔄</span>
            {loading ? 'Refreshing...' : 'Refresh Bond Market'}
          </button>
        </div>

        {/* Tip Callout */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex items-center gap-2 text-xs text-amber-300/90 italic">
          <span>🌙</span>
          <span>
            <strong>Overnight Dip Sniping:</strong> Never insta-buy a bond during daytime peak hours. Bidding at the overnight valley (01:00-06:00 UTC) saves ~350k-550k gp compared to instant buying!
          </span>
        </div>
      </div>

      {/* 4 Stat Ticker Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Insta-Buy (Ask) */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-neutral-400 font-medium">🛒 Insta-Buy (Ask)</div>
          <div className="text-xl font-bold text-red-400 mt-1">{bondAsk.toLocaleString()} gp</div>
          <p className="text-xs text-neutral-500 mt-1">Lowest active sell offer. Avoid unless you need instant membership.</p>
        </div>

        {/* Card 2: Patient Dip Bid */}
        <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-xl p-4 shadow-sm relative group">
          <div className="flex items-center justify-between">
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <span>🎯</span> Patient Dip Bid
            </span>
            <button
              onClick={handleCopyBid}
              className="text-xs bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 px-2 py-0.5 rounded border border-emerald-500/40 font-semibold transition flex items-center gap-1"
            >
              📋 Copy Bid
            </button>
          </div>
          <div className="text-xl font-bold text-emerald-400 mt-1">{bondSafeBid.toLocaleString()} gp</div>
          <p className="text-xs text-neutral-500 mt-1">Recommended patient GE bid based on 48h percentile dip analysis.</p>
        </div>

        {/* Card 3: Patient Savings */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-neutral-400 font-medium">💰 Patient Bid Savings</div>
          <div className="text-xl font-bold text-cyan-400 mt-1">+{bondSavings.toLocaleString()} gp</div>
          <p className="text-xs text-neutral-500 mt-1">Gold saved by placing a patient bid instead of insta-buying.</p>
        </div>

        {/* Card 4: 7-Day Range & Vol */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-neutral-400 font-medium">📊 7-Day Range & Daily Vol</div>
          <div className="text-base font-bold text-amber-400 mt-1">
            {(min7d / 1000000).toFixed(1)}M - {(max7d / 1000000).toFixed(1)}M gp
          </div>
          <p className="text-xs text-neutral-500 mt-1">~{dailyVol.toLocaleString()} bonds traded per day.</p>
        </div>
      </div>

      {/* Two-Stage Freedom Progress Bar */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-neutral-800 pb-3">
          <div>
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <span>🚀</span> Two-Stage Freedom Progress Bar
            </h2>
            <span className="text-xs text-neutral-400">[Stage 1: Bond Ticket ➔ Stage 2: P2P Operating Cushion]</span>
          </div>

          <div className="text-right">
            <span className="text-xs text-neutral-400">Total Freedom Goal: </span>
            <span className="text-sm font-bold text-emerald-400">{totalGoal.toLocaleString()} gp</span>
          </div>
        </div>

        {/* Wealth & Cushion Controls */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-neutral-950/60 p-4 rounded-lg border border-neutral-800/80">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5 flex items-center justify-between">
              <span>💰 Account Wealth (Coins + Supplies):</span>
              <button
                onClick={handleAutoSync}
                className="text-xs text-emerald-400 hover:text-emerald-300 font-normal underline"
              >
                🔄 Auto-Sync From Game
              </button>
            </label>
            <div className="relative">
              <input
                type="text"
                value={wealthInput}
                onChange={(e) => {
                  setWealthInput(e.target.value);
                  setHasManuallyEditedWealth(true);
                }}
                placeholder="e.g. 5m, 8.5m, 12000000"
                className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-emerald-400 font-bold focus:outline-none focus:border-emerald-500"
              />
              <span className="absolute right-3 top-2.5 text-xs text-neutral-500 font-semibold">gp</span>
            </div>
            <p className="text-xs text-neutral-500 mt-1">Supports shorthand notation: 5m, 8.5m, 12000k.</p>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              🛡️ Operating Cushion:
            </label>
            <select
              value={cushion}
              onChange={(e) => setCushion(Number(e.target.value))}
              className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 font-medium focus:outline-none focus:border-emerald-500"
            >
              {CUSHION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
            <p className="text-xs text-neutral-500 mt-1">
              {CUSHION_OPTIONS.find((c) => c.value === cushion)?.desc}
            </p>
          </div>
        </div>

        {/* Visual Dual Progress Bar */}
        <div className="space-y-2">
          <div className="w-full h-10 bg-neutral-950 rounded-lg border border-neutral-700/80 flex overflow-hidden relative">
            {/* Stage 1 segment container */}
            <div
              className="relative h-full border-r-2 border-neutral-600/80 bg-neutral-900/60 overflow-hidden flex items-center justify-center transition-all duration-300"
              style={{ width: `${splitRatio}%` }}
            >
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                  bondProgressPct >= 100 ? 'bg-gradient-to-r from-emerald-600 to-emerald-500' : 'bg-gradient-to-r from-blue-600 to-blue-500'
                }`}
                style={{ width: `${bondProgressPct}%` }}
              />
              <span className="relative z-10 text-xs font-bold text-white drop-shadow px-2 truncate">
                🎟️ Stage 1: Bond {((bondCost) / 1000000).toFixed(1)}M ({bondProgressPct.toFixed(1)}%)
              </span>
            </div>

            {/* Stage 2 segment container */}
            <div
              className="relative h-full bg-neutral-900/40 overflow-hidden flex items-center justify-center transition-all duration-300"
              style={{ width: `${100 - splitRatio}%` }}
            >
              <div
                className={`absolute left-0 top-0 bottom-0 transition-all duration-500 ${
                  cushionProgressPct >= 100 ? 'bg-gradient-to-r from-teal-500 to-cyan-500' : 'bg-gradient-to-r from-amber-600 to-amber-500'
                }`}
                style={{ width: `${cushionProgressPct}%` }}
              />
              <span className="relative z-10 text-xs font-bold text-white drop-shadow px-2 truncate">
                🛡️ Stage 2: Cushion {((cushion) / 1000000).toFixed(1)}M ({cushionProgressPct.toFixed(1)}%)
              </span>
            </div>
          </div>

          {/* Dynamic Status Pill */}
          <div
            className={`p-3 rounded-lg text-xs md:text-sm font-semibold flex items-center gap-2 border ${
              userWealth < bondCost
                ? 'bg-blue-950/40 text-blue-300 border-blue-800/60'
                : userWealth < totalGoal
                ? 'bg-amber-950/40 text-amber-300 border-amber-800/60'
                : 'bg-emerald-950/40 text-emerald-300 border-emerald-800/60'
            }`}
          >
            {userWealth < bondCost && (
              <>
                <span>🔒</span>
                <span>
                  <strong>Stage 1: Accumulating First Bond</strong> — Need{' '}
                  <span className="font-bold underline">{(bondCost - userWealth).toLocaleString()} gp</span> more to reach Bond purchase threshold ({bondProgressPct.toFixed(1)}% reached).
                </span>
              </>
            )}
            {userWealth >= bondCost && userWealth < totalGoal && (
              <>
                <span>⚠️</span>
                <span>
                  <strong>Stage 2: Bond Cost Secured! Building Operating Cushion</strong> — Need{' '}
                  <span className="font-bold underline">{(totalGoal - userWealth).toLocaleString()} gp</span> more before redeeming so you don&apos;t enter Members broke!
                </span>
              </>
            )}
            {userWealth >= totalGoal && (
              <>
                <span>🎉</span>
                <span>
                  <strong>FREEDOM ACHIEVED!</strong> You have {userWealth.toLocaleString()} gp (Bond {bondCost.toLocaleString()} gp + Full {cushion.toLocaleString()} gp Cushion). You are 100% prepared to dominate Members!
                </span>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Time-to-Goal Engine & Daily Pace Calculator */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="border-b border-neutral-800 pb-3">
          <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
            <span>⏱️</span> Time-to-Goal Engine & Daily Pace Calculator
          </h2>
          <p className="text-xs text-neutral-400 mt-0.5">Calculate your realistic grind time based on your daily schedule and earning method.</p>
        </div>

        {/* Controls Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              🎮 Daily Playtime:
            </label>
            <select
              value={playtimeHours}
              onChange={(e) => setPlaytimeHours(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-sm focus:outline-none focus:border-amber-500"
            >
              {PLAYTIME_OPTIONS.map((opt) => (
                <option key={opt.hours} value={opt.hours}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-neutral-300 mb-1.5">
              ⚡ Earning Method:
            </label>
            <select
              value={earningMethod}
              onChange={(e) => setEarningMethod(Number(e.target.value))}
              className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 text-sm focus:outline-none focus:border-amber-500"
            >
              {METHOD_OPTIONS.map((opt) => (
                <option key={opt.label} value={opt.rate}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 4 Pace Result Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-2">
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3">
            <span className="text-xs text-neutral-400 font-medium">Remaining GP Needed</span>
            <div className="text-lg font-bold text-amber-400 mt-0.5">{neededGp.toLocaleString()} gp</div>
          </div>
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3">
            <span className="text-xs text-neutral-400 font-medium">Total Grind Hours</span>
            <div className="text-lg font-bold text-blue-400 mt-0.5">{totalHoursNeeded.toFixed(1)} Hours</div>
          </div>
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3">
            <span className="text-xs text-neutral-400 font-medium">Days to Freedom Goal</span>
            <div className="text-lg font-bold text-emerald-400 mt-0.5">{daysNeeded.toFixed(1)} Days</div>
            <span className="text-[11px] text-neutral-500">({(daysNeeded * 24).toFixed(0)}h calendar time)</span>
          </div>
          <div className="bg-neutral-950/70 border border-neutral-800 rounded-lg p-3">
            <span className="text-xs text-neutral-400 font-medium">High Alchs / Magic XP</span>
            <div className="text-lg font-bold text-purple-400 mt-0.5">{castsNeeded.toLocaleString()} alchs</div>
            <span className="text-[11px] text-purple-300">+{magicXpGained.toLocaleString()} Magic XP</span>
          </div>
        </div>

        {/* World 308 Secret Callout */}
        <div className="bg-sky-950/30 border border-sky-800/40 rounded-lg p-3.5 mt-2">
          <div className="flex items-center gap-2 text-xs font-bold text-sky-400">
            <span>⚡</span>
            <span>F2P Speed Secret — How to Alch 12h/Day Without Hitting GE Limits:</span>
          </div>
          <p className="text-xs text-sky-200/80 mt-1 leading-relaxed">
            In F2P, the GE limits you to 70 rune items every 4 hours. To alch continuously without waiting for GE limits, visit World 308 at Varrock West Bank (Join as Clan Guest: &apos;Varrock Mob&apos; or trade in Public Chat). High-level smithers sell thousands of noted Rune 2h swords and battleaxes directly in unlimited bulk for GE mid/low! Zero buy limits!
          </p>
        </div>
      </div>

      {/* 14-Day Perpetual Membership Sustainer Simulator */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="border-b border-neutral-800 pb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1">
          <div>
            <h2 className="text-base font-bold text-amber-400 flex items-center gap-2">
              <span>♾️</span> 14-Day Perpetual Membership Sustainer Simulator
            </h2>
            <p className="text-xs text-neutral-400 mt-0.5">
              Shows why your FIRST bond is the only hard one — subsequent bonds are 100% self-funding!
            </p>
          </div>
          <div className="text-xs text-neutral-400">
            Based on Live Bond Price:{' '}
            <span className="font-bold text-amber-400">{bondCost.toLocaleString()} gp</span>
          </div>
        </div>

        {/* Dynamic Table */}
        <div className="overflow-x-auto rounded-lg border border-neutral-800">
          <table className="w-full text-left text-xs md:text-sm">
            <thead className="bg-neutral-950 text-neutral-400 text-xs font-semibold uppercase tracking-wider border-b border-neutral-800">
              <tr>
                <th className="py-3 px-4">Daily Alch Time</th>
                <th className="py-3 px-3 text-center">14-Day Hours</th>
                <th className="py-3 px-4 text-right">Gross P2P Revenue</th>
                <th className="py-3 px-3 text-center">Next Bond Paid?</th>
                <th className="py-3 px-4 text-right">14-Day Bank Surplus</th>
                <th className="py-3 px-4">Player Gear & Wealth Milestone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/60 font-mono">
              {SUSTAINER_TIERS.map((tier) => {
                const grossGp = Math.round(tier.hrs * tier.rateM * 1000000);
                const surplusGp = Math.max(0, grossGp - bondCost);
                const isPaid = grossGp >= bondCost;

                return (
                  <tr key={tier.daily} className="hover:bg-neutral-800/40 transition">
                    <td className="py-3 px-4 font-sans font-semibold text-neutral-200">{tier.daily}</td>
                    <td className="py-3 px-3 text-center text-neutral-400 font-sans">{tier.hrs.toFixed(1)} hrs</td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-400">{grossGp.toLocaleString()} gp</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-xs font-sans font-semibold border ${isPaid ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border-amber-500/20'}`}>
                        {isPaid ? '✅ 100% Fully Paid' : '⚠️ Partial'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-cyan-300">
                      +{surplusGp.toLocaleString()} gp
                    </td>
                    <td className="py-3 px-4 font-sans text-xs text-neutral-300">
                      <span className={`inline-block px-2 py-1 rounded border ${tier.badge}`}>
                        {tier.milestone}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Freedom Takeaway Box */}
        <div className="bg-emerald-950/30 border border-emerald-800/40 rounded-lg p-4">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-400">
            <span>🏆</span>
            <span>The Infinite Membership Guarantee:</span>
          </div>
          <p className="text-xs text-emerald-200/90 mt-1 leading-relaxed">
            Once you cross into Members with your 8M cushion, you only need ~35 to 45 minutes of alching per day to fund perpetual membership forever. At 12 hours a day, you pay off the next bond in under 1 single day, leaving 13 days of pure compounding profit to build an endgame 100M+ bank!
          </p>
        </div>
      </div>
    </div>
  );
}
