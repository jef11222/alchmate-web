'use client';

import React, { useState, useMemo } from 'react';
import { 
  Hammer, 
  Layers, 
  TrendingUp, 
  Sliders, 
  Search, 
  Check, 
  Copy, 
  AlertCircle,
  Filter
} from 'lucide-react';
import { useAlchMate } from '../../context/AlchMateContext';
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

export default function CraftingPage() {
  const { priceData, searchQuery, setSearchQuery, showToast } = useAlchMate();

  const [activeTab, setActiveTab] = useState<'ge_craft' | 'progression' | 'smithing_tree' | 'inspector'>('ge_craft');
  const [skillFilter, setSkillFilter] = useState<string>('all');
  const [minProfit, setMinProfit] = useState<number>(0);
  const [selectedRecipe, setSelectedRecipe] = useState<any>(null);
  const [customSellPrice, setCustomSellPrice] = useState<number>(0);

  // Computed GE Crafting Recipes with Exact 1% Tax
  const computedRecipes = useMemo(() => {
    const latest = priceData?.latest || {};

    return (geRecipesData as any[]).map((r) => {
      // Calculate material cost
      let matCost = 0;
      let hasAllMats = true;
      for (const m of r.materials) {
        const p = latest[String(m.id)]?.high || latest[String(m.id)]?.low || 0;
        if (!p || p <= 0) hasAllMats = false;
        matCost += p * m.qty;
      }

      // Calculate output gross and net sell price with strictly 1% tax
      const outP = latest[String(r.output_id)]?.low || latest[String(r.output_id)]?.high || 0;
      const netSellEa = calcNetSell(outP);
      const grossRevenue = outP * (r.output_qty || 1);
      const netRevenue = netSellEa * (r.output_qty || 1);

      const profitEa = netRevenue - matCost;
      const hourlyActions = r.hourly_actions || 1500;
      const hourlyProfit = profitEa * hourlyActions;
      const hourlyXp = (r.xp || 0) * hourlyActions;

      return {
        ...r,
        mat_cost: matCost,
        gross_sell: outP,
        net_sell: netSellEa,
        profit_ea: profitEa,
        hourly_profit: hourlyProfit,
        hourly_xp: hourlyXp,
        has_prices: hasAllMats && outP > 0,
      };
    }).filter((r) => {
      if (skillFilter !== 'all' && r.skill.toLowerCase() !== skillFilter.toLowerCase()) return false;
      if (minProfit > 0 && r.profit_ea < minProfit) return false;
      if (searchQuery.trim() && !r.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      return true;
    }).sort((a, b) => b.hourly_profit - a.hourly_profit);
  }, [priceData, skillFilter, minProfit, searchQuery]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-[#141721] p-5 rounded-2xl border border-[#242b3b]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Hammer className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-black text-white">Crafting &amp; Workshop Hub</h1>
          </div>
          <p className="text-xs text-neutral-400 mt-1">
            229 production recipes calculated with authentic 1% Grand Exchange tax and true tick-cycle speeds.
          </p>
        </div>

        {/* Sub-view Navigation */}
        <div className="flex flex-wrap items-center gap-1.5 bg-[#191e29] p-1.5 rounded-xl border border-[#2a3449] text-xs font-semibold">
          <button
            onClick={() => setActiveTab('ge_craft')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'ge_craft' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Hammer className="w-3.5 h-3.5" />
            <span>229 GE Recipes</span>
          </button>
          <button
            onClick={() => setActiveTab('progression')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'progression' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>1–99 Level Guides</span>
          </button>
          <button
            onClick={() => setActiveTab('smithing_tree')}
            className={`px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-all ${
              activeTab === 'smithing_tree' ? 'bg-amber-500 text-black font-bold shadow' : 'text-neutral-300 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Smithing Family Tree</span>
          </button>
        </div>
      </div>

      {/* VIEW 1: 229 GE RECIPES */}
      {activeTab === 'ge_craft' && (
        <div className="space-y-4">
          {/* Skill Filter Buttons */}
          <div className="bg-[#141721] p-3 rounded-xl border border-[#242b3b] flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-1.5">
              {['all', 'Smithing', 'Fletching', 'Crafting', 'Herblore', 'Cooking', 'Magic'].map((s) => (
                <button
                  key={s}
                  onClick={() => setSkillFilter(s)}
                  className={`px-3 py-1.5 rounded-lg font-bold transition-all ${
                    skillFilter === s ? 'bg-amber-500 text-black' : 'bg-[#181d28] text-neutral-300 hover:text-white border border-[#2a3449]'
                  }`}
                >
                  {s === 'all' ? 'All Skills' : s}
                </button>
              ))}
            </div>

            <span className="text-neutral-400 font-mono text-xs">
              {computedRecipes.length} recipes matched
            </span>
          </div>

          {/* Recipes Table */}
          <div className="bg-[#141721] rounded-2xl border border-[#242b3b] overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-[#10131b] text-neutral-400 uppercase text-[11px] border-b border-[#242b3b]">
                  <tr>
                    <th className="px-4 py-3 font-sans">Recipe / Finished Item</th>
                    <th className="px-3 py-3 font-sans">Skill</th>
                    <th className="px-3 py-3 text-center">Req Lvl</th>
                    <th className="px-3 py-3 text-right">Material Cost</th>
                    <th className="px-3 py-3 text-right">Net Sell (1% Tax)</th>
                    <th className="px-3 py-3 text-right">Profit ea</th>
                    <th className="px-3 py-3 text-right">Hourly Profit</th>
                    <th className="px-3 py-3 text-right">XP / Hr</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#1c2230]">
                  {computedRecipes.slice(0, 50).map((r, idx) => (
                    <tr key={idx} className="hover:bg-[#181d29]/60 transition-colors">
                      <td className="px-4 py-3 font-sans font-bold text-white">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://static.runelite.net/cache/item/icon/${r.output_id}.png`}
                            alt=""
                            className="w-6 h-6 object-contain"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <span>{r.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-3 font-sans text-neutral-300">{r.skill}</td>
                      <td className="px-3 py-3 text-center text-amber-400 font-bold">{r.level}</td>
                      <td className="px-3 py-3 text-right text-neutral-300">{r.mat_cost.toLocaleString()} gp</td>
                      <td className="px-3 py-3 text-right text-neutral-300">{r.net_sell.toLocaleString()} gp</td>
                      <td className={`px-3 py-3 text-right font-bold ${r.profit_ea > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {r.profit_ea > 0 ? `+${r.profit_ea.toLocaleString()}` : r.profit_ea.toLocaleString()} gp
                      </td>
                      <td className="px-3 py-3 text-right font-black text-amber-400">
                        {r.hourly_profit > 0 ? `+${formatGp(r.hourly_profit)}/hr` : `${formatGp(r.hourly_profit)}/hr`}
                      </td>
                      <td className="px-3 py-3 text-right text-cyan-400 font-bold">
                        +{r.hourly_xp.toLocaleString()} XP
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* VIEW 2: 1-99 LEVEL PROGRESSION GUIDE */}
      {activeTab === 'progression' && (
        <div className="space-y-6">
          <div className="bg-[#141721] p-6 rounded-2xl border border-[#242b3b] space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-400" />
              1–99 Level Progression Guides
            </h2>
            <p className="text-xs text-neutral-400">
              Optimal level brackets and quest skips for Smithing, Fletching, Crafting, and Magic.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {['Smithing', 'Fletching', 'Crafting', 'Magic'].map((skill) => {
                const guide = (skillingGuidesData as any)[skill];
                if (!guide) return null;
                return (
                  <div key={skill} className="bg-[#181d28] border border-[#2a3449] p-5 rounded-2xl space-y-3 text-xs">
                    <h3 className="font-bold text-amber-400 text-base flex items-center justify-between">
                      <span>{skill} Progression</span>
                      <span className="text-neutral-500 text-xs font-mono">1–99</span>
                    </h3>

                    {/* Quest Skips if any */}
                    {guide.quests && guide.quests.length > 0 && (
                      <div className="bg-[#121620] p-3 rounded-xl border border-amber-500/20 space-y-1">
                        <span className="text-amber-400 font-bold text-[11px] uppercase tracking-wider block">
                          ⚡ Recommended Quest Skip:
                        </span>
                        {guide.quests.map((q: any, qIdx: number) => (
                          <div key={qIdx} className="text-neutral-300">
                            <strong>{q.name}</strong> — {q.tip}
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Brackets */}
                    <div className="space-y-2">
                      {guide.brackets?.slice(0, 4).map((b: any, bIdx: number) => (
                        <div key={bIdx} className="bg-[#141721] p-2.5 rounded-lg border border-[#222a3a] flex justify-between items-center">
                          <div>
                            <span className="font-bold text-white">Lvl {b.level_range}:</span> {b.name}
                          </div>
                          <span className="text-neutral-400 font-mono">+{b.xp} XP</span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* VIEW 3: SMITHING FAMILY TREE */}
      {activeTab === 'smithing_tree' && (
        <div className="space-y-6">
          <div className="bg-[#141721] p-6 rounded-2xl border border-[#242b3b] space-y-4">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Layers className="w-5 h-5 text-amber-400" />
              Smithing Material Chain Tree
            </h2>
            <p className="text-xs text-neutral-400">
              Compares the raw ore cost, bar smelting profit, and finished forged item profit across every metal tier.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(smithingChainsData as any[]).map((tier, idx) => (
                <div key={idx} className="bg-[#181d28] border border-[#2a3449] p-4 rounded-xl space-y-3 font-mono text-xs">
                  <div className="flex justify-between items-center border-b border-[#232c3f] pb-2">
                    <span className="font-sans font-bold text-white text-base">{tier.tier} Metal Tier</span>
                    <span className="text-amber-400 font-bold">Lvl {tier.smelt_lvl}</span>
                  </div>

                  <div className="space-y-1.5 text-neutral-300">
                    <div className="flex justify-between">
                      <span>Bar:</span>
                      <strong className="text-white">{tier.bar_name}</strong>
                    </div>
                    <div className="flex justify-between">
                      <span>Primary Ore:</span>
                      <span>{tier.ore_name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Coal Needed:</span>
                      <span>{tier.coal_qty_reg}x (Reg) / {tier.coal_qty_bf}x (BF)</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-[#232c3f]">
                    <span className="text-neutral-400 font-sans block mb-1">Key Anvil Items:</span>
                    <div className="space-y-1">
                      {tier.items?.slice(0, 3).map((it: any, itIdx: number) => (
                        <div key={itIdx} className="flex justify-between text-neutral-300 text-[11px]">
                          <span>{it.name}</span>
                          <span className="text-emerald-400 font-bold">{it.bars} bars</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
