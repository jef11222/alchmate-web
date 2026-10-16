'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { 
  Flame, 
  Coins, 
  Hammer, 
  Ticket, 
  Clock, 
  FileSpreadsheet, 
  BookOpen, 
  TrendingUp, 
  RefreshCw, 
  Search, 
  Sliders, 
  AlertTriangle,
  Menu,
  X
} from 'lucide-react';
import { useAlchMate } from '../context/AlchMateContext';

export default function Navbar() {
  const pathname = usePathname();
  const { 
    priceData, 
    loading, 
    isStaleData, 
    nextRefreshSec, 
    refreshPrices,
    searchQuery, 
    setSearchQuery,
    effectiveNatPrice,
    natureRuneOverride,
    setNatureRuneOverride,
    ownedNats,
    explorersRing,
    toastMsg,
    showCommunityLinks,
    isLocalServer,
    activeAccount
  } = useAlchMate();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Keyboard shortcut Ctrl+K to focus search
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const navLinks = [
    { href: '/', label: 'Overview', icon: Flame },
    { href: '/alch', label: 'High Alch', icon: Coins },
    { href: '/crafting', label: 'Workshop', icon: Hammer },
    { href: '/bond', label: 'Bond Roadmap', icon: Ticket },
    { href: '/timers', label: 'GE Timers', icon: Clock },
    { href: '/session', label: 'Session Ledger', icon: FileSpreadsheet },
    { href: '/instructions', label: 'Guide', icon: BookOpen },
    { href: '/changelog', label: 'Updates', icon: TrendingUp },
  ];

  return (
    <>
      <header className="border-b border-[#202530] bg-[#14171f]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center space-x-3 group shrink-0">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20 group-hover:scale-105 transition-transform">
              <Flame className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-white flex items-center gap-1.5">
                AlchMate <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-bold border border-amber-500/20">OSRS</span>
                <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 font-extrabold border border-amber-500/30">BETA</span>
              </span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1 text-xs font-semibold">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                    isActive
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20 font-bold'
                      : 'text-neutral-300 hover:text-white hover:bg-[#1a202c]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Quick Info & Actions */}
          <div className="flex items-center gap-2.5 text-xs">
            {/* Global Search Input */}
            <div className="relative hidden sm:block w-48 md:w-56">
              <input
                id="global-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items... (Ctrl+K)"
                className="w-full bg-[#181d28] border border-[#2a3449] rounded-lg pl-8 pr-3 py-1.5 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-amber-400"
              />
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-2.5 top-2.5 pointer-events-none" />
            </div>

            {/* Nature Rune Status Badge */}
            <div 
              className="bg-[#181d28] border border-[#2a3449] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 font-mono text-[11px] shrink-0"
              title={explorersRing ? 'Explorer\'s Ring (0 gp nats)' : ownedNats > 0 ? `Owned Nats (${ownedNats} in pouch)` : `Market Buy: ${natureRuneOverride} gp`}
            >
              <span className="text-amber-400 font-bold">🌿 Nat:</span>
              <span className={effectiveNatPrice === 0 ? 'text-emerald-400 font-bold' : 'text-neutral-300'}>
                {effectiveNatPrice === 0 ? 'FREE' : `${effectiveNatPrice} gp`}
              </span>
            </div>

            {/* Refresh Button & Timer */}
            <button
              onClick={refreshPrices}
              disabled={loading}
              className="bg-[#181d28] hover:bg-[#202738] border border-[#2a3449] px-2.5 py-1.5 rounded-lg flex items-center gap-1.5 text-neutral-300 hover:text-white transition-all text-xs font-mono shrink-0 cursor-pointer"
              title="Click to force refresh prices from OSRS Wiki"
            >
              <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
              <span className="hidden md:inline">{loading ? 'Syncing...' : `${nextRefreshSec}s`}</span>
            </button>

            {/* Local RuneLite Status Indicator */}
            <div 
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-mono font-bold shrink-0 ${
                isLocalServer 
                  ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                  : 'bg-[#181d28] border-[#2a3449] text-neutral-400'
              }`}
              title={isLocalServer ? 'Connected directly to Local RuneLite (127.0.0.1:18833)' : 'Waiting for Local RuneLite on 127.0.0.1:18833'}
            >
              <span className={`w-2 h-2 rounded-full ${isLocalServer ? 'bg-emerald-400 animate-pulse' : 'bg-neutral-500'}`} />
              <span>{isLocalServer ? (activeAccount ? activeAccount : 'Local Hub') : 'RuneLite Offline'}</span>
            </div>

            {/* GitHub Issues / Bug Report Link */}
            <a
              href="https://github.com/jef11222/alchmate-plugin/issues"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center gap-1 bg-[#181d28] hover:bg-[#202738] border border-amber-500/30 hover:border-amber-400 text-amber-400 px-2.5 py-1.5 rounded-lg text-xs font-mono font-bold shrink-0 transition"
              title="Report bugs or feedback on GitHub"
            >
              <span>🐛 Bug Report</span>
            </a>

            {/* Stale Data Indicator if offline */}
            {isStaleData && (
              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-1 rounded text-[10px] font-bold flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" />
                <span className="hidden sm:inline">Cached Prices</span>
              </span>
            )}

            {/* Mobile Hamburger Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-neutral-400 hover:text-white rounded-lg bg-[#181d28] border border-[#2a3449]"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-[#202530] bg-[#14171f] p-4 space-y-2">
            <div className="mb-3">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items..."
                className="w-full bg-[#181d28] border border-[#2a3449] rounded-lg px-3 py-2 text-xs text-white"
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
                return (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`p-2.5 rounded-lg flex items-center gap-2 text-xs font-semibold ${
                      isActive
                        ? 'bg-amber-500 text-black font-bold'
                        : 'text-neutral-300 bg-[#181d28] hover:text-white'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{link.label}</span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* Hidden Community & Monetization Scaffolding (Ready to turn on when SHOW_COMMUNITY_LINKS is true) */}
        {showCommunityLinks && (
          <div className="hidden border-t border-[#202530] bg-[#0f121a] py-1 px-4 text-xs flex justify-end gap-3 text-neutral-400">
            <a href="https://discord.gg/alchmate" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">Discord Community</a>
            <a href="https://patreon.com/alchmate" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">Support on Patreon</a>
            <a href="https://github.com/jef11222/alchmate-web" target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">GitHub Source</a>
          </div>
        )}
      </header>

      {/* Global Toast Notification */}
      {toastMsg && (
        <div className="fixed top-20 right-4 z-50 bg-[#1a202c] border border-amber-500/40 text-amber-300 px-4 py-2.5 rounded-xl shadow-2xl text-xs font-semibold flex items-center gap-2 animate-bounce">
          <span>{toastMsg}</span>
        </div>
      )}
    </>
  );
}
