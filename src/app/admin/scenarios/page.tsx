"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { TENETS, TENET_LABELS, type Tenet } from "@/types";
import { Sparkles, ChevronRight, Trash2, X } from "lucide-react";

interface Role { id: string; name: string; }

interface Scenario {
  id: string;
  title: string;
  stage: number;
  type: string;
  roleType: string | null;
  tenets: string[];
  isPublished: boolean;
  tree: unknown;
  scoringRubric: unknown;
  createdAt: string;
}

type StatusFilter = "all" | "published" | "draft";

const STAGE_META: Record<number, { label: string; subtitle: string; color: string; surface: string }> = {
  1: { label: "Stage 1 — Learn", subtitle: "Quick-fire games that reveal instincts", color: "var(--info)", surface: "var(--info-surface)" },
  2: { label: "Stage 2 — Build", subtitle: "Branching scenarios with real trade-offs", color: "var(--accent)", surface: "var(--accent-surface)" },
  3: { label: "Stage 3 — Grow", subtitle: "Role-specific challenges", color: "var(--cta)", surface: "var(--cta-glow)" },
};

export default function AdminScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  // AI Generate modal state
  const [roles, setRoles] = useState<Role[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [genStage, setGenStage] = useState<1 | 2 | 3>(2);
  const [genRoleType, setGenRoleType] = useState("general");
  const [genTenets, setGenTenets] = useState<Tenet[]>(["clientFocused", "empowering", "productive"]);

  useEffect(() => {
    fetchScenarios();
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then((data: Role[]) => setRoles(data))
      .catch(() => {});
  }, []);

  function toggleTenet(t: Tenet) {
    setGenTenets((prev) => prev.includes(t) ? prev.filter((x) => x !== t) : [...prev, t]);
  }

  function openModal() {
    setShowModal(true);
  }

  async function fetchScenarios() {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/scenarios");
      const data = await res.json();
      setScenarios(data);
    } catch (err) {
      console.error("Failed to fetch scenarios", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteScenario(s: Scenario) {
    const msg = `Delete scenario "${s.title}"?\n\nThis will detach it from all roles and permanently remove it. This cannot be undone.`;
    if (!confirm(msg)) return;
    try {
      const res = await fetch(`/api/admin/scenarios/${s.id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("Delete failed");
      await fetchScenarios();
    } catch (err) {
      console.error("Failed to delete scenario", err);
      alert("Failed to delete scenario.");
    }
  }

  async function handleAIGenerate() {
    if (genTenets.length === 0) {
      alert("Select at least one target tenet.");
      return;
    }
    setGenerating(true);
    try {
      const genRes = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ targetTenets: genTenets, roleType: genRoleType, stage: genStage }),
      });
      if (!genRes.ok) throw new Error("AI generation failed");
      const generated = await genRes.json();

      const saveRes = await fetch("/api/admin/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generated.title || "AI Generated Scenario",
          stage: generated.stage || genStage,
          type: generated.type || (genStage === 3 ? "role-specific" : "core"),
          roleType: generated.roleType || (genStage === 3 ? genRoleType : null),
          tree: generated.tree || { rootNodeId: "start", nodes: {} },
          tenets: generated.tenets || genTenets,
          scoringRubric: generated.scoringRubric || {},
          isPublished: false,
        }),
      });
      if (!saveRes.ok) throw new Error("Failed to save generated scenario");
      setShowModal(false);
      await fetchScenarios();
    } catch (err) {
      console.error("AI generation error", err);
      alert("Failed to generate scenario. Check console for details.");
    } finally {
      setGenerating(false);
    }
  }

  const { filtered, counts, grouped } = useMemo(() => {
    const filtered = scenarios.filter((s) => {
      if (status === "published" && !s.isPublished) return false;
      if (status === "draft" && s.isPublished) return false;
      return true;
    });

    const grouped: Record<number, Scenario[]> = { 1: [], 2: [], 3: [] };
    for (const s of filtered) {
      if (grouped[s.stage]) grouped[s.stage].push(s);
    }

    const counts = {
      all: scenarios.length,
      published: scenarios.filter((s) => s.isPublished).length,
      draft: scenarios.filter((s) => !s.isPublished).length,
    };

    return { filtered, counts, grouped };
  }, [scenarios, status]);

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
        <h2 style={{ fontSize: "1.35rem", fontWeight: 700, fontFamily: "var(--font-heading), 'Montserrat', sans-serif", color: "var(--text-primary)", margin: 0 }}>
          Scenarios
        </h2>
        <button
          onClick={openModal}
          className="btn-primary"
          style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
        >
          <Sparkles size={16} style={{ color: "var(--accent-light)" }} />
          AI Generate
        </button>
      </div>

      {/* Toolbar */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 24, flexWrap: "wrap" }}>
          {([
            { key: "all" as StatusFilter, label: `All · ${counts.all}` },
            { key: "published" as StatusFilter, label: `Published · ${counts.published}` },
            { key: "draft" as StatusFilter, label: `Draft · ${counts.draft}` },
          ]).map((c) => {
            const active = status === c.key;
            return (
              <button
                key={c.key}
                onClick={() => setStatus(c.key)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "var(--radius-full)",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all var(--transition-fast)",
                  background: active ? "var(--accent-surface)" : "transparent",
                  color: active ? "var(--accent)" : "var(--text-secondary)",
                  border: `1px solid ${active ? "var(--accent)" : "var(--border-default)"}`,
                }}
              >
                {c.label}
              </button>
            );
          })}
      </div>

      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 16 }}>
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="skeleton-pulse" style={{ height: 160, borderRadius: "var(--radius-lg)" }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "48px 24px" }}>
          <p style={{ color: "var(--text-primary)", fontSize: "0.86rem", fontWeight: 600, margin: "0 0 6px" }}>
            No scenarios match your filters
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.74rem", margin: 0 }}>
            {scenarios.length === 0
              ? 'Use "AI Generate" to create your first scenario.'
              : "Try a different status filter."}
          </p>
        </div>
      ) : (
        [1, 2, 3].map((stage) => {
          const list = grouped[stage];
          if (!list || list.length === 0) return null;
          const meta = STAGE_META[stage];
          const publishedCount = list.filter((s) => s.isPublished).length;
          return (
            <section key={stage} style={{ marginBottom: 32 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "14px 18px",
                  marginBottom: 16,
                  borderLeft: `4px solid ${meta.color}`,
                  borderRadius: 8,
                  background: `linear-gradient(90deg, ${meta.surface}, var(--bg-surface-solid) 80%)`,
                  border: `1px solid ${meta.color}`,
                  borderLeftWidth: 4,
                }}
              >
                <span
                  style={{
                    fontSize: "0.63rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#fff",
                    background: meta.color,
                    padding: "4px 10px",
                    borderRadius: "var(--radius-full)",
                    flexShrink: 0,
                  }}
                >
                  Stage {stage}
                </span>
                <h3 style={{ fontFamily: "var(--font-heading), 'Montserrat', sans-serif", fontSize: "1.08rem", fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                  {meta.label.split("— ")[1]}
                </h3>
                <span style={{ fontSize: "0.74rem", color: "var(--text-secondary)" }}>
                  {meta.subtitle}
                </span>
                <span style={{ marginLeft: "auto", fontSize: "0.68rem", fontWeight: 600, color: "var(--text-primary)", background: "var(--bg-elevated)", padding: "4px 12px", borderRadius: "var(--radius-full)", border: "1px solid var(--border-default)", whiteSpace: "nowrap" }}>
                  {list.length} · {publishedCount} published
                </span>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: 14 }}>
                {list.map((s) => (
                  <Link
                    key={s.id}
                    href={`/admin/scenarios/${s.id}`}
                    className="glass-card"
                    style={{
                      display: "block",
                      padding: 18,
                      textDecoration: "none",
                      transition: "all var(--transition-fast)",
                      alignSelf: "start",
                      borderTop: `2px solid ${meta.color}`,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.transform = "translateY(-2px)";
                      e.currentTarget.style.boxShadow = "var(--shadow-glow)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.transform = "translateY(0)";
                      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                    }}
                  >
                    <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 12, gap: 8 }}>
                      <h4 style={{ fontWeight: 600, fontSize: "0.86rem", color: "var(--text-primary)", lineHeight: 1.35, margin: 0, fontFamily: "var(--font-heading), 'Montserrat', sans-serif" }}>
                        {s.title}
                      </h4>
                      <div style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}>
                        <button
                          onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleDeleteScenario(s); }}
                          style={{ padding: 4, background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", borderRadius: "var(--radius-sm)", transition: "color var(--transition-fast)" }}
                          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--error)"; }}
                          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--text-muted)"; }}
                          title="Delete scenario"
                        >
                          <Trash2 size={13} />
                        </button>
                        <ChevronRight size={16} style={{ color: "var(--text-muted)" }} />
                      </div>
                    </div>

                    <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 6 }}>
                      <span className="badge" style={{ background: s.type === "core" ? "var(--info-surface)" : meta.surface, color: s.type === "core" ? "var(--info)" : meta.color, fontSize: "0.61rem" }}>
                        {s.type}
                      </span>
                      {s.roleType && (
                        <span className="badge" style={{ background: "var(--warning-surface)", color: "var(--warning)", fontSize: "0.61rem" }}>
                          {s.roleType}
                        </span>
                      )}
                      {!s.isPublished && (
                        <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-muted)", fontSize: "0.61rem", border: "1px dashed var(--border-default)" }}>
                          Draft
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          );
        })
      )}

      {/* AI Generate Modal */}
      {showModal && (
        <div
          onClick={() => !generating && setShowModal(false)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            zIndex: 100,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 20,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{ width: "100%", maxWidth: 520, padding: 24 }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                <Sparkles size={20} style={{ color: "var(--accent)" }} />
                <h3 style={{ fontSize: "1.1rem", fontWeight: 700, fontFamily: "var(--font-heading), 'Montserrat', sans-serif", color: "var(--text-primary)", margin: 0 }}>
                  Generate a scenario
                </h3>
              </div>
              <button
                onClick={() => !generating && setShowModal(false)}
                disabled={generating}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", padding: 4 }}
                aria-label="Close"
              >
                <X size={18} />
              </button>
            </div>

            {/* Stage */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>Stage</label>
              <div style={{ display: "flex", gap: 6 }}>
                {([1, 2, 3] as const).map((st) => {
                  const m = STAGE_META[st];
                  const active = genStage === st;
                  return (
                    <button
                      key={st}
                      onClick={() => setGenStage(st)}
                      style={{
                        flex: 1,
                        padding: "10px 12px",
                        borderRadius: "var(--radius-md)",
                        fontSize: "0.8rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        textAlign: "left",
                        background: active ? m.surface : "transparent",
                        color: active ? m.color : "var(--text-secondary)",
                        border: `1px solid ${active ? m.color : "var(--border-default)"}`,
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      <div style={{ fontWeight: 700 }}>Stage {st}</div>
                      <div style={{ fontSize: "0.66rem", opacity: 0.75, marginTop: 2 }}>{m.label.split("— ")[1]}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Role */}
            <div style={{ marginBottom: 18 }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Role {genStage === 3 && <span style={{ color: "var(--cta)" }}>· required for Stage 3</span>}
              </label>
              <input
                type="text"
                list="role-suggestions"
                value={genRoleType}
                onChange={(e) => setGenRoleType(e.target.value)}
                placeholder="e.g. engineering, sales, general"
                className="input-field"
                style={{ width: "100%", fontSize: "0.85rem" }}
              />
              <datalist id="role-suggestions">
                <option value="general" />
                {roles.map((r) => (
                  <option key={r.id} value={r.name.toLowerCase()} />
                ))}
              </datalist>
            </div>

            {/* Tenets */}
            <div style={{ marginBottom: 22 }}>
              <label style={{ display: "block", fontSize: "0.72rem", fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 8 }}>
                Target tenets · {genTenets.length} selected
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                {TENETS.map((t) => {
                  const active = genTenets.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => toggleTenet(t)}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.72rem",
                        fontWeight: 600,
                        cursor: "pointer",
                        background: active ? "var(--accent-surface)" : "transparent",
                        color: active ? "var(--accent)" : "var(--text-secondary)",
                        border: `1px solid ${active ? "var(--accent)" : "var(--border-default)"}`,
                        transition: "all var(--transition-fast)",
                      }}
                    >
                      {TENET_LABELS[t]}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 8 }}>
              <button
                onClick={() => setShowModal(false)}
                disabled={generating}
                className="btn-ghost"
                style={{ fontSize: "0.82rem" }}
              >
                Cancel
              </button>
              <button
                onClick={handleAIGenerate}
                disabled={generating || genTenets.length === 0 || !genRoleType.trim()}
                className="btn-primary"
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.82rem", opacity: (generating || genTenets.length === 0 || !genRoleType.trim()) ? 0.5 : 1 }}
              >
                <Sparkles size={14} />
                {generating ? "Generating..." : "Generate"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
