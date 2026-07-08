import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { cookies } from 'next/headers';
import { Match } from '@/types/database';

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const { id, video_url, status, home_score, away_score } = await request.json();
    
    if (!id) {
      return NextResponse.json({ success: false, message: 'معرف المباراة مفقود' }, { status: 400 });
    }

    if (video_url && !video_url.startsWith('http://') && !video_url.startsWith('https://')) {
      return NextResponse.json({ success: false, message: 'رابط البث غير صالح' }, { status: 400 });
    }

    const supabaseAdmin = getServiceSupabase();
    
    const updatePayload: Partial<Match> = { video_url: video_url || null };
    if (status !== undefined) updatePayload.status = status;
    if (home_score !== undefined) updatePayload.home_score = home_score !== '' ? parseInt(home_score) : null;
    if (away_score !== undefined) updatePayload.away_score = away_score !== '' ? parseInt(away_score) : null;

    const { error } = await supabaseAdmin
      .from('matches')
      .update(updatePayload)
      .eq('id', id);

    if (error) {
      console.error('Error updating match video:', error);
      return NextResponse.json({ success: false, message: 'فشل التحديث' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Update match error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
