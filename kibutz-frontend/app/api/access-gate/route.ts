import { NextResponse } from 'next/server';

// Change this password to whatever you want
const ACCESS_PASSWORD = 'Withly2612';

export async function POST(request: Request) {
  try {
    const { password } = await request.json();

    if (password === ACCESS_PASSWORD) {
      const response = NextResponse.json({ success: true });
      
      // Set cookie for 30 days
      response.cookies.set('site-access', 'granted', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
        path: '/',
      });

      return response;
    }

    return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
  } catch {
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}
