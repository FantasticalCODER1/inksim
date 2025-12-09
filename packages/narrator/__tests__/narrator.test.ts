import { describe, it, expect, vi, afterEach } from 'vitest';
import { NarrationContextBuilder } from '../src/contextBuilder.js';
import { StubNarrator } from '../src/stubNarrator.js';
import { createNarratorFromEnv } from '../src/factory.js';
import { LocalLlmNarrator } from '../src/localLlmNarrator.js';
import type { WorldState, SceneDiff, Intervention } from '@inksim/core';

const baseWorld: WorldState = {
  title: 'Test World',
  characters: [
    { id: 'a', name: 'Aria', traits: ['calm'], alive: true, knowledge: [] },
    { id: 'b', name: 'Bran', traits: ['bold'], alive: true, knowledge: [] }
  ],
  locations: [],
  items: [],
  relationships: [{ id: 'a-b', fromId: 'a', toId: 'b', trust: 20, hostility: 0 }],
  events: [{ id: 'meet', title: 'Meeting', description: 'Talk', locationId: undefined, participants: ['a', 'b'], time: 0 }],
  knowledge: [],
  plotFlags: {},
  time: 0
};

const diff: SceneDiff = { relationships: [], knowledge: [], events: [], notes: ['Trust shifted.'] };
const intervention: Intervention = { type: 'adjustTrust', fromId: 'a', toId: 'b', delta: 5 };

afterEach(() => {
  vi.restoreAllMocks();
  delete process.env.LLM_MODE;
});

describe('NarrationContextBuilder and stub', () => {
  it('builds context and produces deterministic stub narration', async () => {
    const builder = new NarrationContextBuilder();
    const context = builder.build(baseWorld, [intervention], diff, intervention);
    const narrator = new StubNarrator();
    const result = await narrator.generateSceneNarration(context);

    expect(result.sceneText).toContain('time');
    expect(result.analyticNotes[0]).toContain('Intervention');
    expect(result.usedStub).toBe(true);
  });
});

describe('createNarratorFromEnv', () => {
  it('returns stub narrator by default', async () => {
    const narrator = await createNarratorFromEnv();
    expect(narrator).toBeInstanceOf(StubNarrator);
  });

  it('falls back to stub if local mode is unreachable', async () => {
    process.env.LLM_MODE = 'local';
    const fetchSpy = vi.spyOn(global, 'fetch' as any).mockRejectedValue(new Error('unreachable'));
    const narrator = await createNarratorFromEnv();
    expect(fetchSpy).toHaveBeenCalled();
    expect(narrator).toBeInstanceOf(StubNarrator);
  });

  it('returns local narrator when reachable', async () => {
    process.env.LLM_MODE = 'local';
    vi.spyOn(global, 'fetch' as any).mockResolvedValue({ ok: true } as Response);
    const narrator = await createNarratorFromEnv();
    expect(narrator).toBeInstanceOf(LocalLlmNarrator);
  });
});
