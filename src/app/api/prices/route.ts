import { NextResponse } from 'next/server';

// Server-side cache
let cachedData: any = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 60 * 1000; // 60 seconds

export async function GET() {
  const now = Date.now();
  if (cachedData && now - lastFetchTime < CACHE_TTL_MS) {
    return NextResponse.json(cachedData);
  }

  try {
    const headers = { 'User-Agent': 'AlchMate-Web/1.0 (contact: github.com/jef11222)' };

    const [latestRes, mappingRes] = await Promise.all([
      fetch('https://prices.runescape.wiki/api/v1/osrs/latest', { headers }),
      fetch('https://prices.runescape.wiki/api/v1/osrs/mapping', { headers }),
    ]);

    const latestJson = await latestRes.json();
    const mappingJson = await mappingRes.json();

    const latest = latestJson.data || {};
    const mapping = mappingJson || [];

    // Nature rune price
    const natPrice = latest['561']?.high || 170;
    // Bond price
    const bondBid = latest['13190']?.low || 11750000;
    const bondAsk = latest['13190']?.high || 12100000;

    // Process high alchable items
    const alchItems: any[] = [];

    for (const item of mapping) {
      const id = String(item.id);
      const highalch = item.highalch || 0;
      if (highalch <= 0) continue;

      const p = latest[id];
      if (!p) continue;

      const buyPrice = p.low || p.high || 0;
      if (buyPrice <= 0) continue;

      const profit = highalch - buyPrice - natPrice;
      const hourlyProfit = profit * 1200; // 1,200 alchs/hr
      const roi = buyPrice > 0 ? (profit / buyPrice) * 100 : 0;

      alchItems.push({
        id: item.id,
        name: item.name,
        members: item.members,
        buy_limit: item.limit || 0,
        highalch,
        buy_price: buyPrice,
        profit,
        hourly_profit: hourlyProfit,
        roi,
        icon: `https://oldschool.runescape.wiki/images/${encodeURIComponent(item.icon?.replace(/ /g, '_') || '')}`
      });
    }

    cachedData = {
      timestamp: now,
      nature_rune: natPrice,
      bond: { bid: bondBid, ask: bondAsk },
      items: alchItems,
    };
    lastFetchTime = now;

    return NextResponse.json(cachedData);
  } catch (err: any) {
    console.error('Error fetching OSRS prices:', err);
    if (cachedData) return NextResponse.json(cachedData);
    return NextResponse.json({ error: 'Failed to fetch OSRS prices' }, { status: 500 });
  }
}
