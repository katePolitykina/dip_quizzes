import React, { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragStartEvent, DragOverEvent, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { Play, Shuffle } from 'lucide-react';
import type { Player, Team, PlayerRole } from '../../types/lobby';
import { WaitingRoom } from './WaitingRoom';
import { TeamContainer } from './TeamContainer';
import { LobbyPlayerCard } from './LobbyPlayerCard';

interface ActiveLobbyProps {
  pin: string;
  players: Player[];
  onPlayersChange: (players: Player[]) => void;
  onStartQuiz: () => void;
  onBackToEditor?: () => void;
}

const DEFAULT_TEAMS: Team[] = [
  { id: 'team-1', name: 'Team 1' },
  { id: 'team-2', name: 'Team 2' },
];

export const ActiveLobby: React.FC<ActiveLobbyProps> = ({
  pin,
  players,
  onPlayersChange,
  onStartQuiz,
  onBackToEditor,
}) => {
  const [teams] = useState<Team[]>(DEFAULT_TEAMS);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activePlayer = players.find((p) => p.id === activeId);
    if (!activePlayer) return;

    const isOverWaitingRoom = overId === 'waiting-room';
    const isOverTeam = teams.some((t) => t.id === overId);
    const overPlayer = players.find((p) => p.id === overId);

    // Find the target container ID
    let targetContainerId: string | undefined;
    if (isOverWaitingRoom) {
      targetContainerId = undefined;
    } else if (isOverTeam) {
      targetContainerId = overId as string;
    } else if (overPlayer) {
      targetContainerId = overPlayer.teamId;
    }

    if (activePlayer.teamId !== targetContainerId) {
      const newPlayers = players.map((p) => {
        if (p.id === activeId) {
          return {
            ...p,
            teamId: targetContainerId,
            role: undefined, // Reset role when moving between teams
          };
        }
        return p;
      });
      onPlayersChange(newPlayers);
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);

    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    if (activeId === overId) return;

    const activePlayerIndex = players.findIndex((p) => p.id === activeId);
    const overPlayerIndex = players.findIndex((p) => p.id === overId);

    // If dropped on another player in the SAME container, reorder them
    if (
      overPlayerIndex !== -1 &&
      players[activePlayerIndex].teamId === players[overPlayerIndex].teamId
    ) {
      onPlayersChange(arrayMove(players, activePlayerIndex, overPlayerIndex));
    }
  };

  const handleToggleRole = (playerId: string, targetRole: PlayerRole) => {
    const player = players.find((p) => p.id === playerId);
    if (!player || !player.teamId) return;

    onPlayersChange(
      players.map((p) => {
        // If they are in the same team
        if (p.teamId === player.teamId) {
          // If this is the specific player we clicked
          if (p.id === playerId) {
            // Toggle off if already that role, otherwise assign it
            return { ...p, role: p.role === targetRole ? undefined : targetRole };
          }
          // If another player already has this role in this team, strip it from them
          // because we can only have ONE captain and ONE analyst per team.
          if (p.role === targetRole) {
            return { ...p, role: undefined };
          }
        }
        return p;
      })
    );
  };

  const handleRemovePlayer = (playerId: string) => {
    onPlayersChange(
      players.map((p) => {
        if (p.id === playerId) {
          return { ...p, teamId: undefined, role: undefined };
        }
        return p;
      })
    );
  };

  const handleAutoDistribute = () => {
    const unassigned = players.filter((p) => !p.teamId);
    if (unassigned.length === 0) return;

    let currentTeamIdx = 0;
    const newPlayers = players.map((p) => {
      if (!p.teamId) {
        const assignedTeam = teams[currentTeamIdx].id;
        currentTeamIdx = (currentTeamIdx + 1) % teams.length;
        return { ...p, teamId: assignedTeam, role: undefined };
      }
      return p;
    });
    
    // Attempt basic role assignment if none exist
    teams.forEach(team => {
        const teamPlayers = newPlayers.filter(p => p.teamId === team.id);
        const hasCaptain = teamPlayers.some(p => p.role === 'captain');
        const hasAnalyst = teamPlayers.some(p => p.role === 'analyst');
        
        let assignedC = hasCaptain;
        let assignedA = hasAnalyst;

        teamPlayers.forEach(p => {
            if (!p.role) {
                if (!assignedC) {
                    p.role = 'captain';
                    assignedC = true;
                } else if (!assignedA) {
                    p.role = 'analyst';
                    assignedA = true;
                }
            }
        });
    });

    onPlayersChange(newPlayers);
  };

  const unassignedPlayers = players.filter((p) => !p.teamId);
  const activeDragPlayer = activeId ? players.find((p) => p.id === activeId) : null;

  // Check if game is ready to start
  const isReady =
    players.length > 0 &&
    unassignedPlayers.length === 0 &&
    teams.every((team) => {
      const teamPlayers = players.filter((p) => p.teamId === team.id);
      return (
        teamPlayers.length > 0 &&
        teamPlayers.some((p) => p.role === 'captain') &&
        teamPlayers.some((p) => p.role === 'analyst')
      );
    });

  return (
    <div className="h-screen bg-[var(--color-background)] flex flex-col font-sans overflow-hidden">
      {/* Header */}
      <header className="bg-[var(--color-surface)] border-b border-[var(--color-border)] shadow-sm z-10 shrink-0">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-xs font-bold text-[var(--color-text-muted)] uppercase tracking-wider mb-0.5">
              Game PIN
            </span>
            <span className="text-4xl font-extrabold text-[var(--color-text-primary)] tracking-widest drop-shadow-sm leading-none">
              {pin.slice(0, 3)} {pin.slice(3, 6)}
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button
              onClick={handleAutoDistribute}
              disabled={unassignedPlayers.length === 0}
              className="flex items-center gap-2 btn-secondary bg-[var(--color-surface)] border-2 border-[var(--color-indigo-light)]/20 text-[var(--color-indigo)] px-5 rounded-xl font-bold hover:bg-[var(--color-indigo-light)]/5 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              <Shuffle size={20} />
              Auto-Distribute
            </button>

            <button
              onClick={onStartQuiz}
              disabled={!isReady}
              className="flex items-center gap-2 btn-primary bg-[var(--color-success)] text-white px-8 rounded-xl text-lg font-bold hover:bg-[var(--color-teal-dark)] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg active:scale-95"
            >
              <Play size={20} fill="currentColor" />
              Start Game
            </button>

            {onBackToEditor && (
              <button
                onClick={onBackToEditor}
                className="text-xs text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)] underline absolute top-2 right-4"
              >
                Dev: Exit
              </button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content: Split Screen */}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <main className="flex-1 max-w-[1600px] mx-auto w-full flex overflow-hidden">
          {/* Left Column: Waiting Room */}
          <div className="w-80 shrink-0">
            <WaitingRoom players={unassignedPlayers} />
          </div>

          {/* Right Column: Teams Grid */}
          <div className="flex-1 p-6 overflow-y-auto bg-[var(--color-background)]/50 custom-scrollbar">
            <div className="max-w-5xl mx-auto flex flex-col gap-6">
              {teams.map((team) => (
                <TeamContainer
                  key={team.id}
                  team={team}
                  players={players.filter((p) => p.teamId === team.id)}
                  onToggleRole={handleToggleRole}
                  onRemovePlayer={handleRemovePlayer}
                />
              ))}
            </div>
          </div>
        </main>

        <DragOverlay>
          {activeDragPlayer ? (
            <div className="rotate-3 scale-105 opacity-90 cursor-grabbing shadow-2xl rounded-xl">
              <LobbyPlayerCard
                player={activeDragPlayer}
                inTeam={!!activeDragPlayer.teamId}
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};
