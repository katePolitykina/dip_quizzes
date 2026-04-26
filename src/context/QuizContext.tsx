import React, { createContext, useContext, useReducer, type ReactNode } from 'react';
import type { Quiz, Question, Answer } from '../types/quiz';

type QuizAction =
  | { type: 'UPDATE_TITLE'; payload: string }
  | { type: 'UPDATE_GLOBAL_SETTINGS'; payload: { timer?: number; cbmEnabled?: boolean } }
  | { type: 'SET_ACTIVE_QUESTION'; payload: string | null }
  | { type: 'ADD_QUESTION'; payload: Question }
  | { type: 'UPDATE_QUESTION'; payload: { id: string; updates: Partial<Question> } }
  | { type: 'DELETE_QUESTION'; payload: string }
  | { type: 'REORDER_QUESTIONS'; payload: Question[] }
  | { type: 'UPDATE_ANSWER'; payload: { questionId: string; answerId: string; updates: Partial<Answer> } }
  | { type: 'SET_LAST_SAVED'; payload: string };

const createEmptyQuestion = (id: string): Question => ({
  id,
  text: '',
  answers: [
    { id: `ans-${crypto.randomUUID()}`, text: '', isCorrect: false, color: 'red' },
    { id: `ans-${crypto.randomUUID()}`, text: '', isCorrect: false, color: 'blue' },
    { id: `ans-${crypto.randomUUID()}`, text: '', isCorrect: false, color: 'yellow' },
    { id: `ans-${crypto.randomUUID()}`, text: '', isCorrect: false, color: 'green' },
  ],
  weight: 1,
});

const initialQuestionId = `q-${crypto.randomUUID()}`;

const initialState: Quiz = {
  title: '',
  globalTimer: 30,
  cbmEnabled: false,
  questions: [createEmptyQuestion(initialQuestionId)],
  activeQuestionId: initialQuestionId,
  lastSaved: null,
};

function quizReducer(state: Quiz, action: QuizAction): Quiz {
  switch (action.type) {
    case 'UPDATE_TITLE':
      return { ...state, title: action.payload };
    case 'UPDATE_GLOBAL_SETTINGS':
      return { ...state, ...action.payload };
    case 'SET_ACTIVE_QUESTION':
      return { ...state, activeQuestionId: action.payload };
    case 'ADD_QUESTION':
      return {
        ...state,
        questions: [...state.questions, action.payload],
        activeQuestionId: action.payload.id,
      };
    case 'UPDATE_QUESTION':
      return {
        ...state,
        questions: state.questions.map((q) =>
          q.id === action.payload.id ? { ...q, ...action.payload.updates } : q
        ),
      };
    case 'DELETE_QUESTION':
      const newQuestions = state.questions.filter((q) => q.id !== action.payload);
      return {
        ...state,
        questions: newQuestions,
        activeQuestionId:
          state.activeQuestionId === action.payload
            ? newQuestions[0]?.id || null
            : state.activeQuestionId,
      };
    case 'REORDER_QUESTIONS':
      return { ...state, questions: action.payload };
    case 'UPDATE_ANSWER':
      return {
        ...state,
        questions: state.questions.map((q) => {
          if (q.id !== action.payload.questionId) return q;
          return {
            ...q,
            answers: q.answers.map((a) =>
              a.id === action.payload.answerId ? { ...a, ...action.payload.updates } : a
            ),
          };
        }),
      };
    case 'SET_LAST_SAVED':
      return { ...state, lastSaved: action.payload };
    default:
      return state;
  }
}

const QuizContext = createContext<{
  state: Quiz;
  dispatch: React.Dispatch<QuizAction>;
} | null>(null);

export const QuizProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(quizReducer, initialState);

  return (
    <QuizContext.Provider value={{ state, dispatch }}>
      {children}
    </QuizContext.Provider>
  );
};

export const useQuiz = () => {
  const context = useContext(QuizContext);
  if (!context) {
    throw new Error('useQuiz must be used within a QuizProvider');
  }
  return context;
};

export { createEmptyQuestion };
