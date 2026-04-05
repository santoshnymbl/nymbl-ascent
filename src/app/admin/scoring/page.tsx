"use client";

import { useState } from "react";
import {
  Layers,
  SlidersHorizontal,
  MessageSquare,
  Coins,
  Clock,
  RotateCcw,
  MinusCircle,
  AlertTriangle,
  CheckCircle,
  Link as LinkIcon,
  Bug,
  MessageCircle,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Tenet color map                                                    */
/* ------------------------------------------------------------------ */
const TENET_COLORS = [
  "#6366f1", "#8b5cf6", "#a78bfa", "#f59e0b",
  "#10b981", "#ec4899", "#06b6d4",
];
const TENETS = [
  "Client Focused", "Empowering", "Productive", "Balanced",
  "Reliable", "Improving", "Transparent",
];

/* ------------------------------------------------------------------ */
/*  Reusable heading                                                   */
/* ------------------------------------------------------------------ */
function SectionHeading({
  title, subtitle, color,
}: { title: string; subtitle?: string; color?: string }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <h2
        style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: "1.5rem",
          fontWeight: 700,
          letterSpacing: "-0.03em",
          margin: 0,
          borderLeft: `4px solid ${color ?? "var(--accent)"}`,
          paddingLeft: 14,
          color: "var(--text-primary)",
        }}
      >
        {title}
      </h2>
      {subtitle && (
        <p
          style={{
            margin: "6px 0 0 18px",
            fontSize: "0.88rem",
            color: "var(--text-secondary)",
          }}
        >
          {subtitle}
        </p>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Mini arrow between boxes                                           */
/* ------------------------------------------------------------------ */
function Arrow() {
  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        color: "var(--text-muted)",
        margin: "0 4px",
      }}
    >
      <ChevronRight size={16} />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function ScoringExplanationPage() {
  const [tenetsVal, setTenetsVal] = useState(65);
  const [roleFitVal, setRoleFitVal] = useState(70);
  const [behavioralVal, setBehavioralVal] = useState(75);

  const composite =
    tenetsVal * 0.6 + roleFitVal * 0.25 + behavioralVal * 0.15;

  /* shared slider styling */
  const sliderTrack: React.CSSProperties = {
    width: "100%",
    height: 6,
    appearance: "none",
    WebkitAppearance: "none",
    borderRadius: "var(--radius-full)",
    outline: "none",
    cursor: "pointer",
  };

  return (
    <div
      style={{
        maxWidth: 960,
        margin: "0 auto",
        display: "flex",
        flexDirection: "column",
        gap: 32,
        paddingBottom: 64,
      }}
    >
      {/* Page header */}
      <div style={{ marginBottom: 8 }}>
        <h1
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.85rem",
            fontWeight: 700,
            letterSpacing: "-0.03em",
            margin: 0,
            color: "var(--text-primary)",
          }}
        >
          How Scoring Works
        </h1>
        <p
          style={{
            margin: "6px 0 0",
            fontSize: "0.92rem",
            color: "var(--text-secondary)",
            maxWidth: 600,
          }}
        >
          A visual, interactive guide to how Nymbl Ascent calculates candidate composite scores
          from three layers of assessment data.
        </p>
      </div>

      {/* ================================================================ */}
      {/* SECTION 1 — THE FORMULA                                          */}
      {/* ================================================================ */}
      <section className="glass-card" style={{ padding: 28 }}>
        <SectionHeading title="The Formula" />

        {/* Composite bar */}
        <div
          style={{
            display: "flex",
            height: 40,
            borderRadius: "var(--radius-md)",
            overflow: "hidden",
            marginBottom: 12,
          }}
        >
          <div
            style={{
              width: "60%",
              background: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.82rem",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Tenets — 60%
          </div>
          <div
            style={{
              width: "25%",
              background: "var(--success)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.82rem",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Role Fit — 25%
          </div>
          <div
            style={{
              width: "15%",
              background: "var(--warning)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#fff",
              fontWeight: 700,
              fontSize: "0.78rem",
              fontFamily: "'Space Grotesk', sans-serif",
            }}
          >
            Beh. — 15%
          </div>
        </div>

        {/* Large formula text */}
        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            color: "var(--text-primary)",
            textAlign: "center",
            margin: "16px 0 24px",
            letterSpacing: "-0.01em",
          }}
        >
          COMPOSITE ={" "}
          <span style={{ color: "var(--accent)" }}>Tenets&nbsp;&times;&nbsp;60%</span>
          {" + "}
          <span style={{ color: "var(--success)" }}>Role&nbsp;Fit&nbsp;&times;&nbsp;25%</span>
          {" + "}
          <span style={{ color: "var(--warning)" }}>Behavioral&nbsp;&times;&nbsp;15%</span>
        </p>

        {/* Interactive calculator */}
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-lg)",
            padding: 24,
            border: "1px solid var(--border-subtle)",
          }}
        >
          <h3
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "1rem",
              fontWeight: 600,
              margin: "0 0 18px",
              color: "var(--text-primary)",
            }}
          >
            Interactive Calculator
          </h3>

          <style>{`
            input[type=range].scoring-slider {
              -webkit-appearance: none;
              appearance: none;
              width: 100%;
              height: 6px;
              border-radius: 999px;
              outline: none;
              cursor: pointer;
            }
            input[type=range].scoring-slider::-webkit-slider-thumb {
              -webkit-appearance: none;
              appearance: none;
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2px solid #fff;
              cursor: pointer;
              margin-top: -6px;
              box-shadow: 0 1px 4px rgba(0,0,0,0.25);
            }
            input[type=range].scoring-slider::-moz-range-thumb {
              width: 18px;
              height: 18px;
              border-radius: 50%;
              border: 2px solid #fff;
              cursor: pointer;
              box-shadow: 0 1px 4px rgba(0,0,0,0.25);
            }
            input[type=range].scoring-slider.slider-accent { background: var(--accent-surface); }
            input[type=range].scoring-slider.slider-accent::-webkit-slider-thumb { background: var(--accent); }
            input[type=range].scoring-slider.slider-accent::-moz-range-thumb { background: var(--accent); }
            input[type=range].scoring-slider.slider-success { background: var(--success-surface); }
            input[type=range].scoring-slider.slider-success::-webkit-slider-thumb { background: var(--success); }
            input[type=range].scoring-slider.slider-success::-moz-range-thumb { background: var(--success); }
            input[type=range].scoring-slider.slider-warning { background: var(--warning-surface); }
            input[type=range].scoring-slider.slider-warning::-webkit-slider-thumb { background: var(--warning); }
            input[type=range].scoring-slider.slider-warning::-moz-range-thumb { background: var(--warning); }
          `}</style>

          {/* Tenet slider */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--accent)",
                }}
              >
                Tenet Average
              </label>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--accent)",
                }}
              >
                {tenetsVal}
              </span>
            </div>
            <input
              type="range"
              className="scoring-slider slider-accent"
              min={0}
              max={100}
              value={tenetsVal}
              onChange={(e) => setTenetsVal(Number(e.target.value))}
              style={sliderTrack}
            />
          </div>

          {/* Role Fit slider */}
          <div style={{ marginBottom: 16 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--success)",
                }}
              >
                Role Fit
              </label>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--success)",
                }}
              >
                {roleFitVal}
              </span>
            </div>
            <input
              type="range"
              className="scoring-slider slider-success"
              min={0}
              max={100}
              value={roleFitVal}
              onChange={(e) => setRoleFitVal(Number(e.target.value))}
              style={sliderTrack}
            />
          </div>

          {/* Behavioral slider */}
          <div style={{ marginBottom: 20 }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                marginBottom: 6,
              }}
            >
              <label
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 600,
                  color: "var(--warning)",
                }}
              >
                Behavioral
              </label>
              <span
                style={{
                  fontSize: "0.82rem",
                  fontWeight: 700,
                  color: "var(--warning)",
                }}
              >
                {behavioralVal}
              </span>
            </div>
            <input
              type="range"
              className="scoring-slider slider-warning"
              min={0}
              max={100}
              value={behavioralVal}
              onChange={(e) => setBehavioralVal(Number(e.target.value))}
              style={sliderTrack}
            />
          </div>

          {/* Result */}
          <div
            style={{
              textAlign: "center",
              borderTop: "1px solid var(--border-subtle)",
              paddingTop: 18,
            }}
          >
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                fontWeight: 600,
              }}
            >
              Composite Score
            </span>
            <div
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                fontSize: "2.4rem",
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "-0.04em",
                lineHeight: 1.1,
                marginTop: 4,
              }}
            >
              {composite.toFixed(2)}
            </div>
            <p
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                marginTop: 6,
              }}
            >
              {tenetsVal} &times; 0.6 = {(tenetsVal * 0.6).toFixed(1)} &nbsp;+&nbsp;{" "}
              {roleFitVal} &times; 0.25 = {(roleFitVal * 0.25).toFixed(1)} &nbsp;+&nbsp;{" "}
              {behavioralVal} &times; 0.15 = {(behavioralVal * 0.15).toFixed(1)}
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 2 — LAYER 1: TENET SCORES                                */}
      {/* ================================================================ */}
      <section className="glass-card" style={{ padding: 28 }}>
        <SectionHeading
          title="Layer 1: Tenet Scores"
          subtitle="7 tenets scored from Stage 1 (40%) + Stage 2 (60%)"
          color="var(--accent)"
        />

        {/* Tenet cards row */}
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 10,
            marginBottom: 28,
          }}
        >
          {TENETS.map((name, i) => (
            <div
              key={name}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "6px 14px",
                borderRadius: "var(--radius-full)",
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-subtle)",
                fontSize: "0.78rem",
                fontWeight: 600,
                color: "var(--text-primary)",
              }}
            >
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: "50%",
                  background: TENET_COLORS[i],
                  flexShrink: 0,
                }}
              />
              {name}
            </div>
          ))}
        </div>

        {/* Stage 1 Games */}
        <h3
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            margin: "0 0 14px",
            color: "var(--text-primary)",
          }}
        >
          Stage 1: Games
        </h3>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
            marginBottom: 28,
          }}
        >
          {/* Triage Tower */}
          <div
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--accent-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Layers size={18} style={{ color: "var(--accent)" }} />
              </div>
              <h4
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Triage Tower
              </h4>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                margin: "0 0 12px",
                lineHeight: 1.5,
              }}
            >
              Candidates sort work items into priority bins. Each placement
              maps to tenet scores.
            </p>
            {/* Bins */}
            <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
              {[
                { label: "Do Now", color: "var(--accent)" },
                { label: "Do Next", color: "var(--warning)" },
                { label: "Delegate", color: "var(--info)" },
              ].map((b) => (
                <span
                  key={b.label}
                  style={{
                    fontSize: "0.7rem",
                    fontWeight: 600,
                    padding: "3px 10px",
                    borderRadius: "var(--radius-full)",
                    background: b.color,
                    color: "#fff",
                  }}
                >
                  {b.label}
                </span>
              ))}
            </div>
            {/* Mini example */}
            <div
              style={{
                fontSize: "0.75rem",
                color: "var(--text-muted)",
                background: "var(--bg-base)",
                borderRadius: "var(--radius-sm)",
                padding: "8px 12px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <span style={{ fontWeight: 600, color: "var(--text-secondary)" }}>
                Example:
              </span>{" "}
              &ldquo;Client Bug&rdquo; <ArrowRight size={12} style={{ verticalAlign: "middle" }} />{" "}
              Do Now = <span style={{ color: "var(--accent)", fontWeight: 600 }}>Client Focused +90</span>
            </div>
          </div>

          {/* Trade-Off Tiles */}
          <div
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--warning-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <SlidersHorizontal
                  size={18}
                  style={{ color: "var(--warning)" }}
                />
              </div>
              <h4
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Trade-Off Tiles
              </h4>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                margin: "0 0 12px",
                lineHeight: 1.5,
              }}
            >
              No right answer — reveals priorities. Candidates position a
              slider between two competing values.
            </p>
            {/* Mini slider diagram */}
            <div
              style={{
                background: "var(--bg-base)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: "var(--text-secondary)",
                  marginBottom: 6,
                }}
              >
                <span>Empowering</span>
                <span>Productive</span>
              </div>
              <div
                style={{
                  height: 6,
                  borderRadius: "var(--radius-full)",
                  background: "linear-gradient(to right, #8b5cf6, #f59e0b)",
                  position: "relative",
                }}
              >
                <div
                  style={{
                    position: "absolute",
                    left: "65%",
                    top: -5,
                    width: 16,
                    height: 16,
                    borderRadius: "50%",
                    background: "#fff",
                    border: "2px solid var(--accent)",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.2)",
                  }}
                />
              </div>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                Position maps to score: left = high Empowering, right = high Productive
              </p>
            </div>
          </div>

          {/* Signal Sort */}
          <div
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--info-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageSquare
                  size={18}
                  style={{ color: "var(--info)" }}
                />
              </div>
              <h4
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Signal Sort
              </h4>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                margin: "0 0 12px",
                lineHeight: 1.5,
              }}
            >
              Candidates categorize Slack-style messages as
              &ldquo;ideal&rdquo; or &ldquo;needs improvement&rdquo;.
            </p>
            {/* Mini Slack message */}
            <div
              style={{
                background: "var(--bg-base)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div
                style={{
                  fontSize: "0.75rem",
                  color: "var(--text-secondary)",
                  marginBottom: 8,
                  fontStyle: "italic",
                }}
              >
                &ldquo;I shipped it without checking with the team...&rdquo;
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                <span
                  className="badge"
                  style={{
                    fontSize: "0.65rem",
                    background: "var(--success-surface)",
                    color: "var(--success)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontWeight: 600,
                  }}
                >
                  Ideal
                </span>
                <span
                  className="badge"
                  style={{
                    fontSize: "0.65rem",
                    background: "var(--error-surface)",
                    color: "var(--error)",
                    padding: "2px 8px",
                    borderRadius: "var(--radius-full)",
                    fontWeight: 600,
                  }}
                >
                  Improve
                </span>
              </div>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  marginTop: 8,
                  marginBottom: 0,
                }}
              >
                Each category triggers different tenet score maps
              </p>
            </div>
          </div>

          {/* Resource Roulette */}
          <div
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--success-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Coins size={18} style={{ color: "var(--success)" }} />
              </div>
              <h4
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontWeight: 600,
                  fontSize: "0.92rem",
                  margin: 0,
                  color: "var(--text-primary)",
                }}
              >
                Resource Roulette
              </h4>
            </div>
            <p
              style={{
                fontSize: "0.8rem",
                color: "var(--text-secondary)",
                margin: "0 0 12px",
                lineHeight: 1.5,
              }}
            >
              Distribute tokens across 4 resource cards. Allocation patterns
              are evaluated using a Gini coefficient.
            </p>
            {/* Mini token cards */}
            <div
              style={{
                background: "var(--bg-base)",
                borderRadius: "var(--radius-sm)",
                padding: "10px 14px",
                border: "1px solid var(--border-subtle)",
              }}
            >
              <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
                {["A", "B", "C", "D"].map((card, i) => (
                  <div
                    key={card}
                    style={{
                      flex: 1,
                      textAlign: "center",
                      padding: "6px 0",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid var(--border-subtle)",
                      background: "var(--bg-surface-solid)",
                    }}
                  >
                    <div
                      style={{
                        fontSize: "0.65rem",
                        fontWeight: 600,
                        color: "var(--text-secondary)",
                        marginBottom: 4,
                      }}
                    >
                      Card {card}
                    </div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 2 }}>
                      {Array.from({ length: i === 0 ? 3 : i === 1 ? 2 : i === 2 ? 3 : 2 }).map(
                        (_, j) => (
                          <span
                            key={j}
                            style={{
                              width: 8,
                              height: 8,
                              borderRadius: "50%",
                              background: "var(--accent)",
                              display: "inline-block",
                            }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                ))}
              </div>
              <p
                style={{
                  fontSize: "0.7rem",
                  color: "var(--text-muted)",
                  margin: 0,
                }}
              >
                Even spread = high Balanced. All tokens on one card = low
                Balanced.
              </p>
            </div>
          </div>
        </div>

        {/* Stage 2 Scenarios */}
        <h3
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            margin: "0 0 10px",
            color: "var(--text-primary)",
          }}
        >
          Stage 2: Scenarios
        </h3>
        <p
          style={{
            fontSize: "0.82rem",
            color: "var(--text-secondary)",
            margin: "0 0 16px",
            lineHeight: 1.5,
          }}
        >
          Decision paths are looked up in a scoring rubric. Each complete
          path maps to tenet scores (0-10, normalized to 0-100). Averaged
          across 2 scenarios, then merged with Stage 1 at 60% weight.
        </p>

        {/* Decision tree diagram */}
        <div
          style={{
            background: "var(--bg-base)",
            borderRadius: "var(--radius-md)",
            padding: 20,
            border: "1px solid var(--border-subtle)",
            marginBottom: 24,
            overflowX: "auto",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexWrap: "wrap",
              gap: 4,
            }}
          >
            {[
              { text: "Scenario", bg: "var(--accent-surface)", color: "var(--accent)" },
              null,
              { text: "Choice A", bg: "var(--success-surface)", color: "var(--success)" },
              null,
              { text: "Consequence", bg: "var(--warning-surface)", color: "var(--warning)" },
              null,
              { text: "Follow-up", bg: "var(--info-surface)", color: "var(--info)" },
              null,
              { text: "Score", bg: "var(--accent-surface)", color: "var(--accent)" },
            ].map((item, i) =>
              item === null ? (
                <Arrow key={i} />
              ) : (
                <div
                  key={i}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "var(--radius-md)",
                    background: item.bg,
                    color: item.color,
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    whiteSpace: "nowrap",
                  }}
                >
                  {item.text}
                </div>
              ),
            )}
          </div>
        </div>

        {/* Merge visual */}
        <h3
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "1.05rem",
            fontWeight: 600,
            margin: "0 0 14px",
            color: "var(--text-primary)",
          }}
        >
          Merging Stage 1 + Stage 2
        </h3>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
            marginBottom: 8,
          }}
        >
          {/* Stage 1 bar */}
          <div style={{ flex: "1 1 120px", minWidth: 100 }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Stage 1 &times; 0.4
            </div>
            <div
              style={{
                height: 28,
                borderRadius: "var(--radius-md)",
                background: "var(--accent-surface)",
                border: "1px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--accent)",
              }}
            >
              40%
            </div>
          </div>

          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              lineHeight: 1,
              paddingTop: 16,
            }}
          >
            +
          </span>

          {/* Stage 2 bar */}
          <div style={{ flex: "1.5 1 180px", minWidth: 120 }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Stage 2 &times; 0.6
            </div>
            <div
              style={{
                height: 28,
                borderRadius: "var(--radius-md)",
                background: "var(--accent-surface)",
                border: "1px solid var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--accent)",
              }}
            >
              60%
            </div>
          </div>

          <span
            style={{
              fontSize: "1.2rem",
              fontWeight: 700,
              color: "var(--text-muted)",
              lineHeight: 1,
              paddingTop: 16,
            }}
          >
            =
          </span>

          {/* Final bar */}
          <div style={{ flex: "2 1 200px", minWidth: 140 }}>
            <div
              style={{
                fontSize: "0.72rem",
                fontWeight: 600,
                color: "var(--text-secondary)",
                marginBottom: 4,
                textAlign: "center",
              }}
            >
              Final Tenet Score
            </div>
            <div
              style={{
                height: 28,
                borderRadius: "var(--radius-md)",
                background: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "0.72rem",
                fontWeight: 700,
                color: "#fff",
              }}
            >
              Weighted Average
            </div>
          </div>
        </div>

        <p
          style={{
            fontFamily: "'Space Grotesk', sans-serif",
            fontSize: "0.85rem",
            fontWeight: 600,
            color: "var(--text-secondary)",
            textAlign: "center",
            marginTop: 12,
          }}
        >
          Final Tenet = Stage 1 &times; 0.4 + Stage 2 &times; 0.6
        </p>
      </section>

      {/* ================================================================ */}
      {/* SECTION 3 — LAYER 2: ROLE FIT                                    */}
      {/* ================================================================ */}
      <section className="glass-card" style={{ padding: 28 }}>
        <SectionHeading
          title="Layer 2: Role Fit"
          subtitle="Role-specific challenges contribute 25% of the composite score"
          color="var(--success)"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {/* Engineering */}
          <div
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--success-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bug size={18} style={{ color: "var(--success)" }} />
              </div>
              <div>
                <h4
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  Engineering
                </h4>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Debug Challenge
                </span>
              </div>
            </div>
            {/* Stacked bar */}
            <div
              style={{
                display: "flex",
                height: 24,
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: "60%",
                  background: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                Bug ID — 60pts
              </div>
              <div
                style={{
                  width: "30%",
                  background: "var(--info)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                Approach — 25-30pts
              </div>
              <div
                style={{
                  width: "10%",
                  background: "var(--warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                Spd
              </div>
            </div>
            <ul
              style={{
                margin: 0,
                padding: "0 0 0 18px",
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              <li>Correct bug identification: <strong>60 pts</strong></li>
              <li>Approach quality: <strong>25-30 pts</strong></li>
              <li>Speed bonus: <strong>5-10 pts</strong></li>
            </ul>
          </div>

          {/* Sales */}
          <div
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 12,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--warning-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle
                  size={18}
                  style={{ color: "var(--warning)" }}
                />
              </div>
              <div>
                <h4
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  Sales
                </h4>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Objection Handler
                </span>
              </div>
            </div>
            <div
              style={{
                display: "flex",
                height: 24,
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                marginBottom: 10,
              }}
            >
              <div
                style={{
                  width: "100%",
                  background: "var(--warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.65rem",
                  fontWeight: 700,
                }}
              >
                Completion — 70 pts (fixed)
              </div>
            </div>
            <p
              style={{
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                margin: 0,
                lineHeight: 1.6,
              }}
            >
              Branching scenario where the candidate navigates a client
              objection. Currently scored at a fixed 70 for completion.
              Future: path-based scoring like Stage 2.
            </p>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 4 — LAYER 3: BEHAVIORAL SIGNALS                          */}
      {/* ================================================================ */}
      <section className="glass-card" style={{ padding: 28 }}>
        <SectionHeading
          title="Layer 3: Behavioral Signals"
          subtitle="Starts at 70, then adjustments based on how candidates interact"
          color="var(--warning)"
        />

        <div
          style={{ display: "flex", flexDirection: "column", gap: 10 }}
        >
          {(
            [
              {
                icon: AlertTriangle,
                name: "Decision speed < 1s",
                effect: -30,
                desc: "Random clicking detected",
              },
              {
                icon: CheckCircle,
                name: "Decision speed 2-10s",
                effect: +15,
                desc: "Thoughtful pace",
              },
              {
                icon: RotateCcw,
                name: "Revisions (up to 3)",
                effect: +5,
                desc: "Shows deliberation — +5 each",
              },
              {
                icon: MinusCircle,
                name: "All sliders neutral",
                effect: -10,
                desc: "Avoiding commitment",
              },
              {
                icon: AlertTriangle,
                name: "Same position bias",
                effect: -15,
                desc: "Pattern gaming",
              },
              {
                icon: AlertTriangle,
                name: "All messages one category",
                effect: -15,
                desc: "Not engaging",
              },
              {
                icon: LinkIcon,
                name: "Cross-stage consistency > 0.5",
                effect: +10,
                desc: "Consistent values across stages",
              },
            ] as const
          ).map((signal) => {
            const Icon = signal.icon;
            const isPositive = signal.effect > 0;
            return (
              <div
                key={signal.name}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 14,
                  padding: "12px 16px",
                  borderRadius: "var(--radius-md)",
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                <div
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: "var(--radius-md)",
                    background: isPositive
                      ? "var(--success-surface)"
                      : "var(--error-surface)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <Icon
                    size={16}
                    style={{
                      color: isPositive
                        ? "var(--success)"
                        : "var(--error)",
                    }}
                  />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: "0.82rem",
                      color: "var(--text-primary)",
                    }}
                  >
                    {signal.name}
                  </div>
                  <div
                    style={{
                      fontSize: "0.75rem",
                      color: "var(--text-muted)",
                      marginTop: 2,
                    }}
                  >
                    {signal.desc}
                  </div>
                </div>
                <div
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 700,
                    fontSize: "0.92rem",
                    color: isPositive
                      ? "var(--success)"
                      : "var(--error)",
                    flexShrink: 0,
                  }}
                >
                  {isPositive ? "+" : ""}
                  {signal.effect}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 5 — EXAMPLE WALKTHROUGH                                  */}
      {/* ================================================================ */}
      <section className="glass-card" style={{ padding: 28 }}>
        <SectionHeading title="Example Calculation" />

        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--text-secondary)",
            margin: "0 0 20px",
            lineHeight: 1.6,
          }}
        >
          Here is a worked example using the values from the calculator
          above. Adjust the sliders in Section 1 and these numbers update
          automatically.
        </p>

        {/* Three contribution bars */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
            gap: 12,
            marginBottom: 20,
          }}
        >
          {[
            {
              label: "Tenets",
              value: tenetsVal,
              weight: 0.6,
              color: "var(--accent)",
              bg: "var(--accent-surface)",
            },
            {
              label: "Role Fit",
              value: roleFitVal,
              weight: 0.25,
              color: "var(--success)",
              bg: "var(--success-surface)",
            },
            {
              label: "Behavioral",
              value: behavioralVal,
              weight: 0.15,
              color: "var(--warning)",
              bg: "var(--warning-surface)",
            },
          ].map((item) => (
            <div
              key={item.label}
              style={{
                background: item.bg,
                borderRadius: "var(--radius-md)",
                padding: "14px 16px",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "0.72rem",
                  fontWeight: 600,
                  color: item.color,
                  textTransform: "uppercase",
                  letterSpacing: "0.06em",
                  marginBottom: 4,
                }}
              >
                {item.label}
              </div>
              <div
                style={{
                  fontFamily: "'Space Grotesk', sans-serif",
                  fontSize: "1.3rem",
                  fontWeight: 700,
                  color: item.color,
                }}
              >
                {item.value}
              </div>
              <div
                style={{
                  fontSize: "0.72rem",
                  color: item.color,
                  marginTop: 4,
                  opacity: 0.8,
                }}
              >
                &times; {item.weight} ={" "}
                <strong>{(item.value * item.weight).toFixed(1)}</strong>
              </div>
            </div>
          ))}
        </div>

        {/* Final result */}
        <div
          style={{
            background: "var(--bg-elevated)",
            borderRadius: "var(--radius-lg)",
            padding: 20,
            border: "1px solid var(--border-subtle)",
            textAlign: "center",
          }}
        >
          <p
            style={{
              fontSize: "0.82rem",
              color: "var(--text-secondary)",
              margin: "0 0 8px",
            }}
          >
            <span style={{ color: "var(--accent)", fontWeight: 600 }}>
              {tenetsVal} &times; 0.6 = {(tenetsVal * 0.6).toFixed(1)}
            </span>
            &nbsp;+&nbsp;
            <span style={{ color: "var(--success)", fontWeight: 600 }}>
              {roleFitVal} &times; 0.25 = {(roleFitVal * 0.25).toFixed(1)}
            </span>
            &nbsp;+&nbsp;
            <span style={{ color: "var(--warning)", fontWeight: 600 }}>
              {behavioralVal} &times; 0.15 ={" "}
              {(behavioralVal * 0.15).toFixed(2)}
            </span>
          </p>
          <div
            style={{
              fontFamily: "'Space Grotesk', sans-serif",
              fontSize: "2rem",
              fontWeight: 700,
              color: "var(--accent)",
              letterSpacing: "-0.04em",
            }}
          >
            = {composite.toFixed(2)}
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* SECTION 6 — STAGE 3 DETAILS                                      */}
      {/* ================================================================ */}
      <section className="glass-card" style={{ padding: 28 }}>
        <SectionHeading
          title="Stage 3 — Role-Specific Challenge"
          subtitle="Stage 3 contributes to the Role Fit score (25% of composite)"
          color="var(--success)"
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
            gap: 16,
          }}
        >
          {/* Engineering — Debug the Logic */}
          <div
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--success-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <Bug size={18} style={{ color: "var(--success)" }} />
              </div>
              <div>
                <h4
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  Engineering — Debug the Logic
                </h4>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Candidate reviews buggy code and identifies the issue
                </span>
              </div>
            </div>

            {/* Stacked bar */}
            <div
              style={{
                display: "flex",
                height: 28,
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: "60%",
                  background: "var(--success)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                }}
              >
                Bug ID — 60
              </div>
              <div
                style={{
                  width: "30%",
                  background: "var(--info)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                }}
              >
                Approach — 30
              </div>
              <div
                style={{
                  width: "10%",
                  background: "var(--warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                }}
              >
                10
              </div>
            </div>

            <ul
              style={{
                margin: 0,
                padding: "0 0 0 18px",
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              <li>
                <strong>Correct bug identification:</strong> 60 points
              </li>
              <li>
                <strong>Debugging approach quality:</strong>
                <ul style={{ padding: "2px 0 2px 16px", margin: 0 }}>
                  <li>Trace manually = 30 pts</li>
                  <li>Check tests = 25 pts</li>
                  <li>Add logging = 20 pts</li>
                </ul>
              </li>
              <li>
                <strong>Speed bonus:</strong> under 3 min = 10 pts, over 3
                min = 5 pts
              </li>
              <li>
                <strong>Max possible:</strong>{" "}
                <span style={{ color: "var(--success)", fontWeight: 600 }}>
                  100 points
                </span>
              </li>
            </ul>
          </div>

          {/* Sales — Objection Handler */}
          <div
            className="glass-card"
            style={{ padding: 20 }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: "var(--radius-md)",
                  background: "var(--warning-surface)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <MessageCircle
                  size={18}
                  style={{ color: "var(--warning)" }}
                />
              </div>
              <div>
                <h4
                  style={{
                    fontFamily: "'Space Grotesk', sans-serif",
                    fontWeight: 600,
                    fontSize: "0.92rem",
                    margin: 0,
                    color: "var(--text-primary)",
                  }}
                >
                  Sales — Objection Handler
                </h4>
                <span
                  style={{
                    fontSize: "0.7rem",
                    color: "var(--text-muted)",
                  }}
                >
                  Candidate navigates a client objection through branching
                  decisions
                </span>
              </div>
            </div>

            <div
              style={{
                display: "flex",
                height: 28,
                borderRadius: "var(--radius-md)",
                overflow: "hidden",
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: "70%",
                  background: "var(--warning)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#fff",
                  fontSize: "0.68rem",
                  fontWeight: 700,
                }}
              >
                Completion — 70 pts
              </div>
              <div
                style={{
                  width: "30%",
                  background: "var(--border-subtle)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "var(--text-muted)",
                  fontSize: "0.65rem",
                  fontWeight: 600,
                }}
              >
                Future: paths
              </div>
            </div>

            <ul
              style={{
                margin: 0,
                padding: "0 0 0 18px",
                fontSize: "0.78rem",
                color: "var(--text-secondary)",
                lineHeight: 1.7,
              }}
            >
              <li>
                <strong>Completion score:</strong> 70 points (fixed)
              </li>
              <li>
                Currently scored for completion only — all candidates who
                finish receive 70 points
              </li>
              <li>
                <strong>Future:</strong> path-based scoring like Stage 2
                scenarios
              </li>
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
