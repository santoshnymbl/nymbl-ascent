"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Briefcase, Users, Clock, Zap, ArrowRight, UserPlus,
  GitBranch, TrendingUp, Activity, Sparkles, BookOpen, Target,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface RoleData { id: string; name: string; _count: { candidates: number; roleScenarios: number }; }
interface CandidateData { id: string; name: string; email: string; status: string; createdAt: string; role: { name: string }; assessment: { score: { compositeScore: number } | null } | null; }

export default function AdminDashboard() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/roles").then((r) => r.json()),
      fetch("/api/admin/candidates").then((r) => r.json()),
    ]).then(([r, c]) => { setRoles(r); setCandidates(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const total = candidates.length;
  const pending = candidates.filter((c) => c.status === "completed" && !c.assessment?.score).length;
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const today = candidates.filter((c) => (c.status === "completed" || c.status === "scored") && new Date(c.createdAt) >= todayStart).length;
  const recent = [...candidates].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).slice(0, 5);

  const stColors: Record<string, { bg: string; color: string; label: string }> = {
    invited: { bg: "var(--info-surface)", color: "var(--info)", label: "Invited" },
    in_progress: { bg: "var(--warning-surface)", color: "var(--warning)", label: "In Progress" },
    completed: { bg: "var(--cta-glow)", color: "var(--cta)", label: "Completed" },
    scored: { bg: "var(--success-surface)", color: "var(--success)", label: "Scored" },
  };

  const pipelineStages = [
    { label: "Invited", count: candidates.filter((c) => c.status === "invited").length, color: "var(--info)" },
    { label: "In Progress", count: candidates.filter((c) => c.status === "in_progress").length, color: "var(--warning)" },
    { label: "Completed", count: candidates.filter((c) => c.status === "completed").length, color: "var(--cta)" },
    { label: "Scored", count: candidates.filter((c) => c.status === "scored").length, color: "var(--success)" },
  ];

  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
      {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{ height: 88, animation: "pulse 1.5s ease-in-out infinite" }}/>)}
    </div>
  );

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

      {/* ─── Header ─── */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)", margin: 0 }}>Dashboard</h2>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0" }}>Hiring pipeline overview</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "var(--success-surface)", border: "1px solid rgba(16,185,129,0.2)" }}>
          <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }}/>
          <span style={{ fontSize: "0.68rem", color: "var(--success)", fontWeight: 600 }}>System Active</span>
        </div>
      </div>

      {/* ─── Stats ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12 }}>
        {[
          { t: "Roles", v: roles.length, icon: Briefcase, c: "var(--accent)", bg: "var(--accent-surface)", tip: "Active roles" },
          { t: "Candidates", v: total, icon: Users, c: "var(--success)", bg: "var(--success-surface)", tip: "Total invited" },
          { t: "Pending", v: pending, icon: Clock, c: "var(--warning)", bg: "var(--warning-surface)", tip: "Awaiting scoring" },
          { t: "Today", v: today, icon: Zap, c: "var(--info)", bg: "var(--info-surface)", tip: "Completed today" },
        ].map(s => {
          const I = s.icon;
          return (
            <Tooltip key={s.t} content={s.tip}>
              <div className="stat-card">
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{s.t}</span>
                  <div style={{ width: 32, height: 32, borderRadius: "var(--radius-md)", background: s.bg, color: s.c, display: "flex", alignItems: "center", justifyContent: "center" }}><I size={16}/></div>
                </div>
                <span style={{ fontSize: "1.6rem", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1 }}>{s.v}</span>
              </div>
            </Tooltip>
          );
        })}
      </div>

      {/* ─── Bento Grid ─── */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gridTemplateRows: "auto auto", gap: 12, alignItems: "start" }}>

        {/* Recent Candidates (spans 2 cols) */}
        <div className="glass-card" style={{ gridColumn: "1 / 3", padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <Users size={15} style={{ color: "var(--accent)" }}/>
              <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Recent Candidates</h3>
            </div>
            <Link href="/admin/candidates" style={{ fontSize: "0.72rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>All <ArrowRight size={11}/></Link>
          </div>
          {recent.length === 0 ? (
            <div style={{ padding: "32px 16px", textAlign: "center" }}>
              <div style={{ width: 48, height: 48, borderRadius: "var(--radius-full)", background: "var(--accent-surface)", display: "inline-flex", alignItems: "center", justifyContent: "center", marginBottom: 10 }}>
                <UserPlus size={22} style={{ color: "var(--accent)" }}/>
              </div>
              <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>No candidates yet</p>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", margin: "0 0 14px" }}>Invite your first candidate to get started</p>
              <Link href="/admin/candidates" className="btn-cta" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.78rem", padding: "8px 16px" }}>
                <UserPlus size={14}/> Invite Candidates
              </Link>
            </div>
          ) : (
            <table className="table-modern">
              <thead><tr><th>Candidate</th><th>Role</th><th>Status</th><th style={{ textAlign: "right" }}>Score</th></tr></thead>
              <tbody>
                {recent.map(c => {
                  const st = stColors[c.status] || stColors.invited;
                  return (
                    <tr key={c.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                          <div style={{ width: 28, height: 28, borderRadius: "var(--radius-full)", background: "var(--accent-surface)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.68rem", fontWeight: 700, flexShrink: 0 }}>{c.name[0]}</div>
                          <div>
                            <div style={{ fontWeight: 600, fontSize: "0.8rem" }}>{c.name}</div>
                            <div style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{c.email}</div>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{c.role.name}</td>
                      <td><span className="badge" style={{ background: st.bg, color: st.color, fontSize: "0.68rem" }}>{st.label}</span></td>
                      <td style={{ textAlign: "right", fontWeight: 700, fontSize: "0.85rem", color: c.assessment?.score ? "var(--accent)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                        {c.assessment?.score?.compositeScore?.toFixed(1) ?? "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pipeline */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 14 }}>
            <Activity size={14} style={{ color: "var(--accent)" }}/>
            <h3 style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Pipeline</h3>
          </div>
          {pipelineStages.map(p => (
            <div key={p.label} style={{ marginBottom: 12 }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.73rem", marginBottom: 4 }}>
                <span style={{ color: "var(--text-secondary)" }}>{p.label}</span>
                <span style={{ color: "var(--text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.count}</span>
              </div>
              <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "var(--bg-elevated)", overflow: "hidden" }}>
                <div className="progress-fill" style={{ height: "100%", borderRadius: "var(--radius-full)", background: p.color, width: total > 0 ? `${Math.max((p.count / total) * 100, p.count > 0 ? 10 : 0)}%` : "0%", transition: "width 600ms var(--ease-spring)" }}/>
              </div>
            </div>
          ))}
        </div>

        {/* Getting Started / Quick Actions */}
        <div className="glass-card" style={{ gridColumn: "1 / 3", padding: 0, overflow: "hidden" }}>
          <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8 }}>
            <Sparkles size={15} style={{ color: "var(--cta)" }}/>
            <h3 style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Getting Started</h3>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 0 }}>
            {[
              { step: "1", title: "Configure Roles", desc: "Define the positions you're hiring for", href: "/admin/roles", icon: Briefcase, color: "var(--accent)", done: roles.length > 0 },
              { step: "2", title: "Set Up Scenarios", desc: "Create assessment scenarios for each stage", href: "/admin/scenarios", icon: BookOpen, color: "var(--cta)", done: true },
              { step: "3", title: "Invite Candidates", desc: "Send assessment links to applicants", href: "/admin/candidates", icon: Target, color: "var(--success)", done: total > 0 },
            ].map((item, i) => {
              const I = item.icon;
              return (
                <Link key={item.step} href={item.href} style={{
                  padding: "16px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 8,
                  borderRight: i < 2 ? "1px solid var(--border-subtle)" : "none",
                  transition: "background 150ms ease", background: "transparent",
                }} onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: "var(--radius-md)", background: item.done ? "var(--success-surface)" : "var(--bg-elevated)", color: item.done ? "var(--success)" : item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.7rem", fontWeight: 700 }}>
                      {item.done ? "✓" : <I size={14}/>}
                    </div>
                    <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Roles + Quick Links */}
        <div className="glass-card" style={{ padding: 16 }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Briefcase size={14} style={{ color: "var(--accent)" }}/>
              <h3 style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Roles</h3>
            </div>
            <Link href="/admin/roles" style={{ fontSize: "0.68rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Manage</Link>
          </div>
          {roles.map(r => (
            <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "7px 0", borderBottom: "1px solid var(--border-subtle)" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: 500, color: "var(--text-primary)" }}>{r.name}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <span style={{ fontSize: "0.68rem", color: "var(--text-muted)" }}>{r._count.roleScenarios} scenarios</span>
                <span className="badge" style={{ background: "var(--accent-surface)", color: "var(--accent)", fontSize: "0.65rem" }}>{r._count.candidates}</span>
              </div>
            </div>
          ))}
          <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
            {[
              { label: "Results", href: "/admin/results", icon: TrendingUp, c: "var(--success)" },
              { label: "Scenarios", href: "/admin/scenarios", icon: GitBranch, c: "var(--accent)" },
            ].map(a => {
              const I = a.icon;
              return (
                <Link key={a.label} href={a.href} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 5, padding: "7px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.72rem", fontWeight: 500, transition: "all 150ms ease" }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.background = "transparent"; }}
                ><I size={13} style={{ color: a.c }}/>{a.label}</Link>
              );
            })}
          </div>
        </div>

      </div>
    </div>
  );
}
