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
        style={{ background: "var(--bg-primary)" }}
      >
        <div className="max-w-xl w-full px-6 space-y-6 animate-pulse">
          {/* Skeleton: logo */}
          <div className="h-8 w-48 rounded-lg mx-auto" style={{ background: "var(--border-light)" }} />
          {/* Skeleton: heading */}
          <div className="h-10 w-72 rounded-lg mx-auto" style={{ background: "var(--border-light)" }} />
          {/* Skeleton: badge */}
          <div className="h-7 w-36 rounded-full mx-auto" style={{ background: "var(--border-light)" }} />
          {/* Skeleton: 3 cards */}
          <div className="grid grid-cols-3 gap-4 pt-4">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-36 rounded-xl"
                style={{ background: "var(--border-light)" }}
              />
            ))}
          </div>
          {/* Skeleton: button */}
          <div className="h-14 rounded-xl" style={{ background: "var(--border-light)" }} />
        </div>
      </div>
    );
  }

  /* ---------- Error ---------- */
  if (error) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: "var(--bg-primary)" }}
      >
        <div
          className="max-w-md w-full mx-4 text-center rounded-2xl p-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "#FEF2F2" }}
          >
            <AlertCircle size={32} style={{ color: "var(--nymbl-error)" }} />
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
        style={{ background: "var(--bg-primary)" }}
      >
        <div
          className="max-w-md w-full mx-4 text-center rounded-2xl p-8"
          style={{
            background: "var(--bg-card)",
            border: "1px solid var(--border-light)",
          }}
        >
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
            style={{ background: "#F0FDF4" }}
          >
            <CheckCircle2 size={32} style={{ color: "var(--nymbl-success)" }} />
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
      description: "Quick-fire games to see how you prioritize, match values, and spot patterns.",
      time: "~3 min",
      bgColor: "#EEF2FF",
      iconColor: "#4F46E5",
    },
    {
      icon: Brain,
      name: "Build",
      description: "Navigate realistic workplace scenarios and make decisions under pressure.",
      time: "~5 min",
      bgColor: "#FFFBEB",
      iconColor: "#D97706",
    },
    {
      icon: Target,
      name: "Grow",
      description: "A challenge tailored to your role. Show us your skills.",
      time: "~5 min",
      bgColor: "#F0FDF4",
      iconColor: "#16A34A",
    },
  ];

  return (
    <div
      className="min-h-screen flex items-center justify-center py-12 px-4"
      style={{ background: "var(--bg-primary)" }}
    >
      <div className="max-w-xl w-full text-center">
        {/* Logo / Wordmark */}
        <div className="mb-8">
          <span
            className="text-2xl font-bold tracking-tight"
            style={{ fontFamily: "var(--font-heading)", color: "var(--nymbl-primary)" }}
          >
            nymbl
          </span>
          <span
            className="text-2xl font-bold tracking-tight ml-1"
            style={{ fontFamily: "var(--font-heading)", color: "var(--nymbl-cta)" }}
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
            className="inline-block px-4 py-1.5 rounded-full text-sm font-semibold"
            style={{
              background: "#EFF6FF",
              color: "var(--nymbl-primary)",
            }}
          >
            {data.roleName}
          </span>
        </div>

        {/* Stage Preview Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          {stages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div
                key={idx}
                className="rounded-xl p-5 text-left"
                style={{
                  background: "var(--bg-card)",
                  border: "1px solid var(--border-light)",
                  transition: "var(--transition-base)",
                }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center mb-3"
                  style={{ background: stage.bgColor }}
                >
                  <Icon size={20} style={{ color: stage.iconColor }} />
                </div>
                <p
                  className="font-semibold text-sm mb-1"
                  style={{ color: "var(--text-primary)" }}
                >
                  Stage {idx + 1} &mdash; {stage.name}
                </p>
                <p
                  className="text-xs leading-relaxed mb-2"
                  style={{ color: "var(--text-secondary)" }}
                >
                  {stage.description}
                </p>
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                >
                  {stage.time}
                </span>
              </div>
            );
          })}
        </div>

        {/* Info Line */}
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
          className="w-full py-4 rounded-xl font-semibold text-lg text-white flex items-center justify-center gap-2 cursor-pointer"
          style={{
            background: "var(--nymbl-cta)",
            transition: "var(--transition-fast)",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.background = "var(--nymbl-cta-hover)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.background = "var(--nymbl-cta)")
          }
        >
          {data.status === "in_progress" ? "Resume Assessment" : "Begin Assessment"}
          <ArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
