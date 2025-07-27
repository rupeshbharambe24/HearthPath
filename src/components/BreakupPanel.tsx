
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Heart, Users } from 'lucide-react';
import CooldownTimer from '@/components/CooldownTimer';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const BreakupPanel: React.FC = () => {
  const [relationship, setRelationship] = useState<any>(null);
  const [showBreakupDialog, setShowBreakupDialog] = useState(false);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchCurrentRelationship();
  }, [user]);

  const fetchCurrentRelationship = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('relationships')
        .select(`
          id,
          user_a,
          user_b,
          current_level,
          status,
          cooldown_until,
          updated_at,
          partner:users!relationships_user_b_fkey (
            id,
            name,
            college_name,
            branch
          )
        `)
        .or(`user_a.eq.${user.id},user_b.eq.${user.id}`)
        .eq('status', 'active')
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        // Get the partner info based on who is the current user
        const partnerId = data.user_a === user.id ? data.user_b : data.user_a;
        const { data: partnerData } = await supabase
          .from('users')
          .select('id, name, college_name, branch')
          .eq('id', partnerId)
          .single();

        setRelationship({
          ...data,
          partner: partnerData,
          daysTogther: Math.floor((new Date().getTime() - new Date(data.updated_at).getTime()) / (1000 * 3600 * 24))
        });
      }
    } catch (error) {
      console.error('Error fetching relationship:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleBreakup = async () => {
    if (!relationship) return;

    try {
      const { error } = await supabase
        .from('relationships')
        .update({
          status: 'ended',
          cooldown_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
        })
        .eq('id', relationship.id);

      if (error) throw error;

      toast.success('Relationship ended. You both are in a 7-day cooldown period.');
      setRelationship(null);
      setShowBreakupDialog(false);
    } catch (error) {
      console.error('Error ending relationship:', error);
      toast.error('Failed to end relationship');
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-romantic-red mx-auto"></div>
        <p className="text-gray-600 dark:text-gray-400 mt-4">Loading relationship status...</p>
      </div>
    );
  }

  if (relationship?.cooldown_until && new Date(relationship.cooldown_until) > new Date()) {
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
        
        <CooldownTimer startTime={new Date(relationship.cooldown_until)} />
        
        <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
          <p className="text-sm text-pink-800 dark:text-pink-200 text-center">
            Remember: Every ending is a new beginning. Use this time for self-care and growth. 🌱
          </p>
        </div>
      </div>
    );
  }

  if (!relationship) {
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
                  {relationship.partner?.name}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {relationship.partner?.college_name} • Level {relationship.current_level} • {relationship.daysTogther} days together
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
              Are you sure you want to end your relationship with {relationship?.partner?.name}? This action cannot be undone, and you'll both enter a 7-day cooldown period.
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
