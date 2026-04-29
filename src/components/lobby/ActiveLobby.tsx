import React from 'react';
import { Play, Shuffle } from 'lucide-react';
import type { GameSessionResponse, PlayerSlotResponse, TeamStateResponse } from '../../types/api';

interface ActiveLobbyProps {
  session: GameSessionResponse;
  currentParticipantId: string;
  isHost: boolean;
  onAutoDistribute: (teamCount: number) => void;
  onUpdateRoles: (teamId: string, captainParticipantId: string, analystParticipantId: string) => void;
  onStartQuiz: () => void;
  onBackToDashboard?: () => void;
}

function roleTone(participant: PlayerSlotResponse) {
  if (participant.teamRole === 'CAPTAIN') {
    return 'border-[var(--color-captain-gold)] bg-[var(--color-captain-gold-bg)]';
  }
  if (participant.teamRole === 'ANALYST') {
    return 'border-[var(--color-analyst-blue)] bg-[var(--color-analyst-blue-bg)]';
  }
  return 'border-border bg-white';
}

export const ActiveLobby: React.FC<ActiveLobbyProps> = ({
  session,
  currentParticipantId,
  isHost,
  onAutoDistribute,
  onUpdateRoles,
  onStartQuiz,
  onBackToDashboard,
}) => {
  const participantCount = session.participants.length;
  const autoDistributeTeamCount = Math.min(4, Math.floor(participantCount / 2));
  const canAutoDistribute = autoDistributeTeamCount >= 2;
  const waitingPlayers = session.participants.filter((participant) => !participant.teamId);
  const currentPlayer = session.participants.find((participant) => participant.participantId === currentParticipantId);
  const hasReadyTeams =
    session.teams.length > 0 &&
    session.teams.every((team) => team.captainParticipantId && team.analystParticipantId);

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Room PIN</p>
            <h1 className="text-4xl font-black tracking-[0.3em] text-[var(--color-text-primary)]">{session.pin}</h1>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
              {currentPlayer ? `Joined as ${currentPlayer.displayName}` : 'Synchronizing participant identity...'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isHost && (
              <>
                <button
                  onClick={() => onAutoDistribute(autoDistributeTeamCount)}
                  disabled={!canAutoDistribute}
                  className="btn-secondary px-5 bg-white border border-border text-text-primary disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Shuffle size={18} />
                    Auto-Distribute
                  </span>
                </button>
                <button
                  onClick={onStartQuiz}
                  disabled={!hasReadyTeams}
                  className="btn-primary px-6 bg-[var(--color-success)] text-white disabled:opacity-50"
                >
                  <span className="inline-flex items-center gap-2">
                    <Play size={18} fill="currentColor" />
                    Start Game
                  </span>
                </button>
              </>
            )}
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="text-sm font-semibold text-[var(--color-text-muted)] underline hover:text-[var(--color-text-primary)]"
              >
                Exit room
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 grid lg:grid-cols-[0.72fr_1.28fr] gap-6">
        <section className="card p-5 h-fit">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-black text-text-primary">Waiting Room</h2>
            <span className="text-sm font-semibold text-text-muted">{waitingPlayers.length} waiting</span>
          </div>
          <div className="mt-4 flex flex-col gap-3">
            {waitingPlayers.length === 0 ? (
              <p className="text-sm text-text-muted">Everyone has been assigned to a team.</p>
            ) : (
              waitingPlayers.map((participant) => (
                <div key={participant.participantId} className="rounded-2xl border border-border bg-background px-4 py-3">
                  <p className="font-bold text-text-primary">{participant.displayName}</p>
                  <p className="text-sm text-text-muted">{participant.guest ? 'Guest player' : participant.provider}</p>
                </div>
              ))
            )}
          </div>
        </section>

        <section className="flex flex-col gap-5">
          {session.teams.length === 0 ? (
            <div className="card p-8">
              <h2 className="text-2xl font-black text-text-primary">No teams yet</h2>
              <p className="mt-3 text-text-secondary">
                Use auto-distribute to create balanced teams directly from the backend room state.
              </p>
            </div>
          ) : (
            session.teams.map((team) => (
              <LobbyTeamCard
                key={team.teamId}
                team={team}
                participants={session.participants.filter((participant) => participant.teamId === team.teamId)}
                isHost={isHost}
                onUpdateRoles={onUpdateRoles}
              />
            ))
          )}
        </section>
      </main>
    </div>
  );
};

interface LobbyTeamCardProps {
  team: TeamStateResponse;
  participants: PlayerSlotResponse[];
  isHost: boolean;
  onUpdateRoles: (teamId: string, captainParticipantId: string, analystParticipantId: string) => void;
}

const LobbyTeamCard: React.FC<LobbyTeamCardProps> = ({
  team,
  participants,
  isHost,
  onUpdateRoles,
}) => {
  const captainParticipantId = team.captainParticipantId ?? participants[0]?.participantId;
  const analystParticipantId = team.analystParticipantId ?? participants[1]?.participantId ?? participants[0]?.participantId;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-text-primary">{team.name}</h3>
          <p className="text-sm text-text-muted">{participants.length} players assigned</p>
        </div>
        {isHost && participants.length >= 2 && (
          <button
            onClick={() => onUpdateRoles(team.teamId, captainParticipantId, analystParticipantId)}
            className="rounded-xl border border-border px-4 py-2 text-sm font-bold text-text-primary hover:bg-background"
          >
            Sync roles
          </button>
        )}
      </div>

      {isHost && participants.length >= 2 && (
        <div className="mt-4 grid sm:grid-cols-2 gap-3">
          <label className="text-sm font-semibold text-text-secondary">
            Captain
            <select
              defaultValue={captainParticipantId}
              onChange={(event) => onUpdateRoles(team.teamId, event.target.value, analystParticipantId)}
              className="mt-2 w-full rounded-xl border border-border px-3 py-2 bg-white"
            >
              {participants.map((participant) => (
                <option key={participant.participantId} value={participant.participantId}>
                  {participant.displayName}
                </option>
              ))}
            </select>
          </label>
          <label className="text-sm font-semibold text-text-secondary">
            Analyst
            <select
              defaultValue={analystParticipantId}
              onChange={(event) => onUpdateRoles(team.teamId, captainParticipantId, event.target.value)}
              className="mt-2 w-full rounded-xl border border-border px-3 py-2 bg-white"
            >
              {participants.map((participant) => (
                <option key={participant.participantId} value={participant.participantId}>
                  {participant.displayName}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <div className="mt-5 grid md:grid-cols-2 xl:grid-cols-3 gap-3">
        {participants.map((participant) => (
          <div
            key={participant.participantId}
            className={`rounded-2xl border px-4 py-3 ${roleTone(participant)}`}
          >
            <p className="font-bold text-text-primary">{participant.displayName}</p>
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              {participant.teamRole ?? 'MEMBER'}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
};
