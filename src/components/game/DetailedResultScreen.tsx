import React from 'react';
import type { FinalGameReportResponse } from '../../types/api';

interface DetailedResultScreenProps {
  quizTitle: string;
  roomPin: string;
  finalReport: FinalGameReportResponse;
  onBackToRoom: () => void;
  onLeaveRoom: () => void;
}

function escapeHtml(value: string) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const DetailedResultScreen: React.FC<DetailedResultScreenProps> = ({
  quizTitle,
  roomPin,
  finalReport,
  onBackToRoom,
  onLeaveRoom,
}) => {
  const handleSaveResult = () => {
    const workbookHtml = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      body { font-family: Arial, sans-serif; }
      h1, h2, p { margin: 0 0 12px; }
      table { border-collapse: collapse; margin-bottom: 24px; width: 100%; }
      th, td { border: 1px solid #d4d4d8; padding: 8px 12px; text-align: left; vertical-align: top; }
      thead th { background: #f4f4f5; }
      .meta { margin-bottom: 24px; }
    </style>
  </head>
  <body>
    <h1>${escapeHtml(quizTitle)}</h1>
    <p class="meta">Room ${escapeHtml(roomPin)}</p>
    ${finalReport.questions.map((question, index) => `
      <h2>Question ${index + 1}</h2>
      <p>${escapeHtml(question.questionText)}</p>
      <table>
        <thead>
          <tr>
            <th>Field</th>
            ${question.playerAnswers.map((answer) => `<th>${escapeHtml(answer.displayName)}</th>`).join('')}
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Answer</td>
            ${question.playerAnswers.map((answer) => `<td>${escapeHtml(answer.selectedAnswerText ?? 'No answer')}</td>`).join('')}
          </tr>
        </tbody>
      </table>
    `).join('')}
  </body>
</html>`;

    const blob = new Blob([workbookHtml], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${roomPin}-detailed-result.xls`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Detailed Result</p>
            <h1 className="text-2xl font-black tracking-tight text-text-primary">{quizTitle}</h1>
            <p className="mt-1 text-sm font-medium text-text-secondary">Room {roomPin}</p>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={handleSaveResult} className="rounded-2xl bg-indigo px-4 py-2 font-semibold text-white">
              Save result
            </button>
            <button onClick={onBackToRoom} className="rounded-2xl border border-border px-4 py-2 font-semibold text-text-primary">
              Back to final report
            </button>
            <button onClick={onLeaveRoom} className="text-sm font-semibold text-text-muted underline">
              Leave room
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {finalReport.questions.map((question, index) => (
          <section key={question.questionId} className="card p-6 overflow-x-auto">
            <h2 className="text-2xl font-black text-text-primary">Question {index + 1}</h2>
            <p className="mt-2 text-text-secondary">{question.questionText}</p>
            <table className="mt-5 min-w-full border-separate border-spacing-0 overflow-hidden rounded-2xl border border-border">
              <thead>
                <tr className="bg-background">
                  <th className="border-b border-border px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.2em] text-text-muted">
                    Field
                  </th>
                  {question.playerAnswers.map((answer) => (
                    <th
                      key={`${question.questionId}-${answer.participantId}`}
                      className="border-b border-border px-4 py-3 text-left text-sm font-bold uppercase tracking-[0.2em] text-text-muted"
                    >
                      {answer.displayName}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                <tr className="bg-white">
                  <td className="border-b border-border px-4 py-4 font-semibold text-text-secondary">Answer</td>
                  {question.playerAnswers.map((answer) => (
                    <td key={`${question.questionId}-${answer.participantId}-answer`} className="border-b border-border px-4 py-4 font-semibold text-text-primary">
                      {answer.selectedAnswerText ?? 'No answer'}
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </section>
        ))}
      </div>
    </div>
  );
};
