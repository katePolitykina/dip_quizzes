import React from 'react';
import { Plus, Hash } from 'lucide-react';

interface GlobalActionsProps {
  onCreateQuiz: () => void;
  onJoinLobby: () => void;
}

export const GlobalActions: React.FC<GlobalActionsProps> = ({
  onCreateQuiz,
  onJoinLobby,
}) => {
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <button
        onClick={onCreateQuiz}
        className="btn-primary flex-1 flex items-center justify-center gap-3 bg-indigo text-white px-6 shadow-sm hover:bg-indigo-dark hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
      >
        <Plus size={24} strokeWidth={2.5} />
        <span className="text-lg">Create New Quiz</span>
      </button>

      <button
        onClick={onJoinLobby}
        className="btn-primary flex-1 flex items-center justify-center gap-3 bg-amber text-midnight px-6 shadow-sm hover:bg-amber-dark hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.98] transition-all duration-200"
      >
        <Hash size={24} strokeWidth={2.5} />
        <span className="text-lg">Join Game Lobby</span>
      </button>
    </div>
  );
};
