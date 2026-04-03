"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { TENETS, TENET_LABELS, Tenet } from "@/types";
import { Download, ArrowRight } from "lucide-react";

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
        return "bg-green-100 text-green-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      case "in_progress":
        return "bg-amber-100 text-amber-700";
      default:
        return "bg-slate-100 text-slate-600";
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-800">
          Results
        </h2>
        <button
          onClick={exportCSV}
          className="inline-flex items-center gap-2 px-4 py-2 bg-slate-800 text-white rounded-lg text-sm font-medium hover:bg-slate-900 transition-colors duration-150"
        >
          <Download size={16} />
          Export CSV
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <select
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150"
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
          className="border border-slate-300 rounded-lg px-3 py-2 text-sm bg-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150"
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
        <p className="text-slate-400 text-sm">Loading results...</p>
      ) : sorted.length === 0 ? (
        <p className="text-slate-400 text-sm">No completed assessments found.</p>
      ) : (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 text-slate-500 uppercase text-xs tracking-wider">
              <tr>
                <th className="px-4 py-3 text-left font-medium sticky top-0 bg-slate-50">#</th>
                <th className="px-4 py-3 text-left font-medium sticky top-0 bg-slate-50">Candidate</th>
                <th className="px-4 py-3 text-left font-medium sticky top-0 bg-slate-50">Role</th>
                <th className="px-4 py-3 text-right font-medium sticky top-0 bg-slate-50">Composite Score</th>
                <th className="px-4 py-3 text-center font-medium sticky top-0 bg-slate-50">Status</th>
                <th className="px-4 py-3 text-center font-medium sticky top-0 bg-slate-50">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sorted.map((c, i) => (
                <tr
                  key={c.id}
                  className={`hover:bg-slate-50 transition-colors duration-150 ${
                    i % 2 === 1 ? "bg-slate-50/50" : ""
                  }`}
                >
                  <td className="px-4 py-3">
                    <span className="w-7 h-7 rounded-full bg-slate-100 text-slate-600 text-xs font-semibold inline-flex items-center justify-center">
                      {i + 1}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="font-semibold text-slate-800">{c.name}</div>
                    <div className="text-slate-400 text-xs">{c.email}</div>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{c.role.name}</td>
                  <td className="px-4 py-3 text-right">
                    <span className="text-xl font-bold font-mono text-blue-600">
                      {c.assessment?.score?.compositeScore?.toFixed(1) ?? "--"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColor(c.status)}`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <Link
                      href={`/admin/results/${c.id}`}
                      className="inline-flex items-center gap-1 text-blue-600 hover:text-blue-800 text-sm font-medium transition-colors duration-150"
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
