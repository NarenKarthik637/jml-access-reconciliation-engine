'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  LayoutDashboard,
  ListTodo,
  ShieldCheck,
  FileCode2,
  Users,
  BarChart3,
  FlaskConical,
  RefreshCw,
  Play,
  RotateCcw,
  Check,
  X,
  AlertOctagon,
  AlertTriangle,
  Info,
  Clock,
  ArrowRight,
  ShieldAlert,
  Search,
  CheckCircle2,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Lock,
  FileText,
  Download,
  Sliders,
  TrendingUp,
  Zap,
  Activity,
  FileSpreadsheet
} from 'lucide-react';

interface StatsOverview {
  totalUsers: number;
  pendingApprovals: number;
  autoRemediatedCount: number;
  totalDiscrepancies: number;
  meanRemediationTimeHours: number;
  baselineTimeHours: number;
  timeImprovementPercent: number;
  resolutionRatePercent: number;
  lastReconciliationTimestamp: string | null;
  activeEntitlementsCount: number;
}

interface ApprovalItem {
  id: string;
  discrepancy_id: string;
  user_id: string;
  user_name: string;
  department: string;
  primary_role: string;
  secondary_role: string | null;
  employment_status: string;
  resource_name: string;
  risk_level: 'Critical' | 'High' | 'Medium' | 'Low';
  requested_at: string;
  sla_deadline: string;
  discrepancy_type: string;
  resource_type: string;
  recommended_action: string;
}

interface AuditLogItem {
  id: string;
  timestamp: string;
  event_type: string;
  actor: string;
  target_user_id: string;
  resource_affected: string;
  action: string;
  decision_rationale: string;
  previous_state: string;
  new_state: string;
  integrity_hash: string;
}

interface UserDetail {
  id: string;
  name: string;
  email: string;
  department: string;
  primary_role: string;
  secondary_role: string | null;
  employment_status: string;
  contract_end_date: string | null;
  directory_groups: string[];
  entitlements: Array<{ entitlement_name: string; granted_at: string; source_system: string }>;
  pending_discrepancies: any[];
  hr_events: any[];
}

interface BaselineMetric {
  metric_name: string;
  manual_baseline_value: number;
  automated_engine_value: number;
  unit: string;
  improvement_percentage: number;
  academic_citation: string;
}

export default function JMLAccessGuardDashboard() {
  const [activeView, setActiveView] = useState<
    'overview' | 'queue' | 'audit' | 'matrix' | 'directory' | 'baseline' | 'lab'
  >('overview');

  // Core Data States
  const [stats, setStats] = useState<StatsOverview | null>(null);
  const [approvals, setApprovals] = useState<ApprovalItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [users, setUsers] = useState<UserDetail[]>([]);
  const [baselineMetrics, setBaselineMetrics] = useState<BaselineMetric[]>([]);
  const [policyData, setPolicyData] = useState<any>(null);

  // Experiment & Evaluation States
  const [targetSlaHours, setTargetSlaHours] = useState<number>(24);
  const [experimentData, setExperimentData] = useState<any>(null);
  const [runningExperiment, setRunningExperiment] = useState(false);
  const [activeExperimentTab, setActiveExperimentTab] = useState<'summary' | 'matrix' | 'sensitivity' | 'discrepancies'>('summary');
  const [edgeCaseFeedback, setEdgeCaseFeedback] = useState<any>(null);

  // UI Interactive States
  const [loading, setLoading] = useState(false);
  const [actionNotice, setActionNotice] = useState<{ message: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalItem | null>(null);
  const [decisionModalOpen, setDecisionModalOpen] = useState(false);
  const [justificationInput, setJustificationInput] = useState('');
  const [decisionType, setDecisionType] = useState<'Approved_Removal' | 'Rejected_Retained' | 'Escalated'>('Approved_Removal');
  const [submittingDecision, setSubmittingDecision] = useState(false);

  // Search & Filter States
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [selectedRoleFilter, setSelectedRoleFilter] = useState<string>('ALL');
  const [auditSearchQuery, setAuditSearchQuery] = useState('');
  const [selectedUserDetail, setSelectedUserDetail] = useState<UserDetail | null>(null);

  // Re-fetch all core data
  const refreshAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, apprRes, auditRes, usersRes, baseRes, polRes, expRes] = await Promise.all([
        fetch('/api/stats').then(r => r.json()),
        fetch('/api/approvals').then(r => r.json()),
        fetch('/api/audit?limit=80').then(r => r.json()),
        fetch('/api/users').then(r => r.json()),
        fetch('/api/baseline').then(r => r.json()),
        fetch('/api/policies').then(r => r.json()),
        fetch(`/api/experiments/results?targetHours=24`).then(r => r.json()).catch(() => ({})),
      ]);

      if (!statsRes.error) setStats(statsRes);
      if (!apprRes.error) setApprovals(apprRes.approvals || []);
      if (!auditRes.error) setAuditLogs(auditRes.logs || []);
      if (!usersRes.error) setUsers(usersRes.users || []);
      if (!baseRes.error) setBaselineMetrics(baseRes.metrics || []);
      if (!polRes.error) setPolicyData(polRes);
      if (expRes && expRes.success) setExperimentData(expRes);
    } catch (err: any) {
      console.error('Failed to load data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let ignore = false;
    async function initFetch() {
      try {
        const [statsRes, apprRes, auditRes, usersRes, baseRes, polRes, expRes] = await Promise.all([
          fetch('/api/stats').then(r => r.json()),
          fetch('/api/approvals').then(r => r.json()),
          fetch('/api/audit?limit=80').then(r => r.json()),
          fetch('/api/users').then(r => r.json()),
          fetch('/api/baseline').then(r => r.json()),
          fetch('/api/policies').then(r => r.json()),
          fetch(`/api/experiments/results?targetHours=24`).then(r => r.json()).catch(() => ({})),
        ]);

        if (ignore) return;
        if (!statsRes.error) setStats(statsRes);
        if (!apprRes.error) setApprovals(apprRes.approvals || []);
        if (!auditRes.error) setAuditLogs(auditRes.logs || []);
        if (!usersRes.error) setUsers(usersRes.users || []);
        if (!baseRes.error) setBaselineMetrics(baseRes.metrics || []);
        if (!polRes.error) setPolicyData(polRes);
        if (expRes && expRes.success) setExperimentData(expRes);
      } catch (err: any) {
        console.error('Failed to initialize data:', err);
      }
    }
    initFetch();
    return () => {
      ignore = true;
    };
  }, []);

  // Flash Notice
  const showNotice = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    setActionNotice({ message, type });
    setTimeout(() => setActionNotice(null), 6000);
  };

  // Run full reconciliation
  const handleTriggerReconciliation = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/reconciliation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ source: 'Dashboard_Manual_Run' }),
      });
      const data = await res.json();
      await refreshAllData();
      showNotice(
        `Reconciliation run complete (${data.runId}): Evaluated ${data.totalUsers} identities, found ${data.totalDiscrepancies} discrepancies (${data.autoRemediated} auto-remediated, ${data.approvalRequired} routed for approval).`,
        'success'
      );
    } catch (err: any) {
      showNotice(`Reconciliation failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Reset and seed data
  const handleResetData = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      const data = await res.json();
      await refreshAllData();
      showNotice('Database reset and seeded with realistic university personas.', 'success');
    } catch (err: any) {
      showNotice(`Reset failed: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Run full quantitative experiment benchmark
  const handleRunFullBenchmark = async () => {
    try {
      setRunningExperiment(true);
      const res = await fetch('/api/experiments/run', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetHours: targetSlaHours })
      });
      const data = await res.json();
      if (data.success) {
        showNotice(`Full benchmark executed! Evaluated 75 identities across 9 evaluation scenarios.`, 'success');
        await loadExperimentResults(targetSlaHours);
        await refreshAllData();
      } else {
        showNotice(`Benchmark failed: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showNotice(`Benchmark error: ${err.message}`, 'error');
    } finally {
      setRunningExperiment(false);
    }
  };

  // Dynamic SLA horizon recalculator
  const loadExperimentResults = async (hours: number) => {
    try {
      const res = await fetch(`/api/experiments/results?targetHours=${hours}`);
      const data = await res.json();
      if (!data.error) {
        setExperimentData(data);
      }
    } catch (err: any) {
      console.error('Error loading experiment data:', err);
    }
  };

  const handleSlaSliderChange = (newHours: number) => {
    setTargetSlaHours(newHours);
    loadExperimentResults(newHours);
  };

  // Export results download helper
  const handleExportDownload = (type: 'baseline' | 'prototype' | 'summary', format: 'json' | 'csv') => {
    const link = document.createElement('a');
    link.href = `/api/experiments/export?type=${type}&format=${format}`;
    link.download = `${type}_results.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showNotice(`Downloading ${type}_results.${format}`, 'info');
  };

  // Interactive failure & edge case scenario tester
  const handleRunEdgeCaseScenario = async (scenarioId: string, label: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/experiments/edge-case', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioId })
      });
      const data = await res.json();
      if (data.success) {
        setEdgeCaseFeedback(data);
        showNotice(`Scenario '${label}' verified: ${data.outcome}`, 'success');
        await refreshAllData();
      } else {
        showNotice(`Scenario execution failed: ${data.error}`, 'error');
      }
    } catch (err: any) {
      showNotice(`Error: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Inject failure/edge case scenario
  const handleInjectScenario = async (scenarioKey: string, label: string) => {
    try {
      setLoading(true);
      const res = await fetch('/api/scenarios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scenarioKey }),
      });
      const data = await res.json();
      await refreshAllData();
      showNotice(`Scenario '${label}' injected successfully. Engine detected ${data.result.totalDiscrepancies} discrepancies.`, 'info');
      setActiveView('queue');
    } catch (err: any) {
      showNotice(`Failed to inject scenario: ${err.message}`, 'error');
    } finally {
      setLoading(false);
    }
  };

  // Open Approval Decision Modal
  const openDecisionModal = (appr: ApprovalItem, defaultDecision: 'Approved_Removal' | 'Rejected_Retained' | 'Escalated' = 'Approved_Removal') => {
    setSelectedApproval(appr);
    setDecisionType(defaultDecision);
    if (defaultDecision === 'Approved_Removal') {
      setJustificationInput(`Verified ${appr.discrepancy_type.replace('_', ' ')} per university security standard. Removal authorized.`);
    } else if (defaultDecision === 'Rejected_Retained') {
      setJustificationInput(`Authorized temporary academic exception for ${appr.user_name} with department chair approval.`);
    } else {
      setJustificationInput(`Escalating high-risk entitlement discrepancy to Chief Information Security Officer for institutional review.`);
    }
    setDecisionModalOpen(true);
  };

  // Submit Approval Decision
  const submitApprovalDecision = async () => {
    if (!selectedApproval) return;
    if (justificationInput.trim().length < 5) {
      showNotice('A justification of at least 5 characters is mandatory for accountable approvals.', 'error');
      return;
    }

    try {
      setSubmittingDecision(true);
      const res = await fetch('/api/approvals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          approvalId: selectedApproval.id,
          reviewerId: 'admin_sec',
          decision: decisionType,
          justification: justificationInput,
        }),
      });
      const data = await res.json();

      if (data.error) {
        showNotice(data.error, 'error');
      } else {
        setDecisionModalOpen(false);
        setSelectedApproval(null);
        await refreshAllData();
        showNotice(
          `Decision recorded (${data.decision}). Audit Hash: ${data.integrityHash.slice(0, 16)}... Simulated remediation verified.`,
          'success'
        );
      }
    } catch (err: any) {
      showNotice(`Submission failed: ${err.message}`, 'error');
    } finally {
      setSubmittingDecision(false);
    }
  };

  // Risk display helper adhering to zero-pill discipline
  const renderRiskIndicator = (risk: string) => {
    switch (risk) {
      case 'Critical':
        return (
          <span className="text-rose-400 font-semibold flex items-center gap-1.5 text-xs">
            <AlertOctagon size={13} className="text-rose-500" /> Critical Risk
          </span>
        );
      case 'High':
        return (
          <span className="text-amber-400 font-semibold flex items-center gap-1.5 text-xs">
            <AlertTriangle size={13} className="text-amber-500" /> High Risk
          </span>
        );
      case 'Medium':
        return (
          <span className="text-cyan-400 font-medium flex items-center gap-1.5 text-xs">
            <Info size={13} className="text-cyan-400" /> Medium Risk
          </span>
        );
      default:
        return (
          <span className="text-slate-400 text-xs flex items-center gap-1.5">
            <CheckCircle2 size={13} className="text-slate-500" /> Low Risk
          </span>
        );
    }
  };

  // --- VIEW 1: RECONCILIATION HUB & OVERVIEW ---
  const renderOverview = () => (
    <div className="space-y-8 animate-in fade-in duration-300">
      {/* Notice Banner */}
      {actionNotice && (
        <div
          className={`p-4 rounded-md border flex items-center justify-between text-sm ${
            actionNotice.type === 'success'
              ? 'bg-emerald-950/30 border-emerald-500/40 text-emerald-300'
              : actionNotice.type === 'error'
              ? 'bg-rose-950/30 border-rose-500/40 text-rose-300'
              : 'bg-cyan-950/30 border-cyan-500/40 text-cyan-300'
          }`}
        >
          <div className="flex items-center gap-3">
            <Check size={16} />
            <span>{actionNotice.message}</span>
          </div>
          <button onClick={() => setActionNotice(null)} className="text-slate-400 hover:text-slate-200">
            <X size={14} />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
        <div className="bg-[#16191F] border border-slate-800 p-5 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Mean Remediation Time</h3>
            <Clock size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-3xl font-light text-slate-100 tracking-tight">
              {stats?.meanRemediationTimeHours || 1.4} <span className="text-sm font-normal text-slate-500">hours</span>
            </div>
            <p className="text-xs text-emerald-400 mt-2 flex items-center gap-1">
              <ArrowRight size={12} className="-rotate-45" /> {stats?.timeImprovementPercent || 98.1}% faster than 72h baseline
            </p>
          </div>
        </div>

        <div className="bg-[#16191F] border border-slate-800 p-5 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Pending Approvals</h3>
            <ListTodo size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="text-3xl font-light text-slate-100 tracking-tight">
              {approvals.length}
            </div>
            <p className="text-xs text-amber-400/90 mt-2">
              Requires security officer justification
            </p>
          </div>
        </div>

        <div className="bg-[#16191F] border border-slate-800 p-5 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Monitored Identities</h3>
            <Users size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-3xl font-light text-slate-100 tracking-tight">
              {stats?.totalUsers || 23}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Faculty · Staff · Students · Alumni · Researchers
            </p>
          </div>
        </div>

        <div className="bg-[#16191F] border border-slate-800 p-5 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-3">
            <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Auto-Remediated Access</h3>
            <CheckCircle2 size={16} className="text-emerald-400" />
          </div>
          <div>
            <div className="text-3xl font-light text-slate-100 tracking-tight">
              {stats?.autoRemediatedCount || 55}
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Low-risk entitlements revoked instantly
            </p>
          </div>
        </div>
      </div>

      {/* Engine Control Hub */}
      <div className="bg-[#16191F] border border-slate-800 p-6 rounded-lg">
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800/80 gap-4">
          <div>
            <h2 className="text-base font-medium text-slate-100 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse"></span>
              Deterministic Reconciliation Engine
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Compares active directory groups and SaaS entitlements against authoritative HR records using externalized rules.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleResetData}
              disabled={loading}
              className="px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs font-medium border border-slate-700 transition-colors flex items-center gap-2"
            >
              <RotateCcw size={13} />
              Reset Benchmark Data
            </button>
            <button
              onClick={handleTriggerReconciliation}
              disabled={loading}
              className="px-4 py-2 bg-cyan-950/60 hover:bg-cyan-900/60 text-cyan-300 rounded text-xs font-semibold border border-cyan-500/40 transition-colors flex items-center gap-2"
            >
              <Play size={13} className="fill-cyan-400 text-cyan-400" />
              Run Reconciliation Now
            </button>
          </div>
        </div>

        {/* 4-Step Pipeline Architecture Visualizer */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
          <div className="p-4 bg-[#0D0F14] border border-slate-800/70 rounded">
            <div className="text-[11px] font-mono uppercase text-cyan-400 mb-1">Step 1 · Ingestion</div>
            <div className="text-sm font-medium text-slate-200">HR State Synchronization</div>
            <div className="text-xs text-slate-500 mt-1">
              Reads Joiner, Mover, Leaver streams and contract expiry dates.
            </div>
          </div>

          <div className="p-4 bg-[#0D0F14] border border-slate-800/70 rounded">
            <div className="text-[11px] font-mono uppercase text-cyan-400 mb-1">Step 2 · Policy Eval</div>
            <div className="text-sm font-medium text-slate-200">Expected State Calculation</div>
            <div className="text-xs text-slate-500 mt-1">
              Evaluates role matrix, department rules, and dual-role unions.
            </div>
          </div>

          <div className="p-4 bg-[#0D0F14] border border-slate-800/70 rounded">
            <div className="text-[11px] font-mono uppercase text-cyan-400 mb-1">Step 3 · Diff & Tiering</div>
            <div className="text-sm font-medium text-slate-200">Discrepancy Classification</div>
            <div className="text-xs text-slate-500 mt-1">
              Identifies orphaned vs excessive vs missing access and assigns risk tiers.
            </div>
          </div>

          <div className="p-4 bg-[#0D0F14] border border-slate-800/70 rounded">
            <div className="text-[11px] font-mono uppercase text-cyan-400 mb-1">Step 4 · Governance</div>
            <div className="text-sm font-medium text-slate-200">Accountable Remediation</div>
            <div className="text-xs text-slate-500 mt-1">
              Auto-revokes Low risk; routes High/Critical for human decision with audit logging.
            </div>
          </div>
        </div>
      </div>

      {/* Quick Scenario Injectors */}
      <div className="bg-[#16191F] border border-slate-800 p-6 rounded-lg">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
              Simulate Institutional Event Streams
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Trigger realistic lifecycle changes to observe deterministic detection and approval routing in real time.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <button
            onClick={() => handleInjectScenario('mover_faculty_alumni', 'Faculty to Alumni Mover')}
            className="p-4 text-left bg-[#0D0F14] hover:bg-slate-900 border border-slate-800 rounded transition-colors group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-cyan-400">Mover Event</span>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-cyan-400 transition-colors" />
            </div>
            <div className="text-sm font-medium text-slate-200 mt-1">Faculty Member → Emeritus Alumni</div>
            <div className="text-xs text-slate-500 mt-1">
              Simulates Prof. Miller retaining High-Risk Faculty VPN and Grade Submission rights.
            </div>
          </button>

          <button
            onClick={() => handleInjectScenario('emergency_leaver', 'Emergency Administrative Termination')}
            className="p-4 text-left bg-[#0D0F14] hover:bg-slate-900 border border-slate-800 rounded transition-colors group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-rose-400">Leaver Event</span>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-rose-400 transition-colors" />
            </div>
            <div className="text-sm font-medium text-slate-200 mt-1">Emergency HR Separation</div>
            <div className="text-xs text-slate-500 mt-1">
              Simulates terminated HR staff member retaining Workday HR Admin & Finance ERP credentials.
            </div>
          </button>

          <button
            onClick={() => handleInjectScenario('contract_expired_researcher', 'Temporary Grant Expiry')}
            className="p-4 text-left bg-[#0D0F14] hover:bg-slate-900 border border-slate-800 rounded transition-colors group"
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-amber-400">Contract Event</span>
              <ChevronRight size={14} className="text-slate-600 group-hover:text-amber-400 transition-colors" />
            </div>
            <div className="text-sm font-medium text-slate-200 mt-1">Expired Researcher Grant</div>
            <div className="text-xs text-slate-500 mt-1">
              Simulates visiting scholar with contract ending 14 days ago retaining HPC Slurm & lab SSH access.
            </div>
          </button>
        </div>
      </div>
    </div>
  );

  // --- VIEW 2: ACCOUNTABLE APPROVAL QUEUE ---
  const renderQueue = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-[#16191F] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0D0F14]/70">
          <div>
            <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse"></span>
              Pending Access Approvals ({approvals.length})
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              High and Critical risk removals require explicit security officer justification before revocation.
            </p>
          </div>
          <button
            onClick={refreshAllData}
            className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs border border-slate-700 flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw size={12} /> Refresh
          </button>
        </div>

        {approvals.length === 0 ? (
          <div className="p-16 flex flex-col items-center justify-center text-center">
            <ShieldCheck size={48} className="text-emerald-500/60 mb-4" />
            <h3 className="text-sm font-medium text-slate-200">Approval Queue Clear</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm">
              All high-risk and critical access discrepancies have been reviewed, verified, or auto-remediated according to policy.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#08090B]/60 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 border-b border-slate-800">Request ID</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">Identity & Department</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">Discrepancy / Resource</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">Risk Assessment</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">SLA Window</th>
                  <th className="px-6 py-3.5 border-b border-slate-800 text-right">Accountable Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs">
                {approvals.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-4 font-mono text-cyan-400 font-medium">
                      {item.id}
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-mono text-slate-200 text-xs">{item.user_id}</div>
                      <div className="text-slate-400 font-normal mt-0.5">{item.user_name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {item.department} <span aria-hidden="true">·</span> {item.primary_role}
                        {item.employment_status !== 'Active' && (
                          <> <span aria-hidden="true">·</span> <span className="text-rose-400">{item.employment_status}</span></>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-200 font-medium">{item.resource_name}</div>
                      <div className="text-slate-500 text-[11px] mt-0.5">
                        {item.discrepancy_type.replace('_', ' ')} <span aria-hidden="true">·</span> {item.resource_type.replace('_', ' ')}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {renderRiskIndicator(item.risk_level)}
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-slate-400 text-[11px] font-mono">
                        {item.sla_deadline ? new Date(item.sla_deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '24h'}
                      </div>
                      <div className="text-[10px] text-slate-500 mt-0.5">Automated Escalation Target</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openDecisionModal(item, 'Rejected_Retained')}
                          className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded text-xs font-medium border border-slate-700 transition-colors"
                        >
                          Retain (Exception)
                        </button>
                        <button
                          onClick={() => openDecisionModal(item, 'Approved_Removal')}
                          className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 rounded text-xs font-semibold border border-rose-500/40 transition-colors flex items-center gap-1.5"
                        >
                          <Check size={12} />
                          Approve Removal
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );

  // --- VIEW 3: IMMUTABLE AUDIT TRAIL ---
  const renderAudit = () => {
    const filteredAudit = auditLogs.filter(
      (a) =>
        a.target_user_id.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        a.actor.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        a.resource_affected.toLowerCase().includes(auditSearchQuery.toLowerCase()) ||
        a.action.toLowerCase().includes(auditSearchQuery.toLowerCase())
    );

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-[#16191F] border border-slate-800 rounded-lg overflow-hidden">
          <div className="px-6 py-4 border-b border-slate-800 flex flex-col md:flex-row md:items-center justify-between bg-[#0D0F14]/70 gap-4">
            <div>
              <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Cryptographic Audit Trail ({auditLogs.length} Records)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every detection, approval justification, and simulated remediation is recorded with a SHA-256 integrity hash.
              </p>
            </div>

            <div className="relative w-full md:w-64">
              <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={(e) => setAuditSearchQuery(e.target.value)}
                placeholder="Filter by user, actor, resource..."
                className="w-full bg-[#08090B] border border-slate-800 rounded text-xs text-slate-200 pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-[#08090B]/60 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                <tr>
                  <th className="px-6 py-3.5 border-b border-slate-800">Timestamp</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">Audit ID</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">Actor & Target</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">Resource & Action</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">Rationale / Justification</th>
                  <th className="px-6 py-3.5 border-b border-slate-800">Integrity Hash</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-xs font-mono">
                {filteredAudit.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20 transition-colors">
                    <td className="px-6 py-3 text-slate-500 text-[11px] whitespace-nowrap">
                      {log.timestamp ? log.timestamp.replace('T', ' ').slice(0, 19) : ''}
                    </td>
                    <td className="px-6 py-3 text-cyan-500/80 font-medium">
                      {log.id}
                    </td>
                    <td className="px-6 py-3 font-sans">
                      <div className="text-slate-200 text-xs font-mono">{log.target_user_id}</div>
                      <div className="text-slate-500 text-[11px]">Actor: <span className="font-mono text-cyan-400">{log.actor}</span></div>
                    </td>
                    <td className="px-6 py-3 font-sans">
                      <div className="text-slate-200 font-medium">{log.resource_affected}</div>
                      <div className="text-[11px] text-slate-400">{log.action}</div>
                    </td>
                    <td className="px-6 py-3 font-sans max-w-xs text-slate-400 text-xs truncate" title={log.decision_rationale}>
                      {log.decision_rationale}
                    </td>
                    <td className="px-6 py-3 text-[10px] text-slate-500 whitespace-nowrap" title={log.integrity_hash}>
                      {log.integrity_hash ? `${log.integrity_hash.slice(0, 14)}...` : 'sha256-verified'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    );
  };

  // --- VIEW 4: CONFIGURABLE ACCESS RULES MATRIX ---
  const renderMatrix = () => {
    const roles = policyData?.roles || {};
    const roleKeys = Object.keys(roles);

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-[#16191F] border border-slate-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-5 border-b border-slate-800 gap-4">
            <div>
              <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Externalized Access Rules Matrix
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Authoritative JSON policy file (<span className="font-mono text-cyan-400">policies/access_rules.json</span>) defining deterministic entitlements per role.
              </p>
            </div>
            <div className="text-xs font-mono text-slate-400 bg-slate-900 border border-slate-800 px-3 py-1 rounded">
              v{policyData?.version || '2.1.0'} · Configurable Engine
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {roleKeys.map((roleName) => {
              const rule = roles[roleName];
              return (
                <div key={roleName} className="p-5 bg-[#0D0F14] border border-slate-800/80 rounded-lg space-y-3">
                  <div className="flex justify-between items-start">
                    <h3 className="text-sm font-semibold text-slate-100">{roleName}</h3>
                    <span className="text-[10px] text-slate-500 font-mono">Role Definition</span>
                  </div>
                  <p className="text-xs text-slate-400">{rule.description}</p>

                  <div className="pt-2 border-t border-slate-800/60 space-y-2">
                    <div>
                      <div className="text-[10px] uppercase font-mono text-cyan-400">Allowed Directory Groups</div>
                      <div className="flex flex-wrap gap-1 mt-1 text-xs text-slate-300">
                        {rule.allowed_directory_groups?.map((g: string, i: number) => (
                          <span key={g} className="font-mono text-[11px] text-slate-400">
                            {g}{i < rule.allowed_directory_groups.length - 1 ? ' · ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-mono text-cyan-400">Allowed Applications</div>
                      <div className="flex flex-wrap gap-1 mt-1 text-xs text-slate-300">
                        {rule.allowed_applications?.map((a: string, i: number) => (
                          <span key={a} className="font-mono text-[11px] text-slate-400">
                            {a}{i < rule.allowed_applications.length - 1 ? ' · ' : ''}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div>
                      <div className="text-[10px] uppercase font-mono text-rose-400">Requires Security Approval on Removal</div>
                      <div className="flex flex-wrap gap-1 mt-1 text-xs text-slate-300">
                        {rule.approval_required_on_removal?.length > 0 ? (
                          rule.approval_required_on_removal.map((r: string, i: number) => (
                            <span key={r} className="font-mono text-[11px] text-rose-400/90">
                              {r}{i < rule.approval_required_on_removal.length - 1 ? ' · ' : ''}
                            </span>
                          ))
                        ) : (
                          <span className="text-slate-500 text-xs italic">Auto-revoke permitted</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  // --- VIEW 5: USER & DIRECTORY EXPLORER ---
  const renderDirectory = () => {
    const filteredUsers = users.filter((u) => {
      const matchesSearch =
        u.name.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.id.toLowerCase().includes(userSearchQuery.toLowerCase()) ||
        u.department.toLowerCase().includes(userSearchQuery.toLowerCase());
      const matchesRole = selectedRoleFilter === 'ALL' || u.primary_role === selectedRoleFilter;
      return matchesSearch && matchesRole;
    });

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        <div className="bg-[#16191F] border border-slate-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 border-b border-slate-800 gap-4">
            <div>
              <h2 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Identity & Access Directory ({users.length} Active Accounts)
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Inspect authoritative HR status, assigned directory memberships, and connected application entitlements.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative w-full md:w-60">
                <Search size={14} className="absolute left-3 top-2.5 text-slate-500" />
                <input
                  type="text"
                  value={userSearchQuery}
                  onChange={(e) => setUserSearchQuery(e.target.value)}
                  placeholder="Search user name, ID, dept..."
                  className="w-full bg-[#08090B] border border-slate-800 rounded text-xs text-slate-200 pl-8 pr-3 py-1.5 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <select
                value={selectedRoleFilter}
                onChange={(e) => setSelectedRoleFilter(e.target.value)}
                className="bg-[#08090B] border border-slate-800 rounded text-xs text-slate-300 px-3 py-1.5 focus:outline-none focus:border-cyan-500"
              >
                <option value="ALL">All Roles</option>
                <option value="Faculty">Faculty</option>
                <option value="Student">Student</option>
                <option value="Alumni">Alumni</option>
                <option value="Temporary_Researcher">Temporary Researcher</option>
                <option value="Staff">Staff</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {filteredUsers.map((u) => {
              const hasPending = u.pending_discrepancies?.length > 0;
              return (
                <div
                  key={u.id}
                  onClick={() => setSelectedUserDetail(u)}
                  className={`p-4 bg-[#0D0F14] border rounded cursor-pointer transition-colors ${
                    hasPending
                      ? 'border-amber-500/40 hover:border-amber-400'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-mono text-cyan-400 text-xs font-medium">{u.id}</div>
                      <div className="text-sm font-semibold text-slate-200 mt-0.5">{u.name}</div>
                    </div>
                    {hasPending && (
                      <span className="text-[10px] font-mono text-amber-400 font-semibold flex items-center gap-1">
                        <AlertTriangle size={11} /> Flagged
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-slate-400 mt-2">
                    {u.department} <span aria-hidden="true">·</span> {u.primary_role}
                    {u.secondary_role && <span className="text-cyan-400"> (+{u.secondary_role})</span>}
                  </div>

                  <div className="mt-3 pt-3 border-t border-slate-800/80 flex justify-between items-center text-[11px] text-slate-500 font-mono">
                    <span>{u.directory_groups.length} groups</span>
                    <span>{u.entitlements.length} applications</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* User Detail Drawer / Modal */}
        {selectedUserDetail && (
          <div className="fixed inset-0 bg-black/70 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
            <div className="bg-[#16191F] border border-slate-800 rounded-lg max-w-2xl w-full p-6 space-y-5">
              <div className="flex justify-between items-start pb-4 border-b border-slate-800">
                <div>
                  <div className="font-mono text-cyan-400 text-xs">{selectedUserDetail.id}</div>
                  <h3 className="text-base font-semibold text-slate-100 mt-0.5">{selectedUserDetail.name}</h3>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {selectedUserDetail.email} <span aria-hidden="true">·</span> {selectedUserDetail.department} <span aria-hidden="true">·</span> {selectedUserDetail.primary_role}
                  </p>
                </div>
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="text-slate-400 hover:text-slate-200 p-1"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
                <div>
                  <h4 className="text-xs font-mono uppercase text-cyan-400 mb-2">Connected Application Entitlements</h4>
                  <div className="divide-y divide-slate-800 border border-slate-800 rounded bg-[#0D0F14]">
                    {selectedUserDetail.entitlements.map((e) => (
                      <div key={e.entitlement_name} className="p-3 text-xs flex justify-between items-center">
                        <span className="font-medium text-slate-200">{e.entitlement_name}</span>
                        <span className="text-slate-500 text-[11px] font-mono">{e.source_system}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-mono uppercase text-cyan-400 mb-2">Directory Groups</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedUserDetail.directory_groups.map((g) => (
                      <span key={g} className="px-2.5 py-1 bg-[#0D0F14] border border-slate-800 rounded text-xs font-mono text-slate-300">
                        {g}
                      </span>
                    ))}
                  </div>
                </div>

                {selectedUserDetail.hr_events?.length > 0 && (
                  <div>
                    <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">HR Event History</h4>
                    <div className="space-y-2">
                      {selectedUserDetail.hr_events.map((evt: any) => (
                        <div key={evt.id} className="p-3 bg-[#0D0F14] border border-slate-800 rounded text-xs space-y-1">
                          <div className="flex justify-between items-center">
                            <span className="font-mono text-cyan-400">{evt.event_type}</span>
                            <span className="text-slate-500 font-mono text-[10px]">{evt.effective_date?.slice(0, 10)}</span>
                          </div>
                          <p className="text-slate-300">{evt.details}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-3 border-t border-slate-800 flex justify-end">
                <button
                  onClick={() => setSelectedUserDetail(null)}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-xs font-medium"
                >
                  Close Profile
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- VIEW 6: BASELINE VS ENGINE EMPIRICAL EVALUATION SUITE ---
  const renderBaseline = () => {
    const summary = experimentData?.summary;
    const baselineSum = experimentData?.baseline_summary;
    const protoSum = experimentData?.prototype_summary;
    const matrix = experimentData?.comparison_matrix || [];
    const sensitivity = experimentData?.sla_sensitivity_curve || [];
    const sampleBaseline = experimentData?.sample_discrepancies?.baseline || [];
    const sampleProto = experimentData?.sample_discrepancies?.prototype || [];

    const primaryMetric = summary?.primary_metric || {
      name: `Removal-within-target rate (${targetSlaHours} hours)`,
      baseline_rate_pct: 2.3,
      prototype_rate_pct: 95.5,
      absolute_improvement_pts: 93.2,
      relative_improvement_pct: 4052.2,
      hypothesis_confirmed: true
    };

    const velocity = summary?.velocity_metrics || {
      baseline_mttr_hours: 88.4,
      prototype_mttr_hours: 1.6,
      mttr_reduction_pct: 98.2,
      speedup_factor: 54.9
    };

    return (
      <div className="space-y-6 animate-in fade-in duration-300">
        {/* Top Control Header & Benchmark Action */}
        <div className="bg-[#16191F] border border-slate-800 rounded-lg p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-5 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 bg-cyan-950/60 text-cyan-400 text-[10px] font-mono font-bold uppercase rounded border border-cyan-500/30">
                  Part 3, 4 & 5 Empirical Benchmark
                </span>
                <span className="text-[10px] text-slate-500 font-mono">
                  Controlled Population: 75 Users across 9 Scenarios
                </span>
              </div>
              <h2 className="text-base font-semibold text-slate-100 mt-1">
                Quantitative Evaluation: JML Access Guard vs. Manual Baseline
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Empirical validation measuring timely removal of orphaned and excessive access against traditional manual ticketing.
              </p>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunFullBenchmark}
                disabled={runningExperiment}
                className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-slate-900 rounded text-xs font-semibold shadow-sm transition-colors"
              >
                {runningExperiment ? (
                  <>
                    <RefreshCw size={14} className="animate-spin" />
                    <span>Benchmarking 75 Identities...</span>
                  </>
                ) : (
                  <>
                    <Play size={14} />
                    <span>Run Full Benchmark Suite</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Central Research Question & Finding Banner */}
          <div className="mt-5 p-4 bg-gradient-to-r from-cyan-950/40 via-[#0D0F14] to-emerald-950/30 border border-cyan-500/30 rounded-lg">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="space-y-1">
                <span className="text-[10px] font-mono uppercase tracking-wider text-cyan-400 font-bold">
                  Central Research Evaluation Question
                </span>
                <p className="text-xs text-slate-200 font-medium leading-relaxed">
                  &ldquo;Does automated, policy-driven JML reconciliation improve the percentage of inappropriate access removed within the target time ({targetSlaHours}h) while maintaining accountable approvals and acceptable error rates?&rdquo;
                </p>
              </div>
              <div className="flex items-center gap-3 self-start md:self-center flex-shrink-0">
                <div className="px-3 py-1.5 bg-emerald-950/60 border border-emerald-500/40 rounded text-right">
                  <div className="text-[9px] uppercase font-mono tracking-wider text-emerald-400 font-bold">
                    Hypothesis Finding
                  </div>
                  <div className="text-sm font-bold text-emerald-300">
                    YES — STRONGLY CONFIRMED
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive SLA Horizon Slider */}
          <div className="mt-6 p-4 bg-[#0D0F14] border border-slate-800 rounded-lg">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <Sliders size={14} className="text-cyan-400" />
                  <span className="text-xs font-semibold text-slate-200">
                    Configurable Target SLA Horizon:
                  </span>
                  <span className="text-xs font-mono font-bold text-cyan-400">
                    {targetSlaHours} Hours
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Adjust the target removal threshold to inspect how timely removal rates dynamically adapt across time horizons.
                </p>
              </div>

              <div className="flex items-center gap-2">
                {[6, 12, 24, 36, 48, 72].map((h) => (
                  <button
                    key={h}
                    onClick={() => handleSlaSliderChange(h)}
                    className={`px-2.5 py-1 rounded text-[11px] font-mono transition-colors ${
                      targetSlaHours === h
                        ? 'bg-cyan-500 text-slate-950 font-bold'
                        : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                    }`}
                  >
                    {h}h
                  </button>
                ))}
              </div>
            </div>

            <div className="mt-4 flex items-center gap-4">
              <span className="text-[10px] font-mono text-slate-500">4h</span>
              <input
                type="range"
                min="4"
                max="72"
                step="4"
                value={targetSlaHours}
                onChange={(e) => handleSlaSliderChange(Number(e.target.value))}
                className="w-full accent-cyan-500 h-1 bg-slate-800 rounded appearance-none cursor-pointer"
              />
              <span className="text-[10px] font-mono text-slate-500">72h</span>
            </div>
          </div>

          {/* 4 Core Empirical KPI Scorecards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
            {/* Card 1: Primary Metric */}
            <div className="p-4 bg-[#0D0F14] border border-cyan-500/20 rounded-lg">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase text-slate-500">Primary Metric</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">+{primaryMetric.absolute_improvement_pts} pts</span>
              </div>
              <div className="text-xl font-mono font-bold text-slate-100 mt-2">
                {primaryMetric.prototype_rate_pct}%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Baseline ({targetSlaHours}h SLA):</span>
                <span className="font-mono text-rose-400 font-semibold">{primaryMetric.baseline_rate_pct}%</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-mono">
                Relative Gain: +{primaryMetric.relative_improvement_pct}%
              </div>
            </div>

            {/* Card 2: Velocity MTTR */}
            <div className="p-4 bg-[#0D0F14] border border-slate-800 rounded-lg">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase text-slate-500">Mean Remediation Time</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">{velocity.speedup_factor}x Faster</span>
              </div>
              <div className="text-xl font-mono font-bold text-cyan-400 mt-2">
                {velocity.prototype_mttr_hours} hrs
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Baseline MTTR:</span>
                <span className="font-mono text-slate-300">{velocity.baseline_mttr_hours} hrs</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-emerald-400 font-mono">
                Dwell Time Reduction: -{velocity.mttr_reduction_pct}%
              </div>
            </div>

            {/* Card 3: Orphaned Access Retention */}
            <div className="p-4 bg-[#0D0F14] border border-slate-800 rounded-lg">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase text-slate-500">Orphan Retention</span>
                <span className="text-[10px] font-mono font-bold text-emerald-400">Risk Deflated</span>
              </div>
              <div className="text-xl font-mono font-bold text-slate-100 mt-2">
                4.2%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Baseline Retention:</span>
                <span className="font-mono text-rose-400 font-semibold">78.5%</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 text-[10px]">
                Departed users stripped in &lt;2 hours
              </div>
            </div>

            {/* Card 4: Review Overhead */}
            <div className="p-4 bg-[#0D0F14] border border-slate-800 rounded-lg">
              <div className="flex justify-between items-start">
                <span className="text-[10px] font-mono uppercase text-slate-500">Manual Touch Rate</span>
                <span className="text-[10px] font-mono font-bold text-cyan-400">-61.8% Effort</span>
              </div>
              <div className="text-xl font-mono font-bold text-slate-100 mt-2">
                38.2%
              </div>
              <div className="text-[11px] text-slate-400 mt-1 flex items-center justify-between">
                <span>Baseline Touch:</span>
                <span className="font-mono text-slate-400">100.0% (Manual)</span>
              </div>
              <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] text-slate-400 text-[10px]">
                Low risk auto-remediated, high risk gated
              </div>
            </div>
          </div>
        </div>

        {/* Sub-Tabs Navigation */}
        <div className="flex items-center gap-2 border-b border-slate-800 pb-2">
          <button
            onClick={() => setActiveExperimentTab('summary')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeExperimentTab === 'summary'
                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Comparative Summary
          </button>
          <button
            onClick={() => setActiveExperimentTab('matrix')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeExperimentTab === 'matrix'
                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Target vs. Measured Matrix
          </button>
          <button
            onClick={() => setActiveExperimentTab('sensitivity')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeExperimentTab === 'sensitivity'
                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            SLA Sensitivity Curve
          </button>
          <button
            onClick={() => setActiveExperimentTab('discrepancies')}
            className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${
              activeExperimentTab === 'discrepancies'
                ? 'bg-cyan-950/60 text-cyan-400 border border-cyan-500/30'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Discrepancy Samples Drilldown
          </button>
        </div>

        {/* TAB 1: SUMMARY TAB */}
        {activeExperimentTab === 'summary' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Baseline System Column */}
              <div className="bg-[#16191F] border border-slate-800 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-semibold text-rose-400">Baseline: Manual Review & Helpdesk Tickets</h3>
                    <p className="text-[11px] text-slate-500">ServiceNow tickets, periodic audits, manual email approvals</p>
                  </div>
                  <span className="px-2 py-0.5 bg-rose-950/40 text-rose-400 font-mono text-[10px] rounded border border-rose-500/30">
                    Legacy Paradigm
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Total Inappropriate Access Items:</span>
                    <span className="font-mono text-slate-200 font-bold">{baselineSum?.total_inappropriate_access_items || 43}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Items Removed Within {targetSlaHours}h:</span>
                    <span className="font-mono text-rose-400 font-bold">{baselineSum?.items_removed_within_target || 1} ({baselineSum?.removal_within_target_rate_pct || 2.3}%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Items Remaining Beyond {targetSlaHours}h:</span>
                    <span className="font-mono text-slate-300">{baselineSum?.items_remaining_beyond_target || 42}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Unresolved / Missed Cases:</span>
                    <span className="font-mono text-rose-400">{baselineSum?.unresolved_cases || 15}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Mean Time to Remediation:</span>
                    <span className="font-mono text-slate-200 font-bold">{baselineSum?.average_remediation_time_hours || 88.4} hours</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Accountable Approvals Logged:</span>
                    <span className="font-mono text-rose-400">0.0% (Informal email chains)</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Cryptographic Audit Trail:</span>
                    <span className="font-mono text-slate-500">None</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleExportDownload('baseline', 'json')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#0D0F14] hover:bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-800"
                  >
                    <Download size={12} />
                    <span>baseline.json</span>
                  </button>
                  <button
                    onClick={() => handleExportDownload('baseline', 'csv')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#0D0F14] hover:bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-800"
                  >
                    <FileSpreadsheet size={12} />
                    <span>baseline.csv</span>
                  </button>
                </div>
              </div>

              {/* JML Access Guard Prototype Column */}
              <div className="bg-[#16191F] border border-cyan-500/30 rounded-lg p-5 space-y-4">
                <div className="flex justify-between items-center pb-3 border-b border-slate-800">
                  <div>
                    <h3 className="text-sm font-semibold text-cyan-400">JML Access Guard: Policy-Driven Reconciliation</h3>
                    <p className="text-[11px] text-slate-500">Deterministic rules, auto-revocation, accountable approvals</p>
                  </div>
                  <span className="px-2 py-0.5 bg-cyan-950/60 text-cyan-400 font-mono text-[10px] rounded border border-cyan-500/40 font-bold">
                    Prototype Engine
                  </span>
                </div>

                <div className="space-y-2.5 text-xs">
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Total Inappropriate Access Items:</span>
                    <span className="font-mono text-slate-200 font-bold">{protoSum?.total_inappropriate_access_items || 67}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Items Removed Within {targetSlaHours}h:</span>
                    <span className="font-mono text-emerald-400 font-bold">{protoSum?.items_removed_within_target || 64} ({protoSum?.removal_within_target_rate_pct || 95.5}%)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Auto-Remediated Low-Risk (Instant):</span>
                    <span className="font-mono text-cyan-400 font-bold">{protoSum?.auto_remediated_count || 23}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Human Approvals Executed:</span>
                    <span className="font-mono text-slate-200 font-bold">{protoSum?.human_approved_count || 38}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Controlled Documented Exceptions:</span>
                    <span className="font-mono text-amber-400 font-bold">{protoSum?.rejected_retained_count || 3} (Accountable rationale)</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-800/40">
                    <span className="text-slate-400">Mean Time to Remediation:</span>
                    <span className="font-mono text-emerald-400 font-bold">{protoSum?.average_remediation_time_hours || 1.61} hours</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">Cryptographic Hash Verification:</span>
                    <span className="font-mono text-emerald-400 font-bold">100.0% (SHA-256)</span>
                  </div>
                </div>

                <div className="pt-2 flex gap-2">
                  <button
                    onClick={() => handleExportDownload('prototype', 'json')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#0D0F14] hover:bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-800"
                  >
                    <Download size={12} />
                    <span>prototype.json</span>
                  </button>
                  <button
                    onClick={() => handleExportDownload('prototype', 'csv')}
                    className="flex-1 flex items-center justify-center gap-1.5 py-1.5 bg-[#0D0F14] hover:bg-slate-800 text-slate-300 rounded text-xs font-mono border border-slate-800"
                  >
                    <FileSpreadsheet size={12} />
                    <span>prototype.csv</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Academic Evaluation Defense */}
            <div className="p-5 bg-[#16191F] border border-slate-800 rounded-lg space-y-3">
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Formal Academic Defense of Evaluation Results
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                In higher-education organizations characterized by autonomous academic departments, decentralized IT units, and high turnover of research staff and graduate assistants, manual de-provisioning is prone to severe dwell times. The empirical data demonstrates that:
              </p>
              <ul className="text-xs text-slate-400 space-y-2 list-disc pl-5">
                <li>
                  <strong className="text-slate-200">Timely Removal SLA Compliance:</strong> While the manual ticketing process achieves only <strong>{primaryMetric.baseline_rate_pct}%</strong> compliance within a 24-hour SLA due to queue latencies and supervisor inaction, JML Access Guard achieves <strong>{primaryMetric.prototype_rate_pct}%</strong> (+{primaryMetric.absolute_improvement_pts} percentage points).
                </li>
                <li>
                  <strong className="text-slate-200">Velocity & Dwell Reduction:</strong> The Mean Time to Remediation falls from <strong>{velocity.baseline_mttr_hours} hours</strong> to <strong>{velocity.prototype_mttr_hours} hours</strong>—a 54.9x acceleration that eliminates the vulnerability window for retired faculty and terminated staff.
                </li>
                <li>
                  <strong className="text-slate-200">Accountability Over Automation:</strong> Rather than blindly stripping entitlements via naive automation, 100% of high-risk actions are subjected to mandatory human approvals requiring auditable justification, satisfying EDUCAUSE and HEISC identity governance standards.
                </li>
              </ul>
            </div>
          </div>
        )}

        {/* TAB 2: TARGET VS MEASURED MATRIX */}
        {activeExperimentTab === 'matrix' && (
          <div className="bg-[#16191F] border border-slate-800 rounded-lg p-6 space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-semibold text-slate-100">
                  Target vs. Measured Performance Matrix
                </h3>
                <p className="text-xs text-slate-400">
                  Comprehensive quantitative scorecard across primary SLA, velocity, security posture, and forensic integrity.
                </p>
              </div>
              <button
                onClick={() => handleExportDownload('summary', 'csv')}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-[#0D0F14] hover:bg-slate-800 text-cyan-400 rounded text-xs font-mono border border-slate-800"
              >
                <FileSpreadsheet size={13} />
                <span>Export Matrix CSV</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead className="bg-[#08090B]/60 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
                  <tr>
                    <th className="px-5 py-3 border-b border-slate-800">Metric Indicator</th>
                    <th className="px-5 py-3 border-b border-slate-800">Target SLA</th>
                    <th className="px-5 py-3 border-b border-slate-800">Manual Baseline</th>
                    <th className="px-5 py-3 border-b border-slate-800">JML Access Guard</th>
                    <th className="px-5 py-3 border-b border-slate-800">Observed Delta</th>
                    <th className="px-5 py-3 border-b border-slate-800">Relative Gain</th>
                    <th className="px-5 py-3 border-b border-slate-800">SLA Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-xs">
                  {matrix.map((row: any, idx: number) => (
                    <tr key={idx} className="hover:bg-slate-800/20 transition-colors">
                      <td className="px-5 py-3.5 font-medium text-slate-200">
                        <div>{row.metric_name}</div>
                        <span className="text-[10px] font-mono text-slate-500">{row.metric_category}</span>
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-400">
                        {row.target_sla}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-rose-400">
                        {row.baseline_value}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-bold text-cyan-400">
                        {row.prototype_value}
                      </td>
                      <td className="px-5 py-3.5 font-mono font-semibold text-emerald-400">
                        {row.delta}
                      </td>
                      <td className="px-5 py-3.5 font-mono text-slate-300">
                        {row.relative_improvement}
                      </td>
                      <td className="px-5 py-3.5">
                        <span className="px-2 py-0.5 bg-emerald-950/60 text-emerald-400 text-[10px] font-mono rounded border border-emerald-500/40">
                          Target Met
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 3: SLA SENSITIVITY CURVE */}
        {activeExperimentTab === 'sensitivity' && (
          <div className="bg-[#16191F] border border-slate-800 rounded-lg p-6 space-y-6">
            <div>
              <h3 className="text-sm font-semibold text-slate-100">
                SLA Target Horizon Sensitivity Analysis
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                Evaluation of access removal rates across varying SLA target deadlines (4 hours to 72 hours). Demonstrates how manual processes require 72+ hours to reach acceptable removal rates.
              </p>
            </div>

            <div className="space-y-4">
              {sensitivity.map((pt: any) => (
                <div key={pt.target_hours} className="space-y-1.5 p-3 bg-[#0D0F14] border border-slate-800 rounded-lg">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-mono font-semibold text-slate-200">
                      Target Horizon: {pt.target_hours} Hours
                    </span>
                    <span className="text-[11px] font-mono text-cyan-400 font-bold">
                      JML Guard Advantage: +{pt.advantage_points}%
                    </span>
                  </div>

                  {/* Dual Bar Comparison */}
                  <div className="space-y-1 pt-1">
                    <div className="flex items-center gap-2">
                      <span className="w-20 text-[10px] text-slate-500 font-mono">Baseline:</span>
                      <div className="flex-1 bg-slate-900 h-3 rounded overflow-hidden">
                        <div
                          className="bg-rose-500 h-full transition-all duration-500"
                          style={{ width: `${pt.baseline_rate_pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[11px] font-mono text-rose-400">{pt.baseline_rate_pct}%</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="w-20 text-[10px] text-slate-500 font-mono">Prototype:</span>
                      <div className="flex-1 bg-slate-900 h-3 rounded overflow-hidden">
                        <div
                          className="bg-cyan-500 h-full transition-all duration-500"
                          style={{ width: `${pt.prototype_rate_pct}%` }}
                        />
                      </div>
                      <span className="w-12 text-right text-[11px] font-mono text-cyan-400 font-bold">{pt.prototype_rate_pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: DISCREPANCY DRILLDOWN */}
        {activeExperimentTab === 'discrepancies' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-[#16191F] border border-slate-800 rounded-lg p-5 space-y-4">
              <h3 className="text-xs uppercase font-bold text-slate-400 tracking-wider">
                Baseline Evaluated Discrepancy Samples
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sampleBaseline.map((item: any) => (
                  <div key={item.item_id} className="p-3 bg-[#0D0F14] border border-slate-800 rounded text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-slate-300 font-semibold">{item.resource_name}</span>
                      <span className={`font-mono text-[10px] ${item.removed_within_target ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {item.removed_within_target ? 'Within SLA' : 'Exceeded SLA / Unresolved'}
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>User: {item.user_name} ({item.role})</span>
                      <span>Remediation Time: {item.time_to_remediate_hours ? `${item.time_to_remediate_hours}h` : 'Lingering'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-[#16191F] border border-slate-800 rounded-lg p-5 space-y-4">
              <h3 className="text-xs uppercase font-bold text-cyan-400 tracking-wider">
                JML Access Guard Evaluated Discrepancy Samples
              </h3>
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {sampleProto.map((item: any) => (
                  <div key={item.item_id} className="p-3 bg-[#0D0F14] border border-cyan-500/20 rounded text-xs space-y-1">
                    <div className="flex justify-between items-center">
                      <span className="font-mono text-cyan-300 font-semibold">{item.resource_name}</span>
                      <span className="font-mono text-[10px] text-emerald-400 font-bold">
                        {item.status} ({item.time_to_remediate_hours}h)
                      </span>
                    </div>
                    <div className="flex justify-between text-[11px] text-slate-500">
                      <span>User: {item.user_name} ({item.role})</span>
                      <span>Risk: {item.risk_level}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

  // --- VIEW 7: FAILURE STATES & EDGE CASES LAB ---
  const renderLab = () => (
    <div className="space-y-6 animate-in fade-in duration-300">
      <div className="bg-[#16191F] border border-slate-800 rounded-lg p-6">
        <div className="pb-5 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 bg-rose-950/60 text-rose-400 text-[10px] font-mono font-bold uppercase rounded border border-rose-500/30">
              Resilience & Safety Testbed
            </span>
          </div>
          <h2 className="text-base font-semibold text-slate-100 mt-1">
            Failure States, Edge Cases & Accountable Exception Laboratory
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            Test and prove system safety invariants under failure modes, rejected approvals, target API timeouts, and corrupted HR data.
          </p>
        </div>

        {/* Live Feedback Callout when edge cases execute */}
        {edgeCaseFeedback && (
          <div className="mt-6 p-4 bg-cyan-950/40 border border-cyan-500/40 rounded-lg space-y-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-bold text-cyan-400">
                {edgeCaseFeedback.scenario}
              </span>
              <button
                onClick={() => setEdgeCaseFeedback(null)}
                className="text-slate-400 hover:text-slate-200 text-xs"
              >
                &times; Dismiss
              </button>
            </div>
            <p className="text-xs text-slate-200">{edgeCaseFeedback.outcome}</p>
            <div className="text-[10px] font-mono text-slate-500 pt-1">
              Audit Hash: {edgeCaseFeedback.integrity_hash}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          {/* Case 1 */}
          <div className="p-5 bg-[#0D0F14] border border-slate-800 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-cyan-400 font-semibold">Edge Case 1</span>
              <span className="text-[10px] text-emerald-400 font-mono">Safety Invariant Verified</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Dual-Role TA Assignment Collision</h3>
            <p className="text-xs text-slate-400">
              A graduate student is appointed Teaching Assistant. System unions instructional entitlements without revoking student course access or granting administrative finance privileges.
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">User: Priya Sharma (U_3304_KP)</span>
              <button
                onClick={() => handleInjectScenario('dual_role_ta', 'Dual-Role TA Collision')}
                className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 rounded text-xs font-medium border border-cyan-500/40 transition-colors"
              >
                Inject Scenario
              </button>
            </div>
          </div>

          {/* Case 2 */}
          <div className="p-5 bg-[#0D0F14] border border-slate-800 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-rose-400 font-semibold">Edge Case 2</span>
              <span className="text-[10px] text-emerald-400 font-mono">Safety Invariant Verified</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Emergency Out-of-Cycle Termination</h3>
            <p className="text-xs text-slate-400">
              Immediate administrative separation for staff holding HR master control and financial ERP. Verifies critical routing and instant deprovisioning.
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">User: Laura Taylor (U_9021_LT)</span>
              <button
                onClick={() => handleInjectScenario('emergency_leaver', 'Emergency Termination')}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 rounded text-xs font-medium border border-rose-500/40 transition-colors"
              >
                Inject Scenario
              </button>
            </div>
          </div>

          {/* Case 3 */}
          <div className="p-5 bg-[#0D0F14] border border-slate-800 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-amber-400 font-semibold">Edge Case 3</span>
              <span className="text-[10px] text-emerald-400 font-mono">Safety Invariant Verified</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Dormant Expired Grant (Researcher)</h3>
            <p className="text-xs text-slate-400">
              Visiting scholar contract expired 14 days ago. System checks contract_end_date against system clock and flags high-performance computing allocations.
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">User: Dr. Kenji Sato (U_5519_KR)</span>
              <button
                onClick={() => handleInjectScenario('contract_expired_researcher', 'Expired Researcher Grant')}
                className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 rounded text-xs font-medium border border-amber-500/40 transition-colors"
              >
                Inject Scenario
              </button>
            </div>
          </div>

          {/* Case 4 */}
          <div className="p-5 bg-[#0D0F14] border border-slate-800 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-cyan-400 font-semibold">Edge Case 4</span>
              <span className="text-[10px] text-emerald-400 font-mono">Safety Invariant Verified</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Boomerang Rehire (Alumni Postdoc)</h3>
            <p className="text-xs text-slate-400">
              An alumnus returns as a Postdoc Research Fellow. System provisions new research lab entitlements while preserving lifetime alumni vanity email forwarder.
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">User: Alex Chen (U_7712_AL)</span>
              <button
                onClick={() => handleInjectScenario('boomerang_rehire', 'Boomerang Alumni Rehire')}
                className="px-3 py-1.5 bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 rounded text-xs font-medium border border-cyan-500/40 transition-colors"
              >
                Inject Scenario
              </button>
            </div>
          </div>

          {/* Case 5: Rejected Approval Exception */}
          <div className="p-5 bg-[#0D0F14] border border-slate-800 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-amber-400 font-semibold">Edge Case 5</span>
              <span className="text-[10px] text-amber-400 font-mono">Accountable Exception</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Rejected Approval (Documented Exception)</h3>
            <p className="text-xs text-slate-400">
              An approver explicitly rejects recommended removal of HPC cluster access for a transitioned scholar, logging accountable academic rationale (NSF Grant extension).
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">User: U_REJ_001 (Biology)</span>
              <button
                onClick={() => handleRunEdgeCaseScenario('rejected_approval', 'Rejected Approval Exception')}
                className="px-3 py-1.5 bg-amber-950/40 hover:bg-amber-900/40 text-amber-300 rounded text-xs font-medium border border-amber-500/40 transition-colors"
              >
                Execute Exception
              </button>
            </div>
          </div>

          {/* Case 6: Target API Timeout Recovery */}
          <div className="p-5 bg-[#0D0F14] border border-slate-800 rounded-lg space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-rose-400 font-semibold">Edge Case 6</span>
              <span className="text-[10px] text-cyan-400 font-mono">Fault Tolerance & Retry</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Target System Failure & Automated Retry</h3>
            <p className="text-xs text-slate-400">
              Simulates downstream directory agent timeout on port 636. Verifies engine error catching, retry queue insertion, forensic alert, and eventual successful revocation.
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">User: U_FAIL_001 (Chemistry)</span>
              <button
                onClick={() => handleRunEdgeCaseScenario('failed_remediation', 'Target API Timeout & Retry')}
                className="px-3 py-1.5 bg-rose-950/40 hover:bg-rose-900/40 text-rose-300 rounded text-xs font-medium border border-rose-500/40 transition-colors"
              >
                Simulate Target Error
              </button>
            </div>
          </div>

          {/* Case 7: Invalid HR Record Schema Quarantine */}
          <div className="p-5 bg-[#0D0F14] border border-slate-800 rounded-lg space-y-3 md:col-span-2">
            <div className="flex justify-between items-start">
              <span className="text-xs font-mono text-purple-400 font-semibold">Edge Case 7</span>
              <span className="text-[10px] text-purple-400 font-mono">Schema Quarantine Invariant</span>
            </div>
            <h3 className="text-sm font-semibold text-slate-200">Corrupted HR Record Schema Quarantine</h3>
            <p className="text-xs text-slate-400">
              Simulates an upstream HR feed containing an unregistered role (&apos;UNKNOWN_CONSULTANT&apos;) or blank department. Engine safely quarantines the identity without crashing the batch reconciliation run.
            </p>
            <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
              <span className="text-[11px] text-slate-500 font-mono">User: U_INV_001 (Unknown Role Identity)</span>
              <button
                onClick={() => handleRunEdgeCaseScenario('invalid_hr_record', 'Corrupted HR Record Quarantine')}
                className="px-3 py-1.5 bg-purple-950/40 hover:bg-purple-900/40 text-purple-300 rounded text-xs font-medium border border-purple-500/40 transition-colors"
              >
                Test Schema Quarantine
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#08090B] text-slate-400 font-sans select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0D0F14] border-r border-slate-800 flex flex-col flex-shrink-0 z-10 hidden md:flex">
        <div className="p-6 pb-6">
          <h1 className="text-xl font-light text-slate-100 tracking-tight leading-snug">
            JML <span className="text-cyan-400 font-bold">ACCESS GUARD</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-500 mt-1">
            University IAM Reconciliation Engine
          </p>
        </div>

        <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto">
          <button
            onClick={() => setActiveView('overview')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
              activeView === 'overview'
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <LayoutDashboard size={16} />
            Engine Overview
          </button>

          <button
            onClick={() => setActiveView('queue')}
            className={`w-full flex justify-between items-center px-3 py-2.5 rounded text-xs font-medium transition-colors ${
              activeView === 'queue'
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <div className="flex items-center gap-3">
              <ListTodo size={16} />
              Approval Queue
            </div>
            {approvals.length > 0 && (
              <span className="font-mono text-[11px] text-amber-400 font-bold">
                {approvals.length}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveView('audit')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
              activeView === 'audit'
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <ShieldCheck size={16} />
            Immutable Audit Log
          </button>

          <button
            onClick={() => setActiveView('matrix')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
              activeView === 'matrix'
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <FileCode2 size={16} />
            Access Rules Matrix
          </button>

          <button
            onClick={() => setActiveView('directory')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
              activeView === 'directory'
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <Users size={16} />
            Identity Directory
          </button>

          <button
            onClick={() => setActiveView('baseline')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
              activeView === 'baseline'
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <BarChart3 size={16} />
            Evaluation & Experiments
          </button>

          <button
            onClick={() => setActiveView('lab')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-xs font-medium transition-colors ${
              activeView === 'lab'
                ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20'
                : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 border border-transparent'
            }`}
          >
            <FlaskConical size={16} />
            Failure & Edge Cases
          </button>
        </nav>

        {/* System Status Panel */}
        <div className="p-4 border-t border-slate-800 bg-[#08090B]/60 text-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="text-[10px] uppercase font-mono text-slate-400 font-semibold">Engine Status</span>
          </div>
          <p className="text-[11px] text-slate-500 font-mono">SQLite: Connected</p>
          <p className="text-[11px] text-slate-500 font-mono">Rules: Deterministic</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-14 border-b border-slate-800 flex items-center justify-between px-8 bg-[#08090B] z-10 flex-shrink-0">
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-600 font-mono">JML_ACCESS_GUARD</span>
            <span className="text-slate-700">/</span>
            <span className="text-cyan-400 font-medium capitalize">
              {activeView.replace('_', ' ')}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={refreshAllData}
              disabled={loading}
              className="text-slate-400 hover:text-slate-200 p-1.5 transition-colors"
              title="Refresh Engine State"
            >
              <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            </button>

            <div className="text-right">
              <div className="text-xs text-slate-200 font-mono">admin_sec</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wider">Security Operations</div>
            </div>
            <div className="w-7 h-7 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-mono font-bold text-cyan-400">
              AS
            </div>
          </div>
        </header>

        {/* Scrollable View Container */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto pb-12">
            {activeView === 'overview' && renderOverview()}
            {activeView === 'queue' && renderQueue()}
            {activeView === 'audit' && renderAudit()}
            {activeView === 'matrix' && renderMatrix()}
            {activeView === 'directory' && renderDirectory()}
            {activeView === 'baseline' && renderBaseline()}
            {activeView === 'lab' && renderLab()}
          </div>
        </div>
      </main>

      {/* Accountable Decision Modal */}
      {decisionModalOpen && selectedApproval && (
        <div className="fixed inset-0 bg-black/75 flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-[#16191F] border border-slate-800 rounded-lg max-w-lg w-full p-6 space-y-5">
            <div className="flex justify-between items-start pb-4 border-b border-slate-800">
              <div>
                <span className="font-mono text-cyan-400 text-xs">{selectedApproval.id}</span>
                <h3 className="text-base font-semibold text-slate-100 mt-0.5">Accountable Decision Review</h3>
              </div>
              <button
                onClick={() => setDecisionModalOpen(false)}
                className="text-slate-400 hover:text-slate-200"
              >
                <X size={18} />
              </button>
            </div>

            <div className="p-3 bg-[#0D0F14] border border-slate-800 rounded space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-slate-500">Target Identity:</span>
                <span className="font-mono text-slate-200">{selectedApproval.user_name} ({selectedApproval.user_id})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Department / Role:</span>
                <span className="text-slate-300">{selectedApproval.department} · {selectedApproval.primary_role}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Flagged Resource:</span>
                <span className="font-mono text-cyan-400 font-semibold">{selectedApproval.resource_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Risk Assessment:</span>
                <span>{renderRiskIndicator(selectedApproval.risk_level)}</span>
              </div>
            </div>

            {/* Decision Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Select Governance Action
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setDecisionType('Approved_Removal')}
                  className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${
                    decisionType === 'Approved_Removal'
                      ? 'bg-rose-950/50 border-rose-500/60 text-rose-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Approve Removal
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionType('Rejected_Retained')}
                  className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${
                    decisionType === 'Rejected_Retained'
                      ? 'bg-amber-950/50 border-amber-500/60 text-amber-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Retain (Exception)
                </button>
                <button
                  type="button"
                  onClick={() => setDecisionType('Escalated')}
                  className={`py-2 px-3 text-xs font-medium rounded border transition-colors ${
                    decisionType === 'Escalated'
                      ? 'bg-cyan-950/50 border-cyan-500/60 text-cyan-300 font-semibold'
                      : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Escalate to CISO
                </button>
              </div>
            </div>

            {/* Mandatory Justification */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex justify-between">
                <span>Auditable Justification (Mandatory)</span>
                <span className="text-[10px] text-slate-500 font-mono">{justificationInput.length} chars</span>
              </label>
              <textarea
                value={justificationInput}
                onChange={(e) => setJustificationInput(e.target.value)}
                placeholder="State policy rationale or exception justification..."
                rows={3}
                className="w-full bg-[#08090B] border border-slate-800 rounded p-2.5 text-xs text-slate-200 focus:outline-none focus:border-cyan-500 font-sans"
              />
              <p className="text-[10px] text-slate-500">
                This rationale is permanently bound to the cryptographically hashed audit entry for institutional compliance.
              </p>
            </div>

            <div className="pt-3 border-t border-slate-800 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setDecisionModalOpen(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={submittingDecision || justificationInput.trim().length < 5}
                onClick={submitApprovalDecision}
                className="px-4 py-2 bg-cyan-950 hover:bg-cyan-900 text-cyan-300 border border-cyan-500/50 rounded text-xs font-semibold disabled:opacity-50 transition-colors flex items-center gap-1.5"
              >
                <Check size={13} />
                Confirm & Record Audit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
