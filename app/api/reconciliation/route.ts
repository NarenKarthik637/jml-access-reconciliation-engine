import { NextRequest, NextResponse } from 'next/server';
import { triggerReconciliation } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    let userId: string | undefined;
    let source = 'Dashboard_Trigger';
    try {
      const body = await req.json();
      userId = body.userId;
      source = body.source || source;
    } catch {
      // empty body is fine
    }

    const result = triggerReconciliation(userId, source);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
