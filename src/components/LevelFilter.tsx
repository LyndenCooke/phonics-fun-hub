import { LEVELS } from '@/lib/types';

interface LevelFilterProps {
  selected: number | null;
  onSelect: (level: number | null) => void;
}

const levelBgs: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

export default function LevelFilter({ selected, onSelect }: LevelFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
      <button
        onClick={() => onSelect(null)}
        className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
          selected === null
            ? 'bg-primary text-primary-foreground shadow-sm'
            : 'bg-muted text-muted-foreground hover:bg-accent'
        }`}
      >
        All
      </button>
      {LEVELS.map((level) => (
        <button
          key={level.level}
          onClick={() => onSelect(level.level)}
          className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-all ${
            selected === level.level
              ? `${levelBgs[level.level]} text-white shadow-sm`
              : 'bg-muted text-muted-foreground hover:bg-accent'
          }`}
        >
          L{level.level}
        </button>
      ))}
    </div>
  );
}
