import { describe, it, expect } from 'vitest';
import { applyIntervention, createInitialWorldState } from '../src/worldEngine.js';
import { createRunLog, appendRunStep, deriveRunMetrics } from '../src/runLog.js';
import type { CanonWorld, Intervention } from '../src/types.js';

const canon: CanonWorld = {
  title: 'Metrics Test',
  characters: [
    { id: 'a', name: 'Aster', traits: [], alive: true, knowledge: [] },
    { id: 'b', name: 'Bryn', traits: [], alive: true, knowledge: [] }
  ],
  locations: [],
  items: [],
  relationships: [{ id: 'a-b', fromId: 'a', toId: 'b', trust: 0, hostility: 30 }],
  events: [{ id: 'meet', title: 'Meeting', description: '', participants: ['a', 'b'], time: 0 }],
  knowledge: [{ id: 'secret', content: 'Hidden beacon', knownBy: ['a'] }],
  plotFlags: { tensionHigh: false },
  startTime: 0
};

describe('run log metrics', () => {
  it('derives metrics from appended steps', () => {
    let state = createInitialWorldState(canon);
    let log = createRunLog('run-1', canon.title);

    const trustIntervention: Intervention = { type: 'adjustTrust', fromId: 'a', toId: 'b', delta: 5 };
    const trustResult = applyIntervention(state, trustIntervention);
    expect(trustResult.applied).toBe(true);
    log = appendRunStep(log, trustIntervention, trustResult);
    state = trustResult.newState;

    const knowledgeIntervention: Intervention = {
      type: 'addKnowledge',
      characterId: 'b',
      knowledgeId: 'secret',
      content: 'Hidden beacon'
    };
    const knowledgeResult = applyIntervention(state, knowledgeIntervention);
    expect(knowledgeResult.applied).toBe(true);
    log = appendRunStep(log, knowledgeIntervention, knowledgeResult);

    const metrics = deriveRunMetrics(log);
    expect(metrics.steps).toBe(2);
    expect(metrics.relationshipChanges).toBe(1);
    expect(metrics.knowledgeChanges).toBe(1);
    expect(metrics.knowledgeSpread).toBe(1);
    expect(metrics.tension).toBeGreaterThan(0);
    expect(metrics.currentTime).toBeGreaterThan(0);
  });
});
