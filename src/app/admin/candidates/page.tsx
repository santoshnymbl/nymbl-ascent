"use client";

import { useEffect, useState, useCallback } from "react";
import CsvUpload from "@/components/admin/CsvUpload";
import { UserPlus, AlertCircle, CheckCircle2 } from "lucide-react";

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

const STATUS_BADGES: Record<string, string> = {
  invited: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-700",
  completed: "bg-orange-100 text-orange-700",
  scored: "bg-green-100 text-green-700",
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-800">
          Candidates
        </h2>
      </div>

      {/* ---- Invite Section ---- */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-8">
        <div className="flex items-center gap-2 mb-4">
          <UserPlus size={20} className="text-orange-500" />
          <h3 className="text-lg font-semibold font-[family-name:var(--font-heading)] text-slate-800">
            Invite Candidates
          </h3>
        </div>

        {/* Role select shared by single & bulk */}
        <div className="mb-4 max-w-xs">
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Role
          </label>
          <select
            value={inviteRoleId}
            onChange={(e) => setInviteRoleId(e.target.value)}
            className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150 bg-white"
          >
            <option value="">Select role...</option>
            {roles.map((r) => (
              <option key={r.id} value={r.id}>
                {r.name}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Single invite */}
          <div className="border border-slate-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Single Invite
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150"
              />
              <input
                type="email"
                placeholder="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border border-slate-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150"
              />
              <button
                onClick={handleSingleInvite}
                disabled={inviting}
                className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors duration-150"
              >
                <UserPlus size={16} />
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>

          {/* Bulk CSV upload */}
          <div className="border border-slate-200 rounded-xl p-5">
            <p className="text-sm font-semibold text-slate-700 mb-3">
              Bulk Upload
            </p>
            <CsvUpload
              onParsed={(parsed) => setCsvCandidates(parsed)}
            />
            {csvCandidates.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-slate-600 mb-2">
                  {csvCandidates.length} candidate(s) ready
                </p>
                <button
                  onClick={handleBulkInvite}
                  disabled={inviting}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-orange-500 text-white rounded-lg text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors duration-150"
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
            className={`mt-4 flex items-center gap-2 text-sm ${
              inviteMsg.type === "success" ? "text-green-700" : "text-red-600"
            }`}
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
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-slate-700">
          Filter by role:
        </label>
        <select
          value={filterRoleId}
          onChange={(e) => setFilterRoleId(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150"
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
        <p className="text-slate-400 text-sm">Loading candidates...</p>
      ) : candidates.length === 0 ? (
        <p className="text-slate-400 text-sm">No candidates found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-left text-xs uppercase text-slate-500 tracking-wider">
                <th className="px-4 py-3 font-medium sticky top-0 bg-slate-50">Name</th>
                <th className="px-4 py-3 font-medium sticky top-0 bg-slate-50">Email</th>
                <th className="px-4 py-3 font-medium sticky top-0 bg-slate-50">Role</th>
                <th className="px-4 py-3 font-medium sticky top-0 bg-slate-50">Status</th>
                <th className="px-4 py-3 font-medium sticky top-0 bg-slate-50">Composite Score</th>
                <th className="px-4 py-3 font-medium sticky top-0 bg-slate-50">Date</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c, i) => (
                <tr
                  key={c.id}
                  className={`border-b border-slate-100 last:border-0 hover:bg-slate-50 transition-colors duration-150 ${
                    i % 2 === 1 ? "bg-slate-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                  <td className="px-4 py-3 text-slate-500">{c.email}</td>
                  <td className="px-4 py-3 text-slate-700">{c.role.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGES[c.status] ?? "bg-slate-100 text-slate-600"}`}
                    >
                      {statusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm font-semibold text-slate-800">
                      {c.assessment?.score
                        ? c.assessment.score.compositeScore.toFixed(1)
                        : "-"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">
                    {new Date(c.createdAt).toLocaleDateString()}
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
