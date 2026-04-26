import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';
import { GripVertical, Crown, Brain, X } from 'lucide-react';
import type { Player, PlayerRole } from '../../types/lobby';

interface LobbyPlayerCardProps {
  player: Player;
  inTeam: boolean;
  onToggleRole?: (playerId: string, role: PlayerRole) => void;
  onRemove?: (playerId: string) => void;
}

export const LobbyPlayerCard: React.FC<LobbyPlayerCardProps> = ({
  player,
  inTeam,
  onToggleRole,
  onRemove,
}) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: player.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const avatar = createAvatar(botttsNeutral, {
    seed: player.avatarSeed,
    radius: 20,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  });

  const isCaptain = player.role === 'captain';
  const isAnalyst = player.role === 'analyst';

  // Determine card styling based on role
  let cardBorder = 'border-[var(--color-border)] hover:border-[var(--color-text-muted)]';
  if (inTeam) {
    if (isCaptain) cardBorder = 'border-[var(--color-captain-gold)] ring-1 ring-[var(--color-captain-gold)] bg-[var(--color-captain-gold-bg)]';
    else if (isAnalyst) cardBorder = 'border-[var(--color-analyst-blue)] ring-1 ring-[var(--color-analyst-blue)] bg-[var(--color-analyst-blue-bg)]';
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`relative group flex items-center p-2 card border-2 transition-colors ${cardBorder} ${
        isDragging ? 'opacity-50 z-50 shadow-xl' : 'shadow-sm hover:shadow-md'
      }`}
    >
      <div
        {...attributes}
        {...listeners}
        className="cursor-grab p-1 mr-1 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] active:cursor-grabbing shrink-0"
      >
        <GripVertical size={18} />
      </div>

      <div
        className="w-10 h-10 rounded-full overflow-hidden shadow-inner bg-[var(--color-background)] border border-[var(--color-border)] shrink-0"
        dangerouslySetInnerHTML={{ __html: avatar.toString() }}
      />

      <span className="font-bold text-[var(--color-text-primary)] text-sm truncate ml-3 flex-1">
        {player.nickname}
      </span>

      {inTeam && (
        <div className="flex items-center gap-1 ml-2">
          <button
            onClick={() => onToggleRole?.(player.id, 'captain')}
            className={`p-1.5 rounded-md transition-colors ${
              isCaptain
                ? 'bg-[var(--color-captain-gold-bg)] text-[var(--color-captain-gold)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-captain-gold)]'
            }`}
            title="Toggle Captain"
          >
            <Crown size={16} strokeWidth={isCaptain ? 3 : 2} />
          </button>
          <button
            onClick={() => onToggleRole?.(player.id, 'analyst')}
            className={`p-1.5 rounded-md transition-colors ${
              isAnalyst
                ? 'bg-[var(--color-analyst-blue-bg)] text-[var(--color-analyst-blue)]'
                : 'text-[var(--color-text-muted)] hover:bg-[var(--color-background)] hover:text-[var(--color-analyst-blue)]'
            }`}
            title="Toggle Analyst"
          >
            <Brain size={16} strokeWidth={isAnalyst ? 3 : 2} />
          </button>
        </div>
      )}

      {inTeam && (
        <button
          onClick={() => onRemove?.(player.id)}
          className="absolute -top-2 -right-2 bg-[var(--color-surface)] text-[var(--color-text-muted)] hover:text-[var(--color-error)] border border-[var(--color-border)] rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
          title="Remove from team"
        >
          <X size={14} strokeWidth={3} />
        </button>
      )}
    </div>
  );
};
