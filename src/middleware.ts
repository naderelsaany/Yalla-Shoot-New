import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';

// Define the routes that need protection
const protectedPrefixes = ['/admin', '/api/admin'];
// Routes that bypass protection
const publicRoutes = ['/admin/login', '/api/admin/login'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Check if it's a protected route
  const isProtected = protectedPrefixes.some(prefix => pathname.startsWith(prefix));
  const isPublic = publicRoutes.includes(pathname);

  if (isProtected && !isPublic) {
    const token = request.cookies.get('admin_token')?.value;

    if (!token) {
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, message: 'غير مصرح' }, { status: 401 });
      }
      return NextResponse.redirect(new URL('/admin/login', request.url));
    }

    try {
      const jwtSecret = process.env.JWT_SECRET;
      if (!jwtSecret) {
        console.error('JWT_SECRET is not configured');
        return NextResponse.json(
          { success: false, message: 'خطأ في إعدادات الخادم' }, 
          { status: 500 }
        );
      }
      const secret = new TextEncoder().encode(jwtSecret);
      
      // Verify JWT
      await jwtVerify(token, secret);
      
      // Token is valid, proceed
      return NextResponse.next();
    } catch {
      // Invalid token
      if (pathname.startsWith('/api/')) {
        return NextResponse.json({ success: false, message: 'الجلسة انتهت أو غير صالحة' }, { status: 401 });
      }
      
      // Clear invalid cookie and redirect
      const response = NextResponse.redirect(new URL('/admin/login', request.url));
      response.cookies.delete('admin_token');
      return response;
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*', '/api/admin/:path*'],
};
