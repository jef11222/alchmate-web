import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://frgpckemanidliasrdrm.supabase.co';
const supabaseSecret = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Admin client to safely handle sync events
const supabaseAdmin = createClient(supabaseUrl, supabaseSecret);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const authHeader = req.headers.get('authorization')?.replace('Bearer ', '').trim();
    const token = body.sync_token || authHeader || '';
    const { rsn, coins, nature_runes, total_wealth, world, is_members, alchs } = body;

    if (!rsn) {
      return NextResponse.json({ error: 'Missing rsn parameter' }, { status: 400 });
    }

    let userId: string | null = null;

    // Verify or auto-provision profile for this sync_token
    if (token) {
      const { data: profile } = await supabaseAdmin
        .from('profiles')
        .select('id')
        .eq('sync_token', token)
        .single();

      if (profile) {
        userId = profile.id;
      } else {
        const { data: newProfile } = await supabaseAdmin
          .from('profiles')
          .insert({ sync_token: token })
          .select('id')
          .single();
        if (newProfile) {
          userId = newProfile.id;
        }
      }
    }

    // 1. Upsert Character Status
    if (userId) {
      await supabaseAdmin.from('characters').upsert(
        {
          user_id: userId,
          rsn,
          coins: coins || 0,
          nature_runes: nature_runes || 0,
          total_wealth: total_wealth || 0,
          world: world || 308,
          is_members: is_members || false,
          last_seen: new Date().toISOString(),
        },
        { onConflict: 'user_id,rsn' }
      );
    }

    // 2. Insert Batch Alch Logs
    if (Array.isArray(alchs) && alchs.length > 0 && userId) {
      const insertRows = alchs.map((a: any) => ({
        user_id: userId,
        rsn,
        item_id: a.item_id,
        item_name: a.item_name,
        qty: a.qty,
        buy_price: a.buy_price,
        nat_price: a.nat_price,
        alch_val: a.alch_val,
        profit: a.profit,
        xp: a.xp || 0,
        cost_basis_type: a.cost_basis_type || 'GE',
      }));

      await supabaseAdmin.from('alch_sessions').insert(insertRows);

      // 3. Update Daily Stats Rollup
      const totalBatchProfit = alchs.reduce((sum: number, a: any) => sum + (a.profit || 0), 0);
      const totalBatchAlchs = alchs.reduce((sum: number, a: any) => sum + (a.qty || 0), 0);
      const totalBatchXp = alchs.reduce((sum: number, a: any) => sum + (a.xp || 0), 0);

      const today = new Date().toISOString().split('T')[0];

      const { data: existingDay } = await supabaseAdmin
        .from('daily_stats')
        .select('*')
        .eq('user_id', userId)
        .eq('rsn', rsn)
        .eq('date', today)
        .single();

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

    if (!supabaseSecret) {
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
    const { data: profile } = await supabaseAdmin
      .from('profiles')
      .select('id')
      .eq('sync_token', token)
      .single();

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

