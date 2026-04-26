import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import {
  useAdminReports,
  useAdminReportDetail,
  useUpdateReportStatus,
  useRecordModerationAction,
  useSetUserAccessState,
  type ReportStatus,
  type ReportWithContext,
} from '@/hooks/useAdminReports';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import FullscreenLoader from '@/components/FullscreenLoader';

const REASON_LABEL: Record<string, string> = {
  fake_identity: 'Fake identity',
  pressure: 'Pressure',
  harassment: 'Harassment',
  boundary_violation: 'Boundary violation',
  unsafe_behavior: 'Unsafe behaviour',
  other: 'Other',
};

export default function AdminModeration() {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [tab, setTab] = useState<ReportStatus | 'all'>('open');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const list = useAdminReports(tab);
  const detail = useAdminReportDetail(selectedId);
  const updateStatus = useUpdateReportStatus();
  const recordAction = useRecordModerationAction();
  const setAccessState = useSetUserAccessState();
  const { toast } = useToast();
  const [noteDraft, setNoteDraft] = useState('');

  if (isAdminLoading) return <FullscreenLoader label="Verifying access..." />;
  if (!isAdmin) return <Navigate to="/dashboard" replace />;

  const selected = list.data?.find((r) => r.id === selectedId);

  return (
    <AuthenticatedLayout>
      <div className="container py-6 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-4">
        <Card className="overflow-hidden">
          <CardHeader>
            <CardTitle>Moderation queue</CardTitle>
            <CardDescription>Reports filed by users</CardDescription>
            <Tabs value={tab} onValueChange={(v) => setTab(v as ReportStatus | 'all')} className="mt-2">
              <TabsList className="grid grid-cols-5">
                <TabsTrigger value="open">Open</TabsTrigger>
                <TabsTrigger value="reviewing">Reviewing</TabsTrigger>
                <TabsTrigger value="resolved">Resolved</TabsTrigger>
                <TabsTrigger value="dismissed">Dismissed</TabsTrigger>
                <TabsTrigger value="all">All</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[calc(100vh-280px)]">
              {list.isLoading && <div className="p-6 text-sm text-muted-foreground">Loading…</div>}
              {!list.isLoading && (list.data?.length ?? 0) === 0 && (
                <div className="p-6 text-sm text-muted-foreground text-center">No reports.</div>
              )}
              {list.data?.map((r) => (
                <ListRow
                  key={r.id}
                  report={r}
                  selected={r.id === selectedId}
                  onSelect={() => { setSelectedId(r.id); setNoteDraft(''); }}
                />
              ))}
            </ScrollArea>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{selected ? `Report from ${selected.reporter_name ?? 'someone'}` : 'Select a report'}</CardTitle>
            {selected && (
              <CardDescription>
                {REASON_LABEL[selected.reason] ?? selected.reason} • {formatDistanceToNow(new Date(selected.created_at), { addSuffix: true })}
              </CardDescription>
            )}
          </CardHeader>
          {!selected && <CardContent className="text-sm text-muted-foreground">Click a row on the left to triage.</CardContent>}
          {selected && (
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Reporter</div>
                  <div>{selected.reporter_name ?? 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">{selected.reporter_email}</div>
                </div>
                <div>
                  <div className="text-xs uppercase text-muted-foreground">Target</div>
                  <div>{selected.target_name ?? 'Unknown'}</div>
                  <div className="text-xs text-muted-foreground">{selected.target_email}</div>
                  <Badge variant={selected.target_access_state === 'blocked' ? 'destructive' : 'secondary'} className="mt-1">
                    {selected.target_access_state ?? '—'}
                  </Badge>
                </div>
              </div>

              {selected.details && (
                <div>
                  <div className="text-xs uppercase text-muted-foreground mb-1">Details</div>
                  <p className="text-sm whitespace-pre-wrap">{selected.details}</p>
                </div>
              )}

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-2">Action history ({detail.data?.actions.length ?? 0})</div>
                {(!detail.data || detail.data.actions.length === 0) && (
                  <div className="text-xs text-muted-foreground italic">No actions yet.</div>
                )}
                <ul className="space-y-2">
                  {detail.data?.actions.map((a) => (
                    <li key={a.id} className="text-sm border-l-2 pl-3 border-border/60">
                      <span className="font-medium">{a.action_type}</span>
                      {a.notes && <span className="text-muted-foreground"> — {a.notes}</span>}
                      <div className="text-[10px] text-muted-foreground">
                        {formatDistanceToNow(new Date(a.created_at), { addSuffix: true })}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              <div>
                <div className="text-xs uppercase text-muted-foreground mb-1">Add note (optional)</div>
                <Textarea
                  value={noteDraft}
                  onChange={(e) => setNoteDraft(e.target.value)}
                  placeholder="Internal triage notes…"
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 lg:grid-cols-3 gap-2">
                <Button variant="ghost" disabled={selected.status === 'reviewing' || updateStatus.isPending} onClick={async () => {
                  await updateStatus.mutateAsync({ id: selected.id, status: 'reviewing' });
                  toast({ title: 'Marked as reviewing' });
                }}>Mark reviewing</Button>
                <Button variant="ghost" disabled={recordAction.isPending} onClick={async () => {
                  if (!noteDraft.trim()) {
                    toast({ title: 'Note required', variant: 'destructive' });
                    return;
                  }
                  await recordAction.mutateAsync({
                    report_id: selected.id,
                    target_user_id: selected.target_user_id,
                    action_type: 'review_note',
                    notes: noteDraft.trim(),
                  });
                  setNoteDraft('');
                  toast({ title: 'Note added' });
                }}>Add note</Button>
                <Button variant="secondary" disabled={recordAction.isPending} onClick={async () => {
                  await recordAction.mutateAsync({
                    report_id: selected.id,
                    target_user_id: selected.target_user_id,
                    action_type: 'warn',
                    notes: noteDraft.trim() || null,
                  });
                  await updateStatus.mutateAsync({ id: selected.id, status: 'reviewing' });
                  setNoteDraft('');
                  toast({ title: 'Warning recorded' });
                }}>Warn</Button>
                <Button variant="secondary" disabled={recordAction.isPending} onClick={async () => {
                  await recordAction.mutateAsync({
                    report_id: selected.id,
                    target_user_id: selected.target_user_id,
                    action_type: 'restrict',
                    notes: noteDraft.trim() || null,
                  });
                  toast({ title: 'Restriction recorded' });
                }}>Restrict</Button>
                <Button variant="destructive" disabled={recordAction.isPending || setAccessState.isPending} onClick={async () => {
                  if (!confirm(`Suspend ${selected.target_name ?? 'this user'}? They will lose access immediately.`)) return;
                  await recordAction.mutateAsync({
                    report_id: selected.id,
                    target_user_id: selected.target_user_id,
                    action_type: 'suspend',
                    notes: noteDraft.trim() || null,
                  });
                  await setAccessState.mutateAsync({ user_id: selected.target_user_id, state: 'blocked' });
                  await updateStatus.mutateAsync({ id: selected.id, status: 'resolved' });
                  toast({ title: 'User suspended', description: 'Access state set to blocked.' });
                }}>Suspend user</Button>
                <Button variant="ghost" disabled={selected.target_access_state !== 'blocked' || setAccessState.isPending} onClick={async () => {
                  await setAccessState.mutateAsync({ user_id: selected.target_user_id, state: 'active' });
                  toast({ title: 'User reinstated' });
                }}>Reinstate</Button>
                <Button variant="outline" disabled={selected.status === 'resolved'} onClick={async () => {
                  await updateStatus.mutateAsync({ id: selected.id, status: 'resolved' });
                  toast({ title: 'Resolved' });
                }}>Resolve</Button>
                <Button variant="outline" disabled={selected.status === 'dismissed'} onClick={async () => {
                  await recordAction.mutateAsync({
                    report_id: selected.id,
                    target_user_id: selected.target_user_id,
                    action_type: 'dismiss',
                    notes: noteDraft.trim() || null,
                  });
                  await updateStatus.mutateAsync({ id: selected.id, status: 'dismissed' });
                  toast({ title: 'Dismissed' });
                }}>Dismiss</Button>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </AuthenticatedLayout>
  );
}

function ListRow({ report, selected, onSelect }: { report: ReportWithContext; selected: boolean; onSelect: () => void }) {
  return (
    <button
      onClick={onSelect}
      className={`w-full text-left px-4 py-3 border-b border-border/40 hover:bg-muted/40 transition ${selected ? 'bg-muted/60' : ''}`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <div className="text-sm font-medium truncate">{report.target_name ?? 'Unknown'}</div>
          <div className="text-xs text-muted-foreground truncate">
            from {report.reporter_name ?? 'someone'} • {REASON_LABEL[report.reason] ?? report.reason}
          </div>
          {report.details && (
            <div className="text-xs text-muted-foreground mt-1 line-clamp-2">{report.details}</div>
          )}
        </div>
        <div className="flex flex-col items-end gap-1 shrink-0">
          <Badge variant={report.status === 'open' ? 'default' : 'secondary'} className="text-[10px]">
            {report.status}
          </Badge>
          <span className="text-[10px] text-muted-foreground">
            {formatDistanceToNow(new Date(report.created_at), { addSuffix: true })}
          </span>
          {report.action_count > 0 && (
            <span className="text-[10px] text-muted-foreground">{report.action_count} action{report.action_count === 1 ? '' : 's'}</span>
          )}
        </div>
      </div>
    </button>
  );
}
