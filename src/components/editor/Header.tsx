import React, { useState, useEffect } from 'react';
import { Settings, Save, CheckCircle2 } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';

export const Header: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const [titleInput, setTitleInput] = useState(state.title);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

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
    if (!isTitleValid) return;
    setIsSaving(true);
    setTimeout(() => {
      dispatch({ type: 'SET_LAST_SAVED', payload: new Date().toISOString() });
      setIsSaving(false);
    }, 1000);
  };

  return (
    <header className="flex items-center justify-between p-4 bg-surface border-b border-border">
      <div className="flex-1">
        <input
          type="text"
          value={titleInput}
          onChange={handleTitleChange}
          placeholder="Quiz Title"
          className={`text-2xl font-bold bg-transparent border-b-2 outline-none px-2 py-1 transition-all duration-200 w-full max-w-lg ${
            !isTitleValid && titleInput.length > 0
              ? 'border-error text-error'
              : 'border-transparent focus:border-indigo'
          }`}
        />
        {!isTitleValid && titleInput.length > 0 && (
          <p className="text-error text-xs mt-1 px-2 font-medium">
            Title must be between 3 and 100 characters.
          </p>
        )}
      </div>

      <div className="flex items-center gap-4 relative">
        <div className="flex items-center gap-2 text-sm text-text-muted">
          {isSaving ? (
            <span className="animate-pulse font-medium">Saving...</span>
          ) : state.lastSaved ? (
            <>
              <CheckCircle2 size={16} className="text-success" />
              <span className="font-medium">Saved</span>
            </>
          ) : (
            <span className="font-medium">Not saved</span>
          )}
        </div>

        <button
          onClick={handleSave}
          disabled={!isTitleValid || isSaving}
          className="btn-secondary flex items-center gap-2 px-4 bg-indigo text-white rounded-[12px] hover:bg-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200"
        >
          <Save size={18} />
          Save
        </button>

        <button
          onClick={() => setIsSettingsOpen(!isSettingsOpen)}
          className="p-2 text-text-muted hover:bg-background hover:text-text-primary rounded-[12px] transition-all duration-200"
        >
          <Settings size={20} />
        </button>

        {isSettingsOpen && (
          <div className="absolute top-full right-0 mt-2 w-64 card shadow-xl p-4 z-50">
            <h3 className="font-bold text-text-primary mb-4">Quiz Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="flex justify-between items-center text-sm font-medium text-text-secondary mb-1">
                  Global Timer
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
                      payload: { timer: parseInt(e.target.value) },
                    })
                  }
                  className="w-full accent-indigo"
                />
              </div>

              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-text-secondary">
                  CBM (Certainty Based Marking)
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
