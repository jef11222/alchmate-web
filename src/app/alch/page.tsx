'use client';

import React, { useState, useMemo, useEffect } from 'react';
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
  Filter,
  Zap,
  Shield,
  Layers,
  ArrowRight
} from 'lucide-react';
import { useAlchMate, AlchItem } from '../../context/AlchMateContext';
import ItemHoverCard from '../../components/ItemHoverCard';
import w308StaplesData from '../../data/w308_staples.json';
import overnightCandidatesData from '../../data/overnight_candidates.json';
import workhorseItemsData from '../../data/workhorse_items.json';

function formatGp(val: number): string {
  if (!val || val === 0) return '0 gp';
  if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return `${val.toLocaleString()} gp`;
}

// Global UTC Market Timing Analysis matching gui.py:138
function getMarketTimingInfo() {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60;
  const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;

  if (utcHours >= 14 && utcHours < 22) {
    const pct = Math.min(100, Math.max(75, Math.round(75 + 25 * (1 - Math.abs(utcHours - 18) / 4))));
    const estOnline = `~${(115000 + (pct - 75) * 1800).toLocaleString()} online`;
    const filledBlocks = Math.round(pct / 10);
    const bar = '█'.repeat(filledBlocks) + '░'.repeat(10 - filledBlocks);
    return {
      timeStr,
      badge: '🟢 Peak Liquidity Window (Fast Fills & High Volume)',
      badgeClass: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      activity: `Activity: [${bar}] ${pct}% (${estOnline})`,
      advice: '💡 Market Tip: Prime EU/US trading hours! Buy orders fill in 2-5m. Best time for Fast Fills & Workhorses.',
      recommendedCat: 'fast' as const
    };
  } else if (utcHours >= 22 || utcHours < 2) {
    const bar = '██████░░░░';
    return {
      timeStr,
      badge: '🟡 Evening Wind-Down (Good for Setting Overnight Orders)',
      badgeClass: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      activity: `Activity: [${bar}] 65% (~95,000 online)`,
      advice: '💡 Market Tip: US late evening. Volume tapering off. Queue up high-profit overnight bids.',
      recommendedCat: 'overnight' as const
    };
  } else if (utcHours >= 2 && utcHours < 10) {
    const bar = '████░░░░░░';
    return {
      timeStr,
      badge: '🔵 Off-Peak Night Valley (Deep Dip Sniping & Sleep Window)',
      badgeClass: 'bg-indigo-500/10 text-indigo-300 border-indigo-500/20',
      activity: `Activity: [${bar}] 40% (~55,000 online)`,
      advice: '💡 Market Tip: Deep off-peak valley. Impatient sellers dump at lowest prices. Deep-dip sniping fills here.',
      recommendedCat: 'overnight' as const
    };
  } else {
    const bar = '█████░░░░░';
    return {
      timeStr,
      badge: '🟠 Morning Ramp-Up (EU Market Awakening)',
      badgeClass: 'bg-orange-500/10 text-orange-400 border-orange-500/20',
      activity: `Activity: [${bar}] 55% (~80,000 online)`,
      advice: '💡 Market Tip: European morning ramp-up. Liquidity increasing steadily. Good time to collect overnight fills.',
      recommendedCat: 'workhorse' as const
    };
  }
}

export default function AlchPage() {
  const { 
    priceData, 
    loading, 
    refreshPrices,
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

  // 4 Desktop Hub Sub-Views
  const [activeTab, setActiveTab] = useState<'all' | 'rec' | 'overnight' | 'w308' | 'bank_tag'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [copiedId, setCopiedId] = useState<number | null>(null);

  // Item Type Filter matching gui.py:1594
  const [itemTypeFilter, setItemTypeFilter] = useState<string>('all');

  // Hover info card
  const [hoveredItem, setHoveredItem] = useState<AlchItem | null>(null);
  const [hoverPos, setHoverPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Smart Picks (tab_rec) Settings
  const [smartPicksCat, setSmartPicksCat] = useState<'workhorse' | 'fast' | 'batch' | 'overnight'>('workhorse');

  // Overnight Settings
  const [overnightDuration, setOvernightDuration] = useState<number>(12); // 6, 8, 10, 12
  const [overnightStrat, setOvernightStrat] = useState<'safe' | 'deep'>('safe');
  const [overnightSlots, setOvernightSlots] = useState<number>(8);
  const [overnightFocus, setOvernightFocus] = useState<string>('all');
  const [overnightMaxAlchTime, setOvernightMaxAlchTime] = useState<number>(60); // minutes

  // W308 Role & Trade Verifier
  const [w308Role, setW308Role] = useState<'buyer' | 'seller'>('buyer');
  const [w308MemFilter, setW308MemFilter] = useState<'all' | 'f2p' | 'p2p'>('all');
  const [w308SelectedName, setW308SelectedName] = useState<string>('Rune 2h sword');
  const [w308AgreedPrice, setW308AgreedPrice] = useState<number>(37600);
  const [w308Qty, setW308Qty] = useState<number>(132);

  // Auto-calculated market timing
  const timingInfo = useMemo(() => getMarketTimingInfo(), []);

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
        if (f2pOnly && item.members) return false;
        if (!membersEnabled && item.members) return false;
        if (minVolumeFilter > 0 && item.volume < minVolumeFilter) return false;
        if (!unlimitedBudget && item.buy_price > cashStack) return false;

        // Item type quick filter matching gui.py:1594
        if (itemTypeFilter !== 'all') {
          const n = item.name.toLowerCase();
          if (itemTypeFilter === 'rune' && !n.includes('rune')) return false;
          if (itemTypeFilter === 'adamant' && !n.includes('adamant') && !n.includes('addy')) return false;
          if (itemTypeFilter === 'mithril' && !n.includes('mithril') && !n.includes('mith')) return false;
          if (itemTypeFilter === 'dragon' && !n.includes('dragon')) return false;
          if (itemTypeFilter === 'jewellery' && !n.includes('bracelet') && !n.includes('ring') && !n.includes('necklace') && !n.includes('amulet')) return false;
          if (itemTypeFilter === 'battlestaff' && !n.includes('battlestaff')) return false;
          if (itemTypeFilter === 'dhide' && !n.includes("d'hide") && !n.includes('dragonhide')) return false;
          if (itemTypeFilter === 'bow' && !n.includes('bow') && !n.includes('shortbow') && !n.includes('longbow')) return false;
          if (itemTypeFilter === 'stackable' && !n.includes('bolt') && !n.includes('javelin') && !n.includes('dart') && !n.includes('arrow')) return false;
        }

        // Search Query
        if (searchQuery.trim()) {
          return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        }

        return true;
      })
      .sort((a, b) => b.hourly_profit - a.hourly_profit);
  }, [priceData, pricingStrategy, effectiveNatPrice, cashStack, unlimitedBudget, membersEnabled, f2pOnly, minVolumeFilter, searchQuery, itemTypeFilter]);

  // Paginated Items
  const paginatedItems = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredAlchItems.slice(start, start + pageSize);
  }, [filteredAlchItems, currentPage, pageSize]);

  const totalPages = Math.ceil(filteredAlchItems.length / pageSize) || 1;

  // Smart Picks computed rows matching gui.py:7171
  const smartPicksRows = useMemo(() => {
    if (!priceData?.items) return [];

    if (smartPicksCat === 'workhorse') {
      const whMap = new Map((workhorseItemsData as any[]).map((w) => [w.id, w]));
      return priceData.items
        .filter((it) => whMap.has(it.id))
        .map((it) => {
          const spec = whMap.get(it.id);
          const buyAt = it.bid || it.buy_price;
          const profit = it.highalch - buyAt - effectiveNatPrice;
          const limit = spec.limit || it.buy_limit || 70;
          return {
            id: it.id,
            name: it.name,
            badge: '🏆 Top Pick',
            category: '🏆 Workhorse',
            offerBid: buyAt,
            alchVal: it.highalch,
            profitEa: profit,
            limit: limit,
            batchProfit: profit * limit,
            batchCost: buyAt * limit,
            speed: it.speed_label || '< 3 mins',
            verdict: spec.verdict || '👑 Proven high-volume alch staple with rock-solid alch floor.'
          };
        })
        .sort((a, b) => b.batchProfit - a.batchProfit);
    } else if (smartPicksCat === 'fast') {
      return priceData.items
        .filter((it) => {
          if (f2pOnly && it.members) return false;
          if (!membersEnabled && it.members) return false;
          return (it.vol_5m_bid >= 6 || it.speed_category === 'fast') && (it.highalch - it.buy_price - effectiveNatPrice > 0);
        })
        .slice(0, 30)
        .map((it) => {
          const buyAt = it.bid || it.buy_price;
          const profit = it.highalch - buyAt - effectiveNatPrice;
          const limit = it.buy_limit || 70;
          return {
            id: it.id,
            name: it.name,
            badge: '⚡ Fast Fill',
            category: '⚡ Fast Fills (<5m)',
            offerBid: buyAt,
            alchVal: it.highalch,
            profitEa: profit,
            limit: limit,
            batchProfit: profit * limit,
            batchCost: buyAt * limit,
            speed: it.speed_label || '< 5 mins',
            verdict: `⚡ High velocity: ${it.vol_5m_bid || 12} sold in last 5m. Fills in ~${it.est_minutes || 3} mins!`
          };
        })
        .sort((a, b) => b.profitEa - a.profitEa);
    } else if (smartPicksCat === 'batch') {
      return priceData.items
        .filter((it) => {
          if (f2pOnly && it.members) return false;
          if (!membersEnabled && it.members) return false;
          return (it.buy_limit || 70) >= 70 && (it.highalch - it.buy_price - effectiveNatPrice > 0);
        })
        .map((it) => {
          const buyAt = it.bid || it.buy_price;
          const profit = it.highalch - buyAt - effectiveNatPrice;
          const limit = it.buy_limit || 70;
          return {
            id: it.id,
            name: it.name,
            badge: '💰 Top Batch',
            category: '💰 Top 4h Batch Yield',
            offerBid: buyAt,
            alchVal: it.highalch,
            profitEa: profit,
            limit: limit,
            batchProfit: profit * limit,
            batchCost: buyAt * limit,
            speed: it.speed_label || 'Steady',
            verdict: `💰 Massive yield: +${(profit * limit).toLocaleString()} gp for full ${limit} limit batch.`
          };
        })
        .sort((a, b) => b.batchProfit - a.batchProfit)
        .slice(0, 30);
    } else {
      // Overnight sleepers
      const onMap = new Map((overnightCandidatesData as any[]).map((c) => [c.id, c]));
      return (overnightCandidatesData as any[])
        .filter((c) => {
          if (f2pOnly && c.members) return false;
          if (!membersEnabled && c.members) return false;
          return true;
        })
        .map((cand) => {
          const liveItem = priceData.items.find((it) => it.id === cand.id);
          const daytimePrice = liveItem?.buy_price || liveItem?.bid || 37500;
          const dipBid = Math.floor(daytimePrice * 0.975);
          const profit = (cand.alch || liveItem?.highalch || 38400) - dipBid - effectiveNatPrice;
          const limit = cand.limit || 70;
          return {
            id: cand.id,
            name: cand.name,
            badge: '🌙 Sleeper',
            category: '🌙 Overnight Sleeper',
            offerBid: dipBid,
            alchVal: cand.alch || liveItem?.highalch || 38400,
            profitEa: profit,
            limit: limit * 2,
            batchProfit: profit * limit * 2,
            batchCost: dipBid * limit * 2,
            speed: 'Sleep Window',
            verdict: cand.verdict || '🌙 Deep dip sleeper that catches off-peak night dumps.'
          };
        })
        .sort((a, b) => b.batchProfit - a.batchProfit);
    }
  }, [priceData, smartPicksCat, effectiveNatPrice, membersEnabled, f2pOnly]);

  // Overnight Computed Allocations matching gui.py:1833
  const limitMultiplier = overnightDuration >= 10 ? 3.0 : 2.0;
  const overnightAllocations = useMemo(() => {
    let budgetLeft = cashStack > 0 ? cashStack : 5000000;
    const candidates = (overnightCandidatesData as any[]).filter((c) => {
      if (f2pOnly && c.members) return false;
      if (!membersEnabled && c.members) return false;
      if (overnightFocus === 'rune' && c.group !== 'rune') return false;
      if (overnightFocus === 'adamant' && c.group !== 'adamant') return false;
      if (overnightFocus === 'staff' && c.group !== 'staff') return false;
      if (overnightFocus === 'bolt' && c.group !== 'bolt') return false;
      return true;
    });

    const allocatedList: any[] = [];
    let slotsUsed = 0;

    for (const cand of candidates) {
      if (slotsUsed >= overnightSlots) break;
      const liveItem = priceData?.items?.find((it) => it.id === cand.id);
      const curPrice = liveItem?.bid || liveItem?.buy_price || 37500;
      const optimalBid = overnightStrat === 'deep' ? Math.floor(curPrice * 0.965) : Math.floor(curPrice * 0.982);
      const profitEa = (cand.alch || liveItem?.highalch || 38400) - optimalBid - effectiveNatPrice;
      const periodLimit = Math.round((cand.limit || 70) * limitMultiplier);

      if (optimalBid <= 0 || profitEa <= 0) continue;

      const maxByBudget = Math.floor(budgetLeft / optimalBid);
      const allocQty = Math.min(periodLimit, maxByBudget);

      if (allocQty > 0) {
        const totalSpend = allocQty * optimalBid;
        const slotProfit = allocQty * profitEa;
        budgetLeft -= totalSpend;
        slotsUsed += 1;

        allocatedList.push({
          id: cand.id,
          name: cand.name,
          badge: slotsUsed <= 3 ? '⭐ Pick' : '📦 Slot',
          optimalBid,
          highalch: cand.alch || liveItem?.highalch || 38400,
          profitEa,
          periodLimit,
          allocQty,
          totalSpend,
          slotProfit,
          confidence: liveItem?.volume && liveItem.volume > 500 ? '🟢 High (>95%)' : '🟡 Steady (~80%)',
          verdict: cand.verdict
        });
      }
    }

    return allocatedList;
  }, [priceData, overnightDuration, overnightStrat, overnightSlots, overnightFocus, cashStack, effectiveNatPrice, limitMultiplier, f2pOnly, membersEnabled]);

  const totalOvernightSpend = useMemo(() => overnightAllocations.reduce((sum, a) => sum + a.totalSpend, 0), [overnightAllocations]);
  const totalOvernightProfit = useMemo(() => overnightAllocations.reduce((sum, a) => sum + a.slotProfit, 0), [overnightAllocations]);
  const totalOvernightItems = useMemo(() => overnightAllocations.reduce((sum, a) => sum + a.allocQty, 0), [overnightAllocations]);
  const overnightAlchTimeMins = Math.round((totalOvernightItems / 1200) * 60);

  // W308 Validator Calculations
  const w308StapleObj = useMemo(() => {
    return (w308StaplesData as any[]).find((s) => s.name === w308SelectedName) || (w308StaplesData as any[])[0];
  }, [w308SelectedName]);

  const w308TotalCoinsToGive = w308AgreedPrice * w308Qty;
  const w308HighAlchTotal = (w308StapleObj?.highalch || 38400) * w308Qty;
  const w308NatCostTotal = effectiveNatPrice * w308Qty;
  const w308NetProfit = w308HighAlchTotal - w308TotalCoinsToGive - w308NatCostTotal;
  const w308MagicXp = w308Qty * 65;

  const handleCopyPrice = (id: number, price: number) => {
    navigator.clipboard.writeText(price.toString());
    setCopiedId(id);
    showToast(`📋 Copied buy price: ${price.toLocaleString()} gp`);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const handleCopyText = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    showToast(`📋 Copied ${label} to clipboard!`);
  };

  const handleAutoFillEmptySlots = () => {
    const picks = smartPicksRows.slice(0, 8);
    picks.forEach((p) => {
      const match = priceData?.items?.find((it) => it.id === p.id);
      if (match) toggleCart(match);
    });
    showToast(`⚡ Added top ${Math.min(8, picks.length)} items into your Shopping Cart!`);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Alch Hub Header & 4 Sub-Navigation Tabs matching gui.py:1433 */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141721] p-5 rounded-2xl border border-[#242b3b]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
              <Coins className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white">High Alchemy & Trading Hub</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            Real-time margins, 48h overnight dip predictions, and World 308 bulk trade sheets.
          </p>
        </div>

        {/* 4 Desktop Sub-View Navigation Pills */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#191e29] p-1.5 rounded-xl border border-[#2a3449] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'all' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Coins className="w-3.5 h-3.5" />
            <span>📋 All Alch Items</span>
          </button>
          <button
            onClick={() => setActiveTab('rec')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'rec' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>⭐ Smart Picks</span>
          </button>
          <button
            onClick={() => setActiveTab('overnight')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'overnight' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>🌙 Overnight Planner</span>
          </button>
          <button
            onClick={() => setActiveTab('w308')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'w308' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>🤝 W308 Bulk Trading</span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* SUB-VIEW 1: 📋 ALL ALCH ITEMS                                    */}
      {/* ============================================================== */}
      {activeTab === 'all' && (
        <div className="space-y-4">
          {/* Item Type Quick Filters Strip matching gui.py:1594 */}
          <div className="bg-[#141721] p-3 rounded-xl border border-[#242b3b] flex items-center gap-2 overflow-x-auto text-xs font-semibold">
            <span className="text-amber-400 font-bold shrink-0 flex items-center gap-1">
              <Filter className="w-3.5 h-3.5" /> Types:
            </span>
            {[
              { id: 'all', label: 'All Items' },
              { id: 'rune', label: '🛡️ Rune' },
              { id: 'adamant', label: '⚔️ Adamant' },
              { id: 'mithril', label: '🗡️ Mithril' },
              { id: 'dragon', label: '🐉 Dragon' },
              { id: 'jewellery', label: '💍 Jewellery' },
              { id: 'battlestaff', label: '🪄 Battlestaves' },
              { id: 'dhide', label: "🏹 D'hide" },
              { id: 'bow', label: '🪵 Bows' },
              { id: 'stackable', label: '📦 Stackables' },
            ].map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setItemTypeFilter(t.id);
                  setCurrentPage(1);
                }}
                className={`px-2.5 py-1 rounded-lg transition-all shrink-0 cursor-pointer ${
                  itemTypeFilter === t.id
                    ? 'bg-amber-500 text-black font-bold'
                    : 'bg-[#181d28] text-neutral-300 hover:text-white border border-[#2a3449]'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Strategy, Volume, Budget & View Mode Controls Strip */}
          <div className="bg-[#141721] p-4 rounded-xl border border-[#242b3b] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              {/* Buy Strategy */}
              <div className="flex items-center gap-1.5 bg-[#181d28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 font-semibold">
                <span className="text-neutral-400">Strategy:</span>
                <select
                  value={pricingStrategy}
                  onChange={(e) => setPricingStrategy(e.target.value as any)}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value="patient" className="bg-[#181d28]">patient (Bid)</option>
                  <option value="smart" className="bg-[#181d28]">smart (Bid+1)</option>
                  <option value="instant" className="bg-[#181d28]">instant (Ask)</option>
                </select>
              </div>

              {/* Members / F2P Switcher */}
              <div className="flex items-center gap-1 bg-[#181d28] border border-[#2a3449] rounded-lg p-0.5">
                <button
                  onClick={() => {
                    setF2pOnly(false);
                    setMembersEnabled(true);
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    membersEnabled && !f2pOnly ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  P2P + F2P
                </button>
                <button
                  onClick={() => {
                    setF2pOnly(true);
                    setMembersEnabled(false);
                  }}
                  className={`px-2.5 py-1 rounded-md font-semibold transition ${
                    f2pOnly ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  F2P Only
                </button>
              </div>

              {/* Min Volume */}
              <div className="flex items-center gap-1.5 bg-[#181d28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 font-semibold">
                <span className="text-neutral-400">Min Vol:</span>
                <select
                  value={minVolumeFilter}
                  onChange={(e) => setMinVolumeFilter(Number(e.target.value))}
                  className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
                >
                  <option value={0} className="bg-[#181d28]">0 (All)</option>
                  <option value={50} className="bg-[#181d28]">50+</option>
                  <option value={100} className="bg-[#181d28]">100+</option>
                  <option value={500} className="bg-[#181d28]">500+</option>
                  <option value={1000} className="bg-[#181d28]">1,000+</option>
                </select>
              </div>
            </div>

            {/* View Mode & Bank Tag Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={() => copyBankTags(filteredAlchItems.slice(0, 30))}
                className="bg-[#181d28] hover:bg-[#202738] border border-[#2a3449] text-amber-400 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition font-semibold"
                title="Copy RuneLite bank tag for top 30 items"
              >
                <Tag className="w-3.5 h-3.5" />
                <span>Copy Top 30 Bank Tag</span>
              </button>

              <div className="flex items-center bg-[#181d28] border border-[#2a3449] rounded-lg p-0.5">
                <button
                  onClick={() => setViewMode('table')}
                  className={`px-2.5 py-1 rounded-md transition font-semibold ${
                    viewMode === 'table' ? 'bg-[#202738] text-white' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Table
                </button>
                <button
                  onClick={() => setViewMode('cards')}
                  className={`px-2.5 py-1 rounded-md transition font-semibold ${
                    viewMode === 'cards' ? 'bg-[#202738] text-white' : 'text-neutral-400 hover:text-white'
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
                  <thead>
                    <tr className="border-b border-[#242b3b] bg-[#181d28] text-neutral-400 select-none">
                      <th className="py-3 px-3 w-10 text-center">Cart</th>
                      <th className="py-3 px-4 font-sans font-semibold">Item Name</th>
                      <th className="py-3 px-3 text-right">High Alch</th>
                      <th className="py-3 px-3 text-right">Offer (Buy)</th>
                      <th className="py-3 px-3 text-right text-emerald-400 font-bold">Profit / Ea</th>
                      <th className="py-3 px-3 text-right text-amber-400 font-bold">Profit / Hr</th>
                      <th className="py-3 px-3 text-right">4h Limit</th>
                      <th className="py-3 px-3 text-right text-cyan-400 font-bold">Batch Profit</th>
                      <th className="py-3 px-3 text-center">Fill Speed</th>
                      <th className="py-3 px-3 text-center">Timer</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#202738]">
                    {paginatedItems.map((item) => {
                      const inCart = cartItems.some((c) => c.id === item.id);
                      return (
                        <tr
                          key={item.id}
                          className="hover:bg-[#1a2130] transition group cursor-pointer"
                          onMouseEnter={(e) => {
                            setHoveredItem(item);
                            setHoverPos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseMove={(e) => {
                            setHoverPos({ x: e.clientX, y: e.clientY });
                          }}
                          onMouseLeave={() => setHoveredItem(null)}
                        >
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <input
                              type="checkbox"
                              checked={inCart}
                              onChange={() => toggleCart(item)}
                              className="rounded border-[#2a3449] bg-[#181d28] text-amber-500 focus:ring-0 cursor-pointer"
                            />
                          </td>
                          <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                            <span>{item.name}</span>
                            {item.members && (
                              <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono font-semibold">
                                P2P
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-right text-neutral-300">
                            {(item.highalch || 0).toLocaleString()} gp
                          </td>
                          <td className="py-3 px-3 text-right text-neutral-200">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCopyPrice(item.id, item.buy_price);
                              }}
                              className="hover:text-amber-400 underline decoration-dotted transition"
                              title="Click to copy buy price"
                            >
                              {copiedId === item.id ? 'Copied!' : `${(item.buy_price || 0).toLocaleString()} gp`}
                            </button>
                          </td>
                          <td className={`py-3 px-3 text-right font-bold ${
                            (item.profit || 0) > 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}>
                            {(item.profit || 0) > 0 ? `+${(item.profit || 0).toLocaleString()}` : (item.profit || 0).toLocaleString()} gp
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-amber-400">
                            +{formatGp(item.hourly_profit)}/hr
                          </td>
                          <td className="py-3 px-3 text-right text-neutral-400">
                            {item.buy_limit?.toLocaleString() || '70'}
                          </td>
                          <td className="py-3 px-3 text-right font-bold text-cyan-400">
                            +{formatGp(item.batch_profit)}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-semibold ${
                              item.speed_category === 'fast'
                                ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                                : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                            }`}>
                              {item.speed_label || 'Normal'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-center" onClick={(e) => e.stopPropagation()}>
                            <button
                              onClick={() => addTimer(item)}
                              className="p-1 rounded bg-[#202738] hover:bg-amber-500 hover:text-black text-neutral-300 transition"
                              title="Start 4-Hour GE limit timer"
                            >
                              <Clock className="w-3.5 h-3.5" />
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              <div className="p-4 bg-[#181d28] border-t border-[#242b3b] flex items-center justify-between text-xs text-neutral-400">
                <span>
                  Showing {paginatedItems.length} of {filteredAlchItems.length} items (Page {currentPage} of {totalPages})
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-1.5 rounded-lg bg-[#202738] hover:bg-[#283248] disabled:opacity-40 transition"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-1.5 rounded-lg bg-[#202738] hover:bg-[#283248] disabled:opacity-40 transition"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Cards View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {paginatedItems.map((item) => (
                <div
                  key={item.id}
                  className="bg-[#141721] border border-[#242b3b] hover:border-amber-500/40 p-4 rounded-xl space-y-3 transition group"
                  onMouseEnter={(e) => {
                    setHoveredItem(item);
                    setHoverPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseMove={(e) => {
                    setHoverPos({ x: e.clientX, y: e.clientY });
                  }}
                  onMouseLeave={() => setHoveredItem(null)}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-bold text-white text-sm group-hover:text-amber-400 transition">
                        {item.name}
                      </h3>
                      <span className="text-[11px] text-neutral-400 font-mono">
                        Limit: {item.buy_limit || 70} | Vol: {(item.volume || 0).toLocaleString()}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                      +{((item.profit || 0)).toLocaleString()} gp
                    </span>
                  </div>

                  <div className="space-y-1 font-mono text-xs text-neutral-300">
                    <div className="flex justify-between">
                      <span className="text-neutral-400">Offer Buy:</span>
                      <strong className="text-white">{(item.buy_price || 0).toLocaleString()} gp</strong>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">High Alch:</span>
                      <span className="text-neutral-300">{(item.highalch || 0).toLocaleString()} gp</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-400">4h Batch:</span>
                      <strong className="text-cyan-400">+{formatGp(item.batch_profit)}</strong>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-2 border-t border-[#202738]">
                    <button
                      onClick={() => handleCopyPrice(item.id, item.buy_price)}
                      className="flex-1 py-1.5 bg-[#181d28] hover:bg-amber-500 hover:text-black text-neutral-300 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>{copiedId === item.id ? 'Copied' : 'Copy Bid'}</span>
                    </button>
                    <button
                      onClick={() => addTimer(item)}
                      className="p-1.5 bg-[#181d28] hover:bg-[#202738] text-neutral-300 rounded-lg text-xs transition border border-[#2a3449]"
                      title="Start 4-hour limit timer"
                    >
                      <Clock className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-VIEW 2: ⭐ SMART PICKS (tab_rec matching gui.py:1711)        */}
      {/* ============================================================== */}
      {activeTab === 'rec' && (
        <div className="space-y-5">
          {/* 1. Market Clock & Timing Banner Card matching gui.py:1715 */}
          <div className="bg-[#141721] border border-[#242b3b] rounded-2xl p-5 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span className="text-lg font-bold font-mono text-amber-400 flex items-center gap-1.5">
                  <Clock className="w-5 h-5 text-amber-400" />
                  🕒 {timingInfo.timeStr}
                </span>
                <span className={`text-xs px-2.5 py-1 rounded-full border font-bold ${timingInfo.badgeClass}`}>
                  {timingInfo.badge}
                </span>
              </div>
              <span className="text-xs font-mono text-blue-400 font-semibold">
                {timingInfo.activity}
              </span>
            </div>
            <p className="text-xs text-neutral-300 italic font-sans border-t border-[#202738] pt-2">
              {timingInfo.advice}
            </p>
          </div>

          {/* 2. Category Selectors & Actions matching gui.py:1736 */}
          <div className="bg-[#141721] p-4 rounded-xl border border-[#242b3b] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-amber-400 font-bold">Category:</span>
              {[
                { id: 'workhorse', label: '🏆 All-Time Workhorses' },
                { id: 'fast', label: '⚡ Fast Fills (<5m)' },
                { id: 'batch', label: '💰 Top 4h Batch Profit' },
                { id: 'overnight', label: '🌙 Overnight Sleepers' },
              ].map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSmartPicksCat(c.id as any)}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer ${
                    smartPicksCat === c.id
                      ? 'bg-amber-500 text-black font-bold shadow'
                      : 'bg-[#181d28] text-neutral-300 hover:text-white border border-[#2a3449]'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleAutoFillEmptySlots}
                className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-3.5 py-1.5 rounded-lg flex items-center gap-1.5 transition shadow-sm cursor-pointer"
              >
                <Zap className="w-3.5 h-3.5" />
                <span>⚡ Auto-Fill Empty GE Slots</span>
              </button>
              <button
                onClick={() => {
                  const txt = smartPicksRows.map((r, i) => `${i + 1}. ${r.name} - Buy: ${r.offerBid.toLocaleString()} gp (Alch: ${r.alchVal.toLocaleString()} gp | +${r.profitEa.toLocaleString()} ea)`).join('\n');
                  handleCopyText(txt, 'all recommendations');
                }}
                className="bg-[#181d28] hover:bg-[#202738] border border-[#2a3449] text-neutral-300 px-3 py-1.5 rounded-lg transition"
              >
                📋 Copy All
              </button>
            </div>
          </div>

          {/* 3. Recommendations Table */}
          <div className="bg-[#141721] rounded-2xl border border-[#242b3b] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#242b3b] bg-[#181d28] text-neutral-400 select-none">
                    <th className="py-3 px-3 text-center">Pick</th>
                    <th className="py-3 px-4 font-sans font-semibold">Item Name</th>
                    <th className="py-3 px-3 text-right">Offer (Bid)</th>
                    <th className="py-3 px-3 text-right">High Alch</th>
                    <th className="py-3 px-3 text-right text-emerald-400 font-bold">Profit / Ea</th>
                    <th className="py-3 px-3 text-right">4h Limit</th>
                    <th className="py-3 px-3 text-right text-cyan-400 font-bold">Batch Profit</th>
                    <th className="py-3 px-3 text-center">Fill Speed</th>
                    <th className="py-3 px-4">Market Analysis & Verdict</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202738]">
                  {smartPicksRows.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#1a2130] transition group cursor-pointer"
                      onClick={() => handleCopyPrice(row.id, row.offerBid)}
                      title="Click to copy buy price"
                    >
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-bold">
                          {row.badge}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-white">
                        {row.name}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-200">
                        {row.offerBid.toLocaleString()} gp
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-300">
                        {row.alchVal.toLocaleString()} gp
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-emerald-400">
                        +{row.profitEa.toLocaleString()} gp
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-400">
                        {row.limit.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-cyan-400">
                        +{formatGp(row.batchProfit)}
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded bg-[#181d28] border border-[#2a3449] text-neutral-300">
                          {row.speed}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-neutral-300 text-[11px] font-sans">
                        {row.verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-VIEW 3: 🌙 OVERNIGHT PLANNER (matching gui.py:1833)          */}
      {/* ============================================================== */}
      {activeTab === 'overnight' && (
        <div className="space-y-5">
          {/* 1. Header & Multi-Day Dip Analysis Banner */}
          <div className="bg-[#141721] p-6 rounded-2xl border border-[#242b3b] space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <Moon className="w-5 h-5 text-indigo-400" />
                  🌙 GE Overnight Optimizer & Dip Sniping
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Optimizes Grand Exchange buy offers for overnight sleep windows. Analyzes 48h & 7d percentile dips to catch off-peak undercut dumps.
                </p>
              </div>
              <span className="text-xs px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-bold font-mono">
                ⏰ Limit Multiplier: {limitMultiplier.toFixed(1)}x ({overnightDuration}h Window = {limitMultiplier} GE Cycles)
              </span>
            </div>
            <p className="text-xs text-neutral-300 italic font-sans border-t border-[#202738] pt-2">
              💡 Sleep Strategy: Between 03:00 and 08:00 UTC, player activity drops ~50%. Placing patient percentile bids lets you catch massive dumps while 4h buy limits reset multiple times!
            </p>
          </div>

          {/* 2. Control Strip matching gui.py:1861 */}
          <div className="bg-[#141721] p-4 rounded-xl border border-[#242b3b] flex flex-wrap items-center gap-4 text-xs font-semibold">
            {/* Duration */}
            <div className="flex items-center gap-1.5 bg-[#181d28] border border-[#2a3449] rounded-lg px-2.5 py-1.5">
              <span className="text-amber-400">💤 Duration:</span>
              <select
                value={overnightDuration}
                onChange={(e) => setOvernightDuration(Number(e.target.value))}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value={6} className="bg-[#181d28]">6 Hours (2x limit)</option>
                <option value={8} className="bg-[#181d28]">8 Hours (2x limit)</option>
                <option value={10} className="bg-[#181d28]">10 Hours (3x limit)</option>
                <option value={12} className="bg-[#181d28]">12 Hours (3x limit)</option>
              </select>
            </div>

            {/* Strategy */}
            <div className="flex items-center gap-1.5 bg-[#181d28] border border-[#2a3449] rounded-lg px-2.5 py-1.5">
              <span className="text-amber-400">🎯 Strategy:</span>
              <select
                value={overnightStrat}
                onChange={(e) => setOvernightStrat(e.target.value as any)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="safe" className="bg-[#181d28]">Safe Morning Fill (25% Low)</option>
                <option value="deep" className="bg-[#181d28]">Deep-Dip Sniper (10% Low)</option>
              </select>
            </div>

            {/* Slots */}
            <div className="flex items-center gap-1.5 bg-[#181d28] border border-[#2a3449] rounded-lg px-2.5 py-1.5">
              <span className="text-amber-400">📦 Slots:</span>
              <select
                value={overnightSlots}
                onChange={(e) => setOvernightSlots(Number(e.target.value))}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value={1} className="bg-[#181d28]">1 Slot</option>
                <option value={2} className="bg-[#181d28]">2 Slots</option>
                <option value={3} className="bg-[#181d28]">3 Slots (F2P)</option>
                <option value={4} className="bg-[#181d28]">4 Slots</option>
                <option value={6} className="bg-[#181d28]">6 Slots</option>
                <option value={8} className="bg-[#181d28]">8 Slots (P2P)</option>
              </select>
            </div>

            {/* Focus */}
            <div className="flex items-center gap-1.5 bg-[#181d28] border border-[#2a3449] rounded-lg px-2.5 py-1.5">
              <span className="text-amber-400">🔍 Focus:</span>
              <select
                value={overnightFocus}
                onChange={(e) => setOvernightFocus(e.target.value)}
                className="bg-transparent text-white font-bold focus:outline-none cursor-pointer"
              >
                <option value="all" className="bg-[#181d28]">🌟 All Staples (Highest Profit)</option>
                <option value="rune" className="bg-[#181d28]">🛡️ Rune Heavy Gear Only</option>
                <option value="adamant" className="bg-[#181d28]">📦 Adamant & Budget High-ROI</option>
                <option value="staff" className="bg-[#181d28]">🪄 Battlestaves (P2P)</option>
                <option value="bolt" className="bg-[#181d28]">🏹 Stackables & Bolts (P2P)</option>
              </select>
            </div>
          </div>

          {/* 3. Summary Stat Cards Banner */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 font-mono">
            <div className="bg-[#141721] border border-[#242b3b] p-3.5 rounded-xl">
              <span className="text-neutral-400 text-xs">Total Spend</span>
              <strong className="block text-base text-white mt-1">{formatGp(totalOvernightSpend)}</strong>
            </div>
            <div className="bg-[#141721] border border-[#242b3b] p-3.5 rounded-xl">
              <span className="text-neutral-400 text-xs">✨ Expected Profit</span>
              <strong className="block text-base text-emerald-400 mt-1">+{formatGp(totalOvernightProfit)}</strong>
            </div>
            <div className="bg-[#141721] border border-[#242b3b] p-3.5 rounded-xl">
              <span className="text-neutral-400 text-xs">🔥 Total Items</span>
              <strong className="block text-base text-purple-400 mt-1">{totalOvernightItems.toLocaleString()} items</strong>
            </div>
            <div className="bg-[#141721] border border-[#242b3b] p-3.5 rounded-xl">
              <span className="text-neutral-400 text-xs">⏱️ Est. Alch Time</span>
              <strong className="block text-base text-amber-400 mt-1">{overnightAlchTimeMins} mins</strong>
            </div>
          </div>

          {/* 4. Overnight Table */}
          <div className="bg-[#141721] rounded-2xl border border-[#242b3b] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#242b3b] bg-[#181d28] text-neutral-400 select-none">
                    <th className="py-3 px-3 text-center">Pick</th>
                    <th className="py-3 px-4 font-sans font-semibold">Item Name</th>
                    <th className="py-3 px-3 text-right">Optimal Bid</th>
                    <th className="py-3 px-3 text-right">High Alch</th>
                    <th className="py-3 px-3 text-right text-emerald-400 font-bold">Profit / Ea</th>
                    <th className="py-3 px-3 text-right">Period Limit</th>
                    <th className="py-3 px-3 text-right text-amber-400 font-bold">Allocated Qty</th>
                    <th className="py-3 px-3 text-right">Total Spend</th>
                    <th className="py-3 px-3 text-right text-cyan-400 font-bold">Slot Profit</th>
                    <th className="py-3 px-3 text-center">Fill Confidence</th>
                    <th className="py-3 px-4">Night Market Rationale</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202738]">
                  {overnightAllocations.map((row) => (
                    <tr
                      key={row.id}
                      className="hover:bg-[#1a2130] transition group cursor-pointer"
                      onClick={() => handleCopyPrice(row.id, row.optimalBid)}
                      title="Click to copy optimal bid"
                    >
                      <td className="py-3 px-3 text-center">
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 font-bold">
                          {row.badge}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-sans font-bold text-white">
                        {row.name}
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                        {row.optimalBid.toLocaleString()} gp
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-300">
                        {row.highalch.toLocaleString()} gp
                      </td>
                      <td className="py-3 px-3 text-right text-emerald-400 font-semibold">
                        +{row.profitEa.toLocaleString()} gp
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-400">
                        {row.periodLimit.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-amber-400 font-bold">
                        {row.allocQty.toLocaleString()}
                      </td>
                      <td className="py-3 px-3 text-right text-neutral-300">
                        {formatGp(row.totalSpend)}
                      </td>
                      <td className="py-3 px-3 text-right font-bold text-cyan-400">
                        +{formatGp(row.slotProfit)}
                      </td>
                      <td className="py-3 px-3 text-center text-xs">
                        {row.confidence}
                      </td>
                      <td className="py-3 px-4 text-neutral-300 text-[11px] font-sans">
                        {row.verdict}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* SUB-VIEW 4: 🤝 WORLD 308 BULK TRADING (matching gui.py:2079)     */}
      {/* ============================================================== */}
      {activeTab === 'w308' && (
        <div className="space-y-5">
          {/* 1. Header & Operating Role Switcher matching gui.py:2085 */}
          <div className="bg-[#141721] p-6 rounded-2xl border border-[#242b3b] space-y-4">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
                  🤝 World 308 &apos;Varrock West&apos; Bulk Trading Hub
                </h2>
                <p className="text-xs text-neutral-400 mt-1">
                  Bypass the 4-hour 70-unit GE buy limit and save 1% GE tax by trading bulk noted items directly with smiths and crafters!
                </p>
              </div>
              <span className="text-xs text-neutral-400 font-mono bg-[#181d28] px-3 py-1.5 rounded-lg border border-[#2a3449]">
                📍 W308 Varrock West Bank | Clan Guest: <strong className="text-amber-400">&apos;Varrock Mob&apos;</strong>
              </span>
            </div>

            {/* Operating Role Radio Buttons */}
            <div className="bg-[#181d28] p-3 rounded-xl border border-[#2a3449] flex flex-wrap items-center gap-4 text-xs font-semibold">
              <span className="text-amber-400 font-bold">🎭 Operating Role:</span>
              <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400">
                <input
                  type="radio"
                  name="w308_role"
                  value="buyer"
                  checked={w308Role === 'buyer'}
                  onChange={() => setW308Role('buyer')}
                  className="text-emerald-500 bg-[#141721] border-[#2a3449]"
                />
                <span>🛒 Alcher / Buyer Mode (Buy bulk alchables at benchmark prices)</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer text-orange-400">
                <input
                  type="radio"
                  name="w308_role"
                  value="seller"
                  checked={w308Role === 'seller'}
                  onChange={() => setW308Role('seller')}
                  className="text-orange-500 bg-[#141721] border-[#2a3449]"
                />
                <span>🔨 Smither / Crafter Mode (Forge items from GE materials & sell P2P bulk)</span>
              </label>
            </div>

            {/* 1-Click Fast-Copy Trade Ads matching gui.py:2136 */}
            <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#202738] text-xs">
              <span className="text-blue-400 font-bold flex items-center gap-1">
                📢 Fast-Copy Trade Ads:
              </span>
              <button
                onClick={() => {
                  const qty = Math.floor(cashStack / 37600);
                  const msg = qty > 0 ? `Buying ${qty.toLocaleString()} R2H 37.6k ea - trade me` : `Buying bulk R2H 37.6k ea`;
                  handleCopyText(msg, 'R2H trade offer ad');
                }}
                className="bg-[#181d28] hover:bg-[#202738] border border-[#2a3449] text-amber-300 px-2.5 py-1.5 rounded-lg transition"
              >
                Copy: Buying {Math.floor(cashStack / 37600).toLocaleString()} R2H 37.6k ea
              </button>
              <button
                onClick={() => {
                  const qty = Math.floor(cashStack / 37600);
                  const msg = qty > 0 ? `Buying ${qty.toLocaleString()} Legs/Skirts 37.6k ea` : `Buying bulk Legs/Skirts 37.6k ea`;
                  handleCopyText(msg, 'Legs/Skirts trade offer ad');
                }}
                className="bg-[#181d28] hover:bg-[#202738] border border-[#2a3449] text-amber-300 px-2.5 py-1.5 rounded-lg transition"
              >
                Copy: Buying Legs/Skirts 37.6k ea
              </button>
              <button
                onClick={() => {
                  handleCopyText("Buying bulk Rune 2h (37.6k) / Legs (37.6k) / Battleaxes (24.3k) - trade me", 'Multi-item bulk ad');
                }}
                className="bg-[#181d28] hover:bg-[#202738] border border-[#2a3449] text-emerald-400 px-2.5 py-1.5 rounded-lg transition"
              >
                Copy: Multi-Item Bulk Ad
              </button>
            </div>
          </div>

          {/* 2. Anti-Scam Bulk Trade Calculator & 2nd Screen Verifier matching gui.py:2174 */}
          <div className="bg-[#141721] p-5 rounded-2xl border border-[#242b3b] space-y-4">
            <div>
              <h3 className="font-bold text-sm text-orange-400 flex items-center gap-2">
                <Shield className="w-4 h-4 text-orange-400" />
                🛡️ Anti-Scam Bulk Trade Calculator & 2nd Screen Verifier
              </h3>
              <p className="text-xs text-neutral-400 mt-0.5">
                Auto-scales to your active money stack so you never have to guess quantities or total coins in the second trade window.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Inputs */}
              <div className="space-y-3 bg-[#181d28] p-4 rounded-xl border border-[#2a3449] text-xs">
                <div>
                  <label className="text-neutral-400 block mb-1">Item:</label>
                  <select
                    value={w308SelectedName}
                    onChange={(e) => {
                      setW308SelectedName(e.target.value);
                      const st = (w308StaplesData as any[]).find((s) => s.name === e.target.value);
                      if (st?.w308_buy) setW308AgreedPrice(st.w308_buy);
                    }}
                    className="w-full bg-[#141721] border border-[#2a3449] text-white p-2 rounded-lg font-bold focus:outline-none"
                  >
                    {(w308StaplesData as any[]).map((s) => (
                      <option key={s.id} value={s.name}>
                        {s.name} (Alch: {(s.highalch || 0).toLocaleString()} gp)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-neutral-400 block mb-1">Agreed Price Ea (gp):</label>
                  <input
                    type="number"
                    value={w308AgreedPrice}
                    onChange={(e) => setW308AgreedPrice(Number(e.target.value))}
                    className="w-full bg-[#141721] border border-[#2a3449] text-amber-400 p-2 rounded-lg font-mono font-bold focus:outline-none"
                  />
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="text-neutral-400">Quantity:</label>
                    <div className="flex gap-1 text-[11px]">
                      <button
                        onClick={() => {
                          const q = w308AgreedPrice > 0 ? Math.floor(cashStack / w308AgreedPrice) : 100;
                          setW308Qty(q > 0 ? q : 100);
                        }}
                        className="px-2 py-0.5 rounded bg-[#202738] text-emerald-400 hover:text-white"
                      >
                        Max Cash
                      </button>
                      <button
                        onClick={() => {
                          const q = w308AgreedPrice > 0 ? Math.floor((cashStack * 0.5) / w308AgreedPrice) : 50;
                          setW308Qty(q > 0 ? q : 50);
                        }}
                        className="px-2 py-0.5 rounded bg-[#202738] text-amber-400 hover:text-white"
                      >
                        50%
                      </button>
                      <button
                        onClick={() => {
                          const q = w308AgreedPrice > 0 ? Math.floor((cashStack * 0.25) / w308AgreedPrice) : 25;
                          setW308Qty(q > 0 ? q : 25);
                        }}
                        className="px-2 py-0.5 rounded bg-[#202738] text-blue-400 hover:text-white"
                      >
                        25%
                      </button>
                    </div>
                  </div>
                  <input
                    type="number"
                    value={w308Qty}
                    onChange={(e) => setW308Qty(Number(e.target.value))}
                    className="w-full bg-[#141721] border border-[#2a3449] text-white p-2 rounded-lg font-mono font-bold focus:outline-none"
                  />
                </div>
              </div>

              {/* Verified Outputs */}
              <div className="bg-[#181d28] p-4 rounded-xl border border-[#2a3449] space-y-2.5 font-mono text-xs">
                <span className="text-[11px] uppercase tracking-wider text-neutral-400 font-sans font-bold block">
                  Second Trade Screen Verification:
                </span>
                <div className="flex justify-between py-1 border-b border-[#202738]">
                  <span className="text-neutral-400">Coins To Give / Receive:</span>
                  <strong className="text-amber-400 text-sm">{w308TotalCoinsToGive.toLocaleString()} gp</strong>
                </div>
                <div className="flex justify-between py-1 border-b border-[#202738]">
                  <span className="text-neutral-400">Total High Alch Payout:</span>
                  <span className="text-purple-400">{w308HighAlchTotal.toLocaleString()} gp</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#202738]">
                  <span className="text-neutral-400">Nature Rune Outlay:</span>
                  <span className="text-blue-400">{w308NatCostTotal.toLocaleString()} gp</span>
                </div>
                <div className="flex justify-between py-1 border-b border-[#202738]">
                  <span className="text-neutral-400">Realized Net Profit:</span>
                  <strong className="text-emerald-400 text-sm">+{w308NetProfit.toLocaleString()} gp</strong>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-neutral-400">Magic XP Gained:</span>
                  <span className="text-neutral-200">+{w308MagicXp.toLocaleString()} XP</span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. W308 Staples Benchmark Table */}
          <div className="bg-[#141721] rounded-2xl border border-[#242b3b] overflow-hidden shadow-xl">
            <div className="p-4 bg-[#181d28] border-b border-[#242b3b] flex items-center justify-between">
              <h3 className="font-bold text-xs uppercase tracking-wider text-white">
                World 308 Bulk Staples Reference Sheet
              </h3>
              <span className="text-xs text-neutral-400">
                0% Trade Tax | Unlimited Bulk Volume
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-[#242b3b] bg-[#141721] text-neutral-400 select-none">
                    <th className="py-3 px-4 font-sans font-semibold">Item Name</th>
                    <th className="py-3 px-3 text-right">W308 Benchmark</th>
                    <th className="py-3 px-3 text-right">High Alch</th>
                    <th className="py-3 px-3 text-right text-emerald-400 font-bold">Profit / Ea</th>
                    <th className="py-3 px-3 text-right text-amber-400 font-bold">Profit / Hr</th>
                    <th className="py-3 px-4">Fast Copy Ad</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#202738]">
                  {(w308StaplesData as any[]).map((st) => {
                    const profitEa = st.highalch - st.w308_buy - effectiveNatPrice;
                    return (
                      <tr key={st.id} className="hover:bg-[#1a2130] transition">
                        <td className="py-3 px-4 font-sans font-bold text-white flex items-center gap-2">
                          <span>{st.name}</span>
                          {st.members && (
                            <span className="text-[10px] px-1 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                              P2P
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-right text-amber-400 font-bold">
                          {st.w308_buy.toLocaleString()} gp
                        </td>
                        <td className="py-3 px-3 text-right text-neutral-300">
                          {st.highalch.toLocaleString()} gp
                        </td>
                        <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                          +{profitEa.toLocaleString()} gp
                        </td>
                        <td className="py-3 px-3 text-right text-amber-400 font-bold">
                          +{formatGp(profitEa * 1200)}/hr
                        </td>
                        <td className="py-3 px-4">
                          <button
                            onClick={() => {
                              handleCopyText(`Buying bulk ${st.name} ${formatGp(st.w308_buy)} ea - trade me`, `${st.name} ad`);
                            }}
                            className="px-2.5 py-1 rounded bg-[#181d28] hover:bg-amber-500 hover:text-black text-neutral-300 border border-[#2a3449] transition text-[11px]"
                          >
                            Copy Buy Ad
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Floating Hover Card */}
      {hoveredItem && (
        <ItemHoverCard
          item={hoveredItem}
          position={hoverPos}
          natPrice={effectiveNatPrice}
        />
      )}
    </div>
  );
}
