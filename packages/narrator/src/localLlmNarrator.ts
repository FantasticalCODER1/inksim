import type { NarrationAdapter, NarrationContext, NarrationOptions, NarrationResult } from './types.js';

const defaultBaseUrl = process.env.LLM_BASE_URL ?? 'http://localhost:1234/v1';
const defaultApiKey = process.env.LLM_API_KEY ?? 'lm-studio';
const defaultModel = process.env.LLM_MODEL ?? 'local-llm';

export class LocalLlmNarrator implements NarrationAdapter {
  constructor(
    private baseUrl = defaultBaseUrl,
    private apiKey = defaultApiKey,
    private model = defaultModel
  ) {}

  async generateSceneNarration(context: NarrationContext, options?: NarrationOptions): Promise<NarrationResult> {
    const prompt = this.buildPrompt(context);
    const body = {
      model: this.model,
      temperature: options?.temperature ?? 0.4,
      max_tokens: options?.maxTokens ?? 400,
      messages: [
        {
          role: 'system',
          content:
            'You are the InkSim narrator. Write concise British English prose followed by bullet style analytic notes about what changed.'
        },
        { role: 'user', content: prompt }
      ]
    };

    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${this.apiKey}`
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      throw new Error(`LLM request failed with status ${response.status}`);
    }

    const json = await response.json();
    const content = json.choices?.[0]?.message?.content ?? '';
    const [sceneText, ...notes] = content.split('\n').filter((line: string) => line.trim().length > 0);

    return {
      sceneText: sceneText || 'No scene returned.',
      analyticNotes: notes.length ? notes : ['No analytic notes generated.'],
      modelName: json.model ?? this.model,
      tokensUsed: json.usage?.total_tokens
    };
  }

  private buildPrompt(context: NarrationContext): string {
    return `Story summary: ${context.summary}\nKey characters: ${context.keyCharacters
      .map((c) => `${c.name} (${c.traits.join(', ')}) relationships: ${c.relationships.join('; ')}`)
      .join(' | ')}\nRecent events: ${context.recentEvents
      .map((e) => `${e.title} at ${e.time} involving ${e.participants.join(', ')}`)
      .join(' | ')}\nPlot flags: ${JSON.stringify(context.plotFlags)}\nLatest intervention: ${JSON.stringify(
      context.intervention
    )}\nScene diff notes: ${context.sceneDiff.notes.join('; ')}`;
  }
}
