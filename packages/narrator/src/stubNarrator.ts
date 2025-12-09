import type { NarrationAdapter, NarrationContext, NarrationOptions, NarrationResult } from './types.js';

export class StubNarrator implements NarrationAdapter {
  async generateSceneNarration(context: NarrationContext, _options?: NarrationOptions): Promise<NarrationResult> {
    const characterLine = context.keyCharacters
      .map((c) => `${c.name} (${c.traits.join(', ')})`)
      .slice(0, 3)
      .join('; ');
    const eventLine = context.recentEvents
      .slice(-2)
      .map((e) => `${e.title} at ${e.time}`)
      .join(' | ');

    const sceneText = `At time ${context.time}, ${characterLine} respond to the latest turn. ${eventLine}.`;
    const analyticNotes = [
      `Intervention: ${context.intervention.type}`,
      ...context.sceneDiff.notes
    ];

    return { sceneText, analyticNotes, modelName: 'stub-narrator', usedStub: true };
  }
}
