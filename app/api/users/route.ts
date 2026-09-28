import { NextResponse } from 'next/server';
import { getUsersWithDetails } from '@/lib/db';

export async function GET() {
  try {
    const users = getUsersWithDetails();
    return NextResponse.json({ count: users.length, users });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
