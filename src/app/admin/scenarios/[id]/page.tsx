"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2 } from "lucide-react";
import ScenarioTreeEditor from "@/components/admin/ScenarioTreeEditor";
import { buildPathScores } from "@/components/admin/buildPathScores";
import type { ScenarioTree } from "@/types";

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
  const [tree, setTree] = useState<ScenarioTree | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    async function fetchScenario() {
      try {
        const res = await fetch(`/api/admin/scenarios/${id}`);
        if (!res.ok) throw new Error("Not found");
        const data: ScenarioData = await res.json();
        setScenario(data);
        setTitle(data.title);
        setIsPublished(data.isPublished);
        const rawTree = data.tree as ScenarioTree;
        if (rawTree?.rootNodeId && rawTree?.nodes) {
          setTree(rawTree);
        } else {
          // Legacy or malformed tree — wrap in a valid structure
          setTree({ rootNodeId: "root", nodes: { root: { id: "root", text: "" } } });
        }
      } catch (err) {
        console.error("Failed to fetch scenario", err);
      } finally {
        setLoading(false);
      }
    }
    fetchScenario();
  }, [id]);

  async function handleSave() {
    if (!scenario || !tree) return;

    setSaving(true);
    try {
      const scoringRubric = {
        scenarioId: scenario.id,
        pathScores: buildPathScores(tree),
      };

      const res = await fetch(`/api/admin/scenarios/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          stage: scenario.stage,
          type: scenario.type,
          roleType: scenario.roleType,
          tenets: scenario.tenets,
          tree,
          scoringRubric,
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
    return (
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
        Loading scenario...
      </p>
    );
  }

  if (!scenario) {
    return (
      <p style={{ color: "var(--error)", fontSize: "0.875rem" }}>
        Scenario not found.
      </p>
    );
  }

  return (
    <div style={{ maxWidth: 768 }}>
      <button
        onClick={() => router.push("/admin/scenarios")}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          color: "var(--text-secondary)",
          fontSize: "0.875rem",
          marginBottom: 20,
          background: "none",
          border: "none",
          cursor: "pointer",
          padding: 0,
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
        Back to Scenarios
      </button>

      <h2
        style={{
          fontSize: "1.5rem",
          fontWeight: 700,
          fontFamily: "var(--font-heading), 'Montserrat', sans-serif",
          color: "var(--text-primary)",
          marginBottom: 24,
        }}
      >
        Edit Scenario
      </h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 24 }}>
        {/* Title */}
        <div>
          <label
            style={{
              display: "block",
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
              marginBottom: 4,
            }}
          >
            Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="input-field"
            style={{ width: "100%" }}
          />
        </div>

        {/* Published toggle */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <input
            type="checkbox"
            id="published"
            checked={isPublished}
            onChange={(e) => setIsPublished(e.target.checked)}
            style={{
              width: 16,
              height: 16,
              accentColor: "var(--accent)",
              cursor: "pointer",
            }}
          />
          <label
            htmlFor="published"
            style={{
              fontSize: "0.875rem",
              fontWeight: 500,
              color: "var(--text-secondary)",
              cursor: "pointer",
            }}
          >
            Published
          </label>
        </div>

        {/* Meta badges */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 8,
            fontSize: "0.75rem",
          }}
        >
          <span
            className="badge"
            style={{
              background: "var(--accent-surface)",
              color: "var(--accent)",
            }}
          >
            Stage {scenario.stage}
          </span>
          <span
            className="badge"
            style={{
              background:
                scenario.type === "core"
                  ? "var(--info-surface)"
                  : "var(--accent-surface)",
              color:
                scenario.type === "core" ? "var(--info)" : "var(--accent)",
            }}
          >
            {scenario.type}
          </span>
          {scenario.roleType && (
            <span
              className="badge"
              style={{
                background: "var(--warning-surface)",
                color: "var(--warning)",
              }}
            >
              {scenario.roleType}
            </span>
          )}
        </div>

        {/* Visual Tree Editor */}
        {tree && (
          <ScenarioTreeEditor tree={tree} onChange={setTree} />
        )}

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, paddingTop: 8 }}>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              opacity: saving ? 0.5 : 1,
            }}
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save"}
          </button>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="btn-ghost"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              color: "var(--error)",
              opacity: deleting ? 0.5 : 1,
            }}
          >
            <Trash2 size={16} />
            {deleting ? "Deleting..." : "Delete"}
          </button>
        </div>
      </div>
    </div>
  );
}
