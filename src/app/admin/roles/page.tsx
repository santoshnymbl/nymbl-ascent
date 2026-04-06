"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Briefcase, Pencil, Trash2, X, AlertCircle, Upload, FileText, HelpCircle, Info, ChevronDown, ChevronUp, Layers, Check, Sparkles } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface ScenarioRow {
  id: string;
  title: string;
  stage: number;
  type: string;
  roleType: string | null;
  isPublished: boolean;
}

interface Role {
  id: string;
  name: string;
  description: string;
  jobDescription: string;
  corePoolSize: number;
  createdAt: string;
  _count: { candidates: number; roleScenarios: number };
}

const emptyForm = { name: "", description: "", jobDescription: "", corePoolSize: 2, autoGenerateStage3: false };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedJd, setExpandedJd] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Manage Scenarios modal state
  const [manageRole, setManageRole] = useState<Role | null>(null);
  const [allScenarios, setAllScenarios] = useState<ScenarioRow[]>([]);
  const [attachedIds, setAttachedIds] = useState<Set<string>>(new Set());
  const [manageLoading, setManageLoading] = useState(false);
  const [manageSaving, setManageSaving] = useState(false);

  async function fetchRoles() {
    try {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      setRoles(await res.json());
    } catch { setError("Failed to load roles."); }
    finally { setLoading(false); }
  }

  useEffect(() => { fetchRoles(); }, []);

  function openAdd() { setEditingId(null); setForm(emptyForm); setShowForm(true); setError(null); }
  function openEdit(role: Role) {
    setEditingId(role.id);
    setForm({ name: role.name, description: role.description, jobDescription: role.jobDescription || "", corePoolSize: role.corePoolSize, autoGenerateStage3: false });
    setShowForm(true); setError(null);
  }
  function closeForm() { setShowForm(false); setEditingId(null); setForm(emptyForm); setError(null); }

  function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.match(/\.(txt|md|doc|docx|pdf)$/i)) {
      setError("Supported formats: .txt, .md, .doc, .docx, .pdf");
      return;
    }
    // For MVP, read as text (works for .txt and .md)
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (text) setForm((prev) => ({ ...prev, jobDescription: text }));
    };
    reader.readAsText(file);
    // Reset input so same file can be re-uploaded
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) { setError("Role name is required."); return; }
    setSaving(true); setError(null);
    try {
      const isEdit = editingId !== null;
      const res = await fetch("/api/admin/roles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isEdit ? { id: editingId, ...form, corePoolSize: Number(form.corePoolSize) } : { ...form, corePoolSize: Number(form.corePoolSize) }),
      });
      if (!res.ok) { const body = await res.json(); throw new Error(body.error || "Save failed"); }
      const created = await res.json();
      if (!isEdit && created.stage3Error) {
        setError(`Role created, but Stage 3 generation failed: ${created.stage3Error}`);
      }
      if (!isEdit && created.stage3Generated) {
        // surface success briefly via error slot styled as info; simpler: alert
        console.log("Stage 3 scenario auto-generated:", created.stage3Generated.title);
      }
      closeForm(); await fetchRoles();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function openManage(role: Role) {
    setManageRole(role);
    setManageLoading(true);
    setError(null);
    try {
      const [scenariosRes, attachedRes] = await Promise.all([
        fetch("/api/admin/scenarios"),
        fetch(`/api/admin/roles/${role.id}/scenarios`),
      ]);
      if (!scenariosRes.ok || !attachedRes.ok) throw new Error("Failed to load scenarios");
      const scenarios: ScenarioRow[] = await scenariosRes.json();
      const { scenarioIds } = await attachedRes.json();
      setAllScenarios(scenarios.filter((s) => s.stage === 2 || s.stage === 3));
      setAttachedIds(new Set(scenarioIds));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load scenarios");
      setManageRole(null);
    } finally {
      setManageLoading(false);
    }
  }

  function closeManage() {
    setManageRole(null);
    setAllScenarios([]);
    setAttachedIds(new Set());
  }

  function toggleAttached(id: string) {
    setAttachedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  async function saveAttachments() {
    if (!manageRole) return;
    setManageSaving(true);
    try {
      const res = await fetch(`/api/admin/roles/${manageRole.id}/scenarios`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ scenarioIds: Array.from(attachedIds) }),
      });
      if (!res.ok) throw new Error("Failed to save");
      closeManage();
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save");
    } finally {
      setManageSaving(false);
    }
  }

  async function handleDelete(role: Role) {
    const candidateCount = role._count.candidates;
    const scenarioCount = role._count.roleScenarios;
    const warning =
      candidateCount > 0
        ? `Delete role "${role.name}"?\n\n⚠️ This will PERMANENTLY DELETE:\n  • ${candidateCount} candidate${candidateCount === 1 ? "" : "s"} (and their assessment data + scores)\n  • ${scenarioCount} scenario attachment${scenarioCount === 1 ? "" : "s"}\n\nThis cannot be undone.`
        : `Delete role "${role.name}"?\n\nThis will remove ${scenarioCount} scenario attachment${scenarioCount === 1 ? "" : "s"}. This cannot be undone.`;
    if (!confirm(warning)) return;
    try {
      const res = await fetch("/api/admin/roles", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: role.id }) });
      if (!res.ok) { const body = await res.json(); throw new Error(body.error || "Delete failed"); }
      await fetchRoles();
    } catch (err) { setError(err instanceof Error ? err.message : "Delete failed"); }
  }

  return (
    <div>
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 24 }}>
        <h2 style={{ fontSize: "1.5rem", fontWeight: 700, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)" }}>
          Roles{!loading && ` (${roles.length})`}
        </h2>
        <button onClick={showForm ? closeForm : openAdd} className={showForm ? "btn-ghost" : "btn-primary"} style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
          {showForm ? <><X size={16} /> Cancel</> : <><Plus size={16} /> Add Role</>}
        </button>
      </div>

      {/* Error */}
      {error && (
        <div style={{ marginBottom: 16, padding: 12, background: "var(--error-surface)", border: "1px solid var(--error)", color: "var(--error)", borderRadius: "var(--radius-md)", fontSize: "0.875rem", display: "flex", alignItems: "center", gap: 8 }}>
          <AlertCircle size={16} style={{ flexShrink: 0 }} /> {error}
        </div>
      )}

      {/* Form */}
      {showForm && (
        <form onSubmit={handleSubmit} className="glass-card" style={{ marginBottom: 24, padding: 24 }}>
          <h3 style={{ fontSize: "1.125rem", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)", marginBottom: 20 }}>
            {editingId ? "Edit Role" : "New Role"}
          </h3>

          {/* Row 1: Name + Description */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                Role Name <span style={{ color: "var(--error)" }}>*</span>
              </label>
              <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" placeholder="e.g. Frontend Engineer" required />
            </div>
            <div>
              <label style={{ display: "block", fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 4 }}>
                Short Description
              </label>
              <input type="text" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input-field" placeholder="e.g. Build user-facing web applications" />
            </div>
          </div>

          {/* Row 2: Job Description */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
              <label style={{ fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", display: "flex", alignItems: "center", gap: 4 }}>
                <FileText size={14} /> Job Description
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input ref={fileRef} type="file" accept=".txt,.md,.doc,.docx,.pdf" onChange={handleFileUpload} style={{ display: "none" }} />
                <button type="button" onClick={() => fileRef.current?.click()} className="btn-ghost" style={{ fontSize: "0.75rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: 4 }}>
                  <Upload size={13} /> Upload File
                </button>
              </div>
            </div>
            <textarea
              value={form.jobDescription}
              onChange={(e) => setForm({ ...form, jobDescription: e.target.value })}
              className="input-field"
              placeholder="Paste the full job description here, or upload a file above..."
              rows={6}
              style={{ resize: "vertical", fontFamily: "'DM Sans', sans-serif", lineHeight: 1.6 }}
            />
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 4 }}>
              The job description helps contextualize the assessment. Supports .txt and .md files for upload.
            </p>

            {/* Auto-generate Stage 3 toggle (new roles only) */}
            {!editingId && (
              <label
                style={{
                  display: "flex", alignItems: "flex-start", gap: 10,
                  marginTop: 12, padding: "12px 14px",
                  borderRadius: "var(--radius-md)",
                  background: form.autoGenerateStage3 ? "var(--accent-surface)" : "var(--bg-elevated)",
                  border: `1px solid ${form.autoGenerateStage3 ? "var(--accent)" : "var(--border-subtle)"}`,
                  cursor: form.jobDescription.trim().length >= 50 ? "pointer" : "not-allowed",
                  opacity: form.jobDescription.trim().length >= 50 ? 1 : 0.55,
                  transition: "all 150ms ease",
                }}
              >
                <input
                  type="checkbox"
                  checked={form.autoGenerateStage3}
                  disabled={form.jobDescription.trim().length < 50}
                  onChange={(e) => setForm({ ...form, autoGenerateStage3: e.target.checked })}
                  style={{ marginTop: 3, accentColor: "var(--accent)", cursor: "inherit" }}
                />
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.82rem", fontWeight: 600, color: "var(--text-primary)", display: "flex", alignItems: "center", gap: 6 }}>
                    <Sparkles size={14} style={{ color: "var(--cta)" }} />
                    Auto-generate Stage 3 challenge from JD
                  </div>
                  <p style={{ fontSize: "0.72rem", color: "var(--text-secondary)", marginTop: 4, lineHeight: 1.5 }}>
                    Uses Claude to design a role-specific branching scenario tailored to this JD, then auto-attaches it. Requires ANTHROPIC_API_KEY in <code style={{ fontFamily: "monospace", color: "var(--accent)" }}>.env.local</code>. JD must be 50+ characters.
                  </p>
                </div>
              </label>
            )}
          </div>

          {/* Row 3: Core Pool Size with explanation */}
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.82rem", fontWeight: 500, color: "var(--text-secondary)", marginBottom: 6 }}>
              Core Pool Size
              <Tooltip content="How many Stage 2 scenarios each candidate gets" position="right">
                <HelpCircle size={14} style={{ color: "var(--text-muted)", cursor: "help" }} />
              </Tooltip>
            </label>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <input type="number" min={1} max={10} value={form.corePoolSize} onChange={(e) => setForm({ ...form, corePoolSize: Number(e.target.value) })} className="input-field" style={{ width: 80 }} />
              <div style={{ padding: "10px 14px", borderRadius: "var(--radius-md)", background: "var(--info-surface)", border: "1px solid rgba(59,130,246,0.2)", flex: 1 }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <Info size={16} style={{ color: "var(--info)", flexShrink: 0, marginTop: 2 }} />
                  <div style={{ fontSize: "0.75rem", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                    <strong style={{ color: "var(--text-primary)" }}>What is this?</strong> Each candidate gets <strong>{form.corePoolSize}</strong> randomly selected scenario{form.corePoolSize !== 1 ? "s" : ""} from
                    the available pool in Stage 2. Higher = more thorough assessment but takes longer. Recommended: <strong>2-3</strong> for most roles.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: 12 }}>
            <button type="submit" disabled={saving} className="btn-primary" style={{ opacity: saving ? 0.5 : 1 }}>
              {saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}
            </button>
            <button type="button" onClick={closeForm} className="btn-ghost">Cancel</button>
          </div>
        </form>
      )}

      {/* Loading */}
      {loading ? (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: 16 }}>
          {[1, 2, 3].map((i) => <div key={i} className="skeleton-pulse" style={{ height: 200, borderRadius: "var(--radius-lg)" }} />)}
        </div>
      ) : roles.length === 0 ? (
        <div className="glass-card" style={{ textAlign: "center", padding: "64px 24px" }}>
          <Briefcase size={48} style={{ margin: "0 auto 16px", color: "var(--text-muted)", display: "block" }} />
          <p style={{ color: "var(--text-primary)", fontSize: "1.125rem", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif" }}>No roles yet</p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: 8, marginBottom: 24 }}>Create your first role to start inviting candidates.</p>
          <button onClick={openAdd} className="btn-cta" style={{ display: "inline-flex", alignItems: "center", gap: 8 }}><Plus size={16} /> Create your first role</button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: 16 }}>
          {roles.map((role) => (
            <div key={role.id} className="glass-card" style={{ padding: 20 }}>
              {/* Header */}
              <div style={{ display: "flex", alignItems: "flex-start", gap: 12, marginBottom: 12 }}>
                <div style={{ width: 36, height: 36, borderRadius: "var(--radius-md)", background: "var(--accent-surface)", color: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Briefcase size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3 style={{ fontSize: "1rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{role.name}</h3>
                  {role.description && <p style={{ fontSize: "0.82rem", color: "var(--text-secondary)", marginTop: 2 }}>{role.description}</p>}
                </div>
              </div>

              {/* Badges */}
              <div style={{ display: "flex", flexWrap: "wrap", gap: 8, marginBottom: 12 }}>
                <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  {role._count.candidates} {role._count.candidates === 1 ? "candidate" : "candidates"}
                </span>
                <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  {role._count.roleScenarios} {role._count.roleScenarios === 1 ? "scenario" : "scenarios"}
                </span>
                <Tooltip content={`Each candidate gets ${role.corePoolSize} random scenario(s) in Stage 2`}>
                  <span className="badge" style={{ background: "var(--accent-surface)", color: "var(--accent)", cursor: "help" }}>
                    Pool: {role.corePoolSize}
                  </span>
                </Tooltip>
              </div>

              {/* Job Description preview */}
              {role.jobDescription && (
                <div style={{ marginBottom: 12 }}>
                  <button
                    onClick={() => setExpandedJd(expandedJd === role.id ? null : role.id)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: "0.75rem", fontWeight: 500, color: "var(--accent)", background: "none", border: "none", cursor: "pointer", padding: 0 }}
                  >
                    <FileText size={13} />
                    Job Description
                    {expandedJd === role.id ? <ChevronUp size={13} /> : <ChevronDown size={13} />}
                  </button>
                  {expandedJd === role.id && (
                    <div style={{ marginTop: 8, padding: 12, borderRadius: "var(--radius-md)", background: "var(--bg-elevated)", border: "1px solid var(--border-subtle)", fontSize: "0.78rem", color: "var(--text-secondary)", lineHeight: 1.6, maxHeight: 200, overflowY: "auto", whiteSpace: "pre-wrap" }}>
                      {role.jobDescription}
                    </div>
                  )}
                </div>
              )}

              {/* Actions */}
              <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border-subtle)", flexWrap: "wrap" }}>
                <button onClick={() => openManage(role)} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", padding: "6px 12px", color: "var(--accent)" }}>
                  <Layers size={14} /> Manage Scenarios
                </button>
                <button onClick={() => openEdit(role)} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", padding: "6px 12px" }}>
                  <Pencil size={14} /> Edit
                </button>
                <button onClick={() => handleDelete(role)} className="btn-ghost" style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: "0.75rem", padding: "6px 12px", color: "var(--error)" }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Manage Scenarios Modal */}
      {manageRole && (
        <div
          onClick={closeManage}
          style={{
            position: "fixed", inset: 0, zIndex: 100,
            background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)",
            display: "flex", alignItems: "center", justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{
              width: "100%", maxWidth: 720, maxHeight: "85vh",
              display: "flex", flexDirection: "column",
              padding: 0, background: "var(--bg-surface-solid)",
            }}
          >
            {/* Header */}
            <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border-subtle)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
              <div>
                <h3 style={{ fontSize: "1.125rem", fontWeight: 600, fontFamily: "'Space Grotesk', sans-serif", color: "var(--text-primary)", margin: 0 }}>
                  Manage Scenarios
                </h3>
                <p style={{ fontSize: "0.8rem", color: "var(--text-muted)", marginTop: 2 }}>
                  Attach scenarios to <strong style={{ color: "var(--accent)" }}>{manageRole.name}</strong>. Stage 2 picks {manageRole.corePoolSize} at random from attached Stage 2 scenarios.
                </p>
              </div>
              <button onClick={closeManage} className="btn-ghost" style={{ padding: 6 }}>
                <X size={18} />
              </button>
            </div>

            {/* Body */}
            <div style={{ flex: 1, overflowY: "auto", padding: 24 }}>
              {manageLoading ? (
                <p style={{ color: "var(--text-muted)", textAlign: "center", padding: 40 }}>Loading scenarios...</p>
              ) : allScenarios.length === 0 ? (
                <div style={{ textAlign: "center", padding: 40 }}>
                  <Layers size={40} style={{ color: "var(--text-muted)", margin: "0 auto 12px", display: "block" }} />
                  <p style={{ color: "var(--text-primary)", fontWeight: 600 }}>No Stage 2 or 3 scenarios exist yet</p>
                  <p style={{ color: "var(--text-muted)", fontSize: "0.82rem", marginTop: 4 }}>Create some in the Scenarios page first.</p>
                </div>
              ) : (
                <>
                  {[2, 3].map((stage) => {
                    const stageScenarios = allScenarios.filter((s) => s.stage === stage);
                    if (stageScenarios.length === 0) return null;
                    return (
                      <div key={stage} style={{ marginBottom: 20 }}>
                        <h4 style={{ fontSize: "0.75rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 10 }}>
                          Stage {stage} {stage === 2 ? "— Build (Branching Scenarios)" : "— Grow (Role-Specific Challenge)"}
                        </h4>
                        <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                          {stageScenarios.map((s) => {
                            const checked = attachedIds.has(s.id);
                            return (
                              <button
                                key={s.id}
                                type="button"
                                onClick={() => toggleAttached(s.id)}
                                style={{
                                  display: "flex", alignItems: "center", gap: 12,
                                  padding: "12px 14px",
                                  background: checked ? "var(--accent-surface)" : "var(--bg-elevated)",
                                  border: `1px solid ${checked ? "var(--accent)" : "var(--border-subtle)"}`,
                                  borderRadius: "var(--radius-md)",
                                  cursor: "pointer", textAlign: "left",
                                  transition: "all 150ms ease",
                                }}
                              >
                                <div style={{
                                  width: 20, height: 20, borderRadius: 4,
                                  border: `2px solid ${checked ? "var(--accent)" : "var(--border-strong)"}`,
                                  background: checked ? "var(--accent)" : "transparent",
                                  display: "flex", alignItems: "center", justifyContent: "center",
                                  flexShrink: 0,
                                }}>
                                  {checked && <Check size={13} style={{ color: "#fff" }} strokeWidth={3} />}
                                </div>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                  <div style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--text-primary)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {s.title}
                                  </div>
                                  <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginTop: 2, display: "flex", gap: 8 }}>
                                    <span>{s.type}</span>
                                    {s.roleType && <span>• {s.roleType}</span>}
                                    {!s.isPublished && <span style={{ color: "var(--warning)" }}>• unpublished</span>}
                                  </div>
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* Footer */}
            <div style={{ padding: "16px 24px", borderTop: "1px solid var(--border-subtle)", display: "flex", gap: 12, justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                {attachedIds.size} scenario{attachedIds.size !== 1 ? "s" : ""} selected
              </span>
              <div style={{ display: "flex", gap: 12 }}>
                <button onClick={closeManage} className="btn-ghost">Cancel</button>
                <button onClick={saveAttachments} disabled={manageSaving || manageLoading} className="btn-primary" style={{ opacity: manageSaving ? 0.5 : 1 }}>
                  {manageSaving ? "Saving..." : "Save Attachments"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
