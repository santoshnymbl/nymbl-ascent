"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Link2,
  Plus,
  Copy,
  Check,
  Pencil,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { Select } from "@/components/ui/Select";

interface Role {
  id: string;
  name: string;
}

interface AssessmentLinkRow {
  id: string;
  code: string;
  role: { id: string; name: string };
  expiresAt: string | null;
  maxRegistrations: number | null;
  registrationCount: number;
  allowedDomains: string | null;
  isActive: boolean;
  createdAt: string;
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function defaultExpiry(): string {
  const d = new Date();
  d.setDate(d.getDate() + 30);
  return d.toISOString().slice(0, 10);
}

function linkStatus(link: AssessmentLinkRow): {
  label: string;
  color: string;
  bg: string;
} {
  if (!link.isActive) {
    return { label: "Revoked", color: "var(--error)", bg: "var(--error-surface)" };
  }
  if (link.expiresAt && new Date(link.expiresAt) < new Date()) {
    return {
      label: "Expired",
      color: "var(--warning)",
      bg: "var(--warning-surface)",
    };
  }
  if (
    link.maxRegistrations !== null &&
    link.registrationCount >= link.maxRegistrations
  ) {
    return { label: "Full", color: "var(--warning)", bg: "var(--warning-surface)" };
  }
  return {
    label: "Active",
    color: "var(--success)",
    bg: "var(--success-surface)",
  };
}

interface Props {
  roles: Role[];
}

export default function AssessmentLinksSection({ roles }: Props) {
  const [expanded, setExpanded] = useState(false);
  const [links, setLinks] = useState<AssessmentLinkRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  /* create form */
  const [createRoleId, setCreateRoleId] = useState("");
  const [createCode, setCreateCode] = useState("");
  const [createExpiry, setCreateExpiry] = useState(defaultExpiry());
  const [createMaxReg, setCreateMaxReg] = useState("");
  const [createDomains, setCreateDomains] = useState("");
  const [creating, setCreating] = useState(false);

  /* edit modal */
  const [editLink, setEditLink] = useState<AssessmentLinkRow | null>(null);
  const [editExpiry, setEditExpiry] = useState("");
  const [editMaxReg, setEditMaxReg] = useState("");
  const [editDomains, setEditDomains] = useState("");
  const [editSaving, setEditSaving] = useState(false);

  /* copy feedback */
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const fetchLinks = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/assessment-links");
      if (!res.ok) throw new Error("Failed to fetch");
      const data = await res.json();
      setLinks(data);
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Failed to load links" });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (expanded) fetchLinks();
  }, [expanded, fetchLinks]);

  /* auto-slug code from role name */
  useEffect(() => {
    const role = roles.find((r) => r.id === createRoleId);
    if (role) {
      setCreateCode(slugify(role.name));
    }
  }, [createRoleId, roles]);

  async function handleCreate() {
    if (!createRoleId) {
      setMsg({ type: "error", text: "Select a role." });
      return;
    }
    if (!createCode.trim()) {
      setMsg({ type: "error", text: "Enter a link code." });
      return;
    }
    setCreating(true);
    setMsg(null);
    try {
      const body: Record<string, unknown> = {
        code: createCode.trim(),
        roleId: createRoleId,
      };
      if (createExpiry) body.expiresAt = new Date(createExpiry).toISOString();
      if (createMaxReg) body.maxRegistrations = parseInt(createMaxReg, 10);
      if (createDomains.trim()) body.allowedDomains = createDomains.trim();

      const res = await fetch("/api/admin/assessment-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Create failed");
      }
      setMsg({ type: "success", text: "Link created." });
      setCreateRoleId("");
      setCreateCode("");
      setCreateExpiry(defaultExpiry());
      setCreateMaxReg("");
      setCreateDomains("");
      await fetchLinks();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Create failed" });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(link: AssessmentLinkRow) {
    try {
      const res = await fetch(`/api/admin/assessment-links/${link.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !link.isActive }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      setMsg({
        type: "success",
        text: `Link ${link.isActive ? "revoked" : "activated"}.`,
      });
      await fetchLinks();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    }
  }

  async function handleDelete(link: AssessmentLinkRow) {
    if (!confirm(`Delete link "${link.code}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/admin/assessment-links/${link.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      setMsg({ type: "success", text: `Link "${link.code}" deleted.` });
      await fetchLinks();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Delete failed" });
    }
  }

  async function handleCopy(link: AssessmentLinkRow) {
    const url = `${window.location.origin}/apply/${link.code}`;
    await navigator.clipboard.writeText(url);
    setCopiedId(link.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function openEdit(link: AssessmentLinkRow) {
    setEditLink(link);
    setEditExpiry(link.expiresAt ? link.expiresAt.slice(0, 10) : "");
    setEditMaxReg(link.maxRegistrations !== null ? String(link.maxRegistrations) : "");
    setEditDomains(link.allowedDomains ?? "");
    setEditSaving(false);
  }

  async function handleEditSave() {
    if (!editLink) return;
    setEditSaving(true);
    try {
      const body: Record<string, unknown> = {};
      body.expiresAt = editExpiry ? new Date(editExpiry).toISOString() : null;
      body.maxRegistrations = editMaxReg ? parseInt(editMaxReg, 10) : null;
      body.allowedDomains = editDomains.trim() || null;

      const res = await fetch(`/api/admin/assessment-links/${editLink.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Update failed");
      }
      setMsg({ type: "success", text: "Link updated." });
      setEditLink(null);
      await fetchLinks();
    } catch (err) {
      setMsg({ type: "error", text: err instanceof Error ? err.message : "Update failed" });
    } finally {
      setEditSaving(false);
    }
  }

  return (
    <>
      {/* Toggle button */}
      <button
        onClick={() => setExpanded((v) => !v)}
        className="btn-cta"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 8,
          background: "var(--bg-elevated)",
          color: "var(--text-primary)",
          border: "1px solid var(--border-default)",
          boxShadow: "none",
        }}
      >
        <Link2 size={16} />
        Public Links
        {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {/* Expanded panel — rendered as a sibling outside the header row */}
      {expanded && (
        <div
          style={{
            position: "absolute",
            left: 0,
            right: 0,
            marginTop: 8,
            zIndex: 40,
            padding: "0 24px",
          }}
        >
          <div className="glass-card" style={{ padding: 24 }}>
            {/* Header */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                marginBottom: 20,
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <Link2 size={20} style={{ color: "var(--cta)" }} />
                <h3
                  style={{
                    fontSize: "1.125rem",
                    fontWeight: 600,
                    fontFamily: "var(--font-heading), 'Montserrat', sans-serif",
                    color: "var(--text-primary)",
                    margin: 0,
                  }}
                >
                  Public Assessment Links
                </h3>
              </div>
              <button
                onClick={() => setExpanded(false)}
                className="btn-ghost"
                style={{ padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Create form */}
            <div
              style={{
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                background: "var(--bg-surface)",
                marginBottom: 20,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 16,
                }}
              >
                <Plus size={16} style={{ color: "var(--cta)" }} />
                <p
                  style={{
                    fontSize: "0.875rem",
                    fontWeight: 600,
                    color: "var(--text-secondary)",
                    margin: 0,
                  }}
                >
                  Generate New Link
                </p>
              </div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: 12,
                  alignItems: "end",
                }}
              >
                {/* Role */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    Role
                  </label>
                  <Select
                    value={createRoleId}
                    onChange={setCreateRoleId}
                    placeholder="Select role..."
                    options={roles.map((r) => ({ value: r.id, label: r.name }))}
                  />
                </div>

                {/* Code */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    Code
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. senior-engineer"
                    value={createCode}
                    onChange={(e) => setCreateCode(e.target.value)}
                    className="input-field"
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Expiry */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    Expires
                  </label>
                  <input
                    type="date"
                    value={createExpiry}
                    onChange={(e) => setCreateExpiry(e.target.value)}
                    className="input-field"
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Max registrations */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    Max Registrations
                  </label>
                  <input
                    type="number"
                    min={1}
                    placeholder="Unlimited"
                    value={createMaxReg}
                    onChange={(e) => setCreateMaxReg(e.target.value)}
                    className="input-field"
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Allowed domains */}
                <div>
                  <label
                    style={{
                      display: "block",
                      fontSize: "0.82rem",
                      fontWeight: 500,
                      color: "var(--text-secondary)",
                      marginBottom: 4,
                    }}
                  >
                    Allowed Domains
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. acme.com, corp.io"
                    value={createDomains}
                    onChange={(e) => setCreateDomains(e.target.value)}
                    className="input-field"
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Submit */}
                <div style={{ display: "flex", alignItems: "flex-end" }}>
                  <button
                    onClick={handleCreate}
                    disabled={creating}
                    className="btn-cta"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      opacity: creating ? 0.5 : 1,
                      width: "100%",
                      justifyContent: "center",
                    }}
                  >
                    <Plus size={16} />
                    {creating ? "Creating..." : "Generate Link"}
                  </button>
                </div>
              </div>
            </div>

            {/* Feedback */}
            {msg && (
              <div
                style={{
                  marginBottom: 16,
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  fontSize: "0.875rem",
                  color: msg.type === "success" ? "var(--success)" : "var(--error)",
                }}
              >
                {msg.type === "success" ? (
                  <CheckCircle2 size={16} />
                ) : (
                  <AlertCircle size={16} />
                )}
                {msg.text}
                <button
                  onClick={() => setMsg(null)}
                  className="btn-ghost"
                  style={{ marginLeft: "auto", padding: 2, fontSize: "0.7rem" }}
                >
                  Dismiss
                </button>
              </div>
            )}

            {/* Links table */}
            {loading ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "24px 0",
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                }}
              >
                Loading links...
              </div>
            ) : links.length === 0 ? (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: "var(--text-muted)",
                  fontSize: "0.875rem",
                }}
              >
                No public links yet. Generate one above.
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table
                  style={{
                    width: "100%",
                    fontSize: "0.875rem",
                    borderCollapse: "collapse",
                  }}
                >
                  <thead>
                    <tr
                      style={{
                        borderBottom: "1px solid var(--border-default)",
                        background: "var(--bg-elevated)",
                        textAlign: "left",
                        fontSize: "0.75rem",
                        textTransform: "uppercase",
                        color: "var(--text-muted)",
                        letterSpacing: "0.05em",
                      }}
                    >
                      <th style={{ padding: "12px 16px", fontWeight: 500 }}>Code</th>
                      <th style={{ padding: "12px 16px", fontWeight: 500 }}>Role</th>
                      <th style={{ padding: "12px 16px", fontWeight: 500 }}>Expires</th>
                      <th style={{ padding: "12px 16px", fontWeight: 500 }}>Registrations</th>
                      <th style={{ padding: "12px 16px", fontWeight: 500 }}>Domains</th>
                      <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
                      <th style={{ padding: "12px 16px", fontWeight: 500 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {links.map((link) => {
                      const status = linkStatus(link);
                      return (
                        <tr
                          key={link.id}
                          style={{
                            borderBottom: "1px solid var(--border-subtle)",
                            transition: "background var(--transition-fast)",
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = "var(--bg-elevated)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = "transparent";
                          }}
                        >
                          <td
                            style={{
                              padding: "12px 16px",
                              fontFamily: "monospace",
                              fontWeight: 600,
                              color: "var(--text-primary)",
                            }}
                          >
                            {link.code}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-secondary)",
                            }}
                          >
                            {link.role.name}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-muted)",
                              fontSize: "0.8125rem",
                            }}
                          >
                            {link.expiresAt
                              ? new Date(link.expiresAt).toLocaleDateString()
                              : "Never"}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-secondary)",
                              fontVariantNumeric: "tabular-nums",
                            }}
                          >
                            {link.registrationCount}
                            {link.maxRegistrations !== null
                              ? ` / ${link.maxRegistrations}`
                              : ""}
                          </td>
                          <td
                            style={{
                              padding: "12px 16px",
                              color: "var(--text-muted)",
                              fontSize: "0.8125rem",
                              maxWidth: 160,
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {link.allowedDomains || "Any"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span
                              style={{
                                display: "inline-flex",
                                alignItems: "center",
                                padding: "2px 10px",
                                borderRadius: "var(--radius-full)",
                                fontSize: "0.75rem",
                                fontWeight: 500,
                                background: status.bg,
                                color: status.color,
                              }}
                            >
                              {status.label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <div style={{ display: "flex", gap: 4 }}>
                              {/* Copy URL */}
                              <button
                                onClick={() => handleCopy(link)}
                                className="btn-ghost"
                                title="Copy public URL"
                                style={{
                                  padding: "5px 8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color:
                                    copiedId === link.id
                                      ? "var(--success)"
                                      : undefined,
                                }}
                              >
                                {copiedId === link.id ? (
                                  <Check size={12} />
                                ) : (
                                  <Copy size={12} />
                                )}
                              </button>

                              {/* Edit */}
                              <button
                                onClick={() => openEdit(link)}
                                className="btn-ghost"
                                title="Edit link"
                                style={{
                                  padding: "5px 8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                }}
                              >
                                <Pencil size={12} />
                              </button>

                              {/* Revoke / Activate toggle */}
                              <button
                                onClick={() => handleToggleActive(link)}
                                className="btn-ghost"
                                title={link.isActive ? "Revoke link" : "Activate link"}
                                style={{
                                  padding: "5px 8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color: link.isActive
                                    ? "var(--warning)"
                                    : "var(--success)",
                                }}
                              >
                                {link.isActive ? (
                                  <ToggleRight size={14} />
                                ) : (
                                  <ToggleLeft size={14} />
                                )}
                              </button>

                              {/* Delete */}
                              <button
                                onClick={() => handleDelete(link)}
                                className="btn-ghost"
                                title="Delete link"
                                style={{
                                  padding: "5px 8px",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color: "var(--error)",
                                }}
                              >
                                <Trash2 size={12} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editLink && (
        <div
          onClick={() => setEditLink(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,
            background: "rgba(0,0,0,0.6)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: 16,
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="glass-card"
            style={{
              width: "100%",
              maxWidth: 460,
              padding: 0,
              background: "var(--bg-surface-solid)",
            }}
          >
            {/* Modal header */}
            <div
              style={{
                padding: "20px 24px",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
              }}
            >
              <h3
                style={{
                  fontSize: "1.125rem",
                  fontWeight: 600,
                  fontFamily: "var(--font-heading), 'Montserrat', sans-serif",
                  color: "var(--text-primary)",
                  margin: 0,
                }}
              >
                Edit Link
              </h3>
              <button
                onClick={() => setEditLink(null)}
                className="btn-ghost"
                style={{ padding: 6 }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Immutable info */}
            <div
              style={{
                padding: "12px 24px",
                background: "var(--bg-elevated)",
                borderBottom: "1px solid var(--border-subtle)",
                display: "flex",
                gap: 24,
                fontSize: "0.82rem",
                color: "var(--text-muted)",
              }}
            >
              <span>
                <strong style={{ color: "var(--text-secondary)" }}>Code:</strong>{" "}
                <span style={{ fontFamily: "monospace" }}>{editLink.code}</span>
              </span>
              <span>
                <strong style={{ color: "var(--text-secondary)" }}>Role:</strong>{" "}
                {editLink.role.name}
              </span>
            </div>

            {/* Editable fields */}
            <div
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                gap: 16,
              }}
            >
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  }}
                >
                  Expiry Date
                </label>
                <input
                  type="date"
                  value={editExpiry}
                  onChange={(e) => setEditExpiry(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  }}
                >
                  Max Registrations
                </label>
                <input
                  type="number"
                  min={1}
                  placeholder="Unlimited"
                  value={editMaxReg}
                  onChange={(e) => setEditMaxReg(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "0.82rem",
                    fontWeight: 500,
                    color: "var(--text-secondary)",
                    marginBottom: 4,
                  }}
                >
                  Allowed Domains
                </label>
                <input
                  type="text"
                  placeholder="e.g. acme.com, corp.io (blank = any)"
                  value={editDomains}
                  onChange={(e) => setEditDomains(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
              </div>
            </div>

            {/* Modal footer */}
            <div
              style={{
                padding: "16px 24px",
                borderTop: "1px solid var(--border-subtle)",
                display: "flex",
                gap: 12,
                justifyContent: "flex-end",
              }}
            >
              <button onClick={() => setEditLink(null)} className="btn-ghost">
                Cancel
              </button>
              <button
                onClick={handleEditSave}
                disabled={editSaving}
                className="btn-cta"
                style={{ opacity: editSaving ? 0.5 : 1 }}
              >
                {editSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
