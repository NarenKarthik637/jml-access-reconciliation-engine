'use client';

import React, { useState } from 'react';
import { LayoutDashboard, ListTodo, ShieldCheck, FileCode2, Activity, Check, X, AlertTriangle, ArrowRight, ShieldAlert, Clock, CheckCircle2 } from 'lucide-react';

// --- Mock Data ---
const initialQueue = [
  { id: 'REQ-8012', user: 'U_4812_JM', event: 'Mover (Faculty → Alumni)', discrepancy: 'VPN_Access (Unauthorized)', risk: 'High', date: '2026-09-05 01:15' },
  { id: 'REQ-8013', user: 'U_9021_LT', event: 'Leaver (Terminated)', discrepancy: 'Lab_Auth_Group (Orphaned)', risk: 'Critical', date: '2026-09-05 01:30' },
  { id: 'REQ-8014', user: 'U_3304_KP', event: 'Mover (Staff → Faculty)', discrepancy: 'Finance_Dashboard (Excessive)', risk: 'Medium', date: '2026-09-05 02:05' },
];

const initialAudit = [
  { id: 'AUD-991', time: '2026-09-05 00:45:12', eventId: 'REQ-8005', user: 'U_2115_SD', action: 'Auto-Provisioned', approver: 'SYSTEM', detail: 'Edu_Suite added (Low Risk)' },
  { id: 'AUD-990', time: '2026-09-04 23:12:05', eventId: 'REQ-8001', user: 'U_1102_XZ', action: 'Approved Removal', approver: 'admin_sec', detail: 'Grade_Admin removed manually' },
  { id: 'AUD-989', time: '2026-09-04 22:05:00', eventId: 'REQ-7998', user: 'U_0045_AB', action: 'Auto-Removed', approver: 'SYSTEM', detail: 'Student_Mailing_List removed' },
];

const mockPolicy = {
  "version": "1.2.0-stable",
  "rules": [
    {
      "role": "Faculty",
      "department": "Mathematics",
      "allowed_groups": ["math_staff_group", "general_staff"],
      "allowed_applications": ["Math_Grades_Portal", "Edu_Suite"],
      "removal_approval_required": ["Server_Admin", "Finance_Dashboard"]
    },
    {
      "role": "Alumni",
      "department": "ANY",
      "allowed_groups": ["alumni_network"],
      "allowed_applications": ["Alumni_Email"],
      "removal_approval_required": ["VPN_Access", "Lab_Auth_Group"]
    }
  ]
};

export default function JMLDashboard() {
  const [activeView, setActiveView] = useState<'dashboard' | 'queue' | 'audit' | 'policies'>('dashboard');
  const [queue, setQueue] = useState(initialQueue);
  const [audit, setAudit] = useState(initialAudit);

  // --- Handlers ---
  const handleAction = (item: any, actionType: 'Approved Removal' | 'Rejected Removal') => {
    // Remove from queue
    setQueue((prev) => prev.filter((q) => q.id !== item.id));
    
    // Add to audit log
    const newAudit = {
      id: `AUD-${Math.floor(Math.random() * 10000)}`,
      time: new Date().toISOString().replace('T', ' ').slice(0, 19),
      eventId: item.id,
      user: item.user,
      action: actionType,
      approver: 'admin_sec',
      detail: `${item.discrepancy} - ${actionType === 'Approved Removal' ? 'Removed' : 'Retained'}`,
    };
    setAudit((prev) => [newAudit, ...prev]);
  };

  // --- Render Helpers ---
  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'Critical': return <span className="bg-red-900/30 text-red-400 border border-red-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1"><ShieldAlert size={10} /> {risk}</span>;
      case 'High': return <span className="bg-amber-900/30 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase flex items-center gap-1"><AlertTriangle size={10} /> {risk}</span>;
      case 'Medium': return <span className="bg-blue-900/30 text-blue-400 border border-blue-500/30 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">{risk}</span>;
      default: return <span className="bg-slate-800 text-slate-300 border border-slate-600 px-2 py-0.5 rounded text-[10px] font-bold tracking-wider uppercase">{risk}</span>;
    }
  };

  const renderDashboard = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-[#16191F] border border-slate-800 p-6 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Mean Remediation Time</h3>
            <Clock size={16} className="text-cyan-400" />
          </div>
          <div>
            <div className="text-4xl font-light text-slate-100 mb-1">1.8 <span className="text-lg text-slate-500">hours</span></div>
            <p className="text-xs text-emerald-400 flex items-center gap-1"><ArrowRight size={12} className="rotate-45" /> 97% faster than 72h baseline</p>
          </div>
        </div>
        <div className="bg-[#16191F] border border-slate-800 p-6 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Pending Approvals</h3>
            <ListTodo size={16} className="text-amber-500" />
          </div>
          <div>
            <div className="text-4xl font-light text-slate-100 mb-1">{queue.length}</div>
            <p className="text-xs text-amber-500/80">Requires manual review</p>
          </div>
        </div>
        <div className="bg-[#16191F] border border-slate-800 p-6 rounded-lg flex flex-col justify-between">
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Resolution Rate</h3>
            <CheckCircle2 size={16} className="text-emerald-500" />
          </div>
          <div>
            <div className="text-4xl font-light text-slate-100 mb-1">99.2<span className="text-lg text-slate-500">%</span></div>
            <p className="text-xs text-slate-400">Within 24h target window</p>
          </div>
        </div>
      </div>

      <div className="bg-[#16191F] border border-slate-800 p-6 rounded-lg h-64 flex flex-col justify-center items-center relative overflow-hidden">
        <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest absolute top-6 left-6">Discrepancy Flow (Last 7 Days)</h2>
        <div className="flex items-end gap-2 h-32 mt-8 w-full max-w-2xl px-6">
          {[12, 19, 15, 8, 22, 14, 5].map((val, i) => (
            <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 group">
              <span className="text-[10px] text-cyan-400/0 group-hover:text-cyan-400/100 transition-colors">{val}</span>
              <div 
                className="w-full bg-cyan-900/40 border-t border-cyan-500/50 hover:bg-cyan-500/30 transition-all rounded-t-sm" 
                style={{ height: `${(val / 25) * 100}%` }}
              ></div>
            </div>
          ))}
        </div>
        <div className="w-full max-w-2xl flex justify-between px-6 mt-2 text-[10px] text-slate-600 font-mono uppercase">
          <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
        </div>
      </div>
    </div>
  );

  const renderQueue = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#16191F] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0D0F14]/50">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest flex items-center gap-2">
            <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse"></span> Action Required
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Showing {queue.length} items</span>
        </div>
        
        {queue.length === 0 ? (
          <div className="p-12 flex flex-col items-center justify-center text-slate-500">
            <ShieldCheck size={48} className="text-emerald-500/50 mb-4" />
            <p className="text-sm">No pending discrepancies.</p>
            <p className="text-xs mt-1 text-slate-600">All environments are reconciled.</p>
          </div>
        ) : (
          <table className="w-full text-left border-collapse">
            <thead className="bg-[#08090B]/50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
              <tr>
                <th className="px-6 py-4 border-b border-slate-800">Request ID</th>
                <th className="px-6 py-4 border-b border-slate-800">User / Event</th>
                <th className="px-6 py-4 border-b border-slate-800">Discrepancy detected</th>
                <th className="px-6 py-4 border-b border-slate-800">Risk Level</th>
                <th className="px-6 py-4 border-b border-slate-800 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {queue.map((item) => (
                <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/30 transition-colors">
                  <td className="px-6 py-4 font-mono text-cyan-500 text-xs">{item.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-mono text-slate-200 text-xs mb-1">{item.user}</div>
                    <div className="text-slate-500 text-[10px] uppercase tracking-wider">{item.event}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-300 font-medium">{item.discrepancy}</td>
                  <td className="px-6 py-4">{getRiskBadge(item.risk)}</td>
                  <td className="px-6 py-4 flex justify-end gap-2">
                    <button 
                      onClick={() => handleAction(item, 'Rejected Removal')}
                      className="px-3 py-1.5 bg-slate-800 text-slate-300 hover:bg-slate-700 rounded text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1 border border-slate-700"
                    >
                      <X size={12} /> Retain
                    </button>
                    <button 
                      onClick={() => handleAction(item, 'Approved Removal')}
                      className="px-3 py-1.5 bg-cyan-950/30 text-cyan-400 hover:bg-cyan-900/50 rounded text-[10px] font-bold uppercase tracking-wider border border-cyan-500/30 transition-colors flex items-center gap-1"
                    >
                      <Check size={12} /> Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );

  const renderAudit = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#16191F] border border-slate-800 rounded-lg overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0D0F14]/50">
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-widest flex items-center gap-2">
            Immutable Audit Log
          </h2>
          <span className="text-[10px] text-slate-500 font-mono">Total records: {audit.length}</span>
        </div>
        <table className="w-full text-left border-collapse">
          <thead className="bg-[#08090B]/50 text-[10px] uppercase text-slate-500 font-bold tracking-wider">
            <tr>
              <th className="px-6 py-4 border-b border-slate-800">Timestamp</th>
              <th className="px-6 py-4 border-b border-slate-800">Audit ID</th>
              <th className="px-6 py-4 border-b border-slate-800">User ID</th>
              <th className="px-6 py-4 border-b border-slate-800">Action Taken</th>
              <th className="px-6 py-4 border-b border-slate-800">Approver</th>
              <th className="px-6 py-4 border-b border-slate-800">Details</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono text-xs">
            {audit.map((item) => (
              <tr key={item.id} className="border-b border-slate-800/50 hover:bg-slate-800/20">
                <td className="px-6 py-3 text-slate-500">{item.time}</td>
                <td className="px-6 py-3 text-cyan-600/50">{item.id}</td>
                <td className="px-6 py-3 text-cyan-400">{item.user}</td>
                <td className="px-6 py-3">
                  <span className={`${item.action.includes('Approved') ? 'text-emerald-400' : item.action.includes('Rejected') ? 'text-amber-400' : 'text-slate-400'}`}>
                    {item.action}
                  </span>
                </td>
                <td className="px-6 py-3 text-slate-400">{item.approver}</td>
                <td className="px-6 py-3 text-slate-400 italic truncate max-w-xs" title={item.detail}>{item.detail}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );

  const renderPolicies = () => (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-[#16191F] border border-slate-800 rounded-lg overflow-hidden flex flex-col h-[600px]">
        <div className="px-6 py-4 border-b border-slate-800 flex justify-between items-center bg-[#0D0F14]/50">
          <h2 className="text-xs font-bold text-cyan-400 uppercase tracking-widest">Active Rule Set</h2>
          <span className="text-[10px] text-slate-500 font-mono bg-slate-900 border border-slate-700 px-2 py-0.5 rounded">v1.2.0-stable</span>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          <pre className="font-mono text-xs text-slate-300 leading-relaxed">
            <code dangerouslySetInnerHTML={{
              __html: JSON.stringify(mockPolicy, null, 2)
                .replace(/"([^"]+)":/g, '<span class="text-cyan-400">"$1"</span>:')
                .replace(/"([^"]+)"/g, '<span class="text-emerald-400">"$1"</span>')
                .replace(/true|false/g, '<span class="text-amber-400">$&</span>')
            }} />
          </pre>
        </div>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-[#08090B] text-slate-400 font-sans select-none overflow-hidden">
      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#0D0F14] border-r border-slate-800 flex flex-col flex-shrink-0 z-10 hidden md:flex">
        <div className="p-6 pb-8">
          <h1 className="text-xl font-light text-slate-100 tracking-tight leading-snug">
            PROJECT <br/><span className="text-cyan-400 font-bold">JML-ALPHA</span>
          </h1>
          <p className="text-[10px] uppercase tracking-widest text-slate-600 mt-2">Reconciliation Engine</p>
        </div>
        
        <nav className="flex-1 px-4 space-y-2">
          <button 
            onClick={() => setActiveView('dashboard')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeView === 'dashboard' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 border border-transparent'}`}
          >
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button 
            onClick={() => setActiveView('queue')}
            className={`w-full flex justify-between items-center px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeView === 'queue' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 border border-transparent'}`}
          >
            <div className="flex items-center gap-3">
              <ListTodo size={18} />
              Approval Queue
            </div>
            {queue.length > 0 && (
              <span className="bg-amber-500/20 text-amber-500 text-[10px] px-2 py-0.5 rounded-full font-bold">{queue.length}</span>
            )}
          </button>
          <button 
            onClick={() => setActiveView('audit')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeView === 'audit' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 border border-transparent'}`}
          >
            <ShieldCheck size={18} />
            Audit Log
          </button>
          <button 
            onClick={() => setActiveView('policies')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${activeView === 'policies' ? 'bg-cyan-950/40 text-cyan-400 border border-cyan-500/20' : 'text-slate-500 hover:bg-slate-800/50 hover:text-slate-300 border border-transparent'}`}
          >
            <FileCode2 size={18} />
            Config Policies
          </button>
        </nav>

        <div className="p-4 border-t border-slate-800 bg-[#08090B]/50">
          <div className="flex items-center gap-2 mb-2">
            <Activity size={12} className="text-emerald-500" />
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold">System Status</span>
          </div>
          <p className="text-[10px] text-slate-600 font-mono">Last HR Sync: 2 mins ago</p>
          <p className="text-[10px] text-slate-600 font-mono">Engine: Online</p>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden relative">
        {/* Top Header */}
        <header className="h-16 border-b border-slate-800 flex items-center justify-between px-8 bg-[#08090B] z-10 flex-shrink-0">
          <div className="flex items-center gap-2 text-sm">
            <span className="text-slate-600">JML-ALPHA</span>
            <span className="text-slate-700">/</span>
            <span className="text-cyan-400 font-medium capitalize">{activeView.replace('-', ' ')}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <div className="text-xs text-slate-300 font-medium">admin_sec</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-widest">Security Operations</div>
            </div>
            <div className="w-8 h-8 rounded bg-slate-800 border border-slate-700 flex items-center justify-center text-xs font-bold text-cyan-500">
              AS
            </div>
          </div>
        </header>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-8">
          <div className="max-w-6xl mx-auto">
            {activeView === 'dashboard' && renderDashboard()}
            {activeView === 'queue' && renderQueue()}
            {activeView === 'audit' && renderAudit()}
            {activeView === 'policies' && renderPolicies()}
          </div>
        </div>
      </main>
    </div>
  );
}

