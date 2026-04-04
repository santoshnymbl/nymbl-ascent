"use client";

import { useEffect, useState } from "react";
import { Plus, Briefcase, Pencil, Trash2, X, AlertCircle } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface Role {
  id: string;
  name: string;
  description: string;
  corePoolSize: number;
  createdAt: string;
  _count: { candidates: number; roleScenarios: number };
}

const emptyForm = { name: "", description: "", corePoolSize: 2 };

export default function RolesPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function fetchRoles() {
    try {
      const res = await fetch("/api/admin/roles");
      if (!res.ok) throw new Error("Failed to fetch roles");
      const data: Role[] = await res.json();
      setRoles(data);
    } catch (err) {
      console.error(err);
      setError("Failed to load roles.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchRoles();
  }, []);

  function openAdd() {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
    setError(null);
  }

  function openEdit(role: Role) {
    setEditingId(role.id);
    setForm({
      name: role.name,
      description: role.description,
      corePoolSize: role.corePoolSize,
    });
    setShowForm(true);
    setError(null);
  }

  function closeForm() {
    setShowForm(false);
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!form.name.trim()) {
      setError("Role name is required.");
      return;
    }

    setSaving(true);
    setError(null);

    try {
      const isEdit = editingId !== null;
      const res = await fetch("/api/admin/roles", {
        method: isEdit ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          isEdit
            ? { id: editingId, ...form, corePoolSize: Number(form.corePoolSize) }
            : { ...form, corePoolSize: Number(form.corePoolSize) }
        ),
      });

      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Save failed");
      }

      closeForm();
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(role: Role) {
    if (!confirm(`Delete role "${role.name}"? This cannot be undone.`)) return;

    try {
      const res = await fetch("/api/admin/roles", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: role.id }),
      });
      if (!res.ok) {
        const body = await res.json();
        throw new Error(body.error || "Delete failed");
      }
      await fetchRoles();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            fontFamily: "var(--font-heading), 'Space Grotesk', sans-serif",
            color: "var(--text-primary)",
          }}
        >
          Roles{!loading && ` (${roles.length})`}
        </h2>
        <button
          onClick={showForm ? closeForm : openAdd}
          className={showForm ? "btn-ghost" : "btn-primary"}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {showForm ? (
            <>
              <X size={16} />
              Cancel
            </>
          ) : (
            <>
              <Plus size={16} />
              Add Role
            </>
          )}
        </button>
      </div>

      {error && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: "var(--error-surface)",
            border: "1px solid var(--error)",
            color: "var(--error)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <AlertCircle size={16} style={{ flexShrink: 0 }} />
          {error}
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="glass-card"
          style={{ marginBottom: 24, padding: 24 }}
        >
          <h3
            style={{
              fontSize: "1.125rem",
              fontWeight: 600,
              fontFamily: "var(--font-heading), 'Space Grotesk', sans-serif",
              color: "var(--text-primary)",
              marginBottom: 16,
            }}
          >
            {editingId ? "Edit Role" : "New Role"}
          </h3>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
              gap: 16,
            }}
          >
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 4,
                }}
              >
                Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="input-field"
                placeholder="e.g. Frontend Engineer"
                required
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "0.875rem",
                  fontWeight: 500,
                  color: "var(--text-secondary)",
                  marginBottom: 4,
                }}
              >
                Description
              </label>
              <input
                type="text"
                value={form.description}
                onChange={(e) =>
                  setForm({ ...form, description: e.target.value })
                }
                className="input-field"
                placeholder="Brief description"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <Tooltip
                content="Number of core scenarios randomly assigned per candidate"
                position="top"
              >
                <label
                  style={{
                    display: "block",
                    fontSize: "0.875rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                    cursor: "help",
                    borderBottom: "1px dashed var(--border-default)",
                    width: "fit-content",
                  }}
                >
                  Core Pool Size
                </label>
              </Tooltip>
              <input
                type="number"
                min={1}
                value={form.corePoolSize}
                onChange={(e) =>
                  setForm({ ...form, corePoolSize: Number(e.target.value) })
                }
                className="input-field"
                style={{ width: "100%" }}
              />
            </div>
          </div>
          <div style={{ marginTop: 16, display: "flex", gap: 12 }}>
            <button
              type="submit"
              disabled={saving}
              className="btn-primary"
              style={{ opacity: saving ? 0.5 : 1 }}
            >
              {saving ? "Saving..." : editingId ? "Update Role" : "Create Role"}
            </button>
            <button type="button" onClick={closeForm} className="btn-ghost">
              Cancel
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="skeleton-pulse"
              style={{
                height: 180,
                borderRadius: "var(--radius-lg)",
              }}
            />
          ))}
        </div>
      ) : roles.length === 0 ? (
        <div
          className="glass-card"
          style={{ textAlign: "center", padding: "64px 24px" }}
        >
          <Briefcase
            size={48}
            style={{
              margin: "0 auto 16px",
              color: "var(--text-muted)",
              display: "block",
            }}
          />
          <p
            style={{
              color: "var(--text-primary)",
              fontSize: "1.125rem",
              fontWeight: 600,
              fontFamily: "var(--font-heading), 'Space Grotesk', sans-serif",
            }}
          >
            No roles yet
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              marginTop: 8,
              marginBottom: 24,
            }}
          >
            Create your first role to start inviting candidates.
          </p>
          <button
            onClick={openAdd}
            className="btn-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <Plus size={16} />
            Create your first role
          </button>
        </div>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 16,
          }}
        >
          {roles.map((role) => (
            <div
              key={role.id}
              className="glass-card"
              style={{
                padding: 20,
                transition: "box-shadow var(--transition-fast)",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-glow)";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.boxShadow = "var(--shadow-sm)";
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 12,
                  marginBottom: 12,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-md)",
                    background: "var(--accent-surface)",
                    color: "var(--accent)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Briefcase size={18} />
                </div>
                <div style={{ minWidth: 0 }}>
                  <h3
                    style={{
                      fontSize: "1rem",
                      fontWeight: 600,
                      color: "var(--text-primary)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {role.name}
                  </h3>
                  {role.description && (
                    <p
                      style={{
                        fontSize: "0.875rem",
                        color: "var(--text-secondary)",
                        marginTop: 2,
                        display: "-webkit-box",
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: "vertical",
                        overflow: "hidden",
                      }}
                    >
                      {role.description}
                    </p>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  marginBottom: 12,
                }}
              >
                <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  {role._count.candidates}{" "}
                  {role._count.candidates === 1 ? "candidate" : "candidates"}
                </span>
                <span className="badge" style={{ background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>
                  {role._count.roleScenarios}{" "}
                  {role._count.roleScenarios === 1 ? "scenario" : "scenarios"}
                </span>
                <Tooltip content="Number of core scenarios randomly assigned per candidate">
                  <span
                    className="badge"
                    style={{
                      background: "var(--accent-surface)",
                      color: "var(--accent)",
                      cursor: "help",
                    }}
                  >
                    Pool: {role.corePoolSize}
                  </span>
                </Tooltip>
              </div>

              <div
                style={{
                  display: "flex",
                  gap: 8,
                  paddingTop: 12,
                  borderTop: "1px solid var(--border-subtle)",
                }}
              >
                <button
                  onClick={() => openEdit(role)}
                  className="btn-ghost"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.75rem",
                    padding: "6px 12px",
                  }}
                >
                  <Pencil size={14} />
                  Edit
                </button>
                <button
                  onClick={() => handleDelete(role)}
                  className="btn-ghost"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 6,
                    fontSize: "0.75rem",
                    padding: "6px 12px",
                    color: "var(--error)",
                  }}
                >
                  <Trash2 size={14} />
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
