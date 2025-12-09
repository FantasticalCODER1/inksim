import { describe, it, expect } from 'vitest';
import { applyIntervention, createInitialWorldState } from '../src/worldEngine.js';
import { CanonWorld, Intervention } from '../src/types.js';

const sampleCanon: CanonWorld = {
  title: 'Test Canon',
  characters: [
    { id: 'c1', name: 'Alden', traits: ['curious'], alive: true, knowledge: [] },
    { id: 'c2', name: 'Bryn', traits: ['calm'], alive: true, knowledge: [] }
  ],
  locations: [{ id: 'l1', name: 'Harbour', description: 'Quiet docks' }],
  items: [],
  relationships: [{ id: 'r1', fromId: 'c1', toId: 'c2', trust: 20, hostility: 0 }],
  events: [{ id: 'e1', title: 'Meeting', description: 'First chat', locationId: 'l1', participants: ['c1', 'c2'], time: 0 }],
  knowledge: [],
  plotFlags: { peace: true },
  startTime: 0
};

describe('createInitialWorldState', () => {
  it('builds a world state with expected collections', () => {
    const world = createInitialWorldState(sampleCanon);
    expect(world.characters).toHaveLength(2);
    expect(world.relationships[0].trust).toBe(20);
    expect(world.time).toBe(0);
    expect(world.plotFlags.peace).toBe(true);
  });
});

describe('applyIntervention', () => {
  it('applies a valid trust adjustment and produces a diff', () => {
    const initial = createInitialWorldState(sampleCanon);
    const intervention: Intervention = { type: 'adjustTrust', fromId: 'c1', toId: 'c2', delta: 10 };
    const result = applyIntervention(initial, intervention);

    expect(result.applied).toBe(true);
    expect(result.newState.relationships[0].trust).toBe(30);
    expect(result.diff.relationships[0]).toMatchObject({ previousTrust: 20, newTrust: 30 });
    expect(result.newState.time).toBe(initial.time + 1);
  });

  it('rejects an intervention that references missing characters', () => {
    const initial = createInitialWorldState(sampleCanon);
    const badIntervention: Intervention = { type: 'adjustTrust', fromId: 'c1', toId: 'c99', delta: 5 };
    const result = applyIntervention(initial, badIntervention);

    expect(result.applied).toBe(false);
    expect(result.warnings.length).toBeGreaterThan(0);
    expect(result.newState).toBe(initial);
  });
});
