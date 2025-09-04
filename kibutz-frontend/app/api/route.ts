import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

export async function GET(req: NextRequest) {
  const authHeader = req.headers.get('authorization');

  if (!authHeader) {
    return NextResponse.json({ error: 'Missing Authorization header' }, { status: 401 });
  }

  const token = authHeader.replace('Bearer ', '');

  try {
    const decoded = jwt.verify(token, 'supersecret') as { email: string };
    return NextResponse.json({ email: decoded.email, name: 'User from token' });
  } catch (err) {
    console.error('JWT verification error:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 403 });
  }
}
