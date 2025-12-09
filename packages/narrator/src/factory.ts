import { NarrationAdapter } from './types.js';
import { StubNarrator } from './stubNarrator.js';
import { LocalLlmNarrator } from './localLlmNarrator.js';

async function canReachLlm(baseUrl: string): Promise<boolean> {
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 500);
    const response = await fetch(`${baseUrl}/models`, { signal: controller.signal });
    clearTimeout(timeout);
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function createNarratorFromEnv(): Promise<NarrationAdapter> {
  const mode = (process.env.LLM_MODE ?? 'stub').toLowerCase();
  if (mode === 'local') {
    const baseUrl = process.env.LLM_BASE_URL ?? 'http://localhost:1234/v1';
    const reachable = await canReachLlm(baseUrl);
    if (reachable) {
      return new LocalLlmNarrator(baseUrl);
    }
    console.warn('Local LLM narrator unreachable, falling back to stub narrator.');
  }
  return new StubNarrator();
}
