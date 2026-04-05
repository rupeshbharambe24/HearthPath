import React, { useEffect, useState } from 'react';
import AppLayout from '@/components/AppLayout';
import Sidebar from '@/components/Sidebar';
import MemoryTrail from '@/components/MemoryTrail';
import RelationshipBadge from '@/components/RelationshipBadge';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useRelationshipSpaceData } from '@/hooks/useRelationshipSpaceData';
import { useAuth } from '@/contexts/AuthContext';
import { canGrantPermissionAtStage, getRequiredStageForPermission, getStageDescription, getStageName, getStageRitual, getStageUnlocks, type HeartPathPermissionName } from '@/lib/heartpath';
import { ArrowUpRight, CalendarHeart, Heart, LockKeyhole, PauseCircle, ShieldCheck, Sparkles, Users } from 'lucide-react';

const Interactive = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const { incomingRequests, outgoingRequests, primaryRelationship, partner, currentStage, nextStage, requestIsOpen, isExclusive, isPaused, loading, memories, checkins, aiSummaries, events, myPermissions, partnerPermissions, sharedMemoryVaultEnabled, sharedAiEnabled, permissionCatalog, acceptRequest, rejectRequest, sendHeart, requestStageAdvance, respondToStageRequest, setPermissionState, saveCheckin, saveMemory, generateAiSummary, updateRelationshipSettings, setPausedState, archiveRelationship, stageRequestCooldownLabel } = useRelationshipSpaceData();
  const [rating, setRating] = useState('4');
  const [checkinVisibility, setCheckinVisibility] = useState<'private' | 'shared'>('shared');
  const [relationshipNote, setRelationshipNote] = useState('');
  const [gratitudeNote, setGratitudeNote] = useState('');
  const [pacePreference, setPacePreference] = useState<'gentle' | 'steady' | 'deepening'>('steady');
  const [boundaryTopics, setBoundaryTopics] = useState('');
  const [agreementsSummary, setAgreementsSummary] = useState('');
  const [memorySearchQuery, setMemorySearchQuery] = useState('');

  useEffect(() => {
    if (!primaryRelationship) return;
    setPacePreference((primaryRelationship.pace_preference as 'gentle' | 'steady' | 'deepening') || 'steady');
    setBoundaryTopics((primaryRelationship.boundary_topics || []).join(', '));
    setAgreementsSummary(primaryRelationship.agreements_summary || '');
  }, [primaryRelationship?.id]);

  const latestMine = checkins.find((checkin) => checkin.user_id === user?.id);
  useEffect(() => {
    if (!latestMine) return;
    setRating(String(latestMine.relationship_rating));
    setCheckinVisibility((latestMine.visibility as 'private' | 'shared') || 'shared');
    setRelationshipNote(latestMine.relationship_note || '');
    setGratitudeNote(latestMine.gratitude_note || '');
  }, [latestMine?.id]);

  const stageRitual = getStageRitual(currentStage);
  const currentUnlocks = getStageUnlocks(currentStage);
  const heartsGiven = primaryRelationship ? (primaryRelationship.user_a === user?.id ? primaryRelationship.hearts_a2b || 0 : primaryRelationship.hearts_b2a || 0) : 0;
  const heartsReceived = primaryRelationship ? (primaryRelationship.user_a === user?.id ? primaryRelationship.hearts_b2a || 0 : primaryRelationship.hearts_a2b || 0) : 0;
  const incomingStageRequest = requestIsOpen && primaryRelationship?.stage_request_from_user_id !== user?.id;
  const mine = (permission: HeartPathPermissionName) => myPermissions.some((item) => item.permission === permission && !item.revoked_at);
  const theirs = (permission: HeartPathPermissionName) => partnerPermissions.some((item) => item.permission === permission && !item.revoked_at);
  const notify = (title: string, description: string, variant?: 'destructive') => toast({ title, description, ...(variant ? { variant } : {}) });

  const handleRequest = async (id: string, accept: boolean) => {
    const result = accept ? await acceptRequest(id) : await rejectRequest(id);
    notify(result.success ? (accept ? 'Request accepted' : 'Request declined') : 'Unable to update request', result.success ? (accept ? 'Your HeartPath is active now.' : 'The request was archived.') : result.error || 'Please try again.', result.success ? undefined : 'destructive');
  };
  const handleStageDecision = async (decision: 'accept' | 'decline' | 'defer') => {
    const result = await respondToStageRequest(decision);
    notify(result.success ? 'Stage request updated' : 'Unable to update stage request', result.success ? 'The relationship stage state has been updated.' : result.error || 'Please try again.', result.success ? undefined : 'destructive');
  };
  const handlePermissionToggle = async (permission: HeartPathPermissionName) => {
    const result = await setPermissionState(permission, !mine(permission));
    notify(result.success ? (!mine(permission) ? 'Permission granted' : 'Permission revoked') : 'Unable to update permission', result.success ? 'Your HeartPath permission settings were updated.' : result.error || 'Please try again.', result.success ? undefined : 'destructive');
  };
  const handleSaveCheckin = async () => {
    const result = await saveCheckin({ relationship_rating: Number(rating), relationship_note: relationshipNote, gratitude_note: gratitudeNote, visibility: checkinVisibility });
    notify(result.success ? 'Weekly check-in saved' : 'Unable to save check-in', result.success ? 'Your reflection has been recorded.' : result.error || 'Please try again.', result.success ? undefined : 'destructive');
  };
  const handleGenerateSummary = async (kind: 'monthly_recap' | 'milestone_summary' | 'memory_search', visibility: 'private' | 'shared') => {
    const result = await generateAiSummary({ kind, visibility, query: kind === 'memory_search' ? memorySearchQuery : undefined });
    notify(result.success ? 'AI summary created' : 'Unable to generate summary', result.success ? 'A new summary is now available below.' : result.error || 'Please try again.', result.success ? undefined : 'destructive');
  };
  const handleSaveBoundaries = async () => {
    const result = await updateRelationshipSettings({ pace_preference: pacePreference, boundary_topics: boundaryTopics.split(',').map((topic) => topic.trim()).filter(Boolean), agreements_summary: agreementsSummary });
    notify(result.success ? 'HeartPath settings saved' : 'Unable to save settings', result.success ? 'Boundaries and agreements are updated.' : result.error || 'Please try again.', result.success ? undefined : 'destructive');
  };
  const handlePauseToggle = async () => {
    const result = await setPausedState(!isPaused);
    notify(result.success ? (isPaused ? 'HeartPath resumed' : 'HeartPath paused') : 'Unable to update relationship state', result.success ? (isPaused ? 'Stage progression is open again.' : 'Stage progression is paused until both of you are ready again.') : result.error || 'Please try again.', result.success ? undefined : 'destructive');
  };
  const handleArchive = async () => {
    const result = await archiveRelationship();
    notify(result.success ? 'HeartPath archived' : 'Unable to archive relationship', result.success ? 'This relationship has moved into cooldown and shared discovery is locked until it expires.' : result.error || 'Please try again.', result.success ? undefined : 'destructive');
  };

  if (loading) {
    return <AppLayout><div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg"><Sidebar /><main className="flex-1 p-6 lg:ml-64"><div className="mx-auto max-w-6xl animate-pulse space-y-6"><div className="h-8 w-1/3 rounded bg-gray-200 dark:bg-gray-700" /><div className="grid gap-6 lg:grid-cols-2"><div className="h-52 rounded bg-gray-200 dark:bg-gray-700" /><div className="h-52 rounded bg-gray-200 dark:bg-gray-700" /></div></div></main></div></AppLayout>;
  }

  const EmptyState = (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="h-5 w-5 text-romantic-red" /><span>Incoming Requests</span></CardTitle></CardHeader><CardContent className="space-y-4">{incomingRequests.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No pending requests right now. Explore HeartPath to start something new.</p> : incomingRequests.map((request) => <div key={request.id} className="space-y-3 rounded-xl border p-4"><div><h3 className="font-medium text-gray-900 dark:text-white">{request.partner?.name || 'New request'}</h3><p className="text-sm text-gray-500 dark:text-gray-400">{request.partner?.college_name || 'Unknown college'}</p></div><div className="flex gap-2"><Button onClick={() => handleRequest(request.id, true)} className="romantic-btn flex-1">Accept</Button><Button variant="outline" onClick={() => handleRequest(request.id, false)} className="flex-1">Decline</Button></div></div>)}</CardContent></Card>
      <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-romantic-red" /><span>Outgoing Requests</span></CardTitle></CardHeader><CardContent className="space-y-4">{outgoingRequests.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No requests pending from your side right now.</p> : outgoingRequests.map((request) => <div key={request.id} className="rounded-xl border p-4"><h3 className="font-medium text-gray-900 dark:text-white">{request.partner?.name || 'Pending request'}</h3><p className="text-sm text-gray-500 dark:text-gray-400">Waiting for them to decide whether to start a HeartPath with you.</p></div>)}</CardContent></Card>
    </div>
  );

  return (
    <AppLayout>
      <div className="flex min-h-screen bg-gray-50 dark:bg-romantic-dark-bg">
        <Sidebar />
        <main className="flex-1 p-6 lg:ml-64">
          <div className="mx-auto max-w-6xl space-y-6">
            <div><h1 className="mb-2 text-3xl font-bold text-gray-900 dark:text-white">HeartPath Shared Space</h1><p className="text-gray-600 dark:text-gray-400">Mutual trust, gradual access, shared reflection, and consented growth all live here.</p></div>
            {!primaryRelationship ? EmptyState : <>
              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center justify-between gap-4"><div><div className="text-xl font-semibold text-gray-900 dark:text-white">{partner?.name || 'Your partner'}</div><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{getStageDescription(currentStage)}</p></div><RelationshipBadge level={currentStage} /></CardTitle></CardHeader><CardContent className="space-y-5"><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-xl bg-romantic-light-pink/50 p-4 dark:bg-romantic-red/10"><p className="text-sm text-gray-500 dark:text-gray-400">Trust score</p><p className="text-2xl font-semibold text-romantic-red">{primaryRelationship.trust_score || 0}</p></div><div className="rounded-xl bg-romantic-light-pink/50 p-4 dark:bg-romantic-red/10"><p className="text-sm text-gray-500 dark:text-gray-400">Hearts sent</p><p className="text-2xl font-semibold text-romantic-red">{heartsGiven}</p></div><div className="rounded-xl bg-romantic-light-pink/50 p-4 dark:bg-romantic-red/10"><p className="text-sm text-gray-500 dark:text-gray-400">Hearts received</p><p className="text-2xl font-semibold text-romantic-red">{heartsReceived}</p></div></div><div className="flex flex-wrap gap-2"><Badge variant="secondary">Lifecycle: {primaryRelationship.lifecycle_state}</Badge>{isPaused ? <Badge variant="outline">Stage requests paused</Badge> : null}{isExclusive ? <Badge className="bg-romantic-red text-white">Discovery locked</Badge> : null}{stageRequestCooldownLabel ? <Badge variant="outline">Cooldown until {stageRequestCooldownLabel}</Badge> : null}<Badge variant="outline">{memories.length} moments</Badge><Badge variant="outline">{checkins.length} check-ins</Badge></div><div className="rounded-xl border border-romantic-red/15 bg-romantic-light-pink/40 p-4 dark:bg-romantic-red/10"><p className="font-medium text-gray-900 dark:text-white">{stageRitual.title}</p><p className="mt-2 text-sm text-gray-600 dark:text-gray-300">{stageRitual.prompt}</p></div><Button onClick={async () => { const result = await sendHeart(); notify(result.success ? 'Heart sent' : 'Unable to send heart', result.success ? 'A little more warmth has been added to this path.' : result.error || 'Please try again.', result.success ? undefined : 'destructive'); }} className="romantic-btn"><Heart className="mr-2 h-4 w-4" />Send Heart</Button><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={handlePauseToggle}><PauseCircle className="mr-2 h-4 w-4" />{isPaused ? 'Resume progression' : 'Pause progression'}</Button><Button variant="outline" onClick={handleArchive}>Archive path</Button></div></CardContent></Card>
                <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-romantic-red" /><span>Stage Progression</span></CardTitle></CardHeader><CardContent className="space-y-4">{requestIsOpen ? <><div className="rounded-xl border border-romantic-red/15 bg-romantic-light-pink/40 p-4 dark:bg-romantic-red/10"><p className="font-medium text-gray-900 dark:text-white">Request for Stage {primaryRelationship.requested_stage}: {getStageName(primaryRelationship.requested_stage || currentStage)}</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{incomingStageRequest ? `${partner?.name || 'Your partner'} asked to move the relationship forward.` : `You asked to move forward. Waiting for ${partner?.name || 'your partner'} to respond.`}</p></div>{incomingStageRequest ? <div className="grid gap-2 sm:grid-cols-3"><Button onClick={() => handleStageDecision('accept')} className="romantic-btn">Accept</Button><Button variant="outline" onClick={() => handleStageDecision('defer')}>Need more time</Button><Button variant="outline" onClick={() => handleStageDecision('decline')}>Stay here</Button></div> : null}</> : isExclusive ? <div className="rounded-xl border border-romantic-red/15 bg-romantic-light-pink/40 p-4 text-sm text-gray-600 dark:bg-romantic-red/10 dark:text-gray-300">This HeartPath is already exclusive. Discovery is locked and the shared space is now your default home.</div> : <><div className="rounded-xl border p-4"><p className="font-medium text-gray-900 dark:text-white">Next stage: {nextStage ? `Stage ${nextStage} · ${getStageName(nextStage)}` : 'None'}</p><p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{nextStage ? getStageDescription(nextStage) : 'You are already at the final stage.'}</p></div>{stageRequestCooldownLabel ? <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/20 dark:text-amber-200">Another stage request cannot be sent until {stageRequestCooldownLabel}. This cooldown is intentional so progression cannot be pressured.</div> : null}<Button onClick={async () => { const result = await requestStageAdvance(); notify(result.success ? 'Stage request sent' : 'Unable to request next stage', result.success ? `You asked to move to Stage ${result.nextStage}: ${getStageName(result.nextStage || currentStage)}.` : result.error || 'Please try again.', result.success ? undefined : 'destructive'); }} className="romantic-btn w-full" disabled={isPaused || !nextStage || Boolean(stageRequestCooldownLabel)}>Request mutual progression</Button></>}</CardContent></Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-romantic-red" /><span>Permissions & Intimacy</span></CardTitle></CardHeader><CardContent className="space-y-4">{permissionCatalog.map((permission) => <div key={permission.key} className="space-y-3 rounded-xl border p-4"><div><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium text-gray-900 dark:text-white">{permission.label}</h3><Badge variant="outline">Unlocks at Stage {getRequiredStageForPermission(permission.key)}</Badge></div><p className="text-sm text-gray-500 dark:text-gray-400">{permission.description}</p></div><div className="flex flex-wrap gap-2"><Badge variant={mine(permission.key) ? 'default' : 'outline'}>You grant: {mine(permission.key) ? 'Open' : 'Closed'}</Badge><Badge variant={theirs(permission.key) ? 'default' : 'outline'}>Partner grants: {theirs(permission.key) ? 'Open' : 'Closed'}</Badge>{(permission.key === 'shared_memory_vault' || permission.key === 'ai_shared_recap_access') ? <Badge variant={mine(permission.key) && theirs(permission.key) ? 'default' : 'outline'} className={mine(permission.key) && theirs(permission.key) ? 'bg-romantic-red text-white' : ''}>Mutual: {mine(permission.key) && theirs(permission.key) ? 'Enabled' : 'Pending'}</Badge> : null}</div><Button variant={mine(permission.key) ? 'outline' : 'default'} className={mine(permission.key) ? '' : 'romantic-btn'} onClick={() => handlePermissionToggle(permission.key)} disabled={!mine(permission.key) && !canGrantPermissionAtStage(permission.key, currentStage)}>{mine(permission.key) ? 'Revoke access' : canGrantPermissionAtStage(permission.key, currentStage) ? 'Grant access' : `Available at Stage ${getRequiredStageForPermission(permission.key)}`}</Button></div>)}</CardContent></Card>
                <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><CalendarHeart className="h-5 w-5 text-romantic-red" /><span>Weekly Check-In</span></CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Relationship rating</p><Select value={rating} onValueChange={setRating}><SelectTrigger><SelectValue placeholder="Choose rating" /></SelectTrigger><SelectContent>{[1,2,3,4,5].map((value) => <SelectItem key={value} value={String(value)}>{value} / 5</SelectItem>)}</SelectContent></Select></div><div><p className="mb-2 text-sm font-medium">Visibility</p><Select value={checkinVisibility} onValueChange={(value) => setCheckinVisibility(value as 'private' | 'shared')}><SelectTrigger><SelectValue placeholder="Choose visibility" /></SelectTrigger><SelectContent><SelectItem value="private">Private</SelectItem><SelectItem value="shared">Shared</SelectItem></SelectContent></Select></div></div><Textarea value={relationshipNote} onChange={(event) => setRelationshipNote(event.target.value)} placeholder="How is this HeartPath feeling for you this week?" className="min-h-24" /><Textarea value={gratitudeNote} onChange={(event) => setGratitudeNote(event.target.value)} placeholder="What are you grateful for right now?" className="min-h-20" /><Button onClick={handleSaveCheckin} className="romantic-btn w-full">Save weekly check-in</Button></CardContent></Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-2">
                <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-romantic-red" /><span>Current Stage Unlocks</span></CardTitle></CardHeader><CardContent>{currentUnlocks.length > 0 ? <div className="flex flex-wrap gap-2">{currentUnlocks.map((permission) => <Badge key={permission.key} variant="outline">{permission.label}</Badge>)}</div> : <p className="text-sm text-gray-500 dark:text-gray-400">This stage is still about safe discovery. Permissions open later through mutual trust.</p>}</CardContent></Card>
                <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><ArrowUpRight className="h-5 w-5 text-romantic-red" /><span>Stage History</span></CardTitle></CardHeader><CardContent className="space-y-3">{events.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">Your shared timeline will appear here as the relationship progresses.</p> : events.slice(0, 8).map((event) => <div key={event.id} className="rounded-xl border p-3"><div className="flex flex-wrap items-center gap-2"><Badge variant="outline">{event.event_type.replaceAll('_', ' ')}</Badge><span className="text-xs text-gray-500 dark:text-gray-400">{new Date(event.created_at).toLocaleString()}</span></div></div>)}</CardContent></Card>
              </div>

              <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
                <MemoryTrail relationshipId={primaryRelationship.id} relationshipLevel={currentStage} canCreateSharedMemories={sharedMemoryVaultEnabled} onCreateMemory={saveMemory} />
                <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-5 w-5 text-romantic-red" /><span>Assistive AI</span></CardTitle></CardHeader><CardContent className="space-y-4"><div className="rounded-xl border border-romantic-red/15 bg-romantic-light-pink/40 p-4 text-sm text-gray-600 dark:bg-romantic-red/10 dark:text-gray-300">AI here is assistive only. It summarizes saved moments and shared reflections. It does not diagnose or judge the relationship.</div><div className="grid gap-2"><Button onClick={() => handleGenerateSummary('monthly_recap', 'private')} variant="outline">Private monthly recap</Button><Button onClick={() => handleGenerateSummary('milestone_summary', 'private')} variant="outline">Private milestone summary</Button><Button onClick={() => handleGenerateSummary('monthly_recap', 'shared')} className="romantic-btn" disabled={!sharedAiEnabled}>Shared monthly recap</Button></div><div className="space-y-2"><Input value={memorySearchQuery} onChange={(event) => setMemorySearchQuery(event.target.value)} placeholder="Search saved moments by theme..." /><Button variant="outline" onClick={() => handleGenerateSummary('memory_search', 'private')} disabled={!memorySearchQuery.trim()}>Search memory archive</Button></div><div className="space-y-3">{aiSummaries.length === 0 ? <p className="text-sm text-gray-500 dark:text-gray-400">No AI summaries generated yet.</p> : aiSummaries.slice(0, 4).map((summary) => <div key={summary.id} className="space-y-2 rounded-xl border p-3"><div className="flex flex-wrap gap-2"><Badge variant="outline">{summary.summary_kind.replaceAll('_', ' ')}</Badge><Badge variant={summary.visibility === 'shared' ? 'default' : 'secondary'}>{summary.visibility}</Badge></div><h3 className="font-medium text-gray-900 dark:text-white">{summary.title}</h3><p className="whitespace-pre-line text-sm text-gray-500 dark:text-gray-400">{summary.summary}</p></div>)}</div></CardContent></Card>
              </div>

              <Card className="romantic-card"><CardHeader><CardTitle className="flex items-center gap-2"><LockKeyhole className="h-5 w-5 text-romantic-red" /><span>Pacing, Boundaries, and Agreements</span></CardTitle></CardHeader><CardContent className="space-y-4"><div className="grid gap-4 sm:grid-cols-2"><div><p className="mb-2 text-sm font-medium">Pace preference</p><Select value={pacePreference} onValueChange={(value) => setPacePreference(value as 'gentle' | 'steady' | 'deepening')}><SelectTrigger><SelectValue placeholder="Choose pace" /></SelectTrigger><SelectContent><SelectItem value="gentle">Gentle</SelectItem><SelectItem value="steady">Steady</SelectItem><SelectItem value="deepening">Deepening</SelectItem></SelectContent></Select></div><div><p className="mb-2 text-sm font-medium">Boundary topics</p><Input value={boundaryTopics} onChange={(event) => setBoundaryTopics(event.target.value)} placeholder="family, intimacy, public visibility" /></div></div><Textarea value={agreementsSummary} onChange={(event) => setAgreementsSummary(event.target.value)} placeholder="Summarize what you both have agreed on so far." className="min-h-24" /><div className="flex flex-wrap gap-2">{sharedMemoryVaultEnabled ? <Badge className="bg-romantic-red text-white">Shared memory vault enabled</Badge> : null}{sharedAiEnabled ? <Badge className="bg-romantic-red text-white">Shared AI recap enabled</Badge> : null}</div><Button onClick={handleSaveBoundaries} className="romantic-btn">Save HeartPath settings</Button></CardContent></Card>
            </>}
          </div>
        </main>
      </div>
    </AppLayout>
  );
};

export default Interactive;
