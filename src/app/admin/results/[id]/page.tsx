"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { TENETS, TENET_LABELS, Tenet } from "@/types";
import RadarChart from "@/components/admin/RadarChart";

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
    return <p className="text-gray-500">Loading candidate detail...</p>;
  }

  if (error || !candidate) {
    return (
      <div>
        <p className="text-red-600 mb-4">{error || "Not found."}</p>
        <Link href="/admin/results" className="text-indigo-600 hover:underline">
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
        className="text-indigo-600 hover:underline text-sm mb-4 inline-block"
      >
        &larr; Back to Results
      </Link>

      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
        <h2 className="text-2xl font-bold text-gray-900">{candidate.name}</h2>
        <p className="text-gray-500">{candidate.email}</p>
        <p className="text-sm text-gray-600 mt-1">
          Role: <span className="font-medium">{candidate.role.name}</span>
        </p>
      </div>

      {!score ? (
        <div className="bg-white rounded-xl shadow-sm p-6">
          <p className="text-gray-500">
            This candidate has not been scored yet.
          </p>
        </div>
      ) : (
        <>
          {/* Composite Score + Radar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
            {/* Composite Score & Weights */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">Composite Score</h3>
              <div className="text-5xl font-bold text-indigo-600 mb-6">
                {score.compositeScore.toFixed(1)}
              </div>

              <h4 className="text-sm font-medium text-gray-600 uppercase mb-3">
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
                        <span className="text-gray-700">{item.label}</span>
                        <span className="text-gray-500">
                          {item.weight}% &middot; {value.toFixed(1)}
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, value)}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Radar Chart */}
            <div className="bg-white rounded-xl shadow-sm p-6 flex flex-col items-center justify-center">
              <h3 className="text-lg font-semibold mb-4">Tenet Profile</h3>
              <RadarChart scores={tenetScores} size={300} />
            </div>
          </div>

          {/* Per-Tenet Horizontal Bar Chart */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-6">
            <h3 className="text-lg font-semibold mb-4">Tenet Scores</h3>
            <div className="space-y-3">
              {TENETS.map((t) => {
                const val = tenetScores[t];
                const pct =
                  maxTenetScore > 0 ? (val / maxTenetScore) * 100 : 0;
                return (
                  <div key={t} className="flex items-center gap-3">
                    <span className="w-32 text-sm text-gray-700 text-right shrink-0">
                      {TENET_LABELS[t]}
                    </span>
                    <div className="flex-1 h-6 bg-gray-100 rounded-full overflow-hidden relative">
                      <div
                        className="h-full bg-indigo-500 rounded-full transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-12 text-sm font-medium text-gray-800 text-right">
                      {val.toFixed(1)}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* AI Analysis */}
          {aiAnalysisText && (
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold mb-4">AI Analysis</h3>
              <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
                {aiAnalysisText}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
