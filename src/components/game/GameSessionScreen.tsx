import React, { useEffect, useMemo, useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';
import { BarChart3, Pause, Play, ShieldX, Sparkles } from 'lucide-react';
import { resolveAssetUrl } from '../../lib/assetUrl';
import type {
  ConfidenceLevel,
  GameSessionResponse,
  PlayerSlotResponse,
  TeamAnswerEventPayload,
  TeamStateResponse,
} from '../../types/api';
import { useI18n } from '../../i18n/I18nProvider';

const ANSWER_COLORS = [
  { bg: 'bg-[var(--color-answer-red)]', text: 'text-[var(--color-midnight)]', label: 'text-[var(--color-text-secondary)]' },
  { bg: 'bg-[var(--color-answer-blue)]', text: 'text-[var(--color-midnight)]', label: 'text-[var(--color-text-secondary)]' },
  { bg: 'bg-[var(--color-answer-yellow)]', text: 'text-[var(--color-midnight)]', label: 'text-[var(--color-text-secondary)]' },
  { bg: 'bg-[var(--color-answer-green)]', text: 'text-[var(--color-midnight)]', label: 'text-[var(--color-text-secondary)]' },
] as const;

function generateAvatarSvg(seed: string) {
  return createAvatar(botttsNeutral, {
    seed,
    radius: 20,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  }).toString();
}

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
  onOpenDetailedResult?: () => void;
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
  onOpenDetailedResult,
}) => {
  const { messages } = useI18n();
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
      <div className="screen-shell">
        <TopBar session={session} connectionStatus={connectionStatus} onLeaveRoom={onLeaveRoom} />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
          <div className="card p-8">
            <p className="section-label">{messages.game.finalReport}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight text-text-primary">{session.finalReport.quizTitle}</h1>
            {isHost && onOpenDetailedResult && (
              <div className="mt-5">
                <button
                  onClick={onOpenDetailedResult}
                  className="btn-secondary btn-aurora px-5"
                >
                  {messages.game.viewDetailedResult}
                </button>
              </div>
            )}
          </div>

          <div className="card p-6">
            <h2 className="text-2xl font-black text-[var(--color-text-primary)]">{messages.game.playerScoreboard}</h2>
            <div className="mt-4 space-y-3">
              {session.finalReport.players.map((player) => {
                const participantSnapshot = session.participants.find((entry) => entry.participantId === player.participantId);
                const avatarSeed = participantSnapshot?.avatarUrl || player.displayName;
                return (
                  <div key={player.participantId} className={`${player.rank === 1 ? 'chromatic-border' : ''}`}>
                    <div className="card-soft card flex items-center justify-between gap-4 px-5 py-4">
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-full overflow-hidden border border-[var(--color-border)] bg-white shrink-0"
                        dangerouslySetInnerHTML={{ __html: generateAvatarSvg(avatarSeed) }}
                      />
                      <div>
                        <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">#{player.rank}</p>
                        <h3 className="mt-0.5 text-xl font-black text-[var(--color-text-primary)]">{player.displayName}</h3>
                        <p className="text-sm text-[var(--color-text-secondary)]">{player.teamName ?? messages.game.noTeam}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-black text-[var(--color-success)]">{messages.game.correctCount(player.correctAnswers)}</p>
                      <p className="text-xs font-semibold text-[var(--color-text-muted)]">
                        {messages.game.averageMs(player.averageResponseTimeMillis)}
                      </p>
                    </div>
                  </div>
                  </div>
                );
              })}
            </div>
          </div>

          {session.finalReport.teams.length > 0 && (
            <div className="grid gap-4 md:grid-cols-2">
              {session.finalReport.teams
                .slice()
                .sort((left, right) => right.totalScore - left.totalScore)
                .map((teamReport, index) => (
                  <div key={teamReport.teamId} className={`${index === 0 ? 'chromatic-border' : ''}`}>
                    <div className="card p-5">
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">#{index + 1}</p>
                    <h2 className="mt-1 text-2xl font-black text-[var(--color-text-primary)]">{teamReport.teamName}</h2>
                    <p className="mt-1 text-3xl font-black text-[var(--color-indigo)]">{messages.game.points(teamReport.totalScore)}</p>
                    <div className="mt-4 space-y-2">
                      {teamReport.questionScores.map((score, questionIndex) => (
                        <div key={`${teamReport.teamId}-${score.questionId}`} className="glass-inset flex items-center justify-between rounded-2xl px-4 py-3">
                          <span className="font-semibold text-[var(--color-text-secondary)]">Q{questionIndex + 1}</span>
                          <span className={score.correct ? 'font-bold text-[var(--color-success)]' : 'font-bold text-[var(--color-error)]'}>
                            {messages.game.points(score.pointsAwarded)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="screen-shell">
        <TopBar session={session} connectionStatus={connectionStatus} onLeaveRoom={onLeaveRoom} />
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
          <div className="card p-8">
            <h1 className="text-3xl font-black text-text-primary">{messages.game.waitingForNextRoomUpdate}</h1>
            <p className="mt-3 text-text-secondary">{messages.game.roomQuestionSnapshotMissing}</p>
          </div>
        </div>
      </div>
    );
  }

  const selectedAnswerId = participant?.selectedAnswerId;
  const teamSelectedAnswerId = team?.selectedAnswerId;
  const confirmedAnswerId = team?.confirmedAnswerId;
  const isCaptain = Boolean(participant && team && team.captainParticipantId === participant.participantId);
  const isAnalyst = Boolean(participant && team && team.analystParticipantId === participant.participantId);
  const roleLabel = isHost && !participant
    ? messages.game.roleHost
    : isCaptain && isAnalyst
      ? messages.game.roleCaptainAnalyst
      : isCaptain
      ? messages.game.roleCaptain
        : isAnalyst
          ? messages.game.roleAnalyst
          : participant?.teamRole === 'MEMBER'
            ? messages.game.roleMember
            : messages.game.roleMember;
  const canUseFiftyFifty = isAnalyst || (!session.playInTeams && isCaptain);
  const canAnswer = Boolean(team && participant);
  const immediateConfirmedCorrect = teamSelectionEvent?.finalized
    && teamSelectionEvent.teamId === team?.teamId
    && teamSelectionEvent.confirmedAnswerId === confirmedAnswerId
      ? teamSelectionEvent.confirmedCorrect
      : null;

  const handleConfirm = () => {
    if (!teamSelectedAnswerId) {
      return;
    }
    if (session.cbmEnabled) {
      setConfirmCandidate(teamSelectedAnswerId);
      return;
    }
    if (!team) {
      return;
    }
    onConfirmAnswer(team.teamId, teamSelectedAnswerId);
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
    <div className="screen-shell">
      <TopBar session={session} connectionStatus={connectionStatus} onLeaveRoom={onLeaveRoom} />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid xl:grid-cols-[1.25fr_0.75fr] gap-6">
        <section className="flex flex-col gap-6">
          <div className="card p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="section-label">{messages.game.questionNumber(session.currentQuestionIndex! + 1)}</p>
                <h1 className="mt-3 text-3xl font-black tracking-tight text-text-primary leading-snug">{currentQuestion.text}</h1>
              </div>
              <div className="pin-badge table-numbers min-w-[5rem] shrink-0 rounded-[20px] border px-5 py-3 text-center">
                <p className="section-label text-[var(--color-text-secondary)]">{messages.game.time}</p>
                <p className="mt-1 text-4xl font-black leading-none text-[var(--color-midnight)]">
                  {remainingMs == null ? '--' : Math.ceil(remainingMs / 1000)}
                </p>
                <p className="mt-1 text-xs font-bold text-[var(--color-text-secondary)]">{messages.game.sec}</p>
              </div>
            </div>
          </div>

          {currentQuestion.imageUrl && (
            <div className="card p-4">
              <div className="flex justify-center rounded-3xl bg-background p-3">
                <img
                  src={resolveAssetUrl(currentQuestion.imageUrl)}
                  alt={messages.editor.questionMediaAlt}
                  className="max-h-[28rem] w-full rounded-2xl object-contain"
                />
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4">
            {visibleAnswers.map((answer) => {
              const originalIdx = currentQuestion.answers.findIndex((a) => a.id === answer.id);
              const color = ANSWER_COLORS[originalIdx % 4];
              const isSelected = selectedAnswerId === answer.id;
              const isTeamSelected = teamSelectedAnswerId === answer.id;
              const isConfirmed = confirmedAnswerId === answer.id;
              const selectedCorrect = isSelected ? participant?.selectedAnswerCorrect ?? null : null;
              const teamVoteCount = team?.answerVoteCounts?.[answer.id] ?? 0;
              const hostVoteCount = session.teams.reduce((sum, candidate) => sum + (candidate.answerVoteCounts?.[answer.id] ?? 0), 0);
              const visibleVoteCount = isHost && !participant ? hostVoteCount : teamVoteCount;
              const confirmedCorrect = isConfirmed
                ? immediateConfirmedCorrect ?? team?.confirmedAnswerCorrect ?? answer.correct ?? null
                : null;
              const isConfirmedCorrect = confirmedCorrect === true;
              const isConfirmedWrong = confirmedCorrect === false;
              const isSelectedCorrect = selectedCorrect === true;
              const isSelectedWrong = selectedCorrect === false;

              const btnClass = [
                'rounded-3xl border px-5 py-5 text-left transition-all duration-200 active:scale-[0.98] disabled:cursor-default shadow-[0_16px_32px_-18px_rgba(189,73,138,0.28)]',
                isConfirmedCorrect || isSelectedCorrect
                  ? 'bg-[var(--color-success)] border-[var(--color-success)] text-white shadow-lg shadow-[var(--color-success)]/30'
                  : isConfirmedWrong || isSelectedWrong
                  ? 'bg-[var(--color-error)] border-[var(--color-error)] text-white opacity-90'
                  : isTeamSelected
                  ? `${color.bg} border-white ring-4 ring-[rgba(255,255,255,0.78)] shadow-xl scale-[1.02] ${color.text}`
                  : isSelected
                  ? `${color.bg} border-white/90 ring-2 ring-white/55 shadow-lg ${color.text}`
                  : `${color.bg} border-white/80 hover:opacity-90 hover:shadow-lg disabled:opacity-60 ${color.text}`,
              ].join(' ');

              const labelText = isConfirmedCorrect
                ? messages.game.correct
                : isConfirmedWrong
                ? messages.game.incorrect
                : isSelectedCorrect
                ? messages.game.yourChoiceWasCorrect
                : isSelectedWrong
                ? messages.game.yourChoiceWasIncorrect
                : isTeamSelected
                ? messages.game.captainChoice
                : isConfirmed
                ? messages.game.confirmed
                : isHost && !participant && visibleVoteCount > 0
                ? messages.game.votes(visibleVoteCount)
                : isSelected
                ? messages.game.yourSelection
                : canAnswer
                ? messages.game.tapToSelect
                : messages.game.hostView;

              const labelColor =
                isConfirmedCorrect || isSelectedCorrect || isConfirmedWrong || isSelectedWrong
                  ? 'text-white/80'
                  : color.label;

              return (
                <button
                  key={answer.id}
                  onClick={() => {
                    if (team) {
                      onSelectAnswer(team.teamId, answer.id);
                    }
                  }}
                  disabled={!canAnswer || session.status !== 'START_QUESTION' || !!confirmedAnswerId}
                  className={btnClass}
                >
                  <div className="flex items-start justify-between gap-3">
                    <p className={`text-lg font-bold leading-snug ${
                      isConfirmedCorrect || isSelectedCorrect || isConfirmedWrong || isSelectedWrong
                        ? 'text-white'
                        : color.text
                    }`}>{answer.text}</p>
                    {visibleVoteCount > 0 && (
                      <span className="shrink-0 rounded-full bg-white/25 backdrop-blur-sm px-3 py-1 text-xs font-bold">
                        {visibleVoteCount}×
                      </span>
                    )}
                  </div>
                  <p className={`mt-2 text-sm font-semibold ${labelColor}`}>{labelText}</p>
                </button>
              );
            })}
          </div>

          <div className="card flex flex-wrap items-center gap-3 p-4">
            <span className={`rounded-full px-4 py-2 text-sm font-bold uppercase tracking-wide ${
              isCaptain
                ? 'bg-[var(--color-captain-gold-bg)] text-[var(--color-captain-gold)]'
                : isAnalyst
                ? 'bg-[var(--color-analyst-blue-bg)] text-[var(--color-analyst-blue)]'
                : isHost && !participant
                ? 'bg-[var(--color-indigo)]/10 text-[var(--color-indigo)]'
                : 'bg-[var(--color-background)] text-[var(--color-text-secondary)]'
            }`}>
              {roleLabel}
            </span>
            {canUseFiftyFifty && team && (
              <button
                onClick={() => onUseFiftyFifty(team.teamId)}
                disabled={team.analystPowerUsed || session.status !== 'START_QUESTION'}
                className="btn-secondary btn-glass px-5 disabled:opacity-50"
              >
                <span className="inline-flex items-center gap-2">
                  <Sparkles size={18} />
                  {messages.game.fiftyFifty}
                </span>
              </button>
            )}
            {isCaptain && team && (
              <button
                onClick={handleConfirm}
                disabled={!teamSelectedAnswerId || !!confirmedAnswerId || session.status !== 'START_QUESTION'}
                className="btn-secondary btn-cta px-5 disabled:opacity-50"
              >
                {messages.game.confirmAnswer}
              </button>
            )}
            {!isHost && !isCaptain && !isAnalyst && (
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                {messages.game.proposeAnswers}
              </p>
            )}
            {isHost && !participant && (
              <p className="text-sm font-semibold text-[var(--color-text-muted)]">
                {messages.game.moderatingNoSlot}
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
          <LeaderboardCard teams={session.teams} participants={session.participants} playInTeams={session.playInTeams} />
        </aside>
      </div>

      {confirmCandidate && (
        <div className="fixed inset-0 bg-midnight/45 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="card w-full max-w-md p-6">
            <h2 className="text-2xl font-black text-text-primary">{messages.game.confidenceCheck}</h2>
            <p className="mt-2 text-text-secondary">
              {messages.game.chooseConfidence}
            </p>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {(['LOW', 'MEDIUM', 'HIGH'] as ConfidenceLevel[]).map((level) => (
                <button
                  key={level}
                  onClick={() => setCbmChoice(level)}
                  className={`rounded-2xl border px-4 py-4 font-bold ${
                    cbmChoice === level ? 'border-[var(--color-indigo)] bg-[rgba(249,168,212,0.18)] text-[var(--color-indigo-dark)]' : 'border-white/90 text-text-primary'
                  }`}
                >
                  {level === 'LOW' ? messages.game.low : level === 'MEDIUM' ? messages.game.medium : messages.game.high}
                </button>
              ))}
            </div>
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setConfirmCandidate(null)}
                className="btn-secondary btn-glass flex-1"
              >
                {messages.dashboard.cancel}
              </button>
              <button
                onClick={submitCbmConfirmation}
                className="btn-secondary btn-cta flex-1"
              >
                {messages.game.confirmAnswer}
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
}> = ({ session, connectionStatus, onLeaveRoom }) => {
  const { messages } = useI18n();

  return (
    <header className="sticky top-0 z-10">
      <div className="card mx-auto mt-4 flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-4">
          <div>
            <p className="section-label">{messages.game.liveLabel(session.pin)}</p>
            <h1 className="text-xl font-black tracking-tight text-text-primary leading-tight">{session.quizTitle ?? session.pin}</h1>
          </div>
          <span className={`hidden sm:inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold ${
            connectionStatus === 'CONNECTED' ? 'bg-[rgba(76,174,138,0.18)] text-[var(--color-success)]' : 'glass-inset text-text-muted'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${connectionStatus === 'CONNECTED' ? 'bg-[var(--color-success)]' : 'bg-[var(--color-text-muted)]'}`} />
            {connectionStatus === 'CONNECTED' ? messages.game.liveStatus : connectionStatus}
          </span>
        </div>
        <button onClick={onLeaveRoom} className="btn-secondary btn-glass px-4 text-sm">
          {messages.game.leaveRoom}
        </button>
      </div>
    </header>
  );
};

const HostPanel: React.FC<{
  session: GameSessionResponse;
  team: TeamStateResponse | null;
  isHost: boolean;
  histogram: { answersCount: number; totalTeams: number } | null;
  onAdvance: () => void;
  onTogglePause: () => void;
  onKick: (participantId: string) => void;
}> = ({ session, team, isHost, histogram, onAdvance, onTogglePause, onKick }) => (
  <HostPanelInner
    session={session}
    team={team}
    isHost={isHost}
    histogram={histogram}
    onAdvance={onAdvance}
    onTogglePause={onTogglePause}
    onKick={onKick}
  />
);

const HostPanelInner: React.FC<{
  session: GameSessionResponse;
  team: TeamStateResponse | null;
  isHost: boolean;
  histogram: { answersCount: number; totalTeams: number } | null;
  onAdvance: () => void;
  onTogglePause: () => void;
  onKick: (participantId: string) => void;
}> = ({ session, team, isHost, histogram, onAdvance, onTogglePause, onKick }) => {
  const { messages } = useI18n();

  return (
    <div className="card p-5">
      <div className="flex items-center gap-2 text-text-primary">
        <BarChart3 size={20} />
        <h2 className="text-xl font-black">{messages.game.analytics}</h2>
      </div>
      <div className="glass-inset mt-5 rounded-3xl p-5">
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-text-muted">{messages.game.answerConfirmations}</span>
          <span className="text-lg font-black text-indigo">
            {histogram?.answersCount ?? session.answersCount}/{histogram?.totalTeams ?? session.teams.length}
          </span>
        </div>
        <div className="mt-4 h-4 rounded-full bg-white/85">
          <div
            className="h-4 rounded-full transition-all"
            style={{
              backgroundImage: 'var(--aurora-linear)',
              width: `${(((histogram?.answersCount ?? session.answersCount) / Math.max(1, histogram?.totalTeams ?? session.teams.length)) * 100).toFixed(0)}%`,
            }}
          />
        </div>
      </div>

      <div className="glass-inset mt-5 rounded-3xl p-5">
        <p className="text-sm font-semibold text-text-muted">{team ? messages.game.yourTeam : messages.game.hostView}</p>
        <h3 className="mt-1 text-2xl font-black text-text-primary">{team ? team.name : messages.game.hostViewTitle}</h3>
      </div>

      {isHost && (
        <div className="mt-5 space-y-3">
          {session.status === 'START_QUESTION' && (histogram?.answersCount ?? session.answersCount) === (histogram?.totalTeams ?? session.teams.length) && (
            <button onClick={onAdvance} className="btn-secondary btn-cta w-full">
              {messages.game.advanceToNextQuestion}
            </button>
          )}
          <button onClick={onTogglePause} className="btn-secondary btn-aurora w-full">
            <span className="inline-flex items-center gap-2">
              {session.status === 'PAUSED' ? <Play size={18} /> : <Pause size={18} />}
              {session.status === 'PAUSED' ? messages.game.resumeGame : messages.game.pauseGame}
            </span>
          </button>
          <div className="glass-inset rounded-3xl p-4">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">{messages.game.moderation}</p>
            <div className="mt-3 space-y-2">
              {session.participants
                .filter((participant) => participant.participantId !== session.hostUserId)
                .map((participant) => (
                  <button
                    key={participant.participantId}
                    onClick={() => onKick(participant.participantId)}
                    className="btn-secondary btn-glass w-full rounded-2xl px-4 py-3 text-left font-semibold text-text-primary"
                  >
                    <span className="inline-flex items-center gap-2">
                      <ShieldX size={16} />
                      {messages.game.kick(participant.displayName)}
                    </span>
                  </button>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const LeaderboardCard: React.FC<{ teams: TeamStateResponse[]; participants: PlayerSlotResponse[]; playInTeams: boolean }> = ({ teams, participants, playInTeams }) => {
  const { messages } = useI18n();

  return (
    <div className="card p-5">
      <h2 className="text-xl font-black text-text-primary">{messages.game.liveScoreboard}</h2>
      <div className="mt-4 space-y-3">
        {teams
          .slice()
          .sort((left, right) => right.totalScore - left.totalScore)
          .map((team, index) => {
            const teamParticipants = participants.filter((participant) => participant.teamId === team.teamId);
            return (
              <div key={team.teamId} className={`${index === 0 ? 'chromatic-border' : ''}`}>
                <div className="glass-inset flex items-center justify-between gap-4 rounded-2xl px-4 py-3">
                  <div>
                    <p className="text-sm font-bold uppercase tracking-[0.2em] text-text-muted">#{index + 1}</p>
                    {playInTeams && <p className="font-black text-text-primary">{team.name}</p>}
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      {teamParticipants.map((participant) => (
                        <div key={participant.participantId} className="flex items-center gap-2 rounded-full bg-white/75 pr-3">
                          <div
                            className="w-8 h-8 rounded-full overflow-hidden border border-white/90 bg-white shrink-0"
                            title={participant.displayName}
                            dangerouslySetInnerHTML={{ __html: generateAvatarSvg(participant.avatarUrl || participant.displayName) }}
                          />
                          <p className="text-sm font-semibold text-text-secondary">{participant.displayName}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                  <span className="text-2xl font-black text-indigo">{team.totalScore.toFixed(2)}</span>
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
};
