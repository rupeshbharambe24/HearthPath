// supabase/functions/_shared/llm/provider.ts
import type { LLMCompletionRequest, LLMCompletionResponse } from './types.ts';

export interface LLMProvider {
  /** Stable id for telemetry — e.g. 'groq', 'gemini', 'openai'. */
  readonly name: string;

  /** Concrete model id — e.g. 'llama-3.3-70b-versatile'. */
  readonly model: string;

  complete(req: LLMCompletionRequest): Promise<LLMCompletionResponse>;
}
