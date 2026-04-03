"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TENET_LABELS, type Tenet } from "@/types";
import { Sparkles, ChevronRight } from "lucide-react";

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

const STAGE_BADGE: Record<number, string> = {
  1: "bg-indigo-100 text-indigo-700",
  2: "bg-amber-100 text-amber-700",
  3: "bg-green-100 text-green-700",
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
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-800">
          Scenarios
        </h2>
        <button
          onClick={handleAIGenerate}
          disabled={generating}
          className="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700 disabled:opacity-50 transition-colors duration-150"
        >
          <Sparkles size={16} />
          {generating ? "Generating..." : "AI Generate"}
        </button>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {STAGE_FILTERS.map((sf) => (
          <button
            key={sf.value}
            onClick={() => setStageFilter(sf.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors duration-150 ${
              stageFilter === sf.value
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {sf.label}
          </button>
        ))}
      </div>

      {loading ? (
        <p className="text-slate-400 text-sm">Loading scenarios...</p>
      ) : scenarios.length === 0 ? (
        <p className="text-slate-400 text-sm">
          No scenarios found. Use &quot;AI Generate&quot; to create one.
        </p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scenarios.map((s) => (
            <Link
              key={s.id}
              href={`/admin/scenarios/${s.id}`}
              className="group block bg-white rounded-xl border border-slate-200 hover:border-blue-500 transition-colors duration-150 p-5"
            >
              <div className="flex items-start justify-between mb-3">
                <h3 className="font-semibold text-base text-slate-800 leading-snug pr-2">
                  {s.title}
                </h3>
                <ChevronRight
                  size={18}
                  className="text-slate-300 group-hover:text-blue-500 transition-colors duration-150 shrink-0 mt-0.5"
                />
              </div>

              <div className="flex flex-wrap gap-2 text-xs mb-3">
                <span
                  className={`px-2.5 py-1 rounded-full font-medium ${STAGE_BADGE[s.stage] ?? "bg-slate-100 text-slate-600"}`}
                >
                  Stage {s.stage}
                </span>
                <span
                  className={`px-2.5 py-1 rounded-full font-medium ${
                    s.type === "core"
                      ? "bg-blue-100 text-blue-700"
                      : "bg-purple-100 text-purple-700"
                  }`}
                >
                  {s.type}
                </span>
                {s.roleType && (
                  <span className="px-2.5 py-1 rounded-full font-medium bg-orange-100 text-orange-700">
                    {s.roleType}
                  </span>
                )}
                <span
                  className={`px-2.5 py-1 rounded-full font-medium ${
                    s.isPublished
                      ? "bg-green-100 text-green-700"
                      : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {s.isPublished ? "Published" : "Draft"}
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5">
                {(s.tenets as string[]).map((t) => (
                  <span
                    key={t}
                    className="text-xs px-2 py-0.5 bg-slate-100 text-slate-500 rounded-full"
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
