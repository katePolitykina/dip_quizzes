import React from 'react';
import { Check } from 'lucide-react';
import type { Answer, AnswerColor } from '../../types/quiz';

interface AnswerCardProps {
  answer: Answer;
  onChangeText: (text: string) => void;
  onToggleCorrect: () => void;
}

const colorMap: Record<AnswerColor, { bg: string; border: string; text: string }> = {
  red: {
    bg: 'bg-answer-red',
    border: 'border-answer-red',
    text: 'text-white',
  },
  blue: {
    bg: 'bg-answer-blue',
    border: 'border-answer-blue',
    text: 'text-white',
  },
  yellow: {
    bg: 'bg-answer-yellow',
    border: 'border-answer-yellow',
    text: 'text-yellow-900',
  },
  green: {
    bg: 'bg-answer-green',
    border: 'border-answer-green',
    text: 'text-white',
  },
};

export const AnswerCard: React.FC<AnswerCardProps> = ({
  answer,
  onChangeText,
  onToggleCorrect,
}) => {
  const theme = colorMap[answer.color];

  return (
    <div
      className={`relative rounded-[16px] h-40 shadow-sm border-2 overflow-hidden transition-all duration-200 flex flex-col ${theme.border} ${theme.bg}`}
    >
      <div className="flex-1 p-3 flex flex-col relative">
        {/* Correct toggle */}
        <button
          onClick={onToggleCorrect}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 shadow-md z-10
            ${
              answer.isCorrect
                ? 'bg-success text-white border-2 border-white scale-110'
                : 'bg-white/20 text-white/50 border-2 border-white/30 hover:bg-white/30'
            }
          `}
          title="Mark as correct"
        >
          <Check size={18} strokeWidth={answer.isCorrect ? 4 : 2} />
        </button>

        <textarea
          value={answer.text}
          onChange={(e) => onChangeText(e.target.value)}
          placeholder="Add answer..."
          className={`w-full h-full bg-transparent resize-none outline-none font-semibold text-lg pt-10 px-2 placeholder-white/60 ${theme.text}`}
        />
      </div>
    </div>
  );
};
