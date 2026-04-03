"use client";

import { useEffect, useState } from "react";

interface RoleData {
  id: string;
  name: string;
  _count: { candidates: number; roleScenarios: number };
}

interface CandidateData {
  id: string;
  status: string;
  createdAt: string;
  assessment: { score: { overall: number } | null } | null;
}

export default function AdminDashboard() {
  const [totalRoles, setTotalRoles] = useState<number>(0);
  const [totalCandidates, setTotalCandidates] = useState<number>(0);
  const [pendingScoring, setPendingScoring] = useState<number>(0);
  const [completedToday, setCompletedToday] = useState<number>(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchStats() {
      try {
        const [rolesRes, candidatesRes] = await Promise.all([
          fetch("/api/admin/roles"),
          fetch("/api/admin/candidates"),
        ]);

        const roles: RoleData[] = await rolesRes.json();
        const candidates: CandidateData[] = await candidatesRes.json();

        setTotalRoles(roles.length);
        setTotalCandidates(candidates.length);

        setPendingScoring(
          candidates.filter(
            (c) => c.status === "COMPLETED" && !c.assessment?.score
          ).length
        );

        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        setCompletedToday(
          candidates.filter(
            (c) =>
              c.status === "COMPLETED" &&
              new Date(c.createdAt) >= todayStart
          ).length
        );
      } catch (err) {
        console.error("Failed to load dashboard stats", err);
      } finally {
        setLoading(false);
      }
    }

    fetchStats();
  }, []);

  const cards = [
    { title: "Total Roles", value: totalRoles, color: "bg-blue-600" },
    { title: "Total Candidates", value: totalCandidates, color: "bg-green-600" },
    { title: "Pending Scoring", value: pendingScoring, color: "bg-yellow-500" },
    { title: "Completed Today", value: completedToday, color: "bg-purple-600" },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6">Dashboard</h2>

      {loading ? (
        <p className="text-gray-500">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {cards.map((card) => (
            <div
              key={card.title}
              className="rounded-xl shadow-sm bg-white overflow-hidden"
            >
              <div className={`${card.color} h-2`} />
              <div className="p-6">
                <p className="text-sm text-gray-500">{card.title}</p>
                <p className="text-3xl font-bold mt-1">{card.value}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
