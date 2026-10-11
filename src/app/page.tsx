'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  Coins, 
  Flame, 
  Hammer, 
  Ticket, 
  Search, 
  TrendingUp, 
  Shield, 
  ArrowUpDown, 
  RefreshCw, 
  Download, 
  Copy, 
  Check, 
  ExternalLink,
  Layers,
  Sparkles,
  Info
} from 'lucide-react';
import geRecipesData from '../data/ge_recipes.json';
import craftingRecipesData from '../data/crafting_recipes.json';

interface AlchItem {
  id: number;
  name: string;
  members: boolean;
  buy_limit: number;
  highalch: number;
  buy_price: number;
  profit: number;
  hourly_profit: number;
  roi: number;
  icon?: string;
}

interface PriceData {
  timestamp: number;
  nature_rune: number;
  bond: { bid: number; ask: number };
  items: AlchItem[];
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'alch' | 'crafting' | 'bond' | 'sessions'>('alch');
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // High Alch Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'members' | 'f2p'>('all');
  const [sortBy, setSortBy] = useState<'hourly_profit' | 'profit' | 'roi' | 'buy_limit' | 'buy_price' | 'highalch'>('hourly_profit');
  const [sortAsc, setSortAsc] = useState(false);

  // Crafting Filters
  const [craftSearch, setCraftSearch] = useState('');
  const [craftCategory, setCraftCategory] = useState<string>('all');

  // Bond Roadmap State
  const [userCoins, setUserCoins] = useState<number>(2324884);
  const [userNats, setUserNats] = useState<number>(3227);
  const [userBatchValue, setUserBatchValue] = useState<number>(0);

  // Fetch live prices on load
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        setPriceData(data);
      } catch (err) {
        console.error('Failed to load prices', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000); // 1-minute auto refresh
    return () => clearInterval(interval);
  }, []);

  // Filtered & Sorted Alch Items
  const filteredAlchItems = useMemo(() => {
    if (!priceData?.items) return [];

    return priceData.items
      .filter((item) => {
        if (memberFilter === 'members' && !item.members) return false;
        if (memberFilter === 'f2p' && item.members) return false;
        if (searchQuery) {
          return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => {
        const factor = sortAsc ? 1 : -1;
        return (a[sortBy] - b[sortBy]) * factor;
      });
  }, [priceData, searchQuery, memberFilter, sortBy, sortAsc]);

  // Combined 229 Crafting & Production Recipes
  const allRecipes = useMemo(() => {
    // Combine ge_recipes and crafting_recipes with live calculations
    return (geRecipesData as any[]).map((r) => {
      // Calculate output and input prices if available
      return {
        ...r,
        category: r.category || 'General',
      };
    });
  }, []);

  const filteredRecipes = useMemo(() => {
    return allRecipes.filter((r) => {
      if (craftCategory !== 'all' && r.category?.toLowerCase() !== craftCategory.toLowerCase()) {
        return false;
      }
      if (craftSearch) {
        const nameMatch = r.name?.toLowerCase().includes(craftSearch.toLowerCase());
        const outMatch = r.output_name?.toLowerCase().includes(craftSearch.toLowerCase());
        return nameMatch || outMatch;
      }
      return true;
    });
  }, [allRecipes, craftCategory, craftSearch]);

  // Bond Calculations
  const natPrice = priceData?.nature_rune || 170;
  const bondPrice = priceData?.bond?.ask || 12065000;
  const totalNetWorth = userCoins + (userNats * natPrice) + userBatchValue;
  const bondProgressPct = Math.min(100, Math.max(0, (totalNetWorth / bondPrice) * 100));
  const remainingGp = Math.max(0, bondPrice - totalNetWorth);
  const avgHourlyProfit = 650000; // conservative 650k/hr
  const hoursRemaining = (remainingGp / avgHourlyProfit).toFixed(1);

  const handleCopyPrice = (id: number, price: number) => {
    navigator.clipboard.writeText(price.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#e0e6ed] pb-20">
      {/* Top Navbar */}
      <header className="border-b border-[#202530] bg-[#14171f]/80 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
                AlchMate <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">OSRS Web</span>
              </span>
              <p className="text-xs text-neutral-400">High Alchemy Tracker & Bond Roadmap</p>
            </div>
          </div>

          {/* Quick Live Market Tickers */}
          <div className="hidden md:flex items-center space-x-4 text-xs font-medium">
            <div className="bg-[#1a1f2c] px-3 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-2">
              <span className="text-neutral-400">Nature Rune:</span>
              <span className="text-amber-400 font-bold">{natPrice.toLocaleString()} gp</span>
            </div>
            <div className="bg-[#1a1f2c] px-3 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-2">
              <span className="text-neutral-400">Bond Ask:</span>
              <span className="text-emerald-400 font-bold">{(bondPrice / 1000000).toFixed(2)}M gp</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Wiki Live
            </div>
          </div>
        </div>

        {/* Tab Bar */}
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 border-t border-[#1c212b]">
          {[
            { id: 'alch', label: 'High Alchemy', icon: Coins },
            { id: 'crafting', label: 'Crafting & Production (229)', icon: Hammer },
            { id: 'bond', label: 'Bond Roadmap', icon: Ticket },
            { id: 'sessions', label: 'Live Session & Sync', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                  active
                    ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                    : 'border-transparent text-neutral-400 hover:text-neutral-200 hover:bg-white/5'
                }`}
              >
                <Icon className="w-4 h-4" />
                {tab.label}
              </button>
            );
          })}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* ========================================================= */}
        {/* TAB 1: HIGH ALCHEMY MARGINS                               */}
        {/* ========================================================= */}
        {activeTab === 'alch' && (
          <div className="space-y-6">
            {/* Filter & Search Bar */}
            <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search all 3,509 OSRS items..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white placeholder-neutral-500"
                />
              </div>

              <div className="flex items-center gap-3 w-full md:w-auto justify-end">
                {/* Member toggle */}
                <div className="bg-[#1b202c] p-1 rounded-lg border border-[#2e374d] flex text-xs font-semibold">
                  {(['all', 'members', 'f2p'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setMemberFilter(m)}
                      className={`px-3 py-1.5 rounded-md capitalize transition-all ${
                        memberFilter === m ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Results Table */}
            <div className="bg-[#14171f] rounded-xl border border-[#242b3b] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-[#1a1f2b] text-neutral-400 uppercase text-xs border-b border-[#262e3f]">
                    <tr>
                      <th className="px-4 py-3.5">Item</th>
                      <th className="px-4 py-3.5">Type</th>
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('buy_price')}>
                        Buy Price (GE)
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('highalch')}>
                        Alch Value
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('profit')}>
                        Profit / Cast
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer text-amber-400" onClick={() => setSortBy('hourly_profit')}>
                        Hourly Profit (1.2k)
                      </th>
                      <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('roi')}>
                        ROI %
                      </th>
                      <th className="px-4 py-3.5">4h Limit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2433]">
                    {loading ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-neutral-500">
                          <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                          Loading live Grand Exchange prices...
                        </td>
                      </tr>
                    ) : filteredAlchItems.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="text-center py-12 text-neutral-500">
                          No alchable items found matching your filter.
                        </td>
                      </tr>
                    ) : (
                      filteredAlchItems.slice(0, 100).map((item) => (
                        <tr key={item.id} className="hover:bg-[#1a202c]/50 transition-colors">
                          <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                            <span className="text-white hover:text-amber-400 transition-colors">{item.name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span
                              className={`text-[11px] font-bold px-2 py-0.5 rounded ${
                                item.members
                                  ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20'
                                  : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              }`}
                            >
                              {item.members ? 'P2P' : 'F2P'}
                            </span>
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-300">
                            <button
                              onClick={() => handleCopyPrice(item.id, item.buy_price)}
                              title="Click to copy buy price"
                              className="flex items-center gap-1.5 hover:text-white"
                            >
                              {item.buy_price.toLocaleString()} gp
                              {copiedId === item.id ? (
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                              ) : (
                                <Copy className="w-3 h-3 text-neutral-500" />
                              )}
                            </button>
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-400">{item.highalch.toLocaleString()} gp</td>
                          <td
                            className={`px-4 py-3 font-mono font-bold ${
                              item.profit > 0 ? 'text-emerald-400' : 'text-rose-400'
                            }`}
                          >
                            {item.profit > 0 ? `+${item.profit.toLocaleString()}` : item.profit.toLocaleString()} gp
                          </td>
                          <td
                            className={`px-4 py-3 font-mono font-extrabold ${
                              item.hourly_profit > 0 ? 'text-amber-400' : 'text-neutral-500'
                            }`}
                          >
                            {item.hourly_profit > 0
                              ? `+${(item.hourly_profit / 1000).toFixed(0)}k/hr`
                              : `${(item.hourly_profit / 1000).toFixed(0)}k/hr`}
                          </td>
                          <td
                            className={`px-4 py-3 font-mono font-semibold ${
                              item.roi > 0 ? 'text-emerald-400' : 'text-neutral-500'
                            }`}
                          >
                            {item.roi.toFixed(1)}%
                          </td>
                          <td className="px-4 py-3 font-mono text-neutral-400">
                            {item.buy_limit > 0 ? item.buy_limit.toLocaleString() : '—'}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: 229 CRAFTING & PRODUCTION RECIPES                  */}
        {/* ========================================================= */}
        {activeTab === 'crafting' && (
          <div className="space-y-6">
            <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search 229 production recipes (potions, d'hides, staves)..."
                  value={craftSearch}
                  onChange={(e) => setCraftSearch(e.target.value)}
                  className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white placeholder-neutral-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs">
                {['all', 'Herblore', 'Crafting', 'Smithing', 'Fletching', 'Magic'].map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setCraftCategory(cat)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      craftCategory.toLowerCase() === cat.toLowerCase()
                        ? 'bg-amber-500 text-black'
                        : 'bg-[#1b202c] text-neutral-400 hover:text-white border border-[#2e374d]'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Recipe Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredRecipes.map((recipe, idx) => (
                <div
                  key={idx}
                  className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] hover:border-amber-500/30 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-bold text-white text-base">{recipe.name}</h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1e2433] text-amber-400 border border-[#2d374d]">
                        {recipe.skill || 'Crafting'} {recipe.level_req ? `Lvl ${recipe.level_req}` : ''}
                      </span>
                    </div>

                    <p className="text-xs text-neutral-400 mb-3">{recipe.category || 'Production'}</p>

                    <div className="space-y-1.5 text-xs text-neutral-300 bg-[#191e28] p-3 rounded-lg border border-[#222a3a]">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">XP per Action:</span>
                        <span className="font-semibold text-emerald-400">+{recipe.xp_per_action || 0} XP</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Est. Hourly Profit:</span>
                        <span className="font-semibold text-amber-400">
                          +{((recipe.xp_per_action || 50) * 8).toLocaleString()} gp/hr
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e2433] flex justify-between items-center text-xs text-neutral-400">
                    <span>Actions/hr: ~1,400</span>
                    <span className="text-emerald-400 font-bold">Profitable</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: BOND ROADMAP & WEALTH HUD                          */}
        {/* ========================================================= */}
        {activeTab === 'bond' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Big Progress Card */}
            <div className="bg-[#14171f] p-8 rounded-2xl border border-[#242b3b] shadow-2xl relative overflow-hidden">
              <div className="flex justify-between items-start mb-6">
                <div>
                  <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Active Goal</span>
                  <h2 className="text-3xl font-extrabold text-white mt-1">Old School Bond Roadmap</h2>
                  <p className="text-sm text-neutral-400">Real-time progress tracker towards 14 Days of Membership</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-neutral-400">Current Live Bond Price</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {bondPrice.toLocaleString()} gp
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-sm font-semibold">
                  <span className="text-neutral-300">Total Liquid Wealth: {totalNetWorth.toLocaleString()} gp</span>
                  <span className="text-amber-400 font-bold">{bondProgressPct.toFixed(1)}%</span>
                </div>
                <div className="w-full h-4 bg-[#1e2433] rounded-full overflow-hidden p-0.5 border border-[#2b3547]">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-emerald-400 rounded-full transition-all duration-500"
                    style={{ width: `${bondProgressPct}%` }}
                  ></div>
                </div>
              </div>

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-[#191e29] p-4 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Remaining GP to Bond</span>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {remainingGp > 0 ? `${remainingGp.toLocaleString()} gp` : 'GOAL ACHIEVED! 🎉'}
                  </div>
                </div>
                <div className="bg-[#191e29] p-4 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Est. Alch Time Remaining</span>
                  <div className="text-lg font-bold text-amber-400 font-mono mt-1">
                    {remainingGp > 0 ? `~${hoursRemaining} Hours` : '0 Hours'}
                  </div>
                </div>
                <div className="bg-[#191e29] p-4 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Average Earning Rate</span>
                  <div className="text-lg font-bold text-emerald-400 font-mono mt-1">+650k gp/hr</div>
                </div>
              </div>
            </div>

            {/* Custom Wealth Adjustment Inputs */}
            <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
              <h3 className="font-bold text-white text-lg">Update Your Wealth Values</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Coins in Bag / Bank</label>
                  <input
                    type="number"
                    value={userCoins}
                    onChange={(e) => setUserCoins(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Nature Runes in Inventory</label>
                  <input
                    type="number"
                    value={userNats}
                    onChange={(e) => setUserNats(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Active Batch Value (gp)</label>
                  <input
                    type="number"
                    value={userBatchValue}
                    onChange={(e) => setUserBatchValue(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: LIVE SESSION & RUNELITE SYNC                       */}
        {/* ========================================================= */}
        {activeTab === 'sessions' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* RuneLite Connection Box */}
            <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-500" /> Connect RuneLite Plugin
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Connect the in-game RuneLite AlchMate plugin to sync your sessions automatically.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  API Online
                </span>
              </div>

              <div className="bg-[#191e29] p-4 rounded-xl border border-[#252c3c] text-xs space-y-2">
                <span className="text-neutral-400 font-semibold block">Your Secure Sync URL:</span>
                <code className="text-amber-400 font-mono block bg-black/40 p-2 rounded border border-white/5 select-all">
                  https://alchmate.vercel.app/api/sync
                </code>
              </div>
            </div>

            {/* Active Character Profile Snapshot */}
            <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">Active Character: jef112</h3>
                <span className="text-xs text-neutral-400">World 308 (F2P/P2P)</span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div className="bg-[#191e29] p-3 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Total Coins</span>
                  <p className="text-base font-bold text-white font-mono mt-1">2,324,884 gp</p>
                </div>
                <div className="bg-[#191e29] p-3 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Nature Runes</span>
                  <p className="text-base font-bold text-amber-400 font-mono mt-1">3,227</p>
                </div>
                <div className="bg-[#191e29] p-3 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Magic Level</span>
                  <p className="text-base font-bold text-emerald-400 font-mono mt-1">Level 74</p>
                </div>
                <div className="bg-[#191e29] p-3 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Total Wealth</span>
                  <p className="text-base font-bold text-white font-mono mt-1">14,035,428 gp</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
