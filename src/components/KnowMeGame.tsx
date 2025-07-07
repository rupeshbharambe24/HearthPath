
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Gamepad2, Heart, Sparkles } from 'lucide-react';

interface GameQuestion {
  question: string;
  options: string[];
  correctAnswer: number;
}

const KnowMeGame = () => {
  const [currentQuestion] = useState<GameQuestion>({
    question: "What's my favorite color?",
    options: ["Blue", "Red", "Green", "Purple"],
    correctAnswer: 1
  });

  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleSubmit = () => {
    if (selectedAnswer === null) return;
    
    const correct = selectedAnswer === currentQuestion.correctAnswer;
    setIsCorrect(correct);
    setShowResult(true);
  };

  const resetGame = () => {
    setSelectedAnswer(null);
    setShowResult(false);
    setIsCorrect(false);
  };

  return (
    <Card className="romantic-card max-w-md mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2 text-romantic-red">
          <Gamepad2 className="w-5 h-5" />
          <span>Know Me Better</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {!showResult ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              {currentQuestion.question}
            </h3>
            
            <div className="space-y-2">
              {currentQuestion.options.map((option, index) => (
                <label key={index} className="flex items-center space-x-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 hover:bg-romantic-light-pink dark:hover:bg-romantic-dark-card cursor-pointer">
                  <input
                    type="radio"
                    name="answer"
                    value={index}
                    checked={selectedAnswer === index}
                    onChange={(e) => setSelectedAnswer(Number(e.target.value))}
                    className="text-romantic-red focus:ring-romantic-red"
                  />
                  <span className="text-gray-900 dark:text-white">{option}</span>
                </label>
              ))}
            </div>
            
            <Button
              onClick={handleSubmit}
              disabled={selectedAnswer === null}
              className="w-full romantic-btn"
            >
              Submit Answer
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            {isCorrect ? (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <Heart className="w-8 h-8 text-green-600 dark:text-green-400" />
                  </div>
                </div>
                <h3 className="text-xl font-bold text-green-600 dark:text-green-400">
                  Correct! 🎉
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  You've unlocked a hidden memory!
                </p>
                <div className="flex items-center justify-center space-x-1 text-romantic-red">
                  <Sparkles className="w-4 h-4" />
                  <span className="text-sm">+1 Relationship Point</span>
                  <Sparkles className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto">
                  <span className="text-2xl">😅</span>
                </div>
                <h3 className="text-xl font-bold text-gray-600 dark:text-gray-400">
                  Not quite!
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Try again next time to unlock something special.
                </p>
              </div>
            )}
            
            <Button onClick={resetGame} className="romantic-btn">
              Play Again
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default KnowMeGame;
