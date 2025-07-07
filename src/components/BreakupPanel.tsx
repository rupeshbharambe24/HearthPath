
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Heart, Users } from 'lucide-react';
import CooldownTimer from '@/components/CooldownTimer';

const BreakupPanel: React.FC = () => {
  const [isInRelationship, setIsInRelationship] = useState(true);
  const [isInCooldown, setIsInCooldown] = useState(false);
  const [showBreakupDialog, setShowBreakupDialog] = useState(false);
  const [cooldownStart] = useState(new Date('2024-01-01T10:00:00'));

  // Mock partner data
  const partner = {
    name: 'Emma Rodriguez',
    college: 'Psychology',
    relationshipLevel: 6,
    daysTogther: 45
  };

  const handleBreakup = () => {
    setIsInRelationship(false);
    setIsInCooldown(true);
    setShowBreakupDialog(false);
  };

  if (isInCooldown) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-red-500" fill="currentColor" style={{ transform: 'scale(1, 0.8)' }} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            Healing Period 💔
          </h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Take this time to reflect and heal. You'll be able to match again soon.
          </p>
        </div>
        
        <CooldownTimer startTime={cooldownStart} />
        
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
          <p className="text-sm text-pink-800 dark:text-pink-200 text-center">
            Remember: Every ending is a new beginning. Use this time for self-care and growth. 🌱
          </p>
        </div>
      </div>
    );
  }

  if (!isInRelationship) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
          No Active Relationship
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          You're currently single and ready to explore new connections!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 border-pink-200 dark:border-pink-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {partner.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {partner.college} • Level {partner.relationshipLevel} • {partner.daysTogther} days together
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl mb-1">❤️</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">Couple Match</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          ⚠️ Breaking up will start a 7-day cooldown period before you can match with each other again.
        </p>
      </div>

      <Button
        variant="destructive"
        onClick={() => setShowBreakupDialog(true)}
        className="w-full"
      >
        End Relationship
      </Button>

      <Dialog open={showBreakupDialog} onOpenChange={setShowBreakupDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End Relationship?</DialogTitle>
            <DialogDescription>
              Are you sure you want to end your relationship with {partner.name}? This action cannot be undone, and you'll both enter a 7-day cooldown period.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowBreakupDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleBreakup}>
              End Relationship
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BreakupPanel;
