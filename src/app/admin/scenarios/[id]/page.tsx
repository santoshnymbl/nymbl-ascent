"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";

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
    return <p className="text-gray-500">Loading scenario...</p>;
  }

  if (!scenario) {
    return <p className="text-red-500">Scenario not found.</p>;
  }

  return (
    <div className="max-w-3xl">
      <button
        onClick={() => router.push("/admin/scenarios")}
        className="text-blue-600 hover:underline text-sm mb-4 inline-block"
      >
        &larr; Back to Scenarios
      </button>

      <h2 className="text-2xl font-bold mb-6">Edit Scenario</h2>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            className="h-4 w-4 text-blue-600 rounded"
          />
          <label htmlFor="published" className="text-sm font-medium text-gray-700">
            Published
          </label>
        </div>

        <div className="flex flex-wrap gap-2 text-xs">
          <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded">
            Stage {scenario.stage}
          </span>
          <span className="px-2 py-1 bg-indigo-100 text-indigo-700 rounded">
            {scenario.type}
          </span>
          {scenario.roleType && (
            <span className="px-2 py-1 bg-orange-100 text-orange-700 rounded">
              {scenario.roleType}
            </span>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scenario Tree (JSON)
          </label>
          <textarea
            value={treeJson}
            onChange={(e) => {
              setTreeJson(e.target.value);
              setTreeError("");
            }}
            rows={14}
            className={`w-full px-4 py-2 border rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
              treeError ? "border-red-400" : "border-gray-300"
            }`}
          />
          {treeError && (
            <p className="text-red-500 text-xs mt-1">{treeError}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Scoring Rubric (JSON)
          </label>
          <textarea
            value={rubricJson}
            onChange={(e) => {
              setRubricJson(e.target.value);
              setRubricError("");
            }}
            rows={10}
            className={`w-full px-4 py-2 border rounded-lg font-mono text-sm outline-none focus:ring-2 focus:ring-blue-500 ${
              rubricError ? "border-red-400" : "border-gray-300"
            }`}
          />
          {rubricError && (
            <p className="text-red-500 text-xs mt-1">{rubricError}</p>
          )}
        </div>

        <div className="flex gap-3 pt-2">
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition"
          >
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
