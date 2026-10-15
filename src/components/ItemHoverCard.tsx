'use client';

import React from 'react';
import Image from 'next/image';
import { AlchItem } from '@/context/AlchMateContext';

interface ItemHoverCardProps {
  item: AlchItem;
  natPrice?: number;
  position?: { x: number; y: number };
}

export default function ItemHoverCard({ item, natPrice = 170 }: ItemHoverCardProps) {
  const spread = Math.max(0, item.ask - item.bid);
  const spreadPct = item.buy_price > 0 ? ((spread / item.buy_price) * 100).toFixed(1) : '0.0';
  const batchProfit = item.profit * item.buy_limit;
  const tradesPerHour = (item.vol_5m_total || 0) * 12;

  // Freshness string
  const formatAge = (secs: number) => {
    if (!secs || secs >= 999999) return 'Unknown';
    if (secs < 60) return `${secs}s ago`;
    const mins = Math.floor(secs / 60);
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    return `${hrs}h ago`;
  };

  const ageStr = formatAge(item.secs_since_trade);
  const isStale = (item.secs_since_trade || 0) > 600;

  // 1-Tick Activity Verdict
  const volBid = item.vol_5m_bid || 0;
  let activityVerdict = { text: '⚠️ No 5m Sales Recorded (0 sold) - Potential outlier', color: 'text-red-400 bg-red-950/30 border-red-800/40' };
  if (volBid >= 3) {
    activityVerdict = { text: `✓ Real Activity (${volBid} sold in 5m) - High fill confidence`, color: 'text-emerald-400 bg-emerald-950/30 border-emerald-800/40' };
  } else if (volBid > 0) {
    activityVerdict = { text: `⚠️ Low Activity (${volBid} sold in 5m) - Small batch recommended`, color: 'text-amber-400 bg-amber-950/30 border-amber-800/40' };
  }

  // Warnings
  const warnings: string[] = [];
  if (volBid === 0 && item.profit > 500) {
    warnings.push(`Low 5m Liquidity: 0 items sold into bids in the last 5 minutes. Profit may reflect a temporary price anomaly.`);
  }
  if (Number(spreadPct) > 15) {
    warnings.push(`Wide Spread (${spreadPct}%): Bid/Ask spread is wide. Instant fills will be unfavorable; use patient bidding.`);
  }
  if (isStale) {
    warnings.push(`Stale Quote: Last recorded GE transaction was ${ageStr}. Double-check active GE price in-game.`);
  }

  return (
    <div className="w-80 bg-neutral-900/98 backdrop-blur-md border border-neutral-700/80 rounded-xl p-4 shadow-2xl text-xs space-y-3 z-50 text-neutral-200 pointer-events-none transition-all">
      {/* Header */}
      <div className="flex items-start justify-between gap-2 border-b border-neutral-800 pb-2.5">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center relative overflow-hidden shrink-0">
            <Image
              src={item.icon || `https://static.runelite.net/cache/item/icon/${item.id}.png`}
              alt={item.name}
              width={28}
              height={28}
              unoptimized
              className="object-contain"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
          </div>
          <div>
            <h4 className="font-bold text-sm text-neutral-100 leading-tight line-clamp-1">{item.name}</h4>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className="text-[10px] text-neutral-500 font-mono">ID: {item.id}</span>
              <span
                className={`text-[9px] font-bold px-1.5 py-0.2 rounded font-sans ${
                  item.members
                    ? 'bg-purple-500/10 text-purple-300 border border-purple-500/20'
                    : 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20'
                }`}
              >
                {item.members ? 'P2P' : 'F2P'}
              </span>
            </div>
          </div>
        </div>

        {/* Speed / Fill Badge */}
        <span
          className={`text-[10px] px-2 py-0.5 rounded font-semibold border shrink-0 ${
            item.speed_category === 'fast'
              ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30'
              : item.speed_category === 'steady'
              ? 'bg-blue-500/15 text-blue-400 border-blue-500/30'
              : 'bg-amber-500/15 text-amber-400 border-amber-500/30'
          }`}
        >
          {item.speed_label || 'Steady'}
        </span>
      </div>

      {/* Pricing & Profit Grid */}
      <div className="space-y-1.5 font-mono text-[11px]">
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">Target Offer (Bid):</span>
          <span className="font-bold text-neutral-200">{item.bid.toLocaleString()} gp</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">Instant Buy (Ask):</span>
          <span className="text-neutral-300">
            {item.ask.toLocaleString()} gp <span className="text-neutral-500 text-[10px]">({spreadPct}% sprd)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">High Alch Payout:</span>
          <span className="font-bold text-amber-400">{item.highalch.toLocaleString()} gp</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">Nature Rune Cost:</span>
          <span className="text-neutral-400">{natPrice.toLocaleString()} gp</span>
        </div>

        <div className="border-t border-neutral-800/80 pt-1.5 flex justify-between text-xs">
          <span className="text-neutral-300 font-sans font-semibold">Net Profit / Alch:</span>
          <span className={`font-bold ${item.profit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {item.profit >= 0 ? `+${item.profit.toLocaleString()}` : item.profit.toLocaleString()} gp{' '}
            <span className="text-[10px] font-normal">({item.roi >= 0 ? `+${item.roi.toFixed(1)}` : item.roi.toFixed(1)}%)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">Hourly Rate (1.2k/hr):</span>
          <span className="font-bold text-emerald-400 font-mono">
            +{(item.hourly_profit / 1000).toFixed(0)}k gp/hr
          </span>
        </div>
      </div>

      {/* Volume & Market Velocity */}
      <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-lg p-2.5 space-y-1 text-[11px] font-mono">
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">24h Traded Volume:</span>
          <span className="text-neutral-200">{item.volume.toLocaleString()} items</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">5m Sells into Bids:</span>
          <span className={volBid >= 3 ? 'text-emerald-400 font-bold' : 'text-neutral-400'}>
            {volBid.toLocaleString()} items
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">5m Total Traded:</span>
          <span className="text-neutral-300">
            {(item.vol_5m_total || 0).toLocaleString()} <span className="text-neutral-500 text-[10px]">(~{tradesPerHour.toLocaleString()}/hr)</span>
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400 font-sans">4h Buy Limit:</span>
          <span className="text-neutral-200">{item.buy_limit.toLocaleString()} items</span>
        </div>
        <div className="flex justify-between pt-0.5 border-t border-neutral-850">
          <span className="text-neutral-400 font-sans">4h Batch Profit:</span>
          <span className={`font-bold ${batchProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
            {batchProfit >= 0 ? `+${batchProfit.toLocaleString()}` : batchProfit.toLocaleString()} gp
          </span>
        </div>
        <div className="flex justify-between text-[10px]">
          <span className="text-neutral-500 font-sans">Quote Freshness:</span>
          <span className={isStale ? 'text-amber-400' : 'text-neutral-500'}>{ageStr}</span>
        </div>
      </div>

      {/* 1-Tick Activity Verdict */}
      <div className={`p-2 rounded-lg text-[10px] font-semibold border ${activityVerdict.color}`}>
        {activityVerdict.text}
      </div>

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="space-y-1">
          {warnings.map((w, idx) => (
            <div key={idx} className="p-1.5 rounded bg-red-950/40 border border-red-800/50 text-[10px] text-red-300">
              {w}
            </div>
          ))}
        </div>
      )}

      {/* Footer Hint */}
      <div className="text-[10px] text-neutral-500 italic pt-0.5 text-center">
        💡 Click row to add to Cart | Copy price for GE offer
      </div>
    </div>
  );
}
