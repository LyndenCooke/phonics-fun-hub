import { useState } from 'react';
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import BookReader from '@/components/BookReader';
import ComprehensionQuiz from '@/components/ComprehensionQuiz';
import LevelFilter from '@/components/LevelFilter';
import { LEVEL_1_BOOKS, SAMPLE_QUIZ_QUESTIONS } from '@/lib/bookData';
import { Book } from '@/lib/types';
import { BookOpen } from 'lucide-react';

export default function Index() {
  const [books] = useState<Book[]>(LEVEL_1_BOOKS);
  const [selectedLevel, setSelectedLevel] = useState<number | null>(null);
  const [activeBook, setActiveBook] = useState<Book | null>(null);
  const [showQuiz, setShowQuiz] = useState(false);

  const filteredBooks = selectedLevel
    ? books.filter((b) => b.level === selectedLevel)
    : books;

  const quizQuestions = activeBook
    ? SAMPLE_QUIZ_QUESTIONS.filter((q) => q.bookId === activeBook.id)
    : [];

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

  if (activeBook) {
    return (
      <BookReader
        book={activeBook}
        onClose={() => setActiveBook(null)}
        onFinish={() => {
          if (quizQuestions.length > 0) {
            setShowQuiz(true);
          } else {
            setActiveBook(null);
          }
        }}
      />
    );
  }

  return (
    <Layout>
      <div className="px-4 pt-5 pb-2 max-w-2xl mx-auto">
        {/* Greeting */}
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold text-foreground tracking-tight">My Library</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Tap a book to start reading
          </p>
        </div>

        {/* Level filter */}
        <div className="mb-5">
          <LevelFilter selected={selectedLevel} onSelect={setSelectedLevel} />
        </div>

        {/* Free sample banner */}
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

        {/* Book grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} onSelect={setActiveBook} />
          ))}
        </div>

        {filteredBooks.length === 0 && (
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