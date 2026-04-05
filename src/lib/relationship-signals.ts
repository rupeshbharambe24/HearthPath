import type { Tables } from '@/integrations/supabase/types';

type RelationshipRow = Tables<'relationships'>;
type MemoryRow = Tables<'memories'>;
type CheckinRow = Tables<'weekly_checkins'>;
type RelationshipEventRow = Tables<'relationship_events'>;

export interface RelationshipSignal {
  key: 'trust' | 'mutuality' | 'respect' | 'consistency' | 'comfort' | 'openness';
  label: string;
  score: number;
  explanation: string;
}

function clamp(score: number) {
  return Math.max(0, Math.min(100, Math.round(score)));
}

function countEvents(events: RelationshipEventRow[], type: RelationshipEventRow['event_type']) {
  return events.filter((event) => event.event_type === type).length;
}

export function buildRelationshipSignals(input: {
  relationship: RelationshipRow | null;
  events: RelationshipEventRow[];
  memories: MemoryRow[];
  checkins: CheckinRow[];
}) {
  const { relationship, events, memories, checkins } = input;
  const trustScoreBase = relationship?.trust_score || 0;
  const hearts = (relationship?.hearts_a2b || 0) + (relationship?.hearts_b2a || 0);
  const acceptedStages = countEvents(events, 'stage_accepted');
  const deferredStages = countEvents(events, 'stage_deferred');
  const declinedStages = countEvents(events, 'stage_declined');
  const grantedPermissions = countEvents(events, 'permission_granted');
  const revokedPermissions = countEvents(events, 'permission_revoked');
  const sharedMemories = memories.filter((memory) => memory.visibility === 'shared').length;
  const repairMoments = memories.filter((memory) => memory.entry_type === 'repair').length;
  const hardMoments = memories.filter((memory) => memory.entry_type === 'hard_moment').length;
  const gratitudeMoments = memories.filter((memory) => memory.entry_type === 'gratitude').length;
  const averageCheckin =
    checkins.length > 0
      ? checkins.reduce((sum, checkin) => sum + checkin.relationship_rating, 0) / checkins.length
      : null;

  const trust = clamp(40 + trustScoreBase * 0.4 + grantedPermissions * 3 + sharedMemories * 2);
  const mutuality = clamp(35 + hearts * 3 + acceptedStages * 6 + (checkins.length > 1 ? 10 : 0));
  const respect = clamp(50 + acceptedStages * 4 + deferredStages * 2 - declinedStages * 3 - revokedPermissions * 2);
  const consistency = clamp(30 + checkins.length * 8 + sharedMemories * 2);
  const comfort = clamp(40 + (averageCheckin ? averageCheckin * 10 : 0) + gratitudeMoments * 3 - hardMoments * 2 + repairMoments * 2);
  const openness = clamp(25 + grantedPermissions * 8 + sharedMemories * 3 + acceptedStages * 5);

  const explanations: RelationshipSignal[] = [
    {
      key: 'trust',
      label: 'Trust',
      score: trust,
      explanation:
        trust >= 70
          ? 'Trust has been reinforced by shared moments, permissions, and reliable interaction.'
          : 'Trust is still developing. More shared moments and consistent care will strengthen it.',
    },
    {
      key: 'mutuality',
      label: 'Mutuality',
      score: mutuality,
      explanation:
        mutuality >= 65
          ? 'This path shows signs of shared effort through hearts, check-ins, and stage progress.'
          : 'Mutual effort is still light. More consistent two-sided engagement would improve this.',
    },
    {
      key: 'respect',
      label: 'Respect',
      score: respect,
      explanation:
        declinedStages + deferredStages > 0
          ? 'Stage decisions have been respected, and the system is recording those boundaries.'
          : 'Respect currently looks neutral. Boundary and pacing behavior will make this clearer over time.',
    },
    {
      key: 'consistency',
      label: 'Consistency',
      score: consistency,
      explanation:
        checkins.length > 1
          ? 'Regular check-ins and saved moments show a steadier relationship rhythm.'
          : 'Consistency is still early. Weekly rituals and recurring shared moments improve this.',
    },
    {
      key: 'comfort',
      label: 'Comfort',
      score: comfort,
      explanation:
        hardMoments > 0 && repairMoments === 0
          ? 'Hard moments have been recorded without much visible repair yet.'
          : 'Comfort is shaped by check-ins, gratitude, and whether hard moments are followed by repair.',
    },
    {
      key: 'openness',
      label: 'Openness',
      score: openness,
      explanation:
        openness >= 65
          ? 'Both people are opening access gradually through permissions and shared memories.'
          : 'Openness is still limited, which is normal early on. It should grow only through mutual consent.',
    },
  ];

  return explanations;
}
