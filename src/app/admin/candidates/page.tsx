"use client";

import { useEffect, useState, useCallback } from "react";
import CsvUpload from "@/components/admin/CsvUpload";
import { UserPlus, AlertCircle, CheckCircle2, ChevronDown, ChevronUp, Users, Mail, RefreshCw, Calculator } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";
import { Select } from "@/components/ui/Select";

/* ---------- types ---------- */

interface Role {
  id: string;
  name: string;
}

interface CandidateRow {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  role: { id: string; name: string };
  assessment: { score: { compositeScore: number } | null } | null;
}

interface InviteCandidate {
  name: string;
  email: string;
}

const STATUS_STYLES: Record<
  string,
  { bg: string; color: string; tooltip: string }
> = {
  invited: {
    bg: "var(--info-surface)",
    color: "var(--info)",
    tooltip: "Candidate has been invited but has not started the assessment",
  },
  in_progress: {
    bg: "var(--warning-surface)",
    color: "var(--warning)",
    tooltip: "Candidate is currently taking the assessment",
  },
  completed: {
    bg: "var(--cta-glow)",
    color: "var(--cta)",
    tooltip: "Candidate finished the assessment; awaiting scoring",
  },
  scored: {
    bg: "var(--success-surface)",
    color: "var(--success)",
    tooltip: "Assessment has been scored by AI",
  },
};

function statusLabel(s: string) {
  return s.replace(/_/g, " ");
}

/* ---------- component ---------- */

export default function AdminCandidatesPage() {
  const [candidates, setCandidates] = useState<CandidateRow[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [filterRoleId, setFilterRoleId] = useState("");
  const [loading, setLoading] = useState(true);
  const [showInvite, setShowInvite] = useState(false);

  /* invite form state */
  const [inviteName, setInviteName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRoleId, setInviteRoleId] = useState("");
  const [csvCandidates, setCsvCandidates] = useState<InviteCandidate[]>([]);
  const [inviting, setInviting] = useState(false);
  const [inviteMsg, setInviteMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* per-row action state */
  const [actionBusy, setActionBusy] = useState<string | null>(null);
  const [actionMsg, setActionMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  /* ---------- data fetching ---------- */

  const fetchCandidates = useCallback(async () => {
    try {
      const params = filterRoleId ? `?roleId=${filterRoleId}` : "";
      const res = await fetch(`/api/admin/candidates${params}`);
      const data = await res.json();
      setCandidates(data);
    } catch (err) {
      console.error("Failed to fetch candidates", err);
    }
  }, [filterRoleId]);

  useEffect(() => {
    async function init() {
      try {
        const res = await fetch("/api/admin/roles");
        const data = await res.json();
        setRoles(data);
      } catch (err) {
        console.error("Failed to fetch roles", err);
      }
    }
    init();
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchCandidates().finally(() => setLoading(false));
  }, [fetchCandidates]);

  /* ---------- invite ---------- */

  async function handleInvite(list: InviteCandidate[]) {
    if (!inviteRoleId) {
      setInviteMsg({ type: "error", text: "Select a role before inviting." });
      return;
    }
    if (list.length === 0) {
      setInviteMsg({
        type: "error",
        text: "Provide at least one candidate to invite.",
      });
      return;
    }

    setInviting(true);
    setInviteMsg(null);
    try {
      const res = await fetch("/api/admin/candidates/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ candidates: list, roleId: inviteRoleId }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Invite failed");
      }
      const { results } = await res.json();
      const sent = results.filter(
        (r: { status: string }) => r.status === "sent",
      ).length;
      const failed = results.length - sent;
      setInviteMsg({
        type: failed > 0 ? "error" : "success",
        text: `${sent} invite(s) sent${failed > 0 ? `, ${failed} failed` : ""}.`,
      });

      /* reset form */
      setInviteName("");
      setInviteEmail("");
      setCsvCandidates([]);

      /* refresh table */
      await fetchCandidates();
    } catch (err) {
      setInviteMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Invite failed",
      });
    } finally {
      setInviting(false);
    }
  }

  function handleSingleInvite() {
    if (!inviteName.trim() || !inviteEmail.trim()) {
      setInviteMsg({ type: "error", text: "Name and email are required." });
      return;
    }
    handleInvite([{ name: inviteName.trim(), email: inviteEmail.trim() }]);
  }

  function handleBulkInvite() {
    handleInvite(csvCandidates);
  }

  /* ---------- Resend invite ---------- */
  async function handleResend(c: CandidateRow) {
    if (
      !confirm(
        `Resend invite to ${c.name}?\n\nThis generates a new token, deletes any partial assessment, and sends a fresh email.`,
      )
    )
      return;
    setActionBusy(c.id);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/candidates/${c.id}/resend`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Resend failed");
      setActionMsg({ type: "success", text: `Invite resent to ${c.email}` });
      await fetchCandidates();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Resend failed",
      });
    } finally {
      setActionBusy(null);
    }
  }

  /* ---------- Re-score ---------- */
  async function handleRescore(c: CandidateRow) {
    setActionBusy(c.id);
    setActionMsg(null);
    try {
      const res = await fetch(`/api/admin/candidates/${c.id}/rescore`, {
        method: "POST",
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Re-score failed");
      setActionMsg({
        type: "success",
        text: `${c.name} scored: composite ${body.compositeScore?.toFixed(1)}`,
      });
      await fetchCandidates();
    } catch (err) {
      setActionMsg({
        type: "error",
        text: err instanceof Error ? err.message : "Re-score failed",
      });
    } finally {
      setActionBusy(null);
    }
  }

  /* ---------- render ---------- */

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
          Candidates
        </h2>
        <button
          onClick={() => setShowInvite(!showInvite)}
          className="btn-cta"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <UserPlus size={16} />
          Invite Candidates
          {showInvite ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {/* ---- Collapsible Invite Section ---- */}
      {showInvite && (
        <div
          className="glass-card"
          style={{ padding: 24, marginBottom: 32 }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              marginBottom: 16,
            }}
          >
            <UserPlus size={20} style={{ color: "var(--cta)" }} />
            <h3
              style={{
                fontSize: "1.125rem",
                fontWeight: 600,
                fontFamily: "var(--font-heading), 'Space Grotesk', sans-serif",
                color: "var(--text-primary)",
              }}
            >
              Invite Candidates
            </h3>
          </div>

          {/* Role select shared by single & bulk */}
          <div style={{ marginBottom: 16, maxWidth: 320 }}>
            <label
              style={{
                display: "block",
                fontSize: "0.875rem",
                fontWeight: 500,
                color: "var(--text-secondary)",
                marginBottom: 4,
              }}
            >
              Role
            </label>
            <Select
              value={inviteRoleId}
              onChange={setInviteRoleId}
              placeholder="Select role..."
              options={roles.map((r) => ({ value: r.id, label: r.name }))}
            />
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
              gap: 24,
            }}
          >
            {/* Single invite */}
            <div
              style={{
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                background: "var(--bg-surface)",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 12,
                }}
              >
                Single Invite
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <input
                  type="text"
                  placeholder="Name"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="input-field"
                  style={{ width: "100%" }}
                />
                <button
                  onClick={handleSingleInvite}
                  disabled={inviting}
                  className="btn-cta"
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    gap: 8,
                    opacity: inviting ? 0.5 : 1,
                    width: "fit-content",
                  }}
                >
                  <UserPlus size={16} />
                  {inviting ? "Sending..." : "Send Invite"}
                </button>
              </div>
            </div>

            {/* Bulk CSV upload */}
            <div
              style={{
                border: "1px solid var(--border-default)",
                borderRadius: "var(--radius-lg)",
                padding: 20,
                background: "var(--bg-surface)",
              }}
            >
              <p
                style={{
                  fontSize: "0.875rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 12,
                }}
              >
                Bulk Upload
              </p>
              <CsvUpload onParsed={(parsed) => setCsvCandidates(parsed)} />
              {csvCandidates.length > 0 && (
                <div style={{ marginTop: 12 }}>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      marginBottom: 8,
                    }}
                  >
                    {csvCandidates.length} candidate(s) ready
                  </p>
                  <button
                    onClick={handleBulkInvite}
                    disabled={inviting}
                    className="btn-cta"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: 8,
                      opacity: inviting ? 0.5 : 1,
                    }}
                  >
                    <UserPlus size={16} />
                    {inviting ? "Sending..." : "Send All Invites"}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Invite feedback */}
          {inviteMsg && (
            <div
              style={{
                marginTop: 16,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "0.875rem",
                color:
                  inviteMsg.type === "success"
                    ? "var(--success)"
                    : "var(--error)",
              }}
            >
              {inviteMsg.type === "success" ? (
                <CheckCircle2 size={16} />
              ) : (
                <AlertCircle size={16} />
              )}
              {inviteMsg.text}
            </div>
          )}
        </div>
      )}

      {/* ---- Action feedback banner ---- */}
      {actionMsg && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: actionMsg.type === "success" ? "var(--success-surface)" : "var(--error-surface)",
            border: `1px solid ${actionMsg.type === "success" ? "var(--success)" : "var(--error)"}`,
            color: actionMsg.type === "success" ? "var(--success)" : "var(--error)",
            borderRadius: "var(--radius-md)",
            fontSize: "0.875rem",
            display: "flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          {actionMsg.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          {actionMsg.text}
          <button
            onClick={() => setActionMsg(null)}
            className="btn-ghost"
            style={{ marginLeft: "auto", padding: 2, fontSize: "0.7rem" }}
          >
            Dismiss
          </button>
        </div>
      )}

      {/* ---- Filter ---- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 12,
          marginBottom: 16,
        }}
      >
        <label
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
            whiteSpace: "nowrap",
          }}
        >
          Filter by role
        </label>
        <Select
          value={filterRoleId}
          onChange={setFilterRoleId}
          maxWidth={280}
          options={[
            { value: "", label: "All roles" },
            ...roles.map((r) => ({ value: r.id, label: r.name })),
          ]}
        />
      </div>

      {/* ---- Table ---- */}
      {loading ? (
        <div
          className="glass-card"
          style={{ padding: 0, overflow: "hidden" }}
        >
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
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Name</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Email</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Role</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Composite Score</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {[1, 2, 3, 4, 5].map((i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--border-subtle)" }}>
                    {[1, 2, 3, 4, 5, 6].map((j) => (
                      <td key={j} style={{ padding: "12px 16px" }}>
                        <div
                          className="skeleton-pulse"
                          style={{ height: 16, width: j === 4 ? 70 : j === 5 ? 40 : "80%", borderRadius: "var(--radius-sm)" }}
                        />
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : candidates.length === 0 ? (
        <div
          className="glass-card"
          style={{ textAlign: "center", padding: "64px 24px" }}
        >
          <Users
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
            No candidates found
          </p>
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: "0.875rem",
              marginTop: 8,
              marginBottom: 24,
            }}
          >
            Invite your first candidate to get started.
          </p>
          <button
            onClick={() => setShowInvite(true)}
            className="btn-cta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
            }}
          >
            <UserPlus size={16} />
            Invite Candidates
          </button>
        </div>
      ) : (
        <div
          className="glass-card"
          style={{ padding: 0, overflow: "hidden" }}
        >
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
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Name</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Email</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Role</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Status</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>
                    Composite Score
                  </th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Date</th>
                  <th style={{ padding: "12px 16px", fontWeight: 500 }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {candidates.map((c) => {
                  const statusStyle = STATUS_STYLES[c.status] ?? {
                    bg: "var(--bg-elevated)",
                    color: "var(--text-secondary)",
                    tooltip: "Unknown status",
                  };
                  return (
                    <tr
                      key={c.id}
                      style={{
                        borderBottom: "1px solid var(--border-subtle)",
                        transition: "background var(--transition-fast)",
                        cursor: "default",
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
                          fontWeight: 500,
                          color: "var(--text-primary)",
                        }}
                      >
                        {c.name}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                        }}
                      >
                        {c.email}
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {c.role.name}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <Tooltip content={statusStyle.tooltip}>
                          <span
                            className={c.status === "completed" ? "status-pulse" : ""}
                            style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: 6,
                              padding: "2px 10px",
                              borderRadius: "var(--radius-full)",
                              fontSize: "0.75rem",
                              fontWeight: 500,
                              textTransform: "capitalize",
                              background: statusStyle.bg,
                              color: statusStyle.color,
                              cursor: "help",
                            }}
                          >
                            {c.status === "completed" && (
                              <span
                                style={{
                                  display: "inline-block",
                                  width: 6,
                                  height: 6,
                                  borderRadius: "50%",
                                  background: "var(--cta)",
                                  animation: "pulseDot 1.4s ease-in-out infinite",
                                }}
                              />
                            )}
                            {statusLabel(c.status)}
                          </span>
                        </Tooltip>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.875rem",
                            fontWeight: 600,
                            color: "var(--text-primary)",
                            fontVariantNumeric: "tabular-nums",
                          }}
                        >
                          {c.assessment?.score
                            ? c.assessment.score.compositeScore.toFixed(1)
                            : "-"}
                        </span>
                      </td>
                      <td
                        style={{
                          padding: "12px 16px",
                          color: "var(--text-muted)",
                          fontSize: "0.75rem",
                        }}
                      >
                        {new Date(c.createdAt).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ display: "flex", gap: 6 }}>
                          {c.status !== "scored" && (
                            <Tooltip content="Resend invite (new token, fresh start)">
                              <button
                                onClick={() => handleResend(c)}
                                disabled={actionBusy === c.id}
                                className="btn-ghost"
                                style={{
                                  padding: "5px 8px",
                                  fontSize: "0.7rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  opacity: actionBusy === c.id ? 0.5 : 1,
                                }}
                              >
                                <Mail size={12} />
                              </button>
                            </Tooltip>
                          )}
                          {c.status === "completed" && (
                            <Tooltip content="Run scoring now">
                              <button
                                onClick={() => handleRescore(c)}
                                disabled={actionBusy === c.id}
                                className="btn-ghost"
                                style={{
                                  padding: "5px 8px",
                                  fontSize: "0.7rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  color: "var(--cta)",
                                  opacity: actionBusy === c.id ? 0.5 : 1,
                                }}
                              >
                                <Calculator size={12} />
                                Score
                              </button>
                            </Tooltip>
                          )}
                          {c.status === "scored" && (
                            <Tooltip content="Re-run scoring (overwrites existing)">
                              <button
                                onClick={() => handleRescore(c)}
                                disabled={actionBusy === c.id}
                                className="btn-ghost"
                                style={{
                                  padding: "5px 8px",
                                  fontSize: "0.7rem",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: 4,
                                  opacity: actionBusy === c.id ? 0.5 : 1,
                                }}
                              >
                                <RefreshCw size={12} />
                              </button>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
