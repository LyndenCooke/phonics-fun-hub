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
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200"
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

    return (
      <Layout>
        <div className="px-4 pt-8 pb-4 max-w-md mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-foreground mb-2 tracking-tight">Assessment Complete</h2>

          <div className="bg-card rounded-2xl p-5 my-6 space-y-3 text-left shadow-card">
            {[
              { label: 'Sounds', scores: soundScores },
              { label: 'Words', scores: wordScores },
              { label: 'Tricky Words', scores: trickyScores },
            ].map(({ label, scores }) => (
              <div key={label} className="flex justify-between text-sm py-1">
                <span className="text-muted-foreground">{label}</span>
                <span className="font-bold">{scores.filter(Boolean).length}/{scores.length}</span>
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
            <button className={`flex-1 py-3 rounded-xl ${levelBgs[level]} text-white font-bold text-sm shadow-sm active:scale-[0.97] transition-transform duration-200`}>
              Browse Level {level}
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  // Assessment round
  const stageLabel = stage === 'sounds' ? 'Sound Recognition' : stage === 'words' ? 'Word Reading' : 'Tricky Words';
  const currentItem = items[currentIndex];
  const display = 'grapheme' in currentItem ? (currentItem as typeof ASSESSMENT_SOUNDS[0]).grapheme : (currentItem as typeof ASSESSMENT_WORDS[0]).word;

  return (
    <Layout>
      <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
        <p className="text-xs font-bold text-muted-foreground mb-1 uppercase tracking-wide">
          {stageLabel} · {currentIndex + 1}/{items.length}
        </p>

        {/* Progress bar */}
        <div className="h-1.5 rounded-full bg-muted mb-8 overflow-hidden">
          <div
            className="h-full gradient-primary rounded-full transition-all duration-300"
            style={{ width: `${((currentIndex + 1) / items.length) * 100}%` }}
          />
        </div>

        <p className="text-sm text-muted-foreground mb-4">
          {stage === 'sounds'
            ? 'Ask your child: "What sound does this make?"'
            : 'Ask your child to read this word aloud.'}
        </p>

        <div className="bg-card border border-border rounded-2xl p-12 mb-8 shadow-card">
          <p className="font-child text-5xl font-bold text-foreground">{display}</p>
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