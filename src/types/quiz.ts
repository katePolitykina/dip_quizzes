export type AnswerColor = 'red' | 'blue' | 'yellow' | 'green';

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
  color: AnswerColor;
}

export interface Question {
  id: string;
  text: string;
  image?: string;
  answers: Answer[];
  weight: number;
  timerOverride?: number;
}

export interface Quiz {
  title: string;
  globalTimer: number; // in seconds
  cbmEnabled: boolean;
  questions: Question[];
  activeQuestionId: string | null;
  lastSaved: string | null; // ISO string
}
