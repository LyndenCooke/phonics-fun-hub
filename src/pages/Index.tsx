import { useState } from 'react';
import Layout from '@/components/Layout';
import BookCard from '@/components/BookCard';
import BookReader from '@/components/BookReader';
import ComprehensionQuiz from '@/components/ComprehensionQuiz';
import LevelFilter from '@/components/LevelFilter';
import { LEVEL_1_BOOKS, SAMPLE_QUIZ_QUESTIONS } from '@/lib/bookData';
import { Book } from '@/lib/types';

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
      <div className="px-4 pt-4 pb-2">
        {/* Greeting */}
        <div className="mb-4">
          <h2 className="text-xl font-bold text-foreground">My Library 📚</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Tap a book to start reading
          </p>
        </div>

        {/* Level filter */}
        <div className="mb-4">
          <LevelFilter selected={selectedLevel} onSelect={setSelectedLevel} />
        </div>

        {/* Free sample badge */}
        <div className="mb-4 bg-primary/10 border border-primary/20 rounded-xl p-3 flex items-center gap-3">
          <span className="text-2xl">🎁</span>
          <div>
            <p className="text-sm font-semibold text-foreground">Free sample books</p>
            <p className="text-xs text-muted-foreground">
              The first two Level 1 books are free for all users!
            </p>
          </div>
        </div>

        {/* Book grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {filteredBooks.map((book) => (
            <BookCard key={book.id} book={book} onSelect={setActiveBook} />
          ))}
        </div>

        {filteredBooks.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-4xl mb-2">📖</p>
            <p className="text-sm">No books found for this level yet.</p>
          </div>
        )}
      </div>
    </Layout>
  );
}
