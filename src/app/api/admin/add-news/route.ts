import { NextResponse } from 'next/server';
import { getServiceSupabase } from '@/lib/supabase';
import { cookies } from 'next/headers';

function slugify(text: string) {
  return text
    .toString()
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\u0600-\u06FF\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('admin_token');
    
    if (!token) {
      return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
    }

    const { title, content, image_url } = await request.json();
    
    if (!title || !content) {
      return NextResponse.json({ success: false, message: 'العنوان والتفاصيل مطلوبة' }, { status: 400 });
    }

    // Generate a basic slug, append timestamp to make it unique
    const baseSlug = slugify(title) || 'news';
    const slug = `${baseSlug}-${Date.now()}`;

    const supabaseAdmin = getServiceSupabase();
    
    const { error } = await supabaseAdmin
      .from('news')
      .insert({
        title,
        content,
        image_url: image_url || null,
        slug,
        source: 'حصري (إدارة الموقع)',
        published_at: new Date().toISOString()
      });

    if (error) {
      console.error('Error adding news:', error);
      return NextResponse.json({ success: false, message: 'فشل إضافة الخبر' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Add news error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
