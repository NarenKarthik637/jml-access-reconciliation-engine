import { NextRequest, NextResponse } from 'next/server';
import { injectScenario } from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const { scenarioKey } = await req.json();
    if (!scenarioKey) {
      return NextResponse.json({ error: 'scenarioKey is required' }, { status: 400 });
    }
    const result = injectScenario(scenarioKey);
    return NextResponse.json({ success: true, scenarioKey, result });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
