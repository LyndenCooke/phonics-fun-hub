import Layout from '@/components/Layout';
import { LEVELS } from '@/lib/types';
import { LEVEL_1_BOOKS } from '@/lib/bookData';
import { ChevronRight, BookOpen, Trophy } from 'lucide-react';

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function Progress() {
  const completedBooks = LEVEL_1_BOOKS.filter((b) => b.completed).length;
  const totalBooks = LEVEL_1_BOOKS.length;
  const pct = totalBooks > 0 ? (completedBooks / totalBooks) * 100 : 0;

  // SVG circular progress
  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (pct / 100) * circumference;

  return (
    <Layout>
      <div className="px-4 pt-5 pb-8 max-w-lg mx-auto">
        <h2 className="text-2xl font-extrabold text-foreground mb-1 tracking-tight">Reading Progress</h2>
        <p className="text-sm text-muted-foreground mb-6">Track your child's phonics journey</p>

        {/* Overview card */}
        <div className="bg-card rounded-2xl p-6 mb-6 shadow-card border border-border">
          <div className="flex items-center gap-6">
            {/* Circular progress */}
            <div className="relative w-24 h-24 shrink-0">
              <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
                <circle cx="50" cy="50" r={radius} fill="none" stroke="hsl(var(--muted))" strokeWidth="8" />
                <circle
                  cx="50" cy="50" r={radius} fill="none"
                  stroke="hsl(var(--primary))"
                  strokeWidth="8" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  className="transition-all duration-500"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-extrabold text-foreground leading-none">{completedBooks}</span>
                <span className="text-[10px] text-muted-foreground font-medium">of {totalBooks}</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Books Completed</p>
              <p className="text-3xl font-extrabold text-foreground">{completedBooks}/{totalBooks}</p>
              {completedBooks === 0 && (
                <p className="text-xs text-muted-foreground mt-1">Start reading to track your progress</p>
              )}
            </div>
          </div>
        </div>

        {/* Level progress */}
        <h3 className="text-sm font-bold text-foreground mb-3">Level Progress</h3>
        <div className="space-y-3 mb-8">
          {LEVELS.map((level) => {
            const booksInLevel = LEVEL_1_BOOKS.filter((b) => b.level === level.level);
            const completed = booksInLevel.filter((b) => b.completed).length;
            const total = booksInLevel.length;
            const levelPct = total > 0 ? (completed / total) * 100 : 0;

            return (
              <div key={level.level} className="bg-card rounded-xl border border-border p-4 shadow-card flex items-center gap-3">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`w-3 h-3 rounded-full ${levelBgs[level.level]}`} />
                      <span className="text-sm font-bold text-foreground">
                        Level {level.level}: {level.name}
                      </span>
                    </div>
                    {total > 0 ? (
                      <span className="text-xs font-medium text-muted-foreground">
                        {completed}/{total}
                      </span>
                    ) : (
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                        Coming soon
                      </span>
                    )}
                  </div>
                  {total > 0 && (
                    <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                      <div
                        className={`h-full rounded-full ${levelBgs[level.level]} transition-all duration-300`}
                        style={{ width: `${levelPct}%` }}
                      />
                    </div>
                  )}
                </div>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </div>
            );
          })}
        </div>

        {/* Milestones */}
        <h3 className="text-sm font-bold text-foreground mb-3">Milestones</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: BookOpen, label: 'First Book Read', unlocked: false },
            { icon: Trophy, label: 'Level 1 Complete', unlocked: false },
            { icon: CheckIcon, label: '5 Quizzes Passed', unlocked: false },
            { icon: Trophy, label: 'All Levels Done', unlocked: false },
          ].map((milestone) => (
            <div
              key={milestone.label}
              className={`rounded-xl border p-4 text-center shadow-card transition-all duration-200 ${
                milestone.unlocked ? 'bg-tint-pink border-primary/30' : 'bg-card border-border opacity-50'
              }`}
            >
              <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center mx-auto mb-2">
                <milestone.icon className="w-5 h-5 text-muted-foreground" />
              </div>
              <p className="text-xs font-bold text-foreground">{milestone.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
      <polyline points="22 4 12 14.01 9 11.01" />
    </svg>
  );
}