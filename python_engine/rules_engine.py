"""
JML Access Guard - Deterministic Rules Engine
Calculates authoritative expected access states based on externalized JSON policy rules.
"""

import json
import os
from typing import Dict, List, Set, Any, Optional

DEFAULT_POLICY_PATH = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    "policies",
    "access_rules.json"
)


class RulesEngine:
    def __init__(self, policy_path: Optional[str] = None):
        self.policy_path = policy_path or DEFAULT_POLICY_PATH
        self.policy: Dict[str, Any] = self._load_policy()

    def _load_policy(self) -> Dict[str, Any]:
        if not os.path.exists(self.policy_path):
            raise FileNotFoundError(f"Policy file not found: {self.policy_path}")
        with open(self.policy_path, "r", encoding="utf-8") as f:
            return json.load(f)

    def reload(self) -> None:
        self.policy = self._load_policy()

    def get_role_rules(self, role: str) -> Optional[Dict[str, Any]]:
        return self.policy.get("roles", {}).get(role)

    def calculate_expected_access(
        self,
        primary_role: str,
        department: str,
        secondary_role: Optional[str] = None,
        employment_status: str = "Active",
        contract_end_date: Optional[str] = None
    ) -> Dict[str, Set[str]]:
        """
        Determines the precise set of expected directory groups and applications.
        If user is Terminated or Contract_Expired and has no Alumni status, expected access is empty.
        If user is Alumni, only Alumni entitlements are expected.
        If user has secondary role (e.g., Student + Graduate_Teaching_Assistant), unions permissions.
        """
        expected_groups: Set[str] = set()
        expected_apps: Set[str] = set()

        # If user is permanently terminated and not registered as Alumni, expected access is zero
        if employment_status in ("Terminated", "Contract_Expired") and primary_role != "Alumni":
            return {
                "directory_groups": expected_groups,
                "applications": expected_apps
            }

        dept_prefix = department.lower().replace(" ", "_")

        # Evaluate primary role
        primary_rules = self.get_role_rules(primary_role)
        if primary_rules:
            for g in primary_rules.get("allowed_directory_groups", []):
                # Department group resolution
                resolved_g = g.replace("dept_", f"{dept_prefix}_")
                expected_groups.add(resolved_g)
            for app in primary_rules.get("allowed_applications", []):
                expected_apps.add(app)

        # Evaluate secondary role if present (e.g. TA, Dual-appointment)
        if secondary_role:
            sec_rules = self.get_role_rules(secondary_role)
            if sec_rules:
                for g in sec_rules.get("allowed_directory_groups", []):
                    resolved_g = g.replace("dept_", f"{dept_prefix}_")
                    expected_groups.add(resolved_g)
                for app in sec_rules.get("allowed_applications", []):
                    expected_apps.add(app)

        return {
            "directory_groups": expected_groups,
            "applications": expected_apps
        }

    def get_entitlement_risk(self, resource_name: str, resource_type: str = "application_entitlement") -> str:
        """Looks up risk level from entitlement catalog; defaults to Medium if unlisted."""
        catalog = self.policy.get("entitlement_risk_catalog", {})
        if resource_name in catalog:
            return catalog[resource_name].get("risk_level", "Medium")
        
        # Generic heuristic for directory groups
        lower = resource_name.lower()
        if "admin" in lower or "council" in lower:
            return "High"
        if "staff" in lower or "research" in lower or "grad" in lower:
            return "Medium"
        return "Low"

    def requires_approval_for_removal(self, role: str, resource_name: str) -> bool:
        """
        Determines whether removing this resource requires human approval.
        Checks both explicit role-specific removal triggers and high/critical risk thresholds.
        """
        role_rules = self.get_role_rules(role)
        if role_rules:
            explicit_requires = role_rules.get("approval_required_on_removal", [])
            if resource_name in explicit_requires:
                return True

        risk = self.get_entitlement_risk(resource_name)
        require_risks = self.policy.get("risk_thresholds", {}).get(
            "require_approval_risks", ["Medium", "High", "Critical"]
        )
        return risk in require_risks


if __name__ == "__main__":
    re = RulesEngine()
    print("Loaded policy:", re.policy.get("policy_name"))
    math_faculty = re.calculate_expected_access("Faculty", "Mathematics")
    print("Math Faculty expected:", math_faculty)
    alumni = re.calculate_expected_access("Alumni", "Mathematics")
    print("Alumni expected:", alumni)
