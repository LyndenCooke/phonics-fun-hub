import { useState, useRef } from 'react';
import { QuizQuestion } from '@/lib/types';
import { CheckCircle2, XCircle, ArrowRight, RotateCcw, Star, Trophy } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

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
  const { user } = useAuth();
  const answersRef = useRef<{ question_id: string; selected_answer: string }[]>([]);

  const question = questions[currentIndex];
  const isCorrect = selected === question?.correctAnswer;

  const handleSelect = (option: string) => {
    if (showResult) return;
    setSelected(option);
    setShowResult(true);
    if (option === question.correctAnswer) {
      setScore((s) => s + 1);
    }
    answersRef.current.push({
      question_id: question.id,
      selected_answer: option,
    });
  };

  const saveQuizAttempt = async (finalScore: number) => {
    if (!user) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-quiz-attempt`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            book_id: questions[0]?.bookId,
            quiz_type: questions[0]?.quizType || 'comprehension',
            answers: answersRef.current,
          }),
        }
      );
      toast.success(
        `Quiz complete! ${finalScore}/${questions.length}`,
        { icon: <Trophy className="w-4 h-4" /> }
      );
    } catch {
      // Don't block the UI on save failure
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((i) => i + 1);
      setSelected(null);
      setShowResult(false);
    } else {
      const finalScore = score + (isCorrect ? 0 : 0);
      setFinished(true);
      saveQuizAttempt(finalScore);
      onComplete(finalScore, questions.length);
    }
  };

  if (finished) {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-8 text-center">
        <div className="w-20 h-20 rounded-2xl bg-tint-pink flex items-center justify-center mb-4">
          <Star className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-extrabold text-foreground mb-2">Well done!</h2>
        <p className="text-muted-foreground mb-2">
          You scored <span className="font-extrabold text-foreground">{score}</span> out of{' '}
          <span className="font-extrabold text-foreground">{questions.length}</span>
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
            className="flex items-center gap-2 px-5 py-3 rounded-xl bg-card border border-border text-foreground font-bold text-sm shadow-card active:scale-[0.97] transition-transform duration-200"
          >
            <RotateCcw className="w-4 h-4" /> Try Again
          </button>
          <button
            onClick={onClose}
            className="flex items-center gap-2 px-5 py-3 rounded-xl gradient-primary text-primary-foreground font-bold text-sm shadow-button active:scale-[0.97] transition-transform duration-200"
          >
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      <div className="px-4 py-3 border-b border-border bg-card shadow-card flex items-center justify-between">
        <button onClick={onClose} className="text-sm font-bold text-muted-foreground">
          Close
        </button>
        <span className="text-xs font-bold text-muted-foreground">
          {currentIndex + 1} / {questions.length}
        </span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <p className="font-child text-xl font-bold text-foreground text-center mb-8 leading-relaxed">
          {question.questionText}
        </p>

        <div className="w-full max-w-sm space-y-3">
          {question.options.map((option) => {
            let optionStyle = 'bg-card border border-border text-foreground shadow-card';
            if (showResult && option === question.correctAnswer) {
              optionStyle = 'bg-tint-green border-2 border-level-3 text-foreground shadow-card';
            } else if (showResult && option === selected && !isCorrect) {
              optionStyle = 'bg-tint-orange border-2 border-destructive text-foreground shadow-card';
            }

            return (
              <button
                key={option}
                onClick={() => handleSelect(option)}
                disabled={showResult}
                className={`w-full p-4 rounded-xl font-child text-lg font-semibold text-center transition-all duration-200 ${optionStyle} ${
                  !showResult ? 'hover:shadow-card-hover active:scale-[0.98]' : ''
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option}</span>
                  {showResult && option === question.correctAnswer && (
                    <CheckCircle2 className="w-5 h-5 text-level-3" />
                  )}
                  {showResult && option === selected && !isCorrect && option !== question.correctAnswer && (
                    <XCircle className="w-5 h-5 text-destructive" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-6 animate-slide-up">
            <p className={`text-center font-bold mb-4 ${isCorrect ? 'text-level-3' : 'text-destructive'}`}>
              {isCorrect ? 'Brilliant!' : 'Nearly! Have another go next time.'}
            </p>
            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-bold mx-auto shadow-button active:scale-[0.97] transition-transform duration-200"
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