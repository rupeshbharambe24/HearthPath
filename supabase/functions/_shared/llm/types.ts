// supabase/functions/_shared/llm/types.ts

export interface LLMCompletionRequest {
  system: string;
  user: string;
  maxTokens?: number;
  temperature?: number;
}

export interface LLMCompletionResponse {
  text: string;
  inputTokens: number;
  outputTokens: number;
  model: string;
  provider: string;
  finishReason: 'stop' | 'length' | 'error' | 'other';
}

export class LLMError extends Error {
  constructor(
    message: string,
    public readonly cause?: unknown,
    public readonly status?: number
  ) {
    super(message);
    this.name = 'LLMError';
  }
}
