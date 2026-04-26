import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  horizontalListSortingStrategy
} from '@dnd-kit/sortable';
import { Shield } from 'lucide-react';
import type { Player, Team, PlayerRole } from '../../types/lobby';
import { LobbyPlayerCard } from './LobbyPlayerCard';

interface TeamContainerProps {
  team: Team;
  players: Player[];
  onToggleRole: (playerId: string, role: PlayerRole) => void;
  onRemovePlayer: (playerId: string) => void;
}

export const TeamContainer: React.FC<TeamContainerProps> = ({
  team,
  players,
  onToggleRole,
  onRemovePlayer,
}) => {
  const { setNodeRef, isOver } = useDroppable({
    id: team.id,
  });

  const hasCaptain = players.some((p) => p.role === 'captain');
  const hasAnalyst = players.some((p) => p.role === 'analyst');
  const isReady = hasCaptain && hasAnalyst && players.length > 0;

  return (
    <div
      className={`card border-2 overflow-hidden transition-all duration-300 flex flex-col ${
        isOver
          ? 'border-[var(--color-indigo)] shadow-[var(--color-indigo-light)]/20 scale-[1.01]'
          : isReady
          ? 'border-[var(--color-success)]/30 hover:border-[var(--color-success)] hover:shadow-md'
          : 'border-[var(--color-border)] hover:border-[var(--color-indigo-light)]/40 hover:shadow-md'
      }`}
    >
      <div className={`p-4 border-b flex items-center justify-between ${
        isReady ? 'bg-[var(--color-success)]/5 border-[var(--color-success)]/10' : 'bg-[var(--color-background)]/50 border-[var(--color-border)]'
      }`}>
        <div className="flex items-center gap-3">
          <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${
            isReady ? 'bg-[var(--color-success)] text-white' : 'bg-[var(--color-border)] text-[var(--color-text-muted)]'
          }`}>
            {team.name.replace('Team ', '')}
          </div>
          <h3 className="font-bold text-[var(--color-text-primary)] text-lg">{team.name}</h3>
        </div>

        <div className="flex items-center gap-2">
          {/* Status Badge */}
          {isReady ? (
            <span className="px-2 py-1 bg-[var(--color-success)]/10 text-[var(--color-success)] text-xs font-bold rounded flex items-center gap-1">
              <Shield size={12} /> Ready
            </span>
          ) : (
            <span className="px-2 py-1 bg-[var(--color-amber)]/10 text-[var(--color-amber-dark)] text-xs font-bold rounded">
              Needs Roles
            </span>
          )}
          <span className="text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface)] px-2 py-0.5 rounded border border-[var(--color-border)] shadow-sm">
            {players.length}/5
          </span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`p-4 min-h-[140px] flex flex-wrap gap-3 ${
          players.length === 0 ? 'items-center justify-center' : 'items-start'
        }`}
      >
        <SortableContext
          items={players.map((p) => p.id)}
          strategy={horizontalListSortingStrategy}
        >
          {players.map((player) => (
            <div key={player.id} className="w-full sm:w-[calc(50%-0.375rem)] lg:w-[calc(33.333%-0.5rem)]">
              <LobbyPlayerCard
                player={player}
                inTeam={true}
                onToggleRole={onToggleRole}
                onRemove={onRemovePlayer}
              />
            </div>
          ))}
        </SortableContext>
        
        {players.length === 0 && (
          <p className="text-[var(--color-text-muted)] font-medium opacity-50 border-2 border-dashed border-[var(--color-border)] rounded-xl w-full h-full flex items-center justify-center">
            Drop players here
          </p>
        )}
      </div>
    </div>
  );
};
