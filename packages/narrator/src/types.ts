import type { SceneDiff, WorldState, Intervention } from '@inksim/core';

export interface NarrationContext {
  summary: string;
  keyCharacters: Array<{ id: string; name: string; traits: string[]; relationships: string[] }>;
  recentEvents: Array<{ id: string; title: string; time: number; participants: string[] }>;
  plotFlags: Record<string, boolean>;
  intervention: Intervention;
  sceneDiff: SceneDiff;
  time: number;
}

export interface NarrationOptions {
  temperature?: number;
  maxTokens?: number;
}

export interface NarrationResult {
  sceneText: string;
  analyticNotes: string[];
  modelName?: string;
  tokensUsed?: number;
  usedStub?: boolean;
}

export interface NarrationAdapter {
  generateSceneNarration(context: NarrationContext, options?: NarrationOptions): Promise<NarrationResult>;
}
