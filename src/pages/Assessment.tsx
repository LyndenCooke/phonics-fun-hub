import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { PhonemePlayer } from '@/components/PhonemePlayer';
import { useAssessmentItems } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { LEVELS } from '@/lib/types';
import { CheckCircle2, XCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useChildren } from '@/hooks/useBooks';

type Stage = 'welcome' | 'sounds' | 'words' | 'tricky' | 'results';

interface Answer {
  item_id: string;
  is_correct: boolean;
}

export default function Assessment() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [saving, setSaving] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: allItems, isLoading } = useAssessmentItems();
  const { data: children } = useChildren();
  const child = children?.[0];

  // Split items by round type
  const sounds = (allItems ?? []).filter(i => i.round_type === 'sound_recognition');
  const words = (allItems ?? []).filter(i => i.round_type === 'word_reading');
  const tricky = (allItems ?? []).filter(i => i.round_type === 'tricky_words');

  const currentItems = stage === 'sounds' ? sounds : stage === 'words' ? words : tricky;
  const currentItem = currentItems[currentIndex];

  // Calculate scores from answers
  const soundAnswers = answers.filter(a => sounds.some(s => s.id === a.item_id));
  const wordAnswers = answers.filter(a => words.some(w => w.id === a.item_id));
  const trickyAnswers = answers.filter(a => tricky.some(t => t.id === a.item_id));

  const handleMark = (correct: boolean) => {
    if (!currentItem) return;

    setAnswers(prev => [...prev, { item_id: currentItem.id, is_correct: correct }]);

    const newConsecutiveWrong = correct ? 0 : consecutiveWrong + 1;
    setConsecutiveWrong(newConsecutiveWrong);

    // Stop rule: 3 consecutive wrong for sounds/words (not tricky)
    const shouldStop = stage !== 'tricky' && newConsecutiveWrong >= 3;

    if (shouldStop || currentIndex >= currentItems.length - 1) {
      setCurrentIndex(0);
      setConsecutiveWrong(0);
      if (stage === 'sounds') setStage('words');
      else if (stage === 'words') setStage('tricky');
      else {
        setStage('results');
        saveResults();
      }
    } else {
      setCurrentIndex(i => i + 1);
    }
  };

  const saveResults = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/save-assessment-result`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            child_id: child?.id || null,
            answers,
          }),
        }
      );
    } catch {
      toast.error('Could not save results');
    } finally {
      setSaving(false);
    }
  };

  const getRecommendedLevel = () => {
    // Per-level scoring
    for (let level = 1; level <= 6; level++) {
      const levelSounds = soundAnswers.filter(a => {
        const item = sounds.find(s => s.id === a.item_id);
        return item && item.target_level === level;
      });
      const levelWords = wordAnswers.filter(a => {
        const item = words.find(w => w.id === a.item_id);
        return item && item.target_level === level;
      });

      const totalAtLevel = levelSounds.length + levelWords.length;
      if (totalAtLevel === 0) return level;

      const correctAtLevel = levelSounds.filter(a => a.is_correct).length + levelWords.filter(a => a.is_correct).length;
      const pct = correctAtLevel / totalAtLevel;

      if (pct < 0.7) return level;
    }
    return 6;
  };

  const reset = () => {
    setStage('welcome');
    setCurrentIndex(0);
    setAnswers([]);
    setConsecutiveWrong(0);
  };

  const levelBgs: Record<number, string> = {
    1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3', 4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
  };

  if (stage === 'welcome') {
    return (
      <Layout>
        <div className="px-4 pt-8 pb-4 max-w-md mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-foreground mb-3 tracking-tight">Phonics Assessment</h2>
          <p className="text-sm text-muted-foreground mb-8 leading-relaxed max-w-xs mx-auto">
            This short assessment takes 5–10 minutes and will recommend the right starting level for your child.
          </p>

          <div className="bg-tint-pink rounded-2xl p-5 mb-8 text-left">
            <p className="text-sm font-bold text-foreground mb-3">What to expect</p>
            <div className="space-y-3">
              {[
                'Sound recognition — identify letter sounds',
                'Word reading — read simple words aloud',
                'Tricky words — common sight words',
              ].map((text, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="w-6 h-6 rounded-full gradient-primary text-primary-foreground text-xs font-bold flex items-center justify-center shrink-0 mt-0.5 shadow-button">
                    {i + 1}
                  </span>
                  <p className="text-xs text-muted-foreground leading-relaxed">{text}</p>
                </div>
              ))}
            </div>
          </div>

          <p className="text-xs text-muted-foreground mb-8">
            Sit with your child. Show them each item and mark whether they got it right.
          </p>

          <button
            onClick={() => setStage('sounds')}
            disabled={isLoading}
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200 disabled:opacity-60"
          >
            {isLoading ? 'Loading...' : 'Start Assessment'}
          </button>
        </div>
      </Layout>
    );
  }

  if (stage === 'results') {
    const level = getRecommendedLevel();
    const levelInfo = LEVELS.find((l) => l.level === level)!;

    return (
      <Layout>
        <div className="px-4 pt-8 pb-4 max-w-md mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-foreground mb-2 tracking-tight">Assessment Complete</h2>

          <div className="bg-card rounded-2xl p-5 my-6 space-y-3 text-left shadow-card">
            {[
              { label: 'Sounds', correct: soundAnswers.filter(a => a.is_correct).length, total: soundAnswers.length },
              { label: 'Words', correct: wordAnswers.filter(a => a.is_correct).length, total: wordAnswers.length },
              { label: 'Tricky Words', correct: trickyAnswers.filter(a => a.is_correct).length, total: trickyAnswers.length },
            ].map(({ label, correct, total }) => (
              <div key={label} className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold">{correct}/{total}</span>
              </div>
            ))}
          </div>

          <div className={`${levelBgs[level]} text-white rounded-2xl p-6 mb-6 shadow-card`}>
            <p className="text-sm opacity-80 mb-1">Recommended starting level</p>
            <p className="text-4xl font-extrabold mb-1">Level {level}</p>
            <p className="text-sm font-bold">{levelInfo.name}</p>
            <p className="text-xs opacity-80 mt-1">{levelInfo.ageRange}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-3 rounded-xl bg-card border border-border font-bold text-sm shadow-card active:scale-[0.97] transition-transform duration-200">
              Retake
            </button>
            <button
              onClick={() => navigate('/', { state: { filterLevel: level } })}
              className={`flex-1 py-3 rounded-xl ${levelBgs[level]} text-white font-bold text-sm shadow-sm active:scale-[0.97] transition-transform duration-200`}
            >
              Browse Level {level}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Assessment round
  const stageLabel = stage === 'sounds' ? 'Sound Recognition' : stage === 'words' ? 'Word Reading' : 'Tricky Words';

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
        <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wide">
          {stageLabel} · {currentIndex + 1}/{currentItems.length}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted mb-8 overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / currentItems.length) * 100}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {stage === 'sounds'
            ? 'Ask your child: "What sound does this make?" (Tap speaker to hear)'
            : 'Ask your child to read this word aloud.'}
        </p>

        <div className="bg-card border border-border rounded-2xl p-12 mb-8 shadow-card">
          <p className="font-child text-5xl font-bold text-foreground">
            {currentItem?.item_text ?? ''}
          </p>
          {stage === 'sounds' && currentItem?.item_text && (
            <div className="mt-6 flex justify-center">
              <PhonemePlayer 
                grapheme={currentItem.item_text} 
                size="lg"
              />
            </div>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">Did they get it right?</p>

        <div className="flex gap-3">
          <button
            onClick={() => handleMark(false)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-tint-orange border border-border text-foreground font-bold text-base active:scale-95 transition-transform duration-200"
          >
            <XCircle className="w-5 h-5 text-destructive" /> Not yet
          </button>
          <button
            onClick={() => handleMark(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-xl bg-tint-green border border-border text-foreground font-bold text-base active:scale-95 transition-transform duration-200"
          >
            <CheckCircle2 className="w-5 h-5 text-level-3" /> Correct
          </button>
        </div>
      </div>
    </Layout>
  );
}
