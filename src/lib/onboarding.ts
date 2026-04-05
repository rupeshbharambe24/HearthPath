import { getStepIndex, ONBOARDING_STEPS, type OnboardingStep } from '@/lib/access-state';
import { normalizePhotoLevels } from '@/lib/heartpath';
import type { Tables } from '@/integrations/supabase/types';

type UserRow = Tables<'users'>;

export function getAllowedOnboardingSteps(user: UserRow | null | undefined): OnboardingStep[] {
  const steps: OnboardingStep[] = ['verify'];

  if (!user) return steps;

  const emailVerified = !!user.email_verified_at;
  const collegeVerified = !!user.student_verified_at;

  if (!emailVerified || !collegeVerified) {
    return steps;
  }

  steps.push('basics');

  const basicsComplete = Boolean(user.name && user.college_name && user.branch && user.year);
  if (!basicsComplete) return steps;

  steps.push('heartpath');

  const heartpathComplete = Boolean(
    user.about &&
      user.about.trim() &&
      user.hobbies &&
      user.hobbies.length > 0 &&
      user.relationship_intent &&
      user.preferred_chat_frequency &&
      user.communication_style &&
      user.value_tags &&
      user.value_tags.length > 0 &&
      user.lifestyle_preferences &&
      user.lifestyle_preferences.length > 0 &&
      user.heartpath_norms_acknowledged_at
  );
  if (!heartpathComplete) return steps;

  steps.push('boundaries');

  const boundariesComplete = Boolean(user.voice_notes_comfort && user.privacy_comfort && user.pace_style);
  if (!boundariesComplete) return steps;

  steps.push('photo_review');

  const photos = normalizePhotoLevels(user.photo_levels);
  if (!photos.level_1) return steps;

  steps.push('complete');
  return steps;
}

export function canOpenOnboardingStep(
  requestedStep: OnboardingStep,
  allowedSteps: OnboardingStep[],
  currentStep: OnboardingStep
) {
  if (allowedSteps.includes(requestedStep)) return true;
  return getStepIndex(requestedStep) <= getStepIndex(currentStep);
}

export function getNextOnboardingStep(step: OnboardingStep): OnboardingStep {
  const index = ONBOARDING_STEPS.indexOf(step);
  const nextStep = ONBOARDING_STEPS[Math.min(index + 1, ONBOARDING_STEPS.length - 1)];
  return nextStep;
}
