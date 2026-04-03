"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TENETS, TENET_LABELS, Tenet } from "@/types";
import RadarChart from "@/components/admin/RadarChart";
import { ArrowLeft, Brain } from "lucide-react";

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
    return <p className="text-slate-400 text-sm">Loading candidate detail...</p>;
  }

  if (error || !candidate) {
    return (
      <div>
        <p className="text-red-600 text-sm mb-4">{error || "Not found."}</p>
        <Link
          href="/admin/results"
          className="inline-flex items-center gap-1.5 text-blue-600 hover:text-blue-800 text-sm transition-colors duration-150"
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
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm mb-5 transition-colors duration-150"
      >
        <ArrowLeft size={16} />
        Back to Results
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-800">
          {candidate.name}
        </h2>
        <div className="flex flex-wrap items-center gap-2 mt-2">
          <span className="text-sm text-slate-500">{candidate.email}</span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
            {candidate.role.name}
          </span>
          <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-600 capitalize">
            {candidate.status}
          </span>
        </div>
      </div>

      {!score ? (
        <div className="bg-white rounded-xl border border-slate-200 p-6">
          <p className="text-slate-400 text-sm">
            This candidate has not been scored yet.
          </p>
        </div>
      ) : (
        <>
          {/* Composite Score + Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Composite Score & Weights */}
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <h3 className="text-base font-semibold font-[family-name:var(--font-heading)] text-slate-800 mb-4">
                Composite Score
              </h3>
              <div className="text-5xl font-bold font-mono text-blue-600 mb-6">
                {score.compositeScore.toFixed(1)}
              </div>

              <h4 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3">
                Weight Breakdown
              </h4>
              <div className="space-y-3">
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
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-slate-700">{item.label}</span>
                        <span className="text-slate-400 font-mono text-xs">
                          {item.weight}% &middot; {value.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-500 rounded-full transition-all duration-200"
                          style={{ width: `${Math.min(100, value)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-xl border border-slate-200 p-6 flex flex-col items-center justify-center">
              <h3 className="text-base font-semibold font-[family-name:var(--font-heading)] text-slate-800 mb-4">
                Tenet Profile
              </h3>
              <RadarChart scores={tenetScores} size={300} />
            </div>
          </div>

          {/* Per-Tenet Horizontal Bar Chart */}
          <div className="bg-white rounded-xl border border-slate-200 p-6 mb-6">
            <h3 className="text-base font-semibold font-[family-name:var(--font-heading)] text-slate-800 mb-4">
              Tenet Scores
            </h3>
            <div className="space-y-3">
              {TENETS.map((t) => {
                const val = tenetScores[t];
                const pct =
                  maxTenetScore > 0 ? (val / maxTenetScore) * 100 : 0;
                return (
                  <div key={t} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-slate-600 text-right shrink-0">
                      {TENET_LABELS[t]}
                    </span>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all duration-200"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm font-mono font-semibold text-slate-800 text-right">
                      {val.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Analysis */}
          {aiAnalysisText && (
            <div className="bg-white rounded-xl border border-slate-200 p-6">
              <div className="flex items-center gap-2 mb-4">
                <Brain size={20} className="text-purple-500" />
                <h3 className="text-base font-semibold font-[family-name:var(--font-heading)] text-slate-800">
                  AI Analysis
                </h3>
              </div>
              <div className="prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap leading-relaxed">
                {aiAnalysisText}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
