import React from 'react';
import { Plus, Hash } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

interface GlobalActionsProps {
  onCreateQuiz: () => void;
  onJoinLobby: () => void;
}

export const GlobalActions: React.FC<GlobalActionsProps> = ({
  onCreateQuiz,
  onJoinLobby,
}) => {
  const { messages } = useI18n();
  return (
    <div className="flex flex-col sm:flex-row gap-4 w-full">
      <button
        onClick={onCreateQuiz}
        className="btn-primary btn-cta flex-1 flex items-center justify-center gap-3 px-6"
      >
        <Plus size={24} strokeWidth={2.5} />
        <span className="text-lg">{messages.dashboard.createNewQuiz}</span>
      </button>

      <button
        onClick={onJoinLobby}
        className="btn-primary btn-aurora flex-1 flex items-center justify-center gap-3 px-6"
      >
        <Hash size={24} strokeWidth={2.5} />
        <span className="text-lg">{messages.dashboard.joinGameLobby}</span>
      </button>
    </div>
  );
};
