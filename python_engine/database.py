"""
JML Access Guard - Database Schema and Connection Manager
SQLite relational storage for the deterministic reconciliation engine.
"""

import os
import sqlite3
from typing import Optional

DB_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "data", "jml_guard.db")


def get_db_connection(db_path: Optional[str] = None) -> sqlite3.Connection:
    target_path = db_path or DB_PATH
    os.makedirs(os.path.dirname(target_path), exist_ok=True)
    conn = sqlite3.connect(target_path)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON;")
    return conn


def init_database(db_path: Optional[str] = None) -> None:
    conn = get_db_connection(db_path)
    cursor = conn.cursor()

    # 1. Users Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        department TEXT NOT NULL,
        primary_role TEXT NOT NULL,
        secondary_role TEXT,
        employment_status TEXT NOT NULL CHECK(employment_status IN ('Active', 'On_Leave', 'Terminated', 'Contract_Expired')),
        contract_end_date TEXT,
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL
    );
    """)

    # 2. HR Events Table (Joiner, Mover, Leaver stream)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS hr_events (
        id TEXT PRIMARY KEY,
        user_id TEXT NOT NULL,
        event_type TEXT NOT NULL CHECK(event_type IN ('Joiner', 'Mover', 'Leaver', 'Status_Change', 'Role_Assignment')),
        previous_role TEXT,
        new_role TEXT,
        previous_department TEXT,
        new_department TEXT,
        effective_date TEXT NOT NULL,
        processed_at TEXT,
        status TEXT NOT NULL DEFAULT 'Processed',
        details TEXT,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 3. Directory Groups Catalog
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS directory_groups (
        group_name TEXT PRIMARY KEY,
        description TEXT NOT NULL,
        risk_level TEXT NOT NULL CHECK(risk_level IN ('Low', 'Medium', 'High', 'Critical'))
    );
    """)

    # 4. User Directory Memberships (Actual State in Directory)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_directory_memberships (
        user_id TEXT NOT NULL,
        group_name TEXT NOT NULL,
        assigned_at TEXT NOT NULL,
        PRIMARY KEY (user_id, group_name),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 5. Application Entitlements Catalog
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS application_entitlements (
        entitlement_name TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        description TEXT NOT NULL,
        risk_level TEXT NOT NULL CHECK(risk_level IN ('Low', 'Medium', 'High', 'Critical'))
    );
    """)

    # 6. User Entitlements (Actual State in Target Applications)
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS user_entitlements (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        entitlement_name TEXT NOT NULL,
        granted_at TEXT NOT NULL,
        source_system TEXT NOT NULL DEFAULT 'Direct_Assignment',
        UNIQUE(user_id, entitlement_name),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 7. Reconciliation Runs Log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS reconciliation_runs (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        trigger_source TEXT NOT NULL,
        total_identities_evaluated INTEGER NOT NULL,
        total_discrepancies_found INTEGER NOT NULL,
        auto_remediated_count INTEGER NOT NULL,
        approval_required_count INTEGER NOT NULL,
        execution_duration_ms REAL NOT NULL,
        status TEXT NOT NULL DEFAULT 'Completed'
    );
    """)

    # 8. Discrepancies Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS discrepancies (
        id TEXT PRIMARY KEY,
        run_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        discrepancy_type TEXT NOT NULL CHECK(discrepancy_type IN ('excessive_access', 'orphaned_access', 'missing_access')),
        resource_type TEXT NOT NULL CHECK(resource_type IN ('directory_group', 'application_entitlement')),
        resource_name TEXT NOT NULL,
        risk_level TEXT NOT NULL CHECK(risk_level IN ('Low', 'Medium', 'High', 'Critical')),
        recommended_action TEXT NOT NULL CHECK(recommended_action IN ('Auto-Revoke', 'Require-Approval', 'Auto-Provision')),
        status TEXT NOT NULL CHECK(status IN ('Pending_Approval', 'Approved', 'Rejected_Retained', 'Auto_Remediated', 'Resolved')),
        detected_at TEXT NOT NULL,
        resolved_at TEXT,
        resolution_notes TEXT,
        FOREIGN KEY(run_id) REFERENCES reconciliation_runs(id),
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 9. Accountable Approvals Table
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS approvals (
        id TEXT PRIMARY KEY,
        discrepancy_id TEXT NOT NULL,
        user_id TEXT NOT NULL,
        resource_name TEXT NOT NULL,
        risk_level TEXT NOT NULL,
        requested_at TEXT NOT NULL,
        reviewed_at TEXT,
        reviewer_id TEXT,
        decision TEXT CHECK(decision IN ('Approved_Removal', 'Rejected_Retained', 'Escalated')),
        justification TEXT,
        sla_deadline TEXT NOT NULL,
        is_stale INTEGER NOT NULL DEFAULT 0,
        FOREIGN KEY(discrepancy_id) REFERENCES discrepancies(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    """)

    # 10. Immutable Audit Log
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS audit_log (
        id TEXT PRIMARY KEY,
        timestamp TEXT NOT NULL,
        event_type TEXT NOT NULL,
        actor TEXT NOT NULL,
        target_user_id TEXT NOT NULL,
        resource_affected TEXT NOT NULL,
        action TEXT NOT NULL,
        decision_rationale TEXT,
        previous_state TEXT,
        new_state TEXT,
        integrity_hash TEXT NOT NULL
    );
    """)

    # 11. Baseline Experiment Metrics
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS baseline_experiments (
        metric_name TEXT PRIMARY KEY,
        manual_baseline_value REAL NOT NULL,
        automated_engine_value REAL NOT NULL,
        unit TEXT NOT NULL,
        improvement_percentage REAL NOT NULL,
        academic_citation TEXT NOT NULL
    );
    """)

    conn.commit()
    conn.close()


if __name__ == "__main__":
    init_database()
    print("Database initialized successfully at:", DB_PATH)
