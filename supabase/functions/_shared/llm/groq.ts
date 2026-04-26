// supabase/functions/_shared/llm/groq.ts
import type { LLMProvider } from './provider.ts';
import { LLMError, type LLMCompletionRequest, type LLMCompletionResponse } from './types.ts';

interface GroqOptions {
  apiKey: string;
  model: string;
}

export function createGroqProvider(opts: GroqOptions): LLMProvider {
  return {
    name: 'groq',
    model: opts.model,
    async complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse> {
      const body = {
        model: opts.model,
        messages: [
          { role: 'system', content: req.system },
          { role: 'user', content: req.user },
        ],
        temperature: req.temperature ?? 0.4,
        max_tokens: req.maxTokens ?? 600,
      };

      let res: Response;
      try {
        res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${opts.apiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body),
        });
      } catch (err) {
        throw new LLMError('Groq fetch failed', err);
      }

      if (!res.ok) {
        const text = await res.text().catch(() => '');
        throw new LLMError(
          `Groq returned ${res.status}: ${text.slice(0, 500)}`,
          undefined,
          res.status
        );
      }

      const data = (await res.json()) as {
        choices: { message: { content: string }; finish_reason: string }[];
        usage: { prompt_tokens: number; completion_tokens: number };
      };

      const choice = data.choices?.[0];
      if (!choice) throw new LLMError('Groq returned no choices');

      const finishReason: LLMCompletionResponse['finishReason'] =
        choice.finish_reason === 'stop'
          ? 'stop'
          : choice.finish_reason === 'length'
          ? 'length'
          : 'other';

      return {
        text: choice.message.content ?? '',
        inputTokens: data.usage?.prompt_tokens ?? 0,
        outputTokens: data.usage?.completion_tokens ?? 0,
        model: opts.model,
        provider: 'groq',
        finishReason,
      };
    },
  };
}
