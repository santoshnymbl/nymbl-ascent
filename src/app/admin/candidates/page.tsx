"use client";

import { useEffect, useState, useCallback } from "react";
import CsvUpload from "@/components/admin/CsvUpload";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

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
      </div>

      {/* ---- Invite Section ---- */}
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
          <select
            value={inviteRoleId}
            onChange={(e) => setInviteRoleId(e.target.value)}
            className="input-field"
            style={{ width: "100%" }}
          >
            <option value="">Select role...</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
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

      {/* ---- Filter ---- */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 16,
          marginBottom: 16,
        }}
      >
        <label
          style={{
            fontSize: "0.875rem",
            fontWeight: 500,
            color: "var(--text-secondary)",
          }}
        >
          Filter by role:
        </label>
        <select
          value={filterRoleId}
          onChange={(e) => setFilterRoleId(e.target.value)}
          className="input-field"
        >
          <option value="">All roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
      </div>

      {/* ---- Table ---- */}
      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Loading candidates...
        </p>
      ) : candidates.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No candidates found.
        </p>
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
                            style={{
                              display: "inline-block",
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
