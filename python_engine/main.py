"""
JML Access Guard - FastAPI REST Backend
Exposes deterministic reconciliation, accountable approval workflows,
audit logs, and baseline evaluations.
"""

import os
import sys
from typing import List, Optional, Dict, Any
from datetime import datetime, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.database import get_db_connection, init_database
from python_engine.rules_engine import RulesEngine
from python_engine.reconciliation import ReconciliationEngine
from python_engine.remediation import RemediationExecutor
from python_engine.seed_data import seed_synthetic_data

try:
    from fastapi import FastAPI, HTTPException, Query
    from fastapi.middleware.cors import CORSMiddleware
    from pydantic import BaseModel, Field
    HAS_FASTAPI = True
except ImportError:
    HAS_FASTAPI = False


if HAS_FASTAPI:
    app = FastAPI(
        title="JML Access Guard API",
        version="2.1.0",
        description="Deterministic Joiner-Mover-Leaver Access Reconciliation Engine with Accountable Approvals"
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    class ReconcileRequest(BaseModel):
        user_id: Optional[str] = Field(None, description="Specific user ID to reconcile, or None for entire directory")
        trigger_source: str = Field("API_Call", description="Triggering system or event name")

    class ApprovalDecision(BaseModel):
        reviewer_id: str = Field(..., min_length=2, description="Authenticated approver identifier")
        decision: str = Field(..., regex="^(Approved_Removal|Rejected_Retained|Escalated)$")
        justification: str = Field(..., min_length=5, description="Auditable justification rationale")

    class HREventInjection(BaseModel):
        user_id: str
        event_type: str = Field(..., regex="^(Joiner|Mover|Leaver|Status_Change)$")
        new_role: Optional[str] = None
        new_department: Optional[str] = None
        details: str

    @app.on_event("startup")
    def startup_db():
        init_database()

    @app.post("/api/reconcile")
    def reconcile(req: ReconcileRequest):
        engine = ReconciliationEngine()
        return engine.run_reconciliation(user_id=req.user_id, trigger_source=req.trigger_source)

    @app.get("/api/approvals")
    def get_pending_approvals():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("""
            SELECT a.id, a.discrepancy_id, a.user_id, u.name as user_name, u.department, u.primary_role,
                   a.resource_name, a.risk_level, a.requested_at, a.sla_deadline, d.discrepancy_type
            FROM approvals a
            JOIN users u ON a.user_id = u.id
            JOIN discrepancies d ON a.discrepancy_id = d.id
            WHERE a.reviewed_at IS NULL
            ORDER BY CASE a.risk_level WHEN 'Critical' THEN 1 WHEN 'High' THEN 2 ELSE 3 END, a.requested_at ASC
        """)
        items = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"count": len(items), "approvals": items}

    @app.post("/api/approvals/{approval_id}/decide")
    def decide_approval(approval_id: str, decision_data: ApprovalDecision):
        executor = RemediationExecutor()
        try:
            return executor.process_approval_decision(
                approval_id=approval_id,
                reviewer_id=decision_data.reviewer_id,
                decision=decision_data.decision,
                justification=decision_data.justification
            )
        except (ValueError, KeyError) as e:
            raise HTTPException(status_code=400, detail=str(e))

    @app.get("/api/audit")
    def get_audit_trail(limit: int = Query(50, ge=1, le=500)):
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM audit_log ORDER BY timestamp DESC LIMIT ?", (limit,))
        logs = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"count": len(logs), "audit_logs": logs}

    @app.get("/api/users")
    def get_users():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users ORDER BY department, name")
        users = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"count": len(users), "users": users}

    @app.get("/api/policies")
    def get_policies():
        engine = RulesEngine()
        return engine.policy

    @app.get("/api/baseline")
    def get_baseline_comparison():
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM baseline_experiments")
        metrics = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return {"metrics": metrics}

    @app.post("/api/seed")
    def seed_data():
        seed_synthetic_data()
        engine = ReconciliationEngine()
        res = engine.run_reconciliation(trigger_source="Post_Seed_Init")
        return {"status": "success", "message": "Database seeded and initial reconciliation executed.", "reconciliation": res}

else:
    # Minimal console notification when executed without uvicorn
    def run_cli_fallback():
        print("FastAPI / Pydantic not installed in current environment. Use Python CLI: python3 python_engine/cli.py")


if __name__ == "__main__":
    if HAS_FASTAPI:
        import uvicorn
        uvicorn.run("python_engine.main:app", host="0.0.0.0", port=8000, reload=True)
    else:
        run_cli_fallback()
