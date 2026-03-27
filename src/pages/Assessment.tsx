import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import { PhonemePlayer } from '@/components/PhonemePlayer';
import { WordPlayer } from '@/components/WordPlayer';
import { useAuth } from '@/contexts/AuthContext';
import { useChildren } from '@/hooks/useBooks';
import { LEVELS } from '@/lib/types';
import {
  ASSESSMENT_ITEMS,
  PASS_CRITERIA,
  AGE_EXPECTATIONS,
  LEVEL_NAMES,
  CATEGORY_LABELS,
  CATEGORY_INSTRUCTIONS,
  getCategoriesForLevel,
  getItems,
  type Category,
  type AssessmentItem,
} from '@/lib/assessmentData';
import { CheckCircle2, XCircle, ChevronRight, RotateCcw, ArrowRight, Trophy, AlertTriangle, Star, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

type Stage = 'welcome' | 'level-intro' | 'testing' | 'level-results' | 'final-results';

interface Answer {
  level: number;
  category: Category;
  item: string;
  isCorrect: boolean;
}

interface LevelScore {
  level: number;
  categories: {
    category: Category;
    correct: number;
    total: number;
    percentage: number;
    passed: boolean;
  }[];
  passed: boolean;
  fluencyWpm?: number;
}

const LEVEL_COLORS: Record<number, string> = {
  1: 'bg-level-1',
  2: 'bg-level-2',
  3: 'bg-level-3',
  4: 'bg-level-4',
  5: 'bg-level-5',
  6: 'bg-level-6',
};

const LEVEL_BORDERS: Record<number, string> = {
  1: 'border-level-1',
  2: 'border-level-2',
  3: 'border-level-3',
  4: 'border-level-4',
  5: 'border-level-5',
  6: 'border-level-6',
};

const LEVEL_TEXT: Record<number, string> = {
  1: 'text-level-1',
  2: 'text-level-2',
  3: 'text-level-3',
  4: 'text-level-4',
  5: 'text-level-5',
  6: 'text-level-6',
};

// Get the sound file key for a grapheme (handles variants like "ow (blow)", "oo (moon)")
function getSoundKey(grapheme: string): string {
  // Map variant graphemes to their specific sound files
  const VARIANT_MAP: Record<string, string> = {
    'ow (blow)': 'ow',     // long o as in "blow"
    'ow (cow)': 'ow',      // ow as in "cow" (same file — both say /aʊ/)
    'oo (moon)': 'oo_moon', // long oo /uː/
    'oo (look)': 'oo_look', // short oo /ʊ/
  };
  const lower = grapheme.toLowerCase().trim();
  if (VARIANT_MAP[lower]) return VARIANT_MAP[lower];
  // Default: strip parenthetical, replace hyphens with underscores
  const base = lower.replace(/\s*\(.*\)/, '').trim();
  return base.replace(/-/g, '_');
}

export default function Assessment() {
  const [stage, setStage] = useState<Stage>('welcome');
  const [currentLevel, setCurrentLevel] = useState(1);
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0);
  const [currentItemIdx, setCurrentItemIdx] = useState(0);
  const [answers, setAnswers] = useState<Answer[]>([]);
  const [consecutiveWrong, setConsecutiveWrong] = useState(0);
  const [levelScores, setLevelScores] = useState<LevelScore[]>([]);
  const [fluencyWpm, setFluencyWpm] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [childAge, setChildAge] = useState<string>('');

  const { user } = useAuth();
  const { data: children } = useChildren();
  const child = children?.[0];
  const navigate = useNavigate();

  const categories = getCategoriesForLevel(currentLevel);
  const currentCategory = categories[currentCategoryIdx];
  const currentItems = getItems(currentLevel, currentCategory);
  const currentItem = currentItems[currentItemIdx];

  const handleMark = useCallback((correct: boolean) => {
    if (!currentItem) return;

    const newAnswer: Answer = {
      level: currentLevel,
      category: currentCategory,
      item: currentItem.item,
      isCorrect: correct,
    };
    setAnswers(prev => [...prev, newAnswer]);

    const newConsecutiveWrong = correct ? 0 : consecutiveWrong + 1;
    setConsecutiveWrong(newConsecutiveWrong);

    // Stop rule: 3 consecutive wrong → move to next category
    const shouldStop = newConsecutiveWrong >= 3;

    if (shouldStop || currentItemIdx >= currentItems.length - 1) {
      // Move to next category
      advanceCategory();
    } else {
      setCurrentItemIdx(i => i + 1);
    }
  }, [currentItem, currentLevel, currentCategory, consecutiveWrong, currentItemIdx, currentItems.length]);

  const advanceCategory = () => {
    setCurrentItemIdx(0);
    setConsecutiveWrong(0);

    const nextCatIdx = currentCategoryIdx + 1;
    if (nextCatIdx < categories.length) {
      // Check if next category is fluency
      if (categories[nextCatIdx] === 'fluency') {
        setCurrentCategoryIdx(nextCatIdx);
        // Fluency is handled differently — just a wpm input
      } else {
        setCurrentCategoryIdx(nextCatIdx);
      }
    } else {
      // Level complete — calculate scores
      finishLevel();
    }
  };

  const finishLevel = () => {
    const levelAnswers = answers.filter(a => a.level === currentLevel);
    // Also include any answers from the current round that were just added
    const allLevelAnswers = [...levelAnswers];

    const criteria = PASS_CRITERIA[currentLevel];
    const catScores = getCategoriesForLevel(currentLevel)
      .filter(c => c !== 'fluency')
      .map(cat => {
        const catAnswers = allLevelAnswers.filter(a => a.category === cat);
        const correct = catAnswers.filter(a => a.isCorrect).length;
        const total = catAnswers.length;
        const percentage = total > 0 ? Math.round((correct / total) * 100) : 0;
        const threshold =
          cat === 'sound_recognition' ? criteria.sounds :
          cat === 'word_reading' ? criteria.words :
          cat === 'alien_words' ? criteria.alien :
          cat === 'tricky_words' ? criteria.tricky : 0;
        return {
          category: cat,
          correct,
          total,
          percentage,
          passed: percentage >= threshold,
        };
      });

    const passed = catScores.every(c => c.passed);
    const wpm = fluencyWpm ? parseInt(fluencyWpm) : undefined;

    const score: LevelScore = {
      level: currentLevel,
      categories: catScores,
      passed,
      fluencyWpm: wpm,
    };

    setLevelScores(prev => [...prev, score]);
    setStage('level-results');
  };

  const handleFluencySubmit = () => {
    finishLevel();
  };

  const proceedAfterLevel = () => {
    const lastScore = levelScores[levelScores.length - 1];

    if (lastScore.passed && currentLevel < 6) {
      // Passed — move to next level
      setCurrentLevel(currentLevel + 1);
      setCurrentCategoryIdx(0);
      setCurrentItemIdx(0);
      setConsecutiveWrong(0);
      setFluencyWpm('');
      setStage('level-intro');
    } else {
      // Failed or reached L6 — show final results
      setStage('final-results');
    }
  };

  const getRecommendedLevel = (): number => {
    // The recommended level is the highest level passed + 1 (to work on next)
    // If no levels passed, recommend Level 1
    const passedLevels = levelScores.filter(s => s.passed).map(s => s.level);
    if (passedLevels.length === 0) return 1;
    const highest = Math.max(...passedLevels);
    return Math.min(highest + 1, 6);
  };

  const getAgeComparison = () => {
    if (!childAge) return null;
    return AGE_EXPECTATIONS.find(e => e.age === childAge);
  };

  const reset = () => {
    setStage('welcome');
    setCurrentLevel(1);
    setCurrentCategoryIdx(0);
    setCurrentItemIdx(0);
    setAnswers([]);
    setConsecutiveWrong(0);
    setLevelScores([]);
    setFluencyWpm('');
    setChildAge('');
  };

  // ───────────────────────────────────────
  // WELCOME SCREEN
  // ───────────────────────────────────────
  if (stage === 'welcome') {
    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-foreground mb-2 tracking-tight">
            Phonics Assessment
          </h2>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed max-w-xs mx-auto">
            A comprehensive assessment across 6 levels to find your child's starting point.
          </p>

          <div className="bg-tint-pink rounded-2xl p-5 mb-6 text-left">
            <p className="text-sm font-bold text-foreground mb-3">Six categories tested at each level</p>
            <div className="space-y-2.5">
              {[
                { icon: '🔊', label: 'Sounds', desc: 'Say the sound each letter makes' },
                { icon: '📖', label: 'Real Words', desc: 'Read real words aloud' },
                { icon: '👽', label: 'Alien Words', desc: 'Decode made-up words' },
                { icon: '⭐', label: 'Tricky Words', desc: 'Recognise sight words' },
                { icon: '⚡', label: 'Speedy Reading', desc: 'Read words quickly' },
                { icon: '📚', label: 'Fluency', desc: 'Timed passage (Level 4+)' },
              ].map(({ icon, label, desc }, i) => (
                <div key={i} className="flex items-start gap-3">
                  <span className="text-base shrink-0 mt-0.5">{icon}</span>
                  <div>
                    <span className="text-xs font-bold text-foreground">{label}</span>
                    <span className="text-xs text-muted-foreground ml-1">— {desc}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-foreground mb-2">How does it work?</p>
            <ul className="text-xs text-muted-foreground space-y-1.5 leading-relaxed">
              <li>• Start at Level 1 and work upwards</li>
              <li>• Each level tests all categories</li>
              <li>• Pass a level to unlock the next</li>
              <li>• Assessment stops when your child struggles</li>
              <li>• 3 wrong answers in a row skips to the next section</li>
            </ul>
          </div>

          {/* Age selector for comparison */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-foreground mb-2">Child's age (for UK comparison)</p>
            <select
              value={childAge}
              onChange={e => setChildAge(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-border bg-background text-sm"
            >
              <option value="">Select age range (optional)</option>
              {AGE_EXPECTATIONS.map(ae => (
                <option key={ae.age} value={ae.age}>
                  {ae.age} years — {ae.yearGroup}
                </option>
              ))}
            </select>
          </div>

          <p className="text-xs text-muted-foreground mb-6">
            Sit with your child. Show them each item and mark whether they got it right.
          </p>

          <button
            onClick={() => setStage('level-intro')}
            className="w-full py-4 rounded-xl gradient-primary text-primary-foreground font-bold text-base shadow-button active:scale-[0.97] transition-transform duration-200"
          >
            Start Assessment
          </button>
        </div>
      </Layout>
    );
  }

  // ───────────────────────────────────────
  // LEVEL INTRO SCREEN
  // ───────────────────────────────────────
  if (stage === 'level-intro') {
    const levelName = LEVEL_NAMES[currentLevel];
    const categories = getCategoriesForLevel(currentLevel);
    const totalItems = categories
      .filter(c => c !== 'fluency')
      .reduce((sum, c) => sum + getItems(currentLevel, c).length, 0);

    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          {/* Level progress dots */}
          <div className="flex justify-center gap-2 mb-6">
            {[1, 2, 3, 4, 5, 6].map(l => (
              <div
                key={l}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                  l < currentLevel
                    ? `${LEVEL_COLORS[l]} text-white`
                    : l === currentLevel
                    ? `${LEVEL_COLORS[l]} text-white ring-2 ring-offset-2 ring-current scale-110`
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {l < currentLevel ? '✓' : l}
              </div>
            ))}
          </div>

          <div className={`${LEVEL_COLORS[currentLevel]} text-white rounded-2xl p-6 mb-6 shadow-card`}>
            <p className="text-sm opacity-80 mb-1">{levelName.phase}</p>
            <p className="text-3xl font-extrabold mb-1">Level {currentLevel}</p>
            <p className="text-base font-bold">{levelName.name}</p>
            <p className="text-xs opacity-70 mt-2">{levelName.colour} · {totalItems} items</p>
          </div>

          <div className="bg-card border border-border rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-foreground mb-2">Categories in this level</p>
            <div className="space-y-1.5">
              {categories.map(cat => {
                const items = cat === 'fluency' ? [] : getItems(currentLevel, cat);
                return (
                  <div key={cat} className="flex justify-between text-xs">
                    <span className="text-muted-foreground">{CATEGORY_LABELS[cat]}</span>
                    <span className="font-bold">
                      {cat === 'fluency' ? '1 min timed' : `${items.length} items`}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-tint-green rounded-2xl p-4 mb-6 text-left">
            <p className="text-xs font-bold text-foreground mb-1">Pass criteria</p>
            <p className="text-xs text-muted-foreground">
              Sounds: {PASS_CRITERIA[currentLevel].sounds}% ·
              Words: {PASS_CRITERIA[currentLevel].words}% ·
              Alien: {PASS_CRITERIA[currentLevel].alien}% ·
              Tricky: {PASS_CRITERIA[currentLevel].tricky}%
              {PASS_CRITERIA[currentLevel].fluency && ` · Fluency: ${PASS_CRITERIA[currentLevel].fluency}+ wpm`}
            </p>
          </div>

          <button
            onClick={() => {
              setCurrentCategoryIdx(0);
              setCurrentItemIdx(0);
              setConsecutiveWrong(0);
              setStage('testing');
            }}
            className={`w-full py-4 rounded-xl ${LEVEL_COLORS[currentLevel]} text-white font-bold text-base shadow-sm active:scale-[0.97] transition-transform duration-200`}
          >
            Begin Level {currentLevel}
          </button>
        </div>
      </Layout>
    );
  }

  // ───────────────────────────────────────
  // TESTING SCREEN (item by item)
  // ───────────────────────────────────────
  if (stage === 'testing') {
    // Fluency is a special case — just a WPM input
    if (currentCategory === 'fluency') {
      return (
        <Layout>
          <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
            <div className="flex justify-between items-center mb-4">
              <span className={`text-xs font-bold uppercase tracking-wide ${LEVEL_TEXT[currentLevel]}`}>
                Level {currentLevel}
              </span>
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
                Fluency Test
              </span>
            </div>

            <div className="bg-card border border-border rounded-2xl p-8 mb-6 shadow-card">
              <Clock className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-sm text-foreground font-bold mb-2">Timed Reading — 1 Minute</p>
              <p className="text-xs text-muted-foreground mb-6 leading-relaxed">
                Use a Level {currentLevel} book passage. Time your child reading for 1 minute.
                Count the number of words read correctly.
              </p>
              <div className="flex items-center justify-center gap-2">
                <input
                  type="number"
                  value={fluencyWpm}
                  onChange={e => setFluencyWpm(e.target.value)}
                  placeholder="0"
                  className="w-24 text-center text-3xl font-bold p-3 rounded-xl border-2 border-border focus:border-primary outline-none bg-background"
                  min={0}
                  max={300}
                />
                <span className="text-sm font-bold text-muted-foreground">wpm</span>
              </div>
            </div>

            <button
              onClick={handleFluencySubmit}
              className={`w-full py-4 rounded-xl ${LEVEL_COLORS[currentLevel]} text-white font-bold text-base shadow-sm active:scale-[0.97] transition-transform duration-200`}
            >
              Submit & Finish Level {currentLevel}
            </button>
          </div>
        </Layout>
      );
    }

    // Standard item testing
    const totalInCategory = currentItems.length;
    const overallProgress = categories
      .filter(c => c !== 'fluency')
      .reduce((acc, cat, idx) => {
        const items = getItems(currentLevel, cat);
        if (idx < currentCategoryIdx) return acc + items.length;
        if (idx === currentCategoryIdx) return acc + currentItemIdx;
        return acc;
      }, 0);
    const totalItemsInLevel = categories
      .filter(c => c !== 'fluency')
      .reduce((sum, c) => sum + getItems(currentLevel, c).length, 0);

    const isSoundRound = currentCategory === 'sound_recognition';

    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          {/* Header */}
          <div className="flex justify-between items-center mb-2">
            <span className={`text-xs font-bold uppercase tracking-wide ${LEVEL_TEXT[currentLevel]}`}>
              Level {currentLevel}
            </span>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wide">
              {CATEGORY_LABELS[currentCategory]}
            </span>
          </div>

          {/* Category progress */}
          <p className="text-xs text-muted-foreground mb-1">
            Item {currentItemIdx + 1} of {totalInCategory}
          </p>

          {/* Overall level progress bar */}
          <div className="h-1.5 rounded-full bg-muted mb-4 overflow-hidden">
            <div
              className={`h-full ${LEVEL_COLORS[currentLevel]} rounded-full transition-all duration-300`}
              style={{ width: `${((overallProgress + 1) / totalItemsInLevel) * 100}%` }}
            />
          </div>

          {/* Instruction */}
          <p className="text-xs text-muted-foreground mb-4 leading-relaxed">
            {CATEGORY_INSTRUCTIONS[currentCategory]}
          </p>

          {/* Item card */}
          <div className={`bg-card border-2 ${LEVEL_BORDERS[currentLevel]} rounded-2xl p-10 mb-6 shadow-card`}>
            <p className="font-child text-5xl font-bold text-foreground">
              {currentItem?.item ?? ''}
            </p>
            {isSoundRound && currentItem && (
              <div className="mt-6 flex justify-center">
                <PhonemePlayer
                  grapheme={getSoundKey(currentItem.item)}
                  size="lg"
                />
              </div>
            )}
            {!isSoundRound && currentCategory !== 'fluency' && currentItem && (
              <div className="mt-6 flex justify-center">
                <WordPlayer
                  word={currentItem.item}
                  size="lg"
                />
              </div>
            )}
            {currentCategory === 'alien_words' && (
              <p className="mt-3 text-xs text-muted-foreground italic">
                (made-up word)
              </p>
            )}
          </div>

          {/* Mark buttons */}
          <p className="text-xs text-muted-foreground mb-3">Did they get it right?</p>
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

          {/* Consecutive wrong warning */}
          {consecutiveWrong >= 2 && (
            <p className="text-xs text-orange-500 mt-3 flex items-center justify-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {consecutiveWrong} wrong in a row — 1 more will skip to next section
            </p>
          )}
        </div>
      </Layout>
    );
  }

  // ───────────────────────────────────────
  // LEVEL RESULTS SCREEN
  // ───────────────────────────────────────
  if (stage === 'level-results') {
    const score = levelScores[levelScores.length - 1];
    if (!score) return null;

    return (
      <Layout>
        <div className="px-4 pt-6 pb-4 max-w-md mx-auto text-center">
          <div className={`${LEVEL_COLORS[score.level]} text-white rounded-2xl p-5 mb-5 shadow-card`}>
            <p className="text-sm opacity-80">Level {score.level} — {LEVEL_NAMES[score.level].name}</p>
            <p className="text-3xl font-extrabold mt-1 mb-1">
              {score.passed ? 'PASSED' : 'NOT YET'}
            </p>
            {score.passed ? (
              <Trophy className="w-8 h-8 mx-auto opacity-90" />
            ) : (
              <p className="text-xs opacity-70">This is the recommended starting level</p>
            )}
          </div>

          {/* Category breakdown */}
          <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card">
            <p className="text-xs font-bold text-foreground mb-3">Score Breakdown</p>
            <div className="space-y-2.5">
              {score.categories.map(cat => {
                const threshold =
                  cat.category === 'sound_recognition' ? PASS_CRITERIA[score.level].sounds :
                  cat.category === 'word_reading' ? PASS_CRITERIA[score.level].words :
                  cat.category === 'alien_words' ? PASS_CRITERIA[score.level].alien :
                  PASS_CRITERIA[score.level].tricky;
                return (
                  <div key={cat.category}>
                    <div className="flex justify-between items-center text-xs mb-1">
                      <span className="text-muted-foreground">{CATEGORY_LABELS[cat.category]}</span>
                      <span className="flex items-center gap-1.5">
                        <span className="font-bold">{cat.correct}/{cat.total}</span>
                        <span className={`font-bold ${cat.passed ? 'text-level-3' : 'text-destructive'}`}>
                          ({cat.percentage}%)
                        </span>
                        {cat.passed ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-level-3" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-destructive" />
                        )}
                      </span>
                    </div>
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${cat.passed ? 'bg-level-3' : 'bg-destructive'}`}
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                    <p className="text-[10px] text-muted-foreground mt-0.5">
                      Need {threshold}% to pass
                    </p>
                  </div>
                );
              })}
              {score.fluencyWpm !== undefined && (
                <div className="flex justify-between items-center text-xs pt-1 border-t border-border">
                  <span className="text-muted-foreground">Fluency</span>
                  <span className="font-bold">{score.fluencyWpm} wpm</span>
                </div>
              )}
            </div>
          </div>

          {/* Show which items were wrong */}
          {(() => {
            const wrongItems = answers.filter(
              a => a.level === score.level && !a.isCorrect
            );
            if (wrongItems.length === 0) return null;
            return (
              <div className="bg-tint-orange rounded-2xl p-4 mb-5 text-left">
                <p className="text-xs font-bold text-foreground mb-2">Items to practise</p>
                <div className="flex flex-wrap gap-1.5">
                  {wrongItems.map((w, i) => (
                    <span key={i} className="text-xs bg-background border border-border rounded-lg px-2 py-1 font-mono">
                      {w.item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          <button
            onClick={proceedAfterLevel}
            className={`w-full py-4 rounded-xl ${
              score.passed && currentLevel < 6
                ? LEVEL_COLORS[currentLevel + 1]
                : 'gradient-primary'
            } text-white font-bold text-base shadow-sm active:scale-[0.97] transition-transform duration-200 flex items-center justify-center gap-2`}
          >
            {score.passed && currentLevel < 6 ? (
              <>Continue to Level {currentLevel + 1} <ArrowRight className="w-4 h-4" /></>
            ) : (
              <>See Final Results <ArrowRight className="w-4 h-4" /></>
            )}
          </button>
        </div>
      </Layout>
    );
  }

  // ───────────────────────────────────────
  // FINAL RESULTS SCREEN
  // ───────────────────────────────────────
  if (stage === 'final-results') {
    const recommendedLevel = getRecommendedLevel();
    const levelInfo = LEVELS.find(l => l.level === recommendedLevel)!;
    const ageComparison = getAgeComparison();

    return (
      <Layout>
        <div className="px-4 pt-6 pb-8 max-w-md mx-auto text-center">
          <h2 className="text-[28px] font-extrabold text-foreground mb-1 tracking-tight">
            Assessment Complete
          </h2>
          <p className="text-sm text-muted-foreground mb-5">
            Here's a full breakdown of your child's phonics skills.
          </p>

          {/* Recommended level */}
          <div className={`${LEVEL_COLORS[recommendedLevel]} text-white rounded-2xl p-6 mb-5 shadow-card`}>
            <Star className="w-8 h-8 mx-auto mb-2 opacity-90" />
            <p className="text-sm opacity-80 mb-1">Recommended starting level</p>
            <p className="text-4xl font-extrabold mb-1">Level {recommendedLevel}</p>
            <p className="text-sm font-bold">{levelInfo.name}</p>
            <p className="text-xs opacity-80 mt-1">{levelInfo.ageRange}</p>
          </div>

          {/* Age expectation comparison */}
          {ageComparison && (
            <div className="bg-card border border-border rounded-2xl p-4 mb-5 text-left shadow-card">
              <p className="text-xs font-bold text-foreground mb-2">
                UK Age Comparison — {ageComparison.age} years ({ageComparison.yearGroup})
              </p>
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Expected level</span>
                  <span className="font-bold">{ageComparison.expectedLevel}</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-muted-foreground">Your child</span>
                  <span className="font-bold">Level {recommendedLevel}</span>
                </div>
                {(() => {
                  // Parse expected level to compare
                  const expectedMatch = ageComparison.expectedLevel.match(/\d+/g);
                  if (!expectedMatch) return null;
                  const expectedHigh = parseInt(expectedMatch[expectedMatch.length - 1]);
                  const expectedLow = parseInt(expectedMatch[0]);

                  let status: 'above' | 'at' | 'below';
                  if (recommendedLevel > expectedHigh) status = 'above';
                  else if (recommendedLevel >= expectedLow) status = 'at';
                  else status = 'below';

                  const statusConfig = {
                    above: { label: 'Above expectations', color: 'text-level-3', bg: 'bg-tint-green' },
                    at: { label: 'At expected level', color: 'text-level-4', bg: 'bg-blue-50 dark:bg-blue-950/30' },
                    below: { label: 'Below expectations', color: 'text-orange-500', bg: 'bg-tint-orange' },
                  };
                  const cfg = statusConfig[status];

                  return (
                    <div className={`${cfg.bg} rounded-lg p-3 mt-2`}>
                      <p className={`text-xs font-bold ${cfg.color}`}>{cfg.label}</p>
                      {status === 'below' && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          In England, children this age are typically working at {ageComparison.expectedLevel}.
                          Targeted practice with MyPhonicsBooks can help close this gap.
                        </p>
                      )}
                      {status === 'above' && (
                        <p className="text-[10px] text-muted-foreground mt-1">
                          Your child is ahead of UK age expectations. Keep up the great work!
                        </p>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Level-by-level breakdown */}
          <div className="space-y-3 mb-5">
            {levelScores.map(score => (
              <div key={score.level} className="bg-card border border-border rounded-2xl p-4 text-left shadow-card">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-7 h-7 rounded-full ${LEVEL_COLORS[score.level]} text-white text-xs font-bold flex items-center justify-center`}>
                      {score.level}
                    </span>
                    <span className="text-sm font-bold text-foreground">{LEVEL_NAMES[score.level].name}</span>
                  </div>
                  <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                    score.passed ? 'bg-tint-green text-level-3' : 'bg-tint-orange text-orange-500'
                  }`}>
                    {score.passed ? 'PASSED' : 'NOT YET'}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                  {score.categories.map(cat => (
                    <div key={cat.category} className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">{CATEGORY_LABELS[cat.category]}</span>
                      <span className={`font-bold ${cat.passed ? 'text-foreground' : 'text-orange-500'}`}>
                        {cat.percentage}%
                      </span>
                    </div>
                  ))}
                  {score.fluencyWpm !== undefined && (
                    <div className="flex justify-between text-[11px]">
                      <span className="text-muted-foreground">Fluency</span>
                      <span className="font-bold">{score.fluencyWpm} wpm</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Items to practise */}
          {(() => {
            const allWrong = answers.filter(a => !a.isCorrect);
            if (allWrong.length === 0) return null;
            return (
              <div className="bg-tint-orange rounded-2xl p-4 mb-5 text-left">
                <p className="text-xs font-bold text-foreground mb-2">
                  All items to practise ({allWrong.length})
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {allWrong.map((w, i) => (
                    <span key={i} className="text-xs bg-background border border-border rounded-lg px-2 py-1 font-mono">
                      {w.item}
                    </span>
                  ))}
                </div>
              </div>
            );
          })()}

          {/* Action buttons */}
          <div className="flex gap-3">
            <button
              onClick={reset}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-card border border-border font-bold text-sm shadow-card active:scale-[0.97] transition-transform duration-200"
            >
              <RotateCcw className="w-4 h-4" /> Retake
            </button>
            <button
              onClick={() => navigate('/', { state: { filterLevel: recommendedLevel } })}
              className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl ${LEVEL_COLORS[recommendedLevel]} text-white font-bold text-sm shadow-sm active:scale-[0.97] transition-transform duration-200`}
            >
              Browse Level {recommendedLevel} <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </Layout>
    );
  }

  return null;
}
