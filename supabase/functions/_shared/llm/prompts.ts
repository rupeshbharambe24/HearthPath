// supabase/functions/_shared/llm/prompts.ts

export type SummaryKind = 'monthly_recap' | 'milestone_summary' | 'memory_search';

export interface MemoryInput {
  created_at: string;
  entry_type: string;
  mood: string | null;
  memo_text: string;
}

export interface CheckinInput {
  week_start: string;
  rating: number;
  note: string | null;
  gratitude: string | null;
}

const SYSTEM_PROMPT = `You are a careful, neutral summarizer for a college relationship-tracking app called HeartPath.

The user gives you a list of moments and check-ins recorded by two partners. Your job is to produce a concise, factual recap of what was recorded — never advice, never diagnosis, never personality assessments.

Hard rules:
- Use only the provided data. Do not invent details, names, or context.
- Refer to the partners as "you" and "your partner" — never use real names even if any appear in the input.
- Stay descriptive and neutral. Do not say what the relationship "should" do.
- Do not label moments as healthy, unhealthy, toxic, red flags, or similar. Just describe.
- If the input is sparse, say so plainly. Do not pad.
- Keep the response under 300 words unless the user explicitly asked for more.
- Do not include disclaimers or meta-commentary about being an AI; the surrounding UI handles that.`;

export function buildMonthlyRecapPrompt(input: {
  memories: MemoryInput[];
  checkins: CheckinInput[];
  windowStart: string;
  windowEnd: string;
}): { system: string; user: string } {
  const lines: string[] = [];
  lines.push(`Window: ${input.windowStart} to ${input.windowEnd}.`);
  lines.push('');
  lines.push(`Check-ins (rating 1-5, optional note + gratitude):`);
  if (input.checkins.length === 0) {
    lines.push('  none');
  } else {
    for (const c of input.checkins) {
      lines.push(
        `  ${c.week_start}: rating ${c.rating}` +
          (c.note ? `, note: "${truncate(c.note, 240)}"` : '') +
          (c.gratitude ? `, gratitude: "${truncate(c.gratitude, 240)}"` : '')
      );
    }
  }
  lines.push('');
  lines.push(`Memories (most recent first):`);
  if (input.memories.length === 0) {
    lines.push('  none');
  } else {
    for (const m of input.memories) {
      lines.push(
        `  ${m.created_at.slice(0, 10)} [${m.entry_type}${
          m.mood ? `, mood ${m.mood}` : ''
        }]: "${truncate(m.memo_text, 320)}"`
      );
    }
  }
  lines.push('');
  lines.push(
    `Write a neutral monthly recap. If applicable: name the dominant mood, list 2-4 standout moments, and note anything that recurred. End with one sentence acknowledging gaps in the data if check-ins or memories were sparse. Do not give advice.`
  );

  return { system: SYSTEM_PROMPT, user: lines.join('\n') };
}

export function buildMilestoneSummaryPrompt(input: {
  memories: MemoryInput[];
  currentStage: number;
}): { system: string; user: string } {
  const lines: string[] = [];
  lines.push(`Current stage: ${input.currentStage} (of 6).`);
  lines.push('');
  lines.push(`All milestone-type memories (and their recorded mood, if any):`);
  if (input.memories.length === 0) {
    lines.push('  none');
  } else {
    for (const m of input.memories) {
      lines.push(
        `  ${m.created_at.slice(0, 10)}${m.mood ? ` [${m.mood}]` : ''}: "${truncate(
          m.memo_text,
          320
        )}"`
      );
    }
  }
  lines.push('');
  lines.push(
    `Write a neutral milestone summary. Order moments chronologically, name what changed at each, and use no more than 3-5 sentences. Do not give advice.`
  );

  return { system: SYSTEM_PROMPT, user: lines.join('\n') };
}

export function buildMemorySearchPrompt(input: {
  query: string;
  memories: MemoryInput[];
}): { system: string; user: string } {
  const lines: string[] = [];
  lines.push(`User query: "${truncate(input.query, 200)}"`);
  lines.push('');
  lines.push(
    `Candidate memories (deduplicated, sorted by relevance per a keyword pre-filter):`
  );
  if (input.memories.length === 0) {
    lines.push('  none');
  } else {
    for (const m of input.memories) {
      lines.push(
        `  ${m.created_at.slice(0, 10)} [${m.entry_type}${
          m.mood ? `, mood ${m.mood}` : ''
        }]: "${truncate(m.memo_text, 280)}"`
      );
    }
  }
  lines.push('');
  lines.push(
    `Write 1-3 short paragraphs answering the query using only the candidate memories. Quote exact phrasing where useful. If none of the memories fit the query, say so explicitly. Do not give advice or extrapolate.`
  );

  return { system: SYSTEM_PROMPT, user: lines.join('\n') };
}

function truncate(value: string, max: number): string {
  if (value.length <= max) return value;
  return value.slice(0, max - 1) + '…';
}
