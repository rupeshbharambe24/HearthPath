import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Heart, PauseCircle, PlayCircle, Users } from 'lucide-react';
import CooldownTimer from '@/components/CooldownTimer';
import { toast } from 'sonner';
import { getStageName } from '@/lib/heartpath';
import { useRelationshipSpaceData } from '@/hooks/useRelationshipSpaceData';

const BreakupPanel: React.FC = () => {
  const [showArchiveDialog, setShowArchiveDialog] = useState(false);
  const { loading, primaryRelationship, partner, currentStage, isPaused, setPausedState, archiveRelationship } =
    useRelationshipSpaceData();

  const handlePauseToggle = async () => {
    const result = await setPausedState(!isPaused);
    if (result.success) {
      toast.success(isPaused ? 'HeartPath resumed.' : 'HeartPath paused. Stage requests are now on hold.');
    } else {
      toast.error(result.error);
    }
  };

  const handleArchive = async () => {
    const result = await archiveRelationship();
    if (result.success) {
      toast.success('Relationship archived. A seven-day cooldown has started.');
      setShowArchiveDialog(false);
    } else {
      toast.error(result.error);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romantic-red mx-auto" />
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading relationship status...</p>
      </div>
    );
  }

  if (!primaryRelationship) {
    return (
      <div className="text-center py-8">
        <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No active HeartPath</h3>
        <p className="text-gray-600 dark:text-gray-400">
          When you accept a request, the relationship management controls will appear here.
        </p>
      </div>
    );
  }

  if (primaryRelationship.lifecycle_state === 'cooldown' && primaryRelationship.cooldown_until) {
    return (
      <div className="space-y-4">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto mb-4 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
            <Heart className="w-8 h-8 text-red-500" fill="currentColor" style={{ transform: 'scale(1, 0.8)' }} />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Healing period</h3>
          <p className="text-gray-600 dark:text-gray-400 mb-4">
            Your HeartPath is archived. Discovery will reopen after the cooldown finishes.
          </p>
        </div>

        <CooldownTimer startTime={new Date(primaryRelationship.cooldown_until)} />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-gradient-to-r from-pink-50 to-red-50 dark:from-pink-900/20 dark:to-red-900/20 border-pink-200 dark:border-pink-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center space-x-4">
              <div className="w-12 h-12 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-white" fill="currentColor" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{partner?.name || 'Your partner'}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {partner?.college_name || 'Unknown college'} | Stage {currentStage}: {getStageName(currentStage)}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Lifecycle: {primaryRelationship.lifecycle_state || 'pending'}
                </p>
              </div>
            </div>

            <div className="text-right">
              <div className="text-sm font-semibold text-romantic-red">HeartPath</div>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {isPaused ? 'Paused' : primaryRelationship.lifecycle_state === 'exclusive' ? 'Exclusive' : 'Active'}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
        <p className="text-sm text-yellow-800 dark:text-yellow-200">
          Pausing a HeartPath freezes new stage requests. Archiving ends the current path and starts a seven-day
          cooldown before discovery can reopen.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <Button variant="outline" onClick={handlePauseToggle} className="flex items-center gap-2">
          {isPaused ? <PlayCircle className="w-4 h-4" /> : <PauseCircle className="w-4 h-4" />}
          <span>{isPaused ? 'Resume HeartPath' : 'Pause HeartPath'}</span>
        </Button>

        <Button variant="destructive" onClick={() => setShowArchiveDialog(true)}>
          Archive Relationship
        </Button>
      </div>

      <Dialog open={showArchiveDialog} onOpenChange={setShowArchiveDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Archive this HeartPath?</DialogTitle>
            <DialogDescription>
              This will end the current path with {partner?.name || 'your partner'} and start a seven-day cooldown.
              Shared permissions will be revoked immediately.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowArchiveDialog(false)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleArchive}>
              Archive HeartPath
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BreakupPanel;
