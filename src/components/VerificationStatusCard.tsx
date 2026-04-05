import React from 'react';
import { BadgeCheck, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import type { VerificationBadges } from '@/lib/access-state';

interface VerificationStatusCardProps {
  profileCompleteness: number;
  verificationBadges: VerificationBadges;
  title?: string;
  description?: string;
}

const VerificationStatusCard: React.FC<VerificationStatusCardProps> = ({
  profileCompleteness,
  verificationBadges,
  title = 'Verification & Trust',
  description = 'HeartPath uses verified student access and profile completion to unlock the full experience.',
}) => {
  const badges = [
    {
      label: 'Email Verified',
      active: verificationBadges.email_verified,
    },
    {
      label: 'College Verified',
      active: verificationBadges.student_verified,
    },
  ];

  return (
    <Card className="romantic-card">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg font-semibold text-gray-800 dark:text-gray-200">
          <ShieldCheck className="h-5 w-5 text-romantic-red" />
          <span>{title}</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-medium text-gray-700 dark:text-gray-300">Profile completeness</span>
            <span className="font-semibold text-romantic-red">{profileCompleteness}%</span>
          </div>
          <Progress value={profileCompleteness} className="h-3 bg-romantic-light-pink dark:bg-romantic-red/15" />
        </div>

        <div className="flex flex-wrap gap-2">
          {badges.map((item) => (
            <Badge
              key={item.label}
              variant={item.active ? 'default' : 'outline'}
              className={item.active ? 'bg-romantic-red text-white hover:bg-romantic-red/90' : ''}
            >
              <BadgeCheck className="mr-1 h-3.5 w-3.5" />
              {item.label}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default VerificationStatusCard;
