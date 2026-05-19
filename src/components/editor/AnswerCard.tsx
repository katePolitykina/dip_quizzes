import React from 'react';
import { Check } from 'lucide-react';
import type { Answer, AnswerColor } from '../../types/quiz';
import { useI18n } from '../../i18n/I18nProvider';

interface AnswerCardProps {
  answer: Answer;
  onChangeText: (text: string) => void;
  onToggleCorrect: () => void;
}

const colorMap: Record<AnswerColor, { bg: string; border: string; text: string }> = {
  red: {
    bg: 'bg-answer-red',
    border: 'border-white/90',
    text: 'text-[var(--color-text-primary)]',
  },
  blue: {
    bg: 'bg-answer-blue',
    border: 'border-white/90',
    text: 'text-[var(--color-text-primary)]',
  },
  yellow: {
    bg: 'bg-answer-yellow',
    border: 'border-white/90',
    text: 'text-[var(--color-text-primary)]',
  },
  green: {
    bg: 'bg-answer-green',
    border: 'border-white/90',
    text: 'text-[var(--color-text-primary)]',
  },
};

export const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  onChangeText,
  onToggleCorrect,
}) => {
  const { messages } = useI18n();
  const theme = colorMap[answer.color];

  return (
    <div
      className={`relative flex h-40 flex-col overflow-hidden rounded-[22px] border transition-all duration-200 shadow-[0_12px_30px_-18px_rgba(189,73,138,0.24)] ${theme.border} ${theme.bg}`}
    >
      <div className="flex-1 p-3 flex flex-col relative">
        <button
          onClick={onToggleCorrect}
          className={`absolute top-3 right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full border transition-all duration-200 shadow-md
            ${
              answer.isCorrect
                ? 'bg-[var(--color-midnight)] text-white border-white/90 scale-110'
                : 'bg-white/45 text-[var(--color-text-muted)] border-white/70 hover:bg-white/70'
            }
          `}
          title={messages.editor.markAsCorrect}
        >
          <Check size={18} strokeWidth={answer.isCorrect ? 4 : 2} />
        </button>

        <textarea
          value={answer.text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder={messages.editor.addAnswer}
          className={`h-full w-full resize-none bg-transparent px-2 pt-10 text-lg font-extrabold outline-none placeholder:text-[var(--color-text-muted)] ${theme.text}`}
        />
      </div>
    </div>
  );
};
