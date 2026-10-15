'use client';

import React, { useState, useMemo } from 'react';
import { 
  Coins, 
  Moon, 
  FileSpreadsheet, 
  Tag, 
  Sparkles, 
  Search, 
  Sliders, 
  Copy, 
  Check, 
  Clock, 
  ShoppingCart, 
  TrendingUp, 
  Info,
  Send,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';
import { useAlchMate, AlchItem } from '../../context/AlchMateContext';
import ItemHoverCard from '../../components/ItemHoverCard';
import w308StaplesData from '../../data/w308_staples.json';
import overnightCandidatesData from '../../data/overnight_candidates.json';

function formatGp(val: number): string {
  if (!val || val === 0) return '0 gp';
  if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return `${val.toLocaleString()} gp`;
}

export default function AlchPage() {
  const { 
    priceData, 
    loading, 
    searchQuery, 
    setSearchQuery,
    pricingStrategy, 
    setPricingStrategy,
    cashStack, 
    setCashStack,
    unlimitedBudget, 
    setUnlimitedBudget,
    membersEnabled, 
    setMembersEnabled,
    f2pOnly, 
    setF2pOnly,
    minVolumeFilter, 
    setMinVolumeFilter,
    effectiveNatPrice,
    cartItems,
    toggleCart,
    clearCart,
    copyBankTags,
    addTimer,
    showToast
  } = useAlchMate();

  const [activeTab, setActiveTab] = useState<'table' | 'overnight' | 'w308' | 'bank_tag'>('table');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // W308 Role: Buyer vs Seller
  const [w308Role, setW308Role] = useState<'buyer' | 'seller'>('buyer');

  // Hover info card
  const [hoveredItem, setHoveredItem] = useState<AlchItem | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Overnight Settings
  const [overnightDuration, setOvernightDuration] = useState(12);
  const [overnightStrat, setOvernightStrat] = useState<'safe' | 'deep'>('safe');
  const [overnightSlots, setOvernightSlots] = useState(3);

  // Filtered Alch Items
  const filteredAlchItems = useMemo(() => {
    if (!priceData?.items) return [];

    return priceData.items
      .map((item) => {
        let targetBuy = item.bid || item.buy_price;
        if (pricingStrategy === 'smart') {
          targetBuy = item.ask > item.bid && item.bid > 0 ? item.bid + 1 : (item.bid || item.buy_price);
        } else if (pricingStrategy === 'instant') {
          targetBuy = item.ask || item.buy_price;
        }

        const profit = item.highalch - targetBuy - effectiveNatPrice;
        const hourlyProfit = profit * 1200;
        const roi = targetBuy > 0 ? (profit / targetBuy) * 100 : 0;
        const effectiveLimit = item.buy_limit || 70;
        const batchProfit = profit * effectiveLimit;
        const maxAfford = targetBuy > 0 ? Math.min(effectiveLimit, Math.floor(cashStack / targetBuy)) : 0;

        // Fill confidence rating based on 5m volume and liquidity
        let fillConfidence: 'high' | 'steady' | 'risky' = 'steady';
        if (item.vol_5m_bid >= 8 || item.speed_score >= 3) {
          fillConfidence = 'high';
        } else if (item.secs_since_trade > 1800 || item.volume < 100) {
          fillConfidence = 'risky';
        }

        return {
          ...item,
          buy_price: targetBuy,
          profit,
          hourly_profit: hourlyProfit,
          roi,
          batch_profit: batchProfit,
          max_afford: maxAfford,
          fill_confidence: fillConfidence,
        };
      })
      .filter((item) => {
        // Members / F2P Logic:
        // If F2P Only is checked, exclude members items
        if (f2pOnly && item.members) return false;
        // If Members is unchecked and F2P Only is not checked, show only F2P items!
        if (!membersEnabled && item.members) return false;

        // Volume Filter
        if (minVolumeFilter > 0 && item.volume < minVolumeFilter) return false;

        // Cash budget filter
        if (!unlimitedBudget && item.buy_price > cashStack) return false;

        // Search Query
        if (searchQuery.trim()) {
          return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        }

        return true;
      })
      .sort((a, b) => b.hourly_profit - a.hourly_profit);
  }, [priceData, pricingStrategy, effectiveNatPrice, cashStack, unlimitedBudget, membersEnabled, f2pOnly, minVolumeFilter, searchQuery]);

  // Paginated Items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAlchItems.slice(start, start + pageSize);
  }, [filteredAlchItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAlchItems.length / pageSize) || 1;

  // Handle Quick Cash Dial
  const setQuickCash = (amt: number) => {
    setCashStack(amt);
    setUnlimitedBudget(false);
    showToast(`💰 Set working capital to ${formatGp(amt)}`);
  };

  const handleCopyPrice = (id: number, price: number) => {
    navigator.clipboard.writeText(price.toString());
    setCopiedId(id);
    showToast(`📋 Copied buy price: ${price.toLocaleString()} gp`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Alch Hub Header & Sub-Navigation */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141721] p-5 rounded-2xl border border-[#242b3b]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Coins className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white">High Alchemy & Trading Suite</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time margins, 48h overnight dip predictions, and World 308 bulk trade sheets.
          </p>
        </div>

        {/* Sub-view Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#191e29] p-1.5 rounded-xl border border-[#2a3449] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('table')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'table' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>Live Table</span>
          </button>
          <button
            onClick={() => setActiveTab('overnight')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'overnight' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Overnight Optimizer</span>
          </button>
          <button
            onClick={() => setActiveTab('w308')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'w308' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>World 308 Bulk</span>
          </button>
          <button
            onClick={() => setActiveTab('bank_tag')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'bank_tag' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Tag className="w-3.5 h-3.5" />
            <span>Bank Tags</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: LIVE ALCHEMY TABLE */}
      {activeTab === 'table' && (
        <div className="space-y-4">
          {/* Controls Bar: Quick Cash Dial & View Mode */}
          <div className="bg-[#141721] p-4 rounded-xl border border-[#242b3b] flex flex-wrap items-center justify-between gap-4 text-xs">
            {/* "My Cash Stack" Quick-Dial (Newbie Feature) */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-neutral-400 font-semibold flex items-center gap-1">
                <Coins className="w-3.5 h-3.5 text-amber-400" />
                <span>My Cash Stack:</span>
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: '100k', val: 100000 },
                  { label: '500k', val: 500000 },
                  { label: '2M', val: 2000000 },
                  { label: '10M', val: 10000000 },
                ].map((tier) => (
                  <button
                    key={tier.val}
                    onClick={() => setQuickCash(tier.val)}
                    className={`px-2.5 py-1 rounded-lg border font-mono font-bold transition-all ${
                      cashStack === tier.val && !unlimitedBudget
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-[#181d28] text-neutral-300 border-[#2a3449] hover:text-white'
                    }`}
                  >
                    {tier.label}
                  </button>
                ))}
                <button
                  onClick={() => setUnlimitedBudget(!unlimitedBudget)}
                  className={`px-2.5 py-1 rounded-lg border font-mono font-bold transition-all ${
                    unlimitedBudget
                      ? 'bg-amber-500 text-black border-amber-400'
                      : 'bg-[#181d28] text-neutral-300 border-[#2a3449] hover:text-white'
                  }`}
                >
                  All (Unlimited)
                </button>
              </div>
            </div>

            {/* Pricing Strategy & Table/Card View Switcher */}
            <div className="flex items-center gap-3">
              {/* Strategy Selector */}
              <div className="bg-[#181d28] p-0.5 rounded-lg border border-[#2a3449] flex font-semibold">
                {(['patient', 'smart', 'instant'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setPricingStrategy(s)}
                    className={`px-2.5 py-1 rounded capitalize transition-all ${
                      pricingStrategy === s ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    {s === 'patient' ? 'Bid' : s === 'smart' ? 'Bid+1' : 'Ask'}
                  </button>
                ))}
              </div>

              {/* Members / F2P Toggle */}
              <div className="flex items-center gap-2 bg-[#181d28] px-2.5 py-1 rounded-lg border border-[#2a3449] font-semibold">
                <label className="flex items-center gap-1 cursor-pointer text-neutral-300">
                  <input
                    type="checkbox"
                    checked={membersEnabled}
                    onChange={(e) => setMembersEnabled(e.target.checked)}
                    className="rounded accent-amber-500"
                  />
                  <span>Members</span>
                </label>
              </div>

              {/* 1-Tap Mobile Card / Table View Toggle */}
              <div className="bg-[#181d28] p-0.5 rounded-lg border border-[#2a3449] flex font-semibold">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    viewMode === 'table' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded transition-all ${
                    viewMode === 'cards' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Cards
                </button>
              </div>
            </div>
          </div>

          {/* Table View */}
          {viewMode === 'table' ? (
            <div className="bg-[#141721] rounded-2xl border border-[#242b3b] overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#10131b] text-neutral-400 uppercase text-[11px] border-b border-[#242b3b]">
                    <tr>
                      <th className="px-3 py-3 w-10 text-center">Cart</th>
                      <th className="px-4 py-3 font-sans">Item Name</th>
                      <th className="px-3 py-3">Buy Price</th>
                      <th className="px-3 py-3">Alch Val</th>
                      <th className="px-3 py-3 text-right">Profit ea</th>
                      <th className="px-3 py-3 text-right">Hourly Rate</th>
                      <th className="px-3 py-3 text-center font-sans">Fill Confidence</th>
                      <th className="px-3 py-3 text-center">4h Limit</th>
                      <th className="px-3 py-3 text-right">Batch Profit</th>
                      <th className="px-3 py-3 text-center">Timer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1c2230]">
                    {paginatedItems.map((item) => {
                      const inCart = cartItems.some((c) => c.id === item.id);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#181d29]/60 transition-colors"
                          onMouseEnter={(e) => {
                            const rect = e.currentTarget.getBoundingClientRect();
                            const x = Math.min(window.innerWidth - 340, Math.max(10, rect.left + 160));
                            const y = Math.min(window.innerHeight - 480, Math.max(10, rect.top));
                            setHoverPos({ x, y });
                            setHoveredItem(item);
                          }}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => toggleCart(item)}
                              className={`p-1 rounded transition-all ${inCart ? 'text-amber-400 font-bold' : 'text-neutral-500 hover:text-white'}`}
                              title={inCart ? 'Remove from Cart' : 'Add to Cart'}
                            >
                              <ShoppingCart className="w-4 h-4" />
                            </button>
                          </td>
                          <td className="px-4 py-3 font-sans font-bold text-white">
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://static.runelite.net/cache/item/icon/${item.id}.png`}
                                alt=""
                                className="w-6 h-6 object-contain shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span className="line-clamp-1">{item.name}</span>
                              <span className={`text-[10px] px-1 py-0.2 rounded font-mono ${item.members ? 'text-purple-400' : 'text-emerald-400'}`}>
                                {item.members ? 'P2P' : 'F2P'}
                              </span>
                            </div>
                          </td>
                          <td className="px-3 py-3 text-neutral-300 font-bold">
                            <button
                              onClick={() => handleCopyPrice(item.id, item.buy_price)}
                              className="hover:text-amber-400 flex items-center gap-1"
                              title="Click to copy buy price"
                            >
                              <span>{item.buy_price.toLocaleString()}</span>
                              {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-600" />}
                            </button>
                          </td>
                          <td className="px-3 py-3 text-neutral-400">{item.highalch.toLocaleString()}</td>
                          <td className={`px-3 py-3 text-right font-bold ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {item.profit > 0 ? `+${item.profit.toLocaleString()}` : item.profit.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-right font-black text-amber-400">
                            +{Math.round(item.hourly_profit / 1000)}k/hr
                          </td>
                          <td className="px-3 py-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.fill_confidence === 'high'
                                ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                                : item.fill_confidence === 'steady'
                                ? 'bg-cyan-500/10 text-cyan-400 border border-cyan-500/20'
                                : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                            }`}>
                              {item.fill_confidence === 'high' ? '⚡ High' : item.fill_confidence === 'steady' ? '⏱️ Steady' : '⚠️ Risky'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center text-neutral-300">{item.buy_limit.toLocaleString()}</td>
                          <td className="px-3 py-3 text-right font-bold text-emerald-400">
                            +{formatGp(item.batch_profit)}
                          </td>
                          <td className="px-3 py-3 text-center">
                            <button
                              onClick={() => addTimer(item)}
                              className="p-1 text-neutral-400 hover:text-amber-400 transition-colors"
                              title="Start 4H GE Limit Timer"
                            >
                              <Clock className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination Bar */}
              <div className="bg-[#10131b] px-4 py-3 border-t border-[#242b3b] flex flex-wrap items-center justify-between gap-4 text-xs text-neutral-400 font-mono">
                <span>
                  Showing {(currentPage - 1) * pageSize + 1}–{Math.min(currentPage * pageSize, filteredAlchItems.length)} of {filteredAlchItems.length} items
                </span>
                <div className="flex items-center gap-2">
                  <button
                    disabled={currentPage === 1}
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    className="p-1.5 rounded-lg bg-[#181d28] border border-[#2a3449] disabled:opacity-40 hover:text-white"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <span className="font-bold text-white">Page {currentPage} of {totalPages}</span>
                  <button
                    disabled={currentPage >= totalPages}
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    className="p-1.5 rounded-lg bg-[#181d28] border border-[#2a3449] disabled:opacity-40 hover:text-white"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* 1-Tap Mobile Card View */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#141721] border border-[#242b3b] hover:border-amber-500/40 p-4 rounded-2xl space-y-3 font-mono text-xs transition"
                  onMouseEnter={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = Math.min(window.innerWidth - 340, Math.max(10, rect.left + 20));
                    const y = Math.min(window.innerHeight - 480, Math.max(10, rect.top));
                    setHoverPos({ x, y });
                    setHoveredItem(item);
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-center gap-2">
                      <img
                        src={`https://static.runelite.net/cache/item/icon/${item.id}.png`}
                        alt=""
                        className="w-7 h-7 object-contain"
                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                      />
                      <span className="font-sans font-bold text-white text-sm line-clamp-1">{item.name}</span>
                    </div>
                    <span className="text-amber-400 font-bold">+{Math.round(item.hourly_profit / 1000)}k/hr</span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 bg-[#181d28] p-2.5 rounded-xl text-neutral-300">
                    <div>Buy: <strong className="text-white">{item.buy_price.toLocaleString()}</strong></div>
                    <div>Profit ea: <strong className="text-emerald-400">+{item.profit.toLocaleString()}</strong></div>
                    <div>Limit: <strong className="text-white">{item.buy_limit}</strong></div>
                    <div>Batch: <strong className="text-emerald-400">+{formatGp(item.batch_profit)}</strong></div>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-1 font-sans">
                    <button
                      onClick={() => handleCopyPrice(item.id, item.buy_price)}
                      className="flex-1 py-1.5 bg-[#1e2433] hover:bg-[#283145] text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1"
                    >
                      <Copy className="w-3 h-3 text-neutral-400" />
                      <span>{item.buy_price.toLocaleString()} gp</span>
                    </button>
                    <button
                      onClick={() => addTimer(item)}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-lg text-xs flex items-center gap-1"
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Timer</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: OVERNIGHT OPTIMIZER */}
      {activeTab === 'overnight' && (
        <div className="space-y-6">
          <div className="bg-[#141721] p-6 rounded-2xl border border-[#242b3b] space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  🌙 Overnight GE Dip Optimizer
                </h2>
                <p className="text-xs text-neutral-400">
                  Calculates 48-hour percentile buy dips to catch panic dumps while you sleep.
                </p>
              </div>
              <div className="flex items-center gap-2 text-xs">
                <span className="text-neutral-400">Strategy:</span>
                <button
                  onClick={() => setOvernightStrat('safe')}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                    overnightStrat === 'safe' ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-[#181d28] text-neutral-400 border-[#2a3449]'
                  }`}
                >
                  Safe (25th %)
                </button>
                <button
                  onClick={() => setOvernightStrat('deep')}
                  className={`px-3 py-1.5 rounded-lg border font-bold transition-all ${
                    overnightStrat === 'deep' ? 'bg-amber-500 text-black border-amber-400' : 'bg-[#181d28] text-neutral-400 border-[#2a3449]'
                  }`}
                >
                  Deep Dip (10th %)
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(overnightCandidatesData as any[]).map((cand) => {
                const liveItem = priceData?.items?.find((it) => it.id === cand.id);
                const curPrice = liveItem?.buy_price || 37500;
                // Calculate authentic percentile bid
                const dipBid = overnightStrat === 'deep' ? Math.floor(curPrice * 0.965) : Math.floor(curPrice * 0.985);
                const profitEa = (liveItem?.highalch || 38400) - dipBid - effectiveNatPrice;
                const totalProfit = profitEa * (cand.limit || 70) * (overnightDuration / 4);

                return (
                  <div key={cand.id} className="bg-[#181d28] border border-[#2a3449] p-4 rounded-xl space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-start">
                      <span className="font-sans font-bold text-white text-sm">{cand.name}</span>
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-300 border border-indigo-500/20">
                        {cand.group || 'Armor'}
                      </span>
                    </div>

                    <div className="space-y-1 text-neutral-300">
                      <div className="flex justify-between">
                        <span>Daytime Price:</span>
                        <span className="text-neutral-400">{curPrice.toLocaleString()} gp</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Overnight Bid:</span>
                        <strong className="text-emerald-400">{dipBid.toLocaleString()} gp</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>Morning Profit:</span>
                        <strong className="text-amber-400">+{formatGp(totalProfit)}</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleCopyPrice(cand.id, dipBid)}
                      className="w-full py-1.5 bg-[#202738] hover:bg-amber-500 hover:text-black text-neutral-200 font-sans font-bold rounded-lg transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Bid ({dipBid.toLocaleString()} gp)</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: WORLD 308 BULK TRADING */}
      {activeTab === 'w308' && (
        <div className="space-y-6">
          <div className="bg-[#141721] p-6 rounded-2xl border border-[#242b3b] space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#202636] pb-4">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  🤝 World 308 &apos;Varrock West&apos; Bulk Trading Hub
                </h2>
                <p className="text-xs text-neutral-400">
                  Bypass the 4-hour 70-unit GE buy limit by trading noted items directly in World 308.
                </p>
              </div>

              {/* Operating Role Toggle (Buyer vs Smither) */}
              <div className="flex items-center gap-1.5 bg-[#191e29] p-1 rounded-xl border border-[#2a3449] text-xs font-semibold">
                <button
                  onClick={() => setW308Role('buyer')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    w308Role === 'buyer' ? 'bg-emerald-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🛒 Alcher / Buyer Mode
                </button>
                <button
                  onClick={() => setW308Role('seller')}
                  className={`px-3 py-1.5 rounded-lg transition-all ${
                    w308Role === 'seller' ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  🔨 Smither / Seller Mode
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(w308StaplesData as any[]).map((staple) => {
                const profitEa = staple.highalch - staple.w308_buy - effectiveNatPrice;
                return (
                  <div key={staple.id} className="bg-[#181d28] border border-[#2a3449] p-4 rounded-xl space-y-3 font-mono text-xs">
                    <div className="flex justify-between items-center">
                      <span className="font-sans font-bold text-white text-sm">{staple.name}</span>
                      <span className="text-amber-400 font-bold">{staple.shorthand}</span>
                    </div>

                    <div className="space-y-1 text-neutral-300">
                      <div className="flex justify-between">
                        <span>W308 Price:</span>
                        <strong className="text-white">{staple.w308_buy.toLocaleString()} gp</strong>
                      </div>
                      <div className="flex justify-between">
                        <span>High Alch Value:</span>
                        <span>{staple.highalch.toLocaleString()} gp</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Profit per cast:</span>
                        <strong className="text-emerald-400">+{profitEa.toLocaleString()} gp</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => {
                        const ad = `Buying ${staple.shorthand} ${staple.w308_buy} gp ea bulk - Trade Me`;
                        navigator.clipboard.writeText(ad);
                        showToast(`📢 Copied trade ad: "${ad}"`);
                      }}
                      className="w-full py-1.5 bg-[#202738] hover:bg-emerald-500 hover:text-black text-neutral-200 font-sans font-bold rounded-lg transition-all text-xs flex items-center justify-center gap-1.5"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Copy Clan Ad</span>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 4: BANK TAG GENERATOR */}
      {activeTab === 'bank_tag' && (
        <div className="space-y-6">
          <div className="bg-[#141721] p-6 rounded-2xl border border-[#242b3b] space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Tag className="w-5 h-5 text-amber-400" />
                  RuneLite Bank Tag Generator
                </h2>
                <p className="text-xs text-neutral-400">
                  Generate instant bank tag search strings to group your active alchemy batches in RuneLite.
                </p>
              </div>
              <button
                onClick={() => copyBankTags(filteredAlchItems.slice(0, 30))}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold rounded-xl text-xs flex items-center gap-1.5 shadow-md shadow-amber-500/20"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Top 30 Items Tag</span>
              </button>
            </div>

            <div className="bg-[#181d28] border border-[#2a3449] p-4 rounded-xl font-mono text-xs text-neutral-300 break-all select-all">
              alchmate,{filteredAlchItems.slice(0, 30).map((it) => it.name).join(',')}
            </div>

            <p className="text-xs text-neutral-400">
              💡 <strong>How to use:</strong> In RuneLite, open your Bank, right-click the tag tab icon on the left, click &quot;Import Tag Tab&quot;, and paste this string. All 30 items will appear together!
            </p>
          </div>
        </div>
      )}

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
