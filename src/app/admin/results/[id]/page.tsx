"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TENETS, TENET_LABELS, Tenet } from "@/types";
import RadarChart from "@/components/admin/RadarChart";
import { ArrowLeft, Brain } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface ScoreData {
  compositeScore: number;
  clientFocused: number;
  empowering: number;
  productive: number;
  balanced: number;
  reliable: number;
  improving: number;
  transparent: number;
  roleFitScore: number;
  behavioralScore: number;
  breakdown: string | null;
  aiAnalysis: string | null;
}

interface CandidateDetail {
  id: string;
  name: string;
  email: string;
  status: string;
  role: { id: string; name: string };
  assessment: { score: ScoreData | null } | null;
}

const WEIGHT_BREAKDOWN = [
  { label: "Core Tenet Alignment", weight: 60 },
  { label: "Role Fit", weight: 25 },
  { label: "Behavioral Signals", weight: 15 },
];

const TENET_EXPLANATIONS: Record<Tenet, string> = {
  clientFocused: "Prioritizes client needs and outcomes in decision-making",
  empowering: "Enables others to grow, lead, and take ownership",
  productive: "Efficiently delivers results with minimal waste",
  balanced: "Maintains equilibrium between competing priorities",
  reliable: "Consistently delivers on promises and commitments",
  improving: "Continuously seeks growth and better approaches",
  transparent: "Communicates openly and honestly with stakeholders",
};

export default function CandidateDetailPage() {
  const params = useParams();
  const candidateId = params.id as string;
  const [candidate, setCandidate] = useState<CandidateDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/admin/candidates")
      .then((r) => r.json())
      .then((data: CandidateDetail[]) => {
        const found = data.find((c) => c.id === candidateId);
        if (found) {
          setCandidate(found);
        } else {
          setError("Candidate not found.");
        }
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Failed to load candidate.");
        setLoading(false);
      });
  }, [candidateId]);

  if (loading) {
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
        Loading candidate detail...
      </p>
    );
  }

  if (error || !candidate) {
    return (
      <div>
        <p
          style={{
            color: "var(--error)",
            fontSize: "0.875rem",
            marginBottom: 16,
          }}
        >
          {error || "Not found."}
        </p>
        <Link
          href="/admin/results"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--accent)",
            fontSize: "0.875rem",
            textDecoration: "none",
            transition: "color var(--transition-fast)",
          }}
        >
          <ArrowLeft size={16} />
          Back to Results
        </Link>
      </div>
    );
  }

  const score = candidate.assessment?.score;
  const tenetScores: Record<Tenet, number> = {} as Record<Tenet, number>;
  for (const t of TENETS) {
    tenetScores[t] = score?.[t] ?? 0;
  }

  const maxTenetScore = Math.max(...TENETS.map((t) => tenetScores[t]), 1);

  let aiAnalysisText: string | null = null;
  if (score?.aiAnalysis) {
    try {
      const parsed = JSON.parse(score.aiAnalysis);
      aiAnalysisText =
        typeof parsed === "string"
          ? parsed
          : parsed.summary ?? parsed.analysis ?? JSON.stringify(parsed, null, 2);
    } catch {
      aiAnalysisText = score.aiAnalysis;
    }
  }

  return (
    <div>
      <Link
        href="/admin/results"
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-secondary)",
          fontSize: "0.875rem",
          marginBottom: 20,
          textDecoration: "none",
          transition: "color var(--transition-fast)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.color = "var(--accent)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.color = "var(--text-secondary)";
        }}
      >
        <ArrowLeft size={16} />
        Back to Results
      </Link>

      {/* Header */}
      <div
        className="glass-card"
        style={{ padding: 24, marginBottom: 24 }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            fontFamily: "var(--font-heading), 'Space Grotesk', sans-serif",
            color: "var(--text-primary)",
          }}
        >
          {candidate.name}
        </h2>
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 8,
            marginTop: 8,
          }}
        >
          <span
            style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}
          >
            {candidate.email}
          </span>
          <span
            className="badge"
            style={{
              background: "var(--info-surface)",
              color: "var(--info)",
            }}
          >
            {candidate.role.name}
          </span>
          <span
            className="badge"
            style={{
              background: "var(--bg-elevated)",
              color: "var(--text-secondary)",
              textTransform: "capitalize",
            }}
          >
            {candidate.status}
          </span>
        </div>
      </div>

      {!score ? (
        <div className="glass-card" style={{ padding: 24 }}>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            This candidate has not been scored yet.
          </p>
        </div>
      ) : (
        <>
          {/* Composite Score + Radar Chart */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))",
              gap: 24,
              marginBottom: 24,
            }}
          >
            {/* Composite Score & Weights */}
            <div className="glass-card" style={{ padding: 24 }}>
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontFamily:
                    "var(--font-heading), 'Space Grotesk', sans-serif",
                  color: "var(--text-primary)",
                  marginBottom: 16,
                }}
              >
                <Tooltip content="Weighted score: 60% tenets + 25% role fit + 15% behavioral">
                  <span
                    style={{
                      cursor: "help",
                      borderBottom: "1px dashed var(--border-default)",
                    }}
                  >
                    Composite Score
                  </span>
                </Tooltip>
              </h3>
              <div
                style={{
                  fontSize: "3rem",
                  fontWeight: 700,
                  fontFamily: "monospace",
                  color: "var(--accent)",
                  marginBottom: 24,
                  fontVariantNumeric: "tabular-nums",
                }}
              >
                {score.compositeScore.toFixed(1)}
              </div>

              <h4
                style={{
                  fontSize: "0.75rem",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  marginBottom: 12,
                }}
              >
                Weight Breakdown
              </h4>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 12,
                }}
              >
                {WEIGHT_BREAKDOWN.map((item) => {
                  let value = 0;
                  if (item.weight === 60) {
                    const avg =
                      TENETS.reduce((sum, t) => sum + (score[t] ?? 0), 0) /
                      TENETS.length;
                    value = avg;
                  } else if (item.weight === 25) {
                    value = score.roleFitScore;
                  } else {
                    value = score.behavioralScore;
                  }
                  return (
                    <div key={item.label}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          fontSize: "0.875rem",
                          marginBottom: 4,
                        }}
                      >
                        <span style={{ color: "var(--text-secondary)" }}>
                          {item.label}
                        </span>
                        <span
                          style={{
                            color: "var(--text-muted)",
                            fontFamily: "monospace",
                            fontSize: "0.75rem",
                          }}
                        >
                          {item.weight}% &middot; {value.toFixed(1)}
                        </span>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: "var(--bg-elevated)",
                          borderRadius: "var(--radius-full)",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            background: "var(--accent)",
                            borderRadius: "var(--radius-full)",
                            transition: "width 0.3s ease",
                            width: `${Math.min(100, value)}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar Chart */}
            <div
              className="glass-card"
              style={{
                padding: 24,
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <h3
                style={{
                  fontSize: "1rem",
                  fontWeight: 600,
                  fontFamily:
                    "var(--font-heading), 'Space Grotesk', sans-serif",
                  color: "var(--text-primary)",
                  marginBottom: 16,
                }}
              >
                Tenet Profile
              </h3>
              <RadarChart scores={tenetScores} size={300} />
            </div>
          </div>

          {/* Per-Tenet Horizontal Bar Chart */}
          <div
            className="glass-card"
            style={{ padding: 24, marginBottom: 24 }}
          >
            <h3
              style={{
                fontSize: "1rem",
                fontWeight: 600,
                fontFamily:
                  "var(--font-heading), 'Space Grotesk', sans-serif",
                color: "var(--text-primary)",
                marginBottom: 16,
              }}
            >
              Tenet Scores
            </h3>
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              {TENETS.map((t) => {
                const val = tenetScores[t];
                const pct =
                  maxTenetScore > 0 ? (val / maxTenetScore) * 100 : 0;
                return (
                  <div
                    key={t}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 12,
                    }}
                  >
                    <Tooltip content={TENET_EXPLANATIONS[t]}>
                      <span
                        style={{
                          width: 128,
                          fontSize: "0.875rem",
                          color: "var(--text-secondary)",
                          textAlign: "right",
                          flexShrink: 0,
                          cursor: "help",
                          borderBottom: "1px dashed var(--border-subtle)",
                        }}
                      >
                        {TENET_LABELS[t]}
                      </span>
                    </Tooltip>
                    <div
                      style={{
                        flex: 1,
                        height: 24,
                        background: "var(--bg-elevated)",
                        borderRadius: "var(--radius-full)",
                        overflow: "hidden",
                        position: "relative",
                      }}
                    >
                      <div
                        style={{
                          height: "100%",
                          background: "var(--accent)",
                          borderRadius: "var(--radius-full)",
                          transition: "width 0.3s ease",
                          width: `${pct}%`,
                        }}
                      />
                    </div>
                    <span
                      style={{
                        width: 48,
                        fontSize: "0.875rem",
                        fontFamily: "monospace",
                        fontWeight: 600,
                        color: "var(--text-primary)",
                        textAlign: "right",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {val.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Analysis */}
          {aiAnalysisText && (
            <div className="glass-card" style={{ padding: 24 }}>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  marginBottom: 16,
                }}
              >
                <Brain size={20} style={{ color: "var(--accent)" }} />
                <h3
                  style={{
                    fontSize: "1rem",
                    fontWeight: 600,
                    fontFamily:
                      "var(--font-heading), 'Space Grotesk', sans-serif",
                    color: "var(--text-primary)",
                  }}
                >
                  AI Analysis
                </h3>
              </div>
              <div
                style={{
                  fontSize: "0.875rem",
                  color: "var(--text-secondary)",
                  whiteSpace: "pre-wrap",
                  lineHeight: 1.7,
                }}
              >
                {aiAnalysisText}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
