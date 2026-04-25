import React, { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Heart, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import type { Tables } from '@/integrations/supabase/types';
import { getStageName } from '@/lib/heartpath';
import { memorySchema } from '@/lib/schemas';

type MemoryEntry = Tables<'memories'>;

interface MemoryTrailProps {
  partnerId?: string;
  relationshipId?: string | null;
  relationshipLevel: number;
  canCreateSharedMemories?: boolean;
  onCreateMemory?: (input: {
    memo_text: string;
    entry_type: string;
    visibility: 'private' | 'shared';
    mood?: string;
    tags?: string[];
    reflection_follow_up?: string;
  }) => Promise<{ success: boolean; error?: string }>;
}

const MEMORY_TYPES = [
  { value: 'good_moment', label: 'Good moment' },
  { value: 'milestone', label: 'Milestone' },
  { value: 'hard_moment', label: 'Hard moment' },
  { value: 'repair', label: 'Repair' },
  { value: 'gratitude', label: 'Gratitude' },
  { value: 'promise', label: 'Promise' },
  { value: 'date', label: 'Date' },
  { value: 'reflection', label: 'Reflection' },
] as const;

const MemoryTrail: React.FC<MemoryTrailProps> = ({
  partnerId,
  relationshipId,
  relationshipLevel,
  canCreateSharedMemories = false,
  onCreateMemory,
}) => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [memoryType, setMemoryType] = useState<string>('good_moment');
  const [memoryVisibility, setMemoryVisibility] = useState<'private' | 'shared'>('shared');
  const [memoryMood, setMemoryMood] = useState('');
  const [memoryTags, setMemoryTags] = useState('');
  const [reflectionFollowUp, setReflectionFollowUp] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [resolvedRelationshipId, setResolvedRelationshipId] = useState<string | null>(relationshipId || null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    setResolvedRelationshipId(relationshipId || null);
  }, [relationshipId]);

  useEffect(() => {
    if (!user?.id || (!partnerId && !relationshipId)) return;

    const fetchMemories = async (showLoader = true) => {
      try {
        if (showLoader) setLoading(true);

        let activeRelationshipId = relationshipId || null;

        if (!activeRelationshipId && partnerId) {
          const { data: relationshipRow, error: relationshipError } = await supabase
            .from('relationships')
            .select('id')
            .or(`and(user_a.eq.${user.id},user_b.eq.${partnerId}),and(user_a.eq.${partnerId},user_b.eq.${user.id})`)
            .maybeSingle();

          if (relationshipError) {
            throw relationshipError;
          }

          activeRelationshipId = relationshipRow?.id || null;
        }

        setResolvedRelationshipId(activeRelationshipId);

        if (!activeRelationshipId) {
          setMemories([]);
          return;
        }

        const { data: memoryRows, error: memoryError } = await supabase
          .from('memories')
          .select('*')
          .eq('relationship_id', activeRelationshipId)
          .is('archived_at', null)
          .order('created_at', { ascending: false });

        if (memoryError) {
          throw memoryError;
        }

        setMemories(memoryRows || []);
      } catch (error) {
        console.error('Error loading memories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories(true);

    // Only subscribe with a row filter when we already know the relationship id.
    // If we only have a partnerId, the relationship lookup happens inside fetchMemories;
    // skip the realtime subscription rather than receive every memories row across the table.
    if (!relationshipId) {
      return;
    }

    const channel = supabase
      .channel(`memories-${relationshipId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'memories',
          filter: `relationship_id=eq.${relationshipId}`,
        },
        () => void fetchMemories(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, partnerId, relationshipId]);

  const resetComposer = () => {
    setNewMemory('');
    setMemoryType('good_moment');
    setMemoryVisibility(canCreateSharedMemories ? 'shared' : 'private');
    setMemoryMood('');
    setMemoryTags('');
    setReflectionFollowUp('');
  };

  const handleAddMemory = async () => {
    if (!newMemory.trim() || !user?.id) return;

    if (memoryVisibility === 'shared' && !canCreateSharedMemories) {
      toast({
        title: 'Shared vault locked',
        description: 'Both partners need to enable the shared memory vault before shared entries can be added.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const payload = {
        memo_text: newMemory.trim(),
        entry_type: memoryType,
        visibility: memoryVisibility,
        mood: memoryMood.trim() || undefined,
        tags: memoryTags
          .split(',')
          .map((tag) => tag.trim())
          .filter(Boolean),
        reflection_follow_up: reflectionFollowUp.trim() || undefined,
      };

      const parsed = memorySchema.safeParse({
        memo_text: payload.memo_text,
        entry_type: payload.entry_type,
        visibility: payload.visibility,
      });
      if (!parsed.success) {
        toast({
          title: 'Cannot save memory',
          description: parsed.error.issues[0]?.message || 'Invalid memory.',
          variant: 'destructive',
        });
        return;
      }

      const result = onCreateMemory
        ? await onCreateMemory(payload)
        : await supabase.from('memories').insert({
            relationship_id: resolvedRelationshipId,
            created_by: user.id,
            level_at: relationshipLevel,
            ...payload,
          }).then(({ error }) => ({ success: !error, error: error?.message }));

      if (!result.success) {
        toast({
          title: 'Failed to save memory',
          description: result.error || 'Please try again.',
          variant: 'destructive',
        });
        return;
      }

      resetComposer();
      setIsDialogOpen(false);
      toast({
        title: 'Memory saved',
        description: 'Your HeartPath moment has been added to the trail.',
      });
    } catch (error) {
      console.error('Error saving memory:', error);
    }
  };

  const getMemoryCardColor = (entryType: string | null) => {
    switch (entryType) {
      case 'milestone':
        return 'bg-gradient-to-br from-amber-50 to-rose-100 dark:from-amber-950/20 dark:to-rose-900/20';
      case 'hard_moment':
        return 'bg-gradient-to-br from-slate-50 to-red-100 dark:from-slate-900 dark:to-red-950/30';
      case 'repair':
        return 'bg-gradient-to-br from-emerald-50 to-teal-100 dark:from-emerald-950/20 dark:to-teal-950/20';
      case 'gratitude':
        return 'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/20 dark:to-rose-950/20';
      default:
        return 'bg-gradient-to-br from-pink-50 to-rose-100 dark:from-pink-950/20 dark:to-rose-950/20';
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffInDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;

    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  if (loading) {
    return (
      <Card className="romantic-card h-full">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-romantic-red" />
            <span>Memory Trail</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((item) => (
              <div key={item} className="animate-pulse flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="romantic-card h-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-romantic-red" />
              <span>Memory Trail</span>
            </CardTitle>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Save good moments, hard moments, repairs, and promises from Stage {relationshipLevel}:{' '}
              {getStageName(relationshipLevel)}
            </p>
          </div>

          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button
                size="sm"
                className="romantic-btn"
                onClick={() => setMemoryVisibility(canCreateSharedMemories ? 'shared' : 'private')}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-lg">
              <DialogHeader>
                <DialogTitle>Add a HeartPath memory</DialogTitle>
              </DialogHeader>

              <div className="space-y-4 pt-2">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <p className="text-sm font-medium mb-2">Memory type</p>
                    <Select value={memoryType} onValueChange={setMemoryType}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a type" />
                      </SelectTrigger>
                      <SelectContent>
                        {MEMORY_TYPES.map((item) => (
                          <SelectItem key={item.value} value={item.value}>
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <p className="text-sm font-medium mb-2">Visibility</p>
                    <Select value={memoryVisibility} onValueChange={(value) => setMemoryVisibility(value as 'private' | 'shared')}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose visibility" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private reflection</SelectItem>
                        <SelectItem value="shared" disabled={!canCreateSharedMemories}>
                          Shared memory vault
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Textarea
                  placeholder="Write the moment you want to remember..."
                  value={newMemory}
                  onChange={(event) => setNewMemory(event.target.value)}
                  className="min-h-28"
                />

                <div className="grid gap-4 md:grid-cols-2">
                  <Input
                    placeholder="Mood (calm, excited, grateful)"
                    value={memoryMood}
                    onChange={(event) => setMemoryMood(event.target.value)}
                  />
                  <Input
                    placeholder="Tags (comma separated)"
                    value={memoryTags}
                    onChange={(event) => setMemoryTags(event.target.value)}
                  />
                </div>

                <Textarea
                  placeholder="Optional follow-up: what did this moment teach you?"
                  value={reflectionFollowUp}
                  onChange={(event) => setReflectionFollowUp(event.target.value)}
                  className="min-h-20"
                />

                <div className="flex gap-2">
                  <Button onClick={handleAddMemory} className="romantic-btn flex-1" disabled={!newMemory.trim()}>
                    Save Memory
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      resetComposer();
                      setIsDialogOpen(false);
                    }}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent className="pt-0">
        <div className="relative">
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-romantic-red via-romantic-pink to-romantic-rose opacity-30" />

          {memories.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💗</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No moments saved yet. Start capturing your HeartPath as it unfolds.
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {memories.map((memory, index) => (
                <div key={memory.id} className="relative flex items-start space-x-4 animate-fade-in">
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center shadow-lg text-white font-semibold">
                      {index + 1}
                    </div>
                  </div>

                  <div
                    className={`flex-1 p-4 rounded-2xl shadow-sm border border-white/50 dark:border-gray-700/50 ${getMemoryCardColor(memory.entry_type)}`}
                  >
                    <div className="flex flex-wrap gap-2 mb-3">
                      <Badge variant="secondary">{memory.entry_type?.replaceAll('_', ' ') || 'memory'}</Badge>
                      <Badge variant={memory.visibility === 'shared' ? 'default' : 'outline'}>
                        {memory.visibility === 'shared' ? 'Shared vault' : 'Private'}
                      </Badge>
                      {memory.mood ? <Badge variant="outline">{memory.mood}</Badge> : null}
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-200 mb-2">{memory.memo_text}</p>

                    {memory.reflection_follow_up ? (
                      <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
                        <span className="font-medium">Follow-up:</span> {memory.reflection_follow_up}
                      </p>
                    ) : null}

                    {memory.tags?.length ? (
                      <div className="flex flex-wrap gap-2 mb-3">
                        {memory.tags.map((tag) => (
                          <span
                            key={tag}
                            className="px-2 py-1 bg-white/60 dark:bg-gray-800/70 rounded-full text-xs text-gray-600 dark:text-gray-300"
                          >
                            #{tag}
                          </span>
                        ))}
                      </div>
                    ) : null}

                    <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                      <span>{formatDate(memory.created_at)}</span>
                      <span>Stage {memory.level_at || relationshipLevel}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default MemoryTrail;
