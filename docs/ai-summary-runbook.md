# AI Summary Runbook

The `generate-ai-summary` edge function uses an LLM provider to produce relationship recaps, milestone summaries, and memory search results. This document covers operator setup, provider switching, deployment, and known limitations.

## One-time setup

Set the function secrets before deploying. `LLM_PROVIDER` and `LLM_MODEL` are optional — they default to `groq` and `llama-3.3-70b-versatile` respectively.

```bash
supabase secrets set GROQ_API_KEY=gsk_xxxxx
# Optional overrides:
supabase secrets set LLM_PROVIDER=groq
supabase secrets set LLM_MODEL=llama-3.3-70b-versatile
```

## Switching providers

Adding a new provider is a one-file change:

1. Implement the `LLMProvider` interface in `supabase/functions/_shared/llm/<provider>.ts`. Mirror the structure of `groq.ts`.
2. Add a `case '<name>':` arm in `supabase/functions/_shared/llm/selector.ts` that reads the appropriate API-key env var and returns the new provider.
3. Set the secrets:
   ```bash
   supabase secrets set LLM_PROVIDER=<name>
   supabase secrets set <NAME>_API_KEY=...
   supabase secrets set LLM_MODEL=<model-id>   # provider-specific
   ```
4. Redeploy: `supabase functions deploy generate-ai-summary`.

The rest of the system (caching, rate limit, prompt templates, persistence, UI) is provider-agnostic.

## Provider data-policy disclosure

**Free-tier provider keys are NOT recommended for production.** Free tiers — including Groq's free tier and Gemini's free API tier — typically reserve the right to use inputs for service improvement. HeartPath sends recorded relationship moments to the LLM. For real users, switch to a paid tier or self-hosted inference before any production traffic flows through this function.

For dev and prototyping, free tiers are fine.

## Deploy

```bash
supabase functions deploy generate-ai-summary
supabase db push    # applies the indexes migration
```

Then run the verify SQL with substituted UUIDs (the file contains `<REL>` and `<USER>` placeholders that must be replaced with real ids before `EXPLAIN` will produce useful plans):

```bash
psql "$SUPABASE_DB_URL" -f supabase/migrations/20260427100000_ai_summary_indexes_verify.sql
```

Expected: both `EXPLAIN` outputs reference the new index by name.

## Rate limits

Server-side: 10 generations per user per 24 hours, enforced inside the edge function. Adjust by editing the constant in `supabase/functions/generate-ai-summary/index.ts` and redeploying.

Service-role inserts bypass the rate limit — operators who run summaries directly via SQL (or admin tooling) won't be capped. This is intentional and matches the pattern used by Phase 1's discovery / report rate limits.

## Cost

At Groq Llama 3.3 70B Versatile (~$0.59/M input, $0.79/M output, paid tier):

- A monthly recap is roughly 2k input + 400 output → ~$0.0015 per call.
- 1000 summaries / month ≈ $1.50.

Free tier is currently $0/call subject to the data-policy caveat above.

Cached summaries (identical input hash) are free — no model call is made and no row is inserted (the cached row is returned).

## Caching

Caching is keyed on a SHA-256 of:
- Summary kind
- Source scope (`private` / `shared`)
- Search query (only for `memory_search`)
- Sorted list of memory keys: `(id, entry_type, mood, memo_text)`
- Sorted list of check-in keys: `(week_start, rating, note, gratitude)`

This means **edits to a memory's text or a check-in's note correctly invalidate the cache**, not just append-only changes.

There is no TTL on `ai_summaries` rows. Long-running tenants accumulate one row per (kind, scope, hash). A retention policy (e.g. delete summaries older than 12 months that aren't referenced from the UI) is a future Phase 3 task.

## Memory search behaviour

The keyword pre-filter is **AND-of-all-tokens** — a query like `cafe rainy walk` requires every memory to mention all three words to be considered a candidate. Users searching for any-of-tokens semantics will need to retry with single keywords.

Switching to embeddings-based semantic search (pgvector + provider's embedding API) is the planned upgrade path; tracked as a future plan.

## Output safety

The system prompt in `supabase/functions/_shared/llm/prompts.ts` enforces the hard rule: **neutral summary of recorded moments, never advice or diagnosis**. Specifically:

- Models must use only the provided data (no invention).
- Refer to partners as "you" / "your partner" — real names never enter the prompt.
- No labelling moments as healthy / unhealthy / toxic / red flags.
- No padding when input is sparse.
- No meta-commentary about being an AI.

If a particular model misbehaves, tighten the system prompt in `prompts.ts` and redeploy.

There is currently no automated post-processing on output. If the model returns a refusal ("I cannot summarize…") or near-empty text, it persists as-is. A future improvement would detect short/refusal outputs and fall back to the deterministic template generator (`src/lib/relationship-ai.ts`) automatically.

## Disabling AI

To disable the AI path without removing code:

1. `supabase secrets set LLM_PROVIDER=disabled`
2. Add a `case 'disabled':` arm in `selector.ts` that throws `LLMError('AI temporarily disabled')`.
3. Redeploy.

The Interactive page surfaces the template fallback link via the toast action whenever the edge function returns an error, so users continue to get summaries — just deterministic, template-based ones.

## Telemetry

Each generated summary stores in `ai_summaries.metadata`:
- `provider`, `model` — what produced it
- `input_tokens`, `output_tokens` — usage counters
- `finish_reason` — `stop`, `length`, or `other`
- `input_hash` — cache key
- `memory_ids`, `checkin_count` — what fed the prompt
- `query` — only for `memory_search`

Aggregate by `provider + model` for billing reconciliation:

```sql
SELECT
  metadata->>'provider' AS provider,
  metadata->>'model' AS model,
  count(*) AS calls,
  sum((metadata->>'input_tokens')::int) AS input_tokens,
  sum((metadata->>'output_tokens')::int) AS output_tokens
FROM public.ai_summaries
WHERE created_at >= now() - interval '30 days'
GROUP BY 1, 2;
```
