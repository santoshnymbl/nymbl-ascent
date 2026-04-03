"use client";

import { useEffect, useState, useCallback } from "react";
import CsvUpload from "@/components/admin/CsvUpload";

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
  invited: "bg-blue-100 text-blue-800",
  in_progress: "bg-yellow-100 text-yellow-800",
  completed: "bg-orange-100 text-orange-800",
  scored: "bg-green-100 text-green-800",
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
      <h2 className="text-2xl font-bold mb-6">Candidates</h2>

      {/* ---- Invite Section ---- */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
        <h3 className="text-lg font-semibold mb-4">Invite Candidates</h3>

        {/* Role select shared by single & bulk */}
        <div className="mb-4 max-w-xs">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Role
          </label>
          <select
            value={inviteRoleId}
            onChange={(e) => setInviteRoleId(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm"
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
          <div className="border rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 mb-3">
              Single Invite
            </p>
            <div className="space-y-3">
              <input
                type="text"
                placeholder="Name"
                value={inviteName}
                onChange={(e) => setInviteName(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <input
                type="email"
                placeholder="Email"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm"
              />
              <button
                onClick={handleSingleInvite}
                disabled={inviting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {inviting ? "Sending..." : "Send Invite"}
              </button>
            </div>
          </div>

          {/* Bulk CSV upload */}
          <div className="border rounded-lg p-4">
            <p className="text-sm font-medium text-gray-600 mb-3">
              Bulk Upload
            </p>
            <CsvUpload
              onParsed={(parsed) => setCsvCandidates(parsed)}
            />
            {csvCandidates.length > 0 && (
              <div className="mt-3">
                <p className="text-sm text-gray-600 mb-2">
                  {csvCandidates.length} candidate(s) ready
                </p>
                <button
                  onClick={handleBulkInvite}
                  disabled={inviting}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm hover:bg-blue-700 disabled:opacity-50 transition"
                >
                  {inviting ? "Sending..." : "Send All Invites"}
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Invite feedback */}
        {inviteMsg && (
          <p
            className={`mt-4 text-sm ${inviteMsg.type === "success" ? "text-green-700" : "text-red-600"}`}
          >
            {inviteMsg.text}
          </p>
        )}
      </div>

      {/* ---- Filter ---- */}
      <div className="flex items-center gap-4 mb-4">
        <label className="text-sm font-medium text-gray-700">
          Filter by role:
        </label>
        <select
          value={filterRoleId}
          onChange={(e) => setFilterRoleId(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm"
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
        <p className="text-gray-500">Loading candidates...</p>
      ) : candidates.length === 0 ? (
        <p className="text-gray-500">No candidates found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b text-left text-gray-500">
                <th className="px-4 py-3 font-medium">Name</th>
                <th className="px-4 py-3 font-medium">Email</th>
                <th className="px-4 py-3 font-medium">Role</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Composite Score</th>
                <th className="px-4 py-3 font-medium">Date</th>
              </tr>
            </thead>
            <tbody>
              {candidates.map((c) => (
                <tr key={c.id} className="border-b last:border-0 hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-gray-600">{c.email}</td>
                  <td className="px-4 py-3">{c.role.name}</td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium capitalize ${STATUS_BADGES[c.status] ?? "bg-gray-100 text-gray-800"}`}
                    >
                      {statusLabel(c.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {c.assessment?.score
                      ? c.assessment.score.compositeScore.toFixed(1)
                      : "-"}
                  </td>
                  <td className="px-4 py-3 text-gray-500">
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
