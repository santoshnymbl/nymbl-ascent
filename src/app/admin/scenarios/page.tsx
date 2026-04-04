"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TENET_LABELS, type Tenet } from "@/types";
import { Sparkles, ChevronRight } from "lucide-react";
import { Tooltip } from "@/components/ui/Tooltip";

interface Scenario {
  id: string;
  title: string;
  stage: number;
  type: string;
  roleType: string | null;
  tenets: string[];
  isPublished: boolean;
  tree: unknown;
  scoringRubric: unknown;
  createdAt: string;
}

const STAGE_FILTERS = [
  { label: "All", value: "" },
  { label: "Stage 1: Learn", value: "1" },
  { label: "Stage 2: Build", value: "2" },
  { label: "Stage 3: Grow", value: "3" },
];

const STAGE_TOOLTIP: Record<number, string> = {
  1: "Stage 1 evaluates quick decisions and instincts",
  2: "Stage 2 evaluates scenario-based problem solving",
  3: "Stage 3 evaluates growth mindset under challenge",
};

const DEFAULT_TENETS: Tenet[] = [
  "clientFocused",
  "empowering",
  "productive",
];

export default function AdminScenariosPage() {
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [stageFilter, setStageFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    fetchScenarios();
  }, [stageFilter]);

  async function fetchScenarios() {
    setLoading(true);
    try {
      const params = stageFilter ? `?stage=${stageFilter}` : "";
      const res = await fetch(`/api/admin/scenarios${params}`);
      const data = await res.json();
      setScenarios(data);
    } catch (err) {
      console.error("Failed to fetch scenarios", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAIGenerate() {
    setGenerating(true);
    try {
      const stage = stageFilter ? parseInt(stageFilter) : 2;
      const genRes = await fetch("/api/ai/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          targetTenets: DEFAULT_TENETS,
          roleType: "general",
          stage,
        }),
      });
      if (!genRes.ok) {
        throw new Error("AI generation failed");
      }
      const generated = await genRes.json();

      const saveRes = await fetch("/api/admin/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: generated.title || "AI Generated Scenario",
          stage: generated.stage || stage,
          type: generated.type || "core",
          roleType: generated.roleType || null,
          tree: generated.tree || { rootNodeId: "start", nodes: {} },
          tenets: generated.tenets || DEFAULT_TENETS,
          scoringRubric: generated.scoringRubric || {},
          isPublished: false,
        }),
      });
      if (!saveRes.ok) {
        throw new Error("Failed to save generated scenario");
      }
      await fetchScenarios();
    } catch (err) {
      console.error("AI generation error", err);
      alert("Failed to generate scenario. Check console for details.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 24,
        }}
      >
        <h2
          style={{
            fontSize: "1.5rem",
            fontWeight: 700,
            fontFamily: "var(--font-heading), 'Space Grotesk', sans-serif",
            color: "var(--text-primary)",
          }}
        >
          Scenarios
        </h2>
        <button
          onClick={handleAIGenerate}
          disabled={generating}
          className="btn-primary"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            opacity: generating ? 0.5 : 1,
          }}
        >
          <Sparkles size={16} style={{ color: "var(--accent-light)" }} />
          {generating ? "Generating..." : "AI Generate"}
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: 8, marginBottom: 24 }}>
        {STAGE_FILTERS.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setStageFilter(sf.value)}
            style={{
              padding: "8px 16px",
              borderRadius: "var(--radius-full)",
              fontSize: "0.875rem",
              fontWeight: 500,
              border: "1px solid",
              cursor: "pointer",
              transition: "all var(--transition-fast)",
              background:
                stageFilter === sf.value
                  ? "var(--accent)"
                  : "var(--bg-surface)",
              color:
                stageFilter === sf.value
                  ? "#fff"
                  : "var(--text-secondary)",
              borderColor:
                stageFilter === sf.value
                  ? "var(--accent)"
                  : "var(--border-default)",
            }}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Loading scenarios...
        </p>
      ) : scenarios.length === 0 ? (
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          No scenarios found. Use &quot;AI Generate&quot; to create one.
        </p>
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap: 16,
          }}
        >
          {scenarios.map((s) => (
            <Link
              key={s.id}
              href={`/admin/scenarios/${s.id}`}
              className="glass-card"
              style={{
                display: "block",
                padding: 20,
                textDecoration: "none",
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
                  marginBottom: 12,
                }}
              >
                <h3
                  style={{
                    fontWeight: 600,
                    fontSize: "1rem",
                    color: "var(--text-primary)",
                    lineHeight: 1.4,
                    paddingRight: 8,
                  }}
                >
                  {s.title}
                </h3>
                <ChevronRight
                  size={18}
                  style={{
                    color: "var(--text-muted)",
                    flexShrink: 0,
                    marginTop: 2,
                    transition: "color var(--transition-fast)",
                  }}
                />
              </div>

              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 8,
                  fontSize: "0.75rem",
                  marginBottom: 12,
                }}
              >
                <Tooltip
                  content={
                    STAGE_TOOLTIP[s.stage] || `Stage ${s.stage} scenario`
                  }
                >
                  <span
                    className="badge"
                    style={{
                      background: "var(--accent-surface)",
                      color: "var(--accent)",
                      cursor: "help",
                    }}
                  >
                    Stage {s.stage}
                  </span>
                </Tooltip>
                <span
                  className="badge"
                  style={{
                    background:
                      s.type === "core"
                        ? "var(--info-surface)"
                        : "var(--accent-surface)",
                    color:
                      s.type === "core" ? "var(--info)" : "var(--accent)",
                  }}
                >
                  {s.type}
                </span>
                {s.roleType && (
                  <span
                    className="badge"
                    style={{
                      background: "var(--warning-surface)",
                      color: "var(--warning)",
                    }}
                  >
                    {s.roleType}
                  </span>
                )}
                <Tooltip
                  content={
                    s.isPublished
                      ? "Visible to candidates"
                      : "Not visible to candidates"
                  }
                >
                  <span
                    className="badge"
                    style={{
                      background: s.isPublished
                        ? "var(--success-surface)"
                        : "var(--bg-elevated)",
                      color: s.isPublished
                        ? "var(--success)"
                        : "var(--text-muted)",
                      cursor: "help",
                    }}
                  >
                    {s.isPublished ? "Published" : "Draft"}
                  </span>
                </Tooltip>
              </div>

              <div
                style={{ display: "flex", flexWrap: "wrap", gap: 6 }}
              >
                {(s.tenets as string[]).map((t) => (
                  <span
                    key={t}
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      background: "var(--bg-elevated)",
                      color: "var(--text-muted)",
                      borderRadius: "var(--radius-full)",
                    }}
                  >
                    {TENET_LABELS[t as Tenet] || t}
                  </span>
                ))}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
