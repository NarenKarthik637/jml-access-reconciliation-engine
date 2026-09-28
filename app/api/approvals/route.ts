import { NextRequest, NextResponse } from 'next/server';
import { getPendingApprovals, executeApprovalDecision } from '@/lib/db';

export async function GET() {
  try {
    const approvals = getPendingApprovals();
    return NextResponse.json({ count: approvals.length, approvals });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { approvalId, reviewerId, decision, justification } = body;

    if (!approvalId || !reviewerId || !decision || !justification) {
      return NextResponse.json(
        { error: 'Missing required parameters: approvalId, reviewerId, decision, and justification are mandatory.' },
        { status: 400 }
      );
    }

    const result = executeApprovalDecision(approvalId, reviewerId, decision, justification);
    return NextResponse.json(result);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}
