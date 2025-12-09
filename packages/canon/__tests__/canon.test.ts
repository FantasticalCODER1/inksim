import { describe, it, expect } from 'vitest';
import {
  createSampleWorldState,
  getSampleCanonWorld,
  getAvailableScenarios,
  createWorldStateForScenario
} from '../src/index.js';

describe('sample canon world', () => {
  it('exposes a canon world with characters and events', () => {
    const canon = getSampleCanonWorld();
    expect(canon.characters.length).toBeGreaterThan(0);
    expect(canon.events.length).toBeGreaterThan(0);
    expect(canon.title).toBe('Mistwood Tides');
  });

  it('creates a world state compatible with the engine', () => {
    const state = createSampleWorldState();
    expect(state.characters.some((c) => c.id === 'mara')).toBe(true);
    expect(state.events.some((e) => e.locationId)).toBe(true);
    expect(state.time).toBe(0);
  });

  it('creates world state from a scenario selection', () => {
    const scenarios = getAvailableScenarios();
    expect(scenarios.length).toBeGreaterThan(0);
    const { world, scenario } = createWorldStateForScenario(scenarios[0].id);
    expect(world.title).toContain('Mistwood');
    expect(scenario.allowedInterventions.length).toBeGreaterThan(0);
  });
});
