import React, { useEffect, useMemo, useState } from 'react';
import { BarChart3, Pause, Play, ShieldX, Sparkles } from 'lucide-react';
import type {
  ConfidenceLevel,
  GameSessionResponse,
  PlayerSlotResponse,
  TeamAnswerEventPayload,
  TeamStateResponse,
} from '../../types/api';

interface GameSessionScreenProps {
  session: GameSessionResponse;
  participant: PlayerSlotResponse | null;
  connectionStatus: string;
  hiddenAnswerIds: string[];
  histogram: { answersCount: number; totalTeams: number } | null;
  teamSelectionEvent: TeamAnswerEventPayload | null;
  isHost: boolean;
  onSelectAnswer: (teamId: string, answerId: string) => void;
  onConfirmAnswer: (teamId: string, answerId: string, confidenceLevel?: ConfidenceLevel) => void;
  onUseFiftyFifty: (teamId: string) => void;
  onAdvance: () => void;
  onTogglePause: () => void;
  onKick: (participantId: string) => void;
  onLeaveRoom: () => void;
}

export const GameSessionScreen: React.FC<GameSessionScreenProps> = ({
  session,
  participant,
  connectionStatus,
  hiddenAnswerIds,
  histogram,
  teamSelectionEvent,
  isHost,
  onSelectAnswer,
  onConfirmAnswer,
  onUseFiftyFifty,
  onAdvance,
  onTogglePause,
  onKick,
  onLeaveRoom,
}) => {
  const [now, setNow] = useState(Date.now());
  const [cbmChoice, setCbmChoice] = useState<ConfidenceLevel>('MEDIUM');
  const [confirmCandidate, setConfirmCandidate] = useState<string | null>(null);
  const team = participant ? session.teams.find((entry) => entry.teamId === participant.teamId) ?? null : null;
  const currentQuestion = session.currentQuestion;
  const deadlineMs = session.questionDeadlineAt ? new Date(session.questionDeadlineAt).getTime() : null;
  const remainingMs = deadlineMs ? Math.max(0, deadlineMs - now) : null;
  const visibleAnswers = useMemo(
    () => currentQuestion?.answers.filter((answer) => !hiddenAnswerIds.includes(answer.id)) ?? [],
    [currentQuestion, hiddenAnswerIds]
  );

  useEffect(() => {
    if (session.status !== 'START_QUESTION') {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(timer);
  }, [session.status]);

  if (session.status === 'FINISHED' && session.finalReport) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar session={session} connectionStatus={connectionStatus} onLeaveRoom={onLeaveRoom} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="card p-8">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-indigo">Final Report</p>
            <h1 className="mt-3 text-4xl font-black tracking-tight text-text-primary">{session.finalReport.quizTitle}</h1>
            <div className="mt-8 grid gap-4 md:grid-cols-2">
              {session.finalReport.teams
                .slice()
                .sort((left, right) => right.totalScore - left.totalScore)
                .map((teamReport, index) => (
                  <div key={teamReport.teamId} className="rounded-3xl border border-border bg-white p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">#{index + 1}</p>
                    <h2 className="mt-2 text-2xl font-black text-text-primary">{teamReport.teamName}</h2>
                    <p className="mt-2 text-3xl font-black text-indigo">{teamReport.totalScore.toFixed(2)} pts</p>
                    <div className="mt-4 space-y-2">
                      {teamReport.questionScores.map((score, questionIndex) => (
                        <div key={`${teamReport.teamId}-${score.questionId}`} className="flex items-center justify-between rounded-2xl bg-background px-4 py-3">
                          <span className="font-semibold text-text-secondary">Q{questionIndex + 1}</span>
                          <span className={score.correct ? 'font-bold text-success' : 'font-bold text-error'}>
                            {score.pointsAwarded.toFixed(2)} pts
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-background">
        <TopBar session={session} connectionStatus={connectionStatus} onLeaveRoom={onLeaveRoom} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="card p-8">
            <h1 className="text-3xl font-black text-text-primary">Waiting for the next room update</h1>
            <p className="mt-3 text-text-secondary">The room question snapshot has not arrived yet.</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedAnswerId = team?.selectedAnswerId;
  const confirmedAnswerId = team?.confirmedAnswerId;
  const isCaptain = Boolean(participant && team && team.captainParticipantId === participant.participantId);
  const isAnalyst = Boolean(participant && team && team.analystParticipantId === participant.participantId);
  const roleLabel = isHost && !participant
    ? 'HOST'
    : isCaptain && isAnalyst
      ? 'CAPTAIN / ANALYST'
      : isCaptain
        ? 'CAPTAIN'
        : isAnalyst
          ? 'ANALYST'
          : participant?.teamRole ?? 'MEMBER';
  const canUseFiftyFifty = isAnalyst || (!session.playInTeams && isCaptain);
  const canAnswer = Boolean(team && participant);
  const immediateConfirmedCorrect = teamSelectionEvent?.finalized
    && teamSelectionEvent.teamId === team?.teamId
    && teamSelectionEvent.confirmedAnswerId === confirmedAnswerId
      ? teamSelectionEvent.confirmedCorrect
      : null;

  const handleConfirm = () => {
    if (!selectedAnswerId) {
      return;
    }
    if (session.cbmEnabled) {
      setConfirmCandidate(selectedAnswerId);
      return;
    }
    if (!team) {
      return;
    }
    onConfirmAnswer(team.teamId, selectedAnswerId);
  };

  const submitCbmConfirmation = () => {
    if (!confirmCandidate) {
      return;
    }
    if (!team) {
      return;
    }
    onConfirmAnswer(team.teamId, confirmCandidate, cbmChoice);
    setConfirmCandidate(null);
  };

  return (
    <div className="min-h-screen bg-background">
      <TopBar session={session} connectionStatus={connectionStatus} onLeaveRoom={onLeaveRoom} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <section className="flex flex-col gap-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">Question {session.currentQuestionIndex! + 1}</p>
                <h1 className="mt-3 text-4xl font-black tracking-tight text-text-primary">{currentQuestion.text}</h1>
              </div>
              <div className="rounded-3xl bg-background px-5 py-3">
                <p className="text-sm font-semibold text-text-muted">Time left</p>
                <p className="text-3xl font-black text-indigo">{remainingMs == null ? '--' : Math.ceil(remainingMs / 1000)}s</p>
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            {visibleAnswers.map((answer) => {
              const isSelected = selectedAnswerId === answer.id;
              const isConfirmed = confirmedAnswerId === answer.id;
              const confirmedCorrect = isConfirmed
                ? immediateConfirmedCorrect ?? team?.confirmedAnswerCorrect ?? answer.correct ?? null
                : null;
              const isConfirmedCorrect = confirmedCorrect === true;
              const isConfirmedWrong = confirmedCorrect === false;
              return (
                <button
                  key={answer.id}
                  onClick={() => {
                    if (team) {
                      onSelectAnswer(team.teamId, answer.id);
                    }
                  }}
                  disabled={!canAnswer || session.status !== 'START_QUESTION' || !!confirmedAnswerId}
                  className={`rounded-3xl border px-5 py-5 text-left transition-all ${
                    isConfirmedCorrect
                      ? 'border-success bg-success/10'
                      : isConfirmedWrong
                        ? 'border-error bg-error/10'
                      : isSelected
                        ? 'border-indigo bg-indigo/10'
                        : 'border-border bg-white hover:border-indigo/40'
                  }`}
                >
                  <p className="text-lg font-bold text-text-primary">{answer.text}</p>
                  <p className={`mt-2 text-sm font-semibold ${
                    isConfirmedCorrect
                      ? 'text-success'
                      : isConfirmedWrong
                        ? 'text-error'
                        : 'text-text-muted'
                  }`}>
                    {isConfirmedCorrect
                      ? 'Confirmed - correct'
                      : isConfirmedWrong
                        ? 'Confirmed - incorrect'
                        : isConfirmed
                          ? 'Confirmed'
                          : isSelected
                            ? 'Selected by your team'
                            : canAnswer
                              ? 'Tap to select'
                              : 'Host view'}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="card p-5 flex flex-wrap items-center gap-3">
            <span className="rounded-full bg-background px-4 py-2 text-sm font-bold text-text-secondary">
              Role: {roleLabel}
            </span>
            {canUseFiftyFifty && team && (
              <button
                onClick={() => onUseFiftyFifty(team.teamId)}
                disabled={team.analystPowerUsed || session.status !== 'START_QUESTION'}
                className="btn-secondary px-5 bg-[var(--color-analyst-blue)] text-white disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={18} />
                  50/50
                </span>
              </button>
            )}
            {isCaptain && team && (
              <button
                onClick={handleConfirm}
                disabled={!selectedAnswerId || !!confirmedAnswerId || session.status !== 'START_QUESTION'}
                className="btn-secondary px-5 bg-[var(--color-captain-gold)] text-white disabled:opacity-50"
              >
                Confirm
              </button>
            )}
            {!isHost && !isCaptain && !isAnalyst && (
              <p className="text-sm font-semibold text-text-muted">
                Members can propose answers and follow the live team selection.
              </p>
            )}
            {isHost && !participant && (
              <p className="text-sm font-semibold text-text-muted">
                You are moderating this game as host and are not assigned to a player slot.
              </p>
            )}
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <HostPanel
            session={session}
            team={team}
            isHost={isHost}
            histogram={histogram}
            onAdvance={onAdvance}
            onTogglePause={onTogglePause}
            onKick={onKick}
          />
          <LeaderboardCard teams={session.teams} />
        </aside>
      </div>

      {confirmCandidate && (
        <div className="fixed inset-0 bg-midnight/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-2xl font-black text-text-primary">Confidence check</h2>
            <p className="mt-2 text-text-secondary">
              Choose the team confidence level before the captain confirms the answer.
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {(['LOW', 'MEDIUM', 'HIGH'] as ConfidenceLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setCbmChoice(level)}
                  className={`rounded-2xl border px-4 py-4 font-bold ${
                    cbmChoice === level ? 'border-indigo bg-indigo/10 text-indigo' : 'border-border text-text-primary'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmCandidate(null)}
                className="flex-1 rounded-2xl border border-border px-4 py-3 font-bold text-text-secondary"
              >
                Cancel
              </button>
              <button
                onClick={submitCbmConfirmation}
                className="flex-1 rounded-2xl bg-indigo px-4 py-3 font-bold text-white"
              >
                Confirm Answer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const TopBar: React.FC<{
  session: GameSessionResponse;
  connectionStatus: string;
  onLeaveRoom: () => void;
}> = ({ session, connectionStatus, onLeaveRoom }) => (
  <header className="sticky top-0 z-10 border-b border-border bg-white/90 backdrop-blur">
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-text-muted">Live Room</p>
        <h1 className="text-2xl font-black tracking-tight text-text-primary">{session.quizTitle ?? session.pin}</h1>
      </div>
      <div className="flex items-center gap-3">
        <span className="rounded-full bg-background px-3 py-2 text-sm font-semibold text-text-secondary">
          Socket: {connectionStatus}
        </span>
        <button onClick={onLeaveRoom} className="text-sm font-semibold text-text-muted underline">
          Leave room
        </button>
      </div>
    </div>
  </header>
);

const HostPanel: React.FC<{
  session: GameSessionResponse;
  team: TeamStateResponse | null;
  isHost: boolean;
  histogram: { answersCount: number; totalTeams: number } | null;
  onAdvance: () => void;
  onTogglePause: () => void;
  onKick: (participantId: string) => void;
}> = ({ session, team, isHost, histogram, onAdvance, onTogglePause, onKick }) => (
  <div className="card p-5">
    <div className="flex items-center gap-2 text-text-primary">
      <BarChart3 size={20} />
      <h2 className="text-xl font-black">Host Analytics</h2>
    </div>
    <div className="mt-5 rounded-3xl bg-background p-5">
      <div className="flex items-center justify-between">
        <span className="text-sm font-semibold text-text-muted">Answer confirmations</span>
        <span className="text-lg font-black text-indigo">
          {histogram?.answersCount ?? session.answersCount}/{histogram?.totalTeams ?? session.teams.length}
        </span>
      </div>
      <div className="mt-4 h-4 rounded-full bg-white">
        <div
          className="h-4 rounded-full bg-indigo transition-all"
          style={{
            width: `${(((histogram?.answersCount ?? session.answersCount) / Math.max(1, histogram?.totalTeams ?? session.teams.length)) * 100).toFixed(0)}%`,
          }}
        />
      </div>
    </div>

    <div className="mt-5 rounded-3xl bg-background p-5">
      <p className="text-sm font-semibold text-text-muted">{team ? 'Your team' : 'Host view'}</p>
      <h3 className="mt-1 text-2xl font-black text-text-primary">{team ? team.name : 'Moderation only'}</h3>
      <p className="mt-2 text-text-secondary">
        {team
          ? `Selected: ${team.selectedAnswerId ?? 'none'} | Confirmed: ${team.confirmedAnswerId ?? 'none'}`
          : 'You are not assigned to a player slot in this room.'}
      </p>
    </div>

    {isHost && (
      <div className="mt-5 space-y-3">
        <button onClick={onTogglePause} className="w-full rounded-2xl bg-amber px-4 py-3 font-bold text-midnight">
          <span className="inline-flex items-center gap-2">
            {session.status === 'PAUSED' ? <Play size={18} /> : <Pause size={18} />}
            {session.status === 'PAUSED' ? 'Resume game' : 'Pause game'}
          </span>
        </button>
        {session.status === 'SHOW_RESULTS' && (
          <button onClick={onAdvance} className="w-full rounded-2xl bg-teal px-4 py-3 font-bold text-white">
            Advance to next question
          </button>
        )}
        <div className="rounded-3xl border border-border p-4">
          <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">Moderation</p>
          <div className="mt-3 space-y-2">
            {session.participants
              .filter((participant) => participant.participantId !== session.hostUserId)
              .map((participant) => (
                <button
                  key={participant.participantId}
                  onClick={() => onKick(participant.participantId)}
                  className="w-full rounded-2xl border border-border px-4 py-3 text-left font-semibold text-text-primary hover:bg-background"
                >
                  <span className="inline-flex items-center gap-2">
                    <ShieldX size={16} />
                    Kick {participant.displayName}
                  </span>
                </button>
              ))}
          </div>
        </div>
      </div>
    )}
  </div>
);

const LeaderboardCard: React.FC<{ teams: TeamStateResponse[] }> = ({ teams }) => (
  <div className="card p-5">
    <h2 className="text-xl font-black text-text-primary">Live Scoreboard</h2>
    <div className="mt-4 space-y-3">
      {teams
        .slice()
        .sort((left, right) => right.totalScore - left.totalScore)
        .map((team, index) => (
          <div key={team.teamId} className="rounded-2xl border border-border bg-background px-4 py-3 flex items-center justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">#{index + 1}</p>
              <p className="font-black text-text-primary">{team.name}</p>
            </div>
            <span className="text-2xl font-black text-indigo">{team.totalScore.toFixed(2)}</span>
          </div>
        ))}
    </div>
  </div>
);
