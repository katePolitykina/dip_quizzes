import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Plus } from 'lucide-react';
import { useQuiz, createEmptyQuestion } from '../../context/QuizContext';
import { SortableQuestionItem } from './SortableQuestionItem';
import { useI18n } from '../../i18n/I18nProvider';

export const LeftPanel: React.FC = () => {
  const { state, dispatch } = useQuiz();
  const { messages } = useI18n();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = state.questions.findIndex((q) => q.id === active.id);
      const newIndex = state.questions.findIndex((q) => q.id === over.id);

      dispatch({
        type: 'REORDER_QUESTIONS',
        payload: arrayMove(state.questions, oldIndex, newIndex),
      });
    }
  };

  const handleAddQuestion = () => {
    const newQuestion = createEmptyQuestion(`q-${crypto.randomUUID()}`);
    dispatch({ type: 'ADD_QUESTION', payload: newQuestion });
  };

  return (
    <div className="m-4 mr-0 flex h-full w-80 flex-col overflow-hidden rounded-[24px] card">
      <div className="border-b border-border p-4">
        <p className="section-label">{messages.editor.structure}</p>
        <h2 className="text-lg font-bold text-text-primary">{messages.editor.questions}</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={state.questions.map((q) => q.id)}
            strategy={verticalListSortingStrategy}
          >
            {state.questions.map((question, index) => (
              <SortableQuestionItem
                key={question.id}
                question={question}
                index={index}
                isActive={state.activeQuestionId === question.id}
                onSelect={(id) => dispatch({ type: 'SET_ACTIVE_QUESTION', payload: id })}
                onDelete={(id) => {
                  if (state.questions.length > 1) {
                    dispatch({ type: 'DELETE_QUESTION', payload: id });
                  } else {
                    alert(messages.editor.minimumOneQuestion);
                  }
                }}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          onClick={handleAddQuestion}
          className="empty-dashed mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] py-3 text-text-muted transition-all duration-200 hover:bg-[rgba(255,255,255,0.45)] hover:text-[var(--color-indigo)]"
        >
          <Plus size={20} />
          <span className="font-bold">{messages.editor.addQuestion}</span>
        </button>
      </div>
    </div>
  );
};
