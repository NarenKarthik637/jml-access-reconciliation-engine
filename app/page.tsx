import React from 'react';

export default function ProjectDocumentation() {
  const navItems = [
    { id: 'part-1', label: '1. Problem Scope' },
    { id: 'part-2', label: '2. Technical Approaches' },
    { id: 'part-3', label: '3. Architecture' },
    { id: 'part-4', label: '4. Workflow Map' },
    { id: 'part-5', label: '5. Synthetic Dataset' },
    { id: 'part-6', label: '6. Baseline Definition' },
    { id: 'part-7', label: '7. Prototype Functionality' },
    { id: 'part-8', label: '8. Failure / Edge Cases' },
    { id: 'part-9', label: '9. Experiment Design' },
    { id: 'part-10', label: '10. First 35% Plan' },
    { id: 'part-11', label: '11. Recommended Stack' },
    { id: 'part-12', label: '12. Repository Structure' },
    { id: 'part-13', label: '13. Starter README' },
  ];

  return (
    <div className="flex min-h-screen bg-[#08090B] text-slate-400 font-sans select-none">
      {/* Sidebar Navigation */}
      <aside className="fixed inset-y-0 left-0 w-64 bg-[#0D0F14] border-r border-slate-800 overflow-y-auto hidden md:block">
        <div className="p-6">
          <h1 className="text-xl font-light text-slate-100 tracking-tight leading-snug mb-2">
            PROJECT <span className="text-cyan-400 font-bold">JML-ALPHA</span>
          </h1>
          <p className="text-xs uppercase tracking-widest text-slate-500 mb-6">Phase 1: First 35% Deliverables</p>
          <nav className="space-y-1">
            {navItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="block px-3 py-2 text-sm font-medium text-slate-500 rounded-md hover:bg-slate-800/50 hover:text-cyan-400 transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-8 lg:p-12 max-w-5xl mx-auto overflow-y-auto">
        <article className="prose prose-invert prose-slate prose-headings:font-light prose-headings:text-slate-100 prose-a:text-cyan-400 max-w-none">
          <div className="mb-12 border-b border-slate-800 pb-8">
            <h1 className="text-4xl font-light text-slate-100 tracking-tight mb-4">University IAM Project: First 35%</h1>
            <p className="text-lg text-slate-400 leading-relaxed italic">
              This document establishes the foundation for the Joiner-Mover-Leaver (JML) access reconciliation engine. 
              It provides the necessary problem definition, architectural blueprints, data modeling, and experimental 
              design required before initiating the core prototype development.
            </p>
          </div>

          <section id="part-1" className="mb-16 scroll-mt-12">
            <h2>Part 1: Define the project scope</h2>
            
            <h3>1. Problem Statement</h3>
            <p>
              University Identity and Access Management (IAM) environments suffer from &quot;access creep&quot; when users change 
              organisational roles (e.g., a student becoming staff, or faculty transferring departments). While provisioning 
              new access (Joiner) is typically well-handled, access-removal requests for Movers and Leavers are frequently 
              delayed, inconsistent, or entirely overlooked. Delayed removal is dangerous because it violates the principle 
              of least privilege, leaving active accounts with excessive entitlements that could be exploited for unauthorised 
              data access or lateral movement. Manual, request-based processes are insufficient because they rely on human memory 
              and ad-hoc ticketing, which scale poorly and lack continuous verification. The proposed automated JML reconciliation 
              engine will solve this by continuously detecting orphaned or excessive access against policy rules and automatically 
              routing necessary removals for accountable approval.
            </p>

            <h3>2. Project Objectives</h3>
            <ul>
              <li><strong>Automate Discrepancy Detection:</strong> Automatically identify 100% of excessive, missing, or orphaned application entitlements by comparing actual directory data against expected HR roles.</li>
              <li><strong>Reduce Time-to-Removal:</strong> Decrease the mean time required to identify and remove excessive access after an HR role change to under 24 hours.</li>
              <li><strong>Enforce Accountable Approvals:</strong> Ensure all high-risk access removals are logged with an immutable audit history of the approver&apos;s decision.</li>
              <li><strong>Implement Configurable Policies:</strong> Externalise access logic into configurable rules rather than hard-coding decisions within application logic.</li>
              <li><strong>Empirical Baseline Comparison:</strong> Measure the automated engine&apos;s remediation speed and accuracy against a simulated manual, request-based baseline process.</li>
            </ul>

            <h3>3. Research / Evaluation Questions</h3>
            <ol>
              <li>Does automated reconciliation identify inappropriate access faster than a simple request-based baseline?</li>
              <li>Does the proposed rules-based approach effectively reduce excessive/orphaned access remaining 24 hours after a role change?</li>
              <li>What types of data failures (e.g., missing HR departments, unsynchronised directories) most frequently prevent safe automatic access removal?</li>
              <li>Does an accountable approval history improve security traceability without introducing excessive workflow bottlenecks?</li>
            </ol>
          </section>

          <section id="part-2" className="mb-16 scroll-mt-12">
            <h2>Part 2: Analyse and compare technical approaches</h2>
            
            <h3>Approach A: Rules-based Reconciliation Engine (Relational)</h3>
            <p><strong>Architecture:</strong> A modular script or service that joins HR records to Directory records using relational logic (SQL/Pandas). Externalised rules map roles/departments to expected directory groups and entitlements.</p>
            <ul>
              <li><strong>Data Flow:</strong> HR CSV + Directory CSV &rarr; Rules Engine &rarr; Expected State &rarr; Diff Tool &rarr; Approval Queue.</li>
              <li><strong>Advantages:</strong> Simple to implement, highly transparent, easy to audit (SQL/tabular logs), rules are easy to store in a standard database or config file.</li>
              <li><strong>Disadvantages:</strong> Can become complex if rules require deep hierarchical evaluation (e.g., nested groups).</li>
              <li><strong>Implementation Complexity:</strong> Low to Medium.</li>
              <li><strong>Explainability & Auditability:</strong> High. Tabular outputs are easily understood by auditors.</li>
              <li><strong>Failure Handling:</strong> Easy to implement strict validation boundaries (e.g., skip user if department is NULL).</li>
            </ul>

            <h3>Approach B: Graph/Database-driven Reconciliation (Graph DB)</h3>
            <p><strong>Architecture:</strong> A graph database (e.g., Neo4j) where Users, Roles, Groups, and Apps are nodes. Edges represent relationships (e.g., HAS_ROLE, ALLOWED_ACCESS). Reconciliation is done via graph traversal queries.</p>
            <ul>
              <li><strong>Data Flow:</strong> Data synced to Graph DB &rarr; Cypher/Traversal query detects shortest paths or missing edges &rarr; Remediation actions triggered.</li>
              <li><strong>Advantages:</strong> Extremely powerful for modeling deeply nested directory groups, indirect entitlements, and complex role hierarchies.</li>
              <li><strong>Disadvantages:</strong> Steeper learning curve, harder to setup in a constrained student project environment, &quot;black box&quot; feel to non-technical stakeholders.</li>
              <li><strong>Implementation Complexity:</strong> High.</li>
              <li><strong>Explainability & Auditability:</strong> Medium. Graph queries can be hard for auditors to interpret compared to standard rule tables.</li>
              <li><strong>Failure Handling:</strong> Requires complex graph constraints to handle missing nodes.</li>
            </ul>

            <h3>Decision Matrix</h3>
            <div className="overflow-x-auto my-6 bg-[#0D0F14] border border-slate-800 rounded-lg">
              <table className="min-w-full border-collapse text-sm text-left">
                <thead className="bg-[#16191F] text-[10px] uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-800">Criteria (Weight)</th>
                    <th className="px-4 py-3 border-b border-slate-800">Approach A (Rules-based)</th>
                    <th className="px-4 py-3 border-b border-slate-800">Approach B (Graph-based)</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-300">
                  <tr className="border-b border-slate-800/50 hover:bg-slate-800/20"><td className="px-4 py-3 font-medium text-slate-100">Explainability & Auditability (30%)</td><td className="px-4 py-3">9/10</td><td className="px-4 py-3">6/10</td></tr>
                  <tr className="border-b border-slate-800/50 hover:bg-slate-800/20"><td className="px-4 py-3 font-medium text-slate-100">Realistic Implementation for Prototype (25%)</td><td className="px-4 py-3">9/10</td><td className="px-4 py-3">5/10</td></tr>
                  <tr className="border-b border-slate-800/50 hover:bg-slate-800/20"><td className="px-4 py-3 font-medium text-slate-100">Configurable Policies (20%)</td><td className="px-4 py-3">8/10</td><td className="px-4 py-3">9/10</td></tr>
                  <tr className="border-b border-slate-800/50 hover:bg-slate-800/20"><td className="px-4 py-3 font-medium text-slate-100">Safety & Failure Handling (25%)</td><td className="px-4 py-3">8/10</td><td className="px-4 py-3">7/10</td></tr>
                  <tr className="bg-[#16191F] font-bold"><td className="px-4 py-3 text-cyan-400">Total Score</td><td className="px-4 py-3 text-cyan-400">8.55 / 10</td><td className="px-4 py-3 text-cyan-400">6.60 / 10</td></tr>
                </tbody>
              </table>
            </div>

            <h3>Selected Approach: Approach A (Rules-based Reconciliation)</h3>
            <p><strong>Justification:</strong> Approach A is selected because it prioritises explainability and a realistic implementation timeline. For a university IAM project, the ability to demonstrate an end-to-end prototype using synthetic data (CSV/SQLite) is critical. A rules-based engine cleanly externalises policies into tabular formats that stakeholders easily understand. While Graph databases excel at nested relationships, they introduce unnecessary infrastructure overhead for a minimum viable prototype, violating the project constraint to prioritise realistic implementation and clear auditability.</p>
          </section>

          <section id="part-3" className="mb-16 scroll-mt-12">
            <h2>Part 3: Proposed Architecture</h2>
            <p>The architecture follows a modular data-pipeline design.</p>
            
            <div className="bg-[#0D0F14] border border-slate-800 text-cyan-500 p-5 rounded-lg my-4 font-mono text-xs overflow-x-auto leading-relaxed">
              HR Role Change &rarr; Rule Engine (Configurable Policies) &rarr; Expected Access Calculation<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &darr;<br/>
              Directory State (Actual Access) &rarr; Reconciliation Engine &rarr; Discrepancy Detection (Orphaned/Missing)<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &darr;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;[Risk Check] &rarr; (Low Risk) &rarr; Automated Remediation Script<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &darr;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; (High Risk) &rarr; Approval Workflow &rarr; Remediation Script<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; &darr;<br/>
              &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp; Audit & Approval History
            </div>

            <ul>
              <li><strong>Synthetic HR Data Source:</strong> Emits role change events (e.g., title updates, department transfers).</li>
              <li><strong>Identity/Directory Source:</strong> The current state of the university&apos;s groups and app entitlements.</li>
              <li><strong>Configurable Access-Policy/Rule Engine:</strong> A lookup mechanism defining what access is permitted for combinations of <code>organisational_role</code> and <code>department</code>.</li>
              <li><strong>Reconciliation Engine:</strong> The core logic comparing Expected vs. Actual states.</li>
              <li><strong>Approval Workflow:</strong> Human approval is mandatory for <strong>High-Risk removals</strong> (e.g., removing a Professor&apos;s access to historical research data) or resolving conflicting data. Automation operates safely on <strong>Low-Risk provisioning/removals</strong> (e.g., removing a basic student email list upon graduation).</li>
            </ul>
          </section>

          <section id="part-4" className="mb-16 scroll-mt-12">
            <h2>Part 4: User and Workflow Map</h2>
            
            <p><strong>Supported Roles:</strong> Student, Faculty, Alumni.</p>

            <div className="overflow-x-auto my-6 bg-[#0D0F14] border border-slate-800 rounded-lg">
              <table className="min-w-full border-collapse text-sm text-left">
                <thead className="bg-[#16191F] text-[10px] uppercase text-slate-500 font-bold">
                  <tr>
                    <th className="px-4 py-3 border-b border-slate-800">Workflow Phase</th>
                    <th className="px-4 py-3 border-b border-slate-800">HR Event</th>
                    <th className="px-4 py-3 border-b border-slate-800">Reconciliation Action</th>
                    <th className="px-4 py-3 border-b border-slate-800">Approval Required?</th>
                  </tr>
                </thead>
                <tbody className="text-xs text-slate-300">
                  <tr className="border-b border-slate-800/50 hover:bg-slate-800/20"><td className="px-4 py-3 text-cyan-400 font-medium"><strong>Joiner</strong> (New Student)</td><td className="px-4 py-3">Student Enrolled</td><td className="px-4 py-3">Detect missing access. Provision LMS and Email.</td><td className="px-4 py-3"><span className="bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30">No (Automated)</span></td></tr>
                  <tr className="border-b border-slate-800/50 hover:bg-slate-800/20"><td className="px-4 py-3 text-cyan-400 font-medium"><strong>Mover</strong> (Faculty Transfer)</td><td className="px-4 py-3">Dept Change</td><td className="px-4 py-3">Detect orphaned old dept access. Flag for removal.</td><td className="px-4 py-3"><span className="bg-amber-900/30 text-amber-500 px-2 py-0.5 rounded text-[10px] border border-amber-500/30">Yes (If sensitive)</span></td></tr>
                  <tr className="border-b border-slate-800/50 hover:bg-slate-800/20"><td className="px-4 py-3 text-cyan-400 font-medium"><strong>Leaver</strong> (Graduating Student)</td><td className="px-4 py-3">Alumni Status</td><td className="px-4 py-3">Remove LMS. Retain Alumni Email.</td><td className="px-4 py-3"><span className="bg-emerald-900/30 text-emerald-400 px-2 py-0.5 rounded text-[10px] border border-emerald-500/30">No (Automated)</span></td></tr>
                </tbody>
              </table>
            </div>

            <h3>Realistic Mover Example</h3>
            <p>A faculty member moves from <em>Computer Science (CS)</em> to <em>Mathematics</em>.</p>
            <ul>
              <li><strong>Old HR Role:</strong> Faculty (CS)</li>
              <li><strong>New HR Role:</strong> Faculty (Mathematics)</li>
              <li><strong>Old Directory Groups:</strong> <code>cs_staff_group</code>, <code>general_staff</code></li>
              <li><strong>New Expected Directory Groups:</strong> <code>math_staff_group</code>, <code>general_staff</code></li>
              <li><strong>Old Application Entitlements:</strong> <code>CS_Grades_Portal</code>, <code>Server_Admin</code></li>
              <li><strong>New Expected Application Entitlements:</strong> <code>Math_Grades_Portal</code></li>
              <li><strong>Excess Access Detected:</strong> <code>cs_staff_group</code>, <code>CS_Grades_Portal</code>, <code>Server_Admin</code></li>
              <li><strong>Required Approval:</strong> <code>Server_Admin</code> requires IT approval for removal to ensure no active services fail.</li>
              <li><strong>Remediation Action:</strong> Auto-remove <code>cs_staff_group</code> and <code>CS_Grades_Portal</code>. Queue <code>Server_Admin</code> for human approval.</li>
            </ul>
          </section>

          <section id="part-5" className="mb-16 scroll-mt-12">
            <h2>Part 5: Synthetic Dataset</h2>
            <p>The synthetic data model translates the architecture into a relational schema suitable for SQLite or pandas.</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-[#16191F] border border-slate-800 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {`// users.json
[
  {
    "user_id": "U1001",
    "name": "Dr. Alan Turing",
    "organisational_role": "Faculty",
    "department": "Mathematics",
    "employment_status": "Active"
  }
]`}
              </div>
              <div className="bg-[#16191F] border border-slate-800 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {`// hr_role_changes.json
[
  {
    "change_id": "C001",
    "user_id": "U1001",
    "old_department": "Computer Science",
    "new_department": "Mathematics",
    "event_type": "Mover",
    "effective_date": "2023-09-01"
  }
]`}
              </div>
              <div className="bg-[#16191F] border border-slate-800 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {`// access_rules.json
[
  {
    "rule_id": "R001",
    "role": "Faculty",
    "department": "Mathematics",
    "allowed_entitlement": "Math_Grades_Portal",
    "approval_required": false,
    "risk_level": "Low"
  }
]`}
              </div>
              <div className="bg-[#16191F] border border-slate-800 text-slate-300 p-4 rounded-lg overflow-x-auto text-xs font-mono">
                {`// application_entitlements.json (Current Actual)
[
  {
    "entitlement_id": "E501",
    "user_id": "U1001",
    "application_name": "CS_Grades_Portal",
    "assigned_date": "2020-01-15"
  }
]`}
              </div>
            </div>
            <p className="mt-4 text-sm text-slate-500 italic">
              *The above records illustrate the Mover scenario where Dr. Turing currently holds the CS entitlement, 
              but the rules specify Mathematics. The engine will detect this as an orphaned entitlement.*
            </p>
          </section>

          <section id="part-6" className="mb-16 scroll-mt-12">
            <h2>Part 6: Baseline Definition</h2>
            <p>
              To justify the JML engine, the prototype must be compared against a simulated <strong>manual, request-based baseline process</strong>. 
              In the baseline, an HR role change occurs, generating a generic IT ticket. Access remains active until a technician manually provisions new access and remembers to remove old access.
            </p>
            
            <div className="bg-[#0D0F14] border border-slate-800 p-6 rounded-lg shadow-sm">
              <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span className="w-1 h-1 bg-cyan-400 rounded-full"></span> Baseline Metric
              </h4>
              <p className="text-xl text-slate-100 font-light mb-4">Percentage of orphaned/excessive access removed within 24 hours.</p>
              <ul className="space-y-2 text-sm text-slate-400">
                <li><strong className="text-slate-200">Target Time:</strong> 24 hours (configurable project assumption).</li>
                <li><strong className="text-slate-200">Baseline Expected Result:</strong> &lt; 40% (due to ticket backlogs and manual oversight).</li>
                <li><strong className="text-slate-200">Prototype Target Result:</strong> &gt; 95% (via automated remediation).</li>
                <li><strong className="text-slate-200">False Positive Rate:</strong> Number of valid entitlements incorrectly flagged for removal.</li>
                <li><strong className="text-slate-200">Mean Remediation Time:</strong> Time elapsed from HR event <code>effective_date</code> to entitlement deletion.</li>
              </ul>
            </div>
          </section>

          <section id="part-7" className="mb-16 scroll-mt-12">
            <h2>Part 7: Prototype Functionality (First Working Version)</h2>
            <p>The minimum viable prototype must support the following workflow:</p>
            <ol className="list-decimal pl-5 space-y-1 mb-4 text-sm">
              <li>Load JSON/CSV HR role changes, groups, entitlements, and rules.</li>
              <li>Calculate expected access.</li>
              <li>Compare Expected vs. Actual access.</li>
              <li>Detect missing, excessive, and orphaned access.</li>
              <li>Generate remediation recommendations (Add/Remove).</li>
              <li>Queue high-risk changes for approval.</li>
              <li>Record decisions to the approval history log.</li>
              <li>Simulate remediation (update the synthetic actual dataset).</li>
            </ol>

            <div className="bg-[#16191F] border border-slate-800 text-slate-300 p-5 rounded-lg overflow-x-auto text-xs font-mono my-6">
              {`def reconcile_access(user_id):
    user = hr_db.get_user(user_id)
    expected = rule_engine.evaluate(user.role, user.department)
    actual = dir_db.get_entitlements(user_id)
    
    discrepancies = compare(expected, actual)
    
    for disc in discrepancies:
        if disc.type == 'EXCESSIVE':
            if disc.risk_level == 'HIGH':
                queue.add_for_approval(disc)
            else:
                remediate_access(disc, action='REMOVE')
                audit.log('Auto-removed low risk access', disc)`}
            </div>
          </section>

          <section id="part-8" className="mb-16 scroll-mt-12">
            <h2>Part 8: Failure & Edge Cases</h2>
            <p>The prototype must safely handle realistic university data issues:</p>
            <div className="space-y-4">
              <div className="bg-[#0D0F14] border border-slate-800 border-l-4 border-l-amber-500 p-4 rounded-r-lg">
                <p className="font-semibold text-sm text-slate-200">1. HR record has a missing/invalid department</p>
                <p className="text-sm text-slate-400 mt-1"><strong className="text-amber-500/80 font-mono text-[10px] uppercase">Expected:</strong> Rule engine fails to find a match. <br/><strong className="text-cyan-400/80 font-mono text-[10px] uppercase">Behaviour:</strong> Halt automation for this user. Route to manual review queue. <br/><strong className="text-slate-500 font-mono text-[10px] uppercase">Audit:</strong> &quot;Error: Unmapped HR department.&quot;</p>
              </div>
              <div className="bg-[#0D0F14] border border-slate-800 border-l-4 border-l-amber-500 p-4 rounded-r-lg">
                <p className="font-semibold text-sm text-slate-200">2. HR role change exists but Directory update is delayed</p>
                <p className="text-sm text-slate-400 mt-1"><strong className="text-amber-500/80 font-mono text-[10px] uppercase">Expected:</strong> Directory user object not found. <br/><strong className="text-cyan-400/80 font-mono text-[10px] uppercase">Behaviour:</strong> Retry queue. Automation waits until directory syncs. <br/><strong className="text-slate-500 font-mono text-[10px] uppercase">Audit:</strong> &quot;Pending: Directory object absent.&quot;</p>
              </div>
              <div className="bg-[#0D0F14] border border-slate-800 border-l-4 border-l-red-500 p-4 rounded-r-lg">
                <p className="font-semibold text-sm text-slate-200">3. Removal approval is explicitly rejected by manager</p>
                <p className="text-sm text-slate-400 mt-1"><strong className="text-amber-500/80 font-mono text-[10px] uppercase">Expected:</strong> Workflow receives &apos;REJECT&apos;. <br/><strong className="text-cyan-400/80 font-mono text-[10px] uppercase">Behaviour:</strong> Automation aborts removal. The user enters an &apos;exception&apos; state. <br/><strong className="text-slate-500 font-mono text-[10px] uppercase">Audit:</strong> &quot;Removal Rejected by Manager ID: Justification logged.&quot;</p>
              </div>
              <div className="bg-[#0D0F14] border border-slate-800 border-l-4 border-l-red-500 p-4 rounded-r-lg">
                <p className="font-semibold text-sm text-slate-200">4. Application entitlement exists without a valid user (Ghost Account)</p>
                <p className="text-sm text-slate-400 mt-1"><strong className="text-amber-500/80 font-mono text-[10px] uppercase">Expected:</strong> Reverse lookup fails. <br/><strong className="text-cyan-400/80 font-mono text-[10px] uppercase">Behaviour:</strong> Flag as high-risk orphaned account. Route to Security Admin. <br/><strong className="text-slate-500 font-mono text-[10px] uppercase">Audit:</strong> &quot;Warning: Unlinked identity detected.&quot;</p>
              </div>
              <div className="bg-[#0D0F14] border border-slate-800 border-l-4 border-l-cyan-500 p-4 rounded-r-lg">
                <p className="font-semibold text-sm text-slate-200">5. Multiple simultaneous role changes (e.g., Student + Part-Time Staff)</p>
                <p className="text-sm text-slate-400 mt-1"><strong className="text-amber-500/80 font-mono text-[10px] uppercase">Expected:</strong> Rule engine must merge rule sets. <br/><strong className="text-cyan-400/80 font-mono text-[10px] uppercase">Behaviour:</strong> Additive permissions applied. Removal only triggers if entitlement is absent from ALL valid roles.</p>
              </div>
            </div>
          </section>

          <section id="part-9" className="mb-16 scroll-mt-12">
            <h2>Part 9: Experiment Design</h2>
            
            <p>The final experiment compares <strong>Manual/Request-driven reconciliation (Baseline)</strong> against <strong>Automated Rules-based reconciliation (Prototype)</strong>.</p>
            
            <ul className="list-disc pl-5 space-y-1 text-sm mb-4">
              <li><strong>Independent Variable:</strong> The reconciliation method used (Manual vs. Automated Prototype).</li>
              <li><strong>Dependent Variables:</strong> Time to remediation, False positive rate, Audit completeness.</li>
              <li><strong>Controlled Conditions:</strong> Both methods receive the exact same synthetic HR dataset (e.g., 500 records containing 50 Movers with excessive access).</li>
            </ul>

            <div className="bg-[#0D0F14] p-5 rounded-lg my-6 font-mono text-xs overflow-x-auto text-center border border-slate-800 text-cyan-400">
              Removal-within-target rate =<br/>
              <span className="text-slate-300">(Number of inappropriate access items removed within 24h / Total inappropriate access items) × 100</span>
            </div>

            <p>
              <strong>Justifying Adoption:</strong> The experiment will prove success if the prototype achieves a Removal-within-target rate 
              of &gt;90%, while maintaining a False Positive rate of &lt;5% and 100% audit compliance for high-risk removals.
            </p>
          </section>

          <section id="part-10" className="mb-16 scroll-mt-12">
            <h2>Part 10: First 35% Implementation Plan</h2>
            <div className="flex flex-col md:flex-row gap-6 mb-4">
              <div className="flex-1 bg-[#16191F] border border-cyan-500/30 p-5 rounded-lg shadow-[0_0_15px_rgba(34,211,238,0.05)]">
                <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-widest mb-4">Phase 1 & 2 (Current - First 35%)</h4>
                <ul className="text-sm text-slate-300 space-y-2">
                  <li className="flex items-center gap-2"><span className="text-cyan-400 text-lg">☑</span> Problem statement & Objectives</li>
                  <li className="flex items-center gap-2"><span className="text-cyan-400 text-lg">☑</span> User & workflow map</li>
                  <li className="flex items-center gap-2"><span className="text-cyan-400 text-lg">☑</span> Technical approach comparison</li>
                  <li className="flex items-center gap-2"><span className="text-cyan-400 text-lg">☑</span> Proposed architecture</li>
                  <li className="flex items-center gap-2"><span className="text-cyan-400 text-lg">☑</span> Synthetic data schema definition</li>
                  <li className="flex items-center gap-2"><span className="text-cyan-400 text-lg">☑</span> Baseline & Experiment design</li>
                </ul>
              </div>
              <div className="flex-1 bg-[#0D0F14] border border-slate-800 p-5 rounded-lg opacity-70">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-4">Phase 3, 4, 5 (Future Work)</h4>
                <ul className="text-sm text-slate-400 space-y-2">
                  <li className="flex items-center gap-2"><span className="text-slate-600 text-lg">☐</span> Generate 500-record JSON dataset</li>
                  <li className="flex items-center gap-2"><span className="text-slate-600 text-lg">☐</span> Build Python Rules Engine</li>
                  <li className="flex items-center gap-2"><span className="text-slate-600 text-lg">☐</span> Develop Streamlit UI Dashboard</li>
                  <li className="flex items-center gap-2"><span className="text-slate-600 text-lg">☐</span> Run Baseline vs Prototype tests</li>
                  <li className="flex items-center gap-2"><span className="text-slate-600 text-lg">☐</span> Record Demo & Write Evaluation</li>
                </ul>
              </div>
            </div>
          </section>

          <section id="part-11" className="mb-16 scroll-mt-12">
            <h2>Part 11: Recommended Implementation Stack</h2>
            <p>This stack is highly suitable for a university project, avoiding unnecessary cloud complexity while providing robust data handling.</p>
            <ul className="list-disc pl-5 space-y-2">
              <li><strong>Python:</strong> The standard language for data orchestration, easy to write and read.</li>
              <li><strong>pandas:</strong> Essential for efficiently merging and comparing &quot;Expected&quot; vs &quot;Actual&quot; tabular datasets (acting as our diff engine).</li>
              <li><strong>SQLite:</strong> A zero-config, serverless relational database. Perfect for simulating the university directory and storing immutable audit logs locally for demonstration.</li>
              <li><strong>Pydantic:</strong> Validates incoming synthetic JSON/CSV files ensuring strict data typing (e.g., catching the missing department edge case).</li>
              <li><strong>FastAPI / Streamlit:</strong> Streamlit allows a student to build a working, interactive &quot;Approval Queue Dashboard&quot; in hours using pure Python, without needing a full front-end JS framework.</li>
            </ul>
          </section>

          <section id="part-12" className="mb-16 scroll-mt-12">
            <h2>Part 12: Repository Structure</h2>
            <div className="bg-[#16191F] border border-slate-800 text-slate-300 p-5 rounded-lg overflow-x-auto text-sm font-mono my-6 leading-relaxed">
              {`project/
├── README.md           # Project overview and run instructions
├── data/               # Synthetic datasets (HR, Directory, Rules)
│   ├── baseline/       # Data representing the manual state
│   └── prototype/      # Data representing the automated state
├── src/                # Core application code
│   ├── models/         # Pydantic schemas (Users, Entitlements)
│   ├── engine/         # Reconciliation logic (Expected vs Actual)
│   └── dashboard/      # Streamlit UI for approvals
├── tests/              # Edge case tests (Missing HR, Rejections)
├── config/             # Access rules and environment variables
├── docs/               # Architecture diagrams and proposals
├── reports/            # Evaluation metrics and final report
└── demo/               # 3-minute video and screenshots`}
            </div>
          </section>
          
          <section id="part-13" className="mb-16 scroll-mt-12">
            <h2>Part 13: Starter README</h2>
            <p>The <code>README.md</code> file has been automatically generated in the root of the project repository mirroring the layout in Part 12.</p>
          </section>
        </article>
      </main>
    </div>
  );
}
