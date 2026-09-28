"""
JML Access Guard - Accountable Remediation & Approval Executor
Processes human approval decisions, executes target system remediations,
maintains cryptographic audit trails, and performs post-remediation verification.
"""

import hashlib
import json
import uuid
from datetime import datetime, timezone
from typing import Dict, Any, Optional

from python_engine.database import get_db_connection


def compute_sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


class RemediationExecutor:
    def __init__(self, db_path: Optional[str] = None):
        self.db_path = db_path

    def process_approval_decision(
        self,
        approval_id: str,
        reviewer_id: str,
        decision: str,
        justification: str
    ) -> Dict[str, Any]:
        """
        Executes an accountable approval action.
        Decision must be 'Approved_Removal' or 'Rejected_Retained' or 'Escalated'.
        Mandates justification for auditable accountability.
        """
        if not justification or len(justification.strip()) < 5:
            raise ValueError("Accountable approvals require a valid justification (minimum 5 characters).")

        if decision not in ("Approved_Removal", "Rejected_Retained", "Escalated"):
            raise ValueError(f"Invalid decision: {decision}")

        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()

        # Find approval request
        cursor.execute("SELECT * FROM approvals WHERE id = ?", (approval_id,))
        appr = cursor.fetchone()
        if not appr:
            conn.close()
            raise KeyError(f"Approval request '{approval_id}' not found.")

        discrepancy_id = appr["discrepancy_id"]
        user_id = appr["user_id"]
        resource_name = appr["resource_name"]
        risk_level = appr["risk_level"]
        now_ts = datetime.now(timezone.utc).isoformat()

        # Find discrepancy details
        cursor.execute("SELECT * FROM discrepancies WHERE id = ?", (discrepancy_id,))
        disc = cursor.fetchone()
        disc_type = disc["discrepancy_type"] if disc else "excessive_access"
        res_type = disc["resource_type"] if disc else "application_entitlement"

        remediation_performed = False

        if decision == "Approved_Removal":
            # Execute actual entitlement removal
            if res_type == "application_entitlement":
                cursor.execute(
                    "DELETE FROM user_entitlements WHERE user_id = ? AND entitlement_name = ?",
                    (user_id, resource_name)
                )
            else:
                cursor.execute(
                    "DELETE FROM user_directory_memberships WHERE user_id = ? AND group_name = ?",
                    (user_id, resource_name)
                )
            remediation_performed = True

            cursor.execute("""
                UPDATE discrepancies
                SET status = 'Resolved', resolved_at = ?, resolution_notes = ?
                WHERE id = ?
            """, (now_ts, f"Removal approved by {reviewer_id}. Rationale: {justification}", discrepancy_id))

        elif decision == "Rejected_Retained":
            cursor.execute("""
                UPDATE discrepancies
                SET status = 'Rejected_Retained', resolved_at = ?, resolution_notes = ?
                WHERE id = ?
            """, (now_ts, f"Access retention authorized by {reviewer_id}. Rationale: {justification}", discrepancy_id))

        elif decision == "Escalated":
            cursor.execute("""
                UPDATE discrepancies
                SET status = 'Pending_Approval', resolution_notes = ?
                WHERE id = ?
            """, (f"Escalated to CISO by {reviewer_id}. Reason: {justification}", discrepancy_id))

        # Update approval record
        cursor.execute("""
            UPDATE approvals
            SET reviewed_at = ?, reviewer_id = ?, decision = ?, justification = ?
            WHERE id = ?
        """, (now_ts, reviewer_id, decision, justification, approval_id))

        # Record tamper-evident audit entry
        audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
        previous_state = f"Active entitlement: {resource_name}"
        new_state = "Entitlement revoked" if decision == "Approved_Removal" else "Access exception granted"
        audit_payload = f"{audit_id}:{now_ts}:{user_id}:{resource_name}:{decision}:{reviewer_id}:{justification}"
        integrity_hash = compute_sha256(audit_payload)

        cursor.execute("""
            INSERT INTO audit_log (
                id, timestamp, event_type, actor, target_user_id,
                resource_affected, action, decision_rationale,
                previous_state, new_state, integrity_hash
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            audit_id, now_ts, "Accountable_Approval", reviewer_id, user_id,
            resource_name, decision, justification, previous_state, new_state, integrity_hash
        ))

        conn.commit()
        conn.close()

        # Perform verification step (re-reconciliation check for this user)
        from python_engine.reconciliation import ReconciliationEngine
        engine = ReconciliationEngine(self.db_path)
        verification_result = engine.run_reconciliation(user_id=user_id, trigger_source="Post_Remediation_Verification")

        # Check if resource is still listed as a pending discrepancy
        is_fully_resolved = not any(
            d["resource"] == resource_name and d["status"] == "Pending_Approval"
            for d in verification_result["discrepancies"]
        )

        return {
            "success": True,
            "approval_id": approval_id,
            "decision": decision,
            "reviewer_id": reviewer_id,
            "justification": justification,
            "remediation_performed": remediation_performed,
            "timestamp": now_ts,
            "audit_id": audit_id,
            "integrity_hash": integrity_hash,
            "verification": {
                "verified_resolved": is_fully_resolved,
                "current_user_discrepancies_count": len(verification_result["discrepancies"])
            }
        }
