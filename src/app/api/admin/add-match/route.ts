import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { jwtVerify } from 'jose';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    // 1. Verify Admin Token
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token')?.value;

    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        return NextResponse.json({ success: false, message: 'خطأ في إعدادات الخادم' }, { status: 500 });
      }
      const secret = new TextEncoder().encode(jwtSecret);
      await jwtVerify(token, secret);
    } catch {
      return NextResponse.json({ success: false, message: 'الجلسة انتهت' }, { status: 401 });
    }

    // 2. Get Data
    const data = await request.json();
    const { league_id, home_team_id, away_team_id, match_date, status, home_score, away_score, video_url } = data;

    if (!league_id || !home_team_id || !away_team_id || !match_date) {
      return NextResponse.json({ success: false, message: 'بيانات غير مكتملة' }, { status: 400 });
    }

    if (video_url && !video_url.startsWith('http://') && !video_url.startsWith('https://')) {
      return NextResponse.json({ success: false, message: 'رابط البث غير صالح' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 3. Insert or Update
    // Since this is manual, we'll check if a match with same teams and date exists to avoid duplicates
    // Or we just insert directly if we assume it's new. Let's do an upsert approach.
    
    const dateObj = new Date(match_date);
    const startOfDay = new Date(dateObj);
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(dateObj);
    endOfDay.setHours(23, 59, 59, 999);

    const { data: existingMatch } = await supabase
      .from('matches')
      .select('id')
      .eq('home_team_id', home_team_id)
      .eq('away_team_id', away_team_id)
      .gte('match_date', startOfDay.toISOString())
      .lte('match_date', endOfDay.toISOString())
      .maybeSingle();

    const payload = {
      league_id,
      home_team_id,
      away_team_id,
      match_date: dateObj.toISOString(),
      status: status || 'SCHEDULED',
      home_score: home_score !== '' && home_score !== null && home_score !== undefined ? parseInt(home_score) : null,
      away_score: away_score !== '' && away_score !== null && away_score !== undefined ? parseInt(away_score) : null,
      video_url: video_url || null,
    };

    if (existingMatch) {
      // Update existing
      const { error } = await supabase.from('matches').update(payload).eq('id', existingMatch.id);
      if (error) throw error;
    } else {
      // Insert new
      const { error } = await supabase.from('matches').insert([payload]);
      if (error) throw error;
    }

    return NextResponse.json({ success: true, message: 'تم حفظ المباراة بنجاح' });
  } catch (error: any) {
    console.error('Error adding match:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ أثناء الحفظ' }, { status: 500 });
  }
}
