import type { Json } from '@/integrations/supabase/types';

export const HEARTPATH_STAGES = [
  { stage: 1, name: 'Stranger', description: 'Start with curiosity, safety, and low-pressure discovery.' },
  { stage: 2, name: 'Acquaintance', description: 'Open up a little more once both people feel comfortable.' },
  { stage: 3, name: 'Friend', description: 'A mutual bond starts to form through trust and consistency.' },
  { stage: 4, name: 'Close Friend', description: 'Deeper emotional context and stronger shared moments appear.' },
  { stage: 5, name: 'Romantic Interest', description: 'Both people intentionally acknowledge emotional closeness.' },
  { stage: 6, name: 'Exclusive', description: 'The relationship becomes exclusive and discovery is locked.' },
] as const;

export const HEARTPATH_PERMISSION_CATALOG = [
  { key: 'full_face_photo', label: 'Full face photo', description: 'Allow your partner to view your clearest photo.' },
  { key: 'private_photo_gallery', label: 'Private photo gallery', description: 'Unlock your deeper staged photo set.' },
  { key: 'voice_notes', label: 'Voice notes', description: 'Allow richer, more personal voice-note sharing.' },
  { key: 'deeper_profile_details', label: 'Deeper profile details', description: 'Reveal your deeper profile information and story.' },
  { key: 'shared_memory_vault', label: 'Shared memory vault', description: 'Allow shared memories, gratitude notes, and relationship reflections.' },
  { key: 'ai_shared_recap_access', label: 'AI shared recap access', description: 'Allow assistive AI to create shared recaps from your relationship moments.' },
] as const;

export type HeartPathStage = typeof HEARTPATH_STAGES[number]['stage'];
export type HeartPathPermissionName = typeof HEARTPATH_PERMISSION_CATALOG[number]['key'];
export type HeartPathLifecycleState =
  | 'pending'
  | 'active'
  | 'exclusive'
  | 'paused'
  | 'cooldown'
  | 'archived';

export const SHARED_PERMISSION_NAMES: HeartPathPermissionName[] = [
  'shared_memory_vault',
  'ai_shared_recap_access',
];

export function getStageName(stage?: number | null) {
  return HEARTPATH_STAGES.find((item) => item.stage === stage)?.name ?? HEARTPATH_STAGES[0].name;
}

export function getStageDescription(stage?: number | null) {
  return HEARTPATH_STAGES.find((item) => item.stage === stage)?.description ?? HEARTPATH_STAGES[0].description;
}

export function normalizeStage(stage?: number | null) {
  if (!stage || stage < 1) return 1;
  if (stage > 6) return 6;
  return stage;
}

export function isOpenStageRequest(requestedStage?: number | null, status?: string | null) {
  return !!requestedStage && status === 'pending';
}

export function getNextStage(stage?: number | null) {
  const currentStage = normalizeStage(stage);
  return currentStage >= 6 ? null : currentStage + 1;
}

export function normalizePhotoLevels(photoLevels?: Json | null) {
  if (!photoLevels || typeof photoLevels !== 'object' || Array.isArray(photoLevels)) {
    return {} as Record<string, string>;
  }

  return Object.entries(photoLevels).reduce<Record<string, string>>((accumulator, [key, value]) => {
    if (typeof value === 'string' && value.trim()) {
      accumulator[key] = value;
    }
    return accumulator;
  }, {});
}

export function hasLivePermission(
  permissions: Array<{ permission: string; revoked_at: string | null }>,
  permissionName: HeartPathPermissionName
) {
  return permissions.some((permission) => permission.permission === permissionName && !permission.revoked_at);
}

export function buildVisibleProfile(
  profile: {
    name: string;
    college_name: string | null;
    branch: string | null;
    year: number | null;
    hobbies: string[] | null;
    about: string | null;
    photo_levels?: Json | null;
  },
  stage: number,
  permissions: Array<{ permission: string; revoked_at: string | null }>
) {
  const currentStage = normalizeStage(stage);
  const photoLevels = normalizePhotoLevels(profile.photo_levels);
  const canSeeDeepDetails = currentStage >= 4 || hasLivePermission(permissions, 'deeper_profile_details');
  const canSeeFullFace = currentStage >= 6 || hasLivePermission(permissions, 'full_face_photo');
  const canSeeGallery = currentStage >= 5 || hasLivePermission(permissions, 'private_photo_gallery');

  return {
    name: profile.name,
    college: profile.college_name || 'Unknown College',
    branch: canSeeDeepDetails ? profile.branch || 'Undisclosed branch' : 'Hidden until deeper trust',
    year: canSeeDeepDetails ? profile.year || 1 : null,
    hobbies: canSeeDeepDetails ? profile.hobbies || [] : [],
    about: canSeeDeepDetails
      ? profile.about || 'No profile story shared yet.'
      : 'HeartPath reveals deeper details only after mutual trust grows.',
    levelOnePhoto: photoLevels.level_1 || undefined,
    privateGallery: canSeeGallery
      ? [photoLevels.level_2, photoLevels.level_3, canSeeFullFace ? photoLevels.level_4 : undefined].filter(Boolean) as string[]
      : [],
    fullFacePhoto: canSeeFullFace ? photoLevels.level_4 || undefined : undefined,
  };
}

export function getCooldownLabel(isoDate?: string | null) {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  if (Number.isNaN(target.getTime())) return null;
  return target.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function startOfCurrentWeek() {
  const current = new Date();
  const day = current.getDay();
  const diff = current.getDate() - day + (day === 0 ? -6 : 1);
  const monday = new Date(current.setDate(diff));
  monday.setHours(0, 0, 0, 0);
  return monday.toISOString().slice(0, 10);
}
