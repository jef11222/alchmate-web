'use client';

import React, { useState, useMemo } from 'react';
import { useAlchMate, SessionEntry } from '@/context/AlchMateContext';

export default function SessionPage() {
  const {
    sessionLog,
    addSessionEntry,
    deleteSessionEntry,
    clearSession,
    activeAccount,
    allAccounts,
    priceData,
    showToast,
  } = useAlchMate();

  const [viewMode, setViewMode] = useState<'consolidated' | 'detailed'>('consolidated');
  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingEntry, setEditingEntry] = useState<SessionEntry | null>(null);

  // New entry form state
  const [newItemName, setNewItemName] = useState('');
  const [newItemId, setNewItemId] = useState<number>(0);
  const [newQty, setNewQty] = useState<number>(70);
  const [newBuyPrice, setNewBuyPrice] = useState<number>(38000);
  const [newNatPrice, setNewNatPrice] = useState<number>(170);
  const [newAlchVal, setNewAlchVal] = useState<number>(40800);
  const [newAccount, setNewAccount] = useState<string>(activeAccount);

  // Filtered session log
  const filteredLog = useMemo(() => {
    return sessionLog.filter((e) => {
      if (filterAccount !== 'all' && e.account !== filterAccount) return false;
      return true;
    });
  }, [sessionLog, filterAccount]);

  // Totals
  const totalCasts = useMemo(() => filteredLog.reduce((acc, cur) => acc + (cur.qty || 0), 0), [filteredLog]);
  const totalProfit = useMemo(() => filteredLog.reduce((acc, cur) => acc + (cur.netProfit || 0), 0), [filteredLog]);
  const totalMagicXp = totalCasts * 65;
  const totalNats = totalCasts;

  // Consolidated Daily Stacks
  const consolidatedStacks = useMemo(() => {
    const map = new Map<string, {
      key: string;
      dateStr: string;
      account: string;
      itemName: string;
      itemId: number;
      totalQty: number;
      totalCost: number;
      totalNatCost: number;
      totalRevenue: number;
      totalProfit: number;
      alchVal: number;
      entriesCount: number;
    }>();

    for (const entry of filteredLog) {
      const dateStr = new Date(entry.timestamp).toLocaleDateString();
      const key = `${dateStr}-${entry.account}-${entry.itemName}`;

      const existing = map.get(key);
      const cost = entry.price * entry.qty;
      const natCost = entry.natPrice * entry.qty;
      const revenue = entry.alchVal * entry.qty;
      const profit = entry.netProfit;

      if (!existing) {
        map.set(key, {
          key,
          dateStr,
          account: entry.account,
          itemName: entry.itemName,
          itemId: entry.itemId,
          totalQty: entry.qty,
          totalCost: cost,
          totalNatCost: natCost,
          totalRevenue: revenue,
          totalProfit: profit,
          alchVal: entry.alchVal,
          entriesCount: 1,
        });
      } else {
        existing.totalQty += entry.qty;
        existing.totalCost += cost;
        existing.totalNatCost += natCost;
        existing.totalRevenue += revenue;
        existing.totalProfit += profit;
        existing.entriesCount += 1;
      }
    }

    return Array.from(map.values());
  }, [filteredLog]);

  // CSV Export
  const handleExportCsv = () => {
    if (filteredLog.length === 0) {
      showToast('No session entries to export!');
      return;
    }

    const headers = ['Timestamp', 'Date', 'Account', 'Item', 'Qty', 'BuyPrice', 'NatPrice', 'AlchVal', 'NetProfit', 'MagicXP'];
    const rows = filteredLog.map((e) => [
      e.timestamp,
      new Date(e.timestamp).toISOString(),
      `"${e.account}"`,
      `"${e.itemName}"`,
      e.qty,
      e.price,
      e.natPrice,
      e.alchVal,
      e.netProfit,
      e.qty * 65,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `alchmate_session_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Exported session ledger to CSV!');
  };

  const handleSaveManual = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName) return;

    const netProfit = (newAlchVal - newBuyPrice - newNatPrice) * newQty;
    addSessionEntry({
      account: newAccount || activeAccount,
      itemId: newItemId || 999999,
      itemName: newItemName,
      qty: newQty,
      price: newBuyPrice,
      natPrice: newNatPrice,
      alchVal: newAlchVal,
      netProfit,
      totalCoins: newAlchVal * newQty,
      role: 'alch',
      magicXp: newQty * 65,
    });

    setShowAddModal(false);
    showToast(`Added ${newQty}x ${newItemName} to session ledger!`);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">📜</span>
              <h1 className="text-xl md:text-2xl font-bold text-amber-400">Session Ledger & Profit Audit</h1>
            </div>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Track realized gold profit, casts executed, Magic XP milestones, and historical alch batches across all your characters.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition shadow"
            >
              <span>➕</span>
              <span>Manual Entry</span>
            </button>
            <button
              onClick={handleExportCsv}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg text-sm font-medium transition"
            >
              <span>📥</span>
              <span>Export CSV</span>
            </button>
          </div>
        </div>

        {/* Account Selector Filter */}
        <div className="mt-4 pt-3 border-t border-neutral-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-neutral-400 font-medium">Filter Character:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setFilterAccount('all')}
                className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                  filterAccount === 'all'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                All Accounts ({sessionLog.length})
              </button>
              {allAccounts.map((acc) => {
                const count = sessionLog.filter((e) => e.account === acc).length;
                return (
                  <button
                    key={acc}
                    onClick={() => setFilterAccount(acc)}
                    className={`px-2.5 py-1 rounded text-xs font-semibold transition ${
                      filterAccount === acc
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                        : 'text-neutral-400 hover:text-neutral-200'
                    }`}
                  >
                    {acc} ({count})
                  </button>
                );
              })}
            </div>
          </div>

          {sessionLog.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to reset your session ledger to zero?')) {
                  clearSession();
                }
              }}
              className="text-red-400 hover:text-red-300 font-medium"
            >
              🗑️ Reset Session
            </button>
          )}
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Casts */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-neutral-400 font-medium">✨ Total Casts Done</div>
          <div className="text-2xl font-bold text-blue-400 mt-1 font-mono">{totalCasts.toLocaleString()}</div>
          <p className="text-xs text-neutral-500 mt-1">High Alchemy casts recorded.</p>
        </div>

        {/* Realized Profit */}
        <div className="bg-neutral-900/90 border border-emerald-500/30 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-emerald-400 font-bold">💰 Realized Profit</div>
          <div className="text-2xl font-bold text-emerald-400 mt-1 font-mono">
            {totalProfit >= 0 ? `+${totalProfit.toLocaleString()}` : totalProfit.toLocaleString()} gp
          </div>
          <p className="text-xs text-neutral-500 mt-1">Net profit after item cost and nature runes.</p>
        </div>

        {/* Magic XP Gained */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-neutral-400 font-medium">🔮 Magic XP Gained</div>
          <div className="text-2xl font-bold text-purple-400 mt-1 font-mono">+{totalMagicXp.toLocaleString()} XP</div>
          <p className="text-xs text-neutral-500 mt-1">65 XP earned per High Alch cast.</p>
        </div>

        {/* Natures Consumed */}
        <div className="bg-neutral-900/90 border border-neutral-800 rounded-xl p-4 shadow-sm">
          <div className="text-xs text-neutral-400 font-medium">🌿 Nature Runes Used</div>
          <div className="text-2xl font-bold text-amber-400 mt-1 font-mono">{totalNats.toLocaleString()}</div>
          <p className="text-xs text-neutral-500 mt-1">Total runes consumed this session.</p>
        </div>
      </div>

      {/* Session Ledger Table & View Mode Switcher */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-neutral-200">View Mode:</span>
            <div className="flex items-center gap-1 bg-neutral-950 p-1 rounded-lg border border-neutral-800">
              <button
                onClick={() => setViewMode('consolidated')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  viewMode === 'consolidated'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                📦 Consolidated Daily View
              </button>
              <button
                onClick={() => setViewMode('detailed')}
                className={`px-3 py-1 rounded text-xs font-semibold transition ${
                  viewMode === 'detailed'
                    ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                    : 'text-neutral-400 hover:text-neutral-200'
                }`}
              >
                📜 Detailed Transactions
              </button>
            </div>
          </div>

          <div className="text-xs text-neutral-400">
            {viewMode === 'consolidated'
              ? `${consolidatedStacks.length} consolidated stacks`
              : `${filteredLog.length} individual fills`}
          </div>
        </div>

        {/* Table Content */}
        {filteredLog.length === 0 ? (
          <div className="py-12 text-center space-y-3">
            <span className="text-4xl block">📊</span>
            <h3 className="text-base font-bold text-neutral-300">No Transactions Logged</h3>
            <p className="text-xs text-neutral-500 max-w-sm mx-auto">
              Completed High Alches synced from the RuneLite plugin or logged manually will appear here in real time.
            </p>
          </div>
        ) : viewMode === 'consolidated' ? (
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-neutral-950 text-neutral-400 text-xs font-semibold uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-3">Account</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-3 text-center">Total Qty</th>
                  <th className="py-3 px-4 text-right">Avg Bought (ea)</th>
                  <th className="py-3 px-3 text-right">Avg Nat (ea)</th>
                  <th className="py-3 px-4 text-right">Alch Val (Fixed)</th>
                  <th className="py-3 px-4 text-right">Total Profit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/60 font-mono">
                {consolidatedStacks.map((stack) => {
                  const avgBuy = Math.round(stack.totalCost / stack.totalQty);
                  const avgNat = Math.round(stack.totalNatCost / stack.totalQty);

                  return (
                    <tr key={stack.key} className="hover:bg-neutral-800/40 transition">
                      <td className="py-3 px-4 font-sans text-neutral-400">{stack.dateStr}</td>
                      <td className="py-3 px-3 font-sans font-semibold text-neutral-200">👤 {stack.account}</td>
                      <td className="py-3 px-4 font-sans font-bold text-neutral-100 flex items-center gap-1.5">
                        <span>{stack.itemName}</span>
                        {stack.entriesCount > 1 && (
                          <span className="text-[10px] bg-neutral-800 text-neutral-400 px-1.5 py-0.5 rounded font-mono">
                            {stack.entriesCount} fills
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-center font-bold text-neutral-200">{stack.totalQty.toLocaleString()}</td>
                      <td className="py-3 px-4 text-right text-neutral-300">{avgBuy.toLocaleString()} gp</td>
                      <td className="py-3 px-3 text-right text-neutral-400">{avgNat.toLocaleString()} gp</td>
                      <td className="py-3 px-4 text-right text-amber-400 font-semibold">{stack.alchVal.toLocaleString()} gp</td>
                      <td className={`py-3 px-4 text-right font-bold ${stack.totalProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {stack.totalProfit >= 0 ? `+${stack.totalProfit.toLocaleString()}` : stack.totalProfit.toLocaleString()} gp
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-neutral-800">
            <table className="w-full text-left text-xs md:text-sm">
              <thead className="bg-neutral-950 text-neutral-400 text-xs font-semibold uppercase tracking-wider border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Time</th>
                  <th className="py-3 px-3">Account</th>
                  <th className="py-3 px-4">Item Name</th>
                  <th className="py-3 px-3 text-center">Qty</th>
                  <th className="py-3 px-4 text-right">Bought At (ea)</th>
                  <th className="py-3 px-3 text-right">Nat Cost</th>
                  <th className="py-3 px-4 text-right">Alch Val</th>
                  <th className="py-3 px-4 text-right">Net Profit</th>
                  <th className="py-3 px-3 text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-800/60 bg-neutral-900/60 font-mono">
                {filteredLog.map((entry) => (
                  <tr key={entry.id} className="hover:bg-neutral-800/40 transition">
                    <td className="py-3 px-4 font-sans text-neutral-400 text-xs">
                      {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-3 font-sans text-neutral-300">👤 {entry.account}</td>
                    <td className="py-3 px-4 font-sans font-bold text-neutral-100">{entry.itemName}</td>
                    <td className="py-3 px-3 text-center font-bold text-neutral-200">{entry.qty}</td>
                    <td className="py-3 px-4 text-right text-neutral-300">{entry.price.toLocaleString()} gp</td>
                    <td className="py-3 px-3 text-right text-neutral-400">{entry.natPrice.toLocaleString()} gp</td>
                    <td className="py-3 px-4 text-right text-amber-400 font-semibold">{entry.alchVal.toLocaleString()} gp</td>
                    <td className={`py-3 px-4 text-right font-bold ${entry.netProfit >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {entry.netProfit >= 0 ? `+${entry.netProfit.toLocaleString()}` : entry.netProfit.toLocaleString()} gp
                    </td>
                    <td className="py-3 px-3 text-center font-sans">
                      <button
                        onClick={() => deleteSessionEntry(entry.id)}
                        className="text-neutral-500 hover:text-red-400 text-xs transition"
                        title="Delete entry"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Entry Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>➕</span> Log Manual Alch Batch
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveManual} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-neutral-300 mb-1">Item Name:</label>
                <input
                  type="text"
                  required
                  value={newItemName}
                  onChange={(e) => setNewItemName(e.target.value)}
                  placeholder="e.g. Rune 2h sword"
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Quantity:</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newQty}
                    onChange={(e) => setNewQty(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Character:</label>
                  <input
                    type="text"
                    value={newAccount}
                    onChange={(e) => setNewAccount(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Buy Price (ea):</label>
                  <input
                    type="number"
                    required
                    value={newBuyPrice}
                    onChange={(e) => setNewBuyPrice(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-2 text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Nat Cost (ea):</label>
                  <input
                    type="number"
                    required
                    value={newNatPrice}
                    onChange={(e) => setNewNatPrice(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-2 text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-neutral-300 mb-1">Alch Val (Fixed):</label>
                  <input
                    type="number"
                    required
                    value={newAlchVal}
                    onChange={(e) => setNewAlchVal(Number(e.target.value))}
                    className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-2.5 py-2 text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                  />
                </div>
              </div>

              {/* Calculated profit preview */}
              <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 text-xs">
                <span className="text-neutral-400">Calculated Batch Profit: </span>
                <span className="font-bold text-emerald-400 font-mono">
                  +{((newAlchVal - newBuyPrice - newNatPrice) * newQty).toLocaleString()} gp
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 rounded-lg text-xs font-semibold transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  Save Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
