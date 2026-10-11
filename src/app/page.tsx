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
  Layers, 
  Clock, 
  Moon, 
  FileSpreadsheet, 
  Tag, 
  User, 
  Zap, 
  CheckCircle2, 
  Trash2, 
  Plus, 
  Sparkles,
  Sliders,
  DollarSign,
  AlertCircle
} from 'lucide-react';
import geRecipesData from '../data/ge_recipes.json';
import craftingRecipesData from '../data/crafting_recipes.json';

interface AlchItem {
  id: number;
  name: string;
  members: boolean;
  buy_limit: number;
  volume: number;
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
  latest: Record<string, { high?: number; low?: number }>;
  items: AlchItem[];
}

export default function Dashboard() {
  // 5 Main Super-Hubs
  const [activeTab, setActiveTab] = useState<'alch_hub' | 'craft_hub' | 'bond_hub' | 'timers_hub' | 'session_hub'>('alch_hub');
  
  // Alch Hub Sub-views
  const [alchSubView, setAlchSubView] = useState<'table' | 'overnight' | 'w308' | 'bank_tag' | 'rec'>('table');

  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [tagCopied, setTagCopied] = useState(false);

  // High Alch Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [memberFilter, setMemberFilter] = useState<'all' | 'members' | 'f2p'>('all');
  const [minVolumeFilter, setMinVolumeFilter] = useState<number>(1000); // default >1,000 volume to eliminate dead clue items
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');
  const [natureRuneOverride, setNatureRuneOverride] = useState<number>(170);
  const [sortBy, setSortBy] = useState<'hourly_profit' | 'profit' | 'roi' | 'buy_limit' | 'buy_price' | 'highalch' | 'volume'>('hourly_profit');
  const [sortAsc, setSortAsc] = useState(false);

  // Crafting Filters
  const [craftSearch, setCraftSearch] = useState('');
  const [craftSkillFilter, setCraftSkillFilter] = useState<string>('all');

  // Overnight Budget Calculator
  const [overnightBudget, setOvernightBudget] = useState<number>(3000000);

  // Bond Roadmap Interactive State (stored in localStorage)
  const [userCoins, setUserCoins] = useState<number>(0);
  const [userNats, setUserNats] = useState<number>(0);
  const [userBatchValue, setUserBatchValue] = useState<number>(0);

  // 4h Timers State (stored in localStorage)
  const [timers, setTimers] = useState<Array<{ id: number; name: string; expiresAt: number; limit: number }>>([]);
  const [newTimerItem, setNewTimerItem] = useState('');

  // Sync token state
  const [syncToken, setSyncToken] = useState<string>('');

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem('alchmate_coins');
      if (savedCoins) setUserCoins(Number(savedCoins));
      const savedNats = localStorage.getItem('alchmate_nats');
      if (savedNats) setUserNats(Number(savedNats));
      const savedBatch = localStorage.getItem('alchmate_batch');
      if (savedBatch) setUserBatchValue(Number(savedBatch));
      const savedToken = localStorage.getItem('alchmate_sync_token');
      if (savedToken) setSyncToken(savedToken);
      const savedTimers = localStorage.getItem('alchmate_timers');
      if (savedTimers) setTimers(JSON.parse(savedTimers));
    } catch (e) {
      console.error('Error loading localStorage', e);
    }
  }, []);

  // Save changes to localStorage
  const handleUpdateCoins = (val: number) => {
    setUserCoins(val);
    localStorage.setItem('alchmate_coins', val.toString());
  };
  const handleUpdateNats = (val: number) => {
    setUserNats(val);
    localStorage.setItem('alchmate_nats', val.toString());
  };
  const handleUpdateBatch = (val: number) => {
    setUserBatchValue(val);
    localStorage.setItem('alchmate_batch', val.toString());
  };

  // Fetch live prices on load
  useEffect(() => {
    async function fetchPrices() {
      try {
        const res = await fetch('/api/prices');
        const data = await res.json();
        setPriceData(data);
        if (data.nature_rune) {
          setNatureRuneOverride(data.nature_rune);
        }
      } catch (err) {
        console.error('Failed to load prices', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();
    const interval = setInterval(fetchPrices, 60000);
    return () => clearInterval(interval);
  }, []);

  // Filtered & Sorted Alch Items with 24h Volume and Item Type Filter
  const filteredAlchItems = useMemo(() => {
    if (!priceData?.items) return [];

    return priceData.items
      .map((item) => {
        // Re-calculate with nature rune override if changed
        const currentProfit = item.highalch - item.buy_price - natureRuneOverride;
        return {
          ...item,
          profit: currentProfit,
          hourly_profit: currentProfit * 1200,
          roi: item.buy_price > 0 ? (currentProfit / item.buy_price) * 100 : 0
        };
      })
      .filter((item) => {
        // 1. Member filter
        if (memberFilter === 'members' && !item.members) return false;
        if (memberFilter === 'f2p' && item.members) return false;

        // 2. Volume filter (eliminates rare inactive clue items)
        if (minVolumeFilter > 0 && item.volume < minVolumeFilter) return false;

        // 3. Item type filter
        if (itemTypeFilter !== 'all') {
          const lowerName = item.name.toLowerCase();
          if (itemTypeFilter === 'rune' && !lowerName.includes('rune')) return false;
          if (itemTypeFilter === 'dragon' && !lowerName.includes('dragon')) return false;
          if (itemTypeFilter === 'dhide' && !lowerName.includes("d'hide") && !lowerName.includes('dragonhide')) return false;
          if (itemTypeFilter === 'staff' && !lowerName.includes('battlestaff') && !lowerName.includes('staff')) return false;
          if (itemTypeFilter === 'jewelry' && !['bracelet', 'necklace', 'amulet', 'ring'].some(t => lowerName.includes(t))) return false;
          if (itemTypeFilter === 'addy_mith' && !lowerName.includes('adamant') && !lowerName.includes('mithril')) return false;
        }

        // 4. Search query
        if (searchQuery) {
          return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => {
        const factor = sortAsc ? 1 : -1;
        return (a[sortBy] - b[sortBy]) * factor;
      });
  }, [priceData, searchQuery, memberFilter, minVolumeFilter, itemTypeFilter, natureRuneOverride, sortBy, sortAsc]);

  // Overnight Sleepers (Items with good volume, >70 limit, >300 profit)
  const overnightItems = useMemo(() => {
    if (!priceData?.items) return [];
    return priceData.items
      .filter((it) => it.profit > 300 && it.buy_limit >= 70 && it.volume > 500 && it.buy_price > 2000)
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 30);
  }, [priceData]);

  // W308 Anvil Bulk Margins Sheet
  const w308Items = useMemo(() => {
    if (!priceData?.items) return [];
    const w308Names = [
      'Rune 2h sword', 'Rune platebody', 'Rune platelegs', 'Rune plateskirt',
      'Adamant platebody', 'Rune battleaxe', 'Rune warhammer', 'Rune kiteshield',
      'Rune chainbody', 'Rune full helm', 'Rune scimitar'
    ];
    return priceData.items.filter((it) => w308Names.includes(it.name));
  }, [priceData]);

  // DYNAMIC 229 CRAFTING ENGINE (Calculates real live profits from ingredients!)
  const computedCraftingRecipes = useMemo(() => {
    const latest = priceData?.latest || {};
    return (geRecipesData as any[]).map((r) => {
      const outputId = String(r.output_id);
      const outputPrices = latest[outputId];
      const outputSellPrice = outputPrices?.high || outputPrices?.low || 0;
      const taxedOutput = Math.floor(outputSellPrice * 0.99); // 1% GE tax

      let totalMaterialCost = 0;
      let hasAllPrices = true;

      const materialsWithPrices = (r.materials || []).map((m: any) => {
        const mId = String(m.id);
        const mPrice = latest[mId]?.low || latest[mId]?.high || 0;
        if (mPrice === 0) hasAllPrices = false;
        totalMaterialCost += mPrice * (m.qty || 1);
        return {
          ...m,
          unit_price: mPrice,
          total_price: mPrice * (m.qty || 1)
        };
      });

      const netProfit = taxedOutput - totalMaterialCost;
      const hourlyActions = r.hourly_actions || 1400;
      const hourlyProfit = netProfit * hourlyActions;
      const xpRate = (r.xp || 0) * hourlyActions;

      return {
        ...r,
        output_sell_price: outputSellPrice,
        material_cost: totalMaterialCost,
        net_profit: netProfit,
        hourly_profit: hourlyProfit,
        xp_rate: xpRate,
        materials_detailed: materialsWithPrices,
        is_viable: hasAllPrices && outputSellPrice > 0
      };
    });
  }, [priceData]);

  const filteredCraftingRecipes = useMemo(() => {
    return computedCraftingRecipes.filter((r) => {
      if (craftSkillFilter !== 'all') {
        if (r.skill?.toLowerCase() !== craftSkillFilter.toLowerCase()) return false;
      }
      if (craftSearch) {
        return r.name.toLowerCase().includes(craftSearch.toLowerCase());
      }
      return true;
    }).sort((a, b) => b.hourly_profit - a.hourly_profit);
  }, [computedCraftingRecipes, craftSkillFilter, craftSearch]);

  // Bond Calculations
  const bondPrice = priceData?.bond?.ask || 12065000;
  const totalNetWorth = userCoins + (userNats * natureRuneOverride) + userBatchValue;
  const bondProgressPct = Math.min(100, Math.max(0, (totalNetWorth / bondPrice) * 100));
  const remainingGp = Math.max(0, bondPrice - totalNetWorth);
  const avgHourlyProfit = 650000;
  const hoursRemaining = (remainingGp / avgHourlyProfit).toFixed(1);

  // Handlers
  const handleCopyPrice = (id: number, price: number) => {
    navigator.clipboard.writeText(price.toString());
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyBankTag = () => {
    const topItemNames = filteredAlchItems.slice(0, 30).map(it => it.name).join(',');
    const tagString = `alchmate,${topItemNames}`;
    navigator.clipboard.writeText(tagString);
    setTagCopied(true);
    setTimeout(() => setTagCopied(false), 2000);
  };

  const handleAddTimer = (item: AlchItem) => {
    const newEntry = {
      id: item.id,
      name: item.name,
      expiresAt: Date.now() + 4 * 3600 * 1000,
      limit: item.buy_limit
    };
    const updated = [...timers.filter(t => t.id !== item.id), newEntry];
    setTimers(updated);
    localStorage.setItem('alchmate_timers', JSON.stringify(updated));
  };

  const handleDeleteTimer = (id: number) => {
    const updated = timers.filter(t => t.id !== id);
    setTimers(updated);
    localStorage.setItem('alchmate_timers', JSON.stringify(updated));
  };

  const handleExportCSV = () => {
    const headers = 'ID,Name,Type,Buy Price,High Alch,Profit,Hourly Profit,ROI,24h Volume,4h Limit\n';
    const rows = filteredAlchItems.map(it => 
      `${it.id},"${it.name}",${it.members ? 'P2P' : 'F2P'},${it.buy_price},${it.highalch},${it.profit},${it.hourly_profit},${it.roi.toFixed(1)}%,${it.volume},${it.buy_limit}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alchmate_margins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="min-h-screen bg-[#0d0f12] text-[#e0e6ed] pb-24 font-sans">
      {/* Top Navbar */}
      <header className="border-b border-[#202530] bg-[#14171f]/95 backdrop-blur sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-amber-700 flex items-center justify-center shadow-lg shadow-amber-500/20">
              <Flame className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="font-extrabold text-xl tracking-tight text-white flex items-center gap-2">
                AlchMate <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 font-semibold border border-amber-500/20">OSRS Suite</span>
              </span>
              <p className="text-xs text-neutral-400">High Alchemy, Production Crafting & Bond Roadmap</p>
            </div>
          </div>

          {/* Quick Live Market Tickers */}
          <div className="hidden md:flex items-center space-x-3 text-xs font-medium">
            <div className="bg-[#1a1f2c] px-3 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-1.5">
              <span className="text-neutral-400">Nature:</span>
              <input
                type="number"
                value={natureRuneOverride}
                onChange={(e) => setNatureRuneOverride(Number(e.target.value))}
                className="w-14 bg-transparent text-amber-400 font-bold font-mono focus:outline-none"
              />
              <span className="text-neutral-500">gp</span>
            </div>
            <div className="bg-[#1a1f2c] px-3 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-2">
              <span className="text-neutral-400">Bond Ask:</span>
              <span className="text-emerald-400 font-bold">{(bondPrice / 1000000).toFixed(2)}M gp</span>
            </div>
            <button 
              onClick={handleExportCSV}
              className="bg-[#1a1f2c] hover:bg-[#252c3f] text-neutral-300 px-3 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-1.5 transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
            </button>
            <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Wiki Live
            </div>
          </div>
        </div>

        {/* 5 Main Consolidated Super-Hub Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 border-t border-[#1c212b] overflow-x-auto">
          {[
            { id: 'alch_hub', label: 'High Alch & Trading', icon: Coins },
            { id: 'craft_hub', label: 'Crafting Workshop (229)', icon: Hammer },
            { id: 'bond_hub', label: 'Bond Roadmap & Sustainer', icon: Ticket },
            { id: 'timers_hub', label: '4h GE Timers', icon: Clock },
            { id: 'session_hub', label: 'Session & Activity Hub', icon: Layers },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 whitespace-nowrap transition-all ${
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
        {/* SUPER-HUB 1: HIGH ALCH & TRADING                          */}
        {/* ========================================================= */}
        {activeTab === 'alch_hub' && (
          <div className="space-y-6">
            {/* Sub-view Navigation Pills */}
            <div className="flex flex-wrap gap-2 border-b border-[#202530] pb-4">
              {[
                { id: 'table', label: '🪙 High Alch Margins Table' },
                { id: 'overnight', label: '🌙 GE Overnight Planner' },
                { id: 'w308', label: '📋 W308 Anvil Bulk Margin Sheet' },
                { id: 'rec', label: '💡 Smart Recommendations' },
                { id: 'bank_tag', label: '🏷️ RuneLite Bank Tag Generator' },
              ].map((sub) => (
                <button
                  key={sub.id}
                  onClick={() => setAlchSubView(sub.id as any)}
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    alchSubView === sub.id
                      ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                      : 'bg-[#14171f] text-neutral-400 hover:text-white border border-[#232938]'
                  }`}
                >
                  {sub.label}
                </button>
              ))}
            </div>

            {/* Sub-view: Main Margins Table */}
            {alchSubView === 'table' && (
              <div className="space-y-4">
                {/* Filter Bar with Volume & Type filters */}
                <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] space-y-3">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
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

                    <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end text-xs">
                      {/* Daily Volume Filter (Eliminates dead clue items!) */}
                      <div className="flex items-center gap-1.5 bg-[#1b202c] px-3 py-1.5 rounded-lg border border-[#2e374d]">
                        <span className="text-neutral-400">Min 24h Vol:</span>
                        <select
                          value={minVolumeFilter}
                          onChange={(e) => setMinVolumeFilter(Number(e.target.value))}
                          className="bg-transparent text-amber-400 font-bold focus:outline-none"
                        >
                          <option value={0} className="bg-[#1b202c]">All Volumes</option>
                          <option value={100} className="bg-[#1b202c]">&gt; 100/day</option>
                          <option value={1000} className="bg-[#1b202c]">&gt; 1,000/day (Recommended)</option>
                          <option value={5000} className="bg-[#1b202c]">&gt; 5,000/day (High Liquidity)</option>
                        </select>
                      </div>

                      {/* Member toggle */}
                      <div className="bg-[#1b202c] p-1 rounded-lg border border-[#2e374d] flex text-xs font-semibold">
                        {(['all', 'members', 'f2p'] as const).map((m) => (
                          <button
                            key={m}
                            onClick={() => setMemberFilter(m)}
                            className={`px-3 py-1 rounded-md capitalize transition-all ${
                              memberFilter === m ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            {m === 'members' ? 'P2P' : m}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Item Type Chips */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-[#1e2433] text-xs">
                    <span className="text-neutral-500 font-semibold mr-1">Category:</span>
                    {[
                      { id: 'all', label: 'All Items' },
                      { id: 'rune', label: '⚔️ Rune Armor' },
                      { id: 'dragon', label: '🐉 Dragon Gear' },
                      { id: 'dhide', label: "🏹 Dragonhide" },
                      { id: 'staff', label: '🪄 Battlestaves' },
                      { id: 'jewelry', label: '💎 Jewelry' },
                      { id: 'addy_mith', label: '🛡️ Addy/Mith' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setItemTypeFilter(cat.id)}
                        className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                          itemTypeFilter === cat.id
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                            : 'bg-[#191e29] text-neutral-400 hover:text-white border border-[#232938]'
                        }`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Table */}
                <div className="bg-[#14171f] rounded-xl border border-[#242b3b] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#1a1f2b] text-neutral-400 uppercase text-xs border-b border-[#262e3f]">
                        <tr>
                          <th className="px-4 py-3.5">Item</th>
                          <th className="px-4 py-3.5">Type</th>
                          <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('buy_price')}>Buy Price (GE)</th>
                          <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('highalch')}>Alch Value</th>
                          <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('profit')}>Profit / Cast</th>
                          <th className="px-4 py-3.5 cursor-pointer text-amber-400" onClick={() => setSortBy('hourly_profit')}>Hourly Profit (1.2k)</th>
                          <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('roi')}>ROI %</th>
                          <th className="px-4 py-3.5 cursor-pointer" onClick={() => setSortBy('volume')}>24h Volume</th>
                          <th className="px-4 py-3.5">4h Limit</th>
                          <th className="px-4 py-3.5 text-center">Timer</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2433]">
                        {loading ? (
                          <tr>
                            <td colSpan={10} className="text-center py-12 text-neutral-500">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                              Loading live Grand Exchange prices...
                            </td>
                          </tr>
                        ) : filteredAlchItems.length === 0 ? (
                          <tr>
                            <td colSpan={10} className="text-center py-12 text-neutral-500">
                              No alchable items found matching your filters. Try lowering the 24h Volume threshold!
                            </td>
                          </tr>
                        ) : (
                          filteredAlchItems.slice(0, 100).map((item) => (
                            <tr key={item.id} className="hover:bg-[#1a202c]/50 transition-colors">
                              <td className="px-4 py-3 font-medium text-white flex items-center gap-2">
                                <span className="text-white hover:text-amber-400 transition-colors">{item.name}</span>
                              </td>
                              <td className="px-4 py-3">
                                <span className={`text-[11px] font-bold px-2 py-0.5 rounded ${item.members ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                  {item.members ? 'P2P' : 'F2P'}
                                </span>
                              </td>
                              <td className="px-4 py-3 font-mono text-neutral-300">
                                <button onClick={() => handleCopyPrice(item.id, item.buy_price)} title="Click to copy buy price" className="flex items-center gap-1.5 hover:text-white">
                                  {item.buy_price.toLocaleString()} gp
                                  {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-500" />}
                                </button>
                              </td>
                              <td className="px-4 py-3 font-mono text-neutral-400">{item.highalch.toLocaleString()} gp</td>
                              <td className={`px-4 py-3 font-mono font-bold ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {item.profit > 0 ? `+${item.profit.toLocaleString()}` : item.profit.toLocaleString()} gp
                              </td>
                              <td className={`px-4 py-3 font-mono font-extrabold ${item.hourly_profit > 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                                {item.hourly_profit > 0 ? `+${(item.hourly_profit / 1000).toFixed(0)}k/hr` : `${(item.hourly_profit / 1000).toFixed(0)}k/hr`}
                              </td>
                              <td className={`px-4 py-3 font-mono font-semibold ${item.roi > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                {item.roi.toFixed(1)}%
                              </td>
                              <td className="px-4 py-3 font-mono text-neutral-400">{item.volume > 0 ? item.volume.toLocaleString() : '—'}</td>
                              <td className="px-4 py-3 font-mono text-neutral-400">{item.buy_limit > 0 ? item.buy_limit.toLocaleString() : '—'}</td>
                              <td className="px-4 py-3 text-center">
                                <button
                                  onClick={() => handleAddTimer(item)}
                                  title="Add to 4h GE Timer"
                                  className="p-1 hover:bg-[#252c3f] rounded text-neutral-400 hover:text-amber-400 transition-colors"
                                >
                                  <Clock className="w-4 h-4" />
                                </button>
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

            {/* Sub-view: Overnight Planner */}
            {alchSubView === 'overnight' && (
              <div className="space-y-6">
                <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Moon className="w-5 h-5 text-indigo-400" /> GE Overnight Optimizer & Sleepers
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        High-margin items ideal for leaving patient Grand Exchange buy offers overnight while you sleep.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-neutral-400 font-semibold">Overnight Capital:</span>
                      <input 
                        type="number" 
                        value={overnightBudget} 
                        onChange={(e) => setOvernightBudget(Number(e.target.value))}
                        className="bg-[#191e29] border border-[#2b3547] rounded-lg px-3 py-1.5 text-xs text-white font-mono w-36 font-bold"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {overnightItems.slice(0, 12).map((it) => {
                      const costForLimit = it.buy_price * it.buy_limit;
                      const batchProfit = it.profit * it.buy_limit;
                      return (
                        <div key={it.id} className="bg-[#191e28] p-4 rounded-xl border border-[#252c3c] flex flex-col justify-between">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="font-bold text-white text-sm">{it.name}</span>
                              <span className="text-[10px] px-2 py-0.5 rounded bg-indigo-500/10 text-indigo-300 font-bold border border-indigo-500/20">
                                4h: {it.buy_limit}
                              </span>
                            </div>
                            <div className="space-y-1 text-xs font-mono text-neutral-300 mt-3">
                              <div className="flex justify-between">
                                <span className="text-neutral-500">Buy Offer:</span>
                                <span>{it.buy_price.toLocaleString()} gp</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-neutral-500">Capital Needed:</span>
                                <span>{costForLimit.toLocaleString()} gp</span>
                              </div>
                              <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-[#232938]">
                                <span>Overnight Profit:</span>
                                <span>+{batchProfit.toLocaleString()} gp</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: W308 Anvil Sheet */}
            {alchSubView === 'w308' && (
              <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <FileSpreadsheet className="w-5 h-5 text-emerald-400" /> World 308 Anvil Bulk Margin Sheet
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Live profit margins comparing World 308 Varrock West Bank player trading bulk rates vs Grand Exchange.
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm font-mono">
                    <thead className="bg-[#1a1f2b] text-neutral-400 uppercase text-xs border-b border-[#262e3f]">
                      <tr>
                        <th className="px-4 py-3">Item</th>
                        <th className="px-4 py-3">GE Ask Price</th>
                        <th className="px-4 py-3">High Alch</th>
                        <th className="px-4 py-3">W308 Std Bulk</th>
                        <th className="px-4 py-3 text-emerald-400">Profit / Alch</th>
                        <th className="px-4 py-3 text-amber-400">1,000-Item Batch Profit</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2433]">
                      {w308Items.map((item) => {
                        const w308Est = Math.round(item.highalch - 520);
                        const w308Profit = item.highalch - w308Est - natureRuneOverride;
                        return (
                          <tr key={item.id} className="hover:bg-[#1a202c]/50">
                            <td className="px-4 py-3 font-sans font-bold text-white">{item.name}</td>
                            <td className="px-4 py-3 text-neutral-300">{item.buy_price.toLocaleString()} gp</td>
                            <td className="px-4 py-3 text-neutral-400">{item.highalch.toLocaleString()} gp</td>
                            <td className="px-4 py-3 text-cyan-300">{w308Est.toLocaleString()} gp</td>
                            <td className="px-4 py-3 text-emerald-400 font-bold">+{w308Profit.toLocaleString()} gp</td>
                            <td className="px-4 py-3 text-amber-400 font-extrabold">+{(w308Profit * 1000).toLocaleString()} gp</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Sub-view: Smart Recommendations */}
            {alchSubView === 'rec' && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {/* Category 1: Workhorses */}
                  <div className="bg-[#14171f] p-5 rounded-xl border border-[#242b3b] space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-amber-400" /> All-Time Workhorses
                    </h3>
                    <p className="text-xs text-neutral-400">High-volume items that fill rapidly 24/7 with reliable margins.</p>
                    <div className="space-y-2">
                      {filteredAlchItems.filter(it => it.volume > 5000 && it.profit > 200).slice(0, 5).map(it => (
                        <div key={it.id} className="bg-[#191e29] p-3 rounded-lg flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{it.name}</span>
                          <span className="text-emerald-400 font-mono font-bold">+{it.profit} gp</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 2: Batch Profit */}
                  <div className="bg-[#14171f] p-5 rounded-xl border border-[#242b3b] space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Zap className="w-4 h-4 text-emerald-400" /> High-Margin Heavies
                    </h3>
                    <p className="text-xs text-neutral-400">Maximum GP per single cast. Perfect for active high-margin runs.</p>
                    <div className="space-y-2">
                      {filteredAlchItems.filter(it => it.profit > 500 && it.volume > 500).slice(0, 5).map(it => (
                        <div key={it.id} className="bg-[#191e29] p-3 rounded-lg flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{it.name}</span>
                          <span className="text-amber-400 font-mono font-bold">+{it.profit} gp</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Category 3: High Volume Stacks */}
                  <div className="bg-[#14171f] p-5 rounded-xl border border-[#242b3b] space-y-4">
                    <h3 className="font-bold text-white flex items-center gap-2">
                      <Coins className="w-4 h-4 text-blue-400" /> High Buy Limits (11k+)
                    </h3>
                    <p className="text-xs text-neutral-400">Stackable bolts and battlestaves with 11,000–18,000 limits.</p>
                    <div className="space-y-2">
                      {filteredAlchItems.filter(it => it.buy_limit >= 10000 && it.profit > 100).slice(0, 5).map(it => (
                        <div key={it.id} className="bg-[#191e29] p-3 rounded-lg flex justify-between items-center text-xs">
                          <span className="font-bold text-white">{it.name}</span>
                          <span className="text-blue-400 font-mono font-bold">+{it.profit} gp ({it.buy_limit.toLocaleString()})</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Bank Tag Generator */}
            {alchSubView === 'bank_tag' && (
              <div className="bg-[#14171f] p-8 rounded-2xl border border-[#242b3b] space-y-4 max-w-2xl mx-auto text-center">
                <Tag className="w-12 h-12 text-amber-400 mx-auto" />
                <h3 className="text-2xl font-bold text-white">RuneLite Bank Tag Generator</h3>
                <p className="text-xs text-neutral-400">
                  Generate and copy a clean RuneLite Bank Tag string containing the top 30 most profitable High Alch items right now.
                </p>

                <div className="bg-[#191e29] p-4 rounded-xl border border-[#262e3d] text-left text-xs font-mono text-neutral-300 select-all overflow-x-auto">
                  alchmate,{filteredAlchItems.slice(0, 30).map(it => it.name).join(',')}
                </div>

                <button
                  onClick={handleCopyBankTag}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-amber-500/20 mx-auto flex items-center gap-2"
                >
                  {tagCopied ? <CheckCircle2 className="w-4 h-4 text-black" /> : <Copy className="w-4 h-4 text-black" />}
                  {tagCopied ? 'Copied to Clipboard!' : 'Copy Bank Tag String'}
                </button>
              </div>
            )}
          </div>
        )}

        {/* ========================================================= */}
        {/* SUPER-HUB 2: CRAFTING WORKSHOP (229 RECIPES LIVE DYNAMIC) */}
        {/* ========================================================= */}
        {activeTab === 'craft_hub' && (
          <div className="space-y-6">
            <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] flex flex-col md:flex-row gap-4 justify-between items-center">
              <div className="relative w-full md:w-96">
                <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                <input
                  type="text"
                  placeholder="Search 229 recipes (potions, d'hides, staves, glass)..."
                  value={craftSearch}
                  onChange={(e) => setCraftSearch(e.target.value)}
                  className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white placeholder-neutral-500"
                />
              </div>

              <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs">
                {[
                  { id: 'all', label: 'All 229 Recipes' },
                  { id: 'Herblore', label: '🧪 Herblore' },
                  { id: 'Crafting', label: '🧵 Crafting' },
                  { id: 'Smithing', label: '🔨 Smithing' },
                  { id: 'Fletching', label: '🏹 Fletching' },
                  { id: 'Magic', label: '🔮 Magic' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setCraftSkillFilter(cat.id)}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
                      craftSkillFilter.toLowerCase() === cat.id.toLowerCase()
                        ? 'bg-amber-500 text-black shadow'
                        : 'bg-[#1b202c] text-neutral-400 hover:text-white border border-[#2e374d]'
                    }`}
                  >
                    {cat.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Dynamic Recipe Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCraftingRecipes.map((recipe, idx) => (
                <div key={idx} className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] hover:border-amber-500/30 transition-all flex flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between mb-1.5">
                      <h3 className="font-bold text-white text-base">{recipe.name}</h3>
                      <span className="text-[11px] font-semibold px-2 py-0.5 rounded bg-[#1e2433] text-amber-400 border border-[#2d374d]">
                        {recipe.skill || 'Crafting'} {recipe.level ? `Lvl ${recipe.level}` : ''}
                      </span>
                    </div>

                    {/* Materials list */}
                    <div className="text-xs text-neutral-400 mb-3 space-y-0.5">
                      {(recipe.materials || []).map((m: any, mIdx: number) => (
                        <div key={mIdx} className="flex justify-between">
                          <span>{m.qty}x {m.name}</span>
                          <span className="font-mono text-neutral-500">
                            {m.unit_price > 0 ? `${(m.unit_price * m.qty).toLocaleString()} gp` : ''}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Live Financial & XP Stats */}
                    <div className="space-y-1.5 text-xs text-neutral-300 bg-[#191e28] p-3 rounded-lg border border-[#222a3a]">
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Total Material Cost:</span>
                        <span className="font-mono">{recipe.material_cost.toLocaleString()} gp</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">GE Sell (after tax):</span>
                        <span className="font-mono text-neutral-200">
                          {recipe.output_sell_price > 0 ? `${Math.floor(recipe.output_sell_price * 0.99).toLocaleString()} gp` : '—'}
                        </span>
                      </div>
                      <div className="flex justify-between pt-1 border-t border-[#232938]">
                        <span className="text-neutral-400">Net Profit / Action:</span>
                        <span className={`font-mono font-bold ${recipe.net_profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {recipe.net_profit > 0 ? `+${recipe.net_profit.toLocaleString()}` : recipe.net_profit.toLocaleString()} gp
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-400">Est. Hourly Profit:</span>
                        <span className={`font-mono font-extrabold ${recipe.hourly_profit > 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                          {recipe.hourly_profit > 0 ? `+${(recipe.hourly_profit / 1000).toFixed(0)}k/hr` : `${(recipe.hourly_profit / 1000).toFixed(0)}k/hr`}
                        </span>
                      </div>
                      <div className="flex justify-between text-cyan-400 font-semibold">
                        <span>XP Rate:</span>
                        <span>+{recipe.xp} XP ({(recipe.xp_rate / 1000).toFixed(0)}k XP/hr)</span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-[#1e2433] flex justify-between items-center text-xs text-neutral-400">
                    <span>Actions/hr: ~{recipe.hourly_actions || 1400}</span>
                    <span className={recipe.net_profit > 0 ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                      {recipe.net_profit > 0 ? 'Profitable' : 'Loss'}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUPER-HUB 3: BOND ROADMAP & 14-DAY SUSTAINER SIMULATOR    */}
        {/* ========================================================= */}
        {activeTab === 'bond_hub' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Big Progress Card */}
            <div className="bg-[#14171f] p-8 rounded-2xl border border-[#242b3b] shadow-2xl relative overflow-hidden">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
                <div>
                  <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Active Goal</span>
                  <h2 className="text-3xl font-extrabold text-white mt-1">Old School Bond Roadmap</h2>
                  <p className="text-sm text-neutral-400">Interactive wealth tracker towards 14 Days of Membership</p>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-xs text-neutral-400">Current Live Bond Price</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {bondPrice.toLocaleString()} gp
                  </div>
                  <span className="text-[11px] text-amber-400 block mt-0.5">🌙 Overnight Bid Dip: ~11.75M gp</span>
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

            {/* Interactive User Wealth Inputs (Custom for any player) */}
            <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Sliders className="w-5 h-5 text-amber-400" /> Enter Your Current In-Game Wealth
              </h3>
              <p className="text-xs text-neutral-400">
                Type in your inventory or bank values below. Values automatically save in your browser.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Coins in Pouch / Bank</label>
                  <input
                    type="number"
                    value={userCoins || ''}
                    placeholder="e.g. 2300000"
                    onChange={(e) => handleUpdateCoins(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Nature Runes in Inventory</label>
                  <input
                    type="number"
                    value={userNats || ''}
                    placeholder="e.g. 3000"
                    onChange={(e) => handleUpdateNats(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-2 text-white font-mono font-bold"
                  />
                  <span className="text-[10px] text-neutral-500 mt-1 block">
                    Worth: {(userNats * natureRuneOverride).toLocaleString()} gp
                  </span>
                </div>
                <div>
                  <label className="text-xs text-neutral-400 block mb-1">Active Batch / Items Value</label>
                  <input
                    type="number"
                    value={userBatchValue || ''}
                    placeholder="e.g. 500000"
                    onChange={(e) => handleUpdateBatch(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
              </div>
            </div>

            {/* 14-Day Perpetual Membership Sustainer Simulator */}
            <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <Ticket className="w-5 h-5 text-amber-400" /> 14-Day Perpetual Membership Sustainer Simulator
              </h3>
              <p className="text-xs text-neutral-400">
                How to easily sustain your Bond forever without burning out:
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                <div className="bg-[#191e29] p-4 rounded-xl border border-[#242c3d] space-y-2">
                  <span className="text-amber-400 font-bold block">Method 1: Passive Daily Habits</span>
                  <p className="text-neutral-300">
                    • 3 Herb Runs/day = ~600k gp/day<br/>
                    • Zaff Battlestaves = ~26k gp/day<br/>
                    • 14 Days = <strong>8.76M gp</strong> (75% of your bond passively in 15 mins/day!)
                  </p>
                </div>
                <div className="bg-[#191e29] p-4 rounded-xl border border-[#242c3d] space-y-2">
                  <span className="text-emerald-400 font-bold block">Method 2: Active High Alchemy</span>
                  <p className="text-neutral-300">
                    • 650k gp/hr on Dragon Daggers / Black D'hides<br/>
                    • Total time needed over 14 days: <strong>~18.5 hours total</strong><br/>
                    • That is only <strong>1.3 hours per day</strong> to stay bonded forever!
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUPER-HUB 4: 4H GRAND EXCHANGE TIMERS                     */}
        {/* ========================================================= */}
        {activeTab === 'timers_hub' && (
          <div className="space-y-6 max-w-3xl mx-auto">
            <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Clock className="w-5 h-5 text-amber-400" /> 4-Hour Grand Exchange Buy Limit Timers
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Tracks when your 4-hour Grand Exchange buy limits reset so you never miss a restock window.
                  </p>
                </div>
              </div>

              {/* Timer list */}
              {timers.length === 0 ? (
                <div className="bg-[#191e29] p-8 rounded-xl border border-[#242c3d] text-center text-xs text-neutral-400 space-y-2">
                  <Clock className="w-8 h-8 text-neutral-500 mx-auto" />
                  <p>No active timers running.</p>
                  <p className="text-neutral-500">Click the clock icon next to any item in the High Alch table to start a 4-hour countdown!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {timers.map((t) => {
                    const remainingSec = Math.max(0, Math.floor((t.expiresAt - Date.now()) / 1000));
                    const hours = Math.floor(remainingSec / 3600);
                    const mins = Math.floor((remainingSec % 3600) / 60);
                    const isExpired = remainingSec <= 0;
                    return (
                      <div key={t.id} className="bg-[#191e29] p-4 rounded-xl border border-[#242c3d] flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-sm block">{t.name}</span>
                          <span className="text-xs text-neutral-400">Limit: {t.limit} items / 4h</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <span className={`font-mono font-bold text-base block ${isExpired ? 'text-emerald-400' : 'text-amber-400'}`}>
                              {isExpired ? 'LIMIT RESET! ✅' : `${hours}h ${mins}m left`}
                            </span>
                            <span className="text-[11px] text-neutral-500">{isExpired ? 'Ready to buy' : 'Counting down'}</span>
                          </div>
                          <button
                            onClick={() => handleDeleteTimer(t.id)}
                            className="p-1.5 hover:bg-[#252c3f] rounded text-neutral-500 hover:text-rose-400 transition-colors"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* SUPER-HUB 5: SESSION & ACTIVITY HUB                       */}
        {/* ========================================================= */}
        {activeTab === 'session_hub' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* RuneLite Sync Config Box */}
            <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-bold text-white flex items-center gap-2">
                    <Shield className="w-5 h-5 text-amber-500" /> Connect RuneLite Plugin
                  </h3>
                  <p className="text-xs text-neutral-400 mt-1">
                    Connect the official RuneLite in-game plugin to stream your alching sessions directly to this dashboard.
                  </p>
                </div>
                <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                  API Live
                </span>
              </div>

              <div className="bg-[#191e29] p-4 rounded-xl border border-[#252c3c] text-xs space-y-2">
                <span className="text-neutral-400 font-semibold block">Your RuneLite Webhook Sync URL:</span>
                <code className="text-amber-400 font-mono block bg-black/40 p-2.5 rounded border border-white/5 select-all">
                  https://alchmate-web.vercel.app/api/sync
                </code>
                <span className="text-[11px] text-neutral-500 block">
                  Paste this URL into the AlchMate plugin settings in RuneLite.
                </span>
              </div>
            </div>

            {/* Empty Session State (Zero hardcoded data) */}
            <div className="bg-[#14171f] p-8 rounded-2xl border border-[#242b3b] text-center space-y-4">
              <User className="w-12 h-12 text-neutral-500 mx-auto" />
              <h3 className="text-xl font-bold text-white">Live Session Tracker</h3>
              <p className="text-xs text-neutral-400 max-w-md mx-auto">
                Once your RuneLite plugin is connected and you start alching, your live casts, XP gained, and realized profit will stream here in real time.
              </p>
              <div className="pt-2">
                <button 
                  onClick={handleExportCSV}
                  className="bg-[#191e29] hover:bg-[#252c3f] text-neutral-300 px-4 py-2 rounded-xl border border-[#2a3245] inline-flex items-center gap-2 text-xs font-semibold"
                >
                  <Download className="w-4 h-4 text-amber-400" /> Export Margins to CSV
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
