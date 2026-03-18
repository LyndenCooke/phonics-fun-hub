import Layout from '@/components/Layout';
import { LEVELS } from '@/lib/types';
import { LEVEL_1_BOOKS } from '@/lib/bookData';

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function Progress() {
  const completedBooks = LEVEL_1_BOOKS.filter((b) => b.completed).length;
  const totalBooks = LEVEL_1_BOOKS.length;

  return (
    <Layout>
      <div className="px-4 pt-4 pb-8 max-w-lg mx-auto">
        <h2 className="text-xl font-bold text-foreground mb-1">Reading Progress 📊</h2>
        <p className="text-sm text-muted-foreground mb-6">Track your child's phonics journey</p>

        {/* Overview card */}
        <div className="bg-primary/10 border border-primary/20 rounded-2xl p-5 mb-6">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-muted-foreground">Books Completed</p>
              <p className="text-3xl font-bold text-foreground">{completedBooks}/{totalBooks}</p>
            </div>
            <div className="text-5xl">📚</div>
          </div>
          <div className="h-2.5 rounded-full bg-muted overflow-hidden">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${totalBooks > 0 ? (completedBooks / totalBooks) * 100 : 0}%` }}
            />
          </div>
        </div>

        {/* Level progress */}
        <h3 className="text-sm font-semibold text-foreground mb-3">Level Progress</h3>
        <div className="space-y-3">
          {LEVELS.map((level) => {
            const booksInLevel = LEVEL_1_BOOKS.filter((b) => b.level === level.level);
            const completed = booksInLevel.filter((b) => b.completed).length;
            const total = booksInLevel.length;
            const pct = total > 0 ? (completed / total) * 100 : 0;

            return (
              <div key={level.level} className="bg-card rounded-xl border p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className={`w-3 h-3 rounded-full ${levelBgs[level.level]}`} />
                    <span className="text-sm font-semibold text-foreground">
                      Level {level.level}: {level.name}
                    </span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {completed}/{total}
                  </span>
                </div>
                <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                  <div
                    className={`h-full rounded-full ${levelBgs[level.level]} transition-all`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                {total === 0 && (
                  <p className="text-xs text-muted-foreground mt-1.5">Coming soon</p>
                )}
              </div>
            );
          })}
        </div>

        {/* Milestones */}
        <h3 className="text-sm font-semibold text-foreground mt-6 mb-3">Milestones</h3>
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: '📖', label: 'First Book Read', unlocked: false },
            { icon: '⭐', label: 'Level 1 Complete', unlocked: false },
            { icon: '🏅', label: '5 Quizzes Passed', unlocked: false },
            { icon: '🏆', label: 'All Levels Done', unlocked: false },
          ].map((milestone) => (
            <div
              key={milestone.label}
              className={`rounded-xl border p-3 text-center ${
                milestone.unlocked ? 'bg-primary/10 border-primary/30' : 'bg-muted/50 opacity-50'
              }`}
            >
              <div className="text-2xl mb-1">{milestone.icon}</div>
              <p className="text-xs font-semibold text-foreground">{milestone.label}</p>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
