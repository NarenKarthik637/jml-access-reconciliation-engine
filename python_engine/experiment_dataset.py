"""
JML Access Guard - Final Evaluation Experiment Dataset Generator
Generates a controlled, realistic university identity dataset of 75 users across
6 organizational roles and multiple departments.
Includes all 9 required evaluation scenarios:
1. Valid access (matches policy)
2. Excessive access (retained from previous department/role)
3. Orphaned access (departed, terminated, contract-expired users retaining privileges)
4. Missing access (active users lacking mandatory policy entitlements)
5. Delayed role change (HR role change processed, access stale)
6. Approval-required access (high/critical risk items requiring human sign-off)
7. Rejected approval scenario (approver authorizes temporary retention with justification)
8. Failed remediation scenario (simulated target system API connection timeout/lock)
9. Invalid HR record scenario (schema/data inconsistency handled safely)
"""

import json
import os
import uuid
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Any, Tuple


def generate_experiment_dataset(seed_time: datetime = None) -> Dict[str, Any]:
    if seed_time is None:
        seed_time = datetime(2026, 9, 28, 12, 0, 0, tzinfo=timezone.utc)
    
    users = []
    hr_events = []
    directory_memberships = []
    user_entitlements = []
    ground_truth_discrepancies = []

    # Helper functions
    def iso(dt: datetime) -> str:
        return dt.isoformat()

    # -------------------------------------------------------------
    # 1. 25 Fully Valid Users (Active, compliant, access matches role)
    # -------------------------------------------------------------
    departments = ["Mathematics", "Computer Science", "Biology", "Chemistry", "Finance", "English"]
    roles_pool = [
        ("Faculty", "instructional"),
        ("Student", "undergraduate"),
        ("Alumni", "graduated"),
        ("Staff", "administrative"),
        ("Temporary_Researcher", "research")
    ]

    for i in range(1, 26):
        uid = f"U_VAL_{i:03d}"
        dept = departments[i % len(departments)]
        role_tuple = roles_pool[i % len(roles_pool)]
        role = role_tuple[0]
        dept_slug = dept.lower().replace(" ", "_")

        name_first = ["Alice", "Brian", "Catherine", "David", "Emma", "Felix", "Grace", "Henry", "Isla", "Jack"][i % 10]
        name_last = ["Adams", "Baker", "Clark", "Davis", "Evans", "Foster", "Garcia", "Harris", "Ibrahim", "Jones"][i % 10]
        full_name = f"{name_first} {name_last}"
        email = f"{name_first.lower()}.{name_last.lower()}@university.edu"

        end_date = None
        if role == "Temporary_Researcher":
            end_date = iso(seed_time + timedelta(days=180))

        users.append({
            "id": uid,
            "name": full_name,
            "email": email,
            "department": dept,
            "primary_role": role,
            "secondary_role": None,
            "employment_status": "Active",
            "contract_end_date": end_date,
            "created_at": iso(seed_time - timedelta(days=200)),
            "updated_at": iso(seed_time - timedelta(days=30)),
            "scenario": "valid_access"
        })

        # Add valid directory groups
        if role == "Faculty":
            directory_memberships.append({"user_id": uid, "group_name": "faculty_general", "assigned_at": iso(seed_time - timedelta(days=190))})
            directory_memberships.append({"user_id": uid, "group_name": f"{dept_slug}_faculty_group", "assigned_at": iso(seed_time - timedelta(days=190))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Canvas_LMS_Instructor", "granted_at": iso(seed_time - timedelta(days=190))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Banner_Grade_Submission", "granted_at": iso(seed_time - timedelta(days=190))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "University_Email", "granted_at": iso(seed_time - timedelta(days=190))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Edu_Suite_Pro", "granted_at": iso(seed_time - timedelta(days=190))})
        elif role == "Student":
            directory_memberships.append({"user_id": uid, "group_name": "student_body", "assigned_at": iso(seed_time - timedelta(days=120))})
            directory_memberships.append({"user_id": uid, "group_name": f"{dept_slug}_student_group", "assigned_at": iso(seed_time - timedelta(days=120))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Canvas_LMS_Student", "granted_at": iso(seed_time - timedelta(days=120))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Student_Self_Service_SIS", "granted_at": iso(seed_time - timedelta(days=120))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "University_Email", "granted_at": iso(seed_time - timedelta(days=120))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Library_Standard", "granted_at": iso(seed_time - timedelta(days=120))})
        elif role == "Alumni":
            directory_memberships.append({"user_id": uid, "group_name": "alumni_network", "assigned_at": iso(seed_time - timedelta(days=365))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Alumni_Portal", "granted_at": iso(seed_time - timedelta(days=365))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Alumni_Email_Forwarding", "granted_at": iso(seed_time - timedelta(days=365))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Transcript_Request_Portal", "granted_at": iso(seed_time - timedelta(days=365))})
        elif role == "Staff":
            directory_memberships.append({"user_id": uid, "group_name": "staff_general", "assigned_at": iso(seed_time - timedelta(days=250))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Staff_Intranet", "granted_at": iso(seed_time - timedelta(days=250))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "University_Email", "granted_at": iso(seed_time - timedelta(days=250))})
            if dept == "Finance":
                user_entitlements.append({"user_id": uid, "entitlement_name": "Finance_ERP_Dashboard", "granted_at": iso(seed_time - timedelta(days=250))})
        elif role == "Temporary_Researcher":
            directory_memberships.append({"user_id": uid, "group_name": "temporary_researchers", "assigned_at": iso(seed_time - timedelta(days=60))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Research_Lab_SSH", "granted_at": iso(seed_time - timedelta(days=60))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "HPC_Slurm_Cluster", "granted_at": iso(seed_time - timedelta(days=60))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Temporary_Email", "granted_at": iso(seed_time - timedelta(days=60))})

    # -------------------------------------------------------------
    # 2. 12 Excessive Access Users (Movers who retained former privileges)
    # -------------------------------------------------------------
    for i in range(1, 13):
        uid = f"U_EXC_{i:03d}"
        # Faculty moving to Alumni (5 users) or Staff moving departments (7 users)
        if i <= 5:
            # Former faculty now alumni retaining grade submission or VPN
            users.append({
                "id": uid,
                "name": f"Retired Faculty {i}",
                "email": f"ret.faculty{i}@alumni.university.edu",
                "department": "Mathematics" if i % 2 == 0 else "Biology",
                "primary_role": "Alumni",
                "secondary_role": None,
                "employment_status": "Active",
                "contract_end_date": None,
                "created_at": iso(seed_time - timedelta(days=400)),
                "updated_at": iso(seed_time - timedelta(days=10)),
                "scenario": "excessive_access"
            })
            hr_events.append({
                "id": f"EVT-EXC-{i:03d}",
                "user_id": uid,
                "event_type": "Mover",
                "previous_role": "Faculty",
                "new_role": "Alumni",
                "previous_department": "Mathematics" if i % 2 == 0 else "Biology",
                "new_department": "Alumni_Association",
                "effective_date": iso(seed_time - timedelta(days=10)),
                "processed_at": iso(seed_time - timedelta(days=10)),
                "status": "Processed",
                "details": "Transitioned to Emeritus Alumni status."
            })
            # Expected alumni access
            directory_memberships.append({"user_id": uid, "group_name": "alumni_network", "assigned_at": iso(seed_time - timedelta(days=10))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Alumni_Portal", "granted_at": iso(seed_time - timedelta(days=10))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Alumni_Email_Forwarding", "granted_at": iso(seed_time - timedelta(days=10))})
            # Excessive items!
            directory_memberships.append({"user_id": uid, "group_name": "faculty_general", "assigned_at": iso(seed_time - timedelta(days=400))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Faculty_VPN", "granted_at": iso(seed_time - timedelta(days=400))})
            if i <= 3:
                user_entitlements.append({"user_id": uid, "entitlement_name": "Banner_Grade_Submission", "granted_at": iso(seed_time - timedelta(days=400))})
                ground_truth_discrepancies.append({"user_id": uid, "resource": "Banner_Grade_Submission", "type": "excessive_access", "risk": "Critical", "requires_approval": True})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "Faculty_VPN", "type": "excessive_access", "risk": "High", "requires_approval": True})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "faculty_general", "type": "excessive_access", "risk": "Low", "requires_approval": False})
        else:
            # Staff moved from Finance to Admissions/Registrar retaining Finance ERP
            users.append({
                "id": uid,
                "name": f"Transferred Staff {i}",
                "email": f"staff.mvr{i}@staff.university.edu",
                "department": "Registrar",
                "primary_role": "Staff",
                "secondary_role": None,
                "employment_status": "Active",
                "contract_end_date": None,
                "created_at": iso(seed_time - timedelta(days=300)),
                "updated_at": iso(seed_time - timedelta(days=14)),
                "scenario": "excessive_access"
            })
            hr_events.append({
                "id": f"EVT-EXC-{i:03d}",
                "user_id": uid,
                "event_type": "Mover",
                "previous_role": "Staff",
                "new_role": "Staff",
                "previous_department": "Finance",
                "new_department": "Registrar",
                "effective_date": iso(seed_time - timedelta(days=14)),
                "processed_at": iso(seed_time - timedelta(days=14)),
                "status": "Processed",
                "details": "Transferred from Bursar Office to Academic Registrar."
            })
            directory_memberships.append({"user_id": uid, "group_name": "staff_general", "assigned_at": iso(seed_time - timedelta(days=300))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Staff_Intranet", "granted_at": iso(seed_time - timedelta(days=300))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "University_Email", "granted_at": iso(seed_time - timedelta(days=300))})
            # Stale finance privilege
            user_entitlements.append({"user_id": uid, "entitlement_name": "Finance_ERP_Dashboard", "granted_at": iso(seed_time - timedelta(days=300))})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "Finance_ERP_Dashboard", "type": "excessive_access", "risk": "Critical", "requires_approval": True})

    # -------------------------------------------------------------
    # 3. 12 Orphaned Access Users (Terminated or Contract-Expired)
    # -------------------------------------------------------------
    for i in range(1, 13):
        uid = f"U_ORP_{i:03d}"
        if i <= 6:
            # Terminated staff or faculty retaining critical accounts
            users.append({
                "id": uid,
                "name": f"Departed Employee {i}",
                "email": f"departed{i}@university.edu",
                "department": "HR" if i % 2 == 0 else "Finance",
                "primary_role": "Staff",
                "secondary_role": None,
                "employment_status": "Terminated",
                "contract_end_date": None,
                "created_at": iso(seed_time - timedelta(days=350)),
                "updated_at": iso(seed_time - timedelta(days=5)),
                "scenario": "orphaned_access"
            })
            hr_events.append({
                "id": f"EVT-ORP-{i:03d}",
                "user_id": uid,
                "event_type": "Leaver",
                "previous_role": "Staff",
                "new_role": None,
                "previous_department": "HR" if i % 2 == 0 else "Finance",
                "new_department": None,
                "effective_date": iso(seed_time - timedelta(days=5)),
                "processed_at": iso(seed_time - timedelta(days=5)),
                "status": "Processed",
                "details": "Contract terminated - involuntary separation."
            })
            directory_memberships.append({"user_id": uid, "group_name": "staff_general", "assigned_at": iso(seed_time - timedelta(days=350))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "University_Email", "granted_at": iso(seed_time - timedelta(days=350))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Staff_Intranet", "granted_at": iso(seed_time - timedelta(days=350))})
            if i % 2 == 0:
                user_entitlements.append({"user_id": uid, "entitlement_name": "Workday_HR_Admin", "granted_at": iso(seed_time - timedelta(days=350))})
                ground_truth_discrepancies.append({"user_id": uid, "resource": "Workday_HR_Admin", "type": "orphaned_access", "risk": "Critical", "requires_approval": True})
            else:
                user_entitlements.append({"user_id": uid, "entitlement_name": "Finance_ERP_Dashboard", "granted_at": iso(seed_time - timedelta(days=350))})
                ground_truth_discrepancies.append({"user_id": uid, "resource": "Finance_ERP_Dashboard", "type": "orphaned_access", "risk": "Critical", "requires_approval": True})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "staff_general", "type": "orphaned_access", "risk": "Low", "requires_approval": False})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "Staff_Intranet", "type": "orphaned_access", "risk": "Low", "requires_approval": False})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "University_Email", "type": "orphaned_access", "risk": "Low", "requires_approval": False})
        else:
            # Temporary researchers whose contracts ended 2-4 weeks ago
            users.append({
                "id": uid,
                "name": f"Expired Researcher {i}",
                "email": f"exp.researcher{i}@research.university.edu",
                "department": "Computer Science" if i % 2 == 0 else "Biology",
                "primary_role": "Temporary_Researcher",
                "secondary_role": None,
                "employment_status": "Active",  # Active in user table but contract_end_date in past!
                "contract_end_date": iso(seed_time - timedelta(days=20)),
                "created_at": iso(seed_time - timedelta(days=200)),
                "updated_at": iso(seed_time - timedelta(days=20)),
                "scenario": "orphaned_access"
            })
            hr_events.append({
                "id": f"EVT-ORP-{i:03d}",
                "user_id": uid,
                "event_type": "Status_Change",
                "previous_role": "Temporary_Researcher",
                "new_role": "Temporary_Researcher",
                "previous_department": "Computer Science",
                "new_department": "Computer Science",
                "effective_date": iso(seed_time - timedelta(days=20)),
                "processed_at": iso(seed_time - timedelta(days=20)),
                "status": "Processed",
                "details": "Grant period concluded without extension."
            })
            directory_memberships.append({"user_id": uid, "group_name": "temporary_researchers", "assigned_at": iso(seed_time - timedelta(days=200))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Research_Lab_SSH", "granted_at": iso(seed_time - timedelta(days=200))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "HPC_Slurm_Cluster", "granted_at": iso(seed_time - timedelta(days=200))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Temporary_Email", "granted_at": iso(seed_time - timedelta(days=200))})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "Research_Lab_SSH", "type": "orphaned_access", "risk": "High", "requires_approval": True})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "HPC_Slurm_Cluster", "type": "orphaned_access", "risk": "High", "requires_approval": True})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "temporary_researchers", "type": "orphaned_access", "risk": "Medium", "requires_approval": True})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "Temporary_Email", "type": "orphaned_access", "risk": "Low", "requires_approval": False})

    # -------------------------------------------------------------
    # 4. 8 Missing Access Users (Active users missing standard baseline tools)
    # -------------------------------------------------------------
    for i in range(1, 9):
        uid = f"U_MIS_{i:03d}"
        role = "Faculty" if i <= 4 else "Student"
        dept = "Computer Science" if i % 2 == 0 else "Mathematics"
        users.append({
            "id": uid,
            "name": f"Provision Missing User {i}",
            "email": f"missing.acc{i}@university.edu",
            "department": dept,
            "primary_role": role,
            "secondary_role": None,
            "employment_status": "Active",
            "contract_end_date": None,
            "created_at": iso(seed_time - timedelta(days=3)),
            "updated_at": iso(seed_time - timedelta(days=3)),
            "scenario": "missing_access"
        })
        hr_events.append({
            "id": f"EVT-MIS-{i:03d}",
            "user_id": uid,
            "event_type": "Joiner",
            "previous_role": None,
            "new_role": role,
            "previous_department": None,
            "new_department": dept,
            "effective_date": iso(seed_time - timedelta(days=3)),
            "processed_at": iso(seed_time - timedelta(days=3)),
            "status": "Processed",
            "details": f"Newly onboarded {role} awaiting standard access provisioning."
        })
        # Only has minimal directory group, missing LMS or Email
        if role == "Faculty":
            directory_memberships.append({"user_id": uid, "group_name": "faculty_general", "assigned_at": iso(seed_time - timedelta(days=3))})
            # Missing Canvas_LMS_Instructor and University_Email
            user_entitlements.append({"user_id": uid, "entitlement_name": "Edu_Suite_Pro", "granted_at": iso(seed_time - timedelta(days=3))})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "Canvas_LMS_Instructor", "type": "missing_access", "risk": "Medium", "requires_approval": True})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "University_Email", "type": "missing_access", "risk": "Low", "requires_approval": False})
        else:
            directory_memberships.append({"user_id": uid, "group_name": "student_body", "assigned_at": iso(seed_time - timedelta(days=3))})
            user_entitlements.append({"user_id": uid, "entitlement_name": "Library_Standard", "granted_at": iso(seed_time - timedelta(days=3))})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "Canvas_LMS_Student", "type": "missing_access", "risk": "Low", "requires_approval": False})
            ground_truth_discrepancies.append({"user_id": uid, "resource": "Student_Self_Service_SIS", "type": "missing_access", "risk": "Low", "requires_approval": False})

    # -------------------------------------------------------------
    # 5. 6 Delayed Role Change Users (HR updated role 2 days ago, directory/apps stale)
    # -------------------------------------------------------------
    for i in range(1, 7):
        uid = f"U_DEL_{i:03d}"
        users.append({
            "id": uid,
            "name": f"Delayed Promotion User {i}",
            "email": f"delayed.role{i}@university.edu",
            "department": "Finance",
            "primary_role": "Staff",
            "secondary_role": None,
            "employment_status": "Active",
            "contract_end_date": None,
            "created_at": iso(seed_time - timedelta(days=180)),
            "updated_at": iso(seed_time - timedelta(days=2)),
            "scenario": "delayed_role_change"
        })
        hr_events.append({
            "id": f"EVT-DEL-{i:03d}",
            "user_id": uid,
            "event_type": "Mover",
            "previous_role": "Staff",
            "new_role": "Staff",
            "previous_department": "Finance",
            "new_department": "English",
            "effective_date": iso(seed_time - timedelta(days=2)),
            "processed_at": iso(seed_time - timedelta(days=2)),
            "status": "Processed",
            "details": "Departmental transfer to Humanities dean office."
        })
        # Still in finance staff group and holding finance ERP!
        directory_memberships.append({"user_id": uid, "group_name": "finance_staff_group", "assigned_at": iso(seed_time - timedelta(days=180))})
        directory_memberships.append({"user_id": uid, "group_name": "staff_general", "assigned_at": iso(seed_time - timedelta(days=180))})
        user_entitlements.append({"user_id": uid, "entitlement_name": "Finance_ERP_Dashboard", "granted_at": iso(seed_time - timedelta(days=180))})
        user_entitlements.append({"user_id": uid, "entitlement_name": "University_Email", "granted_at": iso(seed_time - timedelta(days=180))})
        user_entitlements.append({"user_id": uid, "entitlement_name": "Staff_Intranet", "granted_at": iso(seed_time - timedelta(days=180))})
        ground_truth_discrepancies.append({"user_id": uid, "resource": "Finance_ERP_Dashboard", "type": "excessive_access", "risk": "Critical", "requires_approval": True})
        ground_truth_discrepancies.append({"user_id": uid, "resource": "finance_staff_group", "type": "excessive_access", "risk": "High", "requires_approval": True})

    # -------------------------------------------------------------
    # 6. 4 Approval-Required Access Users (High/Critical risk modifications)
    # -------------------------------------------------------------
    for i in range(1, 5):
        uid = f"U_APPR_{i:03d}"
        users.append({
            "id": uid,
            "name": f"High Risk Approval User {i}",
            "email": f"highrisk.user{i}@university.edu",
            "department": "Computer Science",
            "primary_role": "Student",
            "secondary_role": "Graduate_Teaching_Assistant",
            "employment_status": "Active",
            "contract_end_date": None,
            "created_at": iso(seed_time - timedelta(days=100)),
            "updated_at": iso(seed_time - timedelta(days=1)),
            "scenario": "approval_required_access"
        })
        hr_events.append({
            "id": f"EVT-APPR-{i:03d}",
            "user_id": uid,
            "event_type": "Role_Assignment",
            "previous_role": "Graduate_Teaching_Assistant",
            "new_role": "Student",
            "previous_department": "Computer Science",
            "new_department": "Computer Science",
            "effective_date": iso(seed_time - timedelta(days=1)),
            "processed_at": iso(seed_time - timedelta(days=1)),
            "status": "Processed",
            "details": "TA contract completed at end of term."
        })
        directory_memberships.append({"user_id": uid, "group_name": "student_body", "assigned_at": iso(seed_time - timedelta(days=100))})
        user_entitlements.append({"user_id": uid, "entitlement_name": "Student_Self_Service_SIS", "granted_at": iso(seed_time - timedelta(days=100))})
        user_entitlements.append({"user_id": uid, "entitlement_name": "Canvas_LMS_Student", "granted_at": iso(seed_time - timedelta(days=100))})
        # Retained critical grade submission from TA role
        user_entitlements.append({"user_id": uid, "entitlement_name": "Banner_Grade_Submission", "granted_at": iso(seed_time - timedelta(days=100))})
        user_entitlements.append({"user_id": uid, "entitlement_name": "Canvas_LMS_Instructor", "granted_at": iso(seed_time - timedelta(days=100))})
        ground_truth_discrepancies.append({"user_id": uid, "resource": "Banner_Grade_Submission", "type": "excessive_access", "risk": "Critical", "requires_approval": True})
        ground_truth_discrepancies.append({"user_id": uid, "resource": "Canvas_LMS_Instructor", "type": "excessive_access", "risk": "Medium", "requires_approval": True})

    # -------------------------------------------------------------
    # 7. 3 Rejected Approval Users (Approver legitimately rejects removal)
    # -------------------------------------------------------------
    for i in range(1, 4):
        uid = f"U_REJ_{i:03d}"
        users.append({
            "id": uid,
            "name": f"Research Exception User {i}",
            "email": f"exception.user{i}@university.edu",
            "department": "Biology",
            "primary_role": "Alumni",
            "secondary_role": None,
            "employment_status": "Active",
            "contract_end_date": None,
            "created_at": iso(seed_time - timedelta(days=500)),
            "updated_at": iso(seed_time - timedelta(days=7)),
            "scenario": "rejected_approval"
        })
        directory_memberships.append({"user_id": uid, "group_name": "alumni_network", "assigned_at": iso(seed_time - timedelta(days=7))})
        user_entitlements.append({"user_id": uid, "entitlement_name": "Alumni_Portal", "granted_at": iso(seed_time - timedelta(days=7))})
        # Retained HPC Slurm cluster for uncompleted NSF publication
        user_entitlements.append({"user_id": uid, "entitlement_name": "HPC_Slurm_Cluster", "granted_at": iso(seed_time - timedelta(days=500))})
        ground_truth_discrepancies.append({
            "user_id": uid,
            "resource": "HPC_Slurm_Cluster",
            "type": "excessive_access",
            "risk": "High",
            "requires_approval": True,
            "expected_decision": "Rejected_Retained",
            "justification": "Authorized 60-day research extension for NSF Bio Grant 48821 completion."
        })

    # -------------------------------------------------------------
    # 8. 3 Failed Remediation Users (Simulated target API timeout/error)
    # -------------------------------------------------------------
    for i in range(1, 4):
        uid = f"U_FAIL_{i:03d}"
        users.append({
            "id": uid,
            "name": f"Target API Failure User {i}",
            "email": f"api.fail{i}@university.edu",
            "department": "Chemistry",
            "primary_role": "Staff",
            "secondary_role": None,
            "employment_status": "Terminated",
            "contract_end_date": None,
            "created_at": iso(seed_time - timedelta(days=220)),
            "updated_at": iso(seed_time - timedelta(days=4)),
            "scenario": "failed_remediation"
        })
        user_entitlements.append({"user_id": uid, "entitlement_name": "Research_Lab_SSH", "granted_at": iso(seed_time - timedelta(days=220))})
        ground_truth_discrepancies.append({
            "user_id": uid,
            "resource": "Research_Lab_SSH",
            "type": "orphaned_access",
            "risk": "High",
            "requires_approval": True,
            "simulate_target_failure": True,
            "target_system_error": "ConnectionRefused: Directory LDAP Agent unreachable on chem-lab-01:636"
        })

    # -------------------------------------------------------------
    # 9. 2 Invalid HR Record Users (Schema data anomalies)
    # -------------------------------------------------------------
    # Missing/unknown role or unmapped department
    users.append({
        "id": "U_INV_001",
        "name": "Corrupted Role Identity",
        "email": "corrupted.role@university.edu",
        "department": "Mathematics",
        "primary_role": "UNKNOWN_CONSULTANT",  # Unregistered role
        "secondary_role": None,
        "employment_status": "Active",
        "contract_end_date": None,
        "created_at": iso(seed_time - timedelta(days=90)),
        "updated_at": iso(seed_time - timedelta(days=1)),
        "scenario": "invalid_hr_record"
    })
    user_entitlements.append({"user_id": "U_INV_001", "entitlement_name": "Faculty_VPN", "granted_at": iso(seed_time - timedelta(days=90))})

    users.append({
        "id": "U_INV_002",
        "name": "Missing Dept Identity",
        "email": "missing.dept@university.edu",
        "department": "",  # Empty department
        "primary_role": "Faculty",
        "secondary_role": None,
        "employment_status": "Active",
        "contract_end_date": None,
        "created_at": iso(seed_time - timedelta(days=60)),
        "updated_at": iso(seed_time - timedelta(days=2)),
        "scenario": "invalid_hr_record"
    })
    user_entitlements.append({"user_id": "U_INV_002", "entitlement_name": "Banner_Grade_Submission", "granted_at": iso(seed_time - timedelta(days=60))})

    return {
        "metadata": {
            "dataset_version": "2.0-EVAL",
            "generated_at": iso(seed_time),
            "total_users": len(users),
            "scenario_distribution": {
                "valid_access": 25,
                "excessive_access": 12,
                "orphaned_access": 12,
                "missing_access": 8,
                "delayed_role_change": 6,
                "approval_required_access": 4,
                "rejected_approval": 3,
                "failed_remediation": 3,
                "invalid_hr_record": 2
            }
        },
        "users": users,
        "hr_events": hr_events,
        "directory_memberships": directory_memberships,
        "user_entitlements": user_entitlements,
        "ground_truth_discrepancies": ground_truth_discrepancies
    }


if __name__ == "__main__":
    dataset = generate_experiment_dataset()
    print(f"Generated evaluation dataset with {len(dataset['users'])} users.")
    print("Scenario breakdown:", json.dumps(dataset['metadata']['scenario_distribution'], indent=2))
