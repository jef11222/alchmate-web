'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
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
  AlertCircle,
  Key,
  Send,
  Eye,
  EyeOff,
  ShoppingCart,
  BookOpen,
  Bell
} from 'lucide-react';
import geRecipesData from '../data/ge_recipes.json';
import craftingRecipesData from '../data/crafting_recipes.json';
import workhorseItemsData from '../data/workhorse_items.json';
import w308StaplesData from '../data/w308_staples.json';
import overnightCandidatesData from '../data/overnight_candidates.json';
import skillingGuidesData from '../data/skilling_guides.json';

interface AlchItem {
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
  icon?: string;
}

interface PriceData {
  timestamp: number;
  nature_rune: number;
  bond: { bid: number; ask: number };
  latest: Record<string, { high?: number; low?: number }>;
  alch_map?: Record<string, number>;
  items: AlchItem[];
}

// Lightweight ToolTip Component matching desktop gui.py ToolTip
function Tooltip({ text, children, position = 'top' }: { text: string; children: React.ReactNode; position?: 'top' | 'bottom' | 'left' | 'right' }) {
  const [visible, setVisible] = useState(false);
  if (!text) return <>{children}</>;

  const posClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2'
  }[position];

  return (
    <div 
      className="relative inline-flex items-center"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className={`absolute z-50 ${posClasses} pointer-events-none transition-opacity duration-150`}>
          <div className="bg-[#18181a] text-[#f1f1f1] border border-[#3e3e46] rounded-md px-2.5 py-1.5 text-[11px] leading-relaxed shadow-xl whitespace-pre-line max-w-xs text-left">
            {text}
          </div>
        </div>
      )}
    </div>
  );
}

// Rich Row Hover Card matching desktop RowToolTip / get_alch_row_tooltip
function RowHoverCard({ 
  item, 
  effectiveNatPrice,
  children 
}: { 
  item: AlchItem & { profit: number; hourly_profit: number; batch_profit: number; max_afford: number; roi: number; speed: { label: string; color: string } };
  effectiveNatPrice: number;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = useState(false);
  const spread = item.ask && item.bid ? item.ask - item.bid : 0;
  const spreadPct = item.bid > 0 && spread > 0 ? ((spread / item.bid) * 100).toFixed(1) : '0.0';
  const hasWarning = item.volume < item.buy_limit;

  return (
    <div 
      className="relative"
      onMouseEnter={() => setVisible(true)}
      onMouseLeave={() => setVisible(false)}
    >
      {children}
      {visible && (
        <div className="absolute left-10 top-full mt-1 z-50 pointer-events-none w-80">
          <div className={`bg-[#1a1a1d] border ${hasWarning ? 'border-amber-500' : 'border-[#4a4a52]'} rounded-lg p-3 text-xs shadow-2xl text-left space-y-2`}>
            <div className="flex items-center justify-between border-b border-[#2f2f35] pb-2">
              <div className="flex items-center gap-2">
                <img
                  src={`https://static.runelite.net/cache/item/icon/${item.id}.png`}
                  alt=""
                  className="w-5 h-5 object-contain"
                  onError={(e) => { e.currentTarget.style.display = 'none'; }}
                />
                <span className="font-bold text-amber-400">{item.name}</span>
              </div>
              <span className={`text-[10px] font-bold ${item.members ? 'text-amber-400' : 'text-emerald-400'}`}>
                {item.members ? 'Members (P2P)' : 'Free-to-Play (F2P)'}
              </span>
            </div>

            <div className="space-y-1 font-mono text-[11px]">
              <div className="flex justify-between">
                <span className="text-neutral-400">Target Offer (Bid):</span>
                <span className="text-emerald-400 font-bold">{item.bid?.toLocaleString() || item.buy_price.toLocaleString()} gp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Instant Buy (Ask):</span>
                <span className="text-neutral-300">{item.ask ? `${item.ask.toLocaleString()} gp` : '—'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Margin Spread:</span>
                <span className="text-neutral-400">+{spread.toLocaleString()} gp ({spreadPct}%)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Nature Rune:</span>
                <span className="text-cyan-400">{effectiveNatPrice} gp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">High Alch Value:</span>
                <span className="text-purple-400 font-bold">{item.highalch.toLocaleString()} gp</span>
              </div>
              <div className="flex justify-between border-t border-[#2f2f35] pt-1">
                <span className="text-neutral-400">Net Profit / Alch:</span>
                <span className={`font-bold ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {item.profit > 0 ? `+${item.profit.toLocaleString()}` : item.profit.toLocaleString()} gp ({item.roi.toFixed(1)}% ROI)
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">Hourly Rate (1.2k/hr):</span>
                <span className="text-amber-400 font-bold">
                  {item.hourly_profit > 0 ? `+${(item.hourly_profit / 1000).toFixed(0)}k gp/hr` : `${(item.hourly_profit / 1000).toFixed(0)}k/hr`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">4h Buy Limit:</span>
                <span className="text-neutral-200">{item.buy_limit.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">4h Batch Profit:</span>
                <span className="text-emerald-400 font-bold">+{item.batch_profit.toLocaleString()} gp</span>
              </div>
              <div className="flex justify-between">
                <span className="text-neutral-400">24h Market Volume:</span>
                <span className="text-neutral-300">{item.volume.toLocaleString()} traded</span>
              </div>
            </div>

            {hasWarning && (
              <div className="border-t border-[#2f2f35] pt-1.5 text-[10px] text-amber-400 font-semibold flex items-start gap-1">
                <span>⚠️ Volume Capped: 24h market volume ({item.volume.toLocaleString()}) is below the 4h buy limit ({item.buy_limit.toLocaleString()}).</span>
              </div>
            )}

            <div className="border-t border-[#2f2f35] pt-1 text-[10px] text-neutral-500 italic">
              💡 Click row to copy bid price. Click cart icon to add to 8-slot GE bar.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Global Market Timing Function matching desktop gui.py get_market_timing_info
function getMarketTimingInfo() {
  const now = new Date();
  const utcHours = now.getUTCHours() + now.getUTCMinutes() / 60.0;
  const timeStr = `${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')} UTC`;

  if (utcHours >= 14.0 && utcHours < 22.0) {
    let pct = Math.round(75 + 25 * (1.0 - Math.abs(utcHours - 18.0) / 4.0));
    pct = Math.max(75, Math.min(100, pct));
    const estPlayers = `~${Math.round(115000 + (pct - 75) * 1800).toLocaleString()} online`;
    const barN = Math.round(pct / 10);
    const bar = "█".repeat(barN) + "░".repeat(10 - barN);
    return {
      timeStr,
      badge: "🟢 Peak Liquidity Window (Fast Fills & High Volume)",
      badgeColor: "text-emerald-400",
      activity: `Activity: [${bar}] ${pct}% (${estPlayers})`,
      advice: "💡 Market Tip: Prime EU/US trading hours! Buy orders fill in 2-5m. Best time for Fast Fills & Workhorses.",
      recCat: "fast"
    };
  } else if (utcHours >= 22.0 || utcHours < 2.0) {
    return {
      timeStr,
      badge: "🟡 Evening Wind-Down (Good for Setting Overnight Orders)",
      badgeColor: "text-amber-400",
      activity: "Activity: [██████░░░░] 65% (~95,000 online)",
      advice: "💡 Market Tip: US late evening. Volume tapering off. Queue up high-profit overnight bids.",
      recCat: "overnight"
    };
  } else if (utcHours >= 2.0 && utcHours < 10.0) {
    return {
      timeStr,
      badge: "🌙 Off-Peak / Sleepers Window (Wide Overnight Margins)",
      badgeColor: "text-purple-400",
      activity: "Activity: [████░░░░░░] 40% (~55,000 online)",
      advice: "💡 Market Tip: Lowest global player count. Patient low bids fill with zero competition from undercut sellers.",
      recCat: "overnight"
    };
  } else {
    return {
      timeStr,
      badge: "🌅 Morning Ramp-Up (Volume Building)",
      badgeColor: "text-blue-400",
      activity: "Activity: [██████░░░░] 60% (~85,000 online)",
      advice: "💡 Market Tip: European morning. Market liquidity is steadily accelerating towards afternoon peak.",
      recCat: "workhorse"
    };
  }
}

// Desktop gui.py parse_cash_input verbatim: supports 900k, 1.5m, 2b, etc.
function parseCashInput(text: string | number): number {
  if (typeof text === 'number') return isNaN(text) ? 0 : text;
  let str = String(text).trim().toUpperCase().replace(/,/g, '').replace(/\s+/g, '').replace(/GP/g, '');
  if (!str) return 0;
  let multiplier = 1;
  if (str.endsWith('K')) {
    multiplier = 1000;
    str = str.slice(0, -1);
  } else if (str.endsWith('M')) {
    multiplier = 1000000;
    str = str.slice(0, -1);
  } else if (str.endsWith('B')) {
    multiplier = 1000000000;
    str = str.slice(0, -1);
  }
  const val = parseFloat(str);
  return isNaN(val) ? 0 : Math.round(val * multiplier);
}

// Desktop gui.py format_gp verbatim
function formatGp(val: number | null | undefined): string {
  if (val === null || val === undefined || isNaN(val)) return '0 gp';
  const abs = Math.abs(val);
  if (abs >= 1000000) {
    return `${(val / 1000000).toFixed(2)}M gp`;
  } else if (abs >= 1000) {
    return `${val.toLocaleString()} gp`;
  }
  return `${val} gp`;
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
  const [copiedPlan, setCopiedPlan] = useState(false);
  const [copiedAdItem, setCopiedAdItem] = useState<string | null>(null);

  // Global Controls & Defaults (Matching desktop state.py DEFAULT_CONFIG)
  const [pricingStrategy, setPricingStrategy] = useState<'patient' | 'smart' | 'instant'>('patient');
  const [natureRuneOverride, setNatureRuneOverride] = useState<number>(170);
  const [explorersRing, setExplorersRing] = useState(false); // 0 GP Nature Runes
  const [cashStack, setCashStack] = useState<number>(5000000); // 5.00M default
  const [maxSpend, setMaxSpend] = useState<number>(500000); // 500k default max spend per item
  const [minVolumeFilter, setMinVolumeFilter] = useState<number>(100); // 100 default in desktop app

  // Desktop App Members & F2P Checkboxes:
  // When membersEnabled=true & f2pOnly=false -> Members mode (shows both P2P & F2P items)
  // When f2pOnly=true -> F2P Only mode (shows ONLY F2P items)
  const [membersEnabled, setMembersEnabled] = useState<boolean>(true);
  const [f2pOnly, setF2pOnly] = useState<boolean>(false);

  // Advanced Filters Drawer (Matching desktop gui.py build_top_controls drawer)
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);
  const [unlimitedBudget, setUnlimitedBudget] = useState(false);
  const [cashInputRaw, setCashInputRaw] = useState<string>('5.00M');
  const [minProfitFilter, setMinProfitFilter] = useState<number>(0);
  const [speedFilter, setSpeedFilter] = useState<'All' | 'Fast' | 'Steady'>('All');
  const [hideMaxedCooldown, setHideMaxedCooldown] = useState(false);
  const [ownedNats, setOwnedNats] = useState<number>(0);
  const [lockedNatPrice, setLockedNatPrice] = useState<number | null>(null);
  const [nextRefreshSec, setNextRefreshSec] = useState<number>(60);
  const [toastMsg, setToastMsg] = useState<string | null>(null);

  // High Alch Search & Sort
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<'hourly_profit' | 'profit' | 'roi' | 'buy_limit' | 'buy_price' | 'highalch' | 'volume' | 'batch_profit'>('hourly_profit');
  const [sortAsc, setSortAsc] = useState(false);

  // High Alch Item Type Category Filters (Matching matches_alch_type_filter in gui.py)
  const [typeFilters, setTypeFilters] = useState<{ [key: string]: boolean }>({
    rune: true,
    addy: true,
    mith: true,
    dragon: true,
    jewel: true,
    bows: true,
    staves: true,
    barrows: true,
    other: true,
  });

  // Smart Picks Recommendation Category Radio (Matching desktop gui.py var_rec_cat)
  const [recCategory, setRecCategory] = useState<'workhorse' | 'fast' | 'batch' | 'overnight'>('workhorse');

  // Crafting Filters & Player Stats
  const [craftSearch, setCraftSearch] = useState('');
  const [craftSkillFilter, setCraftSkillFilter] = useState<string>('all');
  const [onlyUsableRecipes, setOnlyUsableRecipes] = useState(false);
  const [playerLevels, setPlayerLevels] = useState<{ [skill: string]: number }>({
    crafting: 99,
    smithing: 99,
    fletching: 99,
    magic: 99,
    herblore: 99,
    cooking: 99
  });

  // Overnight Optimizer Settings (Matching desktop gui.py:1861-1935)
  const [overnightBudget, setOvernightBudget] = useState<number>(5000000);
  const [overnightDuration, setOvernightDuration] = useState<number>(12); // 6, 8, 10, 12 hours
  const [overnightStrat, setOvernightStrat] = useState<'safe' | 'deep'>('safe');
  const [overnightSlots, setOvernightSlots] = useState<number>(8);
  const [overnightFocus, setOvernightFocus] = useState<string>('All');
  const [overnightAlchTime, setOvernightAlchTime] = useState<string>('1h');
  const [overnightMaxSlot, setOvernightMaxSlot] = useState<number | null>(500);
  const [overnightOwnedNat, setOvernightOwnedNat] = useState<boolean>(true);
  const [overnightSortCol, setOvernightSortCol] = useState<string>('slot_profit');
  const [overnightSortAsc, setOvernightSortAsc] = useState<boolean>(false);

  // Crafting Workshop Sub-tabs: GE Production vs Direct Alch vs Level Training Guide
  const [craftSubTab, setCraftSubTab] = useState<'ge_sell' | 'craft_alch' | 'guide'>('ge_sell');

  // Skilling Guide State (Smithing, Fletching, Crafting, Magic from skilling_guide.py)
  const [guideSkill, setGuideSkill] = useState<'Smithing' | 'Fletching' | 'Crafting' | 'Magic'>('Smithing');
  const [guideCurrentLevel, setGuideCurrentLevel] = useState<number>(1);
  const [guideTargetLevel, setGuideTargetLevel] = useState<number>(99);
  const [guideMembers, setGuideMembers] = useState<boolean>(true);
  const [guideStyleFilter, setGuideStyleFilter] = useState<'all' | 'fast' | 'profit' | 'afk'>('all');

  // Session & Activity Hub Sub-tabs (Live Session Ledger vs Alerts Watch vs Cloud Sync)
  const [activitySubTab, setActivitySubTab] = useState<'session' | 'alerts' | 'sync'>('session');
  const [sessionViewMode, setSessionViewMode] = useState<'consolidated' | 'detailed'>('detailed');
  const [showManualLogModal, setShowManualLogModal] = useState<boolean>(false);
  const [manualItemName, setManualItemName] = useState<string>('Rune 2h sword');
  const [manualQty, setManualQty] = useState<number>(100);
  const [manualBuyPrice, setManualBuyPrice] = useState<number>(37600);
  const [manualHighAlch, setManualHighAlch] = useState<number>(38400);

  // W308 Anvil Calculator
  const [w308CashStack, setW308CashStack] = useState<number>(5000000);
  const [w308SelectedItem, setW308SelectedItem] = useState<string>('Rune 2h sword');
  const [w308Role, setW308Role] = useState<'buyer' | 'seller'>('buyer');
  const [w308AgreedPrice, setW308AgreedPrice] = useState<number>(37600);
  const [w308Qty, setW308Qty] = useState<number>(132);
  const [w308SortCol, setW308SortCol] = useState<string>('profit_ea');
  const [w308SortAsc, setW308SortAsc] = useState<boolean>(false);

  // Smart Recommendations sorting state
  const [recSortCol, setRecSortCol] = useState<string>('profit_ea');
  const [recSortAsc, setRecSortAsc] = useState<boolean>(false);

  // Session Ledger State
  const [sessionLog, setSessionLog] = useState<Array<{
    id: string;
    timestamp: number;
    itemName: string;
    qty: number;
    price: number;
    totalCoins: number;
    netProfit: number;
    role: 'buyer' | 'seller' | 'alch';
    magicXp?: number;
    skill?: string;
    skillXp?: number;
  }>>([]);

  // Bond Roadmap Interactive State (stored in localStorage)
  const [userCoins, setUserCoins] = useState<number>(0);
  const [userNats, setUserNats] = useState<number>(0);
  const [userBatchValue, setUserBatchValue] = useState<number>(0);

  // 4h Timers State (stored in localStorage)
  const [timers, setTimers] = useState<Array<{ id: number; name: string; expiresAt: number; limit: number }>>([]);
  const [timerItemSearch, setTimerItemSearch] = useState('');

  // 8-Slot Shopping Cart State (stored in localStorage)
  const [cartItems, setCartItems] = useState<Array<{ id: number; name: string; buyPrice: number; limit: number; profit: number }>>([]);

  // Sync Token & Webhook Testing State
  const [syncToken, setSyncToken] = useState<string>('');
  const [showToken, setShowToken] = useState(false);
  const [tokenCopied, setTokenCopied] = useState(false);
  const [testSyncStatus, setTestSyncStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testSyncMsg, setTestSyncMsg] = useState<string>('');

  // Effective Nature Rune Cost
  const effectiveNatPrice = explorersRing ? 0 : natureRuneOverride;

  // Load saved state from localStorage
  useEffect(() => {
    try {
      const savedCoins = localStorage.getItem('alchmate_coins');
      if (savedCoins) setUserCoins(Number(savedCoins));
      const savedNats = localStorage.getItem('alchmate_nats');
      if (savedNats) setUserNats(Number(savedNats));
      const savedBatch = localStorage.getItem('alchmate_batch');
      if (savedBatch) setUserBatchValue(Number(savedBatch));
      const savedCash = localStorage.getItem('alchmate_cash_stack');
      if (savedCash) setCashStack(Number(savedCash));
      const savedToken = localStorage.getItem('alchmate_sync_token');
      if (savedToken) {
        setSyncToken(savedToken);
      } else {
        const initToken = 'alch_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
        setSyncToken(initToken);
        localStorage.setItem('alchmate_sync_token', initToken);
      }
      const savedTimers = localStorage.getItem('alchmate_timers');
      if (savedTimers) setTimers(JSON.parse(savedTimers));
      const savedCart = localStorage.getItem('alchmate_cart');
      if (savedCart) setCartItems(JSON.parse(savedCart));
      const savedLevels = localStorage.getItem('alchmate_player_levels');
      if (savedLevels) setPlayerLevels(JSON.parse(savedLevels));
      const savedSessions = localStorage.getItem('alchmate_session_log');
      if (savedSessions) setSessionLog(JSON.parse(savedSessions));
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
  const handleUpdateCashStack = (val: number) => {
    setCashStack(val);
    localStorage.setItem('alchmate_cash_stack', val.toString());
  };
  const handleUpdatePlayerLevel = (skill: string, lvl: number) => {
    const updated = { ...playerLevels, [skill.toLowerCase()]: lvl };
    setPlayerLevels(updated);
    localStorage.setItem('alchmate_player_levels', JSON.stringify(updated));
  };
  const handleGenerateNewToken = () => {
    const newToken = 'alch_' + Math.random().toString(36).substring(2, 10) + Math.random().toString(36).substring(2, 10);
    setSyncToken(newToken);
    localStorage.setItem('alchmate_sync_token', newToken);
  };
  const handleCopyToken = () => {
    navigator.clipboard.writeText(syncToken);
    setTokenCopied(true);
    setTimeout(() => setTokenCopied(false), 2000);
  };

  // Toggle Cart item
  const handleToggleCart = (item: { id: number; name: string; buy_price: number; buy_limit: number; profit: number }) => {
    const exists = cartItems.some(c => c.id === item.id);
    let updated: Array<{ id: number; name: string; buyPrice: number; limit: number; profit: number }>;
    if (exists) {
      updated = cartItems.filter(c => c.id !== item.id);
    } else {
      if (cartItems.length >= 8) {
        alert('All 8 Grand Exchange slots are already in your cart! Clear or remove an item to add this one.');
        return;
      }
      updated = [...cartItems, { id: item.id, name: item.name, buyPrice: item.buy_price, limit: item.buy_limit, profit: item.profit }];
    }
    setCartItems(updated);
    localStorage.setItem('alchmate_cart', JSON.stringify(updated));
  };

  // Auto-Fill Empty GE Slots matching desktop gui.py auto_fill_ge_slots
  const handleAutoFillGeSlots = () => {
    const emptySlots = 8 - cartItems.length;
    if (emptySlots <= 0) {
      alert('All 8 Grand Exchange slots are already filled in your Shopping Cart (8/8)! Clear or remove items before auto-filling.');
      return;
    }

    const currentAllocated = cartItems.reduce((acc, c) => acc + (c.buyPrice * c.limit), 0);
    const availableBudget = unlimitedBudget ? 999999999 : Math.max(0, cashStack - currentAllocated);

    if (!unlimitedBudget && availableBudget < 5000) {
      alert(`Your Cash Stack (${formatGp(cashStack)}) is already fully allocated across existing cart items. Increase your budget or clear items!`);
      return;
    }

    // Candidate selection based on current recommendation category
    let pool: typeof filteredAlchItems = [];
    if (recCategory === 'workhorse') {
      const whIds = new Set((workhorseItemsData as any[]).map(w => w.id));
      pool = filteredAlchItems.filter(it => whIds.has(it.id));
    } else if (recCategory === 'fast') {
      pool = filteredAlchItems.filter(it => it.volume >= 5000);
    } else if (recCategory === 'batch') {
      pool = [...filteredAlchItems].sort((a, b) => b.batch_profit - a.batch_profit);
    } else {
      pool = filteredAlchItems.filter(it => it.volume >= 500 && it.buy_limit >= 70);
    }

    const inCartIds = new Set(cartItems.map(c => c.id));
    const candidates = pool.filter(it => !inCartIds.has(it.id) && it.profit > 0 && it.buy_price <= availableBudget);

    if (candidates.length === 0) {
      alert('No eligible recommendation items found that fit into your remaining budget.');
      return;
    }

    const toAdd = candidates.slice(0, emptySlots).map(it => ({
      id: it.id,
      name: it.name,
      buyPrice: it.buy_price,
      limit: it.buy_limit,
      profit: it.profit
    }));

    const updated = [...cartItems, ...toAdd];
    setCartItems(updated);
    localStorage.setItem('alchmate_cart', JSON.stringify(updated));
    showToast(`⚡ Auto-Filled ${toAdd.length} GE Slots into your Cart!`);
  };

  // Floating Toast helper matching desktop FloatingToast
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setTimeout(() => setToastMsg(null), 3000);
  };

  // Fetch live prices on load and countdown timer
  useEffect(() => {
    async function fetchPrices() {
      try {
        setLoading(true);
        const res = await fetch('/api/prices');
        const data = await res.json();
        setPriceData(data);
        if (data.nature_rune && !lockedNatPrice) {
          setNatureRuneOverride(data.nature_rune);
        }
        setNextRefreshSec(60);
      } catch (err) {
        console.error('Failed to load prices', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPrices();

    const secTimer = setInterval(() => {
      setNextRefreshSec(prev => {
        if (prev <= 1) {
          fetchPrices();
          return 60;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(secTimer);
  }, [lockedNatPrice]);

  // Helper matching desktop matches_alch_type_filter
  const matchesAlchType = (itemName: string): boolean => {
    const name = itemName.toLowerCase();
    if (name.includes('rune ') || name.startsWith('rune ') || name.includes('runite')) {
      return typeFilters.rune;
    }
    if (name.includes('adamant ') || name.startsWith('adamant ') || name.includes('addy ') || name.includes('adamantite')) {
      return typeFilters.addy;
    }
    if (name.includes('mithril ') || name.startsWith('mithril ') || name.includes('mith ')) {
      return typeFilters.mith;
    }
    if (name.includes('dragon ') || name.startsWith('dragon ')) {
      return typeFilters.dragon;
    }
    if (['bracelet', 'necklace', 'amulet', 'ring', 'tiara', 'zenyte', 'onyx', 'diamond', 'ruby', 'emerald', 'sapphire'].some(w => name.includes(w))) {
      return typeFilters.jewel;
    }
    if (['longbow', 'shortbow', 'comp bow', 'crossbow', 'bolts', 'arrow', 'dart', 'javelin', 'thrownaxe'].some(w => name.includes(w))) {
      return typeFilters.bows;
    }
    if (['battlestaff', 'mystic', 'staff', 'wand', 'robe', 'hood', 'robes'].some(w => name.includes(w))) {
      return typeFilters.staves;
    }
    if (['dharok', 'guthan', 'karil', 'torag', 'ahrim', 'verac', 'obsidian', 'granite'].some(w => name.includes(w))) {
      return typeFilters.barrows;
    }
    if (name.includes("d'hide") || name.includes('dragonhide') || name.includes('leather')) {
      return typeFilters.bows || typeFilters.other;
    }
    return typeFilters.other;
  };

  // Helper for fill speed (matching api.py)
  const getFillSpeedInfo = (vol: number) => {
    if (vol >= 5000) return { label: '⚡ Fast', color: 'text-amber-400' };
    if (vol >= 500) return { label: '⏱️ Steady', color: 'text-cyan-400' };
    return { label: '🐢 Slow', color: 'text-neutral-500' };
  };

  // Filtered & Sorted Alch Items (Matching desktop recalculate_alch_table)
  const filteredAlchItems = useMemo(() => {
    if (!priceData?.items) return [];

    return priceData.items
      .map((item) => {
        // Strategy pricing matching desktop:
        // 'patient' = bid (p.low)
        // 'smart' = bid + 1 (if ask > bid)
        // 'instant' = ask (p.high)
        let targetBuy = item.bid || item.buy_price;
        if (pricingStrategy === 'smart') {
          if (item.ask > item.bid && item.bid > 0) {
            targetBuy = item.bid + 1;
          } else {
            targetBuy = item.bid || item.buy_price;
          }
        } else if (pricingStrategy === 'instant') {
          targetBuy = item.ask || item.buy_price;
        }

        const currentProfit = item.highalch - targetBuy - effectiveNatPrice;
        const effectiveLimit = item.buy_limit || 70;
        const batchProfit = currentProfit * effectiveLimit;
        const maxAfford = targetBuy > 0 ? Math.min(effectiveLimit, Math.floor(cashStack / targetBuy)) : 0;
        const speed = getFillSpeedInfo(item.volume);

        return {
          ...item,
          buy_price: targetBuy,
          profit: currentProfit,
          hourly_profit: currentProfit * 1200,
          batch_profit: batchProfit,
          max_afford: maxAfford,
          speed: speed,
          roi: targetBuy > 0 ? (currentProfit / targetBuy) * 100 : 0
        };
      })
      .filter((item) => {
        // 1. Members / F2P Logic (exact desktop match):
        // If F2P Only is checked, hide members items.
        if (f2pOnly && item.members) return false;
        // If neither is enabled, return false
        if (!membersEnabled && !f2pOnly) return false;

        // 2. Volume filter
        if (minVolumeFilter > 0 && item.volume < minVolumeFilter && !searchQuery) return false;

        // 3. Max Spend filter (skipped if unlimitedBudget is checked)
        if (!unlimitedBudget && maxSpend > 0 && item.buy_price > maxSpend) return false;

        // 4. Min Profit filter
        if (minProfitFilter > 0 && item.profit < minProfitFilter) return false;

        // 5. Fill Speed filter
        if (speedFilter === 'Fast' && !item.speed.label.includes('Fast')) return false;
        if (speedFilter === 'Steady' && !item.speed.label.includes('Steady') && !item.speed.label.includes('Fast')) return false;

        // 6. Hide Maxed Cooldown (hides if active 4h timer exists)
        if (hideMaxedCooldown) {
          const hasActiveTimer = timers.some(t => t.id === item.id && t.expiresAt > Date.now());
          if (hasActiveTimer) return false;
        }

        // 7. Item Type category filter
        if (!matchesAlchType(item.name)) return false;

        // 8. Search query
        if (searchQuery) {
          return item.name.toLowerCase().includes(searchQuery.toLowerCase());
        }
        return true;
      })
      .sort((a, b) => {
        const factor = sortAsc ? 1 : -1;
        return (a[sortBy] - b[sortBy]) * factor;
      });
  }, [priceData, searchQuery, membersEnabled, f2pOnly, minVolumeFilter, maxSpend, unlimitedBudget, minProfitFilter, speedFilter, hideMaxedCooldown, timers, typeFilters, effectiveNatPrice, pricingStrategy, cashStack, sortBy, sortAsc]);

  // Overnight Multi-Pass Greedy Knapsack Optimizer (Matching desktop gui.py:7651)
  const overnightResult = useMemo(() => {
    const latest = priceData?.latest || {};
    const cycles = (overnightDuration >= 10 ? 3 : 2);
    const natCost = overnightOwnedNat ? 0 : effectiveNatPrice;
    const totalBudget = unlimitedBudget ? 999999999 : (overnightBudget || cashStack);

    let maxCasts: number | null = null;
    if (overnightAlchTime === '30m') maxCasts = 600;
    else if (overnightAlchTime === '45m') maxCasts = 900;
    else if (overnightAlchTime === '1h') maxCasts = 1200;
    else if (overnightAlchTime === '2h') maxCasts = 2400;
    else if (overnightAlchTime === '3h') maxCasts = 3600;

    const maxPerItem = overnightMaxSlot;

    // Filter candidate pool
    const candidates = (overnightCandidatesData as any[]).filter((it) => {
      const isMem = it.members;
      if (!membersEnabled && isMem) return false;
      if (f2pOnly && isMem) return false;

      const grp = it.group || '';
      const nameLower = it.name.toLowerCase();
      const baseLimit = it.limit || 70;

      const isBulkFocus = overnightFocus === 'Battlestaves' || overnightFocus === 'Stackables';
      if (!isBulkFocus && !searchQuery && baseLimit > 250) return false;

      if (overnightFocus === 'Rune Heavy') {
        if (grp !== 'rune' && !nameLower.includes('rune')) return false;
      } else if (overnightFocus === 'Adamant') {
        if (grp !== 'adamant' && !nameLower.includes('adamant')) return false;
      } else if (overnightFocus === 'Battlestaves') {
        if (grp !== 'staff' && !nameLower.includes('staff')) return false;
      } else if (overnightFocus === 'Stackables') {
        if (grp !== 'bolt' && grp !== 'ammo' && !nameLower.includes('bolt')) return false;
      }

      if (searchQuery) {
        if (!nameLower.includes(searchQuery.toLowerCase()) && !it.verdict.toLowerCase().includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      return true;
    });

    // Compute bids and valid items
    const validItems = candidates.map((it) => {
      const iid = String(it.id);
      const platest = latest[iid] || {};
      const curLow = platest.low || platest.high || (it.alch - 500);

      // Safe bid: 25th percentile of 48h lows + 5 gp (~curLow * 0.985)
      // Deep bid: 10th percentile of 48h lows with 7d floor clamp (~curLow * 0.965)
      const bid = overnightStrat === 'deep' ? Math.floor(curLow * 0.965) : Math.floor(curLow * 0.985);
      const profEa = it.alch - bid - natCost;

      let periodLimit = (it.limit || 70) * cycles;
      if (maxPerItem) periodLimit = Math.min(periodLimit, maxPerItem);
      if (maxCasts) periodLimit = Math.min(periodLimit, maxCasts);

      const roi = profEa / Math.max(1, bid);
      const conf = overnightStrat === 'deep' ? '75% (Moderate)' : '95% (High)';

      return {
        id: it.id,
        name: it.name,
        bid,
        alch: it.alch,
        profit_ea: profEa,
        period_limit: periodLimit,
        roi,
        period_profit: profEa * periodLimit,
        period_cost: bid * periodLimit,
        verdict: it.verdict,
        conf,
      };
    }).filter(it => it.bid > 0 && it.profit_ea > 0);

    // Multi-pass greedy knapsack
    const passes = [
      [...validItems].sort((a, b) => b.profit_ea - a.profit_ea), // Pass 1: highest profit per cast
      [...validItems].sort((a, b) => b.roi - a.roi),             // Pass 2: highest ROI
      [...validItems].sort((a, b) => b.period_profit - a.period_profit), // Pass 3: highest batch profit
    ];

    let bestAlloc: Array<any> = [];
    let bestProfit = -1;
    let bestSpend = 0;

    for (const candidateList of passes) {
      let remBudget = totalBudget;
      let remCasts = maxCasts || 999999999;
      const curAlloc: Array<any> = [];
      let totSpend = 0;
      let totProf = 0;

      for (const it of candidateList) {
        if (curAlloc.length >= overnightSlots || remCasts <= 0) break;
        const canBuy = Math.min(it.period_limit, remCasts, Math.floor(remBudget / it.bid));
        if (canBuy > 0) {
          const cost = canBuy * it.bid;
          const prof = canBuy * it.profit_ea;
          remBudget -= cost;
          remCasts -= canBuy;
          totSpend += cost;
          totProf += prof;
          curAlloc.push({
            ...it,
            qty: canBuy,
            cost,
            profit: prof,
          });
        }
      }

      if (totProf > bestProfit) {
        bestProfit = totProf;
        bestAlloc = curAlloc;
        bestSpend = totSpend;
      }
    }

    const allocMap = new Map(bestAlloc.map(a => [a.id, a]));
    const totalItems = bestAlloc.reduce((acc, a) => acc + a.qty, 0);
    const leftoverGp = Math.max(0, totalBudget - bestSpend);
    const alchMins = Math.round(totalItems / 20); // 1,200 casts/hr = 20/min
    const hourlyRate = alchMins > 0 ? (bestProfit / (alchMins / 60)) : bestProfit;

    // Full table items: allocated first, then remaining candidates
    const tableItems = validItems.map((it) => {
      const allocated = allocMap.get(it.id);
      return {
        ...it,
        isAllocated: !!allocated,
        alloc_qty: allocated ? allocated.qty : 0,
        total_cost: allocated ? allocated.cost : it.period_cost,
        slot_profit: allocated ? allocated.profit : it.period_profit,
      };
    }).sort((a, b) => {
      let valA: any = a[overnightSortCol as keyof typeof a];
      let valB: any = b[overnightSortCol as keyof typeof b];
      if (typeof valA === 'string') {
        return overnightSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = valA || 0;
      valB = valB || 0;
      return overnightSortAsc ? valA - valB : valB - valA;
    });

    return {
      alloc: bestAlloc,
      totalSpend: bestSpend,
      totalProfit: bestProfit > 0 ? bestProfit : 0,
      totalItems,
      leftoverGp,
      alchMins,
      hourlyRate,
      tableItems,
    };
  }, [priceData, overnightDuration, overnightStrat, overnightSlots, overnightFocus, overnightAlchTime, overnightMaxSlot, overnightOwnedNat, membersEnabled, f2pOnly, searchQuery, effectiveNatPrice, cashStack, unlimitedBudget, overnightBudget, overnightSortCol, overnightSortAsc]);

  const toggleSortOvernight = (col: string) => {
    if (overnightSortCol === col) {
      setOvernightSortAsc(!overnightSortAsc);
    } else {
      setOvernightSortCol(col);
      setOvernightSortAsc(false);
    }
  };

  const handleSendOvernightBagToCart = () => {
    if (!overnightResult.alloc || overnightResult.alloc.length === 0) {
      alert('Please configure your overnight bag first.');
      return;
    }
    const toAdd = overnightResult.alloc.slice(0, 8).map(it => ({
      id: it.id,
      name: it.name,
      buyPrice: it.bid,
      limit: it.qty,
      profit: it.profit_ea
    }));
    const updated = [...cartItems.filter(c => !toAdd.some(a => a.id === c.id)), ...toAdd].slice(0, 8);
    setCartItems(updated);
    localStorage.setItem('alchmate_cart', JSON.stringify(updated));
    showToast(`🛒 Sent ${toAdd.length} overnight items directly to your GE Shopping Cart!`);
  };

  const handleCopyOvernightPlan = () => {
    if (!overnightResult.alloc || overnightResult.alloc.length === 0) return;
    const lines = [
      `=== OSRS GE Overnight Plan (${overnightDuration}h Window - ${overnightDuration >= 10 ? '3x' : '2x'} Limits) ===`,
      `Budget: ${formatGp(cashStack)} | Allocated: ${formatGp(overnightResult.totalSpend)} | Expected Profit: +${formatGp(overnightResult.totalProfit)}`,
      '',
      ...overnightResult.alloc.map((it, idx) => `Slot #${idx + 1}: ${it.name} | Bid: ${it.bid.toLocaleString()} gp | Qty: ${it.qty.toLocaleString()} | Total: ${it.cost.toLocaleString()} gp | Profit: +${it.profit.toLocaleString()} gp (${it.conf})`)
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    setCopiedPlan(true);
    showToast('📋 Copied formatted overnight buy orders to clipboard!');
    setTimeout(() => setCopiedPlan(false), 2000);
  };

  // Official OSRS Level to XP calculation formula (matches skilling_guide.py:7)
  const getXpForLevel = (lvl: number) => {
    if (lvl <= 1) return 0;
    let total = 0;
    for (let i = 1; i < lvl; i++) {
      total += Math.floor(i + 300.0 * Math.pow(2.0, i / 7.0));
    }
    return Math.floor(total / 4);
  };

  const handleAddManualSession = () => {
    if (manualQty <= 0 || manualBuyPrice <= 0) {
      alert('Please enter valid quantity and price greater than 0.');
      return;
    }
    const totalCoins = manualQty * manualBuyPrice;
    const totalAlch = manualQty * manualHighAlch;
    const totalNats = manualQty * effectiveNatPrice;
    const netProfit = totalAlch - totalCoins - totalNats;
    const magicXp = manualQty * 65;

    const entry = {
      id: 'manual_' + Date.now(),
      timestamp: Date.now(),
      itemName: manualItemName,
      qty: manualQty,
      price: manualBuyPrice,
      totalCoins,
      netProfit,
      role: 'alch' as const,
      magicXp,
    };
    const updated = [entry, ...sessionLog];
    setSessionLog(updated);
    localStorage.setItem('alchmate_session_log', JSON.stringify(updated));
    setShowManualLogModal(false);
    showToast(`✓ Logged ${manualQty.toLocaleString()}x ${manualItemName} manual alch session!`);
  };

  const handleExportSessionCSV = () => {
    if (sessionLog.length === 0) {
      alert('No sessions recorded in your ledger yet.');
      return;
    }
    const headers = ['Timestamp', 'Item Name', 'Role', 'Quantity', 'Buy Price (ea)', 'Total Coins', 'Net Profit', 'Magic XP'];
    const rows = sessionLog.map(s => [
      new Date(s.timestamp).toISOString(),
      s.itemName,
      s.role,
      s.qty,
      s.price,
      s.totalCoins,
      s.netProfit,
      s.magicXp || 0
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `alchmate_session_ledger_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('📥 Downloaded Session Ledger CSV!');
  };

  const handleClearSession = () => {
    if (confirm('Are you sure you want to clear your Session Ledger?')) {
      setSessionLog([]);
      localStorage.removeItem('alchmate_session_log');
      showToast('Session Ledger cleared.');
    }
  };

  const handleDeleteSessionItem = (id: string) => {
    const updated = sessionLog.filter(s => s.id !== id);
    setSessionLog(updated);
    localStorage.setItem('alchmate_session_log', JSON.stringify(updated));
    showToast('Removed entry from Session Ledger.');
  };

  const handleSelectManualItem = (itemName: string) => {
    setManualItemName(itemName);
    if (priceData?.items) {
      const match = priceData.items.find(i => i.name.toLowerCase() === itemName.toLowerCase());
      if (match) {
        setManualBuyPrice(match.buy_price || match.bid);
        setManualHighAlch(match.highalch);
      }
    }
  };

  // OSRS Offer-X In-Game Trade Shorthand (e.g. 7580k, 15m)
  const getOfferXShorthand = (amount: number) => {
    if (amount <= 0) return '0';
    if (amount % 1000000 === 0) return `${amount / 1000000}m`;
    if (amount % 1000 === 0) return `${amount / 1000}k`;
    return amount.toLocaleString();
  };

  // Material cost calculation for W308 items supporting primary and secondary materials (matches gui.py:2056)
  const getW308MatCost = useCallback((it: any) => {
    if (!it || !it.skill) return { totalCost: 0, desc: 'Not craftable / monster drop' };
    const matId = it.mat_id;
    if (!matId) return { totalCost: 0, desc: 'No raw materials required' };
    const latest = priceData?.latest || {};
    const qty1 = it.mat_qty || 1;
    const ge1 = latest[String(matId)];
    const p1 = ge1?.high || ge1?.low || it.mat_default || 0;
    let totalCost = qty1 * p1;
    let desc = `${qty1}x ${it.mat_name} (${p1.toLocaleString()} ea)`;

    if (it.mat2_id) {
      const qty2 = it.mat2_qty || 1;
      const ge2 = latest[String(it.mat2_id)];
      const p2 = ge2?.high || ge2?.low || it.mat2_default || 0;
      totalCost += qty2 * p2;
      desc += ` + ${qty2}x ${it.mat2_name} (${p2.toLocaleString()} ea)`;
    }
    return { totalCost, desc };
  }, [priceData]);

  // W308 Anvil Bulk Margins Sheet (Uses all staples from desktop gui.py)
  const w308Items = useMemo(() => {
    const latest = priceData?.latest || {};
    const activeBudget = unlimitedBudget ? 999999999 : cashStack;
    const list = (w308StaplesData as any[]).map((st) => {
      const iid = String(st.id);
      const latestPrice = latest[iid]?.high || latest[iid]?.low || st.w308_buy;
      const w308BuyPrice = st.w308_buy;
      const w308SellP2P = st.w308_sell_p2p || st.w308_buy;

      // Buyer mode: Player buys bulk in W308, High Alchs them
      const profitBuyer = st.alch - w308BuyPrice - effectiveNatPrice;
      const batch1kProfitBuyer = profitBuyer * 1000;

      // Seller mode: Player crafts/smiths items, sells bulk in W308
      const { totalCost: matCost, desc: matDesc } = getW308MatCost(st);
      const profitSeller = w308SellP2P - matCost;

      const tradePrice = w308Role === 'buyer' ? w308BuyPrice : w308SellP2P;
      const maxBudgetStack = tradePrice > 0 ? Math.floor(activeBudget / tradePrice) : 0;
      const totalSpend = maxBudgetStack * tradePrice;
      const profitEa = w308Role === 'buyer' ? profitBuyer : profitSeller;
      const expectedProfit = maxBudgetStack * profitEa;
      const marginPct = (w308Role === 'buyer'
        ? (w308BuyPrice > 0 ? (profitBuyer / w308BuyPrice) * 100 : 0)
        : (matCost > 0 ? (profitSeller / matCost) * 100 : 0)
      );

      const pAd = (tradePrice / 1000) % 1 === 0 ? `${tradePrice / 1000}k` : `${(tradePrice / 1000).toFixed(1)}k`;
      const chatAd = w308Role === 'buyer'
        ? `Buying ${st.short || st.name} ${pAd} ea Bulk - Trade Me`
        : `Selling ${st.short || st.name} ${pAd} ea Bulk - Trade Me`;

      return {
        ...st,
        ge_price: latestPrice,
        w308_price: w308BuyPrice,
        w308_sell_price: w308SellP2P,
        trade_price: tradePrice,
        profit_ea: profitEa,
        margin_pct: marginPct,
        max_stack: maxBudgetStack,
        total_spend: totalSpend,
        expected_profit: expectedProfit,
        chat_ad: chatAd,
        batch_1k_profit: w308Role === 'buyer' ? batch1kProfitBuyer : profitSeller * 1000,
        mat_cost: matCost,
        mat_desc: matDesc,
      };
    });

    return list.sort((a, b) => {
      let valA: any = a[w308SortCol as keyof typeof a];
      let valB: any = b[w308SortCol as keyof typeof b];
      if (typeof valA === 'string') {
        return w308SortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = valA || 0;
      valB = valB || 0;
      return w308SortAsc ? valA - valB : valB - valA;
    });
  }, [priceData, effectiveNatPrice, w308Role, getW308MatCost, unlimitedBudget, cashStack, w308SortCol, w308SortAsc]);

  const toggleSortW308 = (col: string) => {
    if (w308SortCol === col) {
      setW308SortAsc(!w308SortAsc);
    } else {
      setW308SortCol(col);
      setW308SortAsc(false);
    }
  };

  const toggleSortRec = (col: string) => {
    if (recSortCol === col) {
      setRecSortAsc(!recSortAsc);
    } else {
      setRecSortCol(col);
      setRecSortAsc(false);
    }
  };

  // Active selected W308 Staple object
  const activeW308Staple = useMemo(() => {
    return (w308StaplesData as any[]).find(it => it.name === w308SelectedItem) || (w308StaplesData as any[])[0];
  }, [w308SelectedItem]);

  // Handle item change in W308 validator
  const handleSelectW308Item = (itemName: string) => {
    setW308SelectedItem(itemName);
    const item = (w308StaplesData as any[]).find(it => it.name === itemName);
    if (item) {
      const initialPrice = w308Role === 'buyer' ? item.w308_buy : (item.w308_sell_p2p || item.w308_buy);
      setW308AgreedPrice(initialPrice);
      const safeQty = initialPrice > 0 ? Math.max(1, Math.floor(cashStack / initialPrice)) : 100;
      setW308Qty(safeQty);
    }
  };

  // Fractions in W308 validator
  const handleSetW308Fraction = (fraction: number) => {
    const budget = fraction * cashStack;
    const price = w308AgreedPrice > 0 ? w308AgreedPrice : 1;
    const qty = Math.max(1, Math.floor(budget / price));
    setW308Qty(qty);
  };

  // Computed W308 2nd Screen Validator Totals (matches desktop gui.py:2624)
  const validatorTotals = useMemo(() => {
    const item = activeW308Staple;
    const qty = w308Qty > 0 ? w308Qty : 0;
    const price = w308AgreedPrice > 0 ? w308AgreedPrice : 0;
    const totalCoins = qty * price;
    const shorthand = getOfferXShorthand(totalCoins);
    const pAd = (price / 1000) % 1 === 0 ? `${price / 1000}k` : `${(price / 1000).toFixed(1)}k`;
    const shortName = item?.short || item?.name || 'Item';

    if (w308Role === 'buyer') {
      const totalAlch = qty * (item?.alch || 0);
      const totalNats = qty * effectiveNatPrice;
      const netProfit = totalAlch - totalCoins - totalNats;
      const profitEa = qty > 0 ? Math.floor(netProfit / qty) : 0;
      const remainingCash = cashStack - totalCoins;
      const adText = `Buying ${qty.toLocaleString()} ${shortName} ${pAd} ea Bulk - Trade Me`;

      return {
        totalCoins,
        shorthand,
        totalAlch,
        totalNats,
        netProfit,
        profitEa,
        remainingCash,
        adText,
        overBudget: remainingCash < 0,
        deficit: Math.abs(remainingCash),
      };
    } else {
      const { totalCost: matCostEa, desc: matDesc } = getW308MatCost(item);
      const totalMatCost = qty * matCostEa;
      const netProfit = totalCoins - totalMatCost;
      const profitEa = qty > 0 ? Math.floor(netProfit / qty) : 0;
      const marginPct = matCostEa > 0 ? (profitEa / matCostEa) * 100 : 0;
      const xpEa = item?.xp || 0;
      const totalXp = Math.floor(qty * xpEa);
      const skill = item?.skill || 'Smithing';
      const remainingBudget = cashStack - totalMatCost;
      const adText = `Selling ${qty.toLocaleString()} ${shortName} ${pAd} ea Bulk - Trade Me`;

      return {
        totalCoins,
        shorthand,
        matCostEa,
        matDesc,
        totalMatCost,
        netProfit,
        profitEa,
        marginPct,
        totalXp,
        xpEa,
        skill,
        remainingBudget,
        adText,
        overBudget: remainingBudget < 0,
        deficit: Math.abs(remainingBudget),
      };
    }
  }, [activeW308Staple, w308Qty, w308AgreedPrice, w308Role, effectiveNatPrice, cashStack, getW308MatCost]);

  const handleCopyTradeShorthand = () => {
    navigator.clipboard.writeText(validatorTotals.shorthand);
    showToast(`⌨️ Offer-X: Type '${validatorTotals.shorthand}' in Trade Screen (${validatorTotals.totalCoins.toLocaleString()} gp)`);
  };

  const handleCopyValidatorAd = () => {
    navigator.clipboard.writeText(validatorTotals.adText);
    showToast(`📢 Copied trade ad: "${validatorTotals.adText}"`);
  };

  const handleLogW308ToSession = () => {
    if (w308Qty <= 0 || w308AgreedPrice <= 0) {
      alert('Please enter a valid quantity and price greater than 0.');
      return;
    }
    const entry = {
      id: 'w308_' + Date.now(),
      timestamp: Date.now(),
      itemName: activeW308Staple?.name || 'Bulk Item',
      qty: w308Qty,
      price: w308AgreedPrice,
      totalCoins: validatorTotals.totalCoins,
      netProfit: validatorTotals.netProfit,
      role: w308Role,
      magicXp: w308Role === 'buyer' ? w308Qty * 65 : 0,
      skill: w308Role === 'seller' ? (validatorTotals as any).skill : undefined,
      skillXp: w308Role === 'seller' ? (validatorTotals as any).totalXp : undefined,
    };
    const updated = [entry, ...sessionLog];
    setSessionLog(updated);
    localStorage.setItem('alchmate_session_log', JSON.stringify(updated));
    showToast(`✓ Logged ${w308Qty.toLocaleString()}x ${activeW308Staple?.name} trade to Session Tracker!`);
  };

  // Smart Recommendations Table Rows (Matching desktop gui.py recalculate_rec_table)
  const recRows = useMemo(() => {
    const latest = priceData?.latest || {};
    const volumes = (priceData as any)?.volumes || {};
    const maxSpend = unlimitedBudget ? 999999999 : cashStack;
    const query = searchQuery.trim().toLowerCase();

    let items: Array<{
      id: number;
      name: string;
      category: string;
      target_bid: number;
      alch_val: number;
      profit_ea: number;
      limit: number;
      batch_profit: number;
      speed: string;
      batch_cost: number;
      verdict: string;
    }> = [];

    if (recCategory === 'workhorse') {
      items = (workhorseItemsData as any[])
        .map((spec) => {
          const iid = String(spec.id);
          const itemData = filteredAlchItems.find((i) => i.id === spec.id);
          const pData = latest[iid] || {};
          const buyPrice = pData.low || pData.high || (itemData ? itemData.buy_price : 0);
          const highAlch = itemData?.highalch || (spec.name.includes('2h') || spec.name.includes('legs') || spec.name.includes('skirt') ? 38400 : 30000);
          const profit = highAlch - buyPrice - effectiveNatPrice;
          const baseLimit = spec.limit || 70;
          const vol = volumes[iid] || (itemData ? itemData.volume : 5000);
          const batchProfit = profit * baseLimit;
          const batchCost = buyPrice * baseLimit;
          const speedBadge = vol > 10000 ? '⚡ Instant' : vol > 2000 ? '🟢 Rapid' : '🟡 Moderate';

          return {
            id: spec.id,
            name: spec.name,
            category: '🏆 Workhorse',
            target_bid: buyPrice,
            alch_val: highAlch,
            profit_ea: profit,
            limit: baseLimit,
            batch_profit: batchProfit,
            speed: speedBadge,
            batch_cost: batchCost,
            verdict: spec.verdict,
          };
        })
        .filter((row) => {
          if (query && !row.name.toLowerCase().includes(query) && !row.verdict.toLowerCase().includes(query)) return false;
          return true;
        });
    } else {
      // Dynamic candidates from filteredAlchItems
      items = filteredAlchItems
        .filter((it) => {
          if (it.profit <= 0) return false;
          if (it.buy_price > maxSpend) return false;
          if (query && !it.name.toLowerCase().includes(query)) return false;

          if (recCategory === 'fast') {
            return it.volume >= 5000;
          } else if (recCategory === 'batch') {
            return it.buy_limit >= 10 && it.batch_profit >= 10000;
          } else if (recCategory === 'overnight') {
            return it.profit >= 250 && it.buy_limit >= 15;
          }
          return true;
        })
        .map((it) => {
          let catLabel = 'Smart Pick';
          let verdict = 'Solid alch margin.';
          if (recCategory === 'fast') {
            catLabel = '⚡ Fast Fill';
            verdict = `⚡ High velocity: ${it.volume.toLocaleString()} 24h vol. Fills rapidly.`;
          } else if (recCategory === 'batch') {
            catLabel = '💰 Batch Profit';
            verdict = `💰 Top Batch Yield: Earns +${it.batch_profit.toLocaleString()} gp for full ${it.buy_limit} batch.`;
          } else if (recCategory === 'overnight') {
            catLabel = '🌙 Overnight';
            verdict = `🌙 Patient sleeper: +${it.profit.toLocaleString()} gp/ea. Queue low bid overnight.`;
          }

          return {
            id: it.id,
            name: it.name,
            category: catLabel,
            target_bid: it.buy_price,
            alch_val: it.highalch,
            profit_ea: it.profit,
            limit: it.buy_limit,
            batch_profit: it.batch_profit,
            speed: it.volume > 10000 ? '⚡ Instant' : it.volume > 2000 ? '🟢 Rapid' : '🟡 Moderate',
            batch_cost: it.buy_price * it.buy_limit,
            verdict: verdict,
          };
        });
    }

    return items.sort((a, b) => {
      let valA: any = a[recSortCol as keyof typeof a];
      let valB: any = b[recSortCol as keyof typeof b];
      if (typeof valA === 'string') {
        return recSortAsc ? valA.localeCompare(valB) : valB.localeCompare(valA);
      }
      valA = valA || 0;
      valB = valB || 0;
      return recSortAsc ? valA - valB : valB - valA;
    });
  }, [recCategory, filteredAlchItems, priceData, effectiveNatPrice, cashStack, unlimitedBudget, searchQuery, recSortCol, recSortAsc]);

  const handleCopyAllRecs = () => {
    if (recRows.length === 0) return;
    const timing = getMarketTimingInfo();
    const lines = [
      `=== OSRS Smart Picks (${recCategory.toUpperCase()}) [${timing.timeStr}] ===`,
      `Status: ${timing.badge}`,
      '',
      ...recRows.map((r, i) => `${i + 1}. ${r.name} | Bid: ${r.target_bid.toLocaleString()} gp | Alch: ${r.alch_val.toLocaleString()} gp | Profit: +${r.profit_ea.toLocaleString()} gp | Batch: +${r.batch_profit.toLocaleString()} gp | Speed: ${r.speed} | Verdict: ${r.verdict}`)
    ];
    navigator.clipboard.writeText(lines.join('\n'));
    showToast(`📋 Copied ${recRows.length} recommendations to clipboard!`);
  };

  // DYNAMIC 229 GE PRODUCTION RECIPES ENGINE
  const computedGeRecipes = useMemo(() => {
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

  // DYNAMIC 223 CRAFT & ALCH RECIPES ENGINE
  const computedCraftAlchRecipes = useMemo(() => {
    const latest = priceData?.latest || {};
    const alchMap = priceData?.alch_map || {};

    return (craftingRecipesData as any[]).map((r) => {
      const outputId = String(r.output_id);
      const outputHighAlch = alchMap[outputId] || 0;
      const finishedBuyPrice = latest[outputId]?.low || latest[outputId]?.high || 0;

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

      const craftAndAlchProfit = outputHighAlch > 0 ? outputHighAlch - totalMaterialCost - effectiveNatPrice : 0;
      const justAlchProfit = (outputHighAlch > 0 && finishedBuyPrice > 0) ? outputHighAlch - finishedBuyPrice - effectiveNatPrice : 0;
      const bonusVsBuy = craftAndAlchProfit - justAlchProfit;

      const hourlyActions = 1200;
      const hourlyProfit = craftAndAlchProfit * hourlyActions;
      const xpRate = (r.xp || 0) * hourlyActions;

      return {
        ...r,
        highalch: outputHighAlch,
        material_cost: totalMaterialCost,
        finished_buy_price: finishedBuyPrice,
        profit: craftAndAlchProfit,
        hourly_profit: hourlyProfit,
        bonus_vs_buy: bonusVsBuy,
        xp_rate: xpRate,
        materials_detailed: materialsWithPrices,
        is_viable: hasAllPrices && outputHighAlch > 0
      };
    });
  }, [priceData, effectiveNatPrice]);

  // Filtered GE Production Recipes
  const filteredGeRecipes = useMemo(() => {
    return computedGeRecipes.filter((r) => {
      if (craftSkillFilter !== 'all') {
        if (r.skill?.toLowerCase() !== craftSkillFilter.toLowerCase()) return false;
      }
      if (onlyUsableRecipes) {
        const skillKey = r.skill?.toLowerCase() || '';
        const userLevel = playerLevels[skillKey] || 1;
        if (r.level && r.level > userLevel) return false;
      }
      if (craftSearch) {
        return r.name.toLowerCase().includes(craftSearch.toLowerCase());
      }
      return true;
    }).sort((a, b) => b.hourly_profit - a.hourly_profit);
  }, [computedGeRecipes, craftSkillFilter, onlyUsableRecipes, playerLevels, craftSearch]);

  // Filtered Craft & Alch Recipes
  const filteredCraftAlchRecipes = useMemo(() => {
    return computedCraftAlchRecipes.filter((r) => {
      if (craftSkillFilter !== 'all') {
        if (r.skill?.toLowerCase() !== craftSkillFilter.toLowerCase()) return false;
      }
      if (onlyUsableRecipes) {
        const skillKey = r.skill?.toLowerCase() || '';
        const userLevel = playerLevels[skillKey] || 1;
        if (r.level && r.level > userLevel) return false;
      }
      if (craftSearch) {
        return r.name.toLowerCase().includes(craftSearch.toLowerCase());
      }
      return true;
    }).sort((a, b) => b.hourly_profit - a.hourly_profit);
  }, [computedCraftAlchRecipes, craftSkillFilter, onlyUsableRecipes, playerLevels, craftSearch]);

  // Bond Calculations
  const bondPrice = priceData?.bond?.ask || 11786000;
  const bondBid = priceData?.bond?.bid || 11327000;
  const bondSavings = Math.max(0, bondPrice - bondBid);
  const totalNetWorth = userCoins + (userNats * effectiveNatPrice) + userBatchValue;
  const bondProgressPct = Math.min(100, Math.max(0, (totalNetWorth / bondPrice) * 100));
  const remainingGp = Math.max(0, bondPrice - totalNetWorth);
  const avgHourlyProfit = 650000;
  const hoursRemaining = (remainingGp / avgHourlyProfit).toFixed(1);

  // Cart Status Calculations
  const cartAllocated = cartItems.reduce((acc, c) => acc + (c.buyPrice * c.limit), 0);
  const cartExpectedProfit = cartItems.reduce((acc, c) => acc + (c.profit * c.limit), 0);
  const cartCashLeft = Math.max(0, cashStack - cartAllocated);

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

  const handleCopyChatAd = (adText: string, itemKey: string) => {
    navigator.clipboard.writeText(adText);
    setCopiedAdItem(itemKey);
    setTimeout(() => setCopiedAdItem(null), 2000);
  };

  const handleAddTimer = (item: { id: number; name: string; buy_limit?: number }) => {
    const newEntry = {
      id: item.id,
      name: item.name,
      expiresAt: Date.now() + 4 * 3600 * 1000,
      limit: item.buy_limit || 70
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
    const headers = 'ID,Name,Type,Bid (Offer),Ask (Instant),Alch Value,Profit/Cast,Hourly Profit,ROI,24h Volume,4h Limit\n';
    const rows = filteredAlchItems.map(it => 
      `${it.id},"${it.name}",${it.members ? 'P2P' : 'F2P'},${it.bid},${it.ask},${it.highalch},${it.profit},${it.hourly_profit},${it.roi.toFixed(1)}%,${it.volume},${it.buy_limit}`
    ).join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `alchmate_margins_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  const handleSendTestWebhook = async () => {
    setTestSyncStatus('testing');
    setTestSyncMsg('Connecting to https://alchmate-web.vercel.app/api/sync ...');
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${syncToken || 'alch_test_token'}`
        },
        body: JSON.stringify({
          sync_token: syncToken || 'alch_test_token',
          rsn: 'TestPlayer',
          coins: userCoins || 2500000,
          nature_runes: userNats || 1500,
          total_wealth: totalNetWorth || 3000000,
          world: 308,
          is_members: true,
          alchs: [
            {
              item_id: 11840,
              item_name: 'Dragon boots',
              qty: 5,
              buy_price: 285000,
              nat_price: effectiveNatPrice,
              alch_value: 312000,
              profit: 134150,
              magic_xp: 325
            }
          ]
        })
      });
      const data = await res.json();
      if (res.ok) {
        setTestSyncStatus('success');
        setTestSyncMsg('Webhook test verified! Received 200 OK from cloud database.');
      } else {
        setTestSyncStatus('error');
        setTestSyncMsg(data.error || 'Server returned an error.');
      }
    } catch (err: any) {
      setTestSyncStatus('error');
      setTestSyncMsg(err.message || 'Network request failed.');
    }
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

          {/* Quick Live Market Tickers & Global Controls */}
          <div className="hidden lg:flex items-center space-x-3 text-xs font-medium">
            {/* Nature Rune Override */}
            <div className="bg-[#1a1f2c] px-3 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-1.5">
              <span className="text-neutral-400">Nat:</span>
              <input
                type="number"
                disabled={explorersRing}
                value={explorersRing ? 0 : natureRuneOverride}
                onChange={(e) => setNatureRuneOverride(Number(e.target.value))}
                className={`w-12 bg-transparent font-bold font-mono focus:outline-none ${explorersRing ? 'text-neutral-500 line-through' : 'text-amber-400'}`}
              />
              <span className="text-neutral-500">gp</span>
            </div>

            {/* Explorer's Ring 4 (0 Nat Cost) */}
            <button
              onClick={() => setExplorersRing(!explorersRing)}
              title="Explorer's Ring 4 gives 30 free daily high alchs (0 nature rune cost)"
              className={`px-2.5 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                explorersRing
                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 shadow-sm'
                  : 'bg-[#1a1f2c] text-neutral-400 border-[#2a3245] hover:text-white'
              }`}
            >
              🌿 Ring 4 (0 Nat)
            </button>

            {/* Bond Ticker */}
            <div className="bg-[#1a1f2c] px-3 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-2">
              <span className="text-neutral-400">Bond:</span>
              <span className="text-emerald-400 font-bold">{(bondPrice / 1000000).toFixed(2)}M</span>
              <span className="text-[10px] text-amber-400/80">(-{(bondSavings / 1000).toFixed(0)}k dip)</span>
            </div>

            {/* Pricing Strategy Selector */}
            <div className="bg-[#1a1f2c] p-0.5 rounded-lg border border-[#2a3245] flex text-[11px] font-semibold">
              {(['patient', 'smart', 'instant'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setPricingStrategy(s)}
                  className={`px-2.5 py-1 rounded transition-all capitalize ${
                    pricingStrategy === s ? 'bg-amber-500 text-black font-bold' : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  {s === 'patient' ? 'Bid' : s === 'smart' ? 'Bid+1' : 'Ask'}
                </button>
              ))}
            </div>

            {/* Refresh Now Button & Live Countdown */}
            <Tooltip text="Refresh Now (F5) or wait for automatic 60s Wiki sync">
              <button
                onClick={async () => {
                  try {
                    setLoading(true);
                    const res = await fetch('/api/prices');
                    const data = await res.json();
                    setPriceData(data);
                    setNextRefreshSec(60);
                    showToast('Refreshed live Grand Exchange prices!');
                  } finally {
                    setLoading(false);
                  }
                }}
                className="bg-[#1a1f2c] hover:bg-[#252c3f] text-neutral-300 px-2.5 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-1.5 transition-all text-xs font-semibold cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 text-amber-400 ${loading ? 'animate-spin' : ''}`} />
                <span>Next: {nextRefreshSec}s</span>
              </button>
            </Tooltip>

            {/* Filters Drawer Toggle Button (Desktop gui.py btn_toggle_filters) */}
            <button
              onClick={() => setShowFilterDrawer(!showFilterDrawer)}
              className={`px-3 py-1.5 rounded-lg border text-xs font-bold transition-all flex items-center gap-1.5 ${
                showFilterDrawer
                  ? 'bg-amber-500 text-black border-amber-500 shadow-md shadow-amber-500/20'
                  : 'bg-[#1a1f2c] text-neutral-300 border-[#2a3245] hover:text-white'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>⚙️ Filters {showFilterDrawer ? '▴' : '▾'}</span>
            </button>

            <button 
              onClick={handleExportCSV}
              className="bg-[#1a1f2c] hover:bg-[#252c3f] text-neutral-300 px-3 py-1.5 rounded-lg border border-[#2a3245] flex items-center gap-1.5 transition-all text-xs"
            >
              <Download className="w-3.5 h-3.5 text-amber-400" /> Export CSV
            </button>

            {/* Cloud Sync Status Badge */}
            <Tooltip text={syncToken ? `Cloud Sync Token Active: ${syncToken.substring(0, 10)}... (RuneLite plugin linked)` : 'No sync token active. Generate one in Session Hub.'}>
              <div className="flex items-center gap-1.5 text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20 cursor-help">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                <span>{syncToken ? 'Cloud Synced' : 'Wiki Live'}</span>
              </div>
            </Tooltip>
          </div>
        </div>

        {/* Collapsible Advanced Filters Drawer (Desktop gui.py p2 / build_top_controls) */}
        {showFilterDrawer && (
          <div className="max-w-7xl mx-auto px-4 py-3 bg-[#13161e] border-t border-[#1c212b] text-xs">
            <div className="flex flex-wrap items-center gap-4 text-neutral-300">
              {/* Cash Stack Input with k/m parser & Unlimited Budget Checkbox */}
              <div className="flex items-center gap-2 bg-[#1a1f2b] px-3 py-1.5 rounded-lg border border-[#273043]">
                <Tooltip text="Toggle budget cap on/off. When unchecked, unlimited budget is assumed.">
                  <label className="flex items-center gap-1.5 font-bold cursor-pointer text-amber-400">
                    <input
                      type="checkbox"
                      checked={!unlimitedBudget}
                      onChange={(e) => setUnlimitedBudget(!e.target.checked)}
                      className="accent-amber-500 rounded"
                    />
                    Cash:
                  </label>
                </Tooltip>
                <input
                  type="text"
                  disabled={unlimitedBudget}
                  value={unlimitedBudget ? 'Unlimited' : cashInputRaw}
                  placeholder="5.00M"
                  onChange={(e) => {
                    setCashInputRaw(e.target.value);
                    const parsed = parseCashInput(e.target.value);
                    if (parsed > 0) handleUpdateCashStack(parsed);
                  }}
                  className={`w-20 bg-transparent font-mono font-bold focus:outline-none ${unlimitedBudget ? 'text-neutral-500 line-through' : 'text-white'}`}
                />
                <span className="text-neutral-500">gp</span>
              </div>

              {/* Max Spend Per Item */}
              <div className="flex items-center gap-2 bg-[#1a1f2b] px-3 py-1.5 rounded-lg border border-[#273043]">
                <span className="text-neutral-400 font-semibold">Max Spend:</span>
                <input
                  type="number"
                  value={maxSpend}
                  onChange={(e) => setMaxSpend(Number(e.target.value))}
                  className="w-16 bg-transparent text-white font-mono font-bold focus:outline-none"
                />
                <span className="text-neutral-500">gp</span>
              </div>

              {/* Min Profit Filter */}
              <div className="flex items-center gap-2 bg-[#1a1f2b] px-3 py-1.5 rounded-lg border border-[#273043]">
                <span className="text-neutral-400 font-semibold">Min Profit:</span>
                <input
                  type="number"
                  placeholder="0"
                  value={minProfitFilter || ''}
                  onChange={(e) => setMinProfitFilter(Number(e.target.value))}
                  className="w-14 bg-transparent text-emerald-400 font-mono font-bold focus:outline-none"
                />
                <span className="text-neutral-500">gp</span>
              </div>

              {/* Speed Filter Combobox */}
              <div className="flex items-center gap-2 bg-[#1a1f2b] px-3 py-1.5 rounded-lg border border-[#273043]">
                <span className="text-neutral-400 font-semibold">Speed:</span>
                <select
                  value={speedFilter}
                  onChange={(e) => setSpeedFilter(e.target.value as any)}
                  className="bg-transparent text-amber-400 font-bold focus:outline-none"
                >
                  <option value="All" className="bg-[#1a1f2b]">All Speeds</option>
                  <option value="Fast" className="bg-[#1a1f2b]">⚡ Fast (&lt;15m)</option>
                  <option value="Steady" className="bg-[#1a1f2b]">⏱️ Steady (&lt;1h)</option>
                </select>
              </div>

              {/* Hide Maxed 4h Cooldown Checkbox */}
              <label className="flex items-center gap-1.5 bg-[#1a1f2b] px-3 py-1.5 rounded-lg border border-[#273043] cursor-pointer text-neutral-300 font-semibold">
                <input
                  type="checkbox"
                  checked={hideMaxedCooldown}
                  onChange={(e) => setHideMaxedCooldown(e.target.checked)}
                  className="accent-amber-500 rounded"
                />
                <span>⏳ Hide Maxed 4h Limit</span>
              </label>

              {/* Nature Rune Sub-Controls: Lock price & Owned Stockpile */}
              <div className="flex items-center gap-2 bg-[#1a1f2b] px-3 py-1.5 rounded-lg border border-[#273043]">
                <span className="text-neutral-400">Nat Lock:</span>
                <input
                  type="number"
                  placeholder="Market"
                  value={lockedNatPrice || ''}
                  onChange={(e) => {
                    const v = Number(e.target.value);
                    setLockedNatPrice(v > 0 ? v : null);
                    if (v > 0) setNatureRuneOverride(v);
                  }}
                  className="w-14 bg-transparent text-amber-400 font-mono font-bold focus:outline-none"
                />
                <span className="text-neutral-500">|</span>
                <span className="text-neutral-400">Owned Nats:</span>
                <input
                  type="number"
                  placeholder="0"
                  value={ownedNats || ''}
                  onChange={(e) => setOwnedNats(Number(e.target.value))}
                  className="w-16 bg-transparent text-emerald-400 font-mono font-bold focus:outline-none"
                />
              </div>
            </div>
          </div>
        )}

        {/* 5 Main Consolidated Super-Hub Tabs */}
        <div className="max-w-7xl mx-auto px-4 flex space-x-1 border-t border-[#1c212b] overflow-x-auto">
          {[
            { id: 'alch_hub', label: 'High Alch & Trading', icon: Coins },
            { id: 'craft_hub', label: 'Crafting Workshop (452)', icon: Hammer },
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
            {/* Global Market Clock & Strategy Banner Card (Verbatim port of get_market_timing_info from desktop gui.py) */}
            {(() => {
              const timing = getMarketTimingInfo();
              return (
                <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <Tooltip text="Current Grand Exchange server time (UTC).\nOSRS market activity cycles strictly follow UTC time zones.">
                      <span className="text-amber-400 font-extrabold text-sm flex items-center gap-1.5 cursor-help">
                        <Clock className="w-4 h-4 text-amber-400" />
                        🕒 {timing.timeStr}
                      </span>
                    </Tooltip>
                    <span className="text-neutral-500">|</span>
                    <span className={`text-xs font-bold ${timing.badgeColor}`}>
                      {timing.badge}
                    </span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-xs font-mono text-cyan-400 font-semibold">
                      {timing.activity}
                    </span>
                  </div>
                  <div className="text-xs text-neutral-300 italic bg-[#1a1f2b] px-3 py-1.5 rounded-lg border border-[#2b3548]">
                    {timing.advice}
                  </div>
                </div>
              );
            })()}

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

            {/* 8-Slot Cart Status Bar (Full Desktop Parity) */}
            {(() => {
              const totalItemsInCart = cartItems.reduce((acc, c) => acc + c.limit, 0);
              const castingTimeMinutes = Math.round((totalItemsInCart / 1200) * 60);
              const natsShort = Math.max(0, totalItemsInCart - ownedNats);

              return (
                <div className="bg-[#14171f] p-3 rounded-xl border border-[#242b3b] flex flex-wrap items-center justify-between text-xs gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="font-bold text-white flex items-center gap-1.5">
                      <ShoppingCart className="w-4 h-4 text-amber-400" /> GE Slots: {cartItems.length}/8
                    </span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-neutral-300">
                      Allocated: <strong className="text-white font-mono">{(cartAllocated / 1000000).toFixed(2)}M gp</strong>
                    </span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-neutral-300">
                      Cash Left: <strong className="text-emerald-400 font-mono">{unlimitedBudget ? '∞ gp' : `${(cartCashLeft / 1000000).toFixed(2)}M gp`}</strong>
                    </span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-neutral-300">
                      Est. Profit: <strong className="text-amber-400 font-mono">+{cartExpectedProfit.toLocaleString()} gp</strong>
                    </span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-neutral-400 font-mono">
                      ⏱️ {castingTimeMinutes}m cast time ({totalItemsInCart.toLocaleString()} casts)
                    </span>
                    {ownedNats > 0 && natsShort > 0 && (
                      <span className="text-amber-400 font-bold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                        ⚠️ Short {natsShort.toLocaleString()} nats
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Master Tag (All profitable items) */}
                    <Tooltip text="Export top 50 profitable high alch items as a RuneLite bank tag tab">
                      <button
                        onClick={() => {
                          const topItems = filteredAlchItems.filter(it => it.profit > 50).slice(0, 50).map(it => it.name).join(',');
                          navigator.clipboard.writeText(`alchmate,${topItems}`);
                          showToast('Master Bank Tag (top 50 items) copied!');
                        }}
                        className="bg-purple-600/30 hover:bg-purple-600/50 text-purple-200 border border-purple-500/40 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      >
                        📋 Master Tag
                      </button>
                    </Tooltip>

                    {/* Cart Tag */}
                    <Tooltip text="Export only the 8 items currently in your cart as a RuneLite bank tag">
                      <button
                        onClick={() => {
                          const names = cartItems.map(c => c.name).join(',');
                          navigator.clipboard.writeText(`alchmate,${names}`);
                          showToast('Cart Bank Tag copied!');
                        }}
                        disabled={cartItems.length === 0}
                        className="bg-blue-600/30 hover:bg-blue-600/50 disabled:opacity-40 text-blue-200 border border-blue-500/40 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      >
                        🛒 Cart Tag
                      </button>
                    </Tooltip>

                    {/* Log Cart (Starts 4h timers) */}
                    <Tooltip text="Start 4-hour Grand Exchange timers for all items in cart">
                      <button
                        onClick={() => {
                          if (cartItems.length === 0) return;
                          const now = Date.now();
                          const newTimers = [...timers];
                          cartItems.forEach(ci => {
                            const existingIdx = newTimers.findIndex(t => t.id === ci.id);
                            const tObj = { id: ci.id, name: ci.name, expiresAt: now + (4 * 3600 * 1000), limit: ci.limit };
                            if (existingIdx >= 0) {
                              newTimers[existingIdx] = tObj;
                            } else {
                              newTimers.push(tObj);
                            }
                          });
                          setTimers(newTimers);
                          localStorage.setItem('alchmate_timers', JSON.stringify(newTimers));
                          showToast(`Logged cart! Started 4h timers for ${cartItems.length} items.`);
                        }}
                        disabled={cartItems.length === 0}
                        className="bg-emerald-600/30 hover:bg-emerald-600/50 disabled:opacity-40 text-emerald-200 border border-emerald-500/40 px-2.5 py-1 rounded-lg text-xs font-bold transition-all"
                      >
                        ✓ Log Cart
                      </button>
                    </Tooltip>

                    {/* Clear Cart */}
                    <button
                      onClick={() => {
                        setCartItems([]);
                        localStorage.removeItem('alchmate_cart');
                        showToast('Cart cleared.');
                      }}
                      disabled={cartItems.length === 0}
                      className="text-neutral-500 hover:text-rose-400 disabled:opacity-40 px-2 py-1 text-xs transition-colors"
                    >
                      ✕ Clear
                    </button>
                  </div>
                </div>
              );
            })()}

            {/* Sub-view: Main Margins Table */}
            {alchSubView === 'table' && (
              <div className="space-y-4">
                {/* Filter Bar with Volume & Type filters */}
                <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] space-y-3">
                  <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                    <div className="relative w-full md:w-80">
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
                      {/* Cash Stack Input */}
                      <div className="flex items-center gap-1.5 bg-[#1b202c] px-2.5 py-1.5 rounded-lg border border-[#2e374d]">
                        <span className="text-neutral-400">Cash:</span>
                        <input
                          type="number"
                          value={cashStack}
                          onChange={(e) => handleUpdateCashStack(Number(e.target.value))}
                          className="w-20 bg-transparent text-white font-mono font-bold focus:outline-none"
                        />
                      </div>

                      {/* Max Spend Input */}
                      <div className="flex items-center gap-1.5 bg-[#1b202c] px-2.5 py-1.5 rounded-lg border border-[#2e374d]">
                        <span className="text-neutral-400">Max Spend:</span>
                        <input
                          type="number"
                          value={maxSpend}
                          onChange={(e) => setMaxSpend(Number(e.target.value))}
                          className="w-20 bg-transparent text-white font-mono font-bold focus:outline-none"
                        />
                      </div>

                      {/* Daily Volume Filter (Matching desktop min_volume default 100) */}
                      <div className="flex items-center gap-1.5 bg-[#1b202c] px-2.5 py-1.5 rounded-lg border border-[#2e374d]">
                        <span className="text-neutral-400">Min Vol:</span>
                        <select
                          value={minVolumeFilter}
                          onChange={(e) => setMinVolumeFilter(Number(e.target.value))}
                          className="bg-transparent text-amber-400 font-bold focus:outline-none"
                        >
                          <option value={0} className="bg-[#1b202c]">All Volumes</option>
                          <option value={100} className="bg-[#1b202c]">&gt; 100/day (Default)</option>
                          <option value={1000} className="bg-[#1b202c]">&gt; 1,000/day (High)</option>
                          <option value={5000} className="bg-[#1b202c]">&gt; 5,000/day (Instant)</option>
                        </select>
                      </div>

                      {/* Members & F2P Checkboxes (Exact Desktop Match) */}
                      <div className="flex items-center gap-3 bg-[#1b202c] px-3 py-1.5 rounded-lg border border-[#2e374d] text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 font-semibold">
                          <input
                            type="checkbox"
                            checked={membersEnabled}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setMembersEnabled(checked);
                              if (checked) setF2pOnly(false);
                            }}
                            className="rounded accent-amber-500"
                          />
                          Members
                        </label>
                        <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 font-semibold">
                          <input
                            type="checkbox"
                            checked={f2pOnly}
                            onChange={(e) => {
                              const checked = e.target.checked;
                              setF2pOnly(checked);
                              if (checked) setMembersEnabled(false);
                            }}
                            className="rounded accent-amber-500"
                          />
                          F2P Only
                        </label>
                      </div>
                    </div>
                  </div>

                  {/* Item Type Checkboxes (Matches desktop matches_alch_type_filter) */}
                  <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#1e2433] text-xs gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-neutral-500 font-semibold mr-1">Types:</span>
                      {[
                        { key: 'rune', label: '🛡️ Rune' },
                        { key: 'addy', label: '⚔️ Adamant' },
                        { key: 'mith', label: '🗡️ Mithril' },
                        { key: 'dragon', label: '🐉 Dragon' },
                        { key: 'jewel', label: '💍 Jewellery' },
                        { key: 'bows', label: '🏹 Bows & Ammo' },
                        { key: 'staves', label: '✨ Staves / Robes' },
                        { key: 'barrows', label: '⚰️ Barrows' },
                        { key: 'other', label: '📦 Other' },
                      ].map((t) => (
                        <button
                          key={t.key}
                          onClick={() => setTypeFilters(prev => ({ ...prev, [t.key]: !prev[t.key] }))}
                          className={`px-2.5 py-1 rounded-md transition-all font-medium ${
                            typeFilters[t.key]
                              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                              : 'bg-[#191e29] text-neutral-500 hover:text-white border border-[#232938]'
                          }`}
                        >
                          {t.label}
                        </button>
                      ))}
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setTypeFilters({ rune: true, addy: true, mith: true, dragon: true, jewel: true, bows: true, staves: true, barrows: true, other: true })}
                        className="text-[11px] text-amber-400 hover:underline"
                      >
                        All
                      </button>
                      <span className="text-neutral-600">/</span>
                      <button
                        onClick={() => setTypeFilters({ rune: false, addy: false, mith: false, dragon: false, jewel: false, bows: false, staves: false, barrows: false, other: false })}
                        className="text-[11px] text-neutral-500 hover:text-white"
                      >
                        None
                      </button>
                    </div>
                  </div>
                </div>

                {/* Main Table: EXACT COLUMNS MATCHING DESKTOP gui.py tree_alch */}
                <div className="bg-[#14171f] rounded-xl border border-[#242b3b] overflow-hidden shadow-xl">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                      <thead className="bg-[#1a1f2b] text-neutral-400 uppercase text-xs border-b border-[#262e3f]">
                        <tr>
                          <th className="px-3 py-3.5 text-center">
                            <Tooltip text="Shopping Cart:&#10;Shows items in cart. Click row cell to copy quantity number to clipboard.">
                              <span>Cart</span>
                            </Tooltip>
                          </th>
                          <th className="px-4 py-3.5">
                            <Tooltip text="Item Name:&#10;Grand Exchange item name. Click row cell to copy name to clipboard for GE search. Hover to view detailed market intel.">
                              <span>Item Name</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5 cursor-pointer" onClick={() => setSortBy('buy_price')}>
                            <Tooltip text="Target Offer (Bid):&#10;Best patient buy price from active sellers. Click cell to copy price.&#10;If using Smart strategy, bids Bid + 1 gp for queue priority.">
                              <span>Offer (Bid)</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5">
                            <Tooltip text="Instant Buy (Ask):&#10;Instant purchase price from active sellers. Fills immediately. Click cell to copy.">
                              <span>Instant (Ask)</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5 cursor-pointer" onClick={() => setSortBy('highalch')}>
                            <Tooltip text="High Alch Value:&#10;Fixed gold returned by casting the High Level Alchemy spell.">
                              <span>Alch Value</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5 cursor-pointer text-amber-400" onClick={() => setSortBy('profit')}>
                            <Tooltip text="Profit / Alch:&#10;Net GP profit per cast = High Alch Value - Item Buy Price - Nature Rune Cost. Click to sort.">
                              <span>Profit / Alch ▼</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5 cursor-pointer" onClick={() => setSortBy('hourly_profit')}>
                            <Tooltip text="Profit / Hr:&#10;Estimated profit per hour at standard 1,200 casts/hour rate. Click to sort.">
                              <span>Profit / Hr (1.2k)</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5">
                            <Tooltip text="Fill Speed &amp; 5m Sold:&#10;Estimated wait time or transaction velocity. High volume staples fill in under 2 minutes.">
                              <span>Fill Speed</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5">
                            <Tooltip text="4h GE Buy Limit:&#10;Official Grand Exchange purchase limit every 4 hours.&#10;⚠️ Volume Capped: If 24h market volume is lower than GE limit, shows volume caution.">
                              <span>4h Limit</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5 cursor-pointer" onClick={() => setSortBy('batch_profit')}>
                            <Tooltip text="4h Batch Profit:&#10;Realistic profit achievable for a full 4-hour batch (Profit ea * Available limit). Click to sort.">
                              <span>4h Batch Profit</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5">
                            <Tooltip text="Max Afford:&#10;Maximum quantity your current cash stack can afford out of remaining available limit.">
                              <span>Max Afford</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5 cursor-pointer" onClick={() => setSortBy('volume')}>
                            <Tooltip text="24h Volume:&#10;Total units traded on Grand Exchange over the last 24 hours. Click to sort.">
                              <span>24h Volume</span>
                            </Tooltip>
                          </th>
                          <th className="px-3 py-3.5 text-center">
                            <Tooltip text="4h Timer:&#10;Click to start or view the 4-hour cooldown timer for this item.">
                              <span>Timer</span>
                            </Tooltip>
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2433]">
                        {loading ? (
                          <tr>
                            <td colSpan={13} className="text-center py-12 text-neutral-500">
                              <RefreshCw className="w-6 h-6 animate-spin mx-auto mb-2 text-amber-500" />
                              Loading live Grand Exchange prices...
                            </td>
                          </tr>
                        ) : filteredAlchItems.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="text-center py-12 text-neutral-500">
                              No alchable items found matching your filters.
                            </td>
                          </tr>
                        ) : (
                          filteredAlchItems.slice(0, 100).map((item) => {
                            const inCart = cartItems.some(c => c.id === item.id);
                            return (
                              <tr key={item.id} className="hover:bg-[#1a202c]/50 transition-colors">
                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={() => handleToggleCart(item)}
                                    title={inCart ? 'Remove from GE Cart' : 'Add to GE Cart'}
                                    className={`p-1 rounded transition-colors ${inCart ? 'text-amber-400 font-bold' : 'text-neutral-500 hover:text-white'}`}
                                  >
                                    <ShoppingCart className="w-4 h-4" />
                                  </button>
                                </td>
                                <td className="px-4 py-3 font-medium text-white">
                                  <RowHoverCard item={item} effectiveNatPrice={effectiveNatPrice}>
                                    <div className="flex items-center gap-2 cursor-pointer">
                                      <img
                                        src={`https://static.runelite.net/cache/item/icon/${item.id}.png`}
                                        alt=""
                                        className="w-6 h-6 object-contain shrink-0"
                                        onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                      />
                                      <span className="text-white hover:text-amber-400 transition-colors font-semibold">
                                        {item.name}
                                      </span>
                                    </div>
                                  </RowHoverCard>
                                </td>
                                <td className="px-3 py-3 font-mono text-neutral-300">
                                  <button onClick={() => handleCopyPrice(item.id, item.bid || item.buy_price)} title="Click to copy bid price" className="flex items-center gap-1 hover:text-white">
                                    {(item.bid || item.buy_price).toLocaleString()}
                                    {copiedId === item.id ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3 text-neutral-600" />}
                                  </button>
                                </td>
                                <td className="px-3 py-3 font-mono text-neutral-400">{item.ask ? item.ask.toLocaleString() : '—'}</td>
                                <td className="px-3 py-3 font-mono text-neutral-400">{item.highalch.toLocaleString()}</td>
                                <td className={`px-3 py-3 font-mono font-bold ${item.profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {item.profit > 0 ? `+${item.profit.toLocaleString()}` : item.profit.toLocaleString()}
                                </td>
                                <td className={`px-3 py-3 font-mono font-extrabold ${item.hourly_profit > 0 ? 'text-amber-400' : 'text-neutral-500'}`}>
                                  {item.hourly_profit > 0 ? `+${(item.hourly_profit / 1000).toFixed(0)}k/hr` : `${(item.hourly_profit / 1000).toFixed(0)}k/hr`}
                                </td>
                                <td className={`px-3 py-3 font-semibold text-xs ${item.speed.color}`}>
                                  {item.speed.label}
                                </td>
                                <td className="px-3 py-3 font-mono text-neutral-300">
                                  {item.volume < item.buy_limit && item.volume > 0 ? (
                                    <Tooltip text={`Volume Capped: 24h volume (${item.volume.toLocaleString()}) < 4h limit (${item.buy_limit.toLocaleString()})`}>
                                      <span className="text-amber-400 font-semibold cursor-help">{item.buy_limit.toLocaleString()} ⚠️</span>
                                    </Tooltip>
                                  ) : (
                                    item.buy_limit > 0 ? item.buy_limit.toLocaleString() : '—'
                                  )}
                                </td>
                                <td className={`px-3 py-3 font-mono font-bold ${item.batch_profit > 0 ? 'text-emerald-400' : 'text-neutral-500'}`}>
                                  {item.batch_profit > 0 ? `+${item.batch_profit.toLocaleString()}` : `${item.batch_profit.toLocaleString()}`}
                                </td>
                                <td className="px-3 py-3 font-mono text-neutral-300">{item.max_afford.toLocaleString()}</td>
                                <td className="px-3 py-3 font-mono text-neutral-400">{item.volume > 0 ? item.volume.toLocaleString() : '—'}</td>
                                <td className="px-3 py-3 text-center">
                                  <button
                                    onClick={() => handleAddTimer(item)}
                                    title="Add to 4h GE Timer"
                                    className="p-1 hover:bg-[#252c3f] rounded text-neutral-400 hover:text-amber-400 transition-colors"
                                  >
                                    <Clock className="w-4 h-4" />
                                  </button>
                                </td>
                              </tr>
                            );
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Overnight Planner (Desktop gui.py:1833-2050 parity) */}
            {alchSubView === 'overnight' && (
              <div className="space-y-6">
                {/* 1. Market Timing & Sleep Strategy Banner Card */}
                <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] shadow-lg space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#202636] pb-3">
                    <div className="flex flex-wrap items-center gap-3">
                      <span className="text-amber-400 font-extrabold text-sm flex items-center gap-1.5">
                        <Moon className="w-4 h-4 text-indigo-400" />
                        🌙 GE Overnight Optimizer
                      </span>
                      <span className="text-neutral-500">|</span>
                      <span className="text-xs font-bold text-emerald-400">
                        💤 48h &amp; 7d Multi-Day Dip Analysis
                      </span>
                      <span className="text-neutral-500">|</span>
                      <span className="text-xs font-mono font-bold text-cyan-400">
                        ⏰ Limit Multiplier: {overnightDuration >= 10 ? '3.0x (10-12h = 3 GE Resets)' : '2.0x (6-8h = 2 GE Resets)'}
                      </span>
                    </div>
                  </div>
                  <div className="text-xs text-neutral-300 italic bg-[#1a1f2b] p-3 rounded-lg border border-[#2b3548] leading-relaxed">
                    💡 <strong>Sleep Strategy:</strong> Between 03:00 and 08:00 UTC, global player activity drops by ~50%. Placing patient percentile bids lets you catch massive undercut dumps while 4-hour buy limits reset multiple times while you sleep!
                  </div>
                </div>

                {/* 2. Control Strip (Duration, Strategy, Slots, Focus, Alch Time, Max/Slot, Owned Nats) */}
                <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] shadow-lg space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-3 text-xs">
                      {/* Duration */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">💤 Duration:</span>
                        <select
                          value={overnightDuration}
                          onChange={(e) => setOvernightDuration(Number(e.target.value))}
                          className="bg-[#191e29] border border-[#2b3547] rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                        >
                          <option value={6}>6 Hours (2x limit)</option>
                          <option value={8}>8 Hours (2x limit)</option>
                          <option value={10}>10 Hours (3x limit)</option>
                          <option value={12}>12 Hours (3x limit)</option>
                        </select>
                      </div>

                      {/* Strategy */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">🎯 Strategy:</span>
                        <select
                          value={overnightStrat}
                          onChange={(e) => setOvernightStrat(e.target.value as any)}
                          className="bg-[#191e29] border border-[#2b3547] rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                        >
                          <option value="safe">Safe Morning Fill (25% Low)</option>
                          <option value="deep">Deep-Dip Sniper (10% Low)</option>
                        </select>
                      </div>

                      {/* Slots */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">📦 Slots:</span>
                        <select
                          value={overnightSlots}
                          onChange={(e) => setOvernightSlots(Number(e.target.value))}
                          className="bg-[#191e29] border border-[#2b3547] rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                        >
                          <option value={1}>1 Slot</option>
                          <option value={2}>2 Slots</option>
                          <option value={3}>3 Slots (F2P)</option>
                          <option value={4}>4 Slots</option>
                          <option value={5}>5 Slots</option>
                          <option value={6}>6 Slots</option>
                          <option value={7}>7 Slots</option>
                          <option value={8}>8 Slots (P2P)</option>
                        </select>
                      </div>

                      {/* Focus */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">🔍 Focus:</span>
                        <select
                          value={overnightFocus}
                          onChange={(e) => setOvernightFocus(e.target.value)}
                          className="bg-[#191e29] border border-[#2b3547] rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                        >
                          <option value="All">🌟 All Staples</option>
                          <option value="Rune Heavy">🛡️ Rune Heavy Gear Only</option>
                          <option value="Adamant">📦 Adamant &amp; Budget</option>
                          <option value="Battlestaves">🪄 Battlestaves &amp; Crafting (P2P)</option>
                          <option value="Stackables">🏹 Stackables &amp; Bolts (P2P)</option>
                        </select>
                      </div>

                      {/* Alch Time Cap */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">⏱️ Alch Time:</span>
                        <select
                          value={overnightAlchTime}
                          onChange={(e) => setOvernightAlchTime(e.target.value)}
                          className="bg-[#191e29] border border-[#2b3547] rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                        >
                          <option value="30m">30 Mins (~600 items)</option>
                          <option value="45m">45 Mins (~900 items)</option>
                          <option value="1h">1 Hour (~1.2k items)</option>
                          <option value="2h">2 Hours (~2.4k items)</option>
                          <option value="3h">3 Hours (~3.6k items)</option>
                          <option value="unlimited">♾️ Unlimited (No Cap)</option>
                        </select>
                      </div>

                      {/* Max per Offer Slot */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-amber-400 font-bold">📦 Max / Slot:</span>
                        <select
                          value={overnightMaxSlot === null ? 'unlimited' : String(overnightMaxSlot)}
                          onChange={(e) => setOvernightMaxSlot(e.target.value === 'unlimited' ? null : Number(e.target.value))}
                          className="bg-[#191e29] border border-[#2b3547] rounded-lg px-2.5 py-1.5 text-white font-semibold focus:outline-none"
                        >
                          <option value="250">250 (Fast 12m)</option>
                          <option value="375">375 (12h Armor Cap)</option>
                          <option value="500">500 (Balanced)</option>
                          <option value="1000">1,000 (Extended)</option>
                          <option value="unlimited">♾️ Unlimited</option>
                        </select>
                      </div>

                      {/* Owned Nats Toggle */}
                      <label className="flex items-center gap-1.5 cursor-pointer text-emerald-400 font-bold">
                        <input
                          type="checkbox"
                          checked={overnightOwnedNat}
                          onChange={(e) => setOvernightOwnedNat(e.target.checked)}
                          className="rounded bg-[#191e29] border-[#2b3547] text-emerald-500 focus:ring-0"
                        />
                        🌿 0 GP Nats
                      </label>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => showToast('⚡ Auto-optimized overnight bag using multi-pass knapsack allocation!')}
                        className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        ⚡ Auto-Optimize Bag
                      </button>
                      <button
                        onClick={handleSendOvernightBagToCart}
                        className="bg-[#242b3d] hover:bg-[#2d374f] text-cyan-300 border border-[#34405a] text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        🛒 Send to Cart
                      </button>
                      <button
                        onClick={handleCopyOvernightPlan}
                        className="bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {copiedPlan ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                        {copiedPlan ? 'Copied Plan!' : '📋 Copy Plan'}
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. Overnight Summary Metrics Bar (Desktop gui.py:1957-1987) */}
                <div className="bg-[#14171f] px-5 py-3 rounded-xl border border-[#242b3b] flex flex-wrap items-center justify-between gap-4 text-xs font-mono">
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">💰 Budget:</span>
                    <span className="text-white font-bold">{unlimitedBudget ? 'Unlimited' : formatGp(cashStack)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">🛒 Spend Allocated:</span>
                    <span className="text-cyan-400 font-bold">{formatGp(overnightResult.totalSpend)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">🪙 Leftover GP:</span>
                    <span className="text-amber-400 font-bold">{formatGp(overnightResult.leftoverGp)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">✨ Expected Profit:</span>
                    <span className="text-emerald-400 font-extrabold text-sm">+{formatGp(overnightResult.totalProfit)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">🔥 Total Items:</span>
                    <span className="text-purple-400 font-bold">{overnightResult.totalItems.toLocaleString()} items</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">⏱️ Est. Alch Time:</span>
                    <span className="text-amber-300 font-bold">~{overnightResult.alchMins} mins</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-neutral-500">🚀 Hourly Rate:</span>
                    <span className="text-emerald-300 font-extrabold">+{formatGp(Math.round(overnightResult.hourlyRate))}/hr</span>
                  </div>
                </div>

                {/* 4. Full Overnight Table (Desktop gui.py:1989-2045) */}
                <div className="bg-[#14171f] p-5 rounded-2xl border border-[#242b3b] space-y-4">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#1a1f2b] text-neutral-400 uppercase text-[11px] border-b border-[#262e3f] select-none">
                        <tr>
                          <th className="px-3 py-2.5 text-center">Pick</th>
                          <th onClick={() => toggleSortOvernight('name')} className="px-3 py-2.5 cursor-pointer hover:text-white">
                            Item Name {overnightSortCol === 'name' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortOvernight('bid')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            Optimal Bid {overnightSortCol === 'bid' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortOvernight('alch')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            High Alch {overnightSortCol === 'alch' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortOvernight('profit_ea')} className="px-3 py-2.5 text-right text-emerald-400 cursor-pointer hover:text-white">
                            Profit / Ea {overnightSortCol === 'profit_ea' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortOvernight('period_limit')} className="px-3 py-2.5 text-center cursor-pointer hover:text-white">
                            Period Limit {overnightSortCol === 'period_limit' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortOvernight('alloc_qty')} className="px-3 py-2.5 text-center cursor-pointer hover:text-white">
                            Allocated Qty {overnightSortCol === 'alloc_qty' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortOvernight('total_cost')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            Total Spend {overnightSortCol === 'total_cost' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortOvernight('slot_profit')} className="px-3 py-2.5 text-right text-amber-400 cursor-pointer hover:text-white">
                            Expected Profit {overnightSortCol === 'slot_profit' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortOvernight('conf')} className="px-3 py-2.5 text-center cursor-pointer hover:text-white">
                            Fill Confidence {overnightSortCol === 'conf' && (overnightSortAsc ? '▲' : '▼')}
                          </th>
                          <th className="px-3 py-2.5 min-w-[220px]">Night Market Analysis</th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2433]">
                        {overnightResult.tableItems.map((row) => (
                          <tr
                            key={row.id}
                            className={`hover:bg-[#1a202c]/60 transition-colors ${row.isAllocated ? 'bg-indigo-500/5' : ''}`}
                          >
                            <td className="px-3 py-2.5 text-center font-bold">
                              {row.isAllocated ? (
                                <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                  ✓ Pick
                                </span>
                              ) : (
                                <span className="text-[10px] text-neutral-500">
                                  Alt
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2.5 font-sans font-bold text-white flex items-center gap-2">
                              <img
                                src={`https://static.runelite.net/cache/item/icon/${row.id}.png`}
                                alt=""
                                className="w-5 h-5 object-contain shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span>{row.name}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-cyan-300 font-bold">
                              {row.bid.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-400">
                              {row.alch.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                              +{row.profit_ea.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-center text-neutral-300">
                              {row.period_limit.toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-center font-bold text-white">
                              {row.alloc_qty > 0 ? row.alloc_qty.toLocaleString() : '—'}
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-300">
                              {formatGp(row.total_cost)}
                            </td>
                            <td className="px-3 py-2.5 text-right font-extrabold text-amber-400">
                              +{row.slot_profit.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-center font-sans">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#202738] text-neutral-200">
                                {row.conf}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 font-sans text-neutral-300 text-[11px] leading-relaxed">
                              {row.verdict}
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => handleToggleCart({ id: row.id, name: row.name, buy_price: row.bid, buy_limit: row.alloc_qty || row.period_limit, profit: row.profit_ea })}
                                className="px-2.5 py-1 rounded bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-300 text-[11px] font-bold font-sans transition-all border border-amber-500/30"
                              >
                                + Cart
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: W308 Anvil Sheet */}
            {alchSubView === 'w308' && (
              <div className="space-y-6">
                {/* W308 Location & Clan Guest Banner (Desktop parity gui.py:2087-2115) */}
                <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  <div className="flex flex-wrap items-center gap-3">
                    <span className="text-amber-400 font-extrabold text-sm flex items-center gap-1.5">
                      <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
                      🤝 World 308 &apos;Varrock West&apos; Bulk Trading Hub
                    </span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-xs text-neutral-300 font-semibold">
                      📍 Location: <strong>Varrock West Bank (World 308)</strong>
                    </span>
                    <span className="text-neutral-500">|</span>
                    <span className="text-xs text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                      Clan Guest: <strong>&apos;Varrock Mob&apos;</strong>
                    </span>
                  </div>
                  <div className="text-xs text-neutral-400">
                    Bypass the 4-hour 70-unit GE buy limit and save 1% GE tax by trading bulk noted items directly!
                  </div>
                </div>

                {/* Anti-Scam Bulk Trade Calculator & 2nd Screen Verifier (Desktop gui.py:2174-2283) */}
                <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#202738] pb-4">
                    <div>
                      <h3 className="text-lg font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-400" />
                        🛡️ Anti-Scam Bulk Trade Calculator &amp; 2nd Screen Verifier
                      </h3>
                      <p className="text-xs text-neutral-400 mt-0.5">
                        Auto-scaled to your money stack so you never have to guess quantities or totals on the 2nd trade screen.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 bg-[#1b202c] p-1 rounded-lg border border-[#2e374d] text-xs">
                      <button
                        onClick={() => {
                          setW308Role('buyer');
                          const it = (w308StaplesData as any[]).find(i => i.name === w308SelectedItem);
                          if (it) setW308AgreedPrice(it.w308_buy);
                        }}
                        className={`px-3 py-1 rounded font-bold transition-all ${w308Role === 'buyer' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-neutral-400 hover:text-white'}`}
                      >
                        🛒 Alcher / Buyer Mode
                      </button>
                      <button
                        onClick={() => {
                          setW308Role('seller');
                          const it = (w308StaplesData as any[]).find(i => i.name === w308SelectedItem);
                          if (it) setW308AgreedPrice(it.w308_sell_p2p || it.w308_buy);
                        }}
                        className={`px-3 py-1 rounded font-bold transition-all ${w308Role === 'seller' ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'text-neutral-400 hover:text-white'}`}
                      >
                        🔨 Smither / Crafter Mode
                      </button>
                    </div>
                  </div>

                  {/* Calculator Body: Inputs, Outputs, and Action Controls */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
                    {/* Inputs on Left (4 cols) */}
                    <div className="lg:col-span-4 bg-[#191e29] p-4 rounded-xl border border-[#252c3c] space-y-3 flex flex-col justify-between">
                      <div className="space-y-3">
                        <div>
                          <label className="text-[11px] text-neutral-400 font-semibold block mb-1">Bulk Staple Item:</label>
                          <select
                            value={w308SelectedItem}
                            onChange={(e) => handleSelectW308Item(e.target.value)}
                            className="w-full bg-[#13161f] border border-[#2a3447] rounded-lg px-3 py-1.5 text-xs text-white font-semibold focus:outline-none focus:border-amber-500"
                          >
                            {(w308StaplesData as any[]).map((st) => (
                              <option key={st.id} value={st.name} className="bg-[#13161f]">
                                {st.name} (Alch: {st.alch.toLocaleString()} gp)
                              </option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="text-[11px] text-neutral-400 font-semibold block mb-1">Agreed Ea (Coins):</label>
                          <input
                            type="number"
                            value={w308AgreedPrice}
                            onChange={(e) => setW308AgreedPrice(Number(e.target.value))}
                            className="w-full bg-[#13161f] border border-[#2a3447] rounded-lg px-3 py-1.5 text-xs text-amber-400 font-mono font-bold focus:outline-none focus:border-amber-500"
                          />
                        </div>

                        <div>
                          <div className="flex justify-between items-center mb-1">
                            <label className="text-[11px] text-neutral-400 font-semibold">Quantity:</label>
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleSetW308Fraction(1.0)}
                                className="text-[10px] bg-[#222a3a] hover:bg-emerald-600 hover:text-white px-2 py-0.5 rounded text-emerald-400 font-bold font-mono transition-colors"
                              >
                                Max Cash
                              </button>
                              <button
                                onClick={() => handleSetW308Fraction(0.5)}
                                className="text-[10px] bg-[#222a3a] hover:bg-amber-600 hover:text-white px-2 py-0.5 rounded text-amber-400 font-bold font-mono transition-colors"
                              >
                                50%
                              </button>
                              <button
                                onClick={() => handleSetW308Fraction(0.25)}
                                className="text-[10px] bg-[#222a3a] hover:bg-cyan-600 hover:text-white px-2 py-0.5 rounded text-cyan-400 font-bold font-mono transition-colors"
                              >
                                25%
                              </button>
                            </div>
                          </div>
                          <input
                            type="number"
                            value={w308Qty}
                            onChange={(e) => setW308Qty(Number(e.target.value))}
                            className="w-full bg-[#13161f] border border-[#2a3447] rounded-lg px-3 py-1.5 text-xs text-emerald-400 font-mono font-bold focus:outline-none focus:border-emerald-500"
                          />
                        </div>
                      </div>

                      <div className="text-[11px] text-neutral-500 pt-2 border-t border-[#232b3b]">
                        Active Capital: <strong>{unlimitedBudget ? 'Unlimited' : formatGp(cashStack)}</strong>
                      </div>
                    </div>

                    {/* Results in Center (5 cols) */}
                    <div className="lg:col-span-5 bg-[#191e29] p-4 rounded-xl border border-[#252c3c] flex flex-col justify-between space-y-3 font-mono">
                      <div className="grid grid-cols-2 gap-3 text-xs">
                        {w308Role === 'buyer' ? (
                          <>
                            <div className="bg-[#13161f] p-2.5 rounded-lg border border-[#202738]">
                              <span className="text-[11px] text-neutral-500 block">Coins To Give:</span>
                              <span className="text-amber-400 font-bold text-sm">
                                {validatorTotals.totalCoins.toLocaleString()} gp
                              </span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                Type: <strong className="text-white">{validatorTotals.shorthand}</strong>
                              </span>
                            </div>

                            <div className="bg-[#13161f] p-2.5 rounded-lg border border-[#202738]">
                              <span className="text-[11px] text-neutral-500 block">High Alch Gross:</span>
                              <span className="text-purple-400 font-bold text-sm">
                                {(validatorTotals as any).totalAlch?.toLocaleString()} gp
                              </span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                {formatGp((validatorTotals as any).totalAlch || 0)}
                              </span>
                            </div>

                            <div className="bg-[#13161f] p-2.5 rounded-lg border border-[#202738]">
                              <span className="text-[11px] text-neutral-500 block">Nature Runes Cost:</span>
                              <span className="text-cyan-400 font-bold text-sm">
                                {(validatorTotals as any).totalNats?.toLocaleString()} gp
                              </span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                {w308Qty.toLocaleString()} @ {effectiveNatPrice} ea
                              </span>
                            </div>

                            <div className="bg-[#13161f] p-2.5 rounded-lg border border-[#202738]">
                              <span className="text-[11px] text-neutral-500 block">Net Profit:</span>
                              <span className={`font-bold text-sm ${(validatorTotals.netProfit >= 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {validatorTotals.netProfit >= 0 ? '+' : ''}{validatorTotals.netProfit.toLocaleString()} gp
                              </span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                +{validatorTotals.profitEa.toLocaleString()} gp / ea
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-[#13161f] p-2.5 rounded-lg border border-[#202738]">
                              <span className="text-[11px] text-neutral-500 block">Coins To Receive:</span>
                              <span className="text-amber-400 font-bold text-sm">
                                {validatorTotals.totalCoins.toLocaleString()} gp
                              </span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                Type: <strong className="text-white">{validatorTotals.shorthand}</strong>
                              </span>
                            </div>

                            <div className="bg-[#13161f] p-2.5 rounded-lg border border-[#202738]">
                              <span className="text-[11px] text-neutral-500 block">GE Material Cost:</span>
                              <span className="text-rose-400 font-bold text-sm">
                                {(validatorTotals as any).totalMatCost?.toLocaleString()} gp
                              </span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                {(validatorTotals as any).matCostEa?.toLocaleString()} gp / ea
                              </span>
                            </div>

                            <div className="bg-[#13161f] p-2.5 rounded-lg border border-[#202738]">
                              <span className="text-[11px] text-neutral-500 block">Training XP:</span>
                              <span className="text-purple-400 font-bold text-sm">
                                +{(validatorTotals as any).totalXp?.toLocaleString()} XP
                              </span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                {(validatorTotals as any).skill} (+{(validatorTotals as any).xpEa} ea)
                              </span>
                            </div>

                            <div className="bg-[#13161f] p-2.5 rounded-lg border border-[#202738]">
                              <span className="text-[11px] text-neutral-500 block">Net Smither Profit:</span>
                              <span className={`font-bold text-sm ${(validatorTotals.netProfit >= 0) ? 'text-emerald-400' : 'text-rose-400'}`}>
                                {validatorTotals.netProfit >= 0 ? '+' : ''}{validatorTotals.netProfit.toLocaleString()} gp
                              </span>
                              <span className="text-[11px] text-neutral-400 block mt-0.5">
                                {(validatorTotals as any).marginPct?.toFixed(1)}% margin
                              </span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Cash Stack / Budget Status Bar */}
                      <div className="p-2.5 rounded-lg bg-[#13161f] border border-[#202738] text-[11px] flex items-center justify-between">
                        {w308Role === 'buyer' ? (
                          validatorTotals.overBudget ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1.5">
                              ⚠️ Over Budget by {validatorTotals.deficit.toLocaleString()} gp! (Stack: {formatGp(cashStack)})
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                              🪙 Money Stack: {formatGp(cashStack)} | Remaining Change: {(validatorTotals as any).remainingCash?.toLocaleString()} gp
                            </span>
                          )
                        ) : (
                          validatorTotals.overBudget ? (
                            <span className="text-rose-400 font-bold flex items-center gap-1.5">
                              ⚠️ Need {(validatorTotals as any).totalMatCost?.toLocaleString()} gp for materials! (Deficit: {validatorTotals.deficit.toLocaleString()} gp)
                            </span>
                          ) : (
                            <span className="text-emerald-400 font-semibold flex items-center gap-1.5">
                              🪙 Material Budget: {formatGp(cashStack)} | Surplus: {(validatorTotals as any).remainingBudget?.toLocaleString()} gp
                            </span>
                          )
                        )}
                      </div>

                      {/* 2nd Screen Verification Warning */}
                      <div className="text-[11px] text-amber-300 bg-amber-500/10 p-2 rounded-lg border border-amber-500/20 font-sans leading-relaxed">
                        {w308Role === 'buyer' ? (
                          <>⌨️ <strong>Trade Screen:</strong> Offer-X Coins ➔ Type &apos;<strong className="text-amber-400 font-mono">{validatorTotals.shorthand}</strong>&apos; (Enter) | Verify: <strong>{w308Qty.toLocaleString()} noted {w308SelectedItem}</strong></>
                        ) : (
                          <>🛡️ <strong>2nd Trade Screen:</strong> Offer <strong>{w308Qty.toLocaleString()} noted {w308SelectedItem}</strong> | VERIFY BUYER OFFERS EXACTLY <strong className="text-amber-400 font-mono">{validatorTotals.totalCoins.toLocaleString()} gp</strong> (Type: {validatorTotals.shorthand})!</>
                        )}
                      </div>
                    </div>

                    {/* Actions on Right (3 cols) */}
                    <div className="lg:col-span-3 bg-[#191e29] p-4 rounded-xl border border-[#252c3c] flex flex-col justify-between space-y-2">
                      <div className="space-y-2">
                        <button
                          onClick={handleCopyTradeShorthand}
                          className="w-full bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold py-2.5 px-3 rounded-lg transition-all shadow-md shadow-amber-500/20 flex items-center justify-center gap-1.5 font-mono"
                        >
                          <Copy className="w-3.5 h-3.5 shrink-0" />
                          {w308Role === 'buyer' ? `⌨️ Type: ${validatorTotals.shorthand}` : `🛡️ Verify: ${validatorTotals.shorthand}`}
                        </button>

                        <button
                          onClick={handleCopyValidatorAd}
                          className="w-full bg-[#242b3d] hover:bg-[#2d374f] text-cyan-300 border border-[#34405a] text-xs font-bold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
                        >
                          <Send className="w-3.5 h-3.5 shrink-0" />
                          📢 Copy Trade Ad
                        </button>

                        <button
                          onClick={handleLogW308ToSession}
                          className="w-full bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold py-2.5 px-3 rounded-lg transition-all flex items-center justify-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5 shrink-0" />
                          ✓ Log To Session
                        </button>
                      </div>

                      <div className="text-[10px] text-neutral-500 text-center">
                        Clicking &apos;Type&apos; copies the shorthand to paste into Offer-X prompt directly.
                      </div>
                    </div>
                  </div>

                  {/* Margins Table (All W308 Staples with Sorting parity) */}
                  <div className="overflow-x-auto pt-2">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#1a1f2b] text-neutral-400 uppercase text-[11px] border-b border-[#262e3f] select-none">
                        <tr>
                          <th onClick={() => toggleSortW308('name')} className="px-3 py-2.5 cursor-pointer hover:text-white">
                            Bulk Item {w308SortCol === 'name' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortW308('trade_price')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            {w308Role === 'buyer' ? 'W308 Buy (ea)' : 'W308 Sell (ea)'} {w308SortCol === 'trade_price' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortW308('ge_price')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            GE Instant {w308SortCol === 'ge_price' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortW308('alch')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            High Alch {w308SortCol === 'alch' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortW308('profit_ea')} className="px-3 py-2.5 text-right text-emerald-400 cursor-pointer hover:text-white">
                            Profit / Ea {w308SortCol === 'profit_ea' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortW308('margin_pct')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            Margin % {w308SortCol === 'margin_pct' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortW308('max_stack')} className="px-3 py-2.5 text-center cursor-pointer hover:text-white">
                            Max Stack {w308SortCol === 'max_stack' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortW308('total_spend')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            Total Spend {w308SortCol === 'total_spend' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortW308('expected_profit')} className="px-3 py-2.5 text-right text-amber-400 cursor-pointer hover:text-white">
                            Expected Profit {w308SortCol === 'expected_profit' && (w308SortAsc ? '▲' : '▼')}
                          </th>
                          <th className="px-3 py-2.5 text-center">Chat Ad Copy</th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2433]">
                        {w308Items.map((item) => (
                          <tr
                            key={item.id}
                            className={`hover:bg-[#1a202c]/60 transition-colors ${w308SelectedItem === item.name ? 'bg-amber-500/5' : ''}`}
                          >
                            <td className="px-3 py-2.5 font-sans font-bold text-white flex items-center gap-2">
                              <img
                                src={`https://static.runelite.net/cache/item/icon/${item.id}.png`}
                                alt=""
                                className="w-5 h-5 object-contain shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span>{item.name}</span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-cyan-300 font-bold">
                              {item.trade_price.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-400">
                              {item.ge_price.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-300">
                              {item.alch.toLocaleString()} gp
                            </td>
                            <td className={`px-3 py-2.5 text-right font-bold ${item.profit_ea >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                              {item.profit_ea >= 0 ? '+' : ''}{item.profit_ea.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-400">
                              {item.margin_pct.toFixed(1)}%
                            </td>
                            <td className="px-3 py-2.5 text-center text-neutral-200">
                              {item.max_stack.toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-300">
                              {formatGp(item.total_spend)}
                            </td>
                            <td className="px-3 py-2.5 text-right text-amber-400 font-extrabold">
                              +{item.expected_profit.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => {
                                  navigator.clipboard.writeText(item.chat_ad);
                                  showToast(`📢 Copied: "${item.chat_ad}"`);
                                }}
                                className="px-2 py-1 rounded bg-[#202738] hover:bg-cyan-600 hover:text-white text-[11px] text-cyan-300 font-sans transition-colors inline-flex items-center gap-1"
                              >
                                <Copy className="w-3 h-3" />
                                Copy Ad
                              </button>
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <button
                                onClick={() => handleSelectW308Item(item.name)}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold font-sans transition-all ${w308SelectedItem === item.name ? 'bg-amber-500 text-black' : 'bg-[#222a3a] hover:bg-amber-500 hover:text-black text-neutral-300'}`}
                              >
                                {w308SelectedItem === item.name ? 'Selected' : 'Select'}
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* Sub-view: Smart Recommendations (Desktop gui.py:1735-1825 parity) */}
            {alchSubView === 'rec' && (
              <div className="space-y-6">
                {/* Category Radio Selector & Action Controls Bar */}
                <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] shadow-lg flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="text-amber-400 font-bold text-xs mr-2">Category:</span>
                    {[
                      { id: 'workhorse', label: '🏆 All-Time Workhorses', tip: 'Proven high-volume alch staples that rarely fail (Rune armor, weapons, battlestaves).' },
                      { id: 'fast', label: '⚡ Fast Fills (<5m)', tip: 'Items with rapid transaction velocity and live 5m sales activity that fill in under 5 minutes.' },
                      { id: 'batch', label: '💰 Top 4h Batch Profit', tip: 'Items ranked by total profit achievable in a single 4-hour GE limit cycle.' },
                      { id: 'overnight', label: '🌙 Overnight Sleepers', tip: 'High-margin items ideal for leaving patient bids overnight during off-peak hours.' },
                    ].map((cat) => (
                      <button
                        key={cat.id}
                        onClick={() => setRecCategory(cat.id as any)}
                        title={cat.tip}
                        className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${recCategory === cat.id ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20' : 'bg-[#1b202c] text-neutral-300 hover:text-white border border-[#262f40]'}`}
                      >
                        {cat.label}
                      </button>
                    ))}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={handleAutoFillGeSlots}
                      title="Inspects your remaining empty GE slots (up to 8) and automatically allocates the top recommended items into your shopping cart, fitted to your cash stack budget!"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold px-3 py-1.5 rounded-lg transition-all shadow-md shadow-emerald-600/20 flex items-center gap-1.5"
                    >
                      <Zap className="w-3.5 h-3.5" />
                      ⚡ Auto-Fill Empty GE Slots
                    </button>
                    <button
                      onClick={handleCopyAllRecs}
                      title="Copy formatted text list of all displayed recommendations to clipboard."
                      className="bg-[#242b3d] hover:bg-[#2d374f] text-cyan-300 border border-[#34405a] text-xs font-bold px-3 py-1.5 rounded-lg transition-all flex items-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      📋 Copy All
                    </button>
                    <button
                      onClick={() => showToast('Refreshed recommendation calculations with latest GE prices.')}
                      title="Refresh recommendations using latest live GE prices."
                      className="bg-[#1b202c] hover:bg-[#252c3d] text-neutral-300 border border-[#2b3547] text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex items-center gap-1"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh
                    </button>
                  </div>
                </div>

                {/* Recommendations Table */}
                <div className="bg-[#14171f] p-5 rounded-2xl border border-[#242b3b] space-y-4">
                  <div className="flex justify-between items-center text-xs text-neutral-400">
                    <span>Showing <strong>{recRows.length}</strong> top recommended items for &apos;{recCategory}&apos;</span>
                    <span className="italic">💡 Click any item name to copy. Double-click or click &apos;+ Cart&apos; to allocate into Grand Exchange slots.</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs font-mono">
                      <thead className="bg-[#1a1f2b] text-neutral-400 uppercase text-[11px] border-b border-[#262e3f] select-none">
                        <tr>
                          <th className="px-3 py-2.5 text-center">Rank</th>
                          <th onClick={() => toggleSortRec('name')} className="px-3 py-2.5 cursor-pointer hover:text-white">
                            Item Name {recSortCol === 'name' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('category')} className="px-3 py-2.5 text-center cursor-pointer hover:text-white">
                            Category {recSortCol === 'category' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('target_bid')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            Target Bid {recSortCol === 'target_bid' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('alch_val')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            Alch Value {recSortCol === 'alch_val' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('profit_ea')} className="px-3 py-2.5 text-right text-emerald-400 cursor-pointer hover:text-white">
                            Profit / Alch {recSortCol === 'profit_ea' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('limit')} className="px-3 py-2.5 text-center cursor-pointer hover:text-white">
                            4h Limit {recSortCol === 'limit' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('batch_profit')} className="px-3 py-2.5 text-right text-amber-400 cursor-pointer hover:text-white">
                            4h Batch Profit {recSortCol === 'batch_profit' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('speed')} className="px-3 py-2.5 text-center cursor-pointer hover:text-white">
                            Fill Speed {recSortCol === 'speed' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('batch_cost')} className="px-3 py-2.5 text-right cursor-pointer hover:text-white">
                            Batch Spend {recSortCol === 'batch_cost' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th onClick={() => toggleSortRec('verdict')} className="px-3 py-2.5 cursor-pointer hover:text-white min-w-[200px]">
                            Why Buy? / Verdict {recSortCol === 'verdict' && (recSortAsc ? '▲' : '▼')}
                          </th>
                          <th className="px-3 py-2.5 text-center">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2433]">
                        {recRows.map((row, idx) => {
                          const inCart = cartItems.some(c => c.id === row.id);
                          return (
                          <tr
                            key={row.id}
                            onDoubleClick={() => handleToggleCart({ id: row.id, name: row.name, buy_price: row.target_bid, buy_limit: row.limit, profit: row.profit_ea })}
                            className="hover:bg-[#1a202c]/60 transition-colors cursor-pointer"
                          >
                            <td className="px-3 py-2.5 text-center font-bold text-neutral-500">
                              #{idx + 1}
                            </td>
                            <td
                              onClick={(e) => {
                                e.stopPropagation();
                                navigator.clipboard.writeText(row.name);
                                showToast(`Copied "${row.name}"`);
                              }}
                              className="px-3 py-2.5 font-sans font-bold text-white flex items-center gap-2 hover:text-amber-400 transition-colors"
                              title="Click to copy name to clipboard"
                            >
                              <img
                                src={`https://static.runelite.net/cache/item/icon/${row.id}.png`}
                                alt=""
                                className="w-5 h-5 object-contain shrink-0"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span>{row.name}</span>
                            </td>
                            <td className="px-3 py-2.5 text-center font-sans">
                              <span className="text-[10px] px-2 py-0.5 rounded bg-[#202738] text-amber-300 font-semibold border border-amber-500/20">
                                {row.category}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-300 font-bold">
                              {row.target_bid.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-400">
                              {row.alch_val.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-right font-bold text-emerald-400">
                              +{row.profit_ea.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-center text-neutral-300">
                              {row.limit.toLocaleString()}
                            </td>
                            <td className="px-3 py-2.5 text-right font-extrabold text-amber-400">
                              +{row.batch_profit.toLocaleString()} gp
                            </td>
                            <td className="px-3 py-2.5 text-center">
                              <span className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-800 text-neutral-200 font-semibold font-sans">
                                {row.speed}
                              </span>
                            </td>
                            <td className="px-3 py-2.5 text-right text-neutral-400">
                              {formatGp(row.batch_cost)}
                            </td>
                            <td className="px-3 py-2.5 font-sans text-neutral-300 text-[11px] leading-relaxed">
                              {row.verdict}
                            </td>
                            <td className="px-3 py-2.5 text-center" onClick={(e) => e.stopPropagation()}>
                              <button
                                onClick={() => handleToggleCart({ id: row.id, name: row.name, buy_price: row.target_bid, buy_limit: row.limit, profit: row.profit_ea })}
                                className={`px-2.5 py-1 rounded text-[11px] font-bold font-sans transition-all border ${inCart ? 'bg-emerald-500 text-black border-emerald-400' : 'bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-300 border-amber-500/30'}`}
                              >
                                {inCart ? '✓ In Cart' : '+ Cart'}
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
        {/* SUPER-HUB 2: CRAFTING WORKSHOP (452 TOTAL RECIPES)        */}
        {/* ========================================================= */}
        {activeTab === 'craft_hub' && (
          <div className="space-y-6">
            {/* Workshop Mode Switcher */}
            <div className="flex flex-wrap gap-2 border-b border-[#202530] pb-4">
              <button
                onClick={() => setCraftSubTab('ge_sell')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  craftSubTab === 'ge_sell'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#14171f] text-neutral-400 hover:text-white border border-[#232938]'
                }`}
              >
                💰 Craft & Sell on GE (229 Recipes)
              </button>
              <button
                onClick={() => setCraftSubTab('craft_alch')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  craftSubTab === 'craft_alch'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#14171f] text-neutral-400 hover:text-white border border-[#232938]'
                }`}
              >
                🔨 Craft & Direct Alch (223 Recipes)
              </button>
              <button
                onClick={() => setCraftSubTab('guide')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  craftSubTab === 'guide'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#14171f] text-neutral-400 hover:text-white border border-[#232938]'
                }`}
              >
                📖 Level Training Guide (Smithing, Fletching, Crafting, Magic)
              </button>
            </div>

            {/* Filter Bar with Skill Filters & Level Inputs (Only shown for recipe production) */}
            {craftSubTab !== 'guide' && (
            <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] space-y-3">
              <div className="flex flex-col md:flex-row gap-4 justify-between items-center">
                <div className="relative w-full md:w-96">
                  <Search className="w-4 h-4 absolute left-3 top-3 text-neutral-500" />
                  <input
                    type="text"
                    placeholder="Search recipes (potions, d'hides, staves, jewelry, bolts)..."
                    value={craftSearch}
                    onChange={(e) => setCraftSearch(e.target.value)}
                    className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-amber-500 text-white placeholder-neutral-500"
                  />
                </div>

                <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto text-xs">
                  {[
                    { id: 'all', label: 'All Skills' },
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

              {/* Player Stats & Usable Filter */}
              <div className="flex flex-wrap items-center justify-between pt-2 border-t border-[#1e2433] text-xs gap-3">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 font-semibold">
                    <input
                      type="checkbox"
                      checked={onlyUsableRecipes}
                      onChange={(e) => setOnlyUsableRecipes(e.target.checked)}
                      className="rounded accent-amber-500"
                    />
                    Only Show Usable Recipes
                  </label>
                </div>

                {/* Level Quick Inputs */}
                <div className="flex flex-wrap items-center gap-3 text-neutral-400 font-medium">
                  <span className="text-[11px] text-neutral-500">Your Levels:</span>
                  {[
                    { key: 'crafting', label: 'Craft' },
                    { key: 'smithing', label: 'Smith' },
                    { key: 'fletching', label: 'Fletch' },
                    { key: 'magic', label: 'Mage' },
                    { key: 'herblore', label: 'Herb' },
                  ].map((s) => (
                    <div key={s.key} className="flex items-center gap-1 bg-[#191e28] px-2 py-0.5 rounded border border-[#252c3c]">
                      <span>{s.label}:</span>
                      <input
                        type="number"
                        value={playerLevels[s.key] || 1}
                        onChange={(e) => handleUpdatePlayerLevel(s.key, Number(e.target.value))}
                        className="w-8 bg-transparent text-amber-400 font-bold font-mono focus:outline-none"
                      />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            )}

            {/* MODE 1: CRAFT & SELL GE (229 RECIPES) */}
            {craftSubTab === 'ge_sell' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredGeRecipes.map((recipe, idx) => (
                  <div key={idx} className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] hover:border-amber-500/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://static.runelite.net/cache/item/icon/${recipe.output_id}.png`}
                            alt=""
                            className="w-6 h-6 object-contain shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <h3 className="font-bold text-white text-base">{recipe.name}</h3>
                        </div>
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
            )}

            {/* MODE 2: CRAFT & ALCH (223 RECIPES) */}
            {craftSubTab === 'craft_alch' && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredCraftAlchRecipes.map((recipe, idx) => (
                  <div key={idx} className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] hover:border-amber-500/30 transition-all flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between mb-1.5">
                        <div className="flex items-center gap-2">
                          <img
                            src={`https://static.runelite.net/cache/item/icon/${recipe.output_id}.png`}
                            alt=""
                            className="w-6 h-6 object-contain shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <h3 className="font-bold text-white text-base">{recipe.name}</h3>
                        </div>
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
                          <span className="text-neutral-400">High Alch Value:</span>
                          <span className="font-mono text-neutral-200">
                            {recipe.highalch > 0 ? `${recipe.highalch.toLocaleString()} gp` : '—'}
                          </span>
                        </div>
                        <div className="flex justify-between pt-1 border-t border-[#232938]">
                          <span className="text-neutral-400">Profit (Craft + Alch):</span>
                          <span className={`font-mono font-bold ${recipe.profit > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                            {recipe.profit > 0 ? `+${recipe.profit.toLocaleString()}` : recipe.profit.toLocaleString()} gp
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-neutral-400">Bonus vs Buying Finished:</span>
                          <span className={`font-mono font-semibold ${recipe.bonus_vs_buy > 0 ? 'text-cyan-400' : 'text-neutral-400'}`}>
                            {recipe.bonus_vs_buy > 0 ? `+${recipe.bonus_vs_buy.toLocaleString()} gp extra` : 'None'}
                          </span>
                        </div>
                        <div className="flex justify-between text-cyan-400 font-semibold">
                          <span>XP Rate:</span>
                          <span>+{recipe.xp} XP ({(recipe.xp_rate / 1000).toFixed(0)}k XP/hr)</span>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-[#1e2433] flex justify-between items-center text-xs text-neutral-400">
                      <span>Craft + Alch GP/hr: <strong className="text-amber-400">+{(recipe.hourly_profit / 1000).toFixed(0)}k/hr</strong></span>
                      <span className={recipe.profit > 0 ? 'text-emerald-400 font-bold' : 'text-neutral-500'}>
                        {recipe.profit > 0 ? 'Profitable' : 'Loss'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* MODE 3: LEVEL TRAINING GUIDE (Smithing, Fletching, Crafting, Magic) */}
            {craftSubTab === 'guide' && (() => {
              const skillData = (skillingGuidesData as any)[guideSkill] || { quests: [], brackets: [] };
              const currentXp = getXpForLevel(guideCurrentLevel);
              const targetXp = getXpForLevel(guideTargetLevel);
              const remXp = Math.max(0, targetXp - currentXp);
              const progressPct = targetXp > 0 ? Math.min(100, Math.max(0, (currentXp / targetXp) * 100)) : 0;
              const isP2P = guideMembers;

              return (
                <div className="space-y-6">
                  {/* Skill Selector & Guide Settings Bar */}
                  <div className="bg-[#14171f] p-5 rounded-xl border border-[#242b3b] space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                      {/* Skill Switcher */}
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: 'Smithing', label: '🔨 Smithing' },
                          { id: 'Fletching', label: '🏹 Fletching' },
                          { id: 'Crafting', label: '🧵 Crafting' },
                          { id: 'Magic', label: '🔮 Magic' },
                        ].map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setGuideSkill(s.id as any)}
                            className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                              guideSkill === s.id
                                ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                                : 'bg-[#1b202c] text-neutral-400 hover:text-white border border-[#2e374d]'
                            }`}
                          >
                            {s.label}
                          </button>
                        ))}
                      </div>

                      {/* Members toggle & Style filter */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <label className="flex items-center gap-1.5 cursor-pointer text-neutral-300 font-semibold bg-[#1b202c] px-3 py-1.5 rounded-lg border border-[#2e374d]">
                          <input
                            type="checkbox"
                            checked={guideMembers}
                            onChange={(e) => setGuideMembers(e.target.checked)}
                            className="rounded accent-amber-500"
                          />
                          Members (P2P)
                        </label>

                        <div className="flex items-center gap-1 bg-[#1b202c] p-1 rounded-lg border border-[#2e374d]">
                          {[
                            { id: 'all', label: 'All Styles' },
                            { id: 'fast', label: '⚡ Fast' },
                            { id: 'profit', label: '💰 Profit' },
                            { id: 'afk', label: '🧘 AFK' },
                          ].map((st) => (
                            <button
                              key={st.id}
                              onClick={() => setGuideStyleFilter(st.id as any)}
                              className={`px-2.5 py-1 rounded text-[11px] font-bold transition-all ${
                                guideStyleFilter === st.id
                                  ? 'bg-amber-500 text-black'
                                  : 'text-neutral-400 hover:text-white'
                              }`}
                            >
                              {st.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Level Controls & Quick Selectors */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 pt-3 border-t border-[#1e2433] text-xs">
                      <div>
                        <label className="text-neutral-400 block mb-1">Current Level:</label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={guideCurrentLevel}
                          onChange={(e) => setGuideCurrentLevel(Math.min(99, Math.max(1, Number(e.target.value))))}
                          className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-1.5 text-white font-mono font-bold"
                        />
                      </div>
                      <div>
                        <label className="text-neutral-400 block mb-1">Target Level:</label>
                        <input
                          type="number"
                          min={1}
                          max={99}
                          value={guideTargetLevel}
                          onChange={(e) => setGuideTargetLevel(Math.min(99, Math.max(1, Number(e.target.value))))}
                          className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-1.5 text-amber-400 font-mono font-bold"
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="text-neutral-400 block mb-1">Quick Target Level:</label>
                        <div className="flex gap-2">
                          {[50, 70, 85, 92, 99].map((lvl) => (
                            <button
                              key={lvl}
                              onClick={() => setGuideTargetLevel(lvl)}
                              className={`flex-1 py-1.5 rounded-lg border text-xs font-mono font-bold transition-all ${
                                guideTargetLevel === lvl
                                  ? 'bg-amber-500 text-black border-amber-400'
                                  : 'bg-[#1b202c] text-neutral-300 border-[#2e374d] hover:bg-[#252c3c]'
                              }`}
                            >
                              {lvl}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fletching F2P Warning Banner if applicable */}
                  {guideSkill === 'Fletching' && !guideMembers && (
                    <div className="bg-amber-500/10 border border-amber-500/30 p-4 rounded-xl text-xs text-amber-300 flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 flex-shrink-0" />
                      <span>
                        ⚠️ <strong>Fletching is a Members-only skill in Old School RuneScape.</strong> Check the &quot;Members (P2P)&quot; toggle above to view bow, dart, and bolt training recipes.
                      </span>
                    </div>
                  )}

                  {/* XP & Progress KPI Summary Banner */}
                  <div className="bg-[#14171f] p-5 rounded-xl border border-[#242b3b] space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                      <div>
                        <span className="text-xs text-neutral-400 uppercase tracking-wider font-bold">Progression Milestone</span>
                        <h4 className="text-lg font-bold text-white">
                          Level {guideCurrentLevel} ➔ Level {guideTargetLevel} ({guideSkill})
                        </h4>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-neutral-400">Total XP Required: </span>
                        <span className="text-amber-400 font-bold font-mono text-sm">{remXp.toLocaleString()} XP</span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="space-y-1">
                      <div className="w-full h-3 bg-[#1e2433] rounded-full overflow-hidden border border-[#2b3547]">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-yellow-400 transition-all duration-300"
                          style={{ width: `${progressPct}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between text-[11px] text-neutral-400 font-mono">
                        <span>Current XP: {currentXp.toLocaleString()}</span>
                        <span>{progressPct.toFixed(1)}%</span>
                        <span>Target XP: {targetXp.toLocaleString()}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-2 text-xs">
                      <div className="bg-[#191e28] p-3 rounded-lg border border-[#242c3d]">
                        <span className="text-neutral-400 block text-[11px]">Current XP</span>
                        <span className="text-white font-mono font-bold text-sm">{currentXp.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#191e28] p-3 rounded-lg border border-[#242c3d]">
                        <span className="text-neutral-400 block text-[11px]">Target XP</span>
                        <span className="text-white font-mono font-bold text-sm">{targetXp.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#191e28] p-3 rounded-lg border border-[#242c3d]">
                        <span className="text-neutral-400 block text-[11px]">Remaining XP</span>
                        <span className="text-amber-400 font-mono font-bold text-sm">{remXp.toLocaleString()}</span>
                      </div>
                      <div className="bg-[#191e28] p-3 rounded-lg border border-[#242c3d]">
                        <span className="text-neutral-400 block text-[11px]">Progression Status</span>
                        <span className="text-emerald-400 font-bold text-sm">
                          {guideCurrentLevel >= guideTargetLevel ? '🎯 Goal Reached!' : `${guideTargetLevel - guideCurrentLevel} Levels Left`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quest Skips & Shortcuts Section */}
                  {skillData.quests && skillData.quests.length > 0 && (
                    <div className="bg-[#14171f] p-5 rounded-xl border border-[#242b3b] space-y-3">
                      <h4 className="text-sm font-bold text-white flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-amber-400" />
                        Essential Early Quest Skips & Shortcuts ({guideSkill})
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Complete these quests first to bypass the slowest early levels without spending GP or crafting low-tier materials:
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
                        {skillData.quests
                          .filter((q: any) => isP2P || !q.members)
                          .map((q: any, idx: number) => (
                            <div key={idx} className="bg-[#191e28] p-3.5 rounded-xl border border-[#242c3d] space-y-1.5 text-xs">
                              <div className="flex justify-between items-start">
                                <span className="font-bold text-amber-400 text-sm flex items-center gap-1.5">
                                  📜 {q.name}
                                </span>
                                <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${q.members ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'}`}>
                                  {q.members ? 'P2P' : 'F2P'} • +{q.xp.toLocaleString()} XP
                                </span>
                              </div>
                              <p className="text-emerald-300 font-semibold text-[11px]">{q.skip}</p>
                              <div className="text-[11px] text-neutral-400">
                                <strong>Reqs:</strong> {q.reqs}
                              </div>
                              <p className="text-neutral-300 text-[11px] italic pt-1 border-t border-white/5">
                                💡 {q.tip}
                              </p>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}

                  {/* Level Brackets Table */}
                  <div className="bg-[#14171f] rounded-xl border border-[#242b3b] overflow-hidden">
                    <div className="p-4 border-b border-[#242b3b] flex justify-between items-center">
                      <div>
                        <h4 className="font-bold text-white text-sm">Level Progression Brackets (1–99)</h4>
                        <p className="text-xs text-neutral-400">Optimal training methods, XP rates, material inputs, and disposal verdicts.</p>
                      </div>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-xs text-left">
                        <thead className="bg-[#0f1219] text-neutral-400 uppercase text-[10px] font-mono border-b border-[#242b3b]">
                          <tr>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3">Level</th>
                            <th className="px-3 py-3">Method / Item</th>
                            <th className="px-3 py-3 text-right">XP/Act</th>
                            <th className="px-3 py-3 text-right">Actions Needed</th>
                            <th className="px-3 py-3">Materials Required</th>
                            <th className="px-3 py-3">Best Disposal</th>
                            <th className="px-3 py-3 text-right">GP/XP</th>
                            <th className="px-3 py-3">Verdict / Guide Tip</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-[#1e2433]">
                          {skillData.brackets
                            .filter((b: any) => {
                              if (!isP2P && b.members) return false;
                              if (guideStyleFilter !== 'all' && b.style !== guideStyleFilter && b.style !== 'quest') return false;
                              return true;
                            })
                            .map((b: any, idx: number) => {
                              const isCompleted = guideCurrentLevel >= b.max_lvl;
                              const isCurrent = b.min_lvl <= guideCurrentLevel && guideCurrentLevel < b.max_lvl;
                              const isLocked = guideCurrentLevel < b.min_lvl;

                              // Actions calculation
                              let actionsNeeded = 0;
                              if (isCompleted) {
                                actionsNeeded = 0;
                              } else {
                                const stepStart = Math.max(currentXp, getXpForLevel(b.min_lvl));
                                const stepEnd = Math.min(targetXp, getXpForLevel(b.max_lvl));
                                const xpNeeded = Math.max(0, stepEnd - stepStart);
                                actionsNeeded = b.xp_per_action > 0 ? Math.ceil(xpNeeded / b.xp_per_action) : 0;
                              }

                              // Materials text
                              const mats = b.materials || [];
                              const matsStr = mats.map((m: any) => `${m.qty}x ${m.name}`).join(', ') || 'None / Quest';
                              const totalMatsStr = isCompleted 
                                ? 'Completed' 
                                : actionsNeeded > 0 && mats.length > 0 
                                ? mats.map((m: any) => `${(m.qty * actionsNeeded).toLocaleString()}x ${m.name}`).join(', ')
                                : matsStr;

                              // Style badge
                              const styleBadge = {
                                fast: <span className="bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded text-[9px] font-bold">⚡ Fast</span>,
                                profit: <span className="bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded text-[9px] font-bold">💰 Profit</span>,
                                afk: <span className="bg-cyan-500/10 text-cyan-400 px-1.5 py-0.5 rounded text-[9px] font-bold">🧘 AFK</span>,
                                quest: <span className="bg-purple-500/10 text-purple-400 px-1.5 py-0.5 rounded text-[9px] font-bold">📜 Quest</span>,
                              }[b.style as 'fast' | 'profit' | 'afk' | 'quest'] || null;

                              // Best disposal verdict
                              let disposalMethod = '🎒 Drop / Bank';
                              let gpXpStr = '—';
                              if (b.style === 'quest') {
                                disposalMethod = '📜 Quest Turn-in';
                                gpXpStr = 'FREE';
                              } else if (b.can_alch && b.output_id) {
                                disposalMethod = '🔮 High Alch';
                                gpXpStr = '+0.85 GP/XP';
                              } else if (b.can_sell_ge) {
                                disposalMethod = '💰 GE Sell';
                                gpXpStr = '-2.10 GP/XP';
                              }

                              return (
                                <tr
                                  key={idx}
                                  className={`hover:bg-[#1a202c] transition-colors ${
                                    isCurrent ? 'bg-amber-500/5 border-l-2 border-l-amber-500' : isCompleted ? 'opacity-60' : ''
                                  }`}
                                >
                                  <td className="px-3 py-3">
                                    {isCompleted ? (
                                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                                        <Check className="w-3.5 h-3.5" /> Done
                                      </span>
                                    ) : isCurrent ? (
                                      <span className="text-amber-400 font-bold flex items-center gap-1">
                                        📍 Active
                                      </span>
                                    ) : (
                                      <span className="text-neutral-500 flex items-center gap-1">
                                        🔒 Level {b.min_lvl}
                                      </span>
                                    )}
                                  </td>
                                  <td className="px-3 py-3 font-mono font-bold text-neutral-300">
                                    {b.min_lvl} - {b.max_lvl}
                                  </td>
                                  <td className="px-3 py-3">
                                    <div className="flex items-center gap-2">
                                      {b.output_id > 0 && (
                                        <img
                                          src={`https://static.runelite.net/cache/item/icon/${b.output_id}.png`}
                                          alt=""
                                          className="w-5 h-5 object-contain"
                                          onError={(e) => { e.currentTarget.style.display = 'none'; }}
                                        />
                                      )}
                                      <div>
                                        <span className="font-bold text-white block">{b.item_name || b.name}</span>
                                        <div className="flex items-center gap-1 mt-0.5">
                                          {styleBadge}
                                          {b.xp_rate > 0 && (
                                            <span className="text-[10px] text-neutral-500">
                                              ~{(b.xp_rate / 1000).toFixed(0)}k XP/hr
                                            </span>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  </td>
                                  <td className="px-3 py-3 text-right font-mono font-bold text-cyan-400">
                                    +{b.xp_per_action}
                                  </td>
                                  <td className="px-3 py-3 text-right font-mono font-bold text-amber-400">
                                    {actionsNeeded > 0 ? actionsNeeded.toLocaleString() : isCompleted ? '0' : '—'}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className="text-neutral-300 block">{matsStr}</span>
                                    {totalMatsStr !== matsStr && (
                                      <span className="text-[10px] text-neutral-500 block">Total: {totalMatsStr}</span>
                                    )}
                                  </td>
                                  <td className="px-3 py-3">
                                    <span className="text-neutral-300 font-medium">{disposalMethod}</span>
                                  </td>
                                  <td className="px-3 py-3 text-right font-mono font-bold text-neutral-300">
                                    {gpXpStr}
                                  </td>
                                  <td className="px-3 py-3 text-neutral-400 text-[11px] max-w-xs leading-relaxed">
                                    {b.verdict}
                                  </td>
                                </tr>
                              );
                            })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* ========================================================= */}
        {/* SUPER-HUB 3: BOND ROADMAP & 14-DAY SUSTAINER SIMULATOR    */}
        {/* ========================================================= */}
        {activeTab === 'bond_hub' && (
          <div className="space-y-8 max-w-4xl mx-auto">
            {/* Big Progress Card: Two-Stage Freedom Progress Bar */}
            <div className="bg-[#14171f] p-8 rounded-2xl border border-[#242b3b] shadow-2xl relative overflow-hidden space-y-6">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-amber-400 tracking-wider uppercase">Freedom Engine</span>
                    <span className="text-[10px] bg-emerald-500/10 text-emerald-400 font-bold px-2 py-0.5 rounded border border-emerald-500/20">
                      ⚡ Live OSRS Wiki Ticker
                    </span>
                  </div>
                  <h2 className="text-3xl font-extrabold text-white mt-1">Old School Bond Roadmap</h2>
                  <p className="text-sm text-neutral-400">Two-Stage Transition: [Stage 1: Bond Ticket ➔ Stage 2: P2P Operating Cushion]</p>
                </div>
                <div className="text-left md:text-right">
                  <span className="text-xs text-neutral-400">Current Live Bond Price</span>
                  <div className="text-2xl font-black text-emerald-400 font-mono">
                    {bondPrice.toLocaleString()} gp
                  </div>
                  <span className="text-[11px] text-amber-400 block mt-0.5">🌙 Overnight Patient Dip: ~{(bondBid / 1000000).toFixed(2)}M gp (-{(bondSavings / 1000).toFixed(0)}k savings)</span>
                </div>
              </div>

              {/* Strategy Tip Box */}
              <div className="bg-[#191e29] border border-[#262e3d] rounded-xl p-3 text-xs text-neutral-300 italic">
                💡 <strong>Overnight Dip Sniping:</strong> Never insta-buy a bond during daytime peak hours. Bidding at the overnight valley (01:00–06:00 UTC) saves ~300k–550k gp compared to insta-buying!
              </div>

              {/* Two-Stage Progress Bar Canvas Simulation */}
              {(() => {
                const cushionVal = 8000000; // 8M Recommended Balanced Cushion
                const totalGoal = bondPrice + cushionVal;
                const stage1Pct = Math.min(100, Math.max(0, (totalNetWorth / bondPrice) * 100));
                const stage2Wealth = Math.max(0, totalNetWorth - bondPrice);
                const stage2Pct = Math.min(100, Math.max(0, (stage2Wealth / cushionVal) * 100));
                const isStage1Complete = totalNetWorth >= bondPrice;
                const isFreedomAchieved = totalNetWorth >= totalGoal;

                return (
                  <div className="space-y-3">
                    <div className="flex justify-between text-xs font-semibold">
                      <span className="text-neutral-300">
                        Total Liquid Wealth: <strong className="text-white font-mono">{totalNetWorth.toLocaleString()} gp</strong>
                      </span>
                      <span className="text-amber-400 font-mono font-bold">
                        Stage 1: {stage1Pct.toFixed(1)}% | Stage 2 (8M Cushion): {stage2Pct.toFixed(1)}%
                      </span>
                    </div>

                    {/* Dual Stage Bar */}
                    <div className="w-full h-8 bg-[#1e2433] rounded-xl overflow-hidden p-1 border border-[#2b3547] flex gap-1">
                      {/* Stage 1 segment (Bond) */}
                      <div className="h-full bg-emerald-500/20 rounded-lg relative overflow-hidden flex-1">
                        <div
                          className="h-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${stage1Pct}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow">
                          🎟️ Stage 1: Bond ({(bondPrice / 1000000).toFixed(2)}M)
                        </span>
                      </div>

                      {/* Stage 2 segment (Operating Cushion) */}
                      <div className="h-full bg-amber-500/20 rounded-lg relative overflow-hidden flex-1">
                        <div
                          className={`h-full transition-all duration-500 ${isFreedomAchieved ? 'bg-cyan-400' : 'bg-gradient-to-r from-amber-500 to-yellow-400'}`}
                          style={{ width: `${stage2Pct}%` }}
                        ></div>
                        <span className="absolute inset-0 flex items-center justify-center text-[11px] font-bold text-white drop-shadow">
                          🛡️ Stage 2: Cushion (8.00M)
                        </span>
                      </div>
                    </div>

                    {/* Stage Status Banner */}
                    <div className={`p-2.5 rounded-lg text-xs font-bold text-center border ${
                      isFreedomAchieved
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                        : isStage1Complete
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                        : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                    }`}>
                      {isFreedomAchieved ? (
                        <span>🎉 FREEDOM ACHIEVED! You have {totalNetWorth.toLocaleString()} gp (Bond + Full 8M Cushion). You will enter Members with full buying power!</span>
                      ) : isStage1Complete ? (
                        <span>⚠️ Stage 2: Bond Cost Secured! Building Operating Cushion — Need {(totalGoal - totalNetWorth).toLocaleString()} gp more before redeeming so you don&apos;t enter Members broke!</span>
                      ) : (
                        <span>🔒 Stage 1: Accumulating First Bond — Need {(bondPrice - totalNetWorth).toLocaleString()} gp more to reach Bond purchase threshold.</span>
                      )}
                    </div>
                  </div>
                );
              })()}

              {/* Stats Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="bg-[#191e29] p-4 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Remaining GP to Bond</span>
                  <div className="text-lg font-bold text-white font-mono mt-1">
                    {remainingGp > 0 ? `${remainingGp.toLocaleString()} gp` : 'BOND READY! 🎉'}
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
                <div className="bg-[#191e29] p-4 rounded-xl border border-[#242c3d]">
                  <span className="text-xs text-neutral-400">Operating Cushion Target</span>
                  <div className="text-lg font-bold text-cyan-400 font-mono mt-1">8,000,000 gp</div>
                </div>
              </div>
            </div>

            {/* Pro-Tip Callout: World 308 Anvil GE Limit Bypass Secret */}
            <div className="bg-[#1a252f] p-4 rounded-xl border border-[#2c3e50] space-y-1.5 text-xs text-neutral-200">
              <span className="text-blue-400 font-bold block text-sm">
                ⚡ F2P Speed Secret — How to Alch 12h/Day Without Hitting GE Limits:
              </span>
              <p className="leading-relaxed">
                In F2P, the GE limits you to 70 rune items every 4 hours. To alch continuously without waiting for GE limits, visit World 308 at Varrock West Bank (Join as Clan Guest: &apos;Varrock Mob&apos; or trade in Public Chat). High-level smithers sell thousands of noted Rune 2h swords and battleaxes directly in unlimited bulk for GE mid/low! Zero buy limits!
              </p>
            </div>

            {/* Interactive User Wealth Inputs */}
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
                    Worth: {(userNats * effectiveNatPrice).toLocaleString()} gp
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

            {/* 14-Day Perpetual Membership Sustainer Simulator (Table matching desktop gui.py tree_bond_sustainer) */}
            <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <div>
                  <h3 className="font-bold text-white text-lg flex items-center gap-2">
                    <Ticket className="w-5 h-5 text-amber-400" /> ♾️ 14-Day Perpetual Membership Sustainer Simulator
                  </h3>
                  <p className="text-xs text-neutral-400">
                    [Shows why your FIRST bond is the only hard one — subsequent bonds are 100% self-funding!]
                  </p>
                </div>
              </div>

              {/* Sustainer Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs font-mono">
                  <thead className="bg-[#1a1f2b] text-neutral-400 uppercase text-[11px] border-b border-[#262e3f]">
                    <tr>
                      <th className="px-3 py-2.5">Daily Alch Time</th>
                      <th className="px-3 py-2.5 text-center">14-Day Hours</th>
                      <th className="px-3 py-2.5 text-right">Gross P2P Revenue</th>
                      <th className="px-3 py-2.5 text-center">Next Bond Paid?</th>
                      <th className="px-3 py-2.5 text-right text-emerald-400">14-Day Bank Surplus</th>
                      <th className="px-4 py-2.5">Player Gear &amp; Wealth Milestone</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2433]">
                    {[
                      { daily: "35 - 45 mins / day", hrs: "9.2 hrs", gross: "11,040,000 gp", paid: "✅ 100% Fully Paid", surplus: "+40,000 gp", milestone: "🪙 Infinite Membership (Zero real cash ever again)", color: "text-blue-400" },
                      { daily: "2 Hours / day", hrs: "28.0 hrs", gross: "33,600,000 gp", paid: "✅ 100% Fully Paid", surplus: "+22,600,000 gp", milestone: "⚔️ Mid-Tier Gear (Abyssal whip, Fury, Dragon boots)", color: "text-emerald-400" },
                      { daily: "4 Hours / day", hrs: "56.0 hrs", gross: "67,200,000 gp", paid: "✅ 100% Fully Paid", surplus: "+56,200,000 gp", milestone: "🛡️ High-Tier Gear (Bandos tassets, Ahrim's, Blowpipe)", color: "text-emerald-400 font-bold" },
                      { daily: "6 Hours / day", hrs: "84.0 hrs", gross: "100,800,000 gp", paid: "✅ 100% Fully Paid", surplus: "+89,800,000 gp", milestone: "💎 100M+ Bank (Full Zenyte jewelry, Osmumten's fang)", color: "text-emerald-400 font-bold" },
                      { daily: "8 Hours / day", hrs: "112.0 hrs", gross: "134,400,000 gp", paid: "✅ 100% Fully Paid", surplus: "+123,400,000 gp", milestone: "🏹 Bossing Ready (Bow of Faerdhinen, Crystal armour)", color: "text-amber-400 font-bold" },
                      { daily: "12 Hours / day", hrs: "168.0 hrs", gross: "201,600,000 gp", paid: "✅ 100% Fully Paid", surplus: "+190,600,000 gp", milestone: "👑 Economy Master (+190M liquid surplus every 14 days!)", color: "text-cyan-400 font-bold" },
                    ].map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-[#1a202c]/50">
                        <td className="px-3 py-2.5 font-bold text-white font-sans">{row.daily}</td>
                        <td className="px-3 py-2.5 text-center text-neutral-300">{row.hrs}</td>
                        <td className="px-3 py-2.5 text-right text-neutral-300">{row.gross}</td>
                        <td className="px-3 py-2.5 text-center text-emerald-400 font-bold">{row.paid}</td>
                        <td className="px-3 py-2.5 text-right font-extrabold text-emerald-400">{row.surplus}</td>
                        <td className={`px-4 py-2.5 font-sans ${row.color}`}>{row.milestone}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Bottom Freedom Takeaway Box */}
              <div className="bg-[#1b4332] p-4 rounded-xl border border-[#2d6a4f] space-y-1 text-xs text-[#d8f3dc]">
                <strong className="text-emerald-300 font-bold block text-sm">
                  🏆 The Infinite Membership Guarantee:
                </strong>
                <p className="leading-relaxed">
                  Once you cross into Members with your 8M cushion, you only need ~35 to 45 minutes of alching per day to fund perpetual membership forever. At 12 hours a day, you pay off the next bond in under 1 single day, leaving 13 days of pure compounding profit to build an endgame 100M+ bank!
                </p>
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

                {/* Quick Add Timer Input */}
                <div className="w-full md:w-64">
                  <input
                    type="text"
                    placeholder="Search item to add timer..."
                    value={timerItemSearch}
                    onChange={(e) => setTimerItemSearch(e.target.value)}
                    className="w-full bg-[#1b202c] border border-[#2e374d] rounded-lg px-3 py-1.5 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-amber-500"
                  />
                  {timerItemSearch && (
                    <div className="bg-[#1b202c] border border-[#2e374d] rounded-lg mt-1 max-h-40 overflow-y-auto text-xs space-y-1 p-1">
                      {priceData?.items?.filter(it => it.name.toLowerCase().includes(timerItemSearch.toLowerCase())).slice(0, 5).map(it => (
                        <button
                          key={it.id}
                          onClick={() => {
                            handleAddTimer(it);
                            setTimerItemSearch('');
                          }}
                          className="w-full text-left px-2 py-1 hover:bg-[#252c3f] rounded text-white flex items-center justify-between"
                        >
                          <span>{it.name}</span>
                          <span className="text-neutral-500 text-[10px]">Limit: {it.buy_limit}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Timer list */}
              {timers.length === 0 ? (
                <div className="bg-[#191e29] p-8 rounded-xl border border-[#242c3d] text-center text-xs text-neutral-400 space-y-2">
                  <Clock className="w-8 h-8 text-neutral-500 mx-auto" />
                  <p>No active timers running.</p>
                  <p className="text-neutral-500">Click the clock icon next to any item in the High Alch table or search above to start a 4-hour countdown!</p>
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
                        <div className="flex items-center gap-3">
                          <img
                            src={`https://static.runelite.net/cache/item/icon/${t.id}.png`}
                            alt=""
                            className="w-8 h-8 object-contain shrink-0"
                            onError={(e) => { e.currentTarget.style.display = 'none'; }}
                          />
                          <div>
                            <span className="font-bold text-white text-sm block">{t.name}</span>
                            <span className="text-xs text-neutral-400">Limit: {t.limit} items / 4h</span>
                          </div>
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
          <div className="space-y-6 max-w-5xl mx-auto">
            {/* Session Hub Sub-Tab Switcher */}
            <div className="flex flex-wrap gap-2 border-b border-[#202530] pb-4">
              <button
                onClick={() => setActivitySubTab('session')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activitySubTab === 'session'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#14171f] text-neutral-400 hover:text-white border border-[#232938]'
                }`}
              >
                📋 Live Session Ledger ({sessionLog.length} Batches)
              </button>
              <button
                onClick={() => setActivitySubTab('alerts')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activitySubTab === 'alerts'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#14171f] text-neutral-400 hover:text-white border border-[#232938]'
                }`}
              >
                🔔 Market & Timer Alerts ({timers.filter(t => t.expiresAt > Date.now()).length} Active Timers)
              </button>
              <button
                onClick={() => setActivitySubTab('sync')}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all flex items-center gap-2 ${
                  activitySubTab === 'sync'
                    ? 'bg-amber-500 text-black shadow-md shadow-amber-500/20'
                    : 'bg-[#14171f] text-neutral-400 hover:text-white border border-[#232938]'
                }`}
              >
                🔌 RuneLite Cloud Sync
              </button>
            </div>

            {/* ========================================================= */}
            {/* SUB-VIEW 1: LIVE SESSION PROFIT LEDGER                    */}
            {/* ========================================================= */}
            {activitySubTab === 'session' && (
              <div className="space-y-6">
                {/* 4 KPI Stat Cards (Matching desktop build_session_tab) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b]">
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <Flame className="w-3.5 h-3.5 text-amber-400" /> Total Casts / Trades
                    </span>
                    <div className="text-xl font-black text-white font-mono mt-1">
                      {sessionLog.reduce((s, e) => s + (e.qty || 0), 0).toLocaleString()}
                    </div>
                  </div>
                  <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b]">
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <TrendingUp className="w-3.5 h-3.5 text-emerald-400" /> Realized Net Profit
                    </span>
                    {(() => {
                      const net = sessionLog.reduce((s, e) => s + (e.netProfit || 0), 0);
                      return (
                        <div className={`text-xl font-black font-mono mt-1 ${net >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                          {net >= 0 ? `+${net.toLocaleString()} gp` : `${net.toLocaleString()} gp`}
                        </div>
                      );
                    })()}
                  </div>
                  <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b]">
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-cyan-400" /> Magic XP Gained
                    </span>
                    <div className="text-xl font-black text-cyan-400 font-mono mt-1">
                      {sessionLog.reduce((s, e) => s + (e.magicXp || 0), 0).toLocaleString()} XP
                    </div>
                  </div>
                  <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b]">
                    <span className="text-xs text-neutral-400 flex items-center gap-1.5">
                      <Coins className="w-3.5 h-3.5 text-yellow-400" /> Total Outlay Invested
                    </span>
                    <div className="text-xl font-black text-white font-mono mt-1">
                      {sessionLog.reduce((s, e) => s + (e.totalCoins || 0), 0).toLocaleString()} gp
                    </div>
                  </div>
                </div>

                {/* Ledger Control & Action Bar */}
                <div className="bg-[#14171f] p-4 rounded-xl border border-[#242b3b] flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                  {/* View Mode Toggle */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-neutral-400 font-semibold mr-1">View Mode:</span>
                    <button
                      onClick={() => setSessionViewMode('detailed')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sessionViewMode === 'detailed'
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-[#1b202c] text-neutral-400 hover:text-white border border-[#2e374d]'
                      }`}
                    >
                      📋 Detailed Batch Log
                    </button>
                    <button
                      onClick={() => setSessionViewMode('consolidated')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                        sessionViewMode === 'consolidated'
                          ? 'bg-amber-500 text-black shadow'
                          : 'bg-[#1b202c] text-neutral-400 hover:text-white border border-[#2e374d]'
                      }`}
                    >
                      📦 Consolidated Stacks
                    </button>
                  </div>

                  {/* Actions: Log Manual, Export CSV, Clear */}
                  <div className="flex flex-wrap items-center gap-2 w-full md:w-auto">
                    <button
                      onClick={() => setShowManualLogModal(true)}
                      className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-3.5 py-1.5 rounded-lg text-xs transition-all shadow-md shadow-amber-500/20 flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5 text-black" /> Log Manual Alch
                    </button>
                    <button
                      onClick={handleExportSessionCSV}
                      disabled={sessionLog.length === 0}
                      className="bg-[#1b202c] hover:bg-[#252c3c] text-neutral-300 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all border border-[#2e374d] flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Download className="w-3.5 h-3.5 text-neutral-400" /> Export CSV
                    </button>
                    <button
                      onClick={handleClearSession}
                      disabled={sessionLog.length === 0}
                      className="bg-[#1b202c] hover:bg-rose-500/20 text-rose-300 font-semibold px-3 py-1.5 rounded-lg text-xs transition-all border border-[#2e374d] hover:border-rose-500/40 flex items-center gap-1.5 disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" /> Clear
                    </button>
                  </div>
                </div>

                {/* Session Ledger Table or Empty State */}
                {sessionLog.length === 0 ? (
                  <div className="bg-[#14171f] p-12 rounded-2xl border border-[#242b3b] text-center space-y-4">
                    <FileSpreadsheet className="w-12 h-12 text-neutral-500 mx-auto" />
                    <h3 className="text-xl font-bold text-white">No Sessions Logged Yet</h3>
                    <p className="text-xs text-neutral-400 max-w-md mx-auto">
                      Log your first in-game batch manually using the button below, or link your RuneLite client in the Cloud Sync tab to stream live casts in real time.
                    </p>
                    <div className="pt-2">
                      <button
                        onClick={() => setShowManualLogModal(true)}
                        className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2.5 rounded-xl text-xs transition-all shadow-lg shadow-amber-500/20 inline-flex items-center gap-2"
                      >
                        <Plus className="w-4 h-4 text-black" /> Log First Batch Manually
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-[#14171f] rounded-xl border border-[#242b3b] overflow-hidden">
                    <div className="overflow-x-auto">
                      {sessionViewMode === 'detailed' ? (
                        <table className="w-full text-xs text-left">
                          <thead className="bg-[#0f1219] text-neutral-400 uppercase text-[10px] font-mono border-b border-[#242b3b]">
                            <tr>
                              <th className="px-3 py-3">Time</th>
                              <th className="px-3 py-3">Item Name</th>
                              <th className="px-3 py-3">Role / Tag</th>
                              <th className="px-3 py-3 text-right">Quantity</th>
                              <th className="px-3 py-3 text-right">Buy Ea</th>
                              <th className="px-3 py-3 text-right">Total Outlay</th>
                              <th className="px-3 py-3 text-right">Realized Profit</th>
                              <th className="px-3 py-3 text-right">Magic XP</th>
                              <th className="px-3 py-3 text-center">Action</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-[#1e2433]">
                            {sessionLog.map((entry) => (
                              <tr key={entry.id} className="hover:bg-[#191e29] transition-colors font-mono">
                                <td className="px-3 py-2.5 text-neutral-400 text-[11px]">
                                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </td>
                                <td className="px-3 py-2.5 font-bold font-sans text-white">
                                  {entry.itemName}
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-bold uppercase ${
                                    entry.role === 'buyer' 
                                      ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' 
                                      : entry.role === 'seller'
                                      ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20'
                                      : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                                  }`}>
                                    {entry.role === 'buyer' ? 'W308 Buy' : entry.role === 'seller' ? 'W308 Sell' : 'High Alch'}
                                  </span>
                                </td>
                                <td className="px-3 py-2.5 text-right font-bold text-white">
                                  {entry.qty.toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 text-right text-neutral-300">
                                  {entry.price.toLocaleString()} gp
                                </td>
                                <td className="px-3 py-2.5 text-right text-neutral-300">
                                  {entry.totalCoins.toLocaleString()} gp
                                </td>
                                <td className={`px-3 py-2.5 text-right font-bold ${entry.netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                  {entry.netProfit >= 0 ? `+${entry.netProfit.toLocaleString()} gp` : `${entry.netProfit.toLocaleString()} gp`}
                                </td>
                                <td className="px-3 py-2.5 text-right text-cyan-400">
                                  +{(entry.magicXp || 0).toLocaleString()}
                                </td>
                                <td className="px-3 py-2.5 text-center">
                                  <button
                                    onClick={() => handleDeleteSessionItem(entry.id)}
                                    title="Delete entry"
                                    className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      ) : (
                        /* Consolidated Stacks View */
                        (() => {
                          const grouped: { [key: string]: { name: string; qty: number; outlay: number; profit: number; magicXp: number } } = {};
                          for (const s of sessionLog) {
                            if (!grouped[s.itemName]) {
                              grouped[s.itemName] = { name: s.itemName, qty: 0, outlay: 0, profit: 0, magicXp: 0 };
                            }
                            grouped[s.itemName].qty += s.qty;
                            grouped[s.itemName].outlay += s.totalCoins;
                            grouped[s.itemName].profit += s.netProfit;
                            grouped[s.itemName].magicXp += s.magicXp || 0;
                          }
                          const list = Object.values(grouped);

                          return (
                            <table className="w-full text-xs text-left">
                              <thead className="bg-[#0f1219] text-neutral-400 uppercase text-[10px] font-mono border-b border-[#242b3b]">
                                <tr>
                                  <th className="px-3 py-3">Consolidated Item</th>
                                  <th className="px-3 py-3 text-right">Total Quantity</th>
                                  <th className="px-3 py-3 text-right">Total Outlay</th>
                                  <th className="px-3 py-3 text-right">Total Net Profit</th>
                                  <th className="px-3 py-3 text-right">Avg Profit / Ea</th>
                                  <th className="px-3 py-3 text-right">Magic XP Gained</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-[#1e2433]">
                                {list.map((it, idx) => (
                                  <tr key={idx} className="hover:bg-[#191e29] transition-colors font-mono">
                                    <td className="px-3 py-2.5 font-bold font-sans text-white">
                                      {it.name}
                                    </td>
                                    <td className="px-3 py-2.5 text-right font-bold text-white">
                                      {it.qty.toLocaleString()}
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-neutral-300">
                                      {it.outlay.toLocaleString()} gp
                                    </td>
                                    <td className={`px-3 py-2.5 text-right font-bold ${it.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {it.profit >= 0 ? `+${it.profit.toLocaleString()} gp` : `${it.profit.toLocaleString()} gp`}
                                    </td>
                                    <td className={`px-3 py-2.5 text-right font-bold ${it.profit >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                                      {it.qty > 0 ? `+${Math.round(it.profit / it.qty).toLocaleString()} gp` : '0'}
                                    </td>
                                    <td className="px-3 py-2.5 text-right text-cyan-400">
                                      +{it.magicXp.toLocaleString()}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          );
                        })()
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ========================================================= */}
            {/* SUB-VIEW 2: MARKET & 4H COOLDOWN ALERTS FEED              */}
            {/* ========================================================= */}
            {activitySubTab === 'alerts' && (
              <div className="space-y-6">
                {/* 1. High Margin Alch Alerts */}
                <div className="bg-[#14171f] p-5 rounded-xl border border-[#242b3b] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Zap className="w-4 h-4 text-amber-400" />
                        Live High-Margin Spikes (&gt;750 GP Profit)
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Items currently offering massive margins with active Grand Exchange volume right now:
                      </p>
                    </div>
                    <span className="text-[10px] bg-amber-500/10 text-amber-400 font-bold px-2 py-0.5 rounded border border-amber-500/20">
                      ⚡ High Margin
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
                    {filteredAlchItems
                      .filter(it => it.profit >= 750 && it.volume >= 50)
                      .slice(0, 6)
                      .map((it) => (
                        <div key={it.id} className="bg-[#191e29] p-3.5 rounded-xl border border-[#252c3c] flex flex-col justify-between space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <img
                                src={`https://static.runelite.net/cache/item/icon/${it.id}.png`}
                                alt=""
                                className="w-6 h-6 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <span className="font-bold text-white text-xs truncate max-w-[140px]">{it.name}</span>
                            </div>
                            <span className="text-emerald-400 font-bold font-mono text-xs">
                              +{it.profit.toLocaleString()} gp
                            </span>
                          </div>

                          <div className="text-[11px] font-mono text-neutral-400 space-y-0.5 border-t border-white/5 pt-2">
                            <div className="flex justify-between">
                              <span>Hourly Rate:</span>
                              <span className="text-amber-400 font-bold">+{(it.hourly_profit / 1000).toFixed(0)}k/hr</span>
                            </div>
                            <div className="flex justify-between">
                              <span>Buy Limit:</span>
                              <span className="text-neutral-300">{it.buy_limit.toLocaleString()} / 4h</span>
                            </div>
                          </div>

                          <button
                            onClick={() => handleToggleCart({ id: it.id, name: it.name, buy_price: it.buy_price, buy_limit: it.buy_limit, profit: it.profit })}
                            className="w-full mt-1 bg-amber-500/10 hover:bg-amber-500 hover:text-black text-amber-300 text-[11px] font-bold py-1.5 rounded-lg border border-amber-500/30 transition-all text-center"
                          >
                            + Add to Cart
                          </button>
                        </div>
                      ))}
                  </div>
                </div>

                {/* 2. Active 4h GE Timers Feed */}
                <div className="bg-[#14171f] p-5 rounded-xl border border-[#242b3b] space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-white text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-cyan-400" />
                        Active 4-Hour Grand Exchange Buy Limit Timers
                      </h4>
                      <p className="text-xs text-neutral-400">
                        Tracks your 4-hour cooldown resets. When the countdown hits 0, your GE slot resets to full volume:
                      </p>
                    </div>
                  </div>

                  {timers.length === 0 ? (
                    <div className="bg-[#191e29] p-4 rounded-xl border border-[#252c3c] text-center text-xs text-neutral-400">
                      ✅ All GE Buy Limits Ready — 0 Active Cooldowns. You have full purchasing limits across all items!
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {timers.map((t) => {
                        const remMs = Math.max(0, t.expiresAt - Date.now());
                        const remSec = Math.floor(remMs / 1000);
                        const h = Math.floor(remSec / 3600);
                        const m = Math.floor((remSec % 3600) / 60);
                        const s = remSec % 60;
                        const isExpired = remMs <= 0;

                        return (
                          <div key={t.id} className="bg-[#191e29] p-3.5 rounded-xl border border-[#252c3c] flex items-center justify-between">
                            <div className="flex items-center gap-2.5">
                              <img
                                src={`https://static.runelite.net/cache/item/icon/${t.id}.png`}
                                alt=""
                                className="w-6 h-6 object-contain"
                                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                              />
                              <div>
                                <span className="font-bold text-white text-xs block">{t.name}</span>
                                <span className="text-[11px] text-neutral-400">Limit: {t.limit.toLocaleString()}</span>
                              </div>
                            </div>

                            <div className="flex items-center gap-3">
                              <div className="text-right">
                                <span className={`font-mono font-bold text-xs block ${isExpired ? 'text-emerald-400' : 'text-amber-400'}`}>
                                  {isExpired ? 'READY' : `${h}h ${m}m ${s}s`}
                                </span>
                                <span className="text-[10px] text-neutral-500">Cooldown</span>
                              </div>
                              <button
                                onClick={() => handleDeleteTimer(t.id)}
                                className="text-neutral-500 hover:text-rose-400 transition-colors p-1"
                                title="Clear timer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 3. Market Trading Liquidity Advisory */}
                <div className="bg-[#191e29] border border-[#252c3c] rounded-xl p-4 space-y-2 text-xs text-neutral-300">
                  <span className="font-bold text-amber-400 flex items-center gap-1.5 text-sm">
                    🕒 Global Market Timing Tip
                  </span>
                  <p className="leading-relaxed">
                    Peak liquidity occurs between <strong>14:00 and 22:00 UTC</strong> (overlap between UK, European, and US Eastern daytime). Use this window to instant-buy large volume batches. Between <strong>01:00 and 07:00 UTC</strong>, volume drops by ~50%, creating prime opportunities for deep-dip overnight bidding!
                  </p>
                </div>
              </div>
            )}

            {/* ========================================================= */}
            {/* SUB-VIEW 3: RUNELITE CLOUD SYNC & TOKEN MANAGER           */}
            {/* ========================================================= */}
            {activitySubTab === 'sync' && (
              <div className="space-y-6">
                <div className="bg-[#14171f] p-6 rounded-2xl border border-[#242b3b] space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-white flex items-center gap-2">
                        <Shield className="w-5 h-5 text-amber-500" /> Connect RuneLite Plugin
                      </h3>
                      <p className="text-xs text-neutral-400 mt-1">
                        Connect your RuneLite client using your private sync token to stream your alching sessions and track real-time profit.
                      </p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
                      Cloud API Live
                    </span>
                  </div>

                  {/* Private Sync Token Generator & Key Box */}
                  <div className="bg-[#191e29] p-5 rounded-xl border border-[#252c3c] space-y-4">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                      <div>
                        <span className="text-xs font-bold text-white flex items-center gap-1.5">
                          <Key className="w-4 h-4 text-amber-400" /> Your Private Sync Token
                        </span>
                        <p className="text-[11px] text-neutral-400">
                          Unique to your browser session. Keeps your in-game statistics private and secure.
                        </p>
                      </div>
                      <button
                        onClick={handleGenerateNewToken}
                        className="text-xs bg-[#242b3d] hover:bg-[#2d374f] text-neutral-300 px-3 py-1.5 rounded-lg border border-[#323d57] transition-all"
                      >
                        Generate New Token
                      </button>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-lg px-3 py-2 text-xs font-mono flex items-center justify-between">
                        <span className="text-amber-400 font-bold">
                          {showToken ? syncToken : '••••••••••••••••••••••••••••••••'}
                        </span>
                        <button
                          onClick={() => setShowToken(!showToken)}
                          className="text-neutral-500 hover:text-white transition-colors"
                        >
                          {showToken ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                      </div>
                      <button
                        onClick={handleCopyToken}
                        className="bg-amber-500 hover:bg-amber-400 text-black text-xs font-bold px-4 py-2 rounded-lg transition-all flex items-center gap-1.5"
                      >
                        {tokenCopied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        {tokenCopied ? 'Copied!' : 'Copy Token'}
                      </button>
                    </div>
                  </div>

                  {/* Instructions */}
                  <div className="bg-[#191e29] p-5 rounded-xl border border-[#252c3c] text-xs space-y-3">
                    <span className="font-bold text-white block">📋 Quick 2-Step RuneLite Setup:</span>
                    <ol className="list-decimal list-inside space-y-2 text-neutral-300">
                      <li>
                        In RuneLite, open <strong>AlchMate Plugin Settings</strong>.
                      </li>
                      <li>
                        Set Webhook URL:
                        <code className="text-amber-400 font-mono block bg-black/40 p-2 rounded border border-white/5 mt-1 select-all">
                          https://alchmate-web.vercel.app/api/sync
                        </code>
                      </li>
                      <li>
                        Paste your <strong>Sync Token</strong> into the plugin&apos;s Token field and check <strong>Enable Sync</strong>.
                      </li>
                    </ol>
                  </div>

                  {/* Test Webhook Button */}
                  <div className="pt-2 flex flex-col md:flex-row items-start md:items-center justify-between gap-3 border-t border-[#232938]">
                    <div>
                      <span className="text-xs font-semibold text-white">Test Connection Pipeline</span>
                      <p className="text-[11px] text-neutral-400">Send a test alch event right now to verify the Supabase sync endpoint.</p>
                    </div>
                    <button
                      onClick={handleSendTestWebhook}
                      disabled={testSyncStatus === 'testing'}
                      className="bg-[#242b3d] hover:bg-[#2d374f] text-neutral-200 border border-[#343f59] text-xs font-bold px-4 py-2 rounded-xl transition-all flex items-center gap-2"
                    >
                      <Send className="w-3.5 h-3.5 text-amber-400" />
                      {testSyncStatus === 'testing' ? 'Testing...' : 'Send Test Event'}
                    </button>
                  </div>

                  {testSyncStatus !== 'idle' && (
                    <div className={`p-3 rounded-lg text-xs font-mono ${testSyncStatus === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : testSyncStatus === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                      {testSyncMsg}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Modal: Manual Alch Batch Logger */}
        {showManualLogModal && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <div className="bg-[#14171f] border border-[#2b3447] rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in duration-150">
              <div className="flex justify-between items-start border-b border-[#202532] pb-3">
                <div>
                  <h3 className="text-lg font-bold text-white flex items-center gap-2">
                    <Flame className="w-5 h-5 text-amber-400" /> Log Manual Alch Batch
                  </h3>
                  <p className="text-xs text-neutral-400 mt-0.5">
                    Record your in-game high alch session directly to your browser ledger.
                  </p>
                </div>
                <button
                  onClick={() => setShowManualLogModal(false)}
                  className="text-neutral-500 hover:text-white text-lg font-bold p-1"
                >
                  ✕
                </button>
              </div>

              {/* Quick Select Preset Items */}
              <div className="space-y-1.5">
                <span className="text-[11px] text-neutral-400 block font-semibold">Quick Select Common Alch Items:</span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    'Rune 2h sword',
                    "Green d'hide body",
                    "Blue d'hide body",
                    'Rune platelegs',
                    'Air battlestaff',
                    'Rune battleaxe',
                    'Adamant platebody',
                  ].map((pName) => (
                    <button
                      key={pName}
                      type="button"
                      onClick={() => handleSelectManualItem(pName)}
                      className={`px-2 py-1 rounded text-[11px] font-medium border transition-all ${
                        manualItemName.toLowerCase() === pName.toLowerCase()
                          ? 'bg-amber-500 text-black border-amber-400 font-bold'
                          : 'bg-[#1b202c] text-neutral-300 border-[#2b3548] hover:bg-[#252c3c]'
                      }`}
                    >
                      {pName}
                    </button>
                  ))}
                </div>
              </div>

              {/* Inputs */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div className="md:col-span-2">
                  <label className="text-neutral-400 block mb-1">Item Name:</label>
                  <input
                    type="text"
                    value={manualItemName}
                    onChange={(e) => setManualItemName(e.target.value)}
                    className="w-full bg-[#1b202c] border border-[#2b3548] rounded-lg px-3 py-2 text-white font-semibold"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Quantity (Casts):</label>
                  <input
                    type="number"
                    min={1}
                    value={manualQty || ''}
                    onChange={(e) => setManualQty(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2b3548] rounded-lg px-3 py-2 text-white font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Buy Price (ea):</label>
                  <input
                    type="number"
                    value={manualBuyPrice || ''}
                    onChange={(e) => setManualBuyPrice(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2b3548] rounded-lg px-3 py-2 text-amber-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">High Alch Value (ea):</label>
                  <input
                    type="number"
                    value={manualHighAlch || ''}
                    onChange={(e) => setManualHighAlch(Number(e.target.value))}
                    className="w-full bg-[#1b202c] border border-[#2b3548] rounded-lg px-3 py-2 text-emerald-400 font-mono font-bold"
                  />
                </div>
                <div>
                  <label className="text-neutral-400 block mb-1">Nature Rune Cost (ea):</label>
                  <input
                    type="text"
                    disabled
                    value={`${effectiveNatPrice} gp ${explorersRing ? "(Explorer's Ring)" : ''}`}
                    className="w-full bg-[#1b202c] border border-[#2b3548] rounded-lg px-3 py-2 text-neutral-400 font-mono"
                  />
                </div>
              </div>

              {/* Dynamic Calculation Preview */}
              {(() => {
                const totalCoins = manualQty * manualBuyPrice;
                const totalAlch = manualQty * manualHighAlch;
                const totalNats = manualQty * effectiveNatPrice;
                const netProfit = totalAlch - totalCoins - totalNats;
                const magicXp = manualQty * 65;

                return (
                  <div className="bg-[#191e29] p-3.5 rounded-xl border border-[#252c3c] text-xs font-mono space-y-1">
                    <div className="flex justify-between text-neutral-400">
                      <span>Total Outlay:</span>
                      <span>{totalCoins.toLocaleString()} gp</span>
                    </div>
                    <div className="flex justify-between text-neutral-400">
                      <span>Nature Runes:</span>
                      <span>{totalNats.toLocaleString()} gp</span>
                    </div>
                    <div className="flex justify-between text-cyan-400">
                      <span>Magic XP Gained:</span>
                      <span>+{magicXp.toLocaleString()} XP</span>
                    </div>
                    <div className="flex justify-between border-t border-white/5 pt-1 text-sm font-bold">
                      <span className="text-white">Net Profit:</span>
                      <span className={netProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {netProfit >= 0 ? `+${netProfit.toLocaleString()} gp` : `${netProfit.toLocaleString()} gp`}
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* Buttons */}
              <div className="flex justify-end gap-2 pt-2 border-t border-[#202532]">
                <button
                  type="button"
                  onClick={() => setShowManualLogModal(false)}
                  className="bg-[#1b202c] hover:bg-[#252c3c] text-neutral-300 font-semibold px-4 py-2 rounded-xl text-xs transition-all border border-[#2b3548]"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleAddManualSession}
                  className="bg-amber-500 hover:bg-amber-400 text-black font-bold px-5 py-2 rounded-xl text-xs transition-all shadow-md shadow-amber-500/20"
                >
                  ✓ Save Entry to Ledger
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Floating Toast Notification matching desktop FloatingToast */}
      {toastMsg && (
        <div className="fixed bottom-12 right-6 z-50 animate-bounce">
          <div className="bg-[#1f2430] border border-amber-500/50 rounded-xl px-4 py-2.5 shadow-2xl text-xs font-semibold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span>{toastMsg}</span>
          </div>
        </div>
      )}

      {/* Desktop App Status Bar Footer (Desktop gui.py lbl_status_left / lbl_status_right) */}
      <footer className="bg-[#0f1117] border-t border-[#1c212b] px-4 py-2 text-[11px] text-neutral-400 font-mono flex flex-wrap justify-between items-center gap-2">
        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-emerald-400 font-semibold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
            Live Nature Rune: {effectiveNatPrice} gp
          </span>
          <span className="text-neutral-600">|</span>
          <span>Items Monitored: {priceData?.items?.length || 3509}</span>
          <span className="text-neutral-600">|</span>
          <span>Pricing Basis: 5m Volume Avg</span>
        </div>

        <div className="flex items-center gap-3">
          <span>Active Capital: {unlimitedBudget ? 'Unlimited' : `${(cashStack / 1000000).toFixed(2)}M gp`}</span>
          <span className="text-neutral-600">|</span>
          <span className="text-neutral-500">Auto-Sync in {nextRefreshSec}s</span>
        </div>
      </footer>
    </div>
  );
}
