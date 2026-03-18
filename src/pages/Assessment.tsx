import { useState } from 'react';
import Layout from '@/components/Layout';
import { ASSESSMENT_SOUNDS, ASSESSMENT_WORDS, ASSESSMENT_TRICKY_WORDS } from '@/lib/bookData';
import { LEVELS } from '@/lib/types';
import { CheckCircle2, XCircle, ArrowRight } from 'lucide-react';

type Stage = 'welcome' | 'sounds' | 'words' | 'tricky' | 'results';

export default function Assessment() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [soundScores, setSoundScores] = useState<boolean[]>([]);
  const [wordScores, setWordScores] = useState<boolean[]>([]);
  const [trickyScores, setTrickyScores] = useState<boolean[]>([]);

  const items = stage === 'sounds' ? ASSESSMENT_SOUNDS : stage === 'words' ? ASSESSMENT_WORDS : ASSESSMENT_TRICKY_WORDS;

  const handleMark = (correct: boolean) => {
    if (stage === 'sounds') setSoundScores((s) => [...s, correct]);
    else if (stage === 'words') setWordScores((s) => [...s, correct]);
    else if (stage === 'tricky') setTrickyScores((s) => [...s, correct]);

    if (currentIndex < items.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(0);
      if (stage === 'sounds') setStage('words');
      else if (stage === 'words') setStage('tricky');
      else setStage('results');
    }
  };

  const getRecommendedLevel = () => {
    const soundPct = soundScores.filter(Boolean).length / soundScores.length;
    const wordPct = wordScores.filter(Boolean).length / wordScores.length;
    if (soundPct < 0.5) return 1;
    if (wordPct < 0.5) return 1;
    if (soundPct < 0.75) return 2;
    if (wordPct < 0.75) return 3;
    return 4;
  };

  const reset = () => {
    setStage('welcome');
    setCurrentIndex(0);
    setSoundScores([]);
    setWordScores([]);
    setTrickyScores([]);
  };

  if (stage === 'welcome') {
    return (
      <Layout>
        <div className="px-4 pt-8 pb-4 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🔍</div>
          <h2 className="text-2xl font-bold text-foreground mb-3">Phonics Assessment</h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
            This short assessment takes 5–10 minutes and will recommend the right starting level for your child.
          </p>
          <div className="bg-muted rounded-xl p-4 mb-6 text-left space-y-2">
            <p className="text-sm font-semibold text-foreground">What to expect:</p>
            <p className="text-xs text-muted-foreground">1. Sound recognition (identify letter sounds)</p>
            <p className="text-xs text-muted-foreground">2. Word reading (read simple words aloud)</p>
            <p className="text-xs text-muted-foreground">3. Tricky words (common sight words)</p>
          </div>
          <p className="text-xs text-muted-foreground mb-6">
            Sit with your child. Show them each item and mark whether they got it right.
          </p>
          <button
            onClick={() => setStage('sounds')}
            className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-base"
          >
            Start Assessment
          </button>
        </div>
      </Layout>
    );
  }

  if (stage === 'results') {
    const level = getRecommendedLevel();
    const levelInfo = LEVELS.find((l) => l.level === level)!;
    const levelBgs: Record<number, string> = {
      1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3', 4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
    };

    return (
      <Layout>
        <div className="px-4 pt-8 pb-4 max-w-md mx-auto text-center">
          <div className="text-6xl mb-4">🌟</div>
          <h2 className="text-2xl font-bold text-foreground mb-2">Assessment Complete!</h2>

          <div className="bg-muted rounded-xl p-4 my-6 space-y-3 text-left">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Sounds</span>
              <span className="font-semibold">{soundScores.filter(Boolean).length}/{soundScores.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Words</span>
              <span className="font-semibold">{wordScores.filter(Boolean).length}/{wordScores.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Tricky Words</span>
              <span className="font-semibold">{trickyScores.filter(Boolean).length}/{trickyScores.length}</span>
            </div>
          </div>

          <div className={`${levelBgs[level]} text-white rounded-2xl p-6 mb-6`}>
            <p className="text-sm opacity-80 mb-1">Recommended starting level</p>
            <p className="text-3xl font-bold mb-1">Level {level}</p>
            <p className="text-sm font-semibold">{levelInfo.name}</p>
            <p className="text-xs opacity-80 mt-1">{levelInfo.ageRange}</p>
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-3 rounded-xl bg-muted font-semibold text-sm">
              Retake
            </button>
            <button className={`flex-1 py-3 rounded-xl ${levelBgs[level]} text-white font-semibold text-sm`}>
              Browse Level {level}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Assessment round (sounds, words, tricky)
  const stageLabel = stage === 'sounds' ? 'Sound Recognition' : stage === 'words' ? 'Word Reading' : 'Tricky Words';
  const stageIcon = stage === 'sounds' ? '🔤' : stage === 'words' ? '📖' : '⭐';
  const currentItem = stage === 'sounds' ? items[currentIndex] : items[currentIndex];
  const display = 'grapheme' in currentItem ? (currentItem as typeof ASSESSMENT_SOUNDS[0]).grapheme : (currentItem as typeof ASSESSMENT_WORDS[0]).word;

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
        <p className="text-xs font-semibold text-muted-foreground mb-1">
          {stageIcon} {stageLabel} · {currentIndex + 1}/{items.length}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted mb-8 overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {stage === 'sounds'
            ? 'Ask your child: "What sound does this make?"'
            : 'Ask your child to read this word aloud.'}
        </p>

        <div className="bg-card border-2 border-border rounded-3xl p-12 mb-8 shadow-sm">
          <p className="font-child text-5xl font-bold text-foreground">{display}</p>
        </div>

        <p className="text-sm text-muted-foreground mb-4">Did they get it right?</p>

        <div className="flex gap-3">
          <button
            onClick={() => handleMark(false)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-orange-50 border-2 border-orange-200 text-orange-600 font-semibold text-base active:scale-95 transition-transform"
          >
            <XCircle className="w-5 h-5" /> Not yet
          </button>
          <button
            onClick={() => handleMark(true)}
            className="flex-1 flex items-center justify-center gap-2 py-4 rounded-2xl bg-green-50 border-2 border-green-200 text-green-600 font-semibold text-base active:scale-95 transition-transform"
          >
            <CheckCircle2 className="w-5 h-5" /> Correct!
          </button>
        </div>
      </div>
    </Layout>
  );
}
