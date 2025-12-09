import { createInitialWorldState, type Intervention, type WorldState } from '@inksim/core';
import type { CanonWorld } from '@inksim/core';
import { getSampleCanonWorld } from './sampleWorld.js';

export interface AllowedInterventionConfig {
  type: Intervention['type'];
  description: string;
}

export interface ScenarioConfig {
  id: string;
  name: string;
  description: string;
  canonWorld: CanonWorld;
  allowedInterventions: AllowedInterventionConfig[];
  targetQuestion?: string;
}

const baseInterventions: AllowedInterventionConfig[] = [
  { type: 'adjustTrust', description: 'Tweak trust between two characters to explore alliances.' },
  { type: 'addKnowledge', description: 'Reveal a clue or rumour to a specific character.' },
  { type: 'moveEvent', description: 'Reschedule an event to see how timing changes consequences.' },
  { type: 'toggleFlag', description: 'Flip a plot flag to model branching conditions.' }
];

function buildVariantWorld(): CanonWorld {
  const base = getSampleCanonWorld();
  return {
    ...base,
    title: 'Mistwood Tides - Beacon Forewarned',
    relationships: base.relationships.map((rel) =>
      rel.id === 'ellis-rowan'
        ? { ...rel, trust: 15, hostility: 5, description: 'Rowan shared the beacon warning early.' }
        : rel
    ),
    knowledge: base.knowledge.map((entry) =>
      entry.id === 'hidden-beacon'
        ? { ...entry, knownBy: Array.from(new Set([...entry.knownBy, 'mara', 'piper'])) }
        : entry
    ),
    plotFlags: { ...base.plotFlags, beaconSeen: true },
    startTime: 0
  };
}

const scenarios: ScenarioConfig[] = [
  {
    id: 'mistwood-default',
    name: 'Mistwood Tides - Baseline',
    description: 'Default starting state where Rowan keeps the beacon quiet and trust is fragile.',
    canonWorld: getSampleCanonWorld(),
    allowedInterventions: baseInterventions,
    targetQuestion: 'How does sharing the storms origin alter alliances?'
  },
  {
    id: 'mistwood-beacon-forewarned',
    name: 'Mistwood Tides - Forewarned Beacon',
    description: 'Rowan warned Mara and Piper about the beacon early, changing trust dynamics.',
    canonWorld: buildVariantWorld(),
    allowedInterventions: baseInterventions,
    targetQuestion: 'What minimal changes trigger cooperation against the storm?'
  }
];

export function getAvailableScenarios(): ScenarioConfig[] {
  return scenarios;
}

export function getScenarioById(id: string): ScenarioConfig {
  return scenarios.find((scenario) => scenario.id === id) ?? scenarios[0];
}

export function createWorldStateForScenario(id: string): { scenario: ScenarioConfig; world: WorldState } {
  const scenario = getScenarioById(id);
  return { scenario, world: createInitialWorldState(scenario.canonWorld) };
}
