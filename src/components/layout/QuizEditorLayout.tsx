import React from 'react';
import { Header } from '../editor/Header';
import { LeftPanel } from '../editor/LeftPanel';
import { CenterStage } from '../editor/CenterStage';
import { RightPanel } from '../editor/RightPanel';
import { QuizProvider } from '../../context/QuizContext';
import type { Quiz } from '../../types/quiz';
import type { QuizAction } from '../../context/QuizContext';

interface QuizEditorLayoutProps {
  initialQuiz?: Quiz;
  onSave?: (quiz: Quiz, dispatch: React.Dispatch<QuizAction>) => void;
  isSaving?: boolean;
  saveError?: string | null;
}

export const QuizEditorLayout: React.FC<QuizEditorLayoutProps> = ({
  initialQuiz,
  onSave,
  isSaving,
  saveError,
}) => {
  return (
    <QuizProvider initialQuiz={initialQuiz}>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-white font-sans text-gray-900">
        <Header onSave={onSave} isSaving={isSaving} saveError={saveError} />
        <div className="flex-1 flex overflow-hidden">
          <LeftPanel />
          <CenterStage />
          <RightPanel />
        </div>
      </div>
    </QuizProvider>
  );
};
