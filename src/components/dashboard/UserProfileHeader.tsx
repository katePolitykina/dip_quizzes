import React from 'react';
import { Edit2 } from 'lucide-react';
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';

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
  const avatar = createAvatar(botttsNeutral, {
    seed: avatarSeed,
    radius: 50,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  });

  return (
    <div className="card p-6 flex items-center justify-between hover:shadow-md transition-shadow duration-200">
      <div className="flex items-center gap-5">
        <div
          className="w-16 h-16 rounded-full overflow-hidden shadow-inner bg-background border-2 border-surface ring-2 ring-border"
          dangerouslySetInnerHTML={{ __html: avatar.toString() }}
        />
        <div className="flex flex-col">
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">
            {displayName}
          </h2>
          <p className="text-sm font-medium text-text-muted">
            {email}
          </p>
        </div>
      </div>
      
      <button 
        className="p-3 text-text-muted hover:text-indigo hover:bg-analyst-blue-bg rounded-[12px] transition-all duration-200 group"
        aria-label="Edit Profile"
        onClick={onEditProfile}
      >
        <Edit2 size={20} className="group-active:scale-95 transition-transform duration-200" />
      </button>
    </div>
  );
};
