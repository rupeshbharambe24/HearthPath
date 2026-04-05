import type { Tables, TablesInsert } from '@/integrations/supabase/types';
import { normalizeVerificationBadges } from '@/lib/access-state';

export type DiscoveryMode = 'friendship_first' | 'slow_burn' | 'serious_only' | 'same_campus';

type UserProfile = Tables<'users'>;

export interface CompatibilityResult {
  score: number;
  scoreBand: 'low' | 'good' | 'strong' | 'excellent';
  reasons: string[];
  sharedValues: string[];
}

function overlap(left?: string[] | null, right?: string[] | null) {
  const leftSet = new Set((left || []).map((value) => value.toLowerCase()));
  return (right || []).filter((value) => leftSet.has(value.toLowerCase()));
}

function addReason(reasons: string[], condition: boolean, message: string) {
  if (condition && reasons.length < 4) {
    reasons.push(message);
  }
}

export function buildCompatibilitySnapshot(
  viewer: UserProfile,
  candidate: UserProfile,
  mode: DiscoveryMode
): CompatibilityResult {
  let score = 25;
  const reasons: string[] = [];
  const sharedValues = overlap(viewer.value_tags, candidate.value_tags).slice(0, 3);
  const sharedLifestyle = overlap(viewer.lifestyle_preferences, candidate.lifestyle_preferences).slice(0, 2);
  const sharedInterests = overlap(viewer.hobbies, candidate.hobbies).slice(0, 3);
  const compatibleDealBreakers = overlap(viewer.deal_breakers, candidate.deal_breakers);

  if (viewer.relationship_intent && candidate.relationship_intent && viewer.relationship_intent === candidate.relationship_intent) {
    score += 18;
    addReason(reasons, true, `You both want ${candidate.relationship_intent.toLowerCase()}.`);
  }

  if (viewer.preferred_chat_frequency && candidate.preferred_chat_frequency && viewer.preferred_chat_frequency === candidate.preferred_chat_frequency) {
    score += 10;
    addReason(reasons, true, `Your preferred communication rhythm is both ${candidate.preferred_chat_frequency.toLowerCase()}.`);
  }

  if (viewer.pace_style && candidate.pace_style && viewer.pace_style === candidate.pace_style) {
    score += 12;
    addReason(reasons, true, `You both prefer a ${candidate.pace_style} pace.`);
  }

  if (viewer.communication_style && candidate.communication_style && viewer.communication_style === candidate.communication_style) {
    score += 10;
    addReason(reasons, true, `You both communicate in a ${candidate.communication_style} way.`);
  }

  score += sharedValues.length * 8;
  addReason(reasons, sharedValues.length > 0, `Shared values: ${sharedValues.join(', ')}.`);

  score += sharedLifestyle.length * 5;
  addReason(reasons, sharedLifestyle.length > 0, `Lifestyle fit around ${sharedLifestyle.join(', ')}.`);

  score += sharedInterests.length * 3;
  addReason(reasons, sharedInterests.length > 0, `Shared interests include ${sharedInterests.join(', ')}.`);

  if (viewer.college_name && candidate.college_name && viewer.college_name === candidate.college_name) {
    score += 6;
    addReason(reasons, true, 'You are from the same college.');
  }

  if (viewer.campus_zone && candidate.campus_zone && viewer.campus_zone === candidate.campus_zone) {
    score += 5;
    addReason(reasons, true, `You both spend time around ${candidate.campus_zone}.`);
  }

  if (compatibleDealBreakers.length > 0) {
    score -= Math.min(12, compatibleDealBreakers.length * 6);
    addReason(reasons, true, `Potential friction around ${compatibleDealBreakers.join(', ')}.`);
  }

  if (mode === 'friendship_first' && candidate.relationship_intent === 'Friendship first') {
    score += 8;
  }

  if (mode === 'serious_only' && candidate.relationship_intent === 'Serious relationship') {
    score += 8;
  }

  if (mode === 'same_campus' && viewer.college_name && candidate.college_name === viewer.college_name) {
    score += 10;
  }

  const badges = normalizeVerificationBadges(candidate.verification_badges);
  if (badges.email_verified) score += 4;
  if (badges.student_verified) score += 6;
  score += Math.min(10, Math.floor((candidate.profile_completeness || 0) / 10));

  score = Math.max(0, Math.min(100, score));

  let scoreBand: CompatibilityResult['scoreBand'] = 'low';
  if (score >= 85) scoreBand = 'excellent';
  else if (score >= 70) scoreBand = 'strong';
  else if (score >= 55) scoreBand = 'good';

  return {
    score,
    scoreBand,
    reasons,
    sharedValues,
  };
}

export function buildCompatibilityInsert(
  viewerUserId: string,
  candidateUserId: string,
  discoveryMode: DiscoveryMode,
  result: CompatibilityResult
): TablesInsert<'compatibility_snapshots'> {
  return {
    viewer_user_id: viewerUserId,
    candidate_user_id: candidateUserId,
    discovery_mode: discoveryMode,
    compatibility_score: result.score,
    score_band: result.scoreBand,
    rationale: result.reasons,
    shared_values: result.sharedValues,
  };
}

export function buildSeriousnessSignals(profile: UserProfile) {
  const badges = normalizeVerificationBadges(profile.verification_badges);
  const signals = [
    badges.email_verified ? 'Email verified' : null,
    badges.student_verified ? 'College verified' : null,
    profile.relationship_intent ? 'Intent declared' : null,
    profile.pace_style ? 'Pace declared' : null,
    profile.boundary_topics?.length ? 'Boundaries shared' : null,
    profile.heartpath_norms_acknowledged_at ? 'HeartPath norms accepted' : null,
  ].filter(Boolean) as string[];

  return signals.slice(0, 4);
}
