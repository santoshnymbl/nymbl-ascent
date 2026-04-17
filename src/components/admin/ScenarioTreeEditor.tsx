"use client";

import { useState } from "react";
import {
  ChevronRight,
  ChevronDown,
  Trash2,
} from "lucide-react";
import { TENETS, TENET_LABELS } from "@/types";
import type {
  ScenarioTree,
  ScenarioNode,
  ScenarioOption,
  Tenet,
} from "@/types";

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function makeEmptyOption(): ScenarioOption {
  return { id: genId(), label: "", text: "", consequence: "", scores: {} };
}

function makeEmptyNode(): ScenarioNode {
  return { id: genId(), text: "" };
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 2 }}>
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

function TenetScoreEditor({ scores, onChange }: { scores: Partial<Record<Tenet, number>>; onChange: (scores: Partial<Record<Tenet, number>>) => void }) {
  const entries = Object.entries(scores) as [Tenet, number][];
  const usedTenets = new Set(entries.map(([t]) => t));
  const available = TENETS.filter((t) => !usedTenets.has(t));

  function updateTenet(oldTenet: Tenet, newTenet: Tenet) {
    const updated = { ...scores };
    const val = updated[oldTenet] ?? 0;
    delete updated[oldTenet];
    updated[newTenet] = val;
    onChange(updated);
  }
  function updateValue(tenet: Tenet, value: number) {
    onChange({ ...scores, [tenet]: Math.max(0, Math.min(10, value)) });
  }
  function removeTenet(tenet: Tenet) {
    const updated = { ...scores };
    delete updated[tenet];
    onChange(updated);
  }
  function addTenet() {
    if (available.length === 0) return;
    onChange({ ...scores, [available[0]]: 5 });
  }

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 6, alignItems: "center" }}>
      {entries.map(([tenet, value]) => (
        <div key={tenet} style={{ display: "flex", alignItems: "center", gap: 4, background: "var(--bg-input)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "4px 8px" }}>
          <select value={tenet} onChange={(e) => updateTenet(tenet, e.target.value as Tenet)} style={{ background: "transparent", border: "none", color: "var(--accent-light)", fontSize: "0.75rem", outline: "none", cursor: "pointer" }}>
            <option value={tenet}>{TENET_LABELS[tenet]}</option>
            {available.map((t) => (<option key={t} value={t}>{TENET_LABELS[t]}</option>))}
          </select>
          <input type="number" min={0} max={10} value={value} onChange={(e) => updateValue(tenet, Number(e.target.value))} style={{ width: 36, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "0.8rem", textAlign: "center", fontWeight: 700, outline: "none" }} />
          <button onClick={() => removeTenet(tenet)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, fontSize: "0.7rem" }} title="Remove tenet">&times;</button>
        </div>
      ))}
      <button onClick={addTenet} disabled={available.length === 0} style={{ background: "none", border: "none", color: "var(--accent)", cursor: available.length > 0 ? "pointer" : "not-allowed", fontSize: "0.75rem", fontWeight: 600, padding: "4px 8px", opacity: available.length > 0 ? 1 : 0.4 }}>+ Add</button>
    </div>
  );
}

function OptionEditor({ option, index, nodeIds, onUpdate, onDelete, onAddFollowUp }: { option: ScenarioOption; index: number; nodeIds: string[]; onUpdate: (updated: ScenarioOption) => void; onDelete: () => void; onAddFollowUp: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const letter = String.fromCharCode(65 + index);

  return (
    <div style={{ marginLeft: 24, border: expanded ? "2px solid var(--accent)" : "1px solid var(--success-surface)", borderRadius: "var(--radius-md)", padding: expanded ? 14 : 10, marginBottom: 8, background: expanded ? "var(--accent-surface)" : "rgba(52, 211, 153, 0.04)", boxShadow: expanded ? "0 0 12px var(--accent-glow)" : "none", transition: "all var(--transition-fast)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={14} style={{ color: "var(--accent)" }} /> : <ChevronRight size={14} style={{ color: "var(--success)" }} />}
        <span style={{ fontSize: "0.7rem", background: "var(--success-surface)", color: "var(--success)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>{letter}</span>
        <span style={{ flex: 1, color: "var(--text-primary)", fontSize: "0.82rem", fontWeight: expanded ? 600 : 400 }}>{option.label || "(empty choice)"}</span>
        {!expanded && Object.keys(option.scores).length > 0 && (
          <div style={{ display: "flex", gap: 3 }}>
            {Object.entries(option.scores).map(([t, v]) => (
              <span key={t} style={{ fontSize: "0.6rem", background: "var(--accent-surface)", color: "var(--accent-light)", padding: "2px 6px", borderRadius: "var(--radius-full)" }}>{TENET_LABELS[t as Tenet]?.slice(0, 3)} {v}</span>
            ))}
          </div>
        )}
        <button onClick={(e) => { e.stopPropagation(); onDelete(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 2 }} title="Delete choice"><Trash2 size={13} /></button>
      </div>
      {expanded && (
        <div style={{ marginTop: 12, marginLeft: 28, display: "flex", flexDirection: "column", gap: 10 }}>
          <FieldRow label="LABEL"><input type="text" value={option.label} onChange={(e) => onUpdate({ ...option, label: e.target.value })} placeholder="Short choice text" className="input-field" style={{ width: "100%", fontSize: "0.82rem" }} /></FieldRow>
          <FieldRow label="TEXT"><textarea value={option.text} onChange={(e) => onUpdate({ ...option, text: e.target.value })} placeholder="Longer description" rows={2} className="input-field" style={{ width: "100%", fontSize: "0.82rem", resize: "vertical" }} /></FieldRow>
          <FieldRow label="CONSEQUENCE"><textarea value={option.consequence} onChange={(e) => onUpdate({ ...option, consequence: e.target.value })} placeholder="What happens after this choice" rows={2} className="input-field" style={{ width: "100%", fontSize: "0.82rem", resize: "vertical" }} /></FieldRow>
          <FieldRow label="TENET SCORES (0-10)"><TenetScoreEditor scores={option.scores} onChange={(scores) => onUpdate({ ...option, scores })} /></FieldRow>
          <FieldRow label="NEXT NODE">
            <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
              <select value={option.nextNodeId || ""} onChange={(e) => onUpdate({ ...option, nextNodeId: e.target.value || undefined })} className="input-field" style={{ fontSize: "0.82rem", flex: 1 }}>
                <option value="">End scenario (terminal)</option>
                {nodeIds.map((nid) => (<option key={nid} value={nid}>{nid}</option>))}
              </select>
              {!option.nextNodeId && (
                <button onClick={onAddFollowUp} style={{ background: "none", border: "1px solid var(--info)", color: "var(--info)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)", whiteSpace: "nowrap" }}>+ Follow-up</button>
              )}
            </div>
          </FieldRow>
        </div>
      )}
    </div>
  );
}

function NodeEditor({ node, tree, isRoot, label, onUpdateTree }: { node: ScenarioNode; tree: ScenarioTree; isRoot: boolean; label: string; onUpdateTree: (tree: ScenarioTree) => void }) {
  const [expanded, setExpanded] = useState(isRoot);
  const nodeIds = Object.keys(tree.nodes);

  function updateNode(updated: ScenarioNode) {
    onUpdateTree({ ...tree, nodes: { ...tree.nodes, [node.id]: updated } });
  }
  function addChoice() {
    const newOpt = makeEmptyOption();
    updateNode({ ...node, options: [...(node.options || []), newOpt] });
  }
  function updateOption(idx: number, updated: ScenarioOption) {
    const opts = [...(node.options || [])];
    opts[idx] = updated;
    updateNode({ ...node, options: opts });
  }
  function deleteOption(idx: number) {
    const opts = [...(node.options || [])];
    const opt = opts[idx];
    opts.splice(idx, 1);
    const updated: ScenarioTree = { ...tree, nodes: { ...tree.nodes, [node.id]: { ...node, options: opts } } };
    if (opt.nextNodeId) {
      const stillReferenced = Object.values(updated.nodes).some((n) => n.options?.some((o) => o.nextNodeId === opt.nextNodeId));
      if (!stillReferenced && opt.nextNodeId !== tree.rootNodeId) {
        delete updated.nodes[opt.nextNodeId];
      }
    }
    onUpdateTree(updated);
  }
  function addFollowUp(optIdx: number) {
    const newNode = makeEmptyNode();
    const opts = [...(node.options || [])];
    opts[optIdx] = { ...opts[optIdx], nextNodeId: newNode.id };
    onUpdateTree({ ...tree, nodes: { ...tree.nodes, [node.id]: { ...node, options: opts }, [newNode.id]: newNode } });
  }
  function deleteNode() {
    if (isRoot) return;
    const updated = { ...tree, nodes: { ...tree.nodes } };
    delete updated.nodes[node.id];
    for (const n of Object.values(updated.nodes)) {
      if (n.options) {
        for (const opt of n.options) {
          if (opt.nextNodeId === node.id) opt.nextNodeId = undefined;
        }
      }
    }
    onUpdateTree(updated);
  }

  const borderColor = isRoot ? "var(--accent)" : "var(--info)";
  const bgColor = isRoot ? "var(--accent-surface)" : "var(--info-surface)";

  return (
    <div style={{ border: `1px solid ${borderColor}`, borderRadius: "var(--radius-md)", padding: 14, marginBottom: 10, background: expanded ? bgColor : "transparent", transition: "all var(--transition-fast)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setExpanded(!expanded)}>
        {expanded ? <ChevronDown size={14} style={{ color: borderColor }} /> : <ChevronRight size={14} style={{ color: borderColor }} />}
        <span style={{ fontSize: "0.65rem", background: bgColor, color: borderColor, padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700, textTransform: "uppercase" }}>{label}</span>
        <span style={{ flex: 1, color: "var(--text-primary)", fontSize: "0.82rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{node.text || "(empty prompt)"}</span>
        {!isRoot && (
          <button onClick={(e) => { e.stopPropagation(); deleteNode(); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 2 }} title="Delete node"><Trash2 size={13} /></button>
        )}
      </div>
      {expanded && (
        <div style={{ marginTop: 12 }}>
          <FieldRow label="PROMPT TEXT">
            <textarea value={node.text} onChange={(e) => updateNode({ ...node, text: e.target.value })} placeholder="The scenario text shown to the candidate" rows={3} className="input-field" style={{ width: "100%", fontSize: "0.82rem", resize: "vertical" }} />
          </FieldRow>
          <div style={{ marginTop: 14 }}>
            <div style={{ fontSize: "0.7rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 8 }}>Choices ({(node.options || []).length})</div>
            {(node.options || []).map((opt, idx) => (
              <OptionEditor key={opt.id} option={opt} index={idx} nodeIds={nodeIds} onUpdate={(updated) => updateOption(idx, updated)} onDelete={() => deleteOption(idx)} onAddFollowUp={() => addFollowUp(idx)} />
            ))}
            <button onClick={addChoice} style={{ marginLeft: 24, background: "none", border: "1px dashed var(--border-default)", color: "var(--accent)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, padding: "8px 16px", borderRadius: "var(--radius-md)", width: "calc(100% - 24px)", transition: "all var(--transition-fast)" }}>
              + Add Choice {String.fromCharCode(65 + (node.options || []).length)}
            </button>
          </div>
          {(node.options || []).filter((opt) => opt.nextNodeId && tree.nodes[opt.nextNodeId]).map((opt) => {
            const letter = String.fromCharCode(65 + (node.options || []).indexOf(opt));
            return (
              <div key={opt.nextNodeId} style={{ marginLeft: 24, marginTop: 10 }}>
                <NodeEditor node={tree.nodes[opt.nextNodeId!]} tree={tree} isRoot={false} label={`${label !== "ROOT" ? label + "." : ""}${letter} follow-up`} onUpdateTree={onUpdateTree} />
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function ScenarioTreeEditor({ tree, onChange }: { tree: ScenarioTree; onChange: (tree: ScenarioTree) => void }) {
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");
  const root = tree.nodes[tree.rootNodeId];

  function handleJsonToggle() {
    if (!showJson) { setJsonText(JSON.stringify(tree, null, 2)); setJsonError(""); }
    setShowJson(!showJson);
  }
  function handleJsonApply() {
    try {
      const parsed = JSON.parse(jsonText) as ScenarioTree;
      if (!parsed.rootNodeId || !parsed.nodes) { setJsonError("Missing rootNodeId or nodes"); return; }
      onChange(parsed);
      setJsonError("");
      setShowJson(false);
    } catch { setJsonError("Invalid JSON"); }
  }

  if (!root) {
    return (
      <div style={{ padding: 20, color: "var(--text-muted)", fontSize: "0.875rem" }}>
        No tree data. Create a root node to start.
        <button onClick={() => { const r = makeEmptyNode(); onChange({ rootNodeId: r.id, nodes: { [r.id]: r } }); }} className="btn-primary" style={{ marginLeft: 12, fontSize: "0.82rem" }}>+ Create Root</button>
      </div>
    );
  }

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>Scenario Tree</div>
        <button onClick={handleJsonToggle} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)" }}>{showJson ? "Hide JSON" : "View JSON"}</button>
      </div>
      {showJson && (
        <div style={{ marginBottom: 16 }}>
          <textarea value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonError(""); }} rows={12} style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-lg)", fontFamily: "monospace", fontSize: "0.82rem", outline: "none", background: "var(--bg-surface-solid)", color: "var(--accent-light)", border: `1px solid ${jsonError ? "var(--error)" : "var(--border-default)"}`, resize: "vertical" }} />
          {jsonError && <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: 4 }}>{jsonError}</p>}
          <button onClick={handleJsonApply} className="btn-primary" style={{ marginTop: 8, fontSize: "0.78rem" }}>Apply JSON</button>
        </div>
      )}
      <NodeEditor node={root} tree={tree} isRoot={true} label="ROOT" onUpdateTree={onChange} />
    </div>
  );
}
