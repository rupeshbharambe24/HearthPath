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
