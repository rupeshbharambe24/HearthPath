// supabase/functions/_shared/llm/selector.ts
import type { LLMProvider } from './provider.ts';
import { createGroqProvider } from './groq.ts';
import { LLMError } from './types.ts';

export function getLLMProvider(): LLMProvider {
  const which = (Deno.env.get('LLM_PROVIDER') || 'groq').toLowerCase();
  switch (which) {
    case 'groq': {
      const apiKey = Deno.env.get('GROQ_API_KEY');
      if (!apiKey) throw new LLMError('Missing GROQ_API_KEY');
      const model = Deno.env.get('LLM_MODEL') || 'llama-3.3-70b-versatile';
      return createGroqProvider({ apiKey, model });
    }
    // Future providers slot in here. Keep one switch case per provider.
    default:
      throw new LLMError(`Unknown LLM_PROVIDER: ${which}`);
  }
}
