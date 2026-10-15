'use client';

import React, { useState, useMemo } from 'react';
import Image from 'next/image';
import { 
  Hammer, 
  Sparkles, 
  Copy, 
  Check, 
  ChevronDown, 
  ChevronRight, 
  Plus, 
  Minus, 
  Search,
  ShoppingCart,
  Tag,
  FileText,
  Sliders
} from 'lucide-react';
import { useAlchMate } from '../../context/AlchMateContext';
import craftingRecipesData from '../../data/crafting_recipes.json';
import geRecipesData from '../../data/ge_recipes.json';
import skillingGuidesData from '../../data/skilling_guides.json';
import smithingChainsData from '../../data/smithing_chains.json';

// Inviolable OSRS Rule: Grand Exchange Tax is strictly 1% (capped at 5,000,000 gp, 0% for < 100 gp)
function calcGeTax(grossPrice: number): number {
  if (grossPrice < 100) return 0;
  return Math.min(5000000, Math.floor(grossPrice * 0.01));
}

function calcNetSell(grossPrice: number): number {
  return grossPrice - calcGeTax(grossPrice);
}

function formatGp(val: number): string {
  if (!val || val === 0) return '0 gp';
  if (Math.abs(val) >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
  if (Math.abs(val) >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (Math.abs(val) >= 1_000) return `${(val / 1_000).toFixed(1)}k`;
  return `${val.toLocaleString()} gp`;
}

// OSRS XP Table for Level 1 to 99
const XP_TABLE = [
  0, 0, 83, 174, 276, 388, 512, 650, 801, 969, 1154, 1358, 1584, 1833, 2107, 2411, 2746, 3115, 3523, 3973,
  4470, 5018, 5624, 6291, 7028, 7842, 8740, 9730, 10824, 12031, 13363, 14833, 16456, 18247, 20224, 22406,
  24815, 27473, 30408, 33648, 37224, 41171, 45529, 50339, 55649, 61512, 67983, 75127, 83014, 91721,
  101333, 111945, 123660, 136594, 150872, 166636, 184040, 203254, 224466, 247886, 273742, 302288, 333804, 368599,
  407015, 449428, 496254, 547953, 605032, 668051, 737627, 814445, 899257, 992895, 1096278, 1210421, 1336443, 1475581,
  1629200, 1798808, 1986068, 2192818, 2421087, 2673114, 2951373, 3258594, 3597792, 3972294, 4385776, 4842295,
  5346332, 5902831, 6517253, 7195629, 7944614, 8771558, 9684577, 10692629, 11805606, 13034431
];

function getXpForLevel(lvl: number): number {
  if (lvl <= 1) return 0;
  if (lvl >= 99) return XP_TABLE[99];
  return XP_TABLE[lvl] || 0;
}

export default function CraftingPage() {
  const { priceData, effectiveNatPrice, copyBankTags, showToast } = useAlchMate();

  // Sub-view Pills: Craft & Alch vs Craft & Sell GE vs Level Training Guide
  const [subView, setSubView] = useState<'craft_alch' | 'craft_ge' | 'guide'>('craft_alch');

  // Universal Player Levels State
  const [playerLevels, setPlayerLevels] = useState<{ [skill: string]: number }>({
    Crafting: 99,
    Smithing: 99,
    Fletching: 99,
    Magic: 99,
  });

  const [copiedText, setCopiedText] = useState<string | null>(null);
  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedText(text);
    showToast(`Copied ${label}: ${text}`);
    setTimeout(() => setCopiedText(null), 2000);
  };

  // -------------------------------------------------------------
  // SUB-VIEW 1: CRAFT & ALCH STATE & LOGIC
  // -------------------------------------------------------------
  const [craftAlchSearch, setCraftAlchSearch] = useState('');
  const [onlyUsableAlch, setOnlyUsableAlch] = useState(false);
  const [filterCraftingSkill, setFilterCraftingSkill] = useState(true);
  const [filterSmithingSkill, setFilterSmithingSkill] = useState(true);
  const [filterFletchingSkill, setFilterFletchingSkill] = useState(true);
  const [filterMagicSkill, setFilterMagicSkill] = useState(true);
  const [expandedAlchRows, setExpandedAlchRows] = useState<{ [id: string]: boolean }>({});

  const toggleAlchRow = (id: string) => {
    setExpandedAlchRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const computedCraftAlchRows = useMemo(() => {
    const latest = priceData?.latest || {};
    const alchMap = priceData?.alch_map || {};

    const rows: any[] = [];
    for (const r of craftingRecipesData as any[]) {
      const skill = r.skill;
      if (skill === 'Crafting' && !filterCraftingSkill) continue;
      if (skill === 'Smithing' && !filterSmithingSkill) continue;
      if (skill === 'Fletching' && !filterFletchingSkill) continue;
      if (skill === 'Magic' && !filterMagicSkill) continue;

      const userLvl = playerLevels[skill] ?? 99;
      const canMake = userLvl >= r.level;
      if (onlyUsableAlch && !canMake) continue;

      if (craftAlchSearch.trim()) {
        const q = craftAlchSearch.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchMat = r.materials.some((m: any) => m.name.toLowerCase().includes(q));
        const matchSkill = skill.toLowerCase().includes(q);
        if (!matchName && !matchMat && !matchSkill) continue;
      }

      // Material costs
      let matCost = 0;
      let valid = true;
      const matBreakdown: any[] = [];
      for (const m of r.materials) {
        const p = latest[String(m.id)]?.high || latest[String(m.id)]?.low || 0;
        if (!p || p <= 0) {
          valid = false;
          break;
        }
        const sub = p * m.qty;
        matCost += sub;
        matBreakdown.push({
          id: m.id,
          name: m.name,
          qty: m.qty,
          price_ea: p,
          subtotal: sub,
        });
      }
      if (!valid) continue;

      const alchVal = alchMap[String(r.output_id)] || (latest[String(r.output_id)] as any)?.highalch || 0;
      if (alchVal <= 0) continue;

      const totalCost = matCost + effectiveNatPrice;
      const profitEa = alchVal - totalCost;

      // Finished item buy price on GE
      const finishedBuy = latest[String(r.output_id)]?.high || latest[String(r.output_id)]?.low || 0;
      const directAlchProfit = finishedBuy > 0 ? alchVal - (finishedBuy + effectiveNatPrice) : 0;
      const bonusVsBuy = profitEa - directAlchProfit;
      const hrProfit = profitEa * 1200; // standard 1,200 alchs/hr

      rows.push({
        id: `craft_${r.name}_${r.output_id}`,
        name: r.name,
        output_id: r.output_id,
        skill: r.skill,
        level: r.level,
        xp: r.xp,
        canMake,
        matCost,
        alchVal,
        profitEa,
        bonusVsBuy,
        hrProfit,
        materials: matBreakdown,
        natCost: effectiveNatPrice,
      });
    }

    return rows.sort((a, b) => b.profitEa - a.profitEa);
  }, [
    priceData,
    effectiveNatPrice,
    playerLevels,
    onlyUsableAlch,
    craftAlchSearch,
    filterCraftingSkill,
    filterSmithingSkill,
    filterFletchingSkill,
    filterMagicSkill,
  ]);

  // -------------------------------------------------------------
  // SUB-VIEW 2: CRAFT & SELL GE STATE & LOGIC
  // -------------------------------------------------------------
  const [geSkillFilter, setGeSkillFilter] = useState<string>('All');
  const [geSellStrat, setGeSellStrat] = useState<'ask' | 'bid'>('ask');
  const [geTargetMargin, setGeTargetMargin] = useState<number>(0);
  const [geOnlyUsable, setGeOnlyUsable] = useState(false);
  const [geMinProfit, setGeMinProfit] = useState<number>(0);
  const [geSearch, setGeSearch] = useState('');
  const [expandedGeRows, setExpandedGeRows] = useState<{ [id: string]: boolean }>({});

  const toggleGeRow = (id: string) => {
    setExpandedGeRows((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const expandAllGe = () => {
    const all: { [id: string]: boolean } = {};
    for (const r of geRecipesData as any[]) {
      all[`ge_${r.name}_${r.output_id}`] = true;
    }
    setExpandedGeRows(all);
  };

  const collapseAllGe = () => {
    setExpandedGeRows({});
  };

  const computedCraftGeRows = useMemo(() => {
    const latest = priceData?.latest || {};
    const volumes5m = priceData?.volumes_5m || {};

    const rows: any[] = [];
    for (const r of geRecipesData as any[]) {
      const skill = r.skill;
      if (geSkillFilter !== 'All' && skill.toLowerCase() !== geSkillFilter.toLowerCase()) continue;

      const userLvl = playerLevels[skill] ?? 99;
      const canMake = userLvl >= r.level;
      if (geOnlyUsable && !canMake) continue;

      if (geSearch.trim()) {
        const q = geSearch.toLowerCase();
        const matchName = r.name.toLowerCase().includes(q);
        const matchMat = r.materials.some((m: any) => m.name.toLowerCase().includes(q));
        const matchSkill = skill.toLowerCase().includes(q);
        if (!matchName && !matchMat && !matchSkill) continue;
      }

      // Material costs (Bid vs Ask)
      let bidTotal = 0;
      let askTotal = 0;
      let valid = true;
      const matInfoList: any[] = [];

      for (const m of r.materials) {
        const idStr = String(m.id);
        const pObj = latest[idStr];
        if (!pObj) {
          valid = false;
          break;
        }
        const mBid = pObj.low || pObj.high || 0;
        const mAsk = pObj.high || pObj.low || 0;
        if (mBid <= 0 && mAsk <= 0) {
          valid = false;
          break;
        }

        const q = m.qty;
        bidTotal += mBid * q;
        askTotal += mAsk * q;

        matInfoList.push({
          id: m.id,
          name: m.name,
          qty: q,
          bid: mBid,
          ask: mAsk,
        });
      }
      if (!valid) continue;

      // Output Finished Item
      const outIdStr = String(r.output_id);
      const outObj = latest[outIdStr];
      if (!outObj) continue;

      const outBid = outObj.low || outObj.high || 0;
      const outAsk = outObj.high || outObj.low || 0;
      const grossSellEa = geSellStrat === 'ask' ? outAsk : outBid;
      if (grossSellEa <= 0) continue;

      const netSellEa = calcNetSell(grossSellEa);
      const outputQty = r.output_qty || 1;
      const netRevenue = netSellEa * outputQty;

      // Standard material cost chosen based on patient sell strat
      const stratMatTotal = geSellStrat === 'ask' ? bidTotal : askTotal;
      const profitEa = netRevenue - stratMatTotal;
      if (geMinProfit > 0 && profitEa < geMinProfit) continue;

      const roiPct = stratMatTotal > 0 ? (profitEa / stratMatTotal) * 100 : 0;
      const actionsHr = r.hourly_actions || 1500;
      const profitHr = profitEa * actionsHr;
      const xpHr = Math.round((r.xp || 0) * actionsHr);

      // 4h Batch limits (approximate standard production batch)
      const batchLimit = 500;
      const batchProfit = profitEa * batchLimit;

      // Best Buy Ceilings for each material
      const childMats = matInfoList.map((m, idx) => {
        const otherCost = matInfoList
          .filter((_, i) => i !== idx)
          .reduce((sum, other) => sum + other.bid * other.qty, 0);
        const netAlloc = netRevenue - otherCost;
        const bePrice = m.qty > 0 ? Math.floor(netAlloc / m.qty) : 0;
        const targetPrice = m.qty > 0 ? Math.floor((netAlloc - geTargetMargin) / m.qty) : 0;

        return {
          ...m,
          bestBuy: targetPrice > 0 ? targetPrice : bePrice,
          breakeven: bePrice,
        };
      });

      // Volume velocity badge
      const v5 = volumes5m[outIdStr];
      const vol5m = (v5?.highPriceVolume || 0) + (v5?.lowPriceVolume || 0);
      const speedBadge = vol5m >= 15 ? '⚡ Fast' : vol5m >= 3 ? '⏱️ Steady' : '🐢 Slow';

      rows.push({
        id: `ge_${r.name}_${r.output_id}`,
        name: r.name,
        output_id: r.output_id,
        skill: r.skill,
        level: r.level,
        xp: r.xp,
        canMake,
        bidMatCost: bidTotal,
        askMatCost: askTotal,
        grossSell: grossSellEa,
        netSell: netSellEa,
        profitEa,
        roiPct,
        batchLimit,
        batchProfit,
        profitHr,
        xpHr,
        speedBadge,
        materials: childMats,
      });
    }

    return rows.sort((a, b) => b.profitHr - a.profitHr);
  }, [
    priceData,
    playerLevels,
    geSkillFilter,
    geSellStrat,
    geTargetMargin,
    geOnlyUsable,
    geMinProfit,
    geSearch,
  ]);

  // -------------------------------------------------------------
  // SUB-VIEW 3: LEVEL TRAINING GUIDE STATE & LOGIC
  // -------------------------------------------------------------
  const [guideSkill, setGuideSkill] = useState<string>('Smithing');
  const [guideCurLvl, setGuideCurLvl] = useState<number>(55);
  const [guideGoalLvl, setGuideGoalLvl] = useState<number>(99);
  const [guideStyle, setGuideStyle] = useState<'all' | 'profit' | 'fast' | 'afk'>('all');
  const [guideMembers, setGuideMembers] = useState<boolean>(true);
  const [guideView, setGuideView] = useState<'progression' | 'chains'>('progression');
  const [showInspector, setShowInspector] = useState(false);

  // Sale Price Inspector Form
  const [inspectorItemName, setInspectorItemName] = useState('Rune 2h sword');
  const [inspectorCustomSell, setInspectorCustomSell] = useState<number>(38200);
  const [inspectorMatCost, setInspectorMatCost] = useState<number>(37200);
  const [inspectorIsW308, setInspectorIsW308] = useState<boolean>(true);

  const guideData = useMemo(() => {
    return (skillingGuidesData as any)[guideSkill] || null;
  }, [guideSkill]);

  const curXp = getXpForLevel(guideCurLvl);
  const goalXp = getXpForLevel(guideGoalLvl);
  const remainingXp = Math.max(0, goalXp - curXp);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header & Sub-View Pills Bar */}
      <div className="bg-[#141721] p-5 rounded-2xl border border-[#242b3b] space-y-4 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                <Hammer className="w-5 h-5" />
              </span>
              <h1 className="text-2xl font-black text-white">Production Workshop &amp; Skilling Suite</h1>
            </div>
            <p className="text-xs text-neutral-400 mt-1">
              Exact 1% Grand Exchange tax calculation, hierarchical raw ingredient trees, and 1–99 level progression.
            </p>
          </div>

          {/* 3 Main Desktop Sub-View Switchers */}
          <div className="flex flex-wrap items-center gap-1.5 bg-[#191e29] p-1.5 rounded-xl border border-[#2a3449] text-xs font-semibold">
            <button
              onClick={() => setSubView('craft_alch')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                subView === 'craft_alch' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <span>🔨</span>
              <span>Craft &amp; Alch</span>
            </button>
            <button
              onClick={() => setSubView('craft_ge')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                subView === 'craft_ge' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <span>💰</span>
              <span>Craft &amp; Sell GE</span>
            </button>
            <button
              onClick={() => setSubView('guide')}
              className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
                subView === 'guide' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
              }`}
            >
              <span>🎓</span>
              <span>Level Training Guide</span>
            </button>
          </div>
        </div>

        {/* Global Level Config Strip */}
        <div className="flex flex-wrap items-center gap-4 pt-2 border-t border-[#202636] text-xs text-neutral-300">
          <span className="text-neutral-400 font-bold">Your In-Game Levels:</span>
          {['Crafting', 'Smithing', 'Fletching', 'Magic'].map((sk) => (
            <div key={sk} className="flex items-center gap-1.5 bg-[#181d28] px-2.5 py-1 rounded-lg border border-[#2a3449]">
              <span className="font-semibold text-neutral-300">{sk}:</span>
              <input
                type="number"
                min="1"
                max="99"
                value={playerLevels[sk] ?? 99}
                onChange={(e) => {
                  const val = Math.min(99, Math.max(1, Number(e.target.value) || 1));
                  setPlayerLevels((prev) => ({ ...prev, [sk]: val }));
                }}
                className="w-10 bg-transparent text-center font-bold text-amber-400 focus:outline-none"
              />
            </div>
          ))}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SUB-VIEW 1: CRAFT & ALCH                                                  */}
      {/* ========================================================================= */}
      {subView === 'craft_alch' && (
        <div className="space-y-4">
          {/* Controls Strip */}
          <div className="bg-[#141721] p-4 rounded-xl border border-[#242b3b] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5 bg-[#181d28] px-3 py-1.5 rounded-lg border border-[#2a3449]">
                <Search className="w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={craftAlchSearch}
                  onChange={(e) => setCraftAlchSearch(e.target.value)}
                  placeholder="Search recipe or material..."
                  className="bg-transparent text-white focus:outline-none w-48 font-sans"
                />
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 font-semibold">
                <input
                  type="checkbox"
                  checked={onlyUsableAlch}
                  onChange={(e) => setOnlyUsableAlch(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Only Show Usable Recipes</span>
              </label>
            </div>

            {/* Category Toggles */}
            <div className="flex items-center gap-2">
              <span className="text-neutral-400 font-semibold">Categories:</span>
              <button
                onClick={() => setFilterCraftingSkill(!filterCraftingSkill)}
                className={`px-2.5 py-1 rounded border text-xs font-bold transition ${filterCraftingSkill ? 'bg-orange-500/20 text-orange-400 border-orange-500/40' : 'bg-[#181d28] text-neutral-500 border-[#2a3449]'}`}
              >
                🔨 Crafting
              </button>
              <button
                onClick={() => setFilterSmithingSkill(!filterSmithingSkill)}
                className={`px-2.5 py-1 rounded border text-xs font-bold transition ${filterSmithingSkill ? 'bg-neutral-400/20 text-neutral-200 border-neutral-400/40' : 'bg-[#181d28] text-neutral-500 border-[#2a3449]'}`}
              >
                ⚒️ Smithing
              </button>
              <button
                onClick={() => setFilterFletchingSkill(!filterFletchingSkill)}
                className={`px-2.5 py-1 rounded border text-xs font-bold transition ${filterFletchingSkill ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40' : 'bg-[#181d28] text-neutral-500 border-[#2a3449]'}`}
              >
                🏹 Fletching
              </button>
              <button
                onClick={() => setFilterMagicSkill(!filterMagicSkill)}
                className={`px-2.5 py-1 rounded border text-xs font-bold transition ${filterMagicSkill ? 'bg-purple-500/20 text-purple-400 border-purple-500/40' : 'bg-[#181d28] text-neutral-500 border-[#2a3449]'}`}
              >
                ✨ Magic
              </button>
            </div>
          </div>

          {/* Craft & Alch Treeview Table */}
          <div className="bg-[#141721] rounded-2xl border border-[#242b3b] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#10131b] text-neutral-400 uppercase text-[11px] font-bold border-b border-[#242b3b]">
                  <tr>
                    <th className="px-4 py-3 font-sans">Recipe / Ingredient Breakdown</th>
                    <th className="px-3 py-3 text-center font-sans">Skill &amp; Req</th>
                    <th className="px-3 py-3 text-right">Materials Cost</th>
                    <th className="px-3 py-3 text-right">Alch Value</th>
                    <th className="px-3 py-3 text-right">Profit (Craft + Alch)</th>
                    <th className="px-3 py-3 text-right">Bonus vs Buy</th>
                    <th className="px-3 py-3 text-center">XP / Item</th>
                    <th className="px-3 py-3 text-right">Est GP / Hr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c2230]">
                  {computedCraftAlchRows.map((r) => {
                    const isExpanded = !!expandedAlchRows[r.id];
                    return (
                      <React.Fragment key={r.id}>
                        {/* Parent Recipe Row */}
                        <tr className="hover:bg-[#181d29]/60 transition-colors">
                          <td className="px-4 py-3 font-sans font-bold text-white flex items-center gap-2">
                            <button
                              onClick={() => toggleAlchRow(r.id)}
                              className="p-1 hover:text-amber-400 text-neutral-400 transition"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <img
                              src={`https://static.runelite.net/cache/item/icon/${r.output_id}.png`}
                              alt=""
                              className="w-6 h-6 object-contain shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <span
                              onClick={() => handleCopy(r.name, 'Recipe Name')}
                              className="cursor-pointer hover:underline"
                            >
                              {r.name}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.canMake ? 'bg-neutral-800 text-neutral-200' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {r.skill} {r.level} {!r.canMake && '⚠️'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-neutral-300">{r.matCost.toLocaleString()} gp</td>
                          <td className="px-3 py-3 text-right text-amber-400 font-bold">{r.alchVal.toLocaleString()} gp</td>
                          <td className={`px-3 py-3 text-right font-black ${r.profitEa >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.profitEa >= 0 ? `+${r.profitEa.toLocaleString()}` : r.profitEa.toLocaleString()} gp
                          </td>
                          <td className={`px-3 py-3 text-right font-semibold ${r.bonusVsBuy >= 0 ? 'text-cyan-300' : 'text-neutral-500'}`}>
                            {r.bonusVsBuy >= 0 ? `+${r.bonusVsBuy.toLocaleString()}` : r.bonusVsBuy.toLocaleString()}
                          </td>
                          <td className="px-3 py-3 text-center text-neutral-300 font-sans">{r.xp} XP</td>
                          <td className="px-3 py-3 text-right font-bold text-amber-400">
                            +{Math.round(r.hrProfit / 1000)}k/hr
                          </td>
                        </tr>

                        {/* Expandable Child Materials Breakdown */}
                        {isExpanded && (
                          <>
                            {r.materials.map((m: any, idx: number) => (
                              <tr key={`${r.id}_mat_${m.id}_${idx}`} className="bg-[#10131b]/80 text-neutral-400 text-xs">
                                <td className="px-4 py-2 pl-12 font-sans flex items-center gap-2">
                                  <span className="text-neutral-600">↳</span>
                                  <span
                                    onClick={() => handleCopy(m.name, 'Material Name')}
                                    className="cursor-pointer hover:underline text-neutral-300"
                                  >
                                    {m.qty}x {m.name}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-neutral-600">-</td>
                                <td className="px-3 py-2 text-right font-mono text-neutral-300">
                                  {m.price_ea.toLocaleString()} gp ea ({m.subtotal.toLocaleString()} gp)
                                </td>
                                <td className="px-3 py-2 text-right text-neutral-600">-</td>
                                <td className="px-3 py-2 text-right text-neutral-600">-</td>
                                <td className="px-3 py-2 text-right text-neutral-600">-</td>
                                <td className="px-3 py-2 text-center text-neutral-600">-</td>
                                <td className="px-3 py-2 text-right text-neutral-600">-</td>
                              </tr>
                            ))}
                            <tr className="bg-[#10131b]/80 text-neutral-400 text-xs border-b border-[#242b3b]">
                              <td className="px-4 py-2 pl-12 font-sans flex items-center gap-2 text-neutral-400">
                                <span className="text-neutral-600">↳</span>
                                <span>1x Nature rune</span>
                              </td>
                              <td className="px-3 py-2 text-center text-neutral-600">-</td>
                              <td className="px-3 py-2 text-right font-mono text-neutral-400">{r.natCost} gp</td>
                              <td className="px-3 py-2 text-right text-neutral-600">-</td>
                              <td className="px-3 py-2 text-right text-neutral-600">-</td>
                              <td className="px-3 py-2 text-right text-neutral-600">-</td>
                              <td className="px-3 py-2 text-center text-neutral-600">-</td>
                              <td className="px-3 py-2 text-right text-neutral-600">-</td>
                            </tr>
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 2: CRAFT & SELL GE                                               */}
      {/* ========================================================================= */}
      {subView === 'craft_ge' && (
        <div className="space-y-4">
          {/* Controls Strip */}
          <div className="bg-[#141721] p-4 rounded-xl border border-[#242b3b] flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-bold">Skill:</span>
                <select
                  value={geSkillFilter}
                  onChange={(e) => setGeSkillFilter(e.target.value)}
                  className="bg-[#181d28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                >
                  <option value="All">All Skills</option>
                  <option value="Herblore">🌿 Herblore</option>
                  <option value="Crafting">🔨 Crafting</option>
                  <option value="Fletching">🏹 Fletching</option>
                  <option value="Smithing">⚒️ Smithing</option>
                  <option value="Cooking">🍳 Cooking</option>
                  <option value="Magic">✨ Magic</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-bold">Sell Strat:</span>
                <select
                  value={geSellStrat}
                  onChange={(e) => setGeSellStrat(e.target.value as any)}
                  className="bg-[#181d28] border border-[#2a3449] rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                >
                  <option value="ask">patient (Ask)</option>
                  <option value="bid">instant (Bid)</option>
                </select>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="text-neutral-400 font-bold">Target Margin:</span>
                <input
                  type="number"
                  value={geTargetMargin}
                  onChange={(e) => setGeTargetMargin(Number(e.target.value) || 0)}
                  className="w-16 bg-[#181d28] border border-[#2a3449] rounded-lg px-2 py-1 text-emerald-400 font-bold focus:outline-none text-center"
                />
                <span className="text-neutral-500">gp</span>
              </div>

              <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 font-semibold">
                <input
                  type="checkbox"
                  checked={geOnlyUsable}
                  onChange={(e) => setGeOnlyUsable(e.target.checked)}
                  className="rounded accent-emerald-500"
                />
                <span>Only Usable</span>
              </label>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 bg-[#181d28] px-3 py-1 rounded-lg border border-[#2a3449]">
                <Search className="w-3.5 h-3.5 text-neutral-500" />
                <input
                  type="text"
                  value={geSearch}
                  onChange={(e) => setGeSearch(e.target.value)}
                  placeholder="Search item or recipe..."
                  className="bg-transparent text-white focus:outline-none w-36 font-sans text-xs"
                />
              </div>

              <button
                onClick={expandAllGe}
                className="px-2.5 py-1 bg-[#1e2433] hover:bg-[#283145] text-neutral-200 rounded font-bold"
              >
                [+] Expand
              </button>
              <button
                onClick={collapseAllGe}
                className="px-2.5 py-1 bg-[#1e2433] hover:bg-[#283145] text-neutral-400 rounded font-bold"
              >
                [-] Collapse
              </button>
            </div>
          </div>

          {/* 229 GE Recipes Table with Exact 1% Tax & Best Buy Ceilings */}
          <div className="bg-[#141721] rounded-2xl border border-[#242b3b] overflow-hidden shadow-lg">
            <div className="overflow-x-auto">
              <table className="w-full text-left font-mono text-xs">
                <thead className="bg-[#10131b] text-neutral-400 uppercase text-[11px] font-bold border-b border-[#242b3b]">
                  <tr>
                    <th className="px-4 py-3 font-sans">Item / Ingredients (▶ Expand)</th>
                    <th className="px-3 py-3 text-center font-sans">Skill &amp; Req</th>
                    <th className="px-3 py-3 text-right">Target Offer (Bid)</th>
                    <th className="px-3 py-3 text-right">Instant Buy (Ask)</th>
                    <th className="px-3 py-3 text-right">Target Sell Price</th>
                    <th className="px-3 py-3 text-right">Profit ea</th>
                    <th className="px-3 py-3 text-right">ROI %</th>
                    <th className="px-3 py-3 text-right">Profit / Hr</th>
                    <th className="px-3 py-3 text-center font-sans">Fill Speed</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c2230]">
                  {computedCraftGeRows.map((r) => {
                    const isExpanded = !!expandedGeRows[r.id];
                    return (
                      <React.Fragment key={r.id}>
                        {/* Parent Recipe Row */}
                        <tr className="hover:bg-[#181d29]/60 transition-colors">
                          <td className="px-4 py-3 font-sans font-bold text-white flex items-center gap-2">
                            <button
                              onClick={() => toggleGeRow(r.id)}
                              className="p-1 hover:text-amber-400 text-neutral-400 transition"
                            >
                              {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                            </button>
                            <img
                              src={`https://static.runelite.net/cache/item/icon/${r.output_id}.png`}
                              alt=""
                              className="w-6 h-6 object-contain shrink-0"
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                            <span
                              onClick={() => handleCopy(r.name, 'Item Name')}
                              className="cursor-pointer hover:underline"
                            >
                              {r.name}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-center font-sans">
                            <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${r.canMake ? 'bg-neutral-800 text-neutral-200' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                              {r.skill} {r.level} {!r.canMake && '⚠️'}
                            </span>
                          </td>
                          <td className="px-3 py-3 text-right text-neutral-300">{r.bidMatCost.toLocaleString()} gp</td>
                          <td className="px-3 py-3 text-right text-neutral-400">{r.askMatCost.toLocaleString()} gp</td>
                          <td className="px-3 py-3 text-right text-amber-400 font-bold">
                            <span
                              onClick={() => handleCopy(String(r.grossSell), 'Target Sell Price')}
                              className="cursor-pointer hover:underline"
                            >
                              {r.grossSell.toLocaleString()} gp
                            </span>
                          </td>
                          <td className={`px-3 py-3 text-right font-black ${r.profitEa >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                            {r.profitEa >= 0 ? `+${r.profitEa.toLocaleString()}` : r.profitEa.toLocaleString()} gp
                          </td>
                          <td className="px-3 py-3 text-right text-neutral-300">
                            {r.roiPct.toFixed(1)}%
                          </td>
                          <td className="px-3 py-3 text-right font-bold text-emerald-400">
                            +{Math.round(r.profitHr / 1000)}k/hr
                          </td>
                          <td className="px-3 py-3 text-center font-sans">
                            <span className="text-[10px] px-2 py-0.5 rounded font-bold bg-neutral-800 text-neutral-300">
                              {r.speedBadge}
                            </span>
                          </td>
                        </tr>

                        {/* Expandable Child Materials Breakdown with Best Buy Ceilings */}
                        {isExpanded && (
                          <>
                            {r.materials.map((m: any, idx: number) => (
                              <tr key={`${r.id}_mat_${m.id}_${idx}`} className="bg-[#10131b]/80 text-neutral-400 text-xs">
                                <td className="px-4 py-2 pl-12 font-sans flex items-center gap-2">
                                  <span className="text-neutral-600">↳</span>
                                  <span
                                    onClick={() => handleCopy(m.name, 'Material Name')}
                                    className="cursor-pointer hover:underline text-neutral-300"
                                  >
                                    {m.qty}x {m.name}
                                  </span>
                                </td>
                                <td className="px-3 py-2 text-center text-neutral-600">-</td>
                                <td className="px-3 py-2 text-right font-mono text-emerald-400">
                                  <button
                                    onClick={() => handleCopy(String(m.bid), 'Bid Price')}
                                    className="hover:underline font-bold"
                                  >
                                    {m.bid.toLocaleString()} gp
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-neutral-400">
                                  {m.ask.toLocaleString()} gp
                                </td>
                                <td className="px-3 py-2 text-right font-mono font-bold text-cyan-300">
                                  <button
                                    onClick={() => handleCopy(String(m.bestBuy), 'Best Buy Ceiling')}
                                    className="hover:underline"
                                    title="Maximum price to bid on GE to guarantee target profit"
                                  >
                                    🎯 ≤ {m.bestBuy.toLocaleString()} gp
                                  </button>
                                </td>
                                <td className="px-3 py-2 text-right font-mono text-neutral-500">
                                  ≤ {m.breakeven.toLocaleString()} be
                                </td>
                                <td className="px-3 py-2 text-right text-neutral-600">-</td>
                                <td className="px-3 py-2 text-right text-neutral-600">-</td>
                                <td className="px-3 py-2 text-center text-neutral-600">-</td>
                              </tr>
                            ))}
                          </>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-VIEW 3: LEVEL TRAINING GUIDE                                          */}
      {/* ========================================================================= */}
      {subView === 'guide' && guideData && (
        <div className="space-y-6">
          {/* Top Controls Bar */}
          <div className="bg-[#141721] p-5 rounded-2xl border border-[#242b3b] space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-4">
              {/* Skill Switchers */}
              <div className="flex items-center gap-2">
                <span className="text-neutral-400 font-bold text-xs">Skill:</span>
                {['Smithing', 'Fletching', 'Crafting', 'Magic'].map((sk) => (
                  <button
                    key={sk}
                    onClick={() => setGuideSkill(sk)}
                    className={`px-3 py-1.5 rounded-xl font-bold text-xs transition ${
                      guideSkill === sk ? 'bg-amber-500 text-black shadow' : 'bg-[#181d28] text-neutral-300 hover:text-white border border-[#2a3449]'
                    }`}
                  >
                    {sk === 'Smithing' && '⚒️ Smithing'}
                    {sk === 'Fletching' && '🏹 Fletching'}
                    {sk === 'Crafting' && '🔨 Crafting'}
                    {sk === 'Magic' && '✨ Magic'}
                  </button>
                ))}
              </div>

              {/* View Selector: Progression vs Material Chains */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setGuideView('progression')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    guideView === 'progression' ? 'bg-emerald-500 text-black' : 'bg-[#181d28] text-neutral-400 border border-[#2a3449]'
                  }`}
                >
                  📈 Level Progression (1-99)
                </button>
                <button
                  onClick={() => setGuideView('chains')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    guideView === 'chains' ? 'bg-emerald-500 text-black' : 'bg-[#181d28] text-neutral-400 border border-[#2a3449]'
                  }`}
                >
                  🌲 Material Chain Tree
                </button>
                <button
                  onClick={() => setShowInspector(!showInspector)}
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-[#181d28] border border-amber-500/40 text-amber-400 hover:bg-amber-500/10 flex items-center gap-1"
                >
                  <span>💰 Sale Price Inspector</span>
                  <span>{showInspector ? '▴' : '▾'}</span>
                </button>
              </div>
            </div>

            {/* Level Goal Inputs & XP Progress Banner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-[#10131b] p-4 rounded-xl border border-[#202636] text-xs">
              <div className="flex items-center gap-3">
                <div>
                  <span className="text-neutral-400 block font-semibold">Current Lvl:</span>
                  <input
                    type="number"
                    min="1"
                    max="98"
                    value={guideCurLvl}
                    onChange={(e) => setGuideCurLvl(Number(e.target.value) || 1)}
                    className="w-16 bg-[#181d28] border border-[#2a3449] rounded-lg px-2 py-1 text-white font-bold text-center mt-1 focus:outline-none"
                  />
                </div>
                <div>
                  <span className="text-neutral-400 block font-semibold">Goal Lvl:</span>
                  <input
                    type="number"
                    min="2"
                    max="99"
                    value={guideGoalLvl}
                    onChange={(e) => setGuideGoalLvl(Number(e.target.value) || 99)}
                    className="w-16 bg-[#181d28] border border-[#2a3449] rounded-lg px-2 py-1 text-emerald-400 font-bold text-center mt-1 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex flex-col justify-center">
                <span className="text-neutral-400">Total Remaining XP Needed:</span>
                <span className="text-lg font-bold text-amber-400 font-mono">
                  {remainingXp.toLocaleString()} XP
                </span>
              </div>

              <div className="flex items-center gap-2 justify-end">
                <button
                  onClick={() => {
                    const tagStr = `alchmate_train,${guideSkill}`;
                    copyBankTags([{ name: guideSkill }]);
                    handleCopy(tagStr, 'Training Bank Tag');
                  }}
                  className="px-3 py-2 bg-purple-600/20 hover:bg-purple-600/30 border border-purple-500/40 text-purple-300 rounded-lg font-bold text-xs flex items-center gap-1"
                >
                  <Tag className="w-3.5 h-3.5" />
                  <span>🏷️ Bank Tag</span>
                </button>
              </div>
            </div>

            {/* Sale Price Inspector Collapsible Drawer */}
            {showInspector && (
              <div className="bg-[#181d28] border border-amber-500/30 p-4 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between border-b border-[#2a3449] pb-2">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5">
                    <Sliders className="w-4 h-4" />
                    <span>Sale Price &amp; Profit Inspector (Audit Custom Deals vs Material Costs)</span>
                  </span>
                  <span className="text-neutral-500">Exact 1% Jagex GE Tax Standard</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div>
                    <label className="text-neutral-400 block mb-1">Item Name:</label>
                    <input
                      type="text"
                      value={inspectorItemName}
                      onChange={(e) => setInspectorItemName(e.target.value)}
                      className="w-full bg-[#10131b] border border-[#2a3449] rounded px-2.5 py-1.5 text-white"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Agreed Sale Price:</label>
                    <input
                      type="number"
                      value={inspectorCustomSell}
                      onChange={(e) => setInspectorCustomSell(Number(e.target.value) || 0)}
                      className="w-full bg-[#10131b] border border-[#2a3449] rounded px-2.5 py-1.5 text-amber-400 font-bold font-mono"
                    />
                  </div>
                  <div>
                    <label className="text-neutral-400 block mb-1">Live Material Outlay:</label>
                    <input
                      type="number"
                      value={inspectorMatCost}
                      onChange={(e) => setInspectorMatCost(Number(e.target.value) || 0)}
                      className="w-full bg-[#10131b] border border-[#2a3449] rounded px-2.5 py-1.5 text-white font-mono"
                    />
                  </div>
                  <div className="flex items-end">
                    <label className="flex items-center gap-1.5 text-neutral-300 cursor-pointer pb-2">
                      <input
                        type="checkbox"
                        checked={inspectorIsW308}
                        onChange={(e) => setInspectorIsW308(e.target.checked)}
                        className="rounded accent-emerald-500"
                      />
                      <span>World 308 (0% Tax)</span>
                    </label>
                  </div>
                </div>

                {/* Audit Result */}
                {(() => {
                  const tax = inspectorIsW308 ? 0 : calcGeTax(inspectorCustomSell);
                  const netRev = inspectorCustomSell - tax;
                  const profit = netRev - inspectorMatCost;
                  return (
                    <div className="bg-[#10131b] p-3 rounded-lg border border-[#202636] flex flex-wrap items-center justify-between gap-4 font-mono">
                      <div>Gross Sale: <strong>{inspectorCustomSell.toLocaleString()} gp</strong></div>
                      <div>Tax: <span className="text-red-400">-{tax.toLocaleString()} gp</span></div>
                      <div>Net Revenue: <strong className="text-neutral-200">{netRev.toLocaleString()} gp</strong></div>
                      <div className="text-sm">
                        Net Profit ea:{' '}
                        <strong className={profit >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                          {profit >= 0 ? `+${profit.toLocaleString()}` : profit.toLocaleString()} gp
                        </strong>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}
          </div>

          {/* 1-99 Progression View */}
          {guideView === 'progression' && (
            <div className="space-y-6">
              {/* Quests Skipping Grants Card */}
              {guideData.quests && guideData.quests.length > 0 && (
                <div className="bg-[#141721] p-5 rounded-2xl border border-emerald-500/20 space-y-3">
                  <h3 className="text-sm font-bold text-emerald-400 flex items-center gap-2">
                    <span>⚡</span> Quest Skips &amp; Fast-Track Milestones
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {guideData.quests.map((q: any) => (
                      <div key={q.name} className="bg-[#181d28] p-3 rounded-xl border border-[#2a3449] space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white text-xs">{q.name}</span>
                          <span className="text-[10px] text-emerald-400 font-mono">+{q.xp.toLocaleString()} XP</span>
                        </div>
                        <p className="text-[11px] text-amber-300/90 font-medium">{q.skip}</p>
                        <p className="text-[10px] text-neutral-400">{q.tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Skilling Brackets */}
              <div className="space-y-4">
                {guideData.brackets && guideData.brackets.map((br: any, idx: number) => (
                  <div key={idx} className="bg-[#141721] rounded-2xl border border-[#242b3b] overflow-hidden shadow">
                    <div className="bg-[#191e29] px-5 py-3 border-b border-[#242b3b] flex items-center justify-between">
                      <span className="font-bold text-white text-sm">
                        Level {br.range}: {br.name || 'Core Training'}
                      </span>
                      <span className="text-xs text-neutral-400">
                        Target Level: {br.range.split('-')[1]?.trim() || br.range}
                      </span>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-left font-mono text-xs">
                        <thead className="bg-[#10131b] text-neutral-400 uppercase text-[11px] font-bold border-b border-[#242b3b]">
                          <tr>
                            <th className="px-4 py-3 font-sans">Method</th>
                            <th className="px-3 py-3 text-center font-sans">Style</th>
                            <th className="px-3 py-3 text-center">XP / Item</th>
                            <th className="px-3 py-3 text-right">XP / Hr</th>
                            <th className="px-3 py-3 text-right">Actions to Complete</th>
                            <th className="px-3 py-3 text-right">Disposal &amp; Profit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1c2230]">
                          {br.methods && br.methods.map((m: any, mIdx: number) => (
                            <tr key={mIdx} className="hover:bg-[#181d29]/60 transition-colors">
                              <td className="px-4 py-3 font-sans font-bold text-white">
                                <div>{m.name}</div>
                                <span className="text-[11px] font-normal text-neutral-400 block mt-0.5">
                                  {m.description}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center font-sans">
                                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#181d28] border border-[#2a3449] text-amber-300">
                                  {m.style || 'Standard'}
                                </span>
                              </td>
                              <td className="px-3 py-3 text-center text-neutral-300">{m.xp_ea}</td>
                              <td className="px-3 py-3 text-right font-bold text-emerald-400 font-mono">
                                +{m.xp_hr?.toLocaleString() || 0}/hr
                              </td>
                              <td className="px-3 py-3 text-right font-bold text-white font-mono">
                                {m.actions_needed?.toLocaleString() || '--'}
                              </td>
                              <td className="px-3 py-3 text-right text-cyan-300 font-mono">
                                {m.disposal || 'Alch / GE'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Material Chain Tree View */}
          {guideView === 'chains' && (
            <div className="space-y-4">
              <div className="bg-[#141721] p-4 rounded-xl border border-[#242b3b]">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>🌲</span> Smithing Material Chain Tree: Ore ➔ Bar ➔ Smith ➔ Alch / Sell
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  Compares raw ore smelting margins (Regular furnace vs Blast Furnace half-coal) against finished smithing and liquidations.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(smithingChainsData as any[]).map((chain) => (
                  <div key={chain.tier} className="bg-[#141721] rounded-2xl border border-[#242b3b] p-5 space-y-3">
                    <div className="flex items-center justify-between border-b border-[#242b3b] pb-2">
                      <span className="font-bold text-amber-400 text-sm">{chain.tier} Metal Chain</span>
                      <span className="text-xs text-neutral-400 font-mono">Bar ID: {chain.bar_id}</span>
                    </div>

                    <div className="text-xs space-y-1.5 font-mono text-neutral-300 bg-[#181d28] p-3 rounded-xl border border-[#202636]">
                      <div className="flex justify-between">
                        <span className="text-neutral-400 font-sans">Primary Ore:</span>
                        <span>{chain.ore_name} (ID: {chain.ore_id})</span>
                      </div>
                      {chain.second_name && (
                        <div className="flex justify-between">
                          <span className="text-neutral-400 font-sans">Secondary Ore:</span>
                          <span>{chain.second_name}</span>
                        </div>
                      )}
                      <div className="flex justify-between">
                        <span className="text-neutral-400 font-sans">Coal Required:</span>
                        <span>{chain.coal_qty_bf} at Blast Furnace ({chain.coal_qty_reg} regular)</span>
                      </div>
                      <div className="flex justify-between text-emerald-400 font-bold">
                        <span className="text-neutral-400 font-sans">Smelting Level:</span>
                        <span>Level {chain.smelt_lvl} (+{chain.smelt_xp} XP)</span>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-neutral-400 uppercase">Smithable Outputs:</span>
                      <div className="max-h-48 overflow-y-auto divide-y divide-[#202636] border border-[#242b3b] rounded-lg">
                        {chain.items && chain.items.map((it: any) => (
                          <div key={it.name} className="px-3 py-2 flex items-center justify-between text-xs hover:bg-[#181d28]">
                            <span className="font-bold text-white font-sans">{it.name}</span>
                            <span className="text-neutral-400 font-mono">Lvl {it.level} • {it.bars} {it.bars === 1 ? 'bar' : 'bars'}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
