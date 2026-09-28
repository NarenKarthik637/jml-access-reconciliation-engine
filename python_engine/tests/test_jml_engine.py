"""
JML Access Guard - Automated Test Suite
Validates deterministic rules engine, discrepancy classification,
accountable approvals, edge case resilience, and audit integrity.
"""

import os
import sys
import unittest
from datetime import datetime, timedelta, timezone

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from python_engine.database import get_db_connection, init_database
from python_engine.rules_engine import RulesEngine
from python_engine.reconciliation import ReconciliationEngine
from python_engine.remediation import RemediationExecutor
from python_engine.seed_data import seed_synthetic_data

TEST_DB_PATH = os.path.join(os.path.dirname(__file__), "test_jml.db")


class TestJMLAccessGuard(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        seed_synthetic_data(TEST_DB_PATH)

    @classmethod
    def tearDownClass(cls):
        if os.path.exists(TEST_DB_PATH):
            os.remove(TEST_DB_PATH)

    def setUp(self):
        self.rules_engine = RulesEngine()
        self.reconciler = ReconciliationEngine(TEST_DB_PATH)
        self.remediator = RemediationExecutor(TEST_DB_PATH)

    def test_01_expected_access_faculty(self):
        """Test calculation of expected access for Faculty."""
        expected = self.rules_engine.calculate_expected_access("Faculty", "Mathematics")
        self.assertIn("Canvas_LMS_Instructor", expected["applications"])
        self.assertIn("Banner_Grade_Submission", expected["applications"])
        self.assertIn("faculty_general", expected["directory_groups"])
        self.assertIn("mathematics_faculty_group", expected["directory_groups"])

    def test_02_expected_access_alumni(self):
        """Test expected access for Alumni (strictly limited community privileges)."""
        expected = self.rules_engine.calculate_expected_access("Alumni", "Mathematics")
        self.assertIn("Alumni_Portal", expected["applications"])
        self.assertIn("Alumni_Email_Forwarding", expected["applications"])
        self.assertNotIn("Banner_Grade_Submission", expected["applications"])
        self.assertNotIn("Faculty_VPN", expected["applications"])

    def test_03_mover_discrepancy_detection(self):
        """Test detection of excessive access when Faculty member transitions to Alumni."""
        run_res = self.reconciler.run_reconciliation(user_id="U_4812_JM")
        discrepancies = run_res["discrepancies"]
        flagged_resources = [d["resource"] for d in discrepancies]
        
        self.assertIn("Banner_Grade_Submission", flagged_resources)
        self.assertIn("Faculty_VPN", flagged_resources)

    def test_04_leaver_orphaned_access_detection(self):
        """Test orphaned access classification for Terminated employee."""
        run_res = self.reconciler.run_reconciliation(user_id="U_9021_LT")
        discrepancies = run_res["discrepancies"]
        orphaned = [d for d in discrepancies if d["type"] == "orphaned_access"]
        self.assertGreater(len(orphaned), 0)
        flagged_apps = [d["resource"] for d in orphaned]
        self.assertIn("Workday_HR_Admin", flagged_apps)

    def test_05_edge_case_1_dual_role_ta(self):
        """Edge Case 1: Dual Role (Student + Graduate Teaching Assistant)."""
        expected = self.rules_engine.calculate_expected_access(
            primary_role="Student",
            department="Computer Science",
            secondary_role="Graduate_Teaching_Assistant"
        )
        # Should have both student and instructor portals
        self.assertIn("Canvas_LMS_Student", expected["applications"])
        self.assertIn("Canvas_LMS_Instructor", expected["applications"])
        self.assertIn("Banner_Grade_Submission", expected["applications"])
        # Must NOT have administrative ERP access
        self.assertNotIn("Finance_ERP_Dashboard", expected["applications"])

    def test_06_edge_case_2_emergency_termination_remediation(self):
        """Edge Case 2: Out-of-cycle emergency termination and accountable revocation."""
        conn = get_db_connection(TEST_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT id FROM approvals WHERE user_id = 'U_9021_LT' AND resource_name = 'Workday_HR_Admin' LIMIT 1")
        appr_row = cursor.fetchone()
        conn.close()

        if appr_row:
            res = self.remediator.process_approval_decision(
                approval_id=appr_row["id"],
                reviewer_id="ciso_lead",
                decision="Approved_Removal",
                justification="Emergency revocation per Provost directive HR-TERM-09."
            )
            self.assertTrue(res["success"])
            self.assertTrue(res["verification"]["verified_resolved"])

    def test_07_edge_case_3_expired_temporary_contract(self):
        """Edge Case 3: Temporary Researcher with contract expired 14 days ago."""
        run_res = self.reconciler.run_reconciliation(user_id="U_5519_KR")
        discrepancies = run_res["discrepancies"]
        orphaned = [d for d in discrepancies if d["type"] == "orphaned_access"]
        flagged_apps = [d["resource"] for d in orphaned]
        self.assertIn("HPC_Slurm_Cluster", flagged_apps)
        self.assertIn("Research_Lab_SSH", flagged_apps)

    def test_08_edge_case_4_boomerang_alumni(self):
        """Edge Case 4: Alumni returning as Temporary Researcher."""
        expected = self.rules_engine.calculate_expected_access(
            primary_role="Temporary_Researcher",
            department="Computer Science",
            secondary_role="Alumni"
        )
        self.assertIn("Alumni_Portal", expected["applications"])
        self.assertIn("Research_Lab_SSH", expected["applications"])
        self.assertIn("HPC_Slurm_Cluster", expected["applications"])

    def test_09_accountable_approval_justification_enforcement(self):
        """Test that approvals without mandatory justification are rejected."""
        with self.assertRaises(ValueError):
            self.remediator.process_approval_decision(
                approval_id="REQ-NONEXISTENT",
                reviewer_id="admin_sec",
                decision="Approved_Removal",
                justification=""  # Empty justification rejected
            )

    def test_10_tamper_evident_audit_log(self):
        """Test that audit log entries include SHA-256 integrity hash."""
        conn = get_db_connection(TEST_DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT integrity_hash FROM audit_log LIMIT 1")
        audit_row = cursor.fetchone()
        conn.close()
        self.assertIsNotNone(audit_row)
        self.assertEqual(len(audit_row["integrity_hash"]), 64)


if __name__ == "__main__":
    unittest.main()
