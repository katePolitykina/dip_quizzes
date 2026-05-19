import React from 'react';
import { Edit2 } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';
import { useI18n } from '../../i18n/I18nProvider';

interface UserProfileHeaderProps {
  displayName: string;
  email: string;
  avatarSeed: string;
  onEditProfile: () => void;
}

export const UserProfileHeader: React.FC<UserProfileHeaderProps> = ({
  displayName,
  email,
  avatarSeed,
  onEditProfile,
}) => {
  const { messages } = useI18n();
  const avatar = createAvatar(botttsNeutral, {
    seed: avatarSeed,
    radius: 50,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  });

  return (
    <div className="card flex items-center justify-between overflow-hidden p-6">
      <div className="flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-full overflow-hidden border border-white/90 shadow-lg shrink-0"
          dangerouslySetInnerHTML={{ __html: avatar.toString() }}
        />
        <div className="flex flex-col">
          <p className="section-label">{messages.dashboard.profile}</p>
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
            {displayName}
          </h2>
          <p className="text-sm font-bold text-text-secondary">
            {email}
          </p>
        </div>
      </div>

      <button
        className="btn-secondary btn-glass min-h-0 px-3 py-3 text-text-secondary"
        aria-label={messages.dashboard.editProfile}
        onClick={onEditProfile}
      >
        <Edit2 size={20} />
      </button>
    </div>
  );
};
