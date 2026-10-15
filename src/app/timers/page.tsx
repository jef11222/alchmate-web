'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Image from 'next/image';
import { useAlchMate, GeTimer } from '@/context/AlchMateContext';

export default function TimersPage() {
  const {
    timers,
    addTimer,
    removeTimer,
    clearTimers,
    soundEnabled,
    setSoundEnabled,
    playTimerChime,
    priceData,
    activeAccount,
    allAccounts,
    showToast,
  } = useAlchMate();

  const [filterAccount, setFilterAccount] = useState<string>('all');
  const [searchItem, setSearchItem] = useState('');
  const [selectedItemForAdd, setSelectedItemForAdd] = useState<any>(null);
  const [addQty, setAddQty] = useState<number>(70);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [soundVolume, setSoundVolume] = useState<number>(80);
  const [notificationsAllowed, setNotificationsAllowed] = useState(false);
  const [currentTime, setCurrentTime] = useState(Date.now());

  // Ticking interval for countdowns
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Filtered Timers
  const filteredTimers = useMemo(() => {
    return timers.filter((t) => {
      if (filterAccount !== 'all' && t.account !== filterAccount) return false;
      return true;
    });
  }, [timers, filterAccount]);

  // Search items in market for timer addition
  const searchResults = useMemo(() => {
    if (!searchItem.trim() || !priceData?.items) return [];
    const q = searchItem.toLowerCase();
    return priceData.items.filter((i) => i.name.toLowerCase().includes(q)).slice(0, 8);
  }, [searchItem, priceData]);

  // Request browser notification permission
  const requestNotificationPermission = async () => {
    if ('Notification' in window) {
      const perm = await Notification.requestPermission();
      setNotificationsAllowed(perm === 'granted');
      if (perm === 'granted') {
        showToast('Browser notifications enabled!');
      } else {
        showToast('Notification permission denied.');
      }
    }
  };

  const handleAddTimer = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItemForAdd) return;
    addTimer(selectedItemForAdd, addQty, activeAccount);
    setShowAddModal(false);
    setSearchItem('');
    setSelectedItemForAdd(null);
  };

  const formatCountdown = (expiresAt: number) => {
    const diff = Math.max(0, Math.floor((expiresAt - currentTime) / 1000));
    if (diff <= 0) return '00:00:00';
    const hrs = Math.floor(diff / 3600);
    const mins = Math.floor((diff % 3600) / 60);
    const secs = diff % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPct = (timer: GeTimer) => {
    const total = 4 * 60 * 60 * 1000;
    const remaining = Math.max(0, timer.expiresAt - currentTime);
    const elapsed = total - remaining;
    return Math.min(100, Math.max(0, (elapsed / total) * 100));
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 shadow-lg relative overflow-hidden">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-2xl">⏱️</span>
              <h1 className="text-xl md:text-2xl font-bold text-amber-400">4-Hour GE Cooldown Tracker</h1>
            </div>
            <p className="text-sm text-neutral-400 mt-1 max-w-2xl">
              Track 4-hour Grand Exchange buy limits across all your characters. Receive an audio chime and notification when limits reset so you never miss high-margin buying windows.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-semibold transition shadow"
            >
              <span>➕</span>
              <span>Track New Item</span>
            </button>
            <button
              onClick={() => setShowSettingsModal(true)}
              className="flex items-center gap-1.5 px-3 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-300 border border-neutral-700 rounded-lg text-sm font-medium transition"
            >
              <span>🔔</span>
              <span>Sound & Alerts</span>
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
                All Accounts ({timers.length})
              </button>
              {allAccounts.map((acc) => {
                const count = timers.filter((t) => t.account === acc).length;
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

          {timers.length > 0 && (
            <button
              onClick={() => {
                if (confirm('Are you sure you want to clear all active timers?')) {
                  clearTimers();
                }
              }}
              className="text-red-400 hover:text-red-300 font-medium"
            >
              🗑️ Clear All Timers
            </button>
          )}
        </div>
      </div>

      {/* Active Timers List */}
      {filteredTimers.length === 0 ? (
        <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-12 text-center space-y-3">
          <span className="text-4xl block">⏳</span>
          <h3 className="text-lg font-bold text-neutral-300">No Active Cooldown Timers</h3>
          <p className="text-sm text-neutral-500 max-w-md mx-auto">
            You don&apos;t have any active 4-hour buy limits tracked. Add an item from the High Alch table or click &quot;Track New Item&quot; to begin monitoring GE cooldowns!
          </p>
          <button
            onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-amber-400 border border-neutral-700 rounded-lg text-sm font-semibold transition inline-flex items-center gap-2 mt-2"
          >
            <span>➕</span> Track Your First Item
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredTimers.map((timer) => {
            const isReady = currentTime >= timer.expiresAt;
            const progress = getProgressPct(timer);
            const countdown = formatCountdown(timer.expiresAt);

            return (
              <div
                key={`${timer.account}-${timer.id}`}
                className={`bg-neutral-900 border rounded-xl p-4 shadow-md transition space-y-3 ${
                  isReady ? 'border-emerald-500/50 bg-emerald-950/10' : 'border-neutral-800'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-neutral-950 border border-neutral-800 flex items-center justify-center relative overflow-hidden">
                      <Image
                        src={`https://oldschool.runescape.wiki/images/${encodeURIComponent(timer.name.replace(/ /g, '_'))}_detail.png`}
                        alt={timer.name}
                        width={32}
                        height={32}
                        unoptimized
                        className="object-contain"
                        onError={(e) => {
                          (e.target as HTMLElement).style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-neutral-100">{timer.name}</h4>
                      <span className="text-xs text-neutral-400 font-mono">
                        👤 {timer.account}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeTimer(timer.id, timer.account)}
                    className="text-neutral-500 hover:text-red-400 text-sm p-1 transition"
                    title="Remove timer"
                  >
                    ✕
                  </button>
                </div>

                {/* Progress bar */}
                <div className="space-y-1">
                  <div className="flex justify-between text-xs font-mono">
                    <span className="text-neutral-400">
                      Bought: <strong className="text-neutral-200">{timer.qtyBought}</strong> / {timer.limit}
                    </span>
                    <span className={`font-bold ${isReady ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {countdown}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-neutral-950 rounded-full border border-neutral-800 overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        isReady
                          ? 'bg-gradient-to-r from-emerald-500 to-teal-400'
                          : 'bg-gradient-to-r from-amber-500 to-orange-500'
                      }`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div className="flex items-center justify-between pt-1">
                  <span
                    className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs font-semibold border ${
                      isReady
                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                        : 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                    }`}
                  >
                    <span>{isReady ? '✅' : '⏳'}</span>
                    <span>{isReady ? 'Ready to Buy!' : 'Cooldown Active'}</span>
                  </span>

                  <button
                    onClick={() => {
                      // Restart 4h timer
                      addTimer({ id: timer.id, name: timer.name, buy_limit: timer.limit }, timer.qtyBought, timer.account);
                      showToast(`Restarted 4h cooldown for ${timer.name}`);
                    }}
                    className="text-xs text-neutral-400 hover:text-neutral-200 underline font-medium"
                  >
                    🔄 Restart 4h
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Track New Item Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>➕</span> Track GE Buy Limit
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-lg"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddTimer} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-neutral-300 mb-1">
                  Search Item:
                </label>
                <input
                  type="text"
                  value={searchItem}
                  onChange={(e) => setSearchItem(e.target.value)}
                  placeholder="e.g. Rune 2h sword, Dragon dagger..."
                  className="w-full bg-neutral-950 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500"
                />

                {searchResults.length > 0 && (
                  <div className="mt-2 bg-neutral-950 border border-neutral-800 rounded-lg max-h-40 overflow-y-auto divide-y divide-neutral-850">
                    {searchResults.map((item) => (
                      <button
                        type="button"
                        key={item.id}
                        onClick={() => {
                          setSelectedItemForAdd(item);
                          setAddQty(item.buy_limit || 70);
                          setSearchItem(item.name);
                        }}
                        className="w-full text-left px-3 py-2 hover:bg-neutral-800 flex items-center justify-between text-xs transition"
                      >
                        <span className="font-semibold text-neutral-200">{item.name}</span>
                        <span className="text-neutral-400 font-mono">Limit: {item.buy_limit || 70}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {selectedItemForAdd && (
                <div className="bg-neutral-950 p-3 rounded-lg border border-neutral-800 space-y-3">
                  <div className="text-xs text-neutral-400">
                    Selected:{' '}
                    <strong className="text-amber-400">{selectedItemForAdd.name}</strong> (GE Limit: {selectedItemForAdd.buy_limit || 70})
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-300 mb-1">
                      Quantity Purchased:
                    </label>
                    <input
                      type="number"
                      value={addQty}
                      onChange={(e) => setAddQty(Number(e.target.value))}
                      className="w-full bg-neutral-900 border border-neutral-700 rounded-lg px-3 py-2 text-sm text-neutral-200 focus:outline-none focus:border-amber-500 font-mono"
                    />
                  </div>

                  <div className="text-xs text-neutral-500">
                    Character Profile:{' '}
                    <span className="text-emerald-400 font-bold">{activeAccount}</span>
                  </div>
                </div>
              )}

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
                  disabled={!selectedItemForAdd}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white rounded-lg text-xs font-bold transition shadow"
                >
                  Start 4-Hour Timer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sound & Notifications Settings Modal */}
      {showSettingsModal && (
        <div className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-neutral-700 rounded-xl max-w-md w-full p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-800 pb-3">
              <h3 className="text-base font-bold text-neutral-100 flex items-center gap-2">
                <span>🔔</span> Audio & Notification Settings
              </h3>
              <button
                onClick={() => setShowSettingsModal(false)}
                className="text-neutral-400 hover:text-neutral-200 text-lg"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4 text-xs">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-200 block">Web Audio Chime</span>
                  <span className="text-neutral-400">Play an authentic OSRS synth chime when 4h expires</span>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-500 focus:ring-emerald-400"
                />
              </div>

              <div>
                <label className="block font-semibold text-neutral-300 mb-1">
                  Chime Volume: {soundVolume}%
                </label>
                <input
                  type="range"
                  min="10"
                  max="100"
                  value={soundVolume}
                  onChange={(e) => setSoundVolume(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer"
                />
              </div>

              <div className="pt-1">
                <button
                  type="button"
                  onClick={() => playTimerChime()}
                  className="w-full py-2 bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 rounded-lg text-amber-400 font-semibold transition flex items-center justify-center gap-2"
                >
                  <span>🔊</span> Test Chime Sound
                </button>
              </div>

              <div className="border-t border-neutral-800 pt-3 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-neutral-200 block">Browser Push Notifications</span>
                  <span className="text-neutral-400">Notify even when this browser tab is backgrounded</span>
                </div>
                <button
                  type="button"
                  onClick={requestNotificationPermission}
                  className={`px-3 py-1 rounded text-xs font-semibold border ${
                    notificationsAllowed
                      ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                      : 'bg-neutral-800 text-neutral-300 border-neutral-700'
                  }`}
                >
                  {notificationsAllowed ? 'Enabled' : 'Enable'}
                </button>
              </div>
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="button"
                onClick={() => setShowSettingsModal(false)}
                className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 rounded-lg text-xs font-semibold transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
