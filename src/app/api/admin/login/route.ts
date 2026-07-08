import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';
import { SignJWT } from 'jose';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();
    
    const adminPassword = process.env.ADMIN_PASSWORD;
    const jwtSecret = process.env.JWT_SECRET;

    if (!adminPassword || !jwtSecret) {
      console.error('Environment variables missing');
      return NextResponse.json({ success: false, message: 'خطأ في إعدادات الخادم' }, { status: 500 });
    }

    if (password === adminPassword) {
      // Create JWT
      const secret = new TextEncoder().encode(jwtSecret);
      const token = await new SignJWT({ role: 'admin' })
        .setProtectedHeader({ alg: 'HS256' })
        .setIssuedAt()
        .setExpirationTime('7d')
        .sign(secret);

      const cookieStore = await cookies();
      cookieStore.set('admin_token', token, { 
        httpOnly: true, 
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 60 * 60 * 24 * 7 // 1 week
      });
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ success: false, message: 'كلمة المرور غير صحيحة' }, { status: 401 });
  } catch (error) {
    console.error('Login route error:', error);
    return NextResponse.json({ success: false, message: 'حدث خطأ' }, { status: 500 });
  }
}
