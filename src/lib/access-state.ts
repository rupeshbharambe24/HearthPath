import type { Json, Tables } from '@/integrations/supabase/types';

export const ACCESS_STATES = ['verification_pending', 'onboarding_required', 'active', 'blocked'] as const;
export type AccessState = (typeof ACCESS_STATES)[number];

export const ONBOARDING_STEPS = ['verify', 'basics', 'heartpath', 'boundaries', 'photo_review', 'complete'] as const;
export type OnboardingStep = (typeof ONBOARDING_STEPS)[number];

export type VerificationBadgeKey =
  | 'email_verified'
  | 'student_verified'
  | 'photo_verified'
  | 'identity_verified';

export type VerificationBadges = Record<VerificationBadgeKey, boolean>;

export const DEFAULT_VERIFICATION_BADGES: VerificationBadges = {
  email_verified: false,
  student_verified: false,
  photo_verified: false,
  identity_verified: false,
};

export const ONBOARDING_STEP_LABELS: Record<OnboardingStep, string> = {
  verify: 'Verify college access',
  basics: 'Profile basics',
  heartpath: 'HeartPath preferences',
  boundaries: 'Boundaries and comfort',
  photo_review: 'Photo and review',
  complete: 'Complete',
};

export function normalizeVerificationBadges(value?: Json | null): VerificationBadges {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return { ...DEFAULT_VERIFICATION_BADGES };
  }

  return {
    email_verified: Boolean(value.email_verified),
    student_verified: Boolean(value.student_verified),
    photo_verified: Boolean(value.photo_verified),
    identity_verified: Boolean(value.identity_verified),
  };
}

export function normalizeAccessState(value?: string | null): AccessState {
  if (value && ACCESS_STATES.includes(value as AccessState)) {
    return value as AccessState;
  }

  return 'verification_pending';
}

export function normalizeOnboardingStep(value?: string | null): OnboardingStep {
  if (value && ONBOARDING_STEPS.includes(value as OnboardingStep)) {
    return value as OnboardingStep;
  }

  return 'verify';
}

export function canAccessProtectedArea(accessState?: string | null) {
  return normalizeAccessState(accessState) === 'active';
}

export function isOnboardingBlocked(accessState?: string | null) {
  return normalizeAccessState(accessState) === 'blocked';
}

export function getStepIndex(step: OnboardingStep) {
  return ONBOARDING_STEPS.indexOf(step);
}

export function clampProfileCompleteness(value?: number | null) {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.max(0, Math.min(100, Math.round(value)));
}

export function getVisibleOnboardingStep(user: Pick<Tables<'users'>, 'access_state' | 'onboarding_step'> | null | undefined) {
  const accessState = normalizeAccessState(user?.access_state);
  if (accessState === 'verification_pending' || accessState === 'blocked') {
    return 'verify' as const;
  }

  return normalizeOnboardingStep(user?.onboarding_step);
}
