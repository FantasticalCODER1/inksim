import { createInitialWorldState } from '@inksim/core';
import type { WorldState, CanonWorld } from '@inksim/core';
import { getSampleCanonWorld } from './sampleWorld.js';
import {
  getAvailableScenarios,
  getScenarioById,
  createWorldStateForScenario,
  type ScenarioConfig,
  type AllowedInterventionConfig
} from './scenarios.js';

export { getSampleCanonWorld, getAvailableScenarios, getScenarioById, createWorldStateForScenario };
export type { CanonWorld, ScenarioConfig, AllowedInterventionConfig };

export function createSampleWorldState(): WorldState {
  return createInitialWorldState(getSampleCanonWorld());
}
