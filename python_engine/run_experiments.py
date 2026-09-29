"""
JML Access Guard - Master Experiment Orchestrator CLI
Runs the end-to-end empirical evaluation against the university dataset:
- Generates 75-identity controlled dataset across 9 scenarios
- Executes the manual baseline runner
- Executes the policy-driven prototype runner
- Computes formal statistical metrics and comparative matrices
- Saves all machine-readable output in /results/
"""

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from python_engine.experiment_dataset import generate_experiment_dataset
from python_engine.baseline_runner import run_baseline_experiment
from python_engine.prototype_runner import run_prototype_experiment
from python_engine.metrics_calculator import calculate_metrics


def run_full_suite(target_hours: float = 24.0, seed: int = 42) -> dict:
    print("=" * 72)
    print("  JML ACCESS GUARD - FINAL RESEARCH EVALUATION HARNESS")
    print("  Evaluating Automated JML Access Guard vs. Manual Baseline")
    print(f"  Target SLA Horizon: {target_hours:.1f} Hours")
    print("=" * 72)

    print("\n[1/4] Generating Controlled Synthetic Dataset...")
    dataset = generate_experiment_dataset()
    users_count = len(dataset["users"])
    scenarios = dataset["metadata"]["scenario_distribution"]
    print(f"      Total Evaluation Population: {users_count} identities")
    print(f"      Scenarios included: {len(scenarios)} categories (Valid, Excessive, Orphaned, Edge cases)")

    print("\n[2/4] Executing Manual Baseline Simulation (Tickets & Periodic Reviews)...")
    baseline_result = run_baseline_experiment(dataset, target_hours=target_hours, seed=seed)
    b_sum = baseline_result["summary"]
    print(f"      Total Inappropriate Items: {b_sum['total_inappropriate_access_items']}")
    print(f"      Items Removed Within {target_hours:.0f}h: {b_sum['items_removed_within_target']} ({b_sum['removal_within_target_rate_pct']}%)")
    print(f"      Mean Time to Remediation: {b_sum['average_remediation_time_hours']} hours")
    print(f"      Unresolved / Missed Cases: {b_sum['unresolved_cases']}")

    print("\n[3/4] Executing JML Access Guard Prototype (Policy-Driven Engine)...")
    prototype_result = run_prototype_experiment(dataset, target_hours=target_hours, seed=seed)
    p_sum = prototype_result["summary"]
    print(f"      Total Inappropriate Items: {p_sum['total_inappropriate_access_items']}")
    print(f"      Items Removed Within {target_hours:.0f}h: {p_sum['items_removed_within_target']} ({p_sum['removal_within_target_rate_pct']}%)")
    print(f"      Mean Time to Remediation: {p_sum['average_remediation_time_hours']} hours")
    print(f"      Auto-Remediated (Instant): {p_sum['auto_remediated_count']}")
    print(f"      Human Approvals Executed: {p_sum['human_approved_count']}")
    print(f"      Documented Exceptions: {p_sum['rejected_retained_count']}")

    print("\n[4/4] Calculating Comparative Metrics & Statistical Significance...")
    summary = calculate_metrics(baseline_result, prototype_result, target_hours=target_hours)
    pm = summary["primary_metric"]
    vm = summary["velocity_metrics"]

    print("\n" + "=" * 72)
    print("                      EXECUTIVE RESEARCH FINDINGS")
    print("=" * 72)
    print(f"  Primary Research Question:")
    print(f"  'Does automated, policy-driven JML reconciliation improve the percentage")
    print(f"   of inappropriate access removed within the target time ({target_hours:.0f}h)?'")
    print(f"  --> ANSWER: {'YES - HYPOTHESIS CONFIRMED' if pm['hypothesis_confirmed'] else 'NO'}")
    print("-" * 72)
    print(f"  - Baseline Removal Rate (<= {target_hours:.0f}h):    {pm['baseline_rate_pct']}%")
    print(f"  - Prototype Removal Rate (<= {target_hours:.0f}h):   {pm['prototype_rate_pct']}%")
    print(f"  - Absolute Rate Improvement:         +{pm['absolute_improvement_pts']} percentage points")
    print(f"  - Relative Improvement:             +{pm['relative_improvement_pct']}%")
    print(f"  - Mean Time to Remediation (MTTR):  {vm['baseline_mttr_hours']} hrs (Baseline) -> {vm['prototype_mttr_hours']} hrs (Guard)")
    print(f"  - Remediation Speedup Factor:       {vm['speedup_factor']}x faster")
    print("=" * 72)

    results_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "results")
    print(f"\nArtifacts successfully written to: {results_dir}")
    print(" - results/baseline_results.json & .csv")
    print(" - results/prototype_results.json & .csv")
    print(" - results/experiment_summary.json & .csv\n")

    return summary


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="JML Access Guard Experiment Runner")
    parser.add_argument("--target-hours", type=float, default=24.0, help="SLA target remediation horizon in hours (default: 24.0)")
    parser.add_argument("--seed", type=int, default=42, help="Random seed for reproducible baseline simulation")
    args = parser.parse_args()

    run_full_suite(target_hours=args.target_hours, seed=args.seed)
