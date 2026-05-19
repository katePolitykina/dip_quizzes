import React from 'react';
import { QuizCard } from './QuizCard';
import type { QuizSnippet } from './QuizCard';
import { EmptyState } from './EmptyState';
import { useI18n } from '../../i18n/I18nProvider';

interface QuizLibraryProps {
  quizzes: QuizSnippet[];
  onHostGame: (quizId: string, quizTitle: string) => void;
  onEditQuiz: (quizId: string) => void;
  onDeleteQuiz: (quizId: string, quizTitle: string) => void;
}

export const QuizLibrary: React.FC<QuizLibraryProps> = ({ quizzes, onHostGame, onEditQuiz, onDeleteQuiz }) => {
  const { messages } = useI18n();
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-text-primary tracking-tight">{messages.dashboard.myQuizzes}</h2>
        {quizzes.length > 0 && (
          <span className="text-sm font-semibold text-text-muted bg-background px-3 py-1 rounded-full border border-border">
            {messages.dashboard.quizTotal(quizzes.length)}
          </span>
        )}
      </div>

      {quizzes.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="flex flex-col gap-4">
          {quizzes.map((quiz) => (
            <QuizCard
              key={quiz.id}
              quiz={quiz}
              onHostGame={onHostGame}
              onEditQuiz={onEditQuiz}
              onDeleteQuiz={onDeleteQuiz}
            />
          ))}
        </div>
      )}
    </div>
  );
};
