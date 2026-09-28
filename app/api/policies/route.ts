import { NextRequest, NextResponse } from 'next/server';
import { loadPolicy, savePolicy, triggerReconciliation } from '@/lib/db';

export async function GET() {
  try {
    const policy = loadPolicy();
    return NextResponse.json(policy);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const updatedPolicy = await req.json();
    savePolicy(updatedPolicy);
    // Recalculate after policy update
    const recon = triggerReconciliation(undefined, 'Policy_Rule_Update');
    return NextResponse.json({ success: true, message: 'Policy successfully updated and active.', reconciliation: recon });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
