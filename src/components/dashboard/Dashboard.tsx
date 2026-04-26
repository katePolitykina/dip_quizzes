import React, { useState } from 'react';
import { UserProfileHeader } from './UserProfileHeader';
import { GlobalActions } from './GlobalActions';
import { QuizLibrary } from './QuizLibrary';
import { EditProfileModal } from './EditProfileModal';
import type { QuizSnippet } from './QuizCard';

interface DashboardProps {
  onCreateQuiz: () => void;
  onJoinLobby: () => void;
  onHostGame: (quizId: string) => void;
  onEditQuiz: (quizId: string) => void;
}

const MOCK_QUIZZES: QuizSnippet[] = [
  {
    id: 'q-1',
    title: 'Biology 10 - Cell Structure',
    questionCount: 15,
  },
  {
    id: 'q-2',
    title: 'Company Team Building Trivia',
    questionCount: 8,
  },
  {
    id: 'q-3',
    title: 'JavaScript Frameworks 2026',
    questionCount: 20,
  },
  {
    id: 'q-4',
    title: 'JavaScript Frameworks 2026',
    questionCount: 20,
  },
  {
    id: 'q-5',
    title: 'JavaScript Frameworks 2026',
    questionCount: 20,
  },
  {
    id: 'q-6',
    title: 'JavaScript Frameworks 2026',
    questionCount: 20,
  },
];

export const Dashboard: React.FC<DashboardProps> = ({
  onCreateQuiz,
  onJoinLobby,
  onHostGame,
  onEditQuiz,
}) => {
  const [displayName, setDisplayName] = useState('Alex Carter');
  const [avatarSeed, setAvatarSeed] = useState('alex-carter-123');
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  const handleSaveProfile = (newName: string, newSeed: string) => {
    setDisplayName(newName);
    setAvatarSeed(newSeed);
  };

  return (
    <div className="min-h-screen bg-background pb-20">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pt-10 flex flex-col gap-10">

        {/* Profile Section */}
        <section>
          <UserProfileHeader
            displayName={displayName}
            email="alex.carter@example.com"
            avatarSeed={avatarSeed}
            onEditProfile={() => setIsEditModalOpen(true)}
          />
        </section>

        {/* Global Actions */}
        <section>
          <GlobalActions
            onCreateQuiz={onCreateQuiz}
            onJoinLobby={onJoinLobby}
          />
        </section>

        {/* Quiz Library */}
        <section>
          <QuizLibrary
            quizzes={MOCK_QUIZZES}
            onHostGame={onHostGame}
            onEditQuiz={onEditQuiz}
          />
        </section>

      </div>

      {/* Edit Profile Modal */}
      {isEditModalOpen && (
        <EditProfileModal
          displayName={displayName}
          avatarSeed={avatarSeed}
          onSave={handleSaveProfile}
          onClose={() => setIsEditModalOpen(false)}
        />
      )}
    </div>
  );
};
