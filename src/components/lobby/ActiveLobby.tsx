import React from 'react';
import { createAvatar } from '@dicebear/core';
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
import { botttsNeutral } from '@dicebear/collection';
import { CSS } from '@dnd-kit/utilities';
import { Brain, Crown, GripVertical, Play, Shuffle, Users } from 'lucide-react';
import type { GameSessionResponse, PlayerSlotResponse, TeamStateResponse } from '../../types/api';
import { useI18n } from '../../i18n/I18nProvider';
import type { Messages } from '../../i18n/types';

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

function resolveRoleLabel(team: TeamStateResponse, participant: PlayerSlotResponse, messages: Messages) {
  const isCaptain = team.captainParticipantId === participant.participantId;
  const isAnalyst = team.analystParticipantId === participant.participantId;

  if (isCaptain && isAnalyst) {
    return messages.lobby.captainAnalyst;
  }
  if (isCaptain) {
    return messages.lobby.captain;
  }
  if (isAnalyst) {
    return messages.lobby.analyst;
  }
  if (participant.teamRole === 'CAPTAIN') {
    return messages.lobby.captain;
  }
  if (participant.teamRole === 'ANALYST') {
    return messages.lobby.analyst;
  }
  return messages.lobby.member;
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
  return 'border-white/90 bg-[rgba(255,255,255,0.66)]';
}

function generateAvatarSvg(seed: string) {
  return createAvatar(botttsNeutral, {
    seed,
    radius: 20,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  }).toString();
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
  const { messages } = useI18n();
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
    <div className="screen-shell">
      <header className="sticky top-0 z-10">
        <div className="card mx-auto mt-4 flex max-w-7xl flex-wrap items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <div>
            <p className="section-label">{messages.lobby.roomPin}</p>
            <div className="mt-2 inline-flex items-center rounded-full pin-badge px-5 py-3">
              <h1 className="table-numbers text-3xl font-black tracking-[0.3em] text-[var(--color-midnight)]">{session.pin}</h1>
            </div>
            <div className="mt-2 flex items-center gap-2 text-sm font-bold text-text-secondary">
              {!isHost && currentPlayer && (
                <div
                  className="w-8 h-8 rounded-full overflow-hidden border border-white/90 bg-white/30 shrink-0"
                  dangerouslySetInnerHTML={{ __html: generateAvatarSvg(currentPlayer.avatarUrl || currentPlayer.displayName) }}
                />
              )}
              <p>
                {isHost ? messages.lobby.hostingAs(hostDisplayName) : currentPlayer ? messages.lobby.joinedAs(currentPlayer.displayName) : messages.lobby.synchronizing}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isHost && (
              <>
                {session.playInTeams && (
                  <button
                    onClick={onAutoDistribute}
                    disabled={!canAutoDistribute}
                    className="btn-secondary btn-glass px-5 disabled:opacity-40"
                  >
                    <span className="inline-flex items-center gap-2">
                      <Shuffle size={18} />
                      {messages.lobby.autoDistribute}
                    </span>
                  </button>
                )}
                <button
                  onClick={onStartQuiz}
                  disabled={!hasReadyTeams}
                  className="btn-primary btn-cta px-6 disabled:opacity-40"
                >
                  <span className="inline-flex items-center gap-2">
                    <Play size={18} fill="currentColor" />
                    {messages.lobby.startGame}
                  </span>
                </button>
              </>
            )}
            {onBackToDashboard && (
              <button
                onClick={onBackToDashboard}
                className="btn-secondary btn-glass px-4 text-sm"
              >
                {messages.lobby.exitRoom}
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
        <section className="card px-5 py-4 flex flex-wrap items-center gap-3">
          <span className="glass-inset rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)]">
            {session.playInTeams ? messages.lobby.modeTeams(configuredTeamCount) : messages.lobby.modeSolo}
          </span>
          {session.playInTeams && (
            <>
              <span className="glass-inset rounded-full px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)]">
                {messages.lobby.waitingCount(waitingPlayers.length)}
              </span>
              {!hasEveryoneAssigned && (
                <span className="rounded-full bg-[rgba(255,212,179,0.45)] px-3 py-1.5 text-sm font-semibold text-[var(--color-text-secondary)]">
                  {messages.lobby.assignAllPlayersToStart}
                </span>
              )}
            </>
          )}
        </section>

        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
          <div className="grid lg:grid-cols-[0.72fr_1.28fr] gap-6">
            <WaitingRoomColumn players={waitingPlayers} playInTeams={session.playInTeams} />

            <section className="flex flex-col gap-5">
              {session.teams.length === 0 ? (
                <div className="card p-8">
                  <h2 className="text-2xl font-black text-text-primary">{messages.lobby.noTeamSlots}</h2>
                  <p className="mt-3 text-text-secondary">
                    {messages.lobby.noTeamSlotsDescription}
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
  const { messages } = useI18n();
  const { isOver, setNodeRef } = useDroppable({ id: WAITING_ROOM_ID });

  return (
    <section className="card h-fit p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-black text-text-primary">{messages.lobby.waitingRoom}</h2>
        <span className="text-sm font-semibold text-text-muted">{messages.lobby.waitingCount(players.length)}</span>
      </div>
      <div
        ref={setNodeRef}
        className={`mt-4 min-h-56 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          isOver ? 'border-[var(--color-indigo)] bg-[rgba(214,194,255,0.18)]' : 'empty-dashed bg-[rgba(255,255,255,0.36)]'
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
                {playInTeams ? messages.lobby.waitingRoomHintTeams : messages.lobby.waitingRoomHintSolo}
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
  const { messages } = useI18n();
  const { isOver, setNodeRef } = useDroppable({ id: `team-drop-${team.teamId}` });
  const captainParticipantId = team.captainParticipantId ?? participants[0]?.participantId;
  const analystParticipantId = team.analystParticipantId ?? participants[1]?.participantId ?? participants[0]?.participantId;

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h3 className="text-xl font-black text-text-primary">{team.name}</h3>
          <p className="text-sm text-text-muted">{messages.lobby.teamPlayersAssigned(participants.length)}</p>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`mt-5 min-h-32 rounded-2xl border-2 border-dashed p-3 transition-colors ${
          isOver ? 'border-[var(--color-indigo)] bg-[rgba(214,194,255,0.18)]' : 'empty-dashed'
        }`}
      >
        <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
          {participants.map((participant) => (
            <DraggableParticipantCard
              key={participant.participantId}
              participant={participant}
              toneClass={roleTone(team, participant)}
              roleLabel={resolveRoleLabel(team, participant, messages)}
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
            {messages.lobby.dropPlayersHere}
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
  toneClass = 'border-white/90 bg-[rgba(255,255,255,0.66)]',
  roleLabel,
  isHost = false,
  isCaptain = false,
  isAnalyst = false,
  onAssignCaptain,
  onAssignAnalyst,
}) => {
  const { messages } = useI18n();
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: participant.participantId,
  });
  const avatarSeed = participant.avatarUrl || participant.displayName;

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
        <div
          className="w-11 h-11 rounded-full overflow-hidden border border-white/90 bg-background shrink-0"
          dangerouslySetInnerHTML={{ __html: generateAvatarSvg(avatarSeed) }}
        />
        <div className="min-w-0 flex-1">
          <p className="font-bold text-text-primary">{participant.displayName}</p>
          <p className="text-sm text-text-muted">{participant.guest ? messages.lobby.guestPlayer : participant.provider}</p>
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
              className={`rounded-full p-2 transition-colors ${
                isCaptain
                  ? 'bg-[var(--color-captain-gold-bg)] text-[var(--color-captain-gold)]'
                  : 'text-text-muted hover:bg-white/60 hover:text-[var(--color-captain-gold)]'
              }`}
              title={messages.lobby.assignCaptain}
            >
              <Crown size={16} strokeWidth={isCaptain ? 2.6 : 2} />
            </button>
            <button
              type="button"
              onClick={onAssignAnalyst}
              className={`rounded-full p-2 transition-colors ${
                isAnalyst
                  ? 'bg-[var(--color-analyst-blue-bg)] text-[var(--color-analyst-blue)]'
                  : 'text-text-muted hover:bg-white/60 hover:text-[var(--color-analyst-blue)]'
              }`}
              title={messages.lobby.assignAnalyst}
            >
              <Brain size={16} strokeWidth={isAnalyst ? 2.6 : 2} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
