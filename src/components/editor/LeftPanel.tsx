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

export const LeftPanel: React.FC = () => {
  const { state, dispatch } = useQuiz();

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
    <div className="w-80 flex flex-col bg-background border-r border-border h-full overflow-hidden">
      <div className="p-4 border-b border-border">
        <h2 className="text-lg font-bold text-text-primary">Questions</h2>
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
                    alert('You must have at least one question.');
                  }
                }}
              />
            ))}
          </SortableContext>
        </DndContext>

        <button
          onClick={handleAddQuestion}
          className="w-full mt-4 flex items-center justify-center gap-2 py-3 border-2 border-dashed border-border rounded-[12px] text-text-muted hover:border-indigo hover:text-indigo hover:bg-analyst-blue-bg transition-all duration-200"
        >
          <Plus size={20} />
          <span className="font-bold">Add Question</span>
        </button>
      </div>
    </div>
  );
};
