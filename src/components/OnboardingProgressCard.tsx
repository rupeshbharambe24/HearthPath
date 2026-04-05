import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ONBOARDING_STEPS, ONBOARDING_STEP_LABELS, type OnboardingStep } from '@/lib/access-state';

interface OnboardingProgressCardProps {
  currentStep: OnboardingStep;
  profileCompleteness: number;
}

const visibleSteps = ONBOARDING_STEPS.filter((step) => step !== 'complete');

const OnboardingProgressCard: React.FC<OnboardingProgressCardProps> = ({ currentStep, profileCompleteness }) => {
  const safeStep = currentStep === 'complete' ? 'photo_review' : currentStep;
  const currentIndex = visibleSteps.indexOf(safeStep);
  const stepProgress = ((currentIndex + 1) / visibleSteps.length) * 100;

  return (
    <Card className="border-romantic-pink/30 bg-white/90 shadow-sm dark:bg-romantic-dark-card">
      <CardContent className="space-y-4 p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-white">Onboarding progress</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">{ONBOARDING_STEP_LABELS[safeStep]}</p>
          </div>
          <div className="text-right">
            <p className="text-sm font-semibold text-romantic-red">{profileCompleteness}% profile</p>
          </div>
        </div>
        <Progress value={stepProgress} className="h-2.5 bg-romantic-light-pink dark:bg-romantic-red/15" />
      </CardContent>
    </Card>
  );
};

export default OnboardingProgressCard;
