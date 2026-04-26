// src/hooks/useGenerateSummary.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

type AiSummary = Database['public']['Tables']['ai_summaries']['Row'];
type SummaryKind = 'monthly_recap' | 'milestone_summary' | 'memory_search';

export interface GenerateSummaryArgs {
  relationship_id: string;
  kind: SummaryKind;
  source_scope: 'private' | 'shared';
  query?: string;
  refresh?: boolean;
}

export interface GenerateSummaryResult {
  row: AiSummary;
  cached: boolean;
}

export function useGenerateSummary() {
  const qc = useQueryClient();
  return useMutation<GenerateSummaryResult, Error, GenerateSummaryArgs>({
    mutationFn: async (args) => {
      const { data, error } = await supabase.functions.invoke<GenerateSummaryResult>(
        'generate-ai-summary',
        { body: args }
      );
      if (error) throw new Error(error.message || 'Summary generation failed');
      if (!data?.row) throw new Error('Edge function returned no summary');
      return data;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['relationship-space', data.row.relationship_id] });
    },
  });
}
