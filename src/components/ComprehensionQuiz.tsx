import { useState } from 'react';
import { QuizQuestion } from '@/lib/types';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw } from 'lucide-react';

interface ComprehensionQuizProps {
  questions: QuizQuestion[];
  bookTitle: string;
  levelColor: string;
  onComplete: (score: number, total: number) => void;
  onClose: () => void;
}

export default function ComprehensionQuiz({
  questions, bookTitle, levelColor, onComplete, onClose,
}: ComprehensionQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  const question = questions[currentIndex];
  const isCorrect = selected === question?.correctAnswer;

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    if (option === question.correctAnswer) {
      setScore((s) => s + 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      setFinished(true);
      onComplete(score + (isCorrect ? 0 : 0), questions.length);
    }
  };

  if (finished) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-foreground mb-2">Well done!</h2>
        <p className="text-muted-foreground mb-2">
          You scored <span className="font-bold text-foreground">{score}</span> out of{' '}
          <span className="font-bold text-foreground">{questions.length}</span>
        </p>
        <p className="text-sm text-muted-foreground mb-6">{bookTitle}</p>

        <div className="flex gap-3">
          <button
            onClick={() => {
              setCurrentIndex(0);
              setSelected(null);
              setShowResult(false);
              setScore(0);
              setFinished(false);
            }}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground font-semibold text-sm hover:bg-accent transition-colors"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={onClose}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl ${levelColor} text-white font-semibold text-sm`}
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="px-4 py-3 border-b bg-card flex items-center justify-between">
        <button onClick={onClose} className="text-sm font-semibold text-muted-foreground">
          Close
        </button>
        <span className="text-xs font-semibold text-muted-foreground">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="font-child text-xl font-bold text-foreground text-center mb-8 leading-relaxed">
          {question.questionText}
        </p>

        <div className="w-full max-w-sm space-y-3">
          {question.options.map((option) => {
            let optionStyle = 'bg-card border-2 border-border text-foreground';
            if (showResult && option === question.correctAnswer) {
              optionStyle = 'bg-green-50 border-2 border-green-400 text-green-700';
            } else if (showResult && option === selected && !isCorrect) {
              optionStyle = 'bg-orange-50 border-2 border-orange-300 text-orange-700';
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={showResult}
                className={`w-full p-4 rounded-2xl font-child text-lg font-semibold text-center transition-all ${optionStyle} ${
                  !showResult ? 'hover:border-primary active:scale-[0.98]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && option === question.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  )}
                  {showResult && option === selected && !isCorrect && option !== question.correctAnswer && (
                    <XCircle className="w-5 h-5 text-orange-400" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-6 animate-slide-up">
            <p className={`text-center font-semibold mb-4 ${isCorrect ? 'text-green-600' : 'text-orange-500'}`}>
              {isCorrect ? '🌟 Brilliant!' : '💪 Nearly! Have another go next time.'}
            </p>
            <button
              onClick={handleNext}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl ${levelColor} text-white font-semibold mx-auto`}
            >
              {currentIndex < questions.length - 1 ? 'Next' : 'See Results'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
