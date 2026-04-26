import React from 'react';
import { Header } from '../editor/Header';
import { LeftPanel } from '../editor/LeftPanel';
import { CenterStage } from '../editor/CenterStage';
import { RightPanel } from '../editor/RightPanel';
import { QuizProvider } from '../../context/QuizContext';

export const QuizEditorLayout: React.FC = () => {
  return (
    <QuizProvider>
      <div className="h-screen w-screen flex flex-col overflow-hidden bg-white font-sans text-gray-900">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <LeftPanel />
          <CenterStage />
          <RightPanel />
        </div>
      </div>
    </QuizProvider>
  );
};
