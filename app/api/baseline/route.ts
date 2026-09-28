import { NextResponse } from 'next/server';
import { getBaselineMetrics } from '@/lib/db';

export async function GET() {
  try {
    const metrics = getBaselineMetrics();
    return NextResponse.json({ count: metrics.length, metrics });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
