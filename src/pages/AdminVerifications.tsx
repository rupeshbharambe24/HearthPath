import React, { useEffect, useMemo, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { ExternalLink, ShieldCheck } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import AuthenticatedLayout from '@/components/AuthenticatedLayout';
import FullscreenLoader from '@/components/FullscreenLoader';
import { useIsAdmin } from '@/hooks/useIsAdmin';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';

type Submission = {
  verification: {
    id: string;
    status: string;
    created_at: string;
    metadata: Record<string, unknown>;
    user_id: string;
  };
  user: {
    id: string;
    name: string;
    college_email: string;
    college_name: string | null;
    branch: string | null;
    year: number | null;
  } | null;
  documentPath: string | null;
  signedUrl: string | null;
};

interface PhotoSubmission {
  verification: {
    id: string;
    user_id: string;
    status: string;
    created_at: string;
    metadata: Record<string, unknown> | null;
  };
  user: {
    id: string;
    name: string | null;
    college_email: string | null;
    college_name: string | null;
    branch: string | null;
    year: number | null;
  } | null;
  selfieUrl: string | null;
  idCardUrl: string | null;
}

const AdminVerifications = () => {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsAdmin();
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [notesByUser, setNotesByUser] = useState<Record<string, string>>({});
  const [busyUserId, setBusyUserId] = useState<string | null>(null);
  const [tab, setTab] = useState<'student_id' | 'photo'>('student_id');
  const adminAllowed = Boolean(isAdmin);
  const { toast } = useToast();
  const qc = useQueryClient();

  const loadSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase.functions.invoke('review-student-verifications', {
        body: { mode: 'list' },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Unable to load student verification submissions.');
      }

      setSubmissions(data.submissions || []);
    } catch (error) {
      console.error('Error loading admin verification submissions:', error);
      setSubmissions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!adminAllowed) return;
    void loadSubmissions();
  }, [adminAllowed]);

  const photoQuery = useQuery({
    queryKey: ['admin-photo-verifications'],
    enabled: adminAllowed,
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke<{ submissions: PhotoSubmission[] }>(
        'review-photo-verifications',
        { body: { mode: 'list' } }
      );
      if (error) throw error;
      return data?.submissions ?? [];
    },
  });

  const photoDecide = useMutation({
    mutationFn: async (input: { targetUserId: string; status: 'reviewing' | 'verified' | 'rejected'; notes?: string }) => {
      const { error } = await supabase.functions.invoke('review-photo-verifications', {
        body: { mode: 'update', ...input },
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-photo-verifications'] }),
    onError: (err) =>
      toast({
        title: 'Decision failed',
        description: (err as Error).message,
        variant: 'destructive',
      }),
  });

  const counts = useMemo(() => {
    return submissions.reduce(
      (accumulator, item) => {
        accumulator.total += 1;
        if (item.verification.status === 'pending') accumulator.pending += 1;
        if (item.verification.status === 'reviewing') accumulator.reviewing += 1;
        if (item.verification.status === 'rejected') accumulator.rejected += 1;
        return accumulator;
      },
      { total: 0, pending: 0, reviewing: 0, rejected: 0 }
    );
  }, [submissions]);

  const updateSubmission = async (targetUserId: string, status: 'reviewing' | 'verified' | 'rejected') => {
    try {
      setBusyUserId(targetUserId);
      const { data, error } = await supabase.functions.invoke('review-student-verifications', {
        body: {
          mode: 'update',
          targetUserId,
          status,
          notes: notesByUser[targetUserId] || '',
        },
      });

      if (error || !data?.success) {
        throw new Error(data?.error || error?.message || 'Unable to update this verification record.');
      }

      await loadSubmissions();
    } catch (error) {
      console.error('Error updating submission:', error);
    } finally {
      setBusyUserId(null);
    }
  };

  if (isAdminLoading) {
    return <FullscreenLoader label="Verifying access..." />;
  }

  if (!adminAllowed) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <AuthenticatedLayout>
      <div className="p-6">
          <div className="mx-auto max-w-6xl space-y-6">
            <div>
              <h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">Verification Review</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Review manual college ID submissions and selfie photo submissions for student verification.
              </p>
            </div>

            <Tabs value={tab} onValueChange={(v) => setTab(v as 'student_id' | 'photo')}>
              <TabsList>
                <TabsTrigger value="student_id">Student ID</TabsTrigger>
                <TabsTrigger value="photo">Photo verification</TabsTrigger>
              </TabsList>

              <TabsContent value="student_id" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="romantic-card"><CardContent className="p-5"><p className="text-sm text-gray-500 dark:text-gray-400">Total</p><p className="text-2xl font-semibold text-romantic-red">{counts.total}</p></CardContent></Card>
                  <Card className="romantic-card"><CardContent className="p-5"><p className="text-sm text-gray-500 dark:text-gray-400">Pending</p><p className="text-2xl font-semibold text-romantic-red">{counts.pending}</p></CardContent></Card>
                  <Card className="romantic-card"><CardContent className="p-5"><p className="text-sm text-gray-500 dark:text-gray-400">Reviewing</p><p className="text-2xl font-semibold text-romantic-red">{counts.reviewing}</p></CardContent></Card>
                  <Card className="romantic-card"><CardContent className="p-5"><p className="text-sm text-gray-500 dark:text-gray-400">Rejected</p><p className="text-2xl font-semibold text-romantic-red">{counts.rejected}</p></CardContent></Card>
                </div>

                {loading ? (
                  <Card className="romantic-card">
                    <CardContent className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading verification submissions...</CardContent>
                  </Card>
                ) : submissions.length === 0 ? (
                  <Card className="romantic-card">
                    <CardContent className="p-6 text-sm text-gray-500 dark:text-gray-400">No student ID submissions need review right now.</CardContent>
                  </Card>
                ) : (
                  <div className="space-y-4">
                    {submissions.map((submission) => {
                      const metadata = submission.verification.metadata || {};
                      const targetUserId = submission.verification.user_id;
                      return (
                        <Card key={submission.verification.id} className="romantic-card">
                          <CardHeader>
                            <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                              <div className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-romantic-red" />
                                <span>{submission.user?.name || 'Unknown user'}</span>
                              </div>
                              <Badge variant="outline">{submission.verification.status}</Badge>
                            </CardTitle>
                            <CardDescription>
                              Submitted on {new Date(submission.verification.created_at).toLocaleString()}
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="space-y-4">
                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2 text-sm">
                                <p><span className="font-medium text-gray-900 dark:text-white">Email:</span> {submission.user?.college_email || 'Unavailable'}</p>
                                <p><span className="font-medium text-gray-900 dark:text-white">College:</span> {String(metadata.submitted_college_name || submission.user?.college_name || 'Unavailable')}</p>
                                <p><span className="font-medium text-gray-900 dark:text-white">Branch:</span> {submission.user?.branch || 'Unavailable'}</p>
                                <p><span className="font-medium text-gray-900 dark:text-white">Year:</span> {submission.user?.year || 'Unavailable'}</p>
                              </div>
                              <div className="space-y-2 text-sm">
                                <p><span className="font-medium text-gray-900 dark:text-white">Source:</span> {String(metadata.source || 'id_card')}</p>
                                <p><span className="font-medium text-gray-900 dark:text-white">Notes:</span> {String(metadata.notes || 'No notes')}</p>
                                {submission.signedUrl ? (
                                  <a
                                    href={submission.signedUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 text-romantic-red hover:underline"
                                  >
                                    <ExternalLink className="h-4 w-4" />
                                    Open submitted ID
                                  </a>
                                ) : (
                                  <p><span className="font-medium text-gray-900 dark:text-white">Document:</span> No signed preview available</p>
                                )}
                              </div>
                            </div>

                            <div className="space-y-2">
                              <label className="text-sm font-medium text-gray-900 dark:text-white">Review notes</label>
                              <Input
                                value={notesByUser[targetUserId] || ''}
                                onChange={(event) => setNotesByUser((previous) => ({ ...previous, [targetUserId]: event.target.value }))}
                                placeholder="Add review notes for this decision"
                              />
                            </div>

                            <div className="flex flex-wrap gap-2">
                              <Button variant="outline" onClick={() => void updateSubmission(targetUserId, 'reviewing')} disabled={busyUserId === targetUserId}>
                                Mark reviewing
                              </Button>
                              <Button className="romantic-btn" onClick={() => void updateSubmission(targetUserId, 'verified')} disabled={busyUserId === targetUserId}>
                                Approve
                              </Button>
                              <Button variant="destructive" onClick={() => void updateSubmission(targetUserId, 'rejected')} disabled={busyUserId === targetUserId}>
                                Reject
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="photo" className="space-y-4">
                {photoQuery.isLoading && (
                  <Card className="romantic-card">
                    <CardContent className="p-6 text-sm text-gray-500 dark:text-gray-400">Loading photo verifications...</CardContent>
                  </Card>
                )}
                {!photoQuery.isLoading && (photoQuery.data?.length ?? 0) === 0 && (
                  <Card className="romantic-card">
                    <CardContent className="p-6 text-sm text-gray-500 dark:text-gray-400 text-center">
                      No pending photo verifications.
                    </CardContent>
                  </Card>
                )}
                <div className="grid grid-cols-1 gap-4">
                  {photoQuery.data?.map((sub) => (
                    <Card key={sub.verification.id} className="romantic-card">
                      <CardHeader>
                        <CardTitle className="flex flex-wrap items-center justify-between gap-3">
                          <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-romantic-red" />
                            <span>{sub.user?.name ?? 'Unknown'}</span>
                          </div>
                          <Badge variant="outline">{sub.verification.status}</Badge>
                        </CardTitle>
                        <CardDescription>{sub.user?.college_email ?? 'Unavailable'}</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <div className="text-xs uppercase text-muted-foreground mb-1">Selfie</div>
                            {sub.selfieUrl ? (
                              <img src={sub.selfieUrl} alt="selfie" className="rounded max-h-80" />
                            ) : (
                              <div className="text-xs text-muted-foreground italic">no selfie file</div>
                            )}
                          </div>
                          <div>
                            <div className="text-xs uppercase text-muted-foreground mb-1">Student ID</div>
                            {sub.idCardUrl ? (
                              <img src={sub.idCardUrl} alt="student id" className="rounded max-h-80" />
                            ) : (
                              <div className="text-xs text-muted-foreground italic">no ID on file</div>
                            )}
                          </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-3">
                          <Button
                            variant="destructive"
                            disabled={photoDecide.isPending}
                            onClick={() =>
                              photoDecide.mutate({ targetUserId: sub.verification.user_id, status: 'rejected' })
                            }
                          >
                            Reject
                          </Button>
                          <Button
                            className="romantic-btn"
                            disabled={photoDecide.isPending}
                            onClick={() =>
                              photoDecide.mutate({ targetUserId: sub.verification.user_id, status: 'verified' })
                            }
                          >
                            Approve
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          </div>
      </div>
    </AuthenticatedLayout>
  );
};

export default AdminVerifications;
