import React, { useState } from 'react';
import { UserProfileHeader } from './UserProfileHeader';
import { GlobalActions } from './GlobalActions';
import { QuizLibrary } from './QuizLibrary';
import { EditProfileModal } from './EditProfileModal';
import { HostGameModal, type HostGameSettings } from './HostGameModal';
import type { QuizSnippet } from './QuizCard';
import type { UserMeResponse } from '../../types/api';
import { AuthPanel } from '../auth/AuthPanel';

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
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [hostingSelection, setHostingSelection] = useState<{ quizId: string; quizTitle: string } | null>(null);

  const handleSaveProfile = (newName: string, newSeed: string) => {
    onSaveProfile(newName, newSeed);
  };

  if (!user || isGuest) {
    return (
      <div className="min-h-screen bg-background">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 grid lg:grid-cols-[1.2fr_0.8fr] gap-8 items-start">
          <div className="card p-8 bg-gradient-to-br from-white via-white to-[var(--color-indigo-light)]/10">
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-[var(--color-indigo)]">Host Console</p>
            <h1 className="mt-4 text-5xl font-black tracking-tight text-text-primary">Run the live quiz from one room state.</h1>
            <p className="mt-4 text-lg text-text-secondary leading-8">
              Sign in to manage quizzes, create rooms, moderate players, and control the real-time game loop.
            </p>
            <div className="mt-8 grid sm:grid-cols-3 gap-3">
              <div className="card p-4">
                <p className="text-sm font-semibold text-text-muted">REST</p>
                <p className="mt-2 font-bold text-text-primary">JWT-backed quiz CRUD</p>
              </div>
              <div className="card p-4">
                <p className="text-sm font-semibold text-text-muted">STOMP</p>
                <p className="mt-2 font-bold text-text-primary">Live room state sync</p>
              </div>
              <div className="card p-4">
                <p className="text-sm font-semibold text-text-muted">Roles</p>
                <p className="mt-2 font-bold text-text-primary">Captain, Analyst, Member</p>
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
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex flex-col gap-10">
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

        <section>
          <QuizLibrary
            quizzes={quizzes}
            onHostGame={(quizId, quizTitle) => setHostingSelection({ quizId, quizTitle })}
            onEditQuiz={onEditQuiz}
            onDeleteQuiz={onDeleteQuiz}
          />
        </section>

        <section className="flex justify-end">
          <button
            onClick={onLogout}
            className="text-sm font-semibold text-text-muted hover:text-text-primary underline"
          >
            Sign out
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
