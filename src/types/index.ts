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

export interface ScenarioNode {
  id: string;
  text: string;
  options?: ScenarioOption[];
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

export interface Stage1Result {
  prioritySnap: {
    order: string[];
    timeMs: number;
    revisions: number;
  };
  valueMatch: {
    matches: { valueId: string; situationId: string; correct: boolean }[];
    timeMs: number;
  };
  oddOneOut: {
    picks: { roundId: string; chosenId: string; correct: boolean }[];
    timeMs: number;
  };
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
