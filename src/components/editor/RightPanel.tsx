import React from 'react';
import { Settings2, Clock, Hash } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { useI18n } from '../../i18n/I18nProvider';

export const RightPanel: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const { messages } = useI18n();

  const activeQuestion = state.questions.find(
    (q) => q.id === state.activeQuestionId
  );

  if (!activeQuestion) {
    return (
      <div className="card m-4 ml-0 flex h-full w-72 items-center justify-center p-6 text-gray-400">
        <p className="text-sm text-center">{messages.editor.noQuestionSelected}</p>
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
    <div className="card m-4 ml-0 flex h-full w-72 flex-col overflow-hidden">
      <div className="flex items-center gap-2 border-b border-[var(--color-border)] p-4 text-[var(--color-text-primary)]">
        <Settings2 size={20} />
        <div>
          <p className="section-label">{messages.editor.question}</p>
          <h2 className="text-lg font-bold">{messages.editor.settings}</h2>
        </div>
      </div>

      <div className="p-6 space-y-8 flex-1 overflow-y-auto custom-scrollbar">
        {/* Weight / Points */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-semibold">
              <Hash size={18} />
              <label>{messages.editor.points}</label>
            </div>
            <span className="glass-inset rounded-full px-2.5 py-1 text-sm font-bold text-[var(--color-indigo-dark)]">
              {messages.editor.pointsShort(activeQuestion.weight)}
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
            {messages.editor.adjustWeight}
          </p>
        </div>

        <hr className="border-[var(--color-border-light)]" />

        {/* Timer Override */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 text-[var(--color-text-secondary)] font-semibold mb-2">
            <Clock size={18} />
            <label>{messages.editor.questionTimer}</label>
          </div>
          
          <div className="flex items-center gap-3">
            <input
              type="number"
              min="5"
              max="300"
              placeholder={state.globalTimer.toString()}
              value={activeQuestion.timerOverride || ''}
              onChange={handleTimerOverrideChange}
              className="glass-input w-24 px-3 py-2"
            />
            <span className="text-[var(--color-text-muted)] font-medium">{messages.editor.seconds}</span>
          </div>
          <p className="text-xs text-[var(--color-text-muted)] leading-relaxed">
            {messages.editor.overrideGlobalTimer(state.globalTimer)}
          </p>
        </div>
      </div>
    </div>
  );
};
