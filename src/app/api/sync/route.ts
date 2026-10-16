import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frgpckemanidliasrdrm.supabase.co';
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Admin client to safely handle sync events
const getSupabaseAdmin = () => {
  if (!supabaseUrl || !supabaseSecret) return null;
  return createClient(supabaseUrl, supabaseSecret);
};

export async function POST(req: NextRequest) {
  try {
    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Supabase credentials not configured' 
      }, { status: 200 });
    }

    const body = await req.json();
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const token = body.sync_token || body.syncToken || authHeader || '';
    
    // Support both Java plugin camelCase and web snake_case
    const rsn = (body.rsn || body.account || '').toString().trim();
    const alchs = Array.isArray(body.alchs) ? body.alchs : [];

    if (!rsn) {
      return NextResponse.json({ error: 'Missing character name (rsn / account)' }, { status: 400 });
    }

    let userId: string | null = null;

    // Verify or auto-provision profile for this sync_token
    if (token) {
      const cleanToken = token.trim();
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('sync_token', cleanToken)
        .maybeSingle();

      if (profile) {
        userId = profile.id;
      } else {
        const anonEmail = `${cleanToken.replace(/[^a-zA-Z0-9_-]/g, '')}@anon.alchmate.local`;
        const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
          email: anonEmail,
          email_confirm: true,
          user_metadata: { sync_token: cleanToken },
        });

        if (authUser?.user) {
          const { data: newProfile } = await supabaseAdmin
            .from('profiles')
            .upsert({
              id: authUser.user.id,
              sync_token: cleanToken,
            })
            .select('id')
            .maybeSingle();
          if (newProfile) {
            userId = newProfile.id;
          }
        }
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unable to resolve or provision user profile' }, { status: 401 });
    }

    // 1. Fetch existing character to prevent partial syncs (e.g. inventory/alch events) from clobbering state
    const { data: existingChar } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('user_id', userId)
      .eq('rsn', rsn)
      .maybeSingle();

    const rawCoins = body.coins;
    const rawNats = body.nature_runes ?? body.natureRunes;
    const rawWealth = body.total_wealth ?? body.totalWealth;
    const rawWorld = body.world;
    const rawIsMembers = body.is_members ?? body.isMembers;

    const coins = rawCoins !== undefined ? Number(rawCoins) : (existingChar?.coins ?? 0);
    const nature_runes = rawNats !== undefined ? Number(rawNats) : (existingChar?.nature_runes ?? 0);
    const total_wealth = (rawWealth !== undefined && Number(rawWealth) > 0)
      ? Number(rawWealth)
      : Math.max(coins, existingChar?.total_wealth ?? coins);
    const world = rawWorld !== undefined ? Number(rawWorld) : (existingChar?.world ?? 308);
    const is_members = rawIsMembers !== undefined ? Boolean(rawIsMembers) : (existingChar?.is_members ?? false);

    // Upsert Character Status
    await supabaseAdmin.from('characters').upsert(
      {
        user_id: userId,
        rsn,
        coins,
        nature_runes,
        total_wealth,
        world,
        is_members,
        last_seen: new Date().toISOString(),
      },
      { onConflict: 'user_id,rsn' }
    );

    // 2. Insert Batch Alch Logs (use ?? so item_id: 0 is never coerced to undefined!)
    if (alchs.length > 0) {
      const insertRows = alchs.map((a: any) => ({
        user_id: userId,
        rsn,
        item_id: a.item_id ?? a.itemId ?? 0,
        item_name: a.item_name ?? a.itemName ?? 'Unknown Item',
        qty: a.qty ?? a.quantity ?? 1,
        buy_price: a.buy_price ?? a.buyPrice ?? 0,
        nat_price: a.nat_price ?? a.natPrice ?? 0,
        alch_val: a.alch_val ?? a.alch_value ?? a.alchVal ?? 0,
        profit: a.profit ?? 0,
        xp: a.xp ?? a.magic_xp ?? a.magicXp ?? ((a.qty ?? 1) * 65),
        cost_basis_type: a.cost_basis_type ?? a.costBasis ?? 'GE',
      }));

      const { error: sessErr } = await supabaseAdmin.from('alch_sessions').insert(insertRows);
      if (sessErr) {
        console.error('Failed to insert alch_sessions:', sessErr.message);
      }

      // 3. Update Daily Stats Rollup
      const totalBatchProfit = alchs.reduce((sum: number, a: any) => sum + (Number(a.profit) || 0), 0);
      const totalBatchAlchs = alchs.reduce((sum: number, a: any) => sum + (Number(a.qty || a.quantity) || 1), 0);
      const totalBatchXp = alchs.reduce((sum: number, a: any) => sum + (Number(a.xp || a.magic_xp) || 65), 0);

      const today = new Date().toISOString().split('T')[0];

      const { data: existingDay } = await supabaseAdmin
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('rsn', rsn)
        .eq('date', today)
        .maybeSingle();

      if (existingDay) {
        await supabaseAdmin
          .from('daily_stats')
          .update({
            total_alchs: existingDay.total_alchs + totalBatchAlchs,
            total_profit: existingDay.total_profit + totalBatchProfit,
            total_xp: existingDay.total_xp + totalBatchXp,
          })
          .eq('id', existingDay.id);
      } else {
        await supabaseAdmin.from('daily_stats').insert({
          user_id: userId,
          rsn,
          date: today,
          total_alchs: totalBatchAlchs,
          total_profit: totalBatchProfit,
          total_xp: totalBatchXp,
        });
      }
    }

    return NextResponse.json({ success: true, timestamp: Date.now() });
  } catch (err: any) {
    console.error('Sync error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const token = searchParams.get('token') || searchParams.get('sync_token') || authHeader || '';

    if (!token) {
      return NextResponse.json({ error: 'Missing sync token' }, { status: 400 });
    }

    const supabaseAdmin = getSupabaseAdmin();
    if (!supabaseAdmin) {
      return NextResponse.json({ 
        success: false, 
        message: 'Supabase credentials not configured',
        characters: [],
        character: null,
        sessions: [],
        daily_stats: []
      });
    }

    // Find profile
    let { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('sync_token', token.trim())
      .maybeSingle();

    if (!profile) {
      const cleanToken = token.trim();
      const anonEmail = `${cleanToken.replace(/[^a-zA-Z0-9_-]/g, '')}@anon.alchmate.local`;
      const { data: authUser } = await supabaseAdmin.auth.admin.createUser({
        email: anonEmail,
        email_confirm: true,
        user_metadata: { sync_token: cleanToken },
      });
      if (authUser?.user) {
        const { data: newProfile } = await supabaseAdmin
          .from('profiles')
          .upsert({
            id: authUser.user.id,
            sync_token: cleanToken,
          })
          .select('id')
          .maybeSingle();
        profile = newProfile;
      }
    }

    if (!profile) {
      return NextResponse.json({ 
        success: true, 
        characters: [],
        character: null, 
        sessions: [], 
        daily_stats: [] 
      });
    }

    // Fetch characters
    const { data: characters } = await supabaseAdmin
      .from('characters')
      .select('*')
      .eq('user_id', profile.id)
      .order('last_seen', { ascending: false });

    // Fetch recent alch sessions
    const { data: sessions } = await supabaseAdmin
      .from('alch_sessions')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
      .limit(200);

    // Fetch daily stats
    const { data: dailyStats } = await supabaseAdmin
      .from('daily_stats')
      .select('*')
      .eq('user_id', profile.id)
      .order('date', { ascending: false })
      .limit(30);

    return NextResponse.json({
      success: true,
      characters: characters || [],
      character: characters?.[0] || null,
      sessions: sessions || [],
      daily_stats: dailyStats || [],
      timestamp: Date.now()
    });
  } catch (err: any) {
    console.error('Sync GET error:', err);
    return NextResponse.json({ error: err.message || 'Server error' }, { status: 500 });
  }
}

