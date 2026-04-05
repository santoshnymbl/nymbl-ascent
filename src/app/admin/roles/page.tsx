"use client";

import { useEffect, useState, useRef } from "react";
import { Plus, Briefcase, Pencil, Trash2, X, AlertCircle, Upload, FileText, HelpCircle, Info, ChevronDown, ChevronUp } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface Role {
  id: string;
  name: string;
  description: string;
  jobDescription: string;
  corePoolSize: number;
  createdAt: string;
  _count: { candidates: number; roleScenarios: number };
}

const emptyForm = { name: "", description: "", jobDescription: "", corePoolSize: 2 };

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
    setForm({ name: role.name, description: role.description, jobDescription: role.jobDescription || "", corePoolSize: role.corePoolSize });
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
      closeForm(); await fetchRoles();
    } catch (err) { setError(err instanceof Error ? err.message : "Save failed"); }
    finally { setSaving(false); }
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;
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
              <div style={{ display: "flex", gap: 8, paddingTop: 12, borderTop: "1px solid var(--border-subtle)" }}>
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
    </div>
  );
}
