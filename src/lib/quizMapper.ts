import type { Quiz } from '../types/quiz';
import type { QuizDetailResponse, QuizUpsertRequest } from '../types/api';

const ANSWER_COLORS = ['red', 'blue', 'yellow', 'green'] as const;

export function mapQuizDetailToEditorState(quiz: QuizDetailResponse): Quiz {
  return {
    title: quiz.title,
    globalTimer: 30,
    cbmEnabled: false,
    activeQuestionId: quiz.questions[0]?.id ?? null,
    lastSaved: quiz.updatedAt,
    questions: quiz.questions.map((question) => ({
      id: question.id,
      text: question.text,
      image: question.imageUrl ?? undefined,
      weight: question.pointsWeight,
      timerOverride: question.timerOverride ?? undefined,
      answers: [
        ...question.answers.map((answer, index) => ({
          id: answer.id,
          text: answer.text,
          isCorrect: answer.isCorrect,
          color: ANSWER_COLORS[index] ?? 'green',
        })),
        ...Array.from({ length: Math.max(0, 4 - question.answers.length) }, (_, offset) => ({
          id: `ans-${crypto.randomUUID()}`,
          text: '',
          isCorrect: false,
          color: ANSWER_COLORS[question.answers.length + offset] ?? 'green',
        })),
      ],
    })),
  };
}

export function mapEditorStateToQuizUpsertRequest(quiz: Quiz): QuizUpsertRequest {
  return {
    title: quiz.title,
    questions: quiz.questions.map((question) => ({
      text: question.text,
      imageUrl: question.image || null,
      pointsWeight: question.weight,
      timerOverride: question.timerOverride ?? null,
      answers: question.answers
        .filter((answer) => answer.text.trim().length > 0)
        .map((answer) => ({
          text: answer.text.trim(),
          isCorrect: answer.isCorrect,
        })),
    })),
  };
}
