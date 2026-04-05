import { getStageName } from '@/lib/heartpath';

interface RelationshipSummaryInput {
  currentStage: number;
  partnerName: string;
  trustScore: number;
  heartsGiven: number;
  heartsReceived: number;
  memories: Array<{
    memo_text: string | null;
    entry_type?: string | null;
    created_at?: string | null;
    mood?: string | null;
    visibility?: string | null;
  }>;
  checkins: Array<{
    relationship_rating: number;
    relationship_note?: string | null;
    gratitude_note?: string | null;
    created_at?: string | null;
  }>;
}

function average(values: number[]) {
  if (!values.length) return null;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function pickRecentMoments(
  memories: RelationshipSummaryInput['memories'],
  limit: number
) {
  return memories
    .filter((memory) => !!memory.memo_text)
    .slice(0, limit)
    .map((memory) => `- ${memory.memo_text}`);
}

export function buildMonthlyRecap(input: RelationshipSummaryInput) {
  const rating = average(input.checkins.map((checkin) => checkin.relationship_rating));
  const recentMoments = pickRecentMoments(input.memories, 3);
  const gratitudeHighlights = input.checkins
    .filter((checkin) => !!checkin.gratitude_note)
    .slice(0, 2)
    .map((checkin) => `- ${checkin.gratitude_note}`);

  const title = `Monthly recap with ${input.partnerName}`;
  const summary = [
    `HeartPath stage: ${getStageName(input.currentStage)}.`,
    `Trust score snapshot: ${input.trustScore}/100.`,
    `Hearts exchanged: ${input.heartsGiven} sent, ${input.heartsReceived} received.`,
    rating ? `Average weekly check-in rating: ${rating}/5.` : 'No shared weekly check-ins yet.',
    recentMoments.length ? 'Moments that stood out:' : 'No shared memories were captured yet this month.',
    ...recentMoments,
    gratitudeHighlights.length ? 'Gratitude highlights:' : 'No gratitude notes were shared yet.',
    ...gratitudeHighlights,
    'AI note: this recap is a neutral summary of recorded relationship moments, not advice.',
  ].join('\n');

  return { title, summary };
}

export function buildMilestoneSummary(input: RelationshipSummaryInput) {
  const milestoneMoments = input.memories
    .filter((memory) => memory.entry_type === 'milestone' || memory.entry_type === 'date')
    .slice(0, 4)
    .map((memory) => `- ${memory.memo_text}`);

  const title = `${input.partnerName} milestone highlights`;
  const summary = [
    `You are currently at the ${getStageName(input.currentStage)} stage together.`,
    milestoneMoments.length ? 'Milestones on your HeartPath:' : 'No milestone moments have been tagged yet.',
    ...milestoneMoments,
    'AI note: this summary reflects only tagged relationship moments and may miss unrecorded milestones.',
  ].join('\n');

  return { title, summary };
}

export function buildMemorySearchResult(query: string, memories: RelationshipSummaryInput['memories']) {
  const matches = memories.filter((memory) =>
    [memory.memo_text, memory.entry_type, memory.mood]
      .filter(Boolean)
      .some((value) => value!.toLowerCase().includes(query.toLowerCase()))
  );

  const title = `Search: ${query}`;
  const summary = matches.length
    ? matches.slice(0, 5).map((memory) => `- ${memory.memo_text}`).join('\n')
    : 'No saved moments matched that search.';

  return { title, summary };
}

export function buildResurfacedMoments(input: RelationshipSummaryInput) {
  const resurfaced = input.memories
    .filter((memory) => memory.memo_text)
    .filter((memory) => ['milestone', 'gratitude', 'date', 'promise', 'repair'].includes(memory.entry_type || ''))
    .slice(0, 3)
    .map((memory) => ({
      title: memory.entry_type ? memory.entry_type.replaceAll('_', ' ') : 'memory',
      body: memory.memo_text || '',
      mood: memory.mood || null,
      createdAt: memory.created_at || null,
    }));

  return resurfaced;
}

export function buildRelationshipPulse(input: RelationshipSummaryInput) {
  const rating = average(input.checkins.map((checkin) => checkin.relationship_rating));
  const gratitudeCount = input.checkins.filter((checkin) => !!checkin.gratitude_note).length;
  const hardMomentCount = input.memories.filter((memory) => memory.entry_type === 'hard_moment').length;
  const repairCount = input.memories.filter((memory) => memory.entry_type === 'repair').length;

  return [
    rating ? `Average check-in rating: ${rating}/5.` : 'No weekly check-ins recorded yet.',
    gratitudeCount ? `${gratitudeCount} gratitude notes have been recorded.` : 'No gratitude notes recorded yet.',
    hardMomentCount
      ? `${hardMomentCount} hard moments were acknowledged${repairCount ? ` and ${repairCount} repair entries followed.` : '.'}`
      : 'No hard-moment entries have been recorded.',
    'AI note: this pulse is a summary of saved relationship records, not advice.',
  ];
}
