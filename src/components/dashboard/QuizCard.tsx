import React from 'react';
import { Play, Pencil, Trash2 } from 'lucide-react';

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
  return (
    <div className="group card p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:shadow-md transition-all duration-200">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-text-primary tracking-tight group-hover:text-indigo transition-colors duration-200">
          {quiz.title}
        </h3>
        <div className="inline-flex items-center">
          <span className="px-2.5 py-1 rounded-[8px] bg-background text-text-secondary text-xs font-bold tracking-wide uppercase">
            {quiz.questionCount} {quiz.questionCount === 1 ? 'Question' : 'Questions'}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2 w-full sm:w-auto shrink-0">
        <button
          onClick={() => onEditQuiz(quiz.id)}
          className="btn-secondary flex items-center justify-center gap-2 px-4 bg-background text-text-secondary border border-border rounded-[12px] hover:bg-border-light hover:text-text-primary active:scale-95 transition-all duration-200 flex-1 sm:flex-none"
        >
          <Pencil size={18} />
          <span className="sm:hidden md:inline">Edit</span>
        </button>

        <button
          onClick={() => onDeleteQuiz(quiz.id, quiz.title)}
          className="btn-secondary flex items-center justify-center gap-2 px-4 bg-white text-error border border-border rounded-[12px] hover:bg-error/10 active:scale-95 transition-all duration-200 flex-1 sm:flex-none"
          title="Delete quiz"
        >
          <Trash2 size={18} />
          <span className="sm:hidden md:inline">Delete</span>
        </button>

        <button
          onClick={() => onHostGame(quiz.id, quiz.title)}
          className="btn-secondary flex items-center justify-center gap-2 px-5 bg-teal text-white rounded-[12px] hover:bg-teal-dark active:scale-95 transition-all duration-200 flex-1 sm:flex-none"
        >
          <Play size={18} fill="currentColor" />
          Host Game
        </button>
      </div>
    </div>
  );
};
