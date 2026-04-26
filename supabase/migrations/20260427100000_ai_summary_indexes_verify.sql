-- supabase/migrations/20260427100000_ai_summary_indexes_verify.sql
-- Manual probes — run with EXPLAIN to confirm the indexes are used.

EXPLAIN
SELECT *
FROM public.ai_summaries
WHERE relationship_id = '<REL>'
  AND summary_kind = 'monthly_recap'
  AND source_scope = 'private'
  AND metadata->>'input_hash' = 'deadbeef';
-- Expected: Index Scan using idx_ai_summaries_cache_lookup.

EXPLAIN
SELECT count(*)
FROM public.ai_summaries
WHERE generated_by = '<USER>'
  AND created_at >= now() - interval '24 hours';
-- Expected: Index Only Scan (or Index Scan) using idx_ai_summaries_generator_recency.
