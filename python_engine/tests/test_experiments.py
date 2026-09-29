"""
JML Access Guard - Experiment & Evaluation Test Suite
Validates experiment dataset integrity, baseline simulation, prototype execution,
mathematical metrics calculations, and all 9 scenario edge cases.
"""

import json
import os
import sys
import unittest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from python_engine.experiment_dataset import generate_experiment_dataset
from python_engine.baseline_runner import run_baseline_experiment
from python_engine.prototype_runner import run_prototype_experiment
from python_engine.metrics_calculator import calculate_metrics


class TestExperimentEvaluationSuite(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.dataset = generate_experiment_dataset()

    def test_01_dataset_composition(self):
        """Verifies evaluation dataset contains 75 identities and all 9 required scenarios."""
        users = self.dataset["users"]
        self.assertEqual(len(users), 75)

        scenarios = set(u.get("scenario") for u in users)
        expected_scenarios = {
            "valid_access", "excessive_access", "orphaned_access",
            "missing_access", "delayed_role_change", "approval_required_access",
            "rejected_approval", "failed_remediation", "invalid_hr_record"
        }
        self.assertEqual(scenarios, expected_scenarios)

        # Ground truth discrepancies should be populated
        self.assertGreater(len(self.dataset["ground_truth_discrepancies"]), 20)

    def test_02_baseline_experiment_execution(self):
        """Verifies baseline runner generates valid metrics and machine-readable files."""
        res = run_baseline_experiment(self.dataset, target_hours=24.0, seed=123)
        summary = res["summary"]
        self.assertGreater(summary["total_inappropriate_access_items"], 30)
        self.assertGreater(summary["average_remediation_time_hours"], 30.0) # Slow manual review
        self.assertLess(summary["removal_within_target_rate_pct"], 35.0) # Poor 24h compliance
        self.assertTrue(os.path.exists(res["json_file"]))
        self.assertTrue(os.path.exists(res["csv_file"]))

    def test_03_prototype_experiment_execution(self):
        """Verifies prototype executes 14-step workflow with auto-remediation and accountable approvals."""
        res = run_prototype_experiment(self.dataset, target_hours=24.0, seed=123)
        summary = res["summary"]
        self.assertGreater(summary["total_inappropriate_access_items"], 30)
        self.assertLess(summary["average_remediation_time_hours"], 5.0) # Fast policy-driven execution
        self.assertGreater(summary["removal_within_target_rate_pct"], 90.0) # High SLA compliance
        self.assertGreater(summary["auto_remediated_count"], 0)
        self.assertGreater(summary["human_approved_count"], 0)
        self.assertEqual(summary["accountable_approval_rate_pct"], 100.0)
        self.assertEqual(summary["audit_trail_integrity_pct"], 100.0)

        # Verify audit records contain SHA-256 hashes
        audit_records = res.get("audit_records", [])
        self.assertGreater(len(audit_records), 0)
        for rec in audit_records:
            self.assertEqual(len(rec["integrity_hash"]), 64)

    def test_04_comparative_metrics_and_improvements(self):
        """Verifies mathematical correctness of primary metrics and relative gains."""
        b_res = run_baseline_experiment(self.dataset, target_hours=24.0, seed=42)
        p_res = run_prototype_experiment(self.dataset, target_hours=24.0, seed=42)
        summary = calculate_metrics(b_res, p_res, target_hours=24.0)

        pm = summary["primary_metric"]
        self.assertTrue(pm["hypothesis_confirmed"])
        self.assertGreater(pm["prototype_rate_pct"], pm["baseline_rate_pct"])
        self.assertGreater(pm["absolute_improvement_pts"], 50.0)
        self.assertGreater(pm["relative_improvement_pct"], 100.0)

        vm = summary["velocity_metrics"]
        self.assertGreater(vm["speedup_factor"], 10.0)

        # Comparison matrix exists and has entries
        matrix = summary["comparison_matrix"]
        self.assertGreaterEqual(len(matrix), 5)

    def test_05_configurable_target_hours_sensitivity(self):
        """Verifies that changing target hours (12h, 24h, 48h) properly adjusts metrics."""
        b_res = run_baseline_experiment(self.dataset, target_hours=24.0, seed=42)
        p_res = run_prototype_experiment(self.dataset, target_hours=24.0, seed=42)

        metrics_12 = calculate_metrics(b_res, p_res, target_hours=12.0)
        metrics_24 = calculate_metrics(b_res, p_res, target_hours=24.0)
        metrics_48 = calculate_metrics(b_res, p_res, target_hours=48.0)

        # Baseline removal rate increases as deadline becomes more lenient
        self.assertLessEqual(metrics_12["primary_metric"]["baseline_rate_pct"], metrics_24["primary_metric"]["baseline_rate_pct"])
        self.assertLessEqual(metrics_24["primary_metric"]["baseline_rate_pct"], metrics_48["primary_metric"]["baseline_rate_pct"])

    def test_06_edge_case_rejected_approval(self):
        """Verifies rejected approval scenario retains entitlement with documented justification."""
        p_res = run_prototype_experiment(self.dataset, target_hours=24.0, seed=42)
        rejected_items = [it for it in p_res["items"] if it.get("status") == "Rejected_Retained_Exception"]
        self.assertGreater(len(rejected_items), 0)
        for it in rejected_items:
            self.assertFalse(it["eventually_removed"])
            self.assertEqual(it["resource_name"], "HPC_Slurm_Cluster")

    def test_07_edge_case_failed_remediation_recovery(self):
        """Verifies failed remediation is caught, retried, and logged."""
        p_res = run_prototype_experiment(self.dataset, target_hours=24.0, seed=42)
        recovered_items = [it for it in p_res["items"] if it.get("status") == "Recovered_After_Retry"]
        self.assertGreater(len(recovered_items), 0)
        self.assertGreater(p_res["summary"]["failed_actions_encountered"], 0)

    def test_08_edge_case_invalid_hr_record(self):
        """Verifies invalid HR data does not cause crash and creates quarantined audit entry."""
        p_res = run_prototype_experiment(self.dataset, target_hours=24.0, seed=42)
        audit_records = p_res["audit_records"]
        validation_errors = [a for a in audit_records if a.get("event_type") == "HR_Data_Validation_Error"]
        self.assertGreater(len(validation_errors), 0)
        self.assertEqual(validation_errors[0]["action"], "Flag_For_HR_Review")


if __name__ == "__main__":
    unittest.main()
