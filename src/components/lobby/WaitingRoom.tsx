import React from 'react';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { Users } from 'lucide-react';
import type { Player } from '../../types/lobby';
import { LobbyPlayerCard } from './LobbyPlayerCard';

interface WaitingRoomProps {
  players: Player[];
}

export const WaitingRoom: React.FC<WaitingRoomProps> = ({ players }) => {
  const { setNodeRef, isOver } = useDroppable({
    id: 'waiting-room',
  });

  return (
    <div className="flex flex-col h-full bg-[var(--color-surface)] border-r border-[var(--color-border)]">
      <div className="p-5 border-b border-[var(--color-border)] flex items-center justify-between bg-[var(--color-background)]/50">
        <h2 className="text-xl font-extrabold text-[var(--color-text-primary)] tracking-tight">Waiting Room</h2>
        <div className="flex items-center gap-2 bg-[var(--color-surface)] px-3 py-1 rounded-full shadow-sm border border-[var(--color-border)]">
          <Users size={16} className="text-[var(--color-text-muted)]" />
          <span className="font-bold text-[var(--color-text-secondary)]">{players.length}</span>
        </div>
      </div>

      <div
        ref={setNodeRef}
        className={`flex-1 p-4 overflow-y-auto custom-scrollbar flex flex-col gap-3 transition-colors ${
          isOver ? 'bg-[var(--color-indigo-light)]/10' : 'bg-[var(--color-background)]/30'
        }`}
      >
        <SortableContext
          items={players.map((p) => p.id)}
          strategy={verticalListSortingStrategy}
        >
          {players.map((player) => (
            <LobbyPlayerCard key={player.id} player={player} inTeam={false} />
          ))}
        </SortableContext>
        
        {players.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-[var(--color-text-muted)] opacity-50">
            <Users size={48} className="mb-4" />
            <p className="font-medium text-center px-4">All players have been assigned to teams</p>
          </div>
        )}
      </div>
    </div>
  );
};
