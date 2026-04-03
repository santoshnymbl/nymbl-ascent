"use client";

import { useEffect, useState } from "react";
import { Briefcase, Users, Clock, CheckCircle2 } from "lucide-react";

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
    {
      title: "Total Roles",
      value: totalRoles,
      icon: Briefcase,
      iconBg: "bg-blue-100",
      iconColor: "text-blue-600",
    },
    {
      title: "Total Candidates",
      value: totalCandidates,
      icon: Users,
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
    },
    {
      title: "Pending Scoring",
      value: pendingScoring,
      icon: Clock,
      iconBg: "bg-amber-100",
      iconColor: "text-amber-600",
    },
    {
      title: "Completed Today",
      value: completedToday,
      icon: CheckCircle2,
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
    },
  ];

  return (
    <div>
      <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-800 mb-6">
        Dashboard
      </h2>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading stats...</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <div
                key={card.title}
                className="bg-white rounded-xl border border-slate-200 p-5 hover:border-blue-500 transition-colors duration-150"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm text-slate-500">{card.title}</p>
                    <p className="text-3xl font-bold text-slate-800 mt-1">
                      {card.value}
                    </p>
                  </div>
                  <div
                    className={`w-10 h-10 rounded-full ${card.iconBg} ${card.iconColor} flex items-center justify-center shrink-0`}
                  >
                    <Icon size={20} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
