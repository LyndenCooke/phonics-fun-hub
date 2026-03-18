import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import BookReader from '@/components/BookReader';
import ComprehensionQuiz from '@/components/ComprehensionQuiz';
import LevelFilter from '@/components/LevelFilter';
import { useBooks, useUserBooks, useBookPages, useQuizQuestions } from '@/hooks/useBooks';
import { useAuth } from '@/contexts/AuthContext';
import { BookOpen } from 'lucide-react';
import type { Book } from '@/lib/types';

export default function Index() {
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [activeBookId, setActiveBookId] = useState<string | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: booksData, isLoading: booksLoading } = useBooks(selectedLevel);
  const { data: userBooksData } = useUserBooks();
  const { data: pagesData } = useBookPages(activeBookId);
  const { data: quizData } = useQuizQuestions(activeBookId);

  const userBooksMap = new Map((userBooksData ?? []).map(ub => [ub.book_id, ub]));

  // Transform DB books to the Book interface used by components
  const books: Book[] = (booksData ?? []).map(b => {
    const ub = userBooksMap.get(b.id);
    return {
      id: b.id,
      level: b.level,
      subLevel: b.sub_level,
      title: b.title,
      slug: b.slug,
      focusSounds: b.focus_sounds,
      trickyWords: b.tricky_words ?? [],
      storyWords: b.story_words ?? [],
      coverImageUrl: b.cover_image_url ?? undefined,
      pdfUrl: b.pdf_url ?? undefined,
      pageCount: b.page_count ?? 16,
      sortOrder: b.sort_order,
      unlocked: !!ub || (b.is_free_sample ?? false),
      completed: !!ub?.completed_at,
      lastPageRead: ub?.last_page_read ?? 0,
      pages: (pagesData && activeBookId === b.id)
        ? pagesData.map(p => ({
            id: p.id,
            pageNumber: p.page_number,
            pageType: p.page_type as Book['pages'][0]['pageType'],
            textContent: p.text_content ?? undefined,
            imageUrl: p.image_url ?? undefined,
          }))
        : [],
    };
  });

  const activeBook = activeBookId ? books.find(b => b.id === activeBookId) ?? null : null;

  const quizQuestions = (quizData ?? []).map(q => ({
    id: q.id,
    bookId: q.book_id,
    quizType: q.quiz_type as 'comprehension' | 'word_reading' | 'sound_matching',
    questionText: q.question_text,
    options: Array.isArray(q.options) ? (q.options as string[]) : [],
    correctAnswer: q.correct_answer,
    sortOrder: q.sort_order,
  }));

  if (showQuiz && activeBook && quizQuestions.length > 0) {
    return (
      <ComprehensionQuiz
        questions={quizQuestions}
        bookTitle={activeBook.title}
        levelColor="bg-level-1"
        onComplete={(score, total) => {
          console.log(`Quiz complete: ${score}/${total}`);
        }}
        onClose={() => setShowQuiz(false)}
      />
    );
  }

  if (activeBook && activeBook.pages.length > 0) {
    return (
      <BookReader
        book={activeBook}
        onClose={() => setActiveBookId(null)}
        onFinish={() => {
          if (quizQuestions.length > 0) {
            setShowQuiz(true);
          } else {
            setActiveBookId(null);
          }
        }}
      />
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-5 pb-2 max-w-2xl mx-auto">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">My Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tap a book to start reading
          </p>
        </div>

        <div className="mb-5">
          <LevelFilter selected={selectedLevel} onSelect={setSelectedLevel} />
        </div>

        {!user && (
          <div className="mb-5 bg-card rounded-xl p-4 flex items-start gap-3 shadow-card border-l-4 border-primary">
            <div className="w-8 h-8 rounded-lg bg-tint-pink flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Sign in to access your library</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                Create a free account to get your first books
              </p>
              <button
                onClick={() => navigate('/auth')}
                className="mt-2 text-xs font-bold text-primary"
              >
                Sign In / Sign Up →
              </button>
            </div>
          </div>
        )}

        {user && (
          <div className="mb-5 bg-card rounded-xl p-4 flex items-start gap-3 shadow-card border-l-4 border-primary">
            <div className="w-8 h-8 rounded-lg bg-tint-pink flex items-center justify-center shrink-0 mt-0.5">
              <BookOpen className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-foreground">Your free books</p>
              <p className="text-xs text-muted-foreground mt-0.5">
                The first two Level 1 books are free for all users
              </p>
              <span className="inline-block mt-1.5 text-[10px] font-bold bg-level-1 text-white px-2 py-0.5 rounded-full">
                Level 1
              </span>
            </div>
          </div>
        )}

        {booksLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="aspect-[3/4] rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {books.map((book) => (
              <BookCard
                key={book.id}
                book={book}
                onSelect={(b) => {
                  if (!b.unlocked && !user) {
                    navigate('/auth');
                    return;
                  }
                  setActiveBookId(b.id);
                }}
              />
            ))}
          </div>
        )}

        {!booksLoading && books.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-3">
              <BookOpen className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">No books found for this level yet</p>
            <p className="text-xs text-muted-foreground mt-1">Check back soon for new releases</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
