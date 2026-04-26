import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { Question } from '../../types/quiz';

interface SortableQuestionItemProps {
  question: Question;
  index: number;
  isActive: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}

export const SortableQuestionItem: React.FC<SortableQuestionItemProps> = ({
  question,
  index,
  isActive,
  onSelect,
  onDelete,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: question.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex items-center p-3 mb-2 rounded-[12px] border-2 cursor-pointer transition-all duration-200 ${
        isActive
          ? 'border-indigo bg-analyst-blue-bg'
          : 'border-transparent bg-surface hover:border-border'
      } ${isDragging ? 'opacity-50 z-50 shadow-xl' : 'shadow-sm'}`}
      onClick={() => onSelect(question.id)}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 mr-2 text-text-muted hover:text-text-secondary active:cursor-grabbing"
      >
        <GripVertical size={18} />
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="text-xs font-bold text-text-muted mb-1">
          Question {index + 1}
        </div>
        <div className="text-sm truncate text-text-primary font-medium">
          {question.text || 'Empty Question'}
        </div>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation();
          onDelete(question.id);
        }}
        className="opacity-0 group-hover:opacity-100 p-2 text-text-muted hover:text-error transition-all duration-200"
      >
        <Trash2 size={16} />
      </button>
    </div>
  );
};
