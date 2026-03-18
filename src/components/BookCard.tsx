import { Lock, CheckCircle2 } from 'lucide-react';
import { Book, LEVELS } from '@/lib/types';

interface BookCardProps {
  book: Book;
  onSelect: (book: Book) => void;
}

export default function BookCard({ book, onSelect }: BookCardProps) {
  const levelInfo = LEVELS.find((l) => l.level === book.level);
  const levelColors: Record<number, string> = {
    1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
    4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
  };
  const levelBg = levelColors[book.level] || 'bg-primary';

  return (
    <button
      onClick={() => book.unlocked && onSelect(book)}
      className={`group relative rounded-2xl overflow-hidden shadow-md transition-all duration-200 text-left w-full ${
        book.unlocked
          ? 'hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] cursor-pointer'
          : 'opacity-60 cursor-not-allowed'
      }`}
    >
      {/* Cover image area */}
      <div className={`${levelBg} aspect-[3/4] flex flex-col items-center justify-center p-4 relative`}>
        {/* Level badge */}
        <span className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/90 text-foreground">
          {book.subLevel}
        </span>

        {/* Lock or check overlay */}
        {!book.unlocked && (
          <div className="absolute inset-0 bg-foreground/30 flex items-center justify-center">
            <Lock className="w-8 h-8 text-white" />
          </div>
        )}
        {book.completed && (
          <div className="absolute top-2 right-2">
            <CheckCircle2 className="w-6 h-6 text-white drop-shadow-md" />
          </div>
        )}

        {/* Book icon */}
        <div className="text-white/90 text-center">
          <div className="text-4xl mb-2">📖</div>
          <p className="font-child text-base font-bold leading-tight text-white drop-shadow-sm">
            {book.title}
          </p>
        </div>
      </div>

      {/* Info footer */}
      <div className="bg-card p-2.5">
        <p className="text-xs font-semibold text-foreground truncate">{book.title}</p>
        <p className="text-[10px] text-muted-foreground mt-0.5">
          {levelInfo?.name}
        </p>
        {book.unlocked && book.lastPageRead > 0 && !book.completed && (
          <div className="mt-1.5">
            <div className="h-1 rounded-full bg-muted overflow-hidden">
              <div
                className={`h-full rounded-full ${levelBg} transition-all`}
                style={{ width: `${Math.round((book.lastPageRead / book.pageCount) * 100)}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </button>
  );
}
