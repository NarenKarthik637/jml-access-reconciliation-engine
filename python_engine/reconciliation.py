"""
JML Access Guard - Core Reconciliation Engine
Compares actual directory groups and application entitlements against expected access.
Classifies discrepancies, executes automated remediation for low-risk items,
and queues high/critical items for accountable human approval.
"""

import hashlib
import json
import os
import time
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, Any, List, Optional

from python_engine.database import get_db_connection
from python_engine.rules_engine import RulesEngine


def compute_sha256(data: str) -> str:
    return hashlib.sha256(data.encode("utf-8")).hexdigest()


class ReconciliationEngine:
    def __init__(self, db_path: Optional[str] = None, policy_path: Optional[str] = None):
        self.db_path = db_path
        self.rules_engine = RulesEngine(policy_path)

    def run_reconciliation(self, user_id: Optional[str] = None, trigger_source: str = "Automated_Scheduler") -> Dict[str, Any]:
        start_time = time.time()
        run_id = f"RUN-{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        run_timestamp = datetime.now(timezone.utc).isoformat()

        conn = get_db_connection(self.db_path)
        cursor = conn.cursor()

        # Fetch users to evaluate
        if user_id:
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        else:
            cursor.execute("SELECT * FROM users")
        users = cursor.fetchall()

        total_users = len(users)
        total_discrepancies = 0
        auto_remediated = 0
        approval_required = 0

        discrepancy_records: List[Dict[str, Any]] = []

        # Insert run record first so foreign keys succeed
        cursor.execute("""
            INSERT INTO reconciliation_runs (id, timestamp, trigger_source, total_identities_evaluated, total_discrepancies_found, auto_remediated_count, approval_required_count, execution_duration_ms, status)
            VALUES (?, ?, ?, 0, 0, 0, 0, 0.0, 'In_Progress')
        """, (run_id, run_timestamp, trigger_source))

        for user in users:
            uid = user["id"]
            u_role = user["primary_role"]
            u_sec_role = user["secondary_role"]
            u_dept = user["department"]
            u_status = user["employment_status"]
            u_contract_end = user["contract_end_date"]

            # Edge Case 3: Check if Temporary Researcher contract is expired
            if u_role == "Temporary_Researcher" and u_contract_end:
                try:
                    end_dt = datetime.fromisoformat(u_contract_end)
                    if datetime.now(timezone.utc) > end_dt.replace(tzinfo=timezone.utc):
                        u_status = "Contract_Expired"
                except Exception:
                    pass

            expected = self.rules_engine.calculate_expected_access(
                primary_role=u_role,
                department=u_dept,
                secondary_role=u_sec_role,
                employment_status=u_status,
                contract_end_date=u_contract_end
            )
            expected_groups = expected["directory_groups"]
            expected_apps = expected["applications"]

            # Actual directory memberships
            cursor.execute("SELECT group_name FROM user_directory_memberships WHERE user_id = ?", (uid,))
            actual_groups = set(r["group_name"] for r in cursor.fetchall())

            # Actual application entitlements
            cursor.execute("SELECT entitlement_name FROM user_entitlements WHERE user_id = ?", (uid,))
            actual_apps = set(r["entitlement_name"] for r in cursor.fetchall())

            # --- Check Directory Groups ---
            # 1. Groups present but not expected (Excessive or Orphaned)
            excessive_groups = actual_groups - expected_groups
            for g in excessive_groups:
                disc_type = "orphaned_access" if u_status in ("Terminated", "Contract_Expired") else "excessive_access"
                risk = self.rules_engine.get_entitlement_risk(g, "directory_group")
                requires_appr = self.rules_engine.requires_approval_for_removal(u_role, g)

                disc_id = f"DISC-{uuid.uuid4().hex[:8].upper()}"
                total_discrepancies += 1

                if not requires_appr and risk == "Low":
                    # Auto-Remediate Low Risk Directory Group
                    cursor.execute("DELETE FROM user_directory_memberships WHERE user_id = ? AND group_name = ?", (uid, g))
                    auto_remediated += 1
                    status = "Auto_Remediated"
                    rec_action = "Auto-Revoke"

                    # Log to audit
                    audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
                    audit_hash = compute_sha256(f"{audit_id}:{run_timestamp}:{uid}:{g}:Auto-Revoked:SYSTEM")
                    cursor.execute("""
                        INSERT INTO audit_log (id, timestamp, event_type, actor, target_user_id, resource_affected, action, decision_rationale, previous_state, new_state, integrity_hash)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        audit_id, run_timestamp, "Auto_Remediation", "SYSTEM", uid, g,
                        "Auto-Revoked Directory Group", f"Unapproved {disc_type} detected. Low risk auto-removal executed.",
                        f"Member of {g}", "Removed from group", audit_hash
                    ))
                else:
                    # Require Accountable Approval
                    approval_required += 1
                    status = "Pending_Approval"
                    rec_action = "Require-Approval"

                # Insert discrepancy first
                cursor.execute("""
                    INSERT INTO discrepancies (id, run_id, user_id, discrepancy_type, resource_type, resource_name, risk_level, recommended_action, status, detected_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (disc_id, run_id, uid, disc_type, "directory_group", g, risk, rec_action, status, run_timestamp))

                if status == "Pending_Approval":
                    sla_hours = self.rules_engine.policy.get("risk_thresholds", {}).get("approval_sla_hours", {}).get(risk, 24)
                    deadline = (datetime.now(timezone.utc) + timedelta(hours=sla_hours)).isoformat()
                    appr_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"

                    cursor.execute("""
                        INSERT INTO approvals (id, discrepancy_id, user_id, resource_name, risk_level, requested_at, sla_deadline)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (appr_id, disc_id, uid, g, risk, run_timestamp, deadline))

                discrepancy_records.append({
                    "id": disc_id,
                    "user_id": uid,
                    "resource": g,
                    "type": disc_type,
                    "risk": risk,
                    "action": rec_action,
                    "status": status
                })

            # --- Check Applications ---
            # 2. Applications present but not expected
            excessive_apps = actual_apps - expected_apps
            for app in excessive_apps:
                disc_type = "orphaned_access" if u_status in ("Terminated", "Contract_Expired") else "excessive_access"
                risk = self.rules_engine.get_entitlement_risk(app, "application_entitlement")
                requires_appr = self.rules_engine.requires_approval_for_removal(u_role, app)

                disc_id = f"DISC-{uuid.uuid4().hex[:8].upper()}"
                total_discrepancies += 1

                if not requires_appr and risk == "Low":
                    # Auto-Remediate Low Risk App
                    cursor.execute("DELETE FROM user_entitlements WHERE user_id = ? AND entitlement_name = ?", (uid, app))
                    auto_remediated += 1
                    status = "Auto_Remediated"
                    rec_action = "Auto-Revoke"

                    audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
                    audit_hash = compute_sha256(f"{audit_id}:{run_timestamp}:{uid}:{app}:Auto-Revoked:SYSTEM")
                    cursor.execute("""
                        INSERT INTO audit_log (id, timestamp, event_type, actor, target_user_id, resource_affected, action, decision_rationale, previous_state, new_state, integrity_hash)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        audit_id, run_timestamp, "Auto_Remediation", "SYSTEM", uid, app,
                        "Auto-Revoked Application Access", f"Unapproved {disc_type} detected for role '{u_role}'. Low risk auto-removal executed.",
                        f"Active Entitlement: {app}", "Entitlement Revoked", audit_hash
                    ))
                else:
                    approval_required += 1
                    status = "Pending_Approval"
                    rec_action = "Require-Approval"

                # Insert discrepancy first
                cursor.execute("""
                    INSERT INTO discrepancies (id, run_id, user_id, discrepancy_type, resource_type, resource_name, risk_level, recommended_action, status, detected_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (disc_id, run_id, uid, disc_type, "application_entitlement", app, risk, rec_action, status, run_timestamp))

                if status == "Pending_Approval":
                    sla_hours = self.rules_engine.policy.get("risk_thresholds", {}).get("approval_sla_hours", {}).get(risk, 24)
                    deadline = (datetime.now(timezone.utc) + timedelta(hours=sla_hours)).isoformat()
                    appr_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"

                    cursor.execute("""
                        INSERT INTO approvals (id, discrepancy_id, user_id, resource_name, risk_level, requested_at, sla_deadline)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (appr_id, disc_id, uid, app, risk, run_timestamp, deadline))

                discrepancy_records.append({
                    "id": disc_id,
                    "user_id": uid,
                    "resource": app,
                    "type": disc_type,
                    "risk": risk,
                    "action": rec_action,
                    "status": status
                })

            # 3. Expected but missing (Missing Access)
            missing_apps = expected_apps - actual_apps
            for app in missing_apps:
                risk = self.rules_engine.get_entitlement_risk(app, "application_entitlement")
                disc_id = f"DISC-{uuid.uuid4().hex[:8].upper()}"
                total_discrepancies += 1

                # Auto-Provision low-risk standard entitlements for active users
                if risk == "Low" and u_status == "Active":
                    cursor.execute("""
                        INSERT OR IGNORE INTO user_entitlements (user_id, entitlement_name, granted_at, source_system)
                        VALUES (?, ?, ?, 'JML_Auto_Provision')
                    """, (uid, app, run_timestamp))
                    auto_remediated += 1
                    status = "Auto_Remediated"
                    rec_action = "Auto-Provision"

                    audit_id = f"AUD-{uuid.uuid4().hex[:8].upper()}"
                    audit_hash = compute_sha256(f"{audit_id}:{run_timestamp}:{uid}:{app}:Auto-Provisioned:SYSTEM")
                    cursor.execute("""
                        INSERT INTO audit_log (id, timestamp, event_type, actor, target_user_id, resource_affected, action, decision_rationale, previous_state, new_state, integrity_hash)
                        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """, (
                        audit_id, run_timestamp, "Auto_Provisioning", "SYSTEM", uid, app,
                        "Auto-Provisioned Entitlement", f"Role '{u_role}' missing mandatory standard access. Provisioned automatically.",
                        "Not Granted", f"Granted: {app}", audit_hash
                    ))
                else:
                    status = "Pending_Approval"
                    rec_action = "Require-Approval"
                    approval_required += 1

                cursor.execute("""
                    INSERT INTO discrepancies (id, run_id, user_id, discrepancy_type, resource_type, resource_name, risk_level, recommended_action, status, detected_at)
                    VALUES (?, ?, ?, 'missing_access', 'application_entitlement', ?, ?, ?, ?, ?)
                """, (disc_id, run_id, uid, app, risk, rec_action, status, run_timestamp))

                if status == "Pending_Approval":
                    sla_hours = self.rules_engine.policy.get("risk_thresholds", {}).get("approval_sla_hours", {}).get(risk, 24)
                    deadline = (datetime.now(timezone.utc) + timedelta(hours=sla_hours)).isoformat()
                    appr_id = f"REQ-{uuid.uuid4().hex[:6].upper()}"

                    cursor.execute("""
                        INSERT INTO approvals (id, discrepancy_id, user_id, resource_name, risk_level, requested_at, sla_deadline)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (appr_id, disc_id, uid, app, risk, run_timestamp, deadline))

        duration_ms = round((time.time() - start_time) * 1000, 2)

        cursor.execute("""
            UPDATE reconciliation_runs
            SET total_identities_evaluated = ?,
                total_discrepancies_found = ?,
                auto_remediated_count = ?,
                approval_required_count = ?,
                execution_duration_ms = ?,
                status = 'Completed'
            WHERE id = ?
        """, (total_users, total_discrepancies, auto_remediated, approval_required, duration_ms, run_id))

        conn.commit()
        conn.close()

        return {
            "run_id": run_id,
            "timestamp": run_timestamp,
            "trigger_source": trigger_source,
            "total_users_evaluated": total_users,
            "total_discrepancies_found": total_discrepancies,
            "auto_remediated_count": auto_remediated,
            "approval_required_count": approval_required,
            "execution_duration_ms": duration_ms,
            "discrepancies": discrepancy_records
        }


if __name__ == "__main__":
    from python_engine.database import init_database
    init_database()
    engine = ReconciliationEngine()
    result = engine.run_reconciliation()
    print("Reconciliation executed:", result)
