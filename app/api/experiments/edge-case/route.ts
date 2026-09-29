import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { scenarioId } = body;

    const db = getDb();
    const nowTs = new Date().toISOString();

    if (scenarioId === 'rejected_approval') {
      // Approver authorizes retention with justification
      const auditId = `AUD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const payload = `${auditId}:${nowTs}:U_REJ_001:HPC_Slurm_Cluster:Rejected_Retained:ciso_board:Authorized 60-day research extension for NSF Bio Grant 48821 completion`;
      const hash = crypto.createHash('sha256').update(payload).digest('hex');

      db.prepare(`
        INSERT INTO audit_log (id, timestamp, event_type, actor, target_user_id, resource_affected, action, decision_rationale, previous_state, new_state, integrity_hash)
        VALUES (?, ?, 'Accountable_Approval_Exception', 'ciso_board@university.edu', 'U_REJ_001', 'HPC_Slurm_Cluster', 'Rejected_Retained', 'Authorized 60-day research extension for NSF Bio Grant 48821 completion.', 'Active Entitlement: HPC_Slurm_Cluster', 'Exception Granted: 60-Day Extension', ?)
      `).run(auditId, nowTs, hash);

      return NextResponse.json({
        success: true,
        scenario: 'Rejected Approval (Controlled Academic Exception)',
        outcome: 'Entitlement retained with auditable rationale and cryptographic proof.',
        user_id: 'U_REJ_001',
        resource: 'HPC_Slurm_Cluster',
        decision: 'Rejected_Retained',
        justification: 'Authorized 60-day research extension for NSF Bio Grant 48821 completion.',
        audit_id: auditId,
        integrity_hash: hash
      });
    }

    if (scenarioId === 'failed_remediation') {
      // Simulate target LDAP API timeout and retry mechanism
      const auditId1 = `AUD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const hash1 = crypto.createHash('sha256').update(`${auditId1}:${nowTs}:U_FAIL_001:TargetConnectionTimeout`).digest('hex');

      const retryTs = new Date(Date.now() + 5000).toISOString();
      const auditId2 = `AUD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const hash2 = crypto.createHash('sha256').update(`${auditId2}:${retryTs}:U_FAIL_001:RetrySuccess`).digest('hex');

      db.prepare(`
        INSERT INTO audit_log (id, timestamp, event_type, actor, target_user_id, resource_affected, action, decision_rationale, previous_state, new_state, integrity_hash)
        VALUES (?, ?, 'Remediation_Target_Failure', 'JML_GUARD_ENGINE', 'U_FAIL_001', 'Research_Lab_SSH', 'Connection_Failed', 'Target LDAP agent on chem-lab-01:636 unreachable. Queued for immediate retry.', 'Active Entitlement: Research_Lab_SSH', 'Pending Retry Queue', ?)
      `).run(auditId1, nowTs, hash1);

      db.prepare(`
        INSERT INTO audit_log (id, timestamp, event_type, actor, target_user_id, resource_affected, action, decision_rationale, previous_state, new_state, integrity_hash)
        VALUES (?, ?, 'Remediation_Retry_Success', 'JML_GUARD_ENGINE', 'U_FAIL_001', 'Research_Lab_SSH', 'Revoke_Application_Entitlement', 'Automatic retry succeeded after agent reconnection. Entitlement successfully revoked.', 'Pending Retry Queue', 'Entitlement Revoked', ?)
      `).run(auditId2, retryTs, hash2);

      return NextResponse.json({
        success: true,
        scenario: 'Target System Remediation Failure & Automated Retry',
        outcome: 'Target timeout caught without crashing; queued, retried, and revoked on reconnection.',
        user_id: 'U_FAIL_001',
        resource: 'Research_Lab_SSH',
        retry_status: 'Recovered_After_Retry',
        attempts: 2,
        audit_id: auditId2,
        integrity_hash: hash2
      });
    }

    if (scenarioId === 'invalid_hr_record') {
      const auditId = `AUD-${crypto.randomBytes(4).toString('hex').toUpperCase()}`;
      const hash = crypto.createHash('sha256').update(`${auditId}:${nowTs}:U_INV_001:HRDataValidationError`).digest('hex');

      db.prepare(`
        INSERT INTO audit_log (id, timestamp, event_type, actor, target_user_id, resource_affected, action, decision_rationale, previous_state, new_state, integrity_hash)
        VALUES (?, ?, 'HR_Data_Validation_Error', 'JML_GUARD_ENGINE', 'U_INV_001', 'HR_Identity_Record', 'Quarantine_And_Alert', 'Corrupted primary_role: UNKNOWN_CONSULTANT. Identity quarantined without stopping engine run.', 'Invalid Schema State', 'Flagged for HR Correction', ?)
      `).run(auditId, nowTs, hash);

      return NextResponse.json({
        success: true,
        scenario: 'Invalid HR Record Schema Quarantine',
        outcome: 'Malformed identity data safely quarantined; reconciliation loop continues unaffected.',
        user_id: 'U_INV_001',
        invalid_field: 'primary_role=UNKNOWN_CONSULTANT',
        action: 'Quarantine_And_Alert',
        audit_id: auditId,
        integrity_hash: hash
      });
    }

    return NextResponse.json({ error: `Unknown scenarioId: ${scenarioId}` }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
