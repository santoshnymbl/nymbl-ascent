"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { TENETS, TENET_LABELS, Tenet } from "@/types";

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

  const statusColor = (status: string) => {
    switch (status) {
      case "scored":
        return "bg-green-100 text-green-800";
      case "completed":
        return "bg-blue-100 text-blue-800";
      case "in_progress":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold">Results</h2>
        <button
          onClick={exportCSV}
          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition text-sm"
        >
          Export CSV
        </button>
      </div>

      <div className="flex gap-4 mb-6">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
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
          className="border rounded-lg px-3 py-2 text-sm bg-white"
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
        <p className="text-gray-500">Loading results...</p>
      ) : sorted.length === 0 ? (
        <p className="text-gray-500">No completed assessments found.</p>
      ) : (
        <div className="bg-white rounded-xl shadow-sm overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-gray-600 uppercase text-xs">
              <tr>
                <th className="px-4 py-3 text-left">#</th>
                <th className="px-4 py-3 text-left">Candidate</th>
                <th className="px-4 py-3 text-left">Role</th>
                <th className="px-4 py-3 text-right">Composite Score</th>
                <th className="px-4 py-3 text-center">Status</th>
                <th className="px-4 py-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {sorted.map((c, i) => (
                <tr key={c.id} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-gray-500 font-mono">
                    {i + 1}
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-medium text-gray-900">{c.name}</div>
                    <div className="text-gray-500 text-xs">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-gray-700">{c.role.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold text-indigo-600">
                      {c.assessment?.score?.compositeScore?.toFixed(1) ?? "--"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${statusColor(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/results/${c.id}`}
                      className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                    >
                      View Detail
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
