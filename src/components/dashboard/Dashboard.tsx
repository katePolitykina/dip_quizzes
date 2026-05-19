import React, { useState } from 'react';
import { Zap, Users, SlidersHorizontal } from 'lucide-react';
import { UserProfileHeader } from './UserProfileHeader';
import { GlobalActions } from './GlobalActions';
import { QuizLibrary } from './QuizLibrary';
import { EditProfileModal } from './EditProfileModal';
import { HostGameModal, type HostGameSettings } from './HostGameModal';
import type { QuizSnippet } from './QuizCard';
import type { UserMeResponse } from '../../types/api';
import { AuthPanel } from '../auth/AuthPanel';
import { useI18n } from '../../i18n/I18nProvider';

interface DashboardProps {
  onCreateQuiz: () => void;
  onJoinLobby: () => void;
  onHostGame: (quizId: string, settings: HostGameSettings) => void;
  onEditQuiz: (quizId: string) => void;
  onDeleteQuiz: (quizId: string, quizTitle: string) => void;
  user: UserMeResponse | null;
  quizzes: QuizSnippet[];
  isGuest: boolean;
  isLoading: boolean;
  authError: string | null;
  onLogin: (email: string, password: string) => void;
  onRegister: (payload: { email: string; password: string; displayName: string }) => void;
  onSaveProfile: (displayName: string, avatarSeed: string) => void;
  onLogout: () => void;
}

export const Dashboard: React.FC<DashboardProps> = ({
  onCreateQuiz,
  onJoinLobby,
  onHostGame,
  onEditQuiz,
  onDeleteQuiz,
  user,
  quizzes,
  isGuest,
  isLoading,
  authError,
  onLogin,
  onRegister,
  onSaveProfile,
  onLogout,
}) => {
  const { messages } = useI18n();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hostingSelection, setHostingSelection] = useState<{ quizId: string; quizTitle: string } | null>(null);

  const handleSaveProfile = (newName: string, newSeed: string) => {
    onSaveProfile(newName, newSeed);
  };

  if (!user || isGuest) {
    return (
      <div className="screen-shell flex items-center justify-center p-4 sm:p-8">
        <div className="w-full max-w-5xl grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-center">
          <div className="text-[var(--color-text-primary)]">
            <p className="section-label">{messages.dashboard.hostConsole}</p>
            <h1 className="mt-4 text-[clamp(4rem,9vw,5.5rem)] font-black leading-[0.94] tracking-[-0.04em] text-balance">
              <span className="gradient-text">{messages.dashboard.heroTitle}</span>
            </h1>
            <p className="mt-4 text-xl font-extrabold leading-snug text-[var(--color-text-primary)]">
              {messages.dashboard.heroSubtitle}
            </p>
            <p className="mt-3 max-w-xl text-[17px] font-semibold leading-7 text-[var(--color-text-secondary)]">
              {messages.dashboard.heroDescription}
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              <div className="card-soft card p-4">
                <Zap size={20} className="text-[var(--color-text-secondary)]" />
                <p className="mt-2 font-extrabold text-[var(--color-text-primary)]">{messages.dashboard.liveGameRooms}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">{messages.dashboard.realTimeSync}</p>
              </div>
              <div className="card-soft card p-4">
                <Users size={20} className="text-[var(--color-text-secondary)]" />
                <p className="mt-2 font-extrabold text-[var(--color-text-primary)]">{messages.dashboard.teamPlay}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">{messages.dashboard.teamRoles}</p>
              </div>
              <div className="card-soft card p-4">
                <SlidersHorizontal size={20} className="text-[var(--color-text-secondary)]" />
                <p className="mt-2 font-extrabold text-[var(--color-text-primary)]">{messages.dashboard.fullControl}</p>
                <p className="mt-1 text-sm font-semibold text-[var(--color-text-secondary)]">{messages.dashboard.fullControlDescription}</p>
              </div>
            </div>
          </div>
          <AuthPanel
            isLoading={isLoading}
            error={authError}
            onLogin={onLogin}
            onRegister={onRegister}
            onJoinLobby={onJoinLobby}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="screen-shell">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-20 flex flex-col gap-8">
        <section>
          <UserProfileHeader
            displayName={user.displayName}
            email={user.email ?? user.provider}
            avatarSeed={user.avatarUrl || user.displayName}
            onEditProfile={() => setIsEditModalOpen(true)}
          />
        </section>

        <section>
          <GlobalActions
            onCreateQuiz={onCreateQuiz}
            onJoinLobby={onJoinLobby}
          />
        </section>

        <section className="card p-6">
          <QuizLibrary
            quizzes={quizzes}
            onHostGame={(quizId, quizTitle) => setHostingSelection({ quizId, quizTitle })}
            onEditQuiz={onEditQuiz}
            onDeleteQuiz={onDeleteQuiz}
          />
        </section>

        <section className="flex justify-end pb-4">
          <button
            onClick={onLogout}
            className="text-sm font-semibold text-white/60 hover:text-white underline transition-colors"
          >
            {messages.dashboard.signOut}
          </button>
        </section>
      </div>

      {isEditModalOpen && (
        <EditProfileModal
          displayName={user.displayName}
          avatarSeed={user.avatarUrl || user.displayName}
          onSave={handleSaveProfile}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
      {hostingSelection && (
        <HostGameModal
          quizTitle={hostingSelection.quizTitle}
          onStart={(settings) => {
            onHostGame(hostingSelection.quizId, settings);
            setHostingSelection(null);
          }}
          onClose={() => setHostingSelection(null)}
        />
      )}
    </div>
  );
};
