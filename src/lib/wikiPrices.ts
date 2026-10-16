// In-memory client cache
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

let cachedMapping: any = null;
let lastMappingFetchTime = 0;
const MAPPING_TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

const BOND_ITEM_ID = '13190';

export async function fetchWikiPrices(): Promise<any> {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return cachedData;
  }

  try {
    const headers = { 'User-Agent': 'AlchMate-Local/1.0 (contact: github.com/jef11222)' };

    let mapping = cachedMapping;
    const shouldFetchMapping = !cachedMapping || (now - lastMappingFetchTime >= MAPPING_TTL_MS);

    const fetches: Promise<any>[] = [
      fetch('https://prices.runescape.wiki/api/v1/osrs/latest', { headers }),
      fetch('https://prices.runescape.wiki/api/v1/osrs/volumes', { headers }),
      fetch('https://prices.runescape.wiki/api/v1/osrs/5m', { headers }).catch(() => ({ json: async () => ({ data: {} }) })),
      fetch(`https://prices.runescape.wiki/api/v1/osrs/timeseries?timestep=1h&id=${BOND_ITEM_ID}`, { headers }).catch(() => ({ json: async () => ({ data: [] }) }))
    ];

    if (shouldFetchMapping) {
      fetches.push(fetch('https://prices.runescape.wiki/api/v1/osrs/mapping', { headers }).catch(() => null));
    }

    const results = await Promise.all(fetches);
    const latestRes = results[0];
    const volumesRes = results[1];
    const volumes5mRes = results[2];
    const bondTsRes = results[3];

    if (shouldFetchMapping && results[4]) {
      try {
        const mappingJson = await results[4].json();
        if (Array.isArray(mappingJson) && mappingJson.length > 0) {
          cachedMapping = mappingJson;
          lastMappingFetchTime = now;
          mapping = mappingJson;
        }
      } catch {}
    }

    const latestJson = await latestRes.json();
    const volumesJson = await volumesRes.json();
    const volumes5mJson = await volumes5mRes.json();
    const bondTsJson = await bondTsRes.json();

    const latest = latestJson.data || {};
    mapping = mapping || [];
    const volumes24h = volumesJson.data || {};
    const volumes5m = volumes5mJson.data || {};
    const bondSeries: any[] = bondTsJson.data || [];

    const natPrice = latest['561']?.high || 170;

    const bondBid = latest[BOND_ITEM_ID]?.low || 11750000;
    const bondAsk = latest[BOND_ITEM_ID]?.high || 12100000;

    let bondPatientBid = bondBid;
    let bondDeepBid = bondBid;
    let bond7dMin = bondBid;
    let bond7dMax = bondAsk;
    let bondDailyVol = 0;

    if (Array.isArray(bondSeries) && bondSeries.length > 0) {
      const h48 = bondSeries.slice(-48);
      const lows48 = h48.map(c => c.avgLowPrice).filter(p => typeof p === 'number' && p > 0).sort((a, b) => a - b);
      const vols48 = h48.map(c => (c.lowPriceVolume || 0) + (c.highPriceVolume || 0));
      if (vols48.length > 0) {
        bondDailyVol = Math.floor(vols48.reduce((a, b) => a + b, 0) / 2);
      }

      const w168 = bondSeries.slice(-168);
      const lows168 = w168.map(c => c.avgLowPrice).filter(p => typeof p === 'number' && p > 0);
      const highs168 = w168.map(c => c.avgHighPrice).filter(p => typeof p === 'number' && p > 0);
      if (lows168.length > 0) bond7dMin = Math.min(...lows168);
      if (highs168.length > 0) bond7dMax = Math.max(...highs168);

      if (lows48.length >= 10) {
        const idx25 = Math.floor(lows48.length * 0.25);
        const idx10 = Math.floor(lows48.length * 0.10);
        bondPatientBid = lows48[idx25];
        bondDeepBid = lows48[idx10];
      }
    }

    const alchItems: any[] = [];
    const alchMap: Record<string, number> = {};
    const nowSec = Math.floor(now / 1000);

    for (const item of mapping) {
      const id = String(item.id);
      const highalch = item.highalch || 0;
      if (highalch > 0) {
        alchMap[id] = highalch;
      }
      if (highalch <= 0) continue;

      const p = latest[id];
      if (!p) continue;

      const bid = p.low || p.high || 0;
      const ask = p.high || p.low || 0;
      const buyPrice = bid > 0 ? bid : ask;
      if (buyPrice <= 0) continue;

      const profit = highalch - buyPrice - natPrice;
      const hourlyProfit = profit * 1200;
      const roi = buyPrice > 0 ? (profit / buyPrice) * 100 : 0;
      const dailyVolume = volumes24h[id] || 0;

      const v5 = volumes5m[id] || {};
      const bidVol5m = v5.lowPriceVolume || 0;
      const askVol5m = v5.highPriceVolume || 0;
      const total5m = bidVol5m + askVol5m;

      const lowTime = p.lowTime || 0;
      const highTime = p.highTime || 0;
      const lastTrade = Math.max(lowTime, highTime);
      const secsSinceTrade = lastTrade > 0 ? Math.max(0, nowSec - lastTrade) : 999999;

      let ratePerHour = 0;
      if (bidVol5m > 0) {
        ratePerHour = bidVol5m * 12;
      } else if (total5m > 0) {
        ratePerHour = Math.floor((total5m * 12) / 2);
      } else {
        ratePerHour = Math.floor((dailyVolume / 24) / 2);
      }

      const effectiveLimit = item.limit || 70;
      let speedCategory = 'slow';
      let speedLabel = '🐢 Slow (>1h)';
      let speedScore = 1;
      let estMinutes = 120;

      if (secsSinceTrade >= 2700) {
        speedCategory = 'slow';
        speedLabel = '⚠️ Stale (>45m)';
        speedScore = 0;
        estMinutes = 120;
      } else if (secsSinceTrade < 600 && (bidVol5m >= 8 || ratePerHour >= 60)) {
        estMinutes = Math.min(15, Math.max(3, Math.round((effectiveLimit / Math.max(1, ratePerHour)) * 60)));
        speedCategory = 'fast';
        speedLabel = `⚡ Fast (~${estMinutes}m)`;
        speedScore = 3;
      } else if (secsSinceTrade < 3600 && (ratePerHour >= 15 || dailyVolume >= 1000)) {
        estMinutes = Math.min(60, Math.max(15, Math.round((effectiveLimit / Math.max(1, ratePerHour)) * 60)));
        speedCategory = 'steady';
        speedLabel = `⏱️ Steady (~${estMinutes}m)`;
        speedScore = 2;
      }

      alchItems.push({
        id: item.id,
        name: item.name,
        members: item.members,
        buy_limit: item.limit || 0,
        volume: dailyVolume,
        highalch,
        bid,
        ask,
        buy_price: buyPrice,
        profit,
        hourly_profit: hourlyProfit,
        roi,
        speed_category: speedCategory,
        speed_label: speedLabel,
        speed_score: speedScore,
        est_minutes: estMinutes,
        vol_5m_bid: bidVol5m,
        vol_5m_ask: askVol5m,
        vol_5m_total: total5m,
        secs_since_trade: secsSinceTrade,
        icon: `https://static.runelite.net/cache/item/icon/${item.id}.png`
      });
    }

    cachedData = {
      timestamp: now,
      nature_rune: natPrice,
      bond: {
        bid: bondBid,
        ask: bondAsk,
        patient_bid: bondPatientBid,
        deep_bid: bondDeepBid,
        savings: Math.max(0, bondAsk - bondPatientBid),
        min_7d: bond7dMin,
        max_7d: bond7dMax,
        daily_vol: bondDailyVol
      },
      latest: latest,
      alch_map: alchMap,
      volumes_5m: volumes5m,
      items: alchItems,
    };
    lastFetchTime = now;

    return cachedData;
  } catch (err: any) {
    console.error('Error fetching OSRS prices:', err);
    if (cachedData) return cachedData;
    throw err;
  }
}
