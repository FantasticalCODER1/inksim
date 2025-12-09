export interface Character {
  id: string;
  name: string;
  traits: string[];
  alive: boolean;
  knowledge: KnowledgeEntry[];
}

export interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  trust: number;
  hostility: number;
  description?: string;
}

export interface Location {
  id: string;
  name: string;
  description?: string;
  region?: string;
}

export interface Item {
  id: string;
  name: string;
  description?: string;
  ownerId?: string;
  locationId?: string;
}

export interface Event {
  id: string;
  title: string;
  description?: string;
  locationId?: string;
  participants: string[];
  time: number;
}

export interface KnowledgeEntry {
  id: string;
  content: string;
  knownBy: string[];
}

export interface CanonWorld {
  title: string;
  characters: Character[];
  locations: Location[];
  items: Item[];
  relationships: Relationship[];
  events: Event[];
  knowledge: KnowledgeEntry[];
  plotFlags?: Record<string, boolean>;
  startTime?: number;
}

export interface WorldState {
  title: string;
  characters: Character[];
  locations: Location[];
  items: Item[];
  relationships: Relationship[];
  events: Event[];
  knowledge: KnowledgeEntry[];
  plotFlags: Record<string, boolean>;
  time: number;
}

export interface RelationshipChange {
  fromId: string;
  toId: string;
  previousTrust: number;
  newTrust: number;
}

export interface KnowledgeChange {
  characterId: string;
  knowledgeId: string;
  added: boolean;
  content: string;
}

export interface EventChange {
  eventId: string;
  fromTime: number;
  toTime: number;
}

export interface SceneDiff {
  relationships: RelationshipChange[];
  knowledge: KnowledgeChange[];
  events: EventChange[];
  notes: string[];
}

export type Intervention =
  | {
      type: 'addKnowledge';
      characterId: string;
      knowledgeId: string;
      content: string;
    }
  | {
      type: 'adjustTrust';
      fromId: string;
      toId: string;
      delta: number;
    }
  | {
      type: 'moveEvent';
      eventId: string;
      newTime: number;
    }
  | {
      type: 'toggleFlag';
      flag: string;
      value: boolean;
    };

export interface ConstraintViolation {
  code: string;
  message: string;
}

export interface ConstraintValidationResult {
  valid: boolean;
  violations: ConstraintViolation[];
}

export interface SimulationStepResult {
  previousState: WorldState;
  newState: WorldState;
  diff: SceneDiff;
  warnings: string[];
  applied: boolean;
}

export interface RunStep {
  intervention: Intervention;
  result: SimulationStepResult;
  timestamp: string;
}

export interface RunLog {
  id: string;
  title?: string;
  steps: RunStep[];
  startedAt: string;
  lastUpdated: string;
}

export interface RunMetrics {
  steps: number;
  relationshipChanges: number;
  knowledgeChanges: number;
  knowledgeSpread: number;
  tension: number;
  flagsSet: number;
  currentTime: number;
}

export interface PlannerOptions {
  targetTheme?: string;
}

export interface PlannedBeat {
  description: string;
  suggestedInterventions: Intervention[];
}

export interface PlotPlanner {
  planNextBeat(state: WorldState, options?: PlannerOptions): PlannedBeat;
}
