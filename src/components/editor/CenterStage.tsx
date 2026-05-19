import React, { useCallback, useRef, useState } from 'react';
import { UploadCloud, Image as ImageIcon, X } from 'lucide-react';
import { useQuiz } from '../../context/QuizContext';
import { AnswerCard } from './AnswerCard';
import { resolveAssetUrl } from '../../lib/assetUrl';
import { useI18n } from '../../i18n/I18nProvider';

export const CenterStage: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const { messages } = useI18n();
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const activeQuestion = state.questions.find(
    (q) => q.id === state.activeQuestionId
  );

  const applyImageFile = useCallback((file: File | null) => {
    if (!file || !file.type.startsWith('image/') || !activeQuestion) {
      return;
    }

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
  }, [activeQuestion, dispatch]);

  const onDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>) => {
      e.preventDefault();
      setIsDragOver(false);

      applyImageFile(e.dataTransfer.files[0] ?? null);
    },
    [applyImageFile]
  );

  if (!activeQuestion) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-gray-500 font-medium text-lg">{messages.editor.selectQuestionToEdit}</p>
      </div>
    );
  }

  return (
    <div className="custom-scrollbar flex flex-1 flex-col items-center overflow-y-auto p-8">
      <div className="w-full max-w-4xl flex flex-col gap-8">
        <div className="w-full card overflow-hidden transition-all focus-within:border-[var(--color-indigo)] focus-within:ring-1 focus-within:ring-[var(--color-indigo)]">
          <textarea
            value={activeQuestion.text}
            onChange={(e) =>
              dispatch({
                type: 'UPDATE_QUESTION',
                payload: { id: activeQuestion.id, updates: { text: e.target.value } },
              })
            }
            placeholder={messages.editor.startTypingQuestion}
            className="h-32 w-full resize-none bg-transparent p-6 text-center text-2xl font-black text-[var(--color-text-primary)] outline-none placeholder-[var(--color-text-muted)]"
          />
        </div>

        <div className="flex justify-center">
          <div
            onClick={() => fileInputRef.current?.click()}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={onDrop}
            className={`relative flex h-56 w-full max-w-lg flex-col items-center justify-center overflow-hidden rounded-[22px] border-2 border-dashed transition-all
              ${
                isDragOver
                  ? 'border-[var(--color-indigo)] bg-[rgba(214,194,255,0.18)] scale-[1.02]'
                  : 'empty-dashed card hover:bg-[rgba(255,255,255,0.64)]'
              }
            `}
          >
            {activeQuestion.image ? (
              <>
                <img
                  src={resolveAssetUrl(activeQuestion.image)}
                  alt={messages.editor.questionMediaAlt}
                  className="w-full h-full object-contain p-2"
                />
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    dispatch({
                      type: 'UPDATE_QUESTION',
                      payload: { id: activeQuestion.id, updates: { image: undefined } },
                    });
                  }}
                  type="button"
                  className="btn-secondary btn-glass absolute right-2 top-2 min-h-0 rounded-full p-2 text-[var(--color-error)]"
                >
                  <X size={18} />
                </button>
              </>
            ) : (
              <>
                <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[rgba(255,255,255,0.72)] text-[var(--color-indigo)]">
                  {isDragOver ? <UploadCloud size={32} /> : <ImageIcon size={32} />}
                </div>
                <p className="text-[var(--color-text-secondary)] font-medium">
                  {messages.editor.dragAndDropImage}
                </p>
                <p className="text-[var(--color-text-muted)] text-sm mt-1">{messages.editor.clickToUpload}</p>
              </>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                applyImageFile(e.target.files?.[0] ?? null);
                e.currentTarget.value = '';
              }}
            />
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
