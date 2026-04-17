"use client";

import { useState } from "react";
import { ChevronRight, ChevronDown, Trash2, Plus } from "lucide-react";
import { TENETS, TENET_LABELS } from "@/types";
import type { Tenet } from "@/types";

// ---------------------------------------------------------------------------
// Shared helpers
// ---------------------------------------------------------------------------

function genId(): string {
  return Math.random().toString(36).slice(2, 10);
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 6 }}>
      <div style={{ fontSize: "0.68rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: 3 }}>{label}</div>
      {children}
    </div>
  );
}

function TenetScoreMap({ scores, onChange, maxVal = 10 }: { scores: Partial<Record<Tenet, number>>; onChange: (s: Partial<Record<Tenet, number>>) => void; maxVal?: number }) {
  const entries = Object.entries(scores) as [Tenet, number][];
  const used = new Set(entries.map(([t]) => t));
  const avail = TENETS.filter((t) => !used.has(t));

  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 5, alignItems: "center" }}>
      {entries.map(([tenet, value]) => (
        <div key={tenet} style={{ display: "flex", alignItems: "center", gap: 3, background: "var(--bg-input)", border: "1px solid var(--border-default)", borderRadius: "var(--radius-sm)", padding: "3px 6px" }}>
          <select value={tenet} onChange={(e) => { const u = { ...scores }; const v = u[tenet] ?? 0; delete u[tenet]; u[e.target.value as Tenet] = v; onChange(u); }} style={{ background: "transparent", border: "none", color: "var(--accent-light)", fontSize: "0.72rem", outline: "none", cursor: "pointer" }}>
            <option value={tenet}>{TENET_LABELS[tenet]}</option>
            {avail.map((t) => <option key={t} value={t}>{TENET_LABELS[t]}</option>)}
          </select>
          <input type="number" min={0} max={maxVal} value={value} onChange={(e) => onChange({ ...scores, [tenet]: Math.max(0, Math.min(maxVal, Number(e.target.value))) })} style={{ width: 32, background: "transparent", border: "none", color: "var(--text-primary)", fontSize: "0.78rem", textAlign: "center", fontWeight: 700, outline: "none" }} />
          <button onClick={() => { const u = { ...scores }; delete u[tenet]; onChange(u); }} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", padding: 0, fontSize: "0.65rem" }}>&times;</button>
        </div>
      ))}
      <button onClick={() => { if (avail.length) onChange({ ...scores, [avail[0]]: 5 }); }} disabled={!avail.length} style={{ background: "none", border: "none", color: "var(--accent)", cursor: avail.length ? "pointer" : "not-allowed", fontSize: "0.72rem", fontWeight: 600, opacity: avail.length ? 1 : 0.4 }}>+ Add</button>
    </div>
  );
}

function Input({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
  return <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className="input-field" style={{ width: "100%", fontSize: "0.82rem" }} />;
}

function TextArea({ value, onChange, placeholder, rows = 2 }: { value: string; onChange: (v: string) => void; placeholder?: string; rows?: number }) {
  return <textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} rows={rows} className="input-field" style={{ width: "100%", fontSize: "0.82rem", resize: "vertical" }} />;
}

// ---------------------------------------------------------------------------
// Triage Tower Editor
// ---------------------------------------------------------------------------

interface TriageItem {
  id: string;
  label: string;
  description: string;
  isInterrupt?: boolean;
  binScores: Record<"doNow" | "doNext" | "delegate", Partial<Record<Tenet, number>>>;
}

function TriageTowerEditor({ items, onChange }: { items: TriageItem[]; onChange: (items: TriageItem[]) => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function update(idx: number, item: TriageItem) {
    const a = [...items]; a[idx] = item; onChange(a);
  }
  function remove(idx: number) {
    onChange(items.filter((_, i) => i !== idx));
    if (openIdx === idx) setOpenIdx(null);
  }
  function add() {
    onChange([...items, { id: genId(), label: "", description: "", binScores: { doNow: {}, doNext: {}, delegate: {} } }]);
    setOpenIdx(items.length);
  }

  return (
    <div>
      {items.map((item, idx) => {
        const open = openIdx === idx;
        return (
          <div key={item.id} style={{ border: open ? "2px solid var(--accent)" : "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: open ? 14 : 10, marginBottom: 8, background: open ? "var(--accent-surface)" : "transparent", transition: "all var(--transition-fast)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setOpenIdx(open ? null : idx)}>
              {open ? <ChevronDown size={14} style={{ color: "var(--accent)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
              <span style={{ fontSize: "0.7rem", background: item.isInterrupt ? "var(--warning-surface)" : "var(--accent-surface)", color: item.isInterrupt ? "var(--warning)" : "var(--accent)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>{item.isInterrupt ? "INT" : idx + 1}</span>
              <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-primary)", fontWeight: open ? 600 : 400 }}>{item.label || "(untitled item)"}</span>
              <button onClick={(e) => { e.stopPropagation(); remove(idx); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 2 }}><Trash2 size={13} /></button>
            </div>
            {open && (
              <div style={{ marginTop: 10, marginLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                <FieldRow label="LABEL"><Input value={item.label} onChange={(v) => update(idx, { ...item, label: v })} placeholder="e.g. Client-Reported Bug" /></FieldRow>
                <FieldRow label="DESCRIPTION"><TextArea value={item.description} onChange={(v) => update(idx, { ...item, description: v })} placeholder="What the work item is about" /></FieldRow>
                <label style={{ display: "flex", alignItems: "center", gap: 6, fontSize: "0.78rem", color: "var(--text-secondary)", cursor: "pointer" }}>
                  <input type="checkbox" checked={!!item.isInterrupt} onChange={(e) => update(idx, { ...item, isInterrupt: e.target.checked })} style={{ accentColor: "var(--warning)" }} />
                  Interrupt item (appears mid-game)
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8, marginTop: 4 }}>
                  {(["doNow", "doNext", "delegate"] as const).map((bin) => (
                    <div key={bin} style={{ background: "var(--bg-input)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)", padding: 8 }}>
                      <div style={{ fontSize: "0.65rem", color: bin === "doNow" ? "var(--accent)" : bin === "doNext" ? "var(--warning)" : "var(--info)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>{bin === "doNow" ? "Do Now" : bin === "doNext" ? "Do Next" : "Delegate"}</div>
                      <TenetScoreMap scores={item.binScores[bin] || {}} onChange={(s) => update(idx, { ...item, binScores: { ...item.binScores, [bin]: s } })} />
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={add} style={{ width: "100%", background: "none", border: "1px dashed var(--border-default)", color: "var(--accent)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, padding: "8px 16px", borderRadius: "var(--radius-md)" }}>+ Add Item</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Trade-Off Tiles Editor
// ---------------------------------------------------------------------------

interface TradeOffPair {
  id: string;
  leftText: string;
  leftTenet: Tenet;
  rightText: string;
  rightTenet: Tenet;
}

function TradeOffEditor({ pairs, onChange }: { pairs: TradeOffPair[]; onChange: (p: TradeOffPair[]) => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function update(idx: number, pair: TradeOffPair) {
    const a = [...pairs]; a[idx] = pair; onChange(a);
  }
  function remove(idx: number) { onChange(pairs.filter((_, i) => i !== idx)); if (openIdx === idx) setOpenIdx(null); }
  function add() { onChange([...pairs, { id: genId(), leftText: "", leftTenet: "empowering", rightText: "", rightTenet: "productive" }]); setOpenIdx(pairs.length); }

  return (
    <div>
      {pairs.map((pair, idx) => {
        const open = openIdx === idx;
        return (
          <div key={pair.id} style={{ border: open ? "2px solid var(--accent)" : "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: open ? 14 : 10, marginBottom: 8, background: open ? "var(--accent-surface)" : "transparent", transition: "all var(--transition-fast)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setOpenIdx(open ? null : idx)}>
              {open ? <ChevronDown size={14} style={{ color: "var(--accent)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
              <span style={{ fontSize: "0.7rem", background: "var(--accent-surface)", color: "var(--accent)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>P{idx + 1}</span>
              <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-primary)" }}>{pair.leftTenet ? `${TENET_LABELS[pair.leftTenet]} vs ${TENET_LABELS[pair.rightTenet]}` : "(empty pair)"}</span>
              <button onClick={(e) => { e.stopPropagation(); remove(idx); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 2 }}><Trash2 size={13} /></button>
            </div>
            {open && (
              <div style={{ marginTop: 10, marginLeft: 24, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <FieldRow label="LEFT TEXT"><TextArea value={pair.leftText} onChange={(v) => update(idx, { ...pair, leftText: v })} placeholder="Left choice description" /></FieldRow>
                  <FieldRow label="LEFT TENET">
                    <select value={pair.leftTenet} onChange={(e) => update(idx, { ...pair, leftTenet: e.target.value as Tenet })} className="input-field" style={{ width: "100%", fontSize: "0.82rem" }}>
                      {TENETS.map((t) => <option key={t} value={t}>{TENET_LABELS[t]}</option>)}
                    </select>
                  </FieldRow>
                </div>
                <div>
                  <FieldRow label="RIGHT TEXT"><TextArea value={pair.rightText} onChange={(v) => update(idx, { ...pair, rightText: v })} placeholder="Right choice description" /></FieldRow>
                  <FieldRow label="RIGHT TENET">
                    <select value={pair.rightTenet} onChange={(e) => update(idx, { ...pair, rightTenet: e.target.value as Tenet })} className="input-field" style={{ width: "100%", fontSize: "0.82rem" }}>
                      {TENETS.map((t) => <option key={t} value={t}>{TENET_LABELS[t]}</option>)}
                    </select>
                  </FieldRow>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={add} style={{ width: "100%", background: "none", border: "1px dashed var(--border-default)", color: "var(--accent)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, padding: "8px 16px", borderRadius: "var(--radius-md)" }}>+ Add Pair</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Signal Sort Editor
// ---------------------------------------------------------------------------

interface SortMessage {
  id: string;
  author: string;
  avatar: string;
  text: string;
  idealScores: Partial<Record<Tenet, number>>;
  improveScores: Partial<Record<Tenet, number>>;
}

function SignalSortEditor({ messages, onChange }: { messages: SortMessage[]; onChange: (m: SortMessage[]) => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function update(idx: number, msg: SortMessage) { const a = [...messages]; a[idx] = msg; onChange(a); }
  function remove(idx: number) { onChange(messages.filter((_, i) => i !== idx)); if (openIdx === idx) setOpenIdx(null); }
  function add() { onChange([...messages, { id: genId(), author: "", avatar: "", text: "", idealScores: {}, improveScores: {} }]); setOpenIdx(messages.length); }

  return (
    <div>
      {messages.map((msg, idx) => {
        const open = openIdx === idx;
        return (
          <div key={msg.id} style={{ border: open ? "2px solid var(--accent)" : "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: open ? 14 : 10, marginBottom: 8, background: open ? "var(--accent-surface)" : "transparent", transition: "all var(--transition-fast)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setOpenIdx(open ? null : idx)}>
              {open ? <ChevronDown size={14} style={{ color: "var(--accent)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
              <span style={{ width: 24, height: 24, borderRadius: "var(--radius-full)", background: "var(--accent-surface)", color: "var(--accent)", display: "grid", placeItems: "center", fontSize: "0.7rem", fontWeight: 700, flexShrink: 0 }}>{msg.avatar || "?"}</span>
              <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-primary)" }}>{msg.author || "(unnamed)"}: {msg.text ? msg.text.slice(0, 60) + (msg.text.length > 60 ? "..." : "") : "(empty)"}</span>
              <button onClick={(e) => { e.stopPropagation(); remove(idx); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 2 }}><Trash2 size={13} /></button>
            </div>
            {open && (
              <div style={{ marginTop: 10, marginLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 80px", gap: 8 }}>
                  <FieldRow label="AUTHOR"><Input value={msg.author} onChange={(v) => update(idx, { ...msg, author: v })} placeholder="Alex Chen" /></FieldRow>
                  <FieldRow label="AVATAR"><Input value={msg.avatar} onChange={(v) => update(idx, { ...msg, avatar: v })} placeholder="A" /></FieldRow>
                </div>
                <FieldRow label="MESSAGE TEXT"><TextArea value={msg.text} onChange={(v) => update(idx, { ...msg, text: v })} placeholder="The Slack-style message text" rows={3} /></FieldRow>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div style={{ background: "var(--success-surface)", border: "1px solid var(--success)", borderRadius: "var(--radius-sm)", padding: 8 }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--success)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>If marked "Ideal"</div>
                    <TenetScoreMap scores={msg.idealScores} onChange={(s) => update(idx, { ...msg, idealScores: s })} />
                  </div>
                  <div style={{ background: "var(--error-surface)", border: "1px solid var(--error)", borderRadius: "var(--radius-sm)", padding: 8 }}>
                    <div style={{ fontSize: "0.65rem", color: "var(--error)", fontWeight: 700, textTransform: "uppercase", marginBottom: 6 }}>If marked "Improve"</div>
                    <TenetScoreMap scores={msg.improveScores} onChange={(s) => update(idx, { ...msg, improveScores: s })} />
                  </div>
                </div>
              </div>
            )}
          </div>
        );
      })}
      <button onClick={add} style={{ width: "100%", background: "none", border: "1px dashed var(--border-default)", color: "var(--accent)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, padding: "8px 16px", borderRadius: "var(--radius-md)" }}>+ Add Message</button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Resource Roulette Editor
// ---------------------------------------------------------------------------

interface RouletteCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  perTokenScores: Partial<Record<Tenet, number>>;
}

function ResourceRouletteEditor({ totalTokens, cards, curveball, onChange }: { totalTokens: number; cards: RouletteCard[]; curveball: unknown; onChange: (data: { totalTokens: number; cards: RouletteCard[]; curveball: unknown }) => void }) {
  const [openIdx, setOpenIdx] = useState<number | null>(null);

  function updateCard(idx: number, card: RouletteCard) { const a = [...cards]; a[idx] = card; onChange({ totalTokens, cards: a, curveball }); }
  function removeCard(idx: number) { onChange({ totalTokens, cards: cards.filter((_, i) => i !== idx), curveball }); if (openIdx === idx) setOpenIdx(null); }
  function addCard() { onChange({ totalTokens, cards: [...cards, { id: genId(), title: "", description: "", icon: "Circle", perTokenScores: {} }], curveball }); setOpenIdx(cards.length); }

  return (
    <div>
      <FieldRow label="TOTAL TOKENS">
        <input type="number" min={1} max={20} value={totalTokens} onChange={(e) => onChange({ totalTokens: Number(e.target.value), cards, curveball })} className="input-field" style={{ width: 80, fontSize: "0.82rem" }} />
      </FieldRow>
      <div style={{ marginTop: 10 }}>
        {cards.map((card, idx) => {
          const open = openIdx === idx;
          return (
            <div key={card.id} style={{ border: open ? "2px solid var(--accent)" : "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", padding: open ? 14 : 10, marginBottom: 8, background: open ? "var(--accent-surface)" : "transparent", transition: "all var(--transition-fast)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer" }} onClick={() => setOpenIdx(open ? null : idx)}>
                {open ? <ChevronDown size={14} style={{ color: "var(--accent)" }} /> : <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />}
                <span style={{ fontSize: "0.7rem", background: "var(--success-surface)", color: "var(--success)", padding: "2px 8px", borderRadius: "var(--radius-full)", fontWeight: 700 }}>{idx + 1}</span>
                <span style={{ flex: 1, fontSize: "0.82rem", color: "var(--text-primary)" }}>{card.title || "(untitled card)"}</span>
                <button onClick={(e) => { e.stopPropagation(); removeCard(idx); }} style={{ background: "none", border: "none", cursor: "pointer", color: "var(--error)", padding: 2 }}><Trash2 size={13} /></button>
              </div>
              {open && (
                <div style={{ marginTop: 10, marginLeft: 24, display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 100px", gap: 8 }}>
                    <FieldRow label="TITLE"><Input value={card.title} onChange={(v) => updateCard(idx, { ...card, title: v })} placeholder="e.g. Help a Struggling Teammate" /></FieldRow>
                    <FieldRow label="ICON"><Input value={card.icon} onChange={(v) => updateCard(idx, { ...card, icon: v })} placeholder="Users" /></FieldRow>
                  </div>
                  <FieldRow label="DESCRIPTION"><TextArea value={card.description} onChange={(v) => updateCard(idx, { ...card, description: v })} placeholder="What this resource card represents" /></FieldRow>
                  <FieldRow label="PER-TOKEN SCORES"><TenetScoreMap scores={card.perTokenScores} onChange={(s) => updateCard(idx, { ...card, perTokenScores: s })} /></FieldRow>
                </div>
              )}
            </div>
          );
        })}
        <button onClick={addCard} style={{ width: "100%", background: "none", border: "1px dashed var(--border-default)", color: "var(--accent)", cursor: "pointer", fontSize: "0.78rem", fontWeight: 600, padding: "8px 16px", borderRadius: "var(--radius-md)" }}>+ Add Card</button>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main: Stage1GameEditor
// ---------------------------------------------------------------------------

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function Stage1GameEditor({ data, onChange }: { data: any; onChange: (data: any) => void }) {
  const [showJson, setShowJson] = useState(false);
  const [jsonText, setJsonText] = useState("");
  const [jsonError, setJsonError] = useState("");

  const gameType: string = data?.type || "unknown";

  function handleJsonToggle() {
    if (!showJson) { setJsonText(JSON.stringify(data, null, 2)); setJsonError(""); }
    setShowJson(!showJson);
  }
  function handleJsonApply() {
    try { const parsed = JSON.parse(jsonText); onChange(parsed); setJsonError(""); setShowJson(false); }
    catch { setJsonError("Invalid JSON"); }
  }

  const typeLabels: Record<string, string> = {
    "triage-tower": "Triage Tower",
    "trade-off-tiles": "Trade-Off Tiles",
    "signal-sort": "Signal Sort",
    "resource-roulette": "Resource Roulette",
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div style={{ fontSize: "0.875rem", fontWeight: 500, color: "var(--text-secondary)" }}>
          {typeLabels[gameType] || "Game Configuration"}
        </div>
        <button onClick={handleJsonToggle} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border-default)", color: "var(--text-secondary)", cursor: "pointer", fontSize: "0.72rem", fontWeight: 600, padding: "4px 10px", borderRadius: "var(--radius-sm)" }}>{showJson ? "Hide JSON" : "View JSON"}</button>
      </div>

      {showJson && (
        <div style={{ marginBottom: 16 }}>
          <textarea value={jsonText} onChange={(e) => { setJsonText(e.target.value); setJsonError(""); }} rows={12} style={{ width: "100%", padding: "12px 16px", borderRadius: "var(--radius-lg)", fontFamily: "monospace", fontSize: "0.82rem", outline: "none", background: "var(--bg-surface-solid)", color: "var(--accent-light)", border: `1px solid ${jsonError ? "var(--error)" : "var(--border-default)"}`, resize: "vertical" }} />
          {jsonError && <p style={{ color: "var(--error)", fontSize: "0.75rem", marginTop: 4 }}>{jsonError}</p>}
          <button onClick={handleJsonApply} className="btn-primary" style={{ marginTop: 8, fontSize: "0.78rem" }}>Apply JSON</button>
        </div>
      )}

      {gameType === "triage-tower" && (
        <TriageTowerEditor items={data.items || []} onChange={(items) => onChange({ ...data, items })} />
      )}
      {gameType === "trade-off-tiles" && (
        <TradeOffEditor pairs={data.pairs || []} onChange={(pairs) => onChange({ ...data, pairs })} />
      )}
      {gameType === "signal-sort" && (
        <SignalSortEditor messages={data.messages || []} onChange={(messages) => onChange({ ...data, messages })} />
      )}
      {gameType === "resource-roulette" && (
        <ResourceRouletteEditor totalTokens={data.totalTokens || 10} cards={data.cards || []} curveball={data.curveball} onChange={({ totalTokens, cards, curveball }) => onChange({ ...data, totalTokens, cards, curveball })} />
      )}
      {!typeLabels[gameType] && (
        <p style={{ color: "var(--text-muted)", fontSize: "0.82rem" }}>Unknown game type "{gameType}". Use View JSON to edit directly.</p>
      )}
    </div>
  );
}
