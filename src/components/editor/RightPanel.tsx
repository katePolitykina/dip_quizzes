import React from 'react';
import { Settings2, Clock, Hash } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';

export const RightPanel: React.FC = () => {
  const { state, dispatch } = useQuiz();

  const activeQuestion = state.questions.find(
    (q) => q.id === state.activeQuestionId
  );

  if (!activeQuestion) {
    return (
      <div className="w-72 bg-white border-l border-gray-200 h-full p-6 flex items-center justify-center text-gray-400">
        <p className="text-sm text-center">No question selected</p>
      </div>
    );
  }

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    dispatch({
      type: 'UPDATE_QUESTION',
      payload: {
        id: activeQuestion.id,
        updates: { weight: parseInt(e.target.value) },
      },
    });
  };

  const handleTimerOverrideChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    dispatch({
      type: 'UPDATE_QUESTION',
      payload: {
        id: activeQuestion.id,
        updates: { timerOverride: value ? parseInt(value) : undefined },
      },
    });
  };

  return (
    <div className="w-72 flex flex-col bg-[var(--color-surface)] border-l border-[var(--color-border)] h-full overflow-hidden">
      <div className="p-4 border-b border-[var(--color-border)] flex items-center gap-2 text-[var(--color-text-primary)]">
        <Settings2 size={20} />
        <h2 className="text-lg font-bold">Settings</h2>
      </div>

      <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
        {/* Weight / Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-semibold">
              <Hash size={18} />
              <label>Points</label>
            </div>
            <span className="bg-[var(--color-indigo-light)]/10 text-[var(--color-indigo)] px-2 py-0.5 rounded-md font-bold text-sm">
              {activeQuestion.weight} pt
            </span>
          </div>
          
          <input
            type="range"
            min="1"
            max="10"
            step="1"
            value={activeQuestion.weight}
            onChange={handleWeightChange}
            className="w-full accent-[var(--color-indigo)]"
          />
          <p className="text-xs text-[var(--color-text-muted)]">
            Adjust the weight of this question in the final score.
          </p>
        </div>

        <hr className="border-[var(--color-border-light)]" />

        {/* Timer Override */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-semibold mb-2">
            <Clock size={18} />
            <label>Question Timer</label>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="5"
              max="300"
              placeholder={state.globalTimer.toString()}
              value={activeQuestion.timerOverride || ''}
              onChange={handleTimerOverrideChange}
              className="w-24 px-3 py-2 border border-[var(--color-border)] rounded-lg focus:outline-none focus:ring-2 focus:ring-[var(--color-indigo)] focus:border-[var(--color-indigo)] transition-shadow bg-transparent"
            />
            <span className="text-[var(--color-text-muted)] font-medium">seconds</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            Override the global timer ({state.globalTimer}s) for this specific question. Leave empty to use global setting.
          </p>
        </div>
      </div>
    </div>
  );
};
