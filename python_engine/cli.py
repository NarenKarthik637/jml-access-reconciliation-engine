"""
JML Access Guard - Command Line Interface (CLI)
Provides command-line control for seeding, running reconciliation,
inspecting the queue, executing accountable approvals, and viewing audit trails.
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.database import get_db_connection, init_database
from python_engine.seed_data import seed_synthetic_data
from python_engine.reconciliation import ReconciliationEngine
from python_engine.remediation import RemediationExecutor


def main():
    parser = argparse.ArgumentParser(description="JML Access Guard CLI")
    subparsers = parser.add_subparsers(dest="command", help="Sub-commands")

    # Seed
    subparsers.add_parser("seed", help="Seed the database with synthetic data")

    # Reconcile
    reconcile_p = subparsers.add_parser("reconcile", help="Run reconciliation engine")
    reconcile_p.add_argument("--user", type=str, help="Specific user ID to reconcile", default=None)

    # List Pending
    subparsers.add_parser("list-pending", help="List all pending approvals")

    # Approve
    approve_p = subparsers.add_parser("approve", help="Approve an access removal")
    approve_p.add_argument("id", type=str, help="Approval Request ID (e.g. REQ-...)")
    approve_p.add_argument("--reviewer", type=str, default="admin_sec", help="Reviewer username")
    approve_p.add_argument("--justification", type=str, required=True, help="Auditable justification")

    # Reject / Retain
    reject_p = subparsers.add_parser("reject", help="Reject removal and retain access (authorized exception)")
    reject_p.add_argument("id", type=str, help="Approval Request ID")
    reject_p.add_argument("--reviewer", type=str, default="admin_sec", help="Reviewer username")
    reject_p.add_argument("--justification", type=str, required=True, help="Auditable justification")

    # Audit
    audit_p = subparsers.add_parser("audit", help="Display recent immutable audit log")
    audit_p.add_argument("--limit", type=int, default=15, help="Number of records to show")

    args = parser.parse_args()

    if args.command == "seed":
        seed_synthetic_data()
        print("Database successfully seeded.")

    elif args.command == "reconcile":
        engine = ReconciliationEngine()
        result = engine.run_reconciliation(user_id=args.user, trigger_source="CLI_Operator")
        print("\n=== RECONCILIATION SUMMARY ===")
        print(f"Run ID: {result['run_id']}")
        print(f"Users Evaluated: {result['total_users_evaluated']}")
        print(f"Total Discrepancies: {result['total_discrepancies_found']}")
        print(f"Auto-Remediated (Low Risk): {result['auto_remediated_count']}")
        print(f"Pending Approvals (Med/High/Crit): {result['approval_required_count']}")
        print(f"Duration: {result['execution_duration_ms']} ms\n")

    elif args.command == "list-pending":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id, a.user_id, u.name, u.primary_role, a.resource_name, a.risk_level, a.requested_at, a.sla_deadline
            FROM approvals a
            JOIN users u ON a.user_id = u.id
            WHERE a.reviewed_at IS NULL
            ORDER BY CASE a.risk_level WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END
        """)
        rows = cursor.fetchall()
        conn.close()
        print(f"\n=== PENDING ACCOUNTABLE APPROVALS ({len(rows)}) ===")
        for r in rows:
            print(f"[{r['id']}] {r['user_id']} ({r['name']} - {r['primary_role']}) | Resource: {r['resource_name']} | Risk: {r['risk_level']} | SLA: {r['sla_deadline']}")
        print()

    elif args.command == "approve":
        executor = RemediationExecutor()
        res = executor.process_approval_decision(
            approval_id=args.id,
            reviewer_id=args.reviewer,
            decision="Approved_Removal",
            justification=args.justification
        )
        print("\n=== APPROVAL PROCESSED ===")
        print(f"Request: {res['approval_id']}")
        print(f"Decision: {res['decision']}")
        print(f"Audit Record ID: {res['audit_id']}")
        print(f"SHA-256 Hash: {res['integrity_hash']}")
        print(f"Verification Resolved: {res['verification']['verified_resolved']}\n")

    elif args.command == "reject":
        executor = RemediationExecutor()
        res = executor.process_approval_decision(
            approval_id=args.id,
            reviewer_id=args.reviewer,
            decision="Rejected_Retained",
            justification=args.justification
        )
        print("\n=== EXCEPTION REGISTERED ===")
        print(f"Request: {res['approval_id']}")
        print(f"Decision: {res['decision']}")
        print(f"Audit Record ID: {res['audit_id']}")
        print(f"SHA-256 Hash: {res['integrity_hash']}\n")

    elif args.command == "audit":
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT timestamp, id, actor, target_user_id, resource_affected, action, integrity_hash FROM audit_log ORDER BY timestamp DESC LIMIT ?", (args.limit,))
        rows = cursor.fetchall()
        conn.close()
        print(f"\n=== IMMUTABLE AUDIT LOG (Latest {len(rows)}) ===")
        for r in rows:
            print(f"{r['timestamp'][:19]} | {r['id']} | Actor: {r['actor']:<10} | Target: {r['target_user_id']:<10} | {r['resource_affected']:<24} | Action: {r['action']:<18} | Hash: {r['integrity_hash'][:16]}...")
        print()

    else:
        parser.print_help()


if __name__ == "__main__":
    main()
