"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  Sparkles,
  Brain,
  Target,
  Clock,
  Shield,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ValidateResponse {
  candidateId: string;
  name: string;
  roleName: string;
  status: string;
  currentStage: number;
}

export default function WelcomePage() {
  const params = useParams();
  const router = useRouter();
  const token = params.token as string;

  const [data, setData] = useState<ValidateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function validate() {
      try {
        const res = await fetch(`/api/assess/validate?token=${encodeURIComponent(token)}`);
        if (!res.ok) {
          const body = await res.json();
          setError(body.error || "Invalid token");
          return;
        }
        const json: ValidateResponse = await res.json();
        setData(json);
      } catch {
        setError("Failed to validate token. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    validate();
  }, [token]);

  function handleBegin() {
    if (!data) return;
    if (data.status === "in_progress" && data.currentStage >= 1) {
      const stage = Math.min(data.currentStage, 3);
      router.push(`/assess/${token}/stage${stage}`);
    } else {
      router.push(`/assess/${token}/stage1`);
    }
  }

  /* ---------- Loading ---------- */
  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div className="max-w-lg w-full px-6 space-y-6 animate-pulse">
          {/* Skeleton: logo */}
          <div
            className="h-8 w-48 mx-auto"
            style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}
          />
          {/* Skeleton: heading */}
          <div
            className="h-10 w-72 mx-auto"
            style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-md)" }}
          />
          {/* Skeleton: badge */}
          <div
            className="h-7 w-36 mx-auto"
            style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-full)" }}
          />
          {/* Skeleton: 3 cards */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36"
                style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)" }}
              />
            ))}
          </div>
          {/* Skeleton: button */}
          <div
            className="h-14"
            style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-lg)" }}
          />
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="glass-card max-w-md w-full mx-4 text-center p-8"
        >
          <div
            className="w-16 h-16 flex items-center justify-center mx-auto mb-5"
            style={{
              background: "var(--error-surface)",
              borderRadius: "var(--radius-full)",
            }}
          >
            <AlertCircle size={32} style={{ color: "var(--error)" }} />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Invalid Link
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>{error}</p>
        </div>
      </div>
    );
  }

  if (!data) return null;

  /* ---------- Already Completed ---------- */
  if (data.status === "completed" || data.status === "scored") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-base)" }}
      >
        <div
          className="glass-card max-w-md w-full mx-4 text-center p-8"
        >
          <div
            className="w-16 h-16 flex items-center justify-center mx-auto mb-5"
            style={{
              background: "var(--success-surface)",
              borderRadius: "var(--radius-full)",
            }}
          >
            <CheckCircle2 size={32} style={{ color: "var(--success)" }} />
          </div>
          <h1
            className="text-2xl font-bold mb-2"
            style={{ color: "var(--text-primary)" }}
          >
            Already Completed
          </h1>
          <p style={{ color: "var(--text-secondary)" }}>
            You have already completed this assessment. Thank you!
          </p>
        </div>
      </div>
    );
  }

  /* ---------- Main Welcome ---------- */
  const stages = [
    {
      icon: Sparkles,
      name: "Learn",
      description: "Quick-fire games to test your instincts",
      time: "~3 min",
      bgToken: "var(--accent-surface)",
      iconToken: "var(--accent)",
    },
    {
      icon: Brain,
      name: "Build",
      description: "Navigate real workplace decisions",
      time: "~5 min",
      bgToken: "var(--warning-surface)",
      iconToken: "var(--warning)",
    },
    {
      icon: Target,
      name: "Grow",
      description: "A challenge tailored to your role",
      time: "~5 min",
      bgToken: "var(--success-surface)",
      iconToken: "var(--success)",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div
        className="glass-card w-full text-center p-8 sm:p-10"
        style={{ maxWidth: 620 }}
      >
        {/* Logo / Wordmark */}
        <div className="mb-8">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--accent)" }}
          >
            nymbl
          </span>
          <span
            className="text-2xl font-bold tracking-tight ml-1"
            style={{ fontFamily: "var(--font-heading)", color: "var(--cta)" }}
          >
            ascent
          </span>
        </div>

        {/* Greeting */}
        <h1
          className="text-4xl font-bold mb-3"
          style={{ color: "var(--text-primary)" }}
        >
          Welcome, {data.name}!
        </h1>

        {/* Role Badge */}
        <div className="mb-10">
          <span
            className="badge px-4 py-1.5 text-sm"
            style={{
              background: "var(--accent-surface)",
              color: "var(--accent)",
            }}
          >
            {data.roleName}
          </span>
        </div>

        {/* Stage Preview Cards — horizontal row */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(3, 1fr)",
            gap: 16,
            marginBottom: 32,
          }}
        >
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className="glass-card"
                style={{ padding: 20, textAlign: "left" }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    marginBottom: 12,
                    background: stage.bgToken,
                    borderRadius: "var(--radius-full)",
                  }}
                >
                  <Icon size={22} style={{ color: stage.iconToken }} />
                </div>
                <p
                  style={{
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    color: "var(--text-primary)",
                    marginBottom: 4,
                    whiteSpace: "nowrap",
                  }}
                >
                  Stage {idx + 1} &mdash; {stage.name}
                </p>
                <p
                  style={{
                    fontSize: "0.75rem",
                    lineHeight: 1.5,
                    color: "var(--text-secondary)",
                    marginBottom: 10,
                  }}
                >
                  {stage.description}
                </p>
                <span
                  className="badge"
                  style={{
                    fontSize: "0.6875rem",
                    padding: "2px 8px",
                    background: "var(--bg-elevated)",
                    color: "var(--text-muted)",
                  }}
                >
                  {stage.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Meta Line */}
        <div
          className="flex items-center justify-center gap-5 mb-8 text-sm"
          style={{ color: "var(--text-secondary)" }}
        >
          <span className="flex items-center gap-1.5">
            <Clock size={16} style={{ color: "var(--text-muted)" }} />
            ~10-15 min
          </span>
          <span className="flex items-center gap-1.5">
            <Shield size={16} style={{ color: "var(--text-muted)" }} />
            Pause &amp; resume anytime
          </span>
        </div>

        {/* CTA Button */}
        <button
          onClick={handleBegin}
          className="btn-cta w-full py-4 text-lg flex items-center justify-center gap-2"
          style={{ borderRadius: "var(--radius-lg)" }}
        >
          {data.status === "in_progress" ? "Resume Assessment" : "Begin Assessment"}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
