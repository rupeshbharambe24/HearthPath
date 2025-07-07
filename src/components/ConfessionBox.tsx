
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Mail, Heart, Send } from 'lucide-react';

const ConfessionBox = () => {
  const [recipient, setRecipient] = useState('');
  const [confession, setConfession] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipient.trim() || !confession.trim()) return;
    
    setIsSubmitted(true);
    console.log('Confession sent:', { recipient, confession });
  };

  const resetForm = () => {
    setRecipient('');
    setConfession('');
    setIsSubmitted(false);
  };

  return (
    <Card className="romantic-card max-w-lg mx-auto relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-romantic-red/5 to-romantic-pink/5 pointer-events-none" />
      
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-romantic-red">
          <Mail className="w-5 h-5" />
          <span>Secret Confession</span>
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {!isSubmitted ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                To someone at your college
              </label>
              <input
                type="text"
                value={recipient}
                onChange={(e) => setRecipient(e.target.value)}
                placeholder="Type their name..."
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-romantic-red focus:border-transparent dark:bg-romantic-dark-card dark:text-white"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Your secret message
              </label>
              <textarea
                value={confession}
                onChange={(e) => setConfession(e.target.value)}
                placeholder="Share your feelings anonymously..."
                rows={4}
                className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-romantic-red focus:border-transparent dark:bg-romantic-dark-card dark:text-white resize-none"
              />
            </div>
            
            <div className="bg-romantic-light-pink dark:bg-romantic-dark-card p-3 rounded-lg">
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
                💕 Your confession will be sent anonymously
              </p>
            </div>
            
            <Button 
              type="submit"
              className="w-full romantic-btn flex items-center justify-center space-x-2"
              disabled={!recipient.trim() || !confession.trim()}
            >
              <Send className="w-4 h-4" />
              <span>Send Secret Confession</span>
            </Button>
          </form>
        ) : (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 bg-romantic-light-pink dark:bg-romantic-dark-card rounded-full flex items-center justify-center mx-auto">
              <Heart className="w-8 h-8 text-romantic-red animate-pulse" />
            </div>
            
            <h3 className="text-xl font-bold text-romantic-red">
              Confession Sent! 💌
            </h3>
            
            <p className="text-gray-600 dark:text-gray-400">
              Your secret message has been delivered anonymously. 
              If there's a mutual connection, you'll both be notified!
            </p>
            
            <div className="bg-gradient-to-r from-romantic-red/10 to-romantic-pink/10 p-4 rounded-lg">
              <p className="text-sm text-romantic-red font-medium">
                ✨ "Sometimes the heart sees what the eyes cannot"
              </p>
            </div>
            
            <Button onClick={resetForm} variant="outline" className="border-romantic-red text-romantic-red hover:bg-romantic-red hover:text-white">
              Send Another
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ConfessionBox;
