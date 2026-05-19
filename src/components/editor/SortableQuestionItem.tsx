import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical, Trash2 } from 'lucide-react';
import type { Question } from '../../types/quiz';
import { useI18n } from '../../i18n/I18nProvider';

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
  const { messages } = useI18n();
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
    <div ref={setNodeRef} style={style} className={`${isDragging ? 'opacity-50 z-50' : ''}`}>
      <div className={isActive ? 'chromatic-border mb-2' : 'mb-2'}>
        <div
          className={`relative group flex items-center rounded-[20px] p-3 cursor-pointer transition-all duration-200 ${
            isActive
              ? 'card'
              : 'card bg-[rgba(255,255,255,0.42)] hover:bg-[rgba(255,255,255,0.6)]'
          } ${isDragging ? 'shadow-xl' : ''}`}
          onClick={() => onSelect(question.id)}
        >
          <div
            {...attributes}
            {...listeners}
            className="mr-2 cursor-grab p-1 text-text-muted hover:text-text-secondary active:cursor-grabbing"
          >
            <GripVertical size={18} />
          </div>

          <div className="flex-1 overflow-hidden">
            <div className="section-label mb-1">
              {messages.editor.questionLabel(index + 1)}
            </div>
            <div className="truncate text-sm font-extrabold text-text-primary">
              {question.text || messages.editor.emptyQuestion}
            </div>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onDelete(question.id);
            }}
            className="p-2 text-text-muted opacity-0 transition-all duration-200 group-hover:opacity-100 hover:text-error"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};
