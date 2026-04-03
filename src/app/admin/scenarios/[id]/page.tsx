"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";

interface ScenarioData {
  id: string;
  title: string;
  stage: number;
  type: string;
  roleType: string | null;
  tenets: string[];
  tree: unknown;
  scoringRubric: unknown;
  isPublished: boolean;
}

const STAGE_BADGE: Record<number, string> = {
  1: "bg-indigo-100 text-indigo-700",
  2: "bg-amber-100 text-amber-700",
  3: "bg-green-100 text-green-700",
};

export default function AdminScenarioEditorPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const router = useRouter();
  const [scenario, setScenario] = useState<ScenarioData | null>(null);
  const [title, setTitle] = useState("");
  const [isPublished, setIsPublished] = useState(false);
  const [treeJson, setTreeJson] = useState("");
  const [rubricJson, setRubricJson] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [treeError, setTreeError] = useState("");
  const [rubricError, setRubricError] = useState("");

  useEffect(() => {
    async function fetchScenario() {
      try {
        const res = await fetch(`/api/admin/scenarios/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data: ScenarioData = await res.json();
        setScenario(data);
        setTitle(data.title);
        setIsPublished(data.isPublished);
        setTreeJson(JSON.stringify(data.tree, null, 2));
        setRubricJson(JSON.stringify(data.scoringRubric, null, 2));
      } catch (err) {
        console.error("Failed to fetch scenario", err);
      } finally {
        setLoading(false);
      }
    }
    fetchScenario();
  }, [id]);

  function validateJson(value: string, setError: (e: string) => void): boolean {
    try {
      JSON.parse(value);
      setError("");
      return true;
    } catch {
      setError("Invalid JSON");
      return false;
    }
  }

  async function handleSave() {
    if (!scenario) return;
    const treeValid = validateJson(treeJson, setTreeError);
    const rubricValid = validateJson(rubricJson, setRubricError);
    if (!treeValid || !rubricValid) return;

    setSaving(true);
    try {
      const res = await fetch(`/api/admin/scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          stage: scenario.stage,
          type: scenario.type,
          roleType: scenario.roleType,
          tenets: scenario.tenets,
          tree: JSON.parse(treeJson),
          scoringRubric: JSON.parse(rubricJson),
          isPublished,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      router.push("/admin/scenarios");
    } catch (err) {
      console.error("Failed to save scenario", err);
      alert("Failed to save scenario.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Are you sure you want to delete this scenario?")) return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/scenarios/${id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Delete failed");
      router.push("/admin/scenarios");
    } catch (err) {
      console.error("Failed to delete scenario", err);
      alert("Failed to delete scenario.");
    } finally {
      setDeleting(false);
    }
  }

  if (loading) {
    return <p className="text-slate-400 text-sm">Loading scenario...</p>;
  }

  if (!scenario) {
    return <p className="text-red-600 text-sm">Scenario not found.</p>;
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/admin/scenarios")}
        className="inline-flex items-center gap-1.5 text-slate-500 hover:text-blue-600 text-sm mb-5 transition-colors duration-150"
      >
        <ArrowLeft size={16} />
        Back to Scenarios
      </button>

      <h2 className="text-2xl font-bold font-[family-name:var(--font-heading)] text-slate-800 mb-6">
        Edit Scenario
      </h2>

      <div className="space-y-6">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors duration-150 text-sm"
          />
        </div>

        {/* Published toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
          />
          <label htmlFor="published" className="text-sm font-medium text-slate-700">
            Published
          </label>
        </div>

        {/* Meta badges */}
        <div className="flex flex-wrap gap-2 text-xs">
          <span
            className={`px-2.5 py-1 rounded-full font-medium ${STAGE_BADGE[scenario.stage] ?? "bg-slate-100 text-slate-600"}`}
          >
            Stage {scenario.stage}
          </span>
          <span
            className={`px-2.5 py-1 rounded-full font-medium ${
              scenario.type === "core"
                ? "bg-blue-100 text-blue-700"
                : "bg-purple-100 text-purple-700"
            }`}
          >
            {scenario.type}
          </span>
          {scenario.roleType && (
            <span className="px-2.5 py-1 rounded-full font-medium bg-orange-100 text-orange-700">
              {scenario.roleType}
            </span>
          )}
        </div>

        {/* Tree JSON */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Scenario Tree (JSON)
          </label>
          <textarea
            value={treeJson}
            onChange={(e) => {
              setTreeJson(e.target.value);
              setTreeError("");
            }}
            rows={14}
            className={`w-full px-4 py-3 rounded-xl font-mono text-sm outline-none transition-colors duration-150 bg-slate-900 text-green-400 placeholder-slate-600 ${
              treeError
                ? "ring-2 ring-red-500"
                : "focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {treeError && (
            <p className="text-red-600 text-xs mt-1">{treeError}</p>
          )}
        </div>

        {/* Rubric JSON */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-1">
            Scoring Rubric (JSON)
          </label>
          <textarea
            value={rubricJson}
            onChange={(e) => {
              setRubricJson(e.target.value);
              setRubricError("");
            }}
            rows={10}
            className={`w-full px-4 py-3 rounded-xl font-mono text-sm outline-none transition-colors duration-150 bg-slate-900 text-green-400 placeholder-slate-600 ${
              rubricError
                ? "ring-2 ring-red-500"
                : "focus:ring-2 focus:ring-blue-500"
            }`}
          />
          {rubricError && (
            <p className="text-red-600 text-xs mt-1">{rubricError}</p>
          )}
        </div>

        {/* Actions */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors duration-150"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-6 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 disabled:opacity-50 transition-colors duration-150"
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
