import React from 'react';
import {
  closestCenter,
  DndContext,
  KeyboardSensor,
  PointerSensor,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { Brain, Crown, GripVertical, Play, Shuffle, Users } from 'lucide-react';
import type { GameSessionResponse, PlayerSlotResponse, TeamStateResponse } from '../../types/api';

interface ActiveLobbyProps {
  session: GameSessionResponse;
  currentParticipantId?: string | null;
  hostDisplayName: string;
  isHost: boolean;
  onAutoDistribute: () => void;
  onUpdateTeams: (assignments: Array<{ teamId: string; participantIds: string[] }>) => void;
  onUpdateRoles: (teamId: string, captainParticipantId: string, analystParticipantId: string) => void;
  onStartQuiz: () => void;
  onBackToDashboard?: () => void;
}

const WAITING_ROOM_ID = 'waiting-room';

function resolveRoleLabel(team: TeamStateResponse, participant: PlayerSlotResponse) {
  const isCaptain = team.captainParticipantId === participant.participantId;
  const isAnalyst = team.analystParticipantId === participant.participantId;

  if (isCaptain && isAnalyst) {
    return 'CAPTAIN / ANALYST';
  }
  if (isCaptain) {
    return 'CAPTAIN';
  }
  if (isAnalyst) {
    return 'ANALYST';
  }
  return participant.teamRole ?? 'MEMBER';
}

function roleTone(team: TeamStateResponse, participant: PlayerSlotResponse) {
  const isCaptain = team.captainParticipantId === participant.participantId;
  const isAnalyst = team.analystParticipantId === participant.participantId;

  if (isCaptain && isAnalyst) {
    return 'border-[var(--color-captain-gold)] bg-[var(--color-captain-gold-bg)]';
  }
  if (isCaptain) {
    return 'border-[var(--color-captain-gold)] bg-[var(--color-captain-gold-bg)]';
  }
  if (isAnalyst) {
    return 'border-[var(--color-analyst-blue)] bg-[var(--color-analyst-blue-bg)]';
  }
  return 'border-border bg-white';
}

export const ActiveLobby: React.FC<ActiveLobbyProps> = ({
  session,
  currentParticipantId,
  hostDisplayName,
  isHost,
  onAutoDistribute,
  onUpdateTeams,
  onUpdateRoles,
  onStartQuiz,
  onBackToDashboard,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );
  const configuredTeamCount = session.configuredTeamCount ?? 0;
  const canAutoDistribute = session.playInTeams && configuredTeamCount >= 2;
  const waitingPlayers = session.participants.filter((participant) => !participant.teamId);
  const currentPlayer = session.participants.find((participant) => participant.participantId === currentParticipantId);
  const hasEveryoneAssigned = waitingPlayers.length === 0;
  const hasNonEmptyTeams = session.teams.every((team) => team.participantIds.length > 0);
  const hasReadyTeams = session.playInTeams
    ? session.teams.length > 0 && hasEveryoneAssigned && hasNonEmptyTeams && session.teams.every((team) => team.captainParticipantId && team.analystParticipantId)
    : session.teams.length === session.participants.length && session.teams.every((team) => team.captainParticipantId);

  const handleDragEnd = (event: DragEndEvent) => {
    const participantId = String(event.active.id);
    const dropTarget = event.over?.id ? String(event.over.id) : null;
    if (!dropTarget) {
      return;
    }

    const nextAssignments = session.teams.map((team) => ({
      teamId: team.teamId,
      participantIds: team.participantIds.filter((id) => id !== participantId),
    }));

    if (dropTarget !== WAITING_ROOM_ID) {
      const targetTeamId = dropTarget.replace('team-drop-', '');
      const targetTeam = nextAssignments.find((team) => team.teamId === targetTeamId);
      if (!targetTeam) {
        return;
      }
      targetTeam.participantIds = [...targetTeam.participantIds, participantId];
    }

    const unchanged = nextAssignments.every((assignment) => {
      const currentTeam = session.teams.find((team) => team.teamId === assignment.teamId);
      return currentTeam?.participantIds.join(',') === assignment.participantIds.join(',');
    });
    if (unchanged) {
      return;
    }

    onUpdateTeams(nextAssignments);
  };

  return (
    <div className="min-h-screen bg-[var(--color-background)]">
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--color-text-muted)]">Room PIN</p>
            <h1 className="text-4xl font-black tracking-[0.3em] text-[var(--color-text-primary)]">{session.pin}</h1>
            <p className="mt-1 text-sm font-medium text-[var(--color-text-secondary)]">
              {isHost ? `Hosting as ${hostDisplayName}` : currentPlayer ? `Joined as ${currentPlayer.displayName}` : 'Synchronizing participant identity...'}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isHost && (
              <>
                {session.playInTeams && (
                  <button
                    onClick={onAutoDistribute}
                    disabled={!canAutoDistribute}
                    className="btn-secondary px-5 bg-white border border-border text-text-primary disabled:opacity-50"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Shuffle size={18} />
                      Auto-distribute Teams
                    </span>
                  </button>
                )}
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

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <section className="rounded-2xl border border-border bg-white px-5 py-4">
          <div className="flex flex-wrap items-center gap-3 text-sm font-semibold text-text-muted">
            <span>Mode: {session.playInTeams ? `${configuredTeamCount} teams` : 'Solo'}</span>
            {session.playInTeams && (
              <>
                <span>{waitingPlayers.length} waiting</span>
                {!hasEveryoneAssigned && <span>Assign every player before starting</span>}
              </>
            )}
          </div>
        </section>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-6">
            <WaitingRoomColumn players={waitingPlayers} playInTeams={session.playInTeams} />

            <section className="flex flex-col gap-5">
              {session.teams.length === 0 ? (
                <div className="card p-8">
                  <h2 className="text-2xl font-black text-text-primary">No team slots available</h2>
                  <p className="mt-3 text-text-secondary">
                    This room does not currently expose any teams for manual assignment.
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
          </div>
        </DndContext>
      </main>
    </div>
  );
};

const WaitingRoomColumn: React.FC<{
  players: PlayerSlotResponse[];
  playInTeams: boolean;
}> = ({ players, playInTeams }) => {
  const { isOver, setNodeRef } = useDroppable({ id: WAITING_ROOM_ID });

  return (
    <section className="card p-5 h-fit">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-text-primary">Waiting Room</h2>
        <span className="text-sm font-semibold text-text-muted">{players.length} waiting</span>
      </div>
      <div
        ref={setNodeRef}
        className={`mt-4 min-h-56 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          isOver ? 'border-indigo bg-indigo/5' : 'border-border bg-background'
        }`}
      >
        <div className="flex flex-col gap-3">
          {players.map((participant) => (
            <DraggableParticipantCard key={participant.participantId} participant={participant} />
          ))}
          {players.length === 0 && (
            <div className="flex min-h-40 flex-col items-center justify-center gap-3 text-text-muted">
              <Users size={28} />
              <p className="text-sm font-semibold">
                {playInTeams ? 'Drop a player here to remove them from a team.' : 'Each player has their own scoreline.'}
              </p>
            </div>
          )}
        </div>
      </div>
    </section>
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
  const { isOver, setNodeRef } = useDroppable({ id: `team-drop-${team.teamId}` });
  const captainParticipantId = team.captainParticipantId ?? participants[0]?.participantId;
  const analystParticipantId = team.analystParticipantId ?? participants[1]?.participantId ?? participants[0]?.participantId;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-text-primary">{team.name}</h3>
          <p className="text-sm text-text-muted">{participants.length} players assigned</p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`mt-5 min-h-32 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          isOver ? 'border-indigo bg-indigo/5' : 'border-border/70'
        }`}
      >
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {participants.map((participant) => (
            <DraggableParticipantCard
              key={participant.participantId}
              participant={participant}
              toneClass={roleTone(team, participant)}
              roleLabel={resolveRoleLabel(team, participant)}
              isHost={isHost}
              isCaptain={captainParticipantId === participant.participantId}
              isAnalyst={analystParticipantId === participant.participantId}
              onAssignCaptain={() => onUpdateRoles(team.teamId, participant.participantId, analystParticipantId)}
              onAssignAnalyst={() => onUpdateRoles(team.teamId, captainParticipantId, participant.participantId)}
            />
          ))}
        </div>
        {participants.length === 0 && (
          <p className="flex min-h-24 items-center justify-center text-sm font-semibold text-text-muted">
            Drop players here
          </p>
        )}
      </div>
    </div>
  );
};

const DraggableParticipantCard: React.FC<{
  participant: PlayerSlotResponse;
  toneClass?: string;
  roleLabel?: string;
  isHost?: boolean;
  isCaptain?: boolean;
  isAnalyst?: boolean;
  onAssignCaptain?: () => void;
  onAssignAnalyst?: () => void;
}> = ({
  participant,
  toneClass = 'border-border bg-white',
  roleLabel,
  isHost = false,
  isCaptain = false,
  isAnalyst = false,
  onAssignCaptain,
  onAssignAnalyst,
}) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: participant.participantId,
  });

  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className={`rounded-2xl border px-4 py-3 shadow-sm ${toneClass} ${isDragging ? 'opacity-60' : ''}`}
    >
      <div className="flex items-start gap-3">
        <button
          type="button"
          className="mt-0.5 cursor-grab text-text-muted active:cursor-grabbing"
          {...listeners}
          {...attributes}
        >
          <GripVertical size={18} />
        </button>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-text-primary">{participant.displayName}</p>
          <p className="text-sm text-text-muted">{participant.guest ? 'Guest player' : participant.provider}</p>
          {roleLabel && (
            <p className="mt-1 text-xs font-semibold uppercase tracking-[0.16em] text-text-muted">
              {roleLabel}
            </p>
          )}
        </div>
        {isHost && (
          <div className="flex shrink-0 items-center gap-1">
            <button
              type="button"
              onClick={onAssignCaptain}
              className={`rounded-lg p-2 transition-colors ${
                isCaptain
                  ? 'bg-[var(--color-captain-gold-bg)] text-[var(--color-captain-gold)]'
                  : 'text-text-muted hover:bg-background hover:text-[var(--color-captain-gold)]'
              }`}
              title="Assign captain"
            >
              <Crown size={16} strokeWidth={isCaptain ? 2.6 : 2} />
            </button>
            <button
              type="button"
              onClick={onAssignAnalyst}
              className={`rounded-lg p-2 transition-colors ${
                isAnalyst
                  ? 'bg-[var(--color-analyst-blue-bg)] text-[var(--color-analyst-blue)]'
                  : 'text-text-muted hover:bg-background hover:text-[var(--color-analyst-blue)]'
              }`}
              title="Assign analyst"
            >
              <Brain size={16} strokeWidth={isAnalyst ? 2.6 : 2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
