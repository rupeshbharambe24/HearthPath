
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Heart, Plus } from 'lucide-react';

interface MemoryEntry {
  id: string;
  type: 'milestone' | 'heart' | 'memory';
  title: string;
  description: string;
  date: string;
  level?: number;
  icon?: string;
}

interface MemoryTrailProps {
  memories: MemoryEntry[];
  relationshipLevel: number;
}

const MemoryTrail: React.FC<MemoryTrailProps> = ({ memories, relationshipLevel }) => {
  const [newMemory, setNewMemory] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const getMemoryIcon = (memory: MemoryEntry) => {
    if (memory.icon) return memory.icon;
    
    switch (memory.type) {
      case 'heart':
        return '🧡';
      case 'milestone':
        return '🎉';
      default:
        return '💬';
    }
  };

  const getMemoryCardColor = (type: string, index: number) => {
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

  const handleAddMemory = () => {
    if (newMemory.trim()) {
      console.log('Adding memory:', newMemory);
      setNewMemory('');
      setIsDialogOpen(false);
    }
  };

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
          
          <div className="space-y-6 max-h-96 overflow-y-auto">
            {memories.map((memory, index) => (
              <div key={memory.id} className="relative flex items-start space-x-4 animate-fade-in">
                {/* Timeline Icon */}
                <div className="relative z-10 flex-shrink-0">
                  <div className="w-12 h-12 bg-gradient-to-br from-romantic-red to-romantic-pink rounded-full flex items-center justify-center shadow-lg">
                    <span className="text-lg">{getMemoryIcon(memory)}</span>
                  </div>
                </div>
                
                {/* Memory Card */}
                <div className={`flex-1 p-4 rounded-2xl shadow-sm border border-white/50 dark:border-gray-700/50 ${getMemoryCardColor(memory.type, index)}`}>
                  <h4 className="font-semibold text-gray-800 dark:text-gray-200 text-sm mb-1">
                    {memory.title}
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                    {memory.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <p className="text-xs text-gray-500 dark:text-gray-500">
                      {memory.date}
                    </p>
                    {memory.level && (
                      <span className="text-xs px-2 py-1 bg-white/50 dark:bg-gray-800/50 rounded-full text-romantic-red font-medium">
                        Level {memory.level}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {relationshipLevel >= 4 && (
              <div className="text-center py-6">
                <div className="inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-romantic-red/10 to-romantic-pink/10 rounded-full border border-romantic-pink/20">
                  <span className="text-2xl">💕</span>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Your relationship is blossoming! More memories await...
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default MemoryTrail;
