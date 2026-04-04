"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import Link from "next/link";
import { Responsive, WidthProvider } from "react-grid-layout/legacy";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RGLLayouts = { lg: any[] };
import {
  Briefcase, Users, Clock, Zap, ArrowRight, UserPlus,
  GitBranch, TrendingUp, Activity, Sparkles, BookOpen, Target,
  Lock, Unlock, RotateCcw, GripHorizontal,
} from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

import "react-grid-layout/css/styles.css";

const ResponsiveGrid = WidthProvider(Responsive);

interface RoleData { id: string; name: string; _count: { candidates: number; roleScenarios: number }; }
interface CandidateData { id: string; name: string; email: string; status: string; createdAt: string; role: { name: string }; assessment: { score: { compositeScore: number } | null } | null; }

const STORAGE_KEY = "nymbl-dashboard-layouts";

function buildLayouts(isLocked: boolean) {
  return {
    lg: [
      { i: "stat-roles",     x: 0, y: 0, w: 3, h: 2, minW: 2, minH: 2, static: isLocked },
      { i: "stat-candidates", x: 3, y: 0, w: 3, h: 2, minW: 2, minH: 2, static: isLocked },
      { i: "stat-pending",   x: 6, y: 0, w: 3, h: 2, minW: 2, minH: 2, static: isLocked },
      { i: "stat-today",     x: 9, y: 0, w: 3, h: 2, minW: 2, minH: 2, static: isLocked },
      { i: "candidates",     x: 0, y: 2, w: 8, h: 5, minW: 4, minH: 3, static: isLocked },
      { i: "pipeline",       x: 8, y: 2, w: 4, h: 5, minW: 3, minH: 3, static: isLocked },
      { i: "getting-started", x: 0, y: 7, w: 8, h: 3, minW: 4, minH: 2, static: isLocked },
      { i: "roles",          x: 8, y: 7, w: 4, h: 3, minW: 3, minH: 2, static: isLocked },
    ],
  };
}

export default function AdminDashboard() {
  const [roles, setRoles] = useState<RoleData[]>([]);
  const [candidates, setCandidates] = useState<CandidateData[]>([]);
  const [loading, setLoading] = useState(true);
  const [locked, setLocked] = useState(true);
  const [layouts, setLayouts] = useState(() => buildLayouts(true));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        // Apply static flag based on current lock state
        if (parsed.lg) {
          parsed.lg = parsed.lg.map((item: any) => ({ ...item, static: true }));
        }
        setLayouts(parsed);
      }
    } catch {}
  }, []);

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/roles").then((r) => r.json()),
      fetch("/api/admin/candidates").then((r) => r.json()),
    ]).then(([r, c]) => { setRoles(r); setCandidates(c); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const onLayoutChange = useCallback((_: any, allLayouts: any) => {
    if (!locked) {
      setLayouts(allLayouts);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(allLayouts));
    }
  }, [locked]);

  function toggleLock() {
    const next = !locked;
    setLocked(next);
    // Update static flag on every item
    setLayouts((prev) => {
      const updated = { ...prev };
      if (updated.lg) {
        updated.lg = updated.lg.map((item) => ({ ...item, static: next }));
      }
      return { ...updated };
    });
  }

  function resetLayout() {
    setLayouts(buildLayouts(locked));
    localStorage.removeItem(STORAGE_KEY);
  }

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

  const stats = [
    { key: "stat-roles", t: "Roles", v: roles.length, icon: Briefcase, c: "var(--accent)", bg: "var(--accent-surface)", tip: "Active roles" },
    { key: "stat-candidates", t: "Candidates", v: total, icon: Users, c: "var(--success)", bg: "var(--success-surface)", tip: "Total invited" },
    { key: "stat-pending", t: "Pending", v: pending, icon: Clock, c: "var(--warning)", bg: "var(--warning-surface)", tip: "Awaiting scoring" },
    { key: "stat-today", t: "Today", v: today, icon: Zap, c: "var(--info)", bg: "var(--info-surface)", tip: "Completed today" },
  ];

  if (loading) return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 12, padding: "0 4px" }}>
      {[1,2,3,4].map(i => <div key={i} className="stat-card" style={{ height: 88, animation: "pulse 1.5s ease-in-out infinite" }}/>)}
    </div>
  );

  return (
    <div ref={containerRef} style={{ minHeight: "calc(100vh - 48px)", width: "100%" }}>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14, padding: "0 4px" }}>
        <div>
          <h2 style={{ fontSize: "1.3rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)", margin: 0 }}>Dashboard</h2>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)", margin: "2px 0 0" }}>Hiring pipeline overview</p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 5, padding: "3px 10px", borderRadius: "var(--radius-full)", background: "var(--success-surface)", border: "1px solid rgba(16,185,129,0.2)" }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--success)", display: "inline-block" }}/>
            <span style={{ fontSize: "0.68rem", color: "var(--success)", fontWeight: 600 }}>Live</span>
          </div>
          <Tooltip content={locked ? "Unlock to drag & resize widgets" : "Lock layout"} position="bottom">
            <button
              onClick={toggleLock}
              style={{ display: "flex", alignItems: "center", gap: 5, padding: "5px 10px", borderRadius: "var(--radius-md)", background: locked ? "transparent" : "var(--accent-surface)", border: `1px solid ${locked ? "var(--border-default)" : "var(--accent)"}`, color: locked ? "var(--text-muted)" : "var(--accent)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, transition: "all 150ms ease" }}
            >
              {locked ? <Lock size={13}/> : <Unlock size={13}/>}
              {locked ? "Edit" : "Editing"}
            </button>
          </Tooltip>
          {!locked && (
            <Tooltip content="Reset to default layout" position="bottom">
              <button onClick={resetLayout} style={{ display: "flex", alignItems: "center", padding: "5px 8px", borderRadius: "var(--radius-md)", background: "transparent", border: "1px solid var(--border-default)", color: "var(--text-muted)", cursor: "pointer", transition: "all 150ms ease" }}>
                <RotateCcw size={13}/>
              </button>
            </Tooltip>
          )}
        </div>
      </div>

      {/* Grid */}
      <ResponsiveGrid
        className="layout"
        layouts={layouts}
        breakpoints={{ lg: 900, md: 600, sm: 0 }}
        cols={{ lg: 12, md: 8, sm: 4 }}
        rowHeight={40}
        isDraggable={!locked}
        isResizable={!locked}
        compactType={locked ? "vertical" : null}
        preventCollision={!locked}
        onLayoutChange={onLayoutChange}
        draggableHandle=".drag-handle"
        margin={[12, 12]}
        containerPadding={[0, 0]}
        useCSSTransforms
      >
        {/* Stat Cards */}
        {stats.map(s => {
          const I = s.icon;
          return (
            <div key={s.key} className="stat-card" style={{ display: "flex", flexDirection: "column", justifyContent: "center", overflow: "hidden" }}>
              {!locked && <div className="drag-handle" style={{ position: "absolute", top: 4, right: 4, cursor: "grab", color: "var(--text-muted)", opacity: 0.5 }}><GripHorizontal size={12}/></div>}
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6, padding: "0 4px" }}>
                <span style={{ fontSize: "0.7rem", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)" }}>{s.t}</span>
                <div style={{ width: 30, height: 30, borderRadius: "var(--radius-md)", background: s.bg, color: s.c, display: "flex", alignItems: "center", justifyContent: "center" }}><I size={15}/></div>
              </div>
              <span style={{ fontSize: "1.5rem", fontWeight: 700, color: "var(--text-primary)", fontVariantNumeric: "tabular-nums", lineHeight: 1, padding: "0 4px" }}>{s.v}</span>
            </div>
          );
        })}

        {/* Recent Candidates */}
        <div key="candidates" className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              {!locked && <div className="drag-handle" style={{ cursor: "grab", color: "var(--text-muted)", opacity: 0.5 }}><GripHorizontal size={12}/></div>}
              <Users size={14} style={{ color: "var(--accent)" }}/>
              <h3 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Recent Candidates</h3>
            </div>
            <Link href="/admin/candidates" style={{ fontSize: "0.7rem", color: "var(--accent)", textDecoration: "none", display: "flex", alignItems: "center", gap: 3, fontWeight: 600 }}>All <ArrowRight size={10}/></Link>
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {recent.length === 0 ? (
              <div style={{ padding: "24px 14px", textAlign: "center" }}>
                <UserPlus size={20} style={{ color: "var(--accent)", marginBottom: 6 }}/>
                <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", margin: "0 0 4px" }}>No candidates yet</p>
                <Link href="/admin/candidates" className="btn-cta" style={{ display: "inline-flex", alignItems: "center", gap: 5, fontSize: "0.75rem", padding: "6px 14px", marginTop: 8 }}>
                  <UserPlus size={13}/> Invite
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
                            <div style={{ width: 26, height: 26, borderRadius: "var(--radius-full)", background: "var(--accent-surface)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700, flexShrink: 0 }}>{c.name[0]}</div>
                            <div>
                              <div style={{ fontWeight: 600, fontSize: "0.78rem" }}>{c.name}</div>
                              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{c.email}</div>
                            </div>
                          </div>
                        </td>
                        <td style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>{c.role.name}</td>
                        <td><span className="badge" style={{ background: st.bg, color: st.color, fontSize: "0.65rem" }}>{st.label}</span></td>
                        <td style={{ textAlign: "right", fontWeight: 700, fontSize: "0.82rem", color: c.assessment?.score ? "var(--accent)" : "var(--text-muted)", fontVariantNumeric: "tabular-nums" }}>
                          {c.assessment?.score?.compositeScore?.toFixed(1) ?? "—"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Pipeline */}
        <div key="pipeline" className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
            {!locked && <div className="drag-handle" style={{ cursor: "grab", color: "var(--text-muted)", opacity: 0.5 }}><GripHorizontal size={12}/></div>}
            <Activity size={13} style={{ color: "var(--accent)" }}/>
            <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Pipeline</h3>
          </div>
          <div style={{ flex: 1, padding: "12px 14px", display: "flex", flexDirection: "column", justifyContent: "center", gap: 10 }}>
            {pipelineStages.map(p => (
              <div key={p.label}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.72rem", marginBottom: 4 }}>
                  <span style={{ color: "var(--text-secondary)" }}>{p.label}</span>
                  <span style={{ color: "var(--text-primary)", fontWeight: 700, fontVariantNumeric: "tabular-nums" }}>{p.count}</span>
                </div>
                <div style={{ height: 6, borderRadius: "var(--radius-full)", background: "var(--bg-elevated)", overflow: "hidden" }}>
                  <div className="progress-fill" style={{ height: "100%", borderRadius: "var(--radius-full)", background: p.color, width: total > 0 ? `${Math.max((p.count / total) * 100, p.count > 0 ? 10 : 0)}%` : "0%", transition: "width 600ms var(--ease-spring)" }}/>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Getting Started */}
        <div key="getting-started" className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
            {!locked && <div className="drag-handle" style={{ cursor: "grab", color: "var(--text-muted)", opacity: 0.5 }}><GripHorizontal size={12}/></div>}
            <Sparkles size={14} style={{ color: "var(--cta)" }}/>
            <h3 style={{ fontSize: "0.8rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0 }}>Getting Started</h3>
          </div>
          <div style={{ flex: 1, display: "grid", gridTemplateColumns: "repeat(3, 1fr)" }}>
            {[
              { title: "Configure Roles", desc: "Define positions you're hiring for", href: "/admin/roles", icon: Briefcase, color: "var(--accent)", done: roles.length > 0 },
              { title: "Set Up Scenarios", desc: "Create assessment scenarios", href: "/admin/scenarios", icon: BookOpen, color: "var(--cta)", done: true },
              { title: "Invite Candidates", desc: "Send assessment links", href: "/admin/candidates", icon: Target, color: "var(--success)", done: total > 0 },
            ].map((item, i) => {
              const I = item.icon;
              return (
                <Link key={i} href={item.href} style={{
                  padding: "14px", textDecoration: "none", display: "flex", flexDirection: "column", gap: 6,
                  borderRight: i < 2 ? "1px solid var(--border-subtle)" : "none",
                  transition: "background 150ms ease",
                }} onMouseEnter={e => { e.currentTarget.style.background = "var(--bg-elevated)"; }} onMouseLeave={e => { e.currentTarget.style.background = "transparent"; }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    <div style={{ width: 24, height: 24, borderRadius: "var(--radius-sm)", background: item.done ? "var(--success-surface)" : "var(--bg-elevated)", color: item.done ? "var(--success)" : item.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.65rem", fontWeight: 700 }}>
                      {item.done ? "✓" : <I size={12}/>}
                    </div>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: "var(--text-primary)" }}>{item.title}</span>
                  </div>
                  <p style={{ fontSize: "0.68rem", color: "var(--text-muted)", margin: 0, lineHeight: 1.4 }}>{item.desc}</p>
                </Link>
              );
            })}
          </div>
        </div>

        {/* Roles */}
        <div key="roles" className="glass-card" style={{ display: "flex", flexDirection: "column", overflow: "hidden" }}>
          <div style={{ padding: "10px 14px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between", flexShrink: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              {!locked && <div className="drag-handle" style={{ cursor: "grab", color: "var(--text-muted)", opacity: 0.5 }}><GripHorizontal size={12}/></div>}
              <Briefcase size={13} style={{ color: "var(--accent)" }}/>
              <h3 style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--text-primary)", fontFamily: "'Space Grotesk', sans-serif", margin: 0, textTransform: "uppercase", letterSpacing: "0.04em" }}>Roles</h3>
            </div>
            <Link href="/admin/roles" style={{ fontSize: "0.65rem", color: "var(--accent)", textDecoration: "none", fontWeight: 600 }}>Manage</Link>
          </div>
          <div style={{ flex: 1, padding: "8px 14px", overflowY: "auto" }}>
            {roles.map(r => (
              <div key={r.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid var(--border-subtle)" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 500, color: "var(--text-primary)" }}>{r.name}</span>
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <span style={{ fontSize: "0.65rem", color: "var(--text-muted)" }}>{r._count.roleScenarios} scn</span>
                  <span className="badge" style={{ background: "var(--accent-surface)", color: "var(--accent)", fontSize: "0.6rem" }}>{r._count.candidates}</span>
                </div>
              </div>
            ))}
            <div style={{ marginTop: 10, display: "flex", gap: 6 }}>
              {[
                { label: "Results", href: "/admin/results", icon: TrendingUp, c: "var(--success)" },
                { label: "Scenarios", href: "/admin/scenarios", icon: GitBranch, c: "var(--accent)" },
              ].map(a => {
                const I = a.icon;
                return (
                  <Link key={a.label} href={a.href} style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 4, padding: "6px", borderRadius: "var(--radius-md)", border: "1px solid var(--border-subtle)", textDecoration: "none", color: "var(--text-secondary)", fontSize: "0.68rem", fontWeight: 500, transition: "all 150ms ease" }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = "var(--border-default)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border-subtle)"; e.currentTarget.style.background = "transparent"; }}
                  ><I size={12} style={{ color: a.c }}/>{a.label}</Link>
                );
              })}
            </div>
          </div>
        </div>
      </ResponsiveGrid>
    </div>
  );
}
