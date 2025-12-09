import type { SceneDiff, WorldState, Intervention } from '@inksim/core';
import type { NarrationContext } from './types.js';

function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

function summariseHistory(events: WorldState['events'], limit: number): Array<{ id: string; title: string; time: number; participants: string[] }> {
  const sorted = [...events].sort((a, b) => a.time - b.time);
  const mapped = sorted.map((e) => ({ id: e.id, title: e.title, time: e.time, participants: e.participants }));
  if (mapped.length <= limit) return mapped;
  const recent = mapped.slice(-limit + 1);
  const earlier = mapped.slice(0, mapped.length - recent.length);
  const summary = {
    id: 'earlier-summary',
    title: `${earlier.length} earlier events summarised`,
    time: earlier[0]?.time ?? 0,
    participants: Array.from(new Set(earlier.flatMap((e) => e.participants)))
  };
  return [summary, ...recent];
}

export class NarrationContextBuilder {
  constructor(private contextLimit = 20000) {}

  build(state: WorldState, interventions: Intervention[], latestDiff: SceneDiff, latestIntervention: Intervention): NarrationContext {
    const baseSummary = `${state.title} at time ${state.time}. Characters: ${state.characters
      .map((c) => c.name)
      .join(', ')}.`;

    const characterSummaries = state.characters.map((c) => {
      const relationships = state.relationships
        .filter((rel) => rel.fromId === c.id)
        .map((rel) => `${rel.toId}: trust ${rel.trust}`);
      return { id: c.id, name: c.name, traits: c.traits, relationships };
    });

    const recentEvents = summariseHistory(state.events, 5);

    const context: NarrationContext = {
      summary: baseSummary,
      keyCharacters: characterSummaries,
      recentEvents,
      plotFlags: state.plotFlags,
      intervention: latestIntervention,
      sceneDiff: latestDiff,
      time: state.time
    };

    const tokenEstimate = estimateTokens(JSON.stringify(context));
    if (tokenEstimate > this.contextLimit) {
      const excessRatio = this.contextLimit / tokenEstimate;
      context.keyCharacters = context.keyCharacters.slice(0, Math.max(1, Math.floor(context.keyCharacters.length * excessRatio)));
      context.recentEvents = context.recentEvents.slice(-3);
      context.summary = `${context.summary} Historical context summarised due to token limit.`;
    }

    return context;
  }
}
