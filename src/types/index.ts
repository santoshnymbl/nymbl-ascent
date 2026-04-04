export const TENETS = [
  "clientFocused",
  "empowering",
  "productive",
  "balanced",
  "reliable",
  "improving",
  "transparent",
] as const;

export type Tenet = (typeof TENETS)[number];

export const TENET_LABELS: Record<Tenet, string> = {
  clientFocused: "Client Focused",
  empowering: "Empowering",
  productive: "Productive",
  balanced: "Balanced",
  reliable: "Reliable",
  improving: "Improving",
  transparent: "Transparent",
};

export interface ScenarioResource {
  label: string;
  value: number;
  max: number;
  icon: string;
}

export interface ScenarioReflection {
  prompt: string;
  anchors: { id: string; label: string; tenet: Tenet }[];
}

export interface ScenarioNode {
  id: string;
  text: string;
  options?: ScenarioOption[];
  resources?: ScenarioResource[];
  resourceChanges?: Record<string, number>; // changes to apply when this node is reached
  reflection?: ScenarioReflection;
}

export interface ScenarioOption {
  id: string;
  label: string;
  text: string;
  consequence: string;
  nextNodeId?: string;
  scores: Partial<Record<Tenet, number>>;
}

export interface ScenarioTree {
  rootNodeId: string;
  nodes: Record<string, ScenarioNode>;
}

export interface BehavioralSignal {
  event: string;
  timestamp: number;
  data: Record<string, unknown>;
}

export interface TriageTowerResult {
  placements: { itemId: string; bin: "doNow" | "doNext" | "delegate" }[];
  interruptBump: { bumpedItemId: string; newBin: string } | null;
  timeMs: number;
  revisions: number;
}

export interface TradeOffTilesResult {
  rounds: { pairId: string; sliderPosition: -2 | -1 | 0 | 1 | 2; timeMs: number }[];
  timeMs: number;
}

export interface SignalSortResult {
  categorizations: { messageId: string; category: "ideal" | "improve" }[];
  timeMs: number;
  dragSequence: string[];
}

export interface ResourceRouletteResult {
  initialAllocation: { cardId: string; tokens: number }[];
  curveball: string;
  reallocation: { cardId: string; tokens: number }[];
  timeMs: number;
  reallocationTimeMs: number;
}

export interface Stage1Result {
  triageTower: TriageTowerResult;
  tradeOffTiles: TradeOffTilesResult;
  signalSort: SignalSortResult;
  resourceRoulette: ResourceRouletteResult;
  signals: BehavioralSignal[];
}

export interface Stage2Result {
  scenarios: {
    scenarioId: string;
    path: { nodeId: string; choiceId: string; timeMs: number }[];
  }[];
  signals: BehavioralSignal[];
}

export interface Stage3Result {
  challengeType: string;
  responses: Record<string, unknown>;
  timeMs: number;
  signals: BehavioralSignal[];
}

export type TenetScores = Record<Tenet, number>;

export interface ScenarioRubric {
  scenarioId: string;
  pathScores: Record<string, Partial<Record<Tenet, number>>>;
}

export type CandidateStatus = "invited" | "in_progress" | "completed" | "scored";

// ---------------------------------------------------------------------------
// Seed data types for Stage 1 games
// ---------------------------------------------------------------------------

export interface TriageTowerItem {
  id: string;
  label: string;
  description: string;
  isInterrupt?: boolean;
  binScores: Record<"doNow" | "doNext" | "delegate", Partial<Record<Tenet, number>>>;
}

export interface TradeOffPair {
  id: string;
  leftText: string;
  leftTenet: Tenet;
  rightText: string;
  rightTenet: Tenet;
}

export interface SignalSortMessage {
  id: string;
  author: string;
  avatar: string;
  text: string;
  idealScores: Partial<Record<Tenet, number>>;
  improveScores: Partial<Record<Tenet, number>>;
}

export interface ResourceRouletteCard {
  id: string;
  title: string;
  description: string;
  icon: string;
  perTokenScores: Partial<Record<Tenet, number>>;
}
