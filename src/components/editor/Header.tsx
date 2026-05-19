import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import type { Quiz } from '../../types/quiz';
import type { QuizAction } from '../../context/QuizContext';
import { useI18n } from '../../i18n/I18nProvider';

interface HeaderProps {
  onSave?: (quiz: Quiz, dispatch: React.Dispatch<QuizAction>) => void;
  isSaving?: boolean;
  saveError?: string | null;
}

export const Header: React.FC<HeaderProps> = ({ onSave, isSaving = false, saveError }) => {
  const { state, dispatch } = useQuiz();
  const { messages } = useI18n();
  const [titleInput, setTitleInput] = useState(state.title);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const isTitleValid = titleInput.length >= 3 && titleInput.length <= 100;

  useEffect(() => {
    setTitleInput(state.title);
  }, [state.title]);

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTitleInput(e.target.value);
    if (e.target.value.length >= 3 && e.target.value.length <= 100) {
      dispatch({ type: 'UPDATE_TITLE', payload: e.target.value });
    }
  };

  const handleSave = () => {
    if (!isTitleValid || !onSave) return;
    onSave(state, dispatch);
  };

  return (
    <header className="card relative z-[150] mx-4 mt-4 flex flex-col gap-4 border-b border-border p-4 xl:flex-row xl:items-center xl:justify-between">
      <div className="min-w-0 flex-1">
        <input
          type="text"
          value={titleInput}
          onChange={handleTitleChange}
          placeholder={messages.editor.quizTitle}
          className={`w-full max-w-lg border-b-2 bg-transparent px-2 py-1 text-2xl font-black outline-none transition-all duration-200 ${
            !isTitleValid && titleInput.length > 0
              ? 'border-error text-error'
              : 'border-transparent focus:border-[var(--color-indigo)]'
          }`}
        />
        {!isTitleValid && titleInput.length > 0 && (
          <p className="text-error text-xs mt-1 px-2 font-medium">
            {messages.editor.titleValidation}
          </p>
        )}
      </div>

      <div className="relative z-[120] flex flex-wrap items-center justify-end gap-3 xl:flex-nowrap">
        <div className="min-w-0 flex items-center gap-2 text-sm text-text-muted">
          {isSaving ? (
            <span className="animate-pulse font-medium">{messages.editor.saving}</span>
          ) : saveError ? (
            <>
              <AlertCircle size={16} className="text-error" />
              <span className="font-medium text-error">{saveError}</span>
            </>
          ) : state.lastSaved ? (
            <>
              <CheckCircle2 size={16} className="text-success" />
              <span className="font-medium">{messages.editor.saved}</span>
            </>
          ) : (
            <span className="font-medium">{messages.editor.notSaved}</span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!isTitleValid || isSaving}
          className="btn-secondary btn-cta flex shrink-0 items-center gap-2 px-4 disabled:cursor-not-allowed disabled:opacity-50"
        >
          <Save size={18} />
          {messages.editor.save}
        </button>

        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="btn-secondary btn-glass min-h-0 shrink-0 rounded-full p-2 text-text-muted"
        >
          <Settings size={20} />
        </button>

        {isSettingsOpen && (
          <div className="absolute right-0 bottom-full z-[200] mb-2 w-[min(16rem,calc(100vw-2rem))] card p-4 shadow-xl">
            <h3 className="font-bold text-text-primary mb-4">{messages.editor.quizSettings}</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex justify-between items-center text-sm font-medium text-text-secondary mb-1">
                  {messages.editor.globalTimer}
                  <span className="text-text-muted">{state.globalTimer}s</span>
                </label>
                <input
                  type="range"
                  min="10"
                  max="120"
                  value={state.globalTimer}
                  onChange={(e) =>
                    dispatch({
                      type: 'UPDATE_GLOBAL_SETTINGS',
                      payload: { globalTimer: parseInt(e.target.value, 10) },
                    })
                  }
                  className="w-full accent-indigo"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">
                  {messages.editor.cbmFull}
                </label>
                <button
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_GLOBAL_SETTINGS',
                      payload: { cbmEnabled: !state.cbmEnabled },
                    })
                  }
                  className={`w-11 h-6 rounded-full transition-colors duration-200 relative ${
                    state.cbmEnabled ? 'bg-indigo' : 'bg-border'
                  }`}
                >
                  <div
                    className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-200 ${
                      state.cbmEnabled ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
