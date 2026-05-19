import React from 'react';
import { Play, Pencil, Trash2 } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

export interface QuizSnippet {
  id: string;
  title: string;
  questionCount: number;
}

interface QuizCardProps {
  quiz: QuizSnippet;
  onHostGame: (quizId: string, quizTitle: string) => void;
  onEditQuiz: (quizId: string) => void;
  onDeleteQuiz: (quizId: string, quizTitle: string) => void;
}

export const QuizCard: React.FC<QuizCardProps> = ({ quiz, onHostGame, onEditQuiz, onDeleteQuiz }) => {
  const { messages } = useI18n();
  return (
    <div className="group card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 transition-all duration-200 hover:-translate-y-0.5">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-text-primary tracking-tight group-hover:text-indigo transition-colors duration-200">
          {quiz.title}
        </h3>
        <div className="inline-flex items-center">
          <span className="glass-inset px-2.5 py-1 rounded-full text-xs font-bold tracking-wide uppercase text-text-secondary">
            {messages.dashboard.quizCount(quiz.questionCount)}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <button
          onClick={() => onEditQuiz(quiz.id)}
          className="btn-secondary btn-glass flex flex-1 items-center justify-center gap-2 px-4 sm:flex-none"
        >
          <Pencil size={18} />
          <span className="sm:hidden md:inline">{messages.dashboard.edit}</span>
        </button>

        <button
          onClick={() => onDeleteQuiz(quiz.id, quiz.title)}
          className="btn-secondary btn-glass flex flex-1 items-center justify-center gap-2 px-4 text-error sm:flex-none"
          title={messages.dashboard.deleteQuizTitle}
        >
          <Trash2 size={18} />
          <span className="sm:hidden md:inline">{messages.dashboard.delete}</span>
        </button>

        <button
          onClick={() => onHostGame(quiz.id, quiz.title)}
          className="btn-secondary btn-aurora flex flex-1 items-center justify-center gap-2 px-5 sm:flex-none"
        >
          <Play size={18} fill="currentColor" />
          {messages.dashboard.hostGame}
        </button>
      </div>
    </div>
  );
};
