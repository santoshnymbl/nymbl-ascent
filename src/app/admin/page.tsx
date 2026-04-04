"use client";

import { useEffect, useState } from "react";
import { Briefcase, Users, Clock, CheckCircle2 } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

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
      circleBg: "var(--accent-surface)",
      circleColor: "var(--accent)",
      tooltip: "Total roles configured in the system",
    },
    {
      title: "Total Candidates",
      value: totalCandidates,
      icon: Users,
      circleBg: "var(--success-surface)",
      circleColor: "var(--success)",
      tooltip: "Total candidates invited across all roles",
    },
    {
      title: "Pending Scoring",
      value: pendingScoring,
      icon: Clock,
      circleBg: "var(--warning-surface)",
      circleColor: "var(--warning)",
      tooltip: "Completed assessments awaiting AI scoring",
    },
    {
      title: "Completed Today",
      value: completedToday,
      icon: CheckCircle2,
      circleBg: "var(--info-surface)",
      circleColor: "var(--info)",
      tooltip: "Assessments completed today",
    },
  ];

  return (
    <div>
      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          fontFamily: "var(--font-heading), 'Space Grotesk', sans-serif",
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Dashboard
      </h2>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Loading stats...
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))",
            gap: 20,
          }}
        >
          {cards.map((card) => {
            const Icon = card.icon;
            return (
              <Tooltip key={card.title} content={card.tooltip}>
                <div
                  className="glass-card"
                  style={{
                    padding: 20,
                    cursor: "default",
                    transition: "box-shadow var(--transition-fast)",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.boxShadow = "var(--shadow-glow)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.boxShadow = "var(--shadow-sm)";
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      justifyContent: "space-between",
                    }}
                  >
                    <div>
                      <p
                        style={{
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                        }}
                      >
                        {card.title}
                      </p>
                      <p
                        style={{
                          fontSize: "1.875rem",
                          fontWeight: 700,
                          color: "var(--text-primary)",
                          marginTop: 4,
                          fontVariantNumeric: "tabular-nums",
                        }}
                      >
                        {card.value}
                      </p>
                    </div>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: "var(--radius-full)",
                        background: card.circleBg,
                        color: card.circleColor,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <Icon size={20} />
                    </div>
                  </div>
                </div>
              </Tooltip>
            );
          })}
        </div>
      )}
    </div>
  );
}
