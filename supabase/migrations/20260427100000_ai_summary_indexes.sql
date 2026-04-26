-- supabase/migrations/20260427100000_ai_summary_indexes.sql
--
-- Cache lookup uses metadata->>input_hash. A functional index lets the
-- generate-ai-summary edge function check existence in O(log n) per request.

CREATE INDEX IF NOT EXISTS idx_ai_summaries_cache_lookup
  ON public.ai_summaries (
    relationship_id,
    summary_kind,
    source_scope,
    (metadata->>'input_hash')
  );

-- Daily rate-limit query in the edge function: count by generated_by + recency.
CREATE INDEX IF NOT EXISTS idx_ai_summaries_generator_recency
  ON public.ai_summaries (generated_by, created_at DESC);
