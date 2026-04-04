"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { TENETS, TENET_LABELS, Tenet } from "@/types";
import { Download, ArrowRight } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface RoleOption {
  id: string;
  name: string;
}

interface ScoreData {
  compositeScore: number;
  clientFocused: number;
  empowering: number;
  productive: number;
  balanced: number;
  reliable: number;
  improving: number;
  transparent: number;
}

interface CandidateResult {
  id: string;
  name: string;
  email: string;
  status: string;
  role: { id: string; name: string };
  assessment: { score: ScoreData | null } | null;
}

type SortKey = "compositeScore" | Tenet;

export default function AdminResultsPage() {
  const [candidates, setCandidates] = useState<CandidateResult[]>([]);
  const [roles, setRoles] = useState<RoleOption[]>([]);
  const [roleFilter, setRoleFilter] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("compositeScore");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/roles")
      .then((r) => r.json())
      .then(setRoles)
      .catch(console.error);
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (roleFilter) params.set("roleId", roleFilter);
    fetch(`/api/admin/results?${params}`)
      .then((r) => r.json())
      .then((data) => {
        setCandidates(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setLoading(false);
      });
  }, [roleFilter]);

  const sorted = useMemo(() => {
    return [...candidates].sort((a, b) => {
      const scoreA = a.assessment?.score;
      const scoreB = b.assessment?.score;
      if (!scoreA && !scoreB) return 0;
      if (!scoreA) return 1;
      if (!scoreB) return -1;
      const valA = scoreA[sortBy] ?? 0;
      const valB = scoreB[sortBy] ?? 0;
      return valB - valA;
    });
  }, [candidates, sortBy]);

  const exportCSV = useCallback(() => {
    const headers = [
      "Rank",
      "Name",
      "Email",
      "Role",
      "Composite Score",
      ...TENETS.map((t) => TENET_LABELS[t]),
      "Status",
    ];
    const rows = sorted.map((c, i) => {
      const s = c.assessment?.score;
      return [
        i + 1,
        c.name,
        c.email,
        c.role.name,
        s?.compositeScore?.toFixed(1) ?? "",
        ...TENETS.map((t) => s?.[t]?.toFixed(1) ?? ""),
        c.status,
      ].join(",");
    });
    const csv = [headers.join(","), ...rows].join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "nymbl-ascent-results.csv";
    a.click();
    URL.revokeObjectURL(url);
  }, [sorted]);

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
          Results
        </h2>
        <button
          onClick={exportCSV}
          className="btn-ghost"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
          }}
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: 16, marginBottom: 24 }}>
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="input-field"
        >
          <option value="">All Roles</option>
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>

        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="input-field"
        >
          <option value="compositeScore">Composite Score</option>
          {TENETS.map((t) => (
            <option key={t} value={t}>
              {TENET_LABELS[t]}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Loading results...
        </p>
      ) : sorted.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No completed assessments found.
        </p>
      ) : (
        <div
          className="glass-card"
          style={{ padding: 0, overflow: "hidden" }}
        >
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
                  background: "var(--bg-elevated)",
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  fontSize: "0.75rem",
                  letterSpacing: "0.05em",
                }}
              >
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 500,
                  }}
                >
                  #
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 500,
                  }}
                >
                  Candidate
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "left",
                    fontWeight: 500,
                  }}
                >
                  Role
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "right",
                    fontWeight: 500,
                  }}
                >
                  <Tooltip content="Weighted score: 60% tenets + 25% role fit + 15% behavioral">
                    <span style={{ cursor: "help", borderBottom: "1px dashed var(--border-default)" }}>
                      Composite Score
                    </span>
                  </Tooltip>
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  Status
                </th>
                <th
                  style={{
                    padding: "12px 16px",
                    textAlign: "center",
                    fontWeight: 500,
                  }}
                >
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((c, i) => (
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
                  <td style={{ padding: "12px 16px" }}>
                    <span
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "var(--radius-full)",
                        background: "var(--accent)",
                        color: "#fff",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                        display: "inline-flex",
                        alignItems: "center",
                        justifyContent: "center",
                      }}
                    >
                      {i + 1}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <div
                      style={{
                        fontWeight: 600,
                        color: "var(--text-primary)",
                      }}
                    >
                      {c.name}
                    </div>
                    <div
                      style={{
                        color: "var(--text-muted)",
                        fontSize: "0.75rem",
                      }}
                    >
                      {c.email}
                    </div>
                  </td>
                  <td
                    style={{
                      padding: "12px 16px",
                      color: "var(--text-secondary)",
                    }}
                  >
                    {c.role.name}
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <Tooltip content="Weighted score: 60% tenets + 25% role fit + 15% behavioral">
                      <span
                        style={{
                          fontSize: "1.25rem",
                          fontWeight: 700,
                          fontFamily: "monospace",
                          color: "var(--accent)",
                          fontVariantNumeric: "tabular-nums",
                          cursor: "help",
                        }}
                      >
                        {c.assessment?.score?.compositeScore?.toFixed(1) ??
                          "--"}
                      </span>
                    </Tooltip>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <span
                      style={{
                        display: "inline-block",
                        padding: "2px 10px",
                        borderRadius: "var(--radius-full)",
                        fontSize: "0.75rem",
                        fontWeight: 500,
                        background:
                          c.status === "scored"
                            ? "var(--success-surface)"
                            : c.status === "completed"
                              ? "var(--info-surface)"
                              : c.status === "in_progress"
                                ? "var(--warning-surface)"
                                : "var(--bg-elevated)",
                        color:
                          c.status === "scored"
                            ? "var(--success)"
                            : c.status === "completed"
                              ? "var(--info)"
                              : c.status === "in_progress"
                                ? "var(--warning)"
                                : "var(--text-secondary)",
                      }}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <Link
                      href={`/admin/results/${c.id}`}
                      style={{
                        display: "inline-flex",
                        alignItems: "center",
                        gap: 4,
                        color: "var(--accent)",
                        fontSize: "0.875rem",
                        fontWeight: 500,
                        textDecoration: "none",
                        transition: "color var(--transition-fast)",
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.color = "var(--accent-light)";
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.color = "var(--accent)";
                      }}
                    >
                      View Detail
                      <ArrowRight size={14} />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
