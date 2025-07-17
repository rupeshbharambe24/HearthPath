
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Plus } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface MemoryEntry {
  id: string;
  memo_text: string;
  level_at: number;
  created_at: string;
  created_by: string;
}

interface MemoryTrailProps {
  partnerId: string;
  relationshipLevel: number;
}

const MemoryTrail: React.FC<MemoryTrailProps> = ({ partnerId, relationshipLevel }) => {
  const [memories, setMemories] = useState<MemoryEntry[]>([]);
  const [newMemory, setNewMemory] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [relationshipId, setRelationshipId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!user?.id || !partnerId) return;

    const fetchMemories = async () => {
      try {
        setLoading(true);

        // First, find the relationship ID
        const { data: relationship, error: relError } = await supabase
          .from('relationships')
          .select('id')
          .or(`and(user_a.eq.${user.id},user_b.eq.${partnerId}),and(user_a.eq.${partnerId},user_b.eq.${user.id})`)
          .single();

        if (relError) {
          console.error('Error finding relationship:', relError);
          return;
        }

        if (!relationship) {
          console.log('No relationship found between users');
          return;
        }

        setRelationshipId(relationship.id);

        // Fetch memories for this relationship
        const { data: memoriesData, error: memoriesError } = await supabase
          .from('memories')
          .select('*')
          .eq('relationship_id', relationship.id)
          .order('created_at', { ascending: false });

        if (memoriesError) {
          console.error('Error fetching memories:', memoriesError);
        } else {
          setMemories(memoriesData || []);
        }

      } catch (error) {
        console.error('Error in fetchMemories:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMemories();

    // Set up real-time subscription for memories
    const channel = supabase
      .channel('memories')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'memories'
      }, (payload) => {
        console.log('Memory update:', payload);
        fetchMemories(); // Refetch memories on any change
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id, partnerId]);

  const handleAddMemory = async () => {
    if (!newMemory.trim() || !user?.id || !relationshipId) return;

    try {
      const { error } = await supabase
        .from('memories')
        .insert([{
          memo_text: newMemory.trim(),
          relationship_id: relationshipId,
          created_by: user.id,
          level_at: relationshipLevel
        }]);

      if (error) {
        console.error('Error adding memory:', error);
        toast({
          title: "Failed to save memory",
          description: "Please try again.",
          variant: "destructive",
        });
        return;
      }

      setNewMemory('');
      setIsDialogOpen(false);
      
      toast({
        title: "Memory saved! 💕",
        description: "Your special moment has been added to your memory trail.",
      });

    } catch (error) {
      console.error('Error in handleAddMemory:', error);
    }
  };

  const getMemoryIcon = (index: number) => {
    const icons = ['💬', '🧡', '💑', '🎉', '💕', '🌟'];
    return icons[index % icons.length];
  };

  const getMemoryCardColor = (index: number) => {
    const lightColors = [
      'bg-gradient-to-br from-pink-50 to-rose-100',
      'bg-gradient-to-br from-rose-50 to-red-100',
      'bg-gradient-to-br from-red-50 to-pink-100',
      'bg-gradient-to-br from-romantic-light-pink to-pink-100'
    ];
    
    const darkColors = [
      'bg-gradient-to-br from-pink-950/30 to-rose-900/30',
      'bg-gradient-to-br from-rose-950/30 to-red-900/30',
      'bg-gradient-to-br from-red-950/30 to-pink-900/30',
      'bg-gradient-to-br from-romantic-red/20 to-romantic-pink/20'
    ];

    const lightColor = lightColors[index % lightColors.length];
    const darkColor = darkColors[index % darkColors.length];
    
    return `${lightColor} dark:${darkColor}`;
  };

  const formatDate = (dateString: string) => {
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
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse flex items-start space-x-4">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
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
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5 text-romantic-red" />
            <span>Memory Trail</span>
          </CardTitle>
          
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="romantic-btn">
                <Plus className="w-4 h-4 mr-1" />
                Write Memory
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-2">
                  <Heart className="w-5 h-5 text-romantic-red" />
                  <span>Add a Special Memory</span>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <Textarea
                  placeholder="Write about a special moment you want to remember..."
                  value={newMemory}
                  onChange={(e) => setNewMemory(e.target.value)}
                  className="min-h-24"
                />
                <div className="flex space-x-2">
                  <Button 
                    onClick={handleAddMemory}
                    className="romantic-btn flex-1"
                    disabled={!newMemory.trim()}
                  >
                    Save Memory
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={() => setIsDialogOpen(false)}
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
          {/* Timeline Line */}
          <div className="absolute left-6 top-0 bottom-0 w-0.5 bg-gradient-to-b from-romantic-red via-romantic-pink to-romantic-rose opacity-30"></div>
          
          {memories.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 mx-auto mb-4 bg-romantic-light-pink dark:bg-romantic-red/20 rounded-full flex items-center justify-center">
                <span className="text-2xl">💕</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No memories yet. Create your first special moment!
              </p>
            </div>
          ) : (
            <div className="space-y-6 max-h-96 overflow-y-auto">
              {memories.map((memory, index) => (
                <div key={memory.id} className="relative flex items-start space-x-4 animate-fade-in">
                  {/* Timeline Icon */}
                  <div className="relative z-10 flex-shrink-0">
                    <div className="w-12 h-12 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center shadow-lg">
                      <span className="text-lg">{getMemoryIcon(index)}</span>
                    </div>
                  </div>
                  
                  {/* Memory Card */}
                  <div className={`flex-1 p-4 rounded-2xl shadow-sm border border-white/50 dark:border-gray-700/50 ${getMemoryCardColor(index)}`}>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                      {memory.memo_text}
                    </p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        {formatDate(memory.created_at)}
                      </p>
                      {memory.level_at && (
                        <span className="text-xs px-2 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full text-romantic-red font-medium">
                          Level {memory.level_at}
                        </span>
                      )}
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
