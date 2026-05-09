import React, { useCallback, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { AnswerCard } from './AnswerCard';
import { resolveAssetUrl } from '../../lib/assetUrl';

export const CenterStage: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const [isDragOver, setIsDragOver] = useState(false);

  const activeQuestion = state.questions.find(
    (q) => q.id === state.activeQuestionId
  );

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      if (!activeQuestion) return;

      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = () => {
          dispatch({
            type: 'UPDATE_QUESTION',
            payload: {
              id: activeQuestion.id,
              updates: { image: reader.result as string },
            },
          });
        };
        reader.readAsDataURL(file);
      }
    },
    [activeQuestion, dispatch]
  );

  if (!activeQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center bg-gray-100">
        <p className="text-gray-500 font-medium text-lg">Select a question to edit</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[var(--color-background)] overflow-y-auto p-8 items-center custom-scrollbar">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        
        {/* Main Input */}
        <div className="w-full card overflow-hidden focus-within:border-[var(--color-indigo)] focus-within:ring-1 focus-within:ring-[var(--color-indigo)] transition-all">
          <textarea
            value={activeQuestion.text}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_QUESTION',
                payload: { id: activeQuestion.id, updates: { text: e.target.value } },
              })
            }
            placeholder="Start typing your question..."
            className="w-full h-32 p-6 text-2xl text-center resize-none outline-none text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] font-semibold bg-transparent"
          />
        </div>

        {/* Media Slot */}
        <div className="flex justify-center">
          <div
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            className={`relative w-full max-w-lg h-56 card border-2 border-dashed flex flex-col items-center justify-center transition-all overflow-hidden
              ${
                isDragOver
                  ? 'border-[var(--color-indigo)] bg-[var(--color-indigo-light)]/10 scale-[1.02]'
                  : 'border-[var(--color-border)] hover:border-[var(--color-indigo-light)] hover:bg-[var(--color-surface)]'
              }
            `}
          >
            {activeQuestion.image ? (
              <>
                <img
                  src={resolveAssetUrl(activeQuestion.image)}
                  alt="Question media"
                  className="w-full h-full object-contain p-2"
                />
                <button
                  onClick={() =>
                    dispatch({
                      type: 'UPDATE_QUESTION',
                      payload: { id: activeQuestion.id, updates: { image: undefined } },
                    })
                  }
                  className="absolute top-2 right-2 p-2 bg-white/80 hover:bg-white rounded-full text-[var(--color-error)] shadow-sm transition-colors"
                >
                  <X size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="w-16 h-16 bg-[var(--color-indigo-light)]/10 text-[var(--color-indigo)] rounded-full flex items-center justify-center mb-4">
                  {isDragOver ? <UploadCloud size={32} /> : <ImageIcon size={32} />}
                </div>
                <p className="text-[var(--color-text-secondary)] font-medium">
                  Drag and drop an image here
                </p>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">or click to upload</p>
                {/* Optional hidden file input can go here */}
              </>
            )}
          </div>
        </div>

        {/* Answer Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {activeQuestion.answers.map((answer) => (
            <AnswerCard
              key={answer.id}
              answer={answer}
              onChangeText={(text) =>
                dispatch({
                  type: 'UPDATE_ANSWER',
                  payload: {
                    questionId: activeQuestion.id,
                    answerId: answer.id,
                    updates: { text },
                  },
                })
              }
              onToggleCorrect={() =>
                dispatch({
                  type: 'UPDATE_ANSWER',
                  payload: {
                    questionId: activeQuestion.id,
                    answerId: answer.id,
                    updates: { isCorrect: !answer.isCorrect },
                  },
                })
              }
            />
          ))}
        </div>

      </div>
    </div>
  );
};
