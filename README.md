# JML Access Reconciliation Engine (Prototype)

## Project Purpose
The organisation is a university that provides access to students, faculty, alumni, and temporary researchers. The purpose of this project is to build an automated Joiner-Mover-Leaver (JML) access reconciliation engine to ensure that system access aligns accurately with users' current organisational roles.

## Problem Being Solved
Users frequently retain system access after changing roles (the "Mover" scenario) because access-removal requests are delayed, inconsistent, or overlooked. This "access creep" violates the principle of least privilege, creating significant security and compliance risks. Manual, request-based processes are insufficient to detect and remediate this excessive access at scale.

## Proposed Solution
An automated, rules-based JML access reconciliation engine with accountable approvals. The system detects discrepancies between a user's *actual* access and their *expected* access (derived from configurable policies and HR data). It automatically generates remediation actions, routing high-risk removals through an accountable human approval workflow.

## Technology Stack (Planned)
* **Language:** Python
* **API Framework:** FastAPI
* **Database:** SQLite (using local relational storage for easy demonstration)
* **Data Manipulation:** pandas
* **Validation:** Pydantic
* **User Interface:** Streamlit (for rapid prototyping of the dashboard/approval queue)
* **Input Data:** Synthetic CSV/JSON files representing HR and Directory data.

## Dataset
The project uses a synthetic dataset designed to simulate a university environment.
It includes records for:
* HR Role Changes (Joiners, Movers, Leavers)
* User Directory and Group Memberships
* Application Entitlements
* Configurable Access Rules
* Approval Histories

## Architecture
1. **Data Ingestion:** Loads HR role changes, directory groups, and application entitlements.
2. **Rule Engine:** Calculates expected access based on externalised, configurable policy rules.
3. **Reconciliation Engine:** Compares expected access against actual access to find missing, orphaned, or excessive entitlements.
4. **Workflow/Queue:** Routes necessary remediation actions for accountable approval based on risk level.
5. **Audit Log:** Records all detections, approval decisions, and simulated remediations.

## Current Project Status
**Phase:** First 35% Completed (Problem definition, Architecture, Data modeling, Baseline definition).
* [x] Problem Analysis & Objectives
* [x] User and Workflow Map
* [x] Synthetic Data Model Schema
* [x] Technical Approach Comparison
* [x] Baseline & Experiment Design
* [ ] Implementation of Data Generators *(Planned)*
* [ ] Development of Reconciliation Engine *(Planned)*
* [ ] Dashboard UI *(Planned)*
* [ ] Final Experiment and Evaluation *(Planned)*

## How to run the prototype
*(Planned/Future Work)*
Instructions for setting up the Python virtual environment, running the synthetic data generator, and starting the Streamlit dashboard will be placed here once Phase 4 is complete.

## Future Work
* Generate the full synthetic dataset.
* Implement the core Python reconciliation loop.
* Build the Streamlit approval dashboard.
* Execute the defined experiment comparing automated reconciliation against the manual baseline.
* Record the 3-minute demo video.
