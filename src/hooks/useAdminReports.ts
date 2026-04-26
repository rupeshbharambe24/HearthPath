// src/hooks/useAdminReports.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

export type Report = Database['public']['Tables']['reports']['Row'];
export type ModerationAction = Database['public']['Tables']['moderation_actions']['Row'];
export type ReportStatus = 'open' | 'reviewing' | 'resolved' | 'dismissed';

export interface ReportWithContext extends Report {
  reporter_email: string | null;
  reporter_name: string | null;
  target_email: string | null;
  target_name: string | null;
  target_access_state: string | null;
  action_count: number;
}

const KEY_LIST = (status: ReportStatus | 'all') => ['admin-reports', status] as const;
const KEY_DETAIL = (id: string) => ['admin-reports', 'detail', id] as const;

async function fetchReports(status: ReportStatus | 'all'): Promise<ReportWithContext[]> {
  let q = supabase
    .from('reports')
    .select(`
      *,
      reporter:users!reports_reporter_user_id_fkey (id, name, college_email),
      target:users!reports_target_user_id_fkey (id, name, college_email, access_state),
      moderation_actions (id)
    `)
    .order('created_at', { ascending: false })
    .limit(200);
  if (status !== 'all') q = q.eq('status', status);
  const { data, error } = await q;
  if (error) throw error;
  return (data ?? []).map((r) => ({
    ...r,
    reporter_email: (r as { reporter?: { college_email?: string | null } })
      .reporter?.college_email ?? null,
    reporter_name: (r as { reporter?: { name?: string | null } }).reporter?.name ?? null,
    target_email: (r as { target?: { college_email?: string | null } }).target?.college_email ?? null,
    target_name: (r as { target?: { name?: string | null } }).target?.name ?? null,
    target_access_state: (r as { target?: { access_state?: string | null } })
      .target?.access_state ?? null,
    action_count: ((r as { moderation_actions?: unknown[] }).moderation_actions ?? [])
      .length,
  })) as ReportWithContext[];
}

async function fetchReportDetail(id: string) {
  const [reportRes, actionsRes] = await Promise.all([
    supabase
      .from('reports')
      .select(`
        *,
        reporter:users!reports_reporter_user_id_fkey (id, name, college_email),
        target:users!reports_target_user_id_fkey (id, name, college_email, access_state)
      `)
      .eq('id', id)
      .maybeSingle(),
    supabase
      .from('moderation_actions')
      .select('*')
      .eq('report_id', id)
      .order('created_at', { ascending: true }),
  ]);
  if (reportRes.error) throw reportRes.error;
  if (actionsRes.error) throw actionsRes.error;
  return { report: reportRes.data, actions: actionsRes.data ?? [] };
}

export function useAdminReports(status: ReportStatus | 'all' = 'open') {
  return useQuery({
    queryKey: KEY_LIST(status),
    queryFn: () => fetchReports(status),
    staleTime: 30 * 1000,
  });
}

export function useAdminReportDetail(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? KEY_DETAIL(id) : ['admin-reports', 'detail', 'none'],
    enabled: Boolean(id),
    queryFn: () => fetchReportDetail(id!),
    staleTime: 15 * 1000,
  });
}

export function useUpdateReportStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: ReportStatus }) => {
      const { error } = await supabase.from('reports').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
}

export function useRecordModerationAction() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      report_id: string;
      target_user_id: string;
      action_type: 'review_note' | 'warn' | 'restrict' | 'suspend' | 'dismiss';
      notes?: string | null;
    }) => {
      const { data: userRes } = await supabase.auth.getUser();
      const created_by = userRes.user?.id;
      if (!created_by) throw new Error('Not authenticated');
      const { error } = await supabase.from('moderation_actions').insert({
        report_id: input.report_id,
        target_user_id: input.target_user_id,
        action_type: input.action_type,
        notes: input.notes ?? null,
        created_by,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
}

export function useSetUserAccessState() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: { user_id: string; state: 'active' | 'blocked' }) => {
      const { error } = await supabase.rpc('set_user_access_state', {
        p_user: input.user_id,
        p_state: input.state,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-reports'] });
    },
  });
}
