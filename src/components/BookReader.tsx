import { useState, useCallback } from 'react';
import { Book } from '@/lib/types';
import { ChevronLeft, ChevronRight, X, Volume2, Bookmark, Palette } from 'lucide-react';

interface BookReaderProps {
  book: Book;
  onClose: () => void;
  onFinish: () => void;
}

const levelColors: Record<number, string> = {
  1: 'bg-level-1', 2: 'bg-level-2', 3: 'bg-level-3',
  4: 'bg-level-4', 5: 'bg-level-5', 6: 'bg-level-6',
};

const fontSizes: Record<number, string> = {
  1: 'text-2xl', 2: 'text-xl', 3: 'text-lg', 4: 'text-base', 5: 'text-sm', 6: 'text-sm',
};

export default function BookReader({ book, onClose, onFinish }: BookReaderProps) {
  const [currentPage, setCurrentPage] = useState(0);
  const pages = book.pages;
  const page = pages[currentPage];
  const levelBg = levelColors[book.level] || 'bg-primary';
  const fontSize = fontSizes[book.level] || 'text-lg';

  const goNext = useCallback(() => {
    if (currentPage < pages.length - 1) {
      setCurrentPage((p) => p + 1);
    } else {
      onFinish();
    }
  }, [currentPage, pages.length, onFinish]);

  const goPrev = useCallback(() => {
    if (currentPage > 0) setCurrentPage((p) => p - 1);
  }, [currentPage]);

  const renderPage = () => {
    if (!page) return null;

    switch (page.pageType) {
      case 'cover':
        return (
          <div className={`flex-1 ${levelBg} flex flex-col items-center justify-center p-8 text-white relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/15" />
            <div className="relative text-center">
              <h2 className="font-child text-3xl font-bold leading-snug mb-4 drop-shadow-md">
                {page.textContent}
              </h2>
              <span className="text-sm opacity-80 bg-white/20 backdrop-blur-sm px-4 py-1.5 rounded-full">
                Level {book.level} · {book.subLevel}
              </span>
            </div>
          </div>
        );

      case 'guide':
        return (
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-4">Guide for Grown-Ups</h3>
            <div className="space-y-3">
              {page.textContent?.split('\n\n').map((para, i) => (
                <p key={i} className="text-sm text-muted-foreground leading-relaxed">
                  {para}
                </p>
              ))}
            </div>
          </div>
        );

      case 'reference':
        return (
          <div className="flex-1 p-6 overflow-y-auto">
            <h3 className="text-lg font-bold text-foreground mb-4">Sounds Reference</h3>
            <div className="flex flex-wrap gap-3 mb-6">
              {book.focusSounds.map((sound) => (
                <span
                  key={sound}
                  className={`font-child text-xl font-bold px-4 py-3 rounded-xl ${levelBg} text-white shadow-card`}
                >
                  {sound}
                </span>
              ))}
            </div>
            {book.storyWords.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-foreground mb-2">Story Words</h4>
                <div className="flex flex-wrap gap-2 mb-4">
                  {book.storyWords.map((word) => (
                    <span key={word} className="font-child text-base bg-muted px-3 py-1.5 rounded-lg">
                      {word}
                    </span>
                  ))}
                </div>
              </>
            )}
            {book.trickyWords.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-foreground mb-2">Tricky Words</h4>
                <div className="flex flex-wrap gap-2">
                  {book.trickyWords.map((word) => (
                    <span key={word} className="font-child text-base bg-tint-orange text-foreground px-3 py-1.5 rounded-lg">
                      {word}
                    </span>
                  ))}
                </div>
              </>
            )}
          </div>
        );

      case 'story':
        return (
          <div className="flex-1 flex flex-col">
            <div className="p-6 pt-8">
              <p className={`font-child ${fontSize} font-bold text-foreground leading-relaxed text-center`}>
                {page.textContent}
              </p>
            </div>
            <div className="flex-1 bg-muted mx-4 mb-4 rounded-2xl flex items-center justify-center border border-border">
              <div className="text-center text-muted-foreground">
                <Palette className="w-10 h-10 mx-auto mb-2 opacity-40" />
                <p className="text-xs font-medium">Illustration</p>
              </div>
            </div>
          </div>
        );

      case 'certificate':
        return (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-20 h-20 rounded-2xl bg-tint-pink flex items-center justify-center mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-10 h-10 text-primary">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
              </svg>
            </div>
            <h3 className="font-child text-2xl font-bold text-foreground mb-2">
              Reading Star!
            </h3>
            <p className="text-muted-foreground text-sm mb-6">
              Well done for reading<br />
              <span className="font-bold text-foreground">{book.title}</span>
            </p>
            <div className={`${levelBg} text-white px-6 py-3 rounded-xl font-bold shadow-card`}>
              Certificate Complete
            </div>
          </div>
        );

      case 'back_cover':
        return (
          <div className={`flex-1 ${levelBg} flex flex-col items-center justify-center p-8 text-white text-center relative overflow-hidden`}>
            <div className="absolute inset-0 bg-gradient-to-b from-white/10 to-black/15" />
            <div className="relative">
              <p className="text-sm opacity-80 mb-4">{page.textContent}</p>
              <p className="font-bold text-lg">Explore more books</p>
            </div>
          </div>
        );

      default:
        return (
          <div className="flex-1 flex items-center justify-center p-6">
            <p className="text-muted-foreground">{page.textContent}</p>
          </div>
        );
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col">
      {/* Reader header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-card shadow-card">
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors duration-200">
          <X className="w-5 h-5" />
        </button>
        <span className="text-xs font-bold text-muted-foreground">
          {currentPage + 1} / {pages.length}
        </span>
        <div className="flex gap-1">
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors duration-200 opacity-40" title="Read aloud (coming soon)">
            <Volume2 className="w-5 h-5" />
          </button>
          <button className="p-1.5 rounded-lg hover:bg-muted transition-colors duration-200 opacity-40" title="Bookmark">
            <Bookmark className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Page content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {renderPage()}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-border bg-card">
        <button
          onClick={goPrev}
          disabled={currentPage === 0}
          className="p-2.5 rounded-xl bg-muted hover:bg-accent disabled:opacity-30 transition-all duration-200"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        {/* Page dots */}
        <div className="flex gap-1 max-w-[200px] overflow-hidden">
          {pages.map((_, i) => (
            <div
              key={i}
              className={`w-2 h-2 rounded-full transition-all duration-200 ${
                i === currentPage ? `${levelBg} scale-125` : 'bg-muted'
              }`}
            />
          ))}
        </div>

        <button
          onClick={goNext}
          className={`p-2.5 rounded-xl transition-all duration-200 ${
            currentPage === pages.length - 1
              ? `${levelBg} text-white shadow-sm`
              : 'bg-muted hover:bg-accent'
          }`}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}