'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Shield, Coins, Ticket, User, Layers, Zap } from 'lucide-react';
import { useAlchMate } from '../context/AlchMateContext';
import LinkRuneLiteModal from './LinkRuneLiteModal';

function formatGp(val: number): string {
  if (!val || val === 0) return '0 gp';
  if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return `${val.toLocaleString()} gp`;
}

export default function PlayerHUD() {
  const [showLinkModal, setShowLinkModal] = useState(false);
  const { 
    priceData, 
    userCoins, 
    userNats, 
    totalNetWorth,
    activeAccount, 
    setActiveAccount, 
    allAccounts,
    syncToken,
    isLocalServer
  } = useAlchMate();

  const bondPrice = priceData?.bond?.patient_bid || priceData?.bond?.bid || 11750000;
  const bondProgressPct = Math.min(100, Math.max(0, (totalNetWorth / bondPrice) * 100));

  return (
    <div className="fixed bottom-0 left-0 right-0 z-40 bg-[#121620]/95 backdrop-blur border-t border-[#232b3b] px-4 py-2 text-xs font-mono select-none">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
        {/* Account Switcher */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 text-neutral-300 font-bold bg-[#181d28] px-2.5 py-1 rounded-lg border border-[#2a3449]">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <User className="w-3.5 h-3.5 text-neutral-400" />
            <select
              value={activeAccount}
              onChange={(e) => setActiveAccount(e.target.value)}
              className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
            >
              {allAccounts.map((acc) => (
                <option key={acc} value={acc} className="bg-[#181d28] text-white">
                  {acc}
                </option>
              ))}
            </select>
          </div>

          <span className="hidden sm:inline text-neutral-500">|</span>

          {/* Liquid Cash */}
          <div className="flex items-center gap-1 text-emerald-400 font-bold">
            <Coins className="w-3.5 h-3.5" />
            <span>{formatGp(userCoins)}</span>
          </div>

          {/* Nature Runes */}
          <div className="hidden sm:flex items-center gap-1 text-amber-300 font-bold">
            <span>🌿</span>
            <span>{userNats.toLocaleString()} nats</span>
          </div>
        </div>

        {/* Bond Progress & Total Liquid Wealth */}
        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-1.5 text-neutral-300">
            <span className="text-neutral-400">Total Liquid:</span>
            <strong className="text-white">{formatGp(totalNetWorth)}</strong>
          </div>

          {/* Bond Progress Pill */}
          <Link
            href="/bond"
            className="flex items-center gap-2 bg-[#181d28] hover:bg-[#202738] border border-amber-500/30 px-3 py-1 rounded-lg transition-all group"
          >
            <Ticket className="w-3.5 h-3.5 text-amber-400 group-hover:scale-110 transition-transform" />
            <span className="text-neutral-300">Bond:</span>
            <strong className={bondProgressPct >= 100 ? 'text-emerald-400' : 'text-amber-400'}>
              {bondProgressPct.toFixed(1)}%
            </strong>
            <div className="w-12 h-2 bg-[#0e121a] rounded-full overflow-hidden border border-[#2a3449]">
              <div
                className={`h-full transition-all duration-500 ${
                  bondProgressPct >= 100 ? 'bg-emerald-400' : 'bg-amber-400'
                }`}
                style={{ width: `${bondProgressPct}%` }}
              />
            </div>
          </Link>

          {/* Link RuneLite / Local Server Button */}
          <button
            onClick={() => setShowLinkModal(true)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all font-mono font-bold cursor-pointer ${
              isLocalServer
                ? 'bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : 'bg-[#181d28] hover:bg-[#202738] border border-blue-500/40 text-blue-400 hover:text-blue-300'
            }`}
            title={isLocalServer ? 'Connected directly to RuneLite Local Server (127.0.0.1:18833)' : 'Get your Cloud Sync Key to link RuneLite'}
          >
            <Zap className={`w-3.5 h-3.5 ${isLocalServer ? 'text-emerald-400 animate-pulse' : 'text-amber-400'}`} />
            <span>{isLocalServer ? 'Local Server (Active)' : 'Link RuneLite'}</span>
          </button>
        </div>
      </div>

      <LinkRuneLiteModal
        isOpen={showLinkModal}
        onClose={() => setShowLinkModal(false)}
      />
    </div>
  );
}
