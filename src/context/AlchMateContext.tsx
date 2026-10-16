'use client';

import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { supabase } from '../lib/supabase';

export interface AlchItem {
  id: number;
  name: string;
  members: boolean;
  buy_limit: number;
  volume: number;
  highalch: number;
  bid: number;
  ask: number;
  buy_price: number;
  profit: number;
  hourly_profit: number;
  roi: number;
  speed_category: string;
  speed_label: string;
  speed_score: number;
  est_minutes: number;
  vol_5m_bid: number;
  vol_5m_ask: number;
  vol_5m_total: number;
  secs_since_trade: number;
  icon?: string;
  fill_confidence?: 'high' | 'steady' | 'risky';
}

export interface PriceData {
  timestamp: number;
  nature_rune: number;
  bond: {
    bid: number;
    ask: number;
    patient_bid: number;
    deep_bid: number;
    savings: number;
    min_7d: number;
    max_7d: number;
    daily_vol: number;
  };
  latest: Record<string, { high?: number; low?: number; highTime?: number; lowTime?: number }>;
  alch_map: Record<string, number>;
  volumes_5m: Record<string, { highPriceVolume?: number; lowPriceVolume?: number }>;
  items: AlchItem[];
  is_stale?: boolean;
}

export interface GeTimer {
  id: number;
  name: string;
  account: string;
  limit: number;
  qtyBought: number;
  startTime: number;
  expiresAt: number;
}

export interface SessionEntry {
  id: string;
  timestamp: number;
  account: string;
  itemId: number;
  itemName: string;
  qty: number;
  price: number;
  natPrice: number;
  alchVal: number;
  netProfit: number;
  totalCoins: number;
  role: 'buyer' | 'seller' | 'alch';
  magicXp: number;
}

export interface SyncedCharacter {
  id?: string;
  rsn: string;
  coins: number;
  nature_runes: number;
  total_wealth: number;
  world?: number;
  is_members?: boolean;
  last_seen?: string;
}

interface AlchMateContextType {
  // Price & Market Data
  priceData: PriceData | null;
  loading: boolean;
  isStaleData: boolean;
  nextRefreshSec: number;
  refreshPrices: () => Promise<void>;

  // Controls & Filters
  searchQuery: string;
  setSearchQuery: (q: string) => void;
  pricingStrategy: 'patient' | 'smart' | 'instant';
  setPricingStrategy: (s: 'patient' | 'smart' | 'instant') => void;
  cashStack: number;
  setCashStack: (c: number) => void;
  maxSpend: number;
  setMaxSpend: (m: number) => void;
  unlimitedBudget: boolean;
  setUnlimitedBudget: (u: boolean) => void;
  membersEnabled: boolean;
  setMembersEnabled: (m: boolean) => void;
  f2pOnly: boolean;
  setF2pOnly: (f: boolean) => void;
  minVolumeFilter: number;
  setMinVolumeFilter: (v: number) => void;

  // Nature Runes
  natureRuneOverride: number;
  setNatureRuneOverride: (p: number) => void;
  explorersRing: boolean;
  setExplorersRing: (r: boolean) => void;
  ownedNats: number;
  setOwnedNats: (n: number) => void;
  effectiveNatPrice: number;

  // Cart
  cartItems: any[];
  toggleCart: (item: any) => void;
  clearCart: () => void;
  copyBankTags: (items?: any[]) => void;

  // Timers
  timers: GeTimer[];
  addTimer: (item: { id: number; name: string; buy_limit?: number }, qty?: number, account?: string) => void;
  removeTimer: (id: number, account?: string) => void;
  clearTimers: () => void;
  soundEnabled: boolean;
  setSoundEnabled: (s: boolean) => void;
  playTimerChime: () => void;

  // Session & Accounts
  sessionLog: SessionEntry[];
  addSessionEntry: (entry: Omit<SessionEntry, 'id' | 'timestamp'>) => void;
  deleteSessionEntry: (id: string) => void;
  clearSession: () => void;
  activeAccount: string;
  setActiveAccount: (acc: string) => void;
  allAccounts: string[];

  // Cloud & Local Sync
  syncToken: string;
  setSyncToken: (t: string) => void;
  syncedCharacters: SyncedCharacter[];
  isLocalServer: boolean;
  userCoins: number;
  setUserCoins: (c: number) => void;
  userNats: number;
  setUserNats: (n: number) => void;
  userBatchValue: number;
  setUserBatchValue: (b: number) => void;
  totalNetWorth: number;

  // Toast
  toastMsg: string | null;
  showToast: (msg: string) => void;

  // Feature Flags
  showCommunityLinks: boolean;
}

const AlchMateContext = createContext<AlchMateContextType | null>(null);

export function AlchMateProvider({ children }: { children: React.ReactNode }) {
  // Price Data
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isStaleData, setIsStaleData] = useState(false);
  const [nextRefreshSec, setNextRefreshSec] = useState(60);

  // Global Controls
  const [searchQuery, setSearchQuery] = useState('');
  const [pricingStrategy, setPricingStrategy] = useState<'patient' | 'smart' | 'instant'>('patient');
  const [cashStack, setCashStack] = useState<number>(5000000);
  const [maxSpend, setMaxSpend] = useState<number>(500000);
  const [unlimitedBudget, setUnlimitedBudget] = useState(false);
  const [membersEnabled, setMembersEnabled] = useState<boolean>(true);
  const [f2pOnly, setF2pOnly] = useState<boolean>(false);
  const [minVolumeFilter, setMinVolumeFilter] = useState<number>(100);

  // Nature Rune Pricing
  const [natureRuneOverride, setNatureRuneOverride] = useState<number>(170);
  const [explorersRing, setExplorersRing] = useState(false);
  const [ownedNats, setOwnedNats] = useState<number>(0);

  const effectiveNatPrice = useMemo(() => {
    if (explorersRing) return 0;
    if (ownedNats > 0) return 0;
    return natureRuneOverride;
  }, [explorersRing, ownedNats, natureRuneOverride]);

  // Cart
  const [cartItems, setCartItems] = useState<any[]>([]);

  // Timers
  const [timers, setTimers] = useState<GeTimer[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Session Ledger
  const [sessionLog, setSessionLog] = useState<SessionEntry[]>([]);
  const [activeAccount, setActiveAccount] = useState<string>('Main');

  // Cloud & Local Sync
  const [syncToken, setSyncToken] = useState<string>('');
  const [syncedCharacters, setSyncedCharacters] = useState<SyncedCharacter[]>([]);
  const [isLocalServer, setIsLocalServer] = useState<boolean>(false);
  const [userCoins, setUserCoins] = useState<number>(0);
  const [userNats, setUserNats] = useState<number>(0);
  const [userBatchValue, setUserBatchValue] = useState<number>(0);

  // Toast
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // Community Links Scaffolding Flag (Hidden on webpage as instructed)
  const showCommunityLinks = false;

  const showToast = useCallback((msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  }, []);

  // Web Audio Chime
  const playTimerChime = useCallback(() => {
    if (!soundEnabled) return;
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, ctx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.4);
    } catch {}
  }, [soundEnabled]);

  // Load from LocalStorage
  useEffect(() => {
    try {
      const savedTimers = localStorage.getItem('alchmate_timers');
      if (savedTimers) setTimers(JSON.parse(savedTimers));

      const savedCart = localStorage.getItem('alchmate_cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));

      const savedSession = localStorage.getItem('alchmate_session');
      if (savedSession) setSessionLog(JSON.parse(savedSession));

      const savedToken = localStorage.getItem('alchmate_sync_token');
      let token = savedToken;
      if (!token && typeof crypto !== 'undefined' && crypto.getRandomValues) {
        const randomHex = Array.from(crypto.getRandomValues(new Uint8Array(12)))
          .map((b) => b.toString(16).padStart(2, '0'))
          .join('');
        token = `alch_${randomHex}`;
        localStorage.setItem('alchmate_sync_token', token);
      }
      if (token) setSyncToken(token);

      const savedCoins = localStorage.getItem('alchmate_coins');
      if (savedCoins) {
        const nCoins = Number(savedCoins);
        setUserCoins(nCoins);
        if (nCoins > 0) setCashStack(nCoins);
      }

      const savedNats = localStorage.getItem('alchmate_nats');
      if (savedNats) setUserNats(Number(savedNats));

      const savedBatch = localStorage.getItem('alchmate_batch') || localStorage.getItem('alchmate_batch_val');
      if (savedBatch) setUserBatchValue(Number(savedBatch));
    } catch {}
  }, []);

  const updateSyncToken = useCallback((t: string) => {
    setSyncToken(t);
    try {
      localStorage.setItem('alchmate_sync_token', t);
    } catch {}
  }, []);

  // Background Polling (Priority 1: Embedded Local Server 127.0.0.1:18833 | Priority 2: Direct Supabase / Cloud)
  useEffect(() => {
    let isMounted = true;
    let timerId: any = null;
    let lastActiveTime = Date.now();
    let consecutiveUnchangedCount = 0;
    let lastDataHash = '';
    let isCurrentlyLocal = false;

    const getAdaptiveDelay = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        return 60000;
      }
      // If connected to local embedded server, poll at high speed (2s active, 6s idle)
      if (isCurrentlyLocal) {
        const idleMinutes = (Date.now() - lastActiveTime) / 60000;
        if (idleMinutes > 10) return 10000;
        if (idleMinutes > 2 || consecutiveUnchangedCount > 6) return 6000;
        return 2000;
      }
      const idleMinutes = (Date.now() - lastActiveTime) / 60000;
      if (idleMinutes > 10) return 60000; // 60s if idle >10m
      if (idleMinutes > 2 || consecutiveUnchangedCount > 6) return 25000; // 25s if no changes
      return 10000; // 10s active normal cloud polling
    };

    const scheduleNextPoll = () => {
      if (timerId) clearTimeout(timerId);
      const delay = getAdaptiveDelay();
      timerId = setTimeout(pollSync, delay);
    };

    const pollSync = async () => {
      // Tab Sleep Mode: If minimized or background tab, pause execution
      if (typeof document !== 'undefined' && document.hidden) {
        scheduleNextPoll();
        return;
      }

      try {
        let charactersData: any[] = [];
        let sessionsData: any[] = [];
        let sourceIsLocal = false;

        // 0. Primary: Local Embedded Server Check (127.0.0.1:18833) - 0ms latency, $0 cost, zero keys!
        try {
          const localController = new AbortController();
          const localTimeout = setTimeout(() => localController.abort(), 1200);
          const localRes = await fetch('http://127.0.0.1:18833/api/sync', {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: localController.signal,
          });
          clearTimeout(localTimeout);

          if (localRes.ok) {
            const localData = await localRes.json();
            if (localData?.characters && Array.isArray(localData.characters) && localData.characters.length > 0) {
              charactersData = localData.characters;
              if (localData?.sessions && Array.isArray(localData.sessions)) {
                sessionsData = localData.sessions;
              }
              sourceIsLocal = true;
            }
          }
        } catch {
          // Local server offline or PNA/mixed content blocked, proceed to cloud sync
        }

        isCurrentlyLocal = sourceIsLocal;
        if (isMounted) {
          setIsLocalServer(sourceIsLocal);
        }

        // 1. Direct Supabase Query (Zero Vercel Serverless Function Invocations)
        if (!sourceIsLocal && syncToken && syncToken.trim() && supabase) {
          try {
            const { data: profile } = await supabase
              .from('profiles')
              .select('id')
              .eq('sync_token', syncToken.trim())
              .maybeSingle();

            if (profile?.id) {
              const [{ data: chars }, { data: sess }] = await Promise.all([
                supabase
                  .from('characters')
                  .select('*')
                  .eq('user_id', profile.id)
                  .order('last_seen', { ascending: false }),
                supabase
                  .from('alch_sessions')
                  .select('*')
                  .eq('user_id', profile.id)
                  .order('created_at', { ascending: false })
                  .limit(50),
              ]);
              if (chars && chars.length > 0) charactersData = chars;
              if (sess && sess.length > 0) sessionsData = sess;
            }
          } catch {}
        }

        // 2. Fallback to /api/sync if direct Supabase returned nothing
        if (!sourceIsLocal && syncToken && syncToken.trim() && charactersData.length === 0) {
          const res = await fetch(`/api/sync?token=${encodeURIComponent(syncToken)}`);
          if (res.ok) {
            const data = await res.json();
            if (data?.characters) charactersData = data.characters;
            if (data?.sessions) sessionsData = data.sessions;
          }
        }

        if (!isMounted) return;

        const currentHash = JSON.stringify(charactersData || []) + (sessionsData?.length || 0);
        if (currentHash !== lastDataHash) {
          lastDataHash = currentHash;
          lastActiveTime = Date.now();
          consecutiveUnchangedCount = 0;
        } else {
          consecutiveUnchangedCount++;
        }

        if (charactersData.length > 0) {
          setSyncedCharacters(charactersData);
          setActiveAccount((prev) => {
            if (!prev || prev === 'Main' || !charactersData.some((c: any) => c.rsn === prev)) {
              return charactersData[0].rsn;
            }
            return prev;
          });
        }

        if (sessionsData.length > 0) {
          setSessionLog((prev) => {
            const existingIds = new Set(prev.map((s) => s.id));
            const newEntries: SessionEntry[] = [];
            for (const s of sessionsData) {
              const sid = String(s.id);
              if (!existingIds.has(sid)) {
                newEntries.push({
                  id: sid,
                  timestamp: new Date(s.created_at || Date.now()).getTime(),
                  account: s.rsn || 'Main',
                  itemId: s.item_id,
                  itemName: s.item_name,
                  qty: s.qty,
                  price: s.buy_price,
                  natPrice: s.nat_price,
                  alchVal: s.alch_val,
                  netProfit: s.profit,
                  totalCoins: 0,
                  role: 'alch',
                  magicXp: s.xp || (s.qty * 65),
                });
              }
            }
            if (newEntries.length === 0) return prev;
            const updated = [...newEntries, ...prev];
            localStorage.setItem('alchmate_session', JSON.stringify(updated));
            return updated;
          });
        }
      } catch {} finally {
        if (isMounted) {
          scheduleNextPoll();
        }
      }
    };

    // Immediate initial sync
    pollSync();

    // Instant wake-up when user clicks back to this tab
    const handleVisibilityChange = () => {
      if (typeof document !== 'undefined' && !document.hidden) {
        lastActiveTime = Date.now();
        consecutiveUnchangedCount = 0;
        if (timerId) clearTimeout(timerId);
        pollSync();
      }
    };

    if (typeof document !== 'undefined') {
      document.addEventListener('visibilitychange', handleVisibilityChange);
    }

    return () => {
      isMounted = false;
      if (timerId) clearTimeout(timerId);
      if (typeof document !== 'undefined') {
        document.removeEventListener('visibilitychange', handleVisibilityChange);
      }
    };
  }, [syncToken]);

  // Fetch prices from /api/prices
  const refreshPrices = useCallback(async () => {
    if (typeof document !== 'undefined' && document.hidden) {
      return;
    }
    try {
      setLoading(true);
      const res = await fetch('/api/prices');
      if (!res.ok) throw new Error('Wiki API error');
      const data: PriceData = await res.json();
      setPriceData(data);
      if (data.nature_rune) {
        setNatureRuneOverride((prev) => (prev === 170 ? data.nature_rune : prev));
      }
      setIsStaleData(data.is_stale || false);
      setNextRefreshSec(60);
    } catch (e) {
      setIsStaleData(true);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial fetch and 60s auto-refresh
  useEffect(() => {
    refreshPrices();
    const interval = setInterval(refreshPrices, 60000);
    const secTimer = setInterval(() => {
      setNextRefreshSec((s) => (s > 1 ? s - 1 : 60));
    }, 1000);
    return () => {
      clearInterval(interval);
      clearInterval(secTimer);
    };
  }, [refreshPrices]);

  // Total Net Worth
  const totalNetWorth = useMemo(() => {
    const natAssetPrice = priceData?.nature_rune || natureRuneOverride || 170;
    return userCoins + (userNats * natAssetPrice) + userBatchValue;
  }, [userCoins, userNats, priceData, natureRuneOverride, userBatchValue]);

  // Keep live user stats bound to the currently selected activeAccount
  useEffect(() => {
    if (syncedCharacters.length === 0) return;
    const current = syncedCharacters.find((c) => c.rsn === activeAccount) || syncedCharacters[0];
    if (current) {
      if (current.coins !== undefined) {
        const syncedCoins = Number(current.coins);
        setUserCoins(syncedCoins);
        if (syncedCoins > 0) {
          setCashStack(syncedCoins);
        }
        localStorage.setItem('alchmate_coins', String(syncedCoins));
        if (current.total_wealth !== undefined) {
          const syncedBatch = Math.max(0, Number(current.total_wealth) - syncedCoins);
          setUserBatchValue(syncedBatch);
          localStorage.setItem('alchmate_batch', String(syncedBatch));
          localStorage.setItem('alchmate_batch_val', String(syncedBatch));
        }
      }
      if (current.nature_runes !== undefined) {
        const syncedNats = Number(current.nature_runes);
        setUserNats(syncedNats);
        setOwnedNats(syncedNats);
        localStorage.setItem('alchmate_nats', String(syncedNats));
        localStorage.setItem('alchmate_owned_nats', String(syncedNats));
      }
    }
  }, [activeAccount, syncedCharacters]);

  // List of all active accounts across synced characters, timers, and session
  const allAccounts = useMemo(() => {
    const set = new Set<string>();
    syncedCharacters.forEach((c) => c.rsn && set.add(c.rsn));
    timers.forEach((t) => t.account && set.add(t.account));
    sessionLog.forEach((s) => s.account && set.add(s.account));
    if (activeAccount && activeAccount !== 'Main') {
      set.add(activeAccount);
    }
    if (set.size === 0) {
      set.add('Main');
    }
    return Array.from(set);
  }, [syncedCharacters, timers, sessionLog, activeAccount]);

  // Cart operations
  const toggleCart = useCallback((item: any) => {
    setCartItems((prev) => {
      const exists = prev.some((c) => c.id === item.id);
      const updated = exists ? prev.filter((c) => c.id !== item.id) : [...prev, item];
      localStorage.setItem('alchmate_cart', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
    localStorage.removeItem('alchmate_cart');
  }, []);

  const copyBankTags = useCallback((items?: any[]) => {
    const list = items || cartItems;
    if (!list.length) return;
    const names = list.map((it: any) => it.name).join(',');
    const tag = `alchmate,${names}`;
    navigator.clipboard.writeText(tag);
    showToast('📋 Copied RuneLite Bank Tag string to clipboard!');
  }, [cartItems, showToast]);

  // Timers operations
  const addTimer = useCallback((item: { id: number; name: string; buy_limit?: number }, qty?: number, account?: string) => {
    const baseLimit = item.buy_limit || 70;
    const now = Date.now();
    const expiresAt = now + 4 * 60 * 60 * 1000;
    const acc = account || activeAccount || 'Main';

    setTimers((prev) => {
      const filtered = prev.filter((t) => !(t.id === item.id && t.account === acc));
      const updated = [
        ...filtered,
        {
          id: item.id,
          name: item.name,
          account: acc,
          limit: baseLimit,
          qtyBought: qty !== undefined ? qty : baseLimit,
          startTime: now,
          expiresAt: expiresAt
        }
      ];
      localStorage.setItem('alchmate_timers', JSON.stringify(updated));
      return updated;
    });
    showToast(`⏰ Started 4h limit timer for ${item.name} (${acc})`);
  }, [activeAccount, showToast]);

  const removeTimer = useCallback((id: number, account?: string) => {
    const acc = account || activeAccount || 'Main';
    setTimers((prev) => {
      const updated = prev.filter((t) => !(t.id === id && t.account === acc));
      localStorage.setItem('alchmate_timers', JSON.stringify(updated));
      return updated;
    });
  }, [activeAccount]);

  const clearTimers = useCallback(() => {
    setTimers([]);
    localStorage.removeItem('alchmate_timers');
  }, []);

  // Session operations
  const addSessionEntry = useCallback((entry: Omit<SessionEntry, 'id' | 'timestamp'>) => {
    const newEntry: SessionEntry = {
      ...entry,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      timestamp: Date.now()
    };
    setSessionLog((prev) => {
      const updated = [newEntry, ...prev];
      localStorage.setItem('alchmate_session', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const deleteSessionEntry = useCallback((id: string) => {
    setSessionLog((prev) => {
      const updated = prev.filter((s) => s.id !== id);
      localStorage.setItem('alchmate_session', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const clearSession = useCallback(() => {
    setSessionLog([]);
    localStorage.removeItem('alchmate_session');
  }, []);

  return (
    <AlchMateContext.Provider
      value={{
        priceData,
        loading,
        isStaleData,
        nextRefreshSec,
        refreshPrices,
        searchQuery,
        setSearchQuery,
        pricingStrategy,
        setPricingStrategy,
        cashStack,
        setCashStack,
        maxSpend,
        setMaxSpend,
        unlimitedBudget,
        setUnlimitedBudget,
        membersEnabled,
        setMembersEnabled,
        f2pOnly,
        setF2pOnly,
        minVolumeFilter,
        setMinVolumeFilter,
        natureRuneOverride,
        setNatureRuneOverride,
        explorersRing,
        setExplorersRing,
        ownedNats,
        setOwnedNats,
        effectiveNatPrice,
        cartItems,
        toggleCart,
        clearCart,
        copyBankTags,
        timers,
        addTimer,
        removeTimer,
        clearTimers,
        soundEnabled,
        setSoundEnabled,
        playTimerChime,
        sessionLog,
        addSessionEntry,
        deleteSessionEntry,
        clearSession,
        activeAccount,
        setActiveAccount,
        allAccounts,
        syncedCharacters,
        isLocalServer,
        syncToken,
        setSyncToken: updateSyncToken,
        userCoins,
        setUserCoins,
        userNats,
        setUserNats,
        userBatchValue,
        setUserBatchValue,
        totalNetWorth,
        toastMsg,
        showToast,
        showCommunityLinks
      }}
    >
      {children}
    </AlchMateContext.Provider>
  );
}

export function useAlchMate() {
  const ctx = useContext(AlchMateContext);
  if (!ctx) throw new Error('useAlchMate must be used within an AlchMateProvider');
  return ctx;
}
