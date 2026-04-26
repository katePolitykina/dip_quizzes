import React, { useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';
import { X, Check } from 'lucide-react';

interface EditProfileModalProps {
  displayName: string;
  avatarSeed: string;
  onSave: (name: string, avatarSeed: string) => void;
  onClose: () => void;
}

const AVATAR_PRESETS = [
  'felix', 'avery', 'sam', 'riley', 'jordan',
  'morgan', 'alex', 'casey', 'drew', 'quinn',
  'taylor', 'dakota', 'reese', 'skyler', 'blake',
  'charlie',
];

function generateAvatarSvg(seed: string): string {
  return createAvatar(botttsNeutral, {
    seed,
    radius: 20,
    backgroundColor: ['b6e3f4', 'c0aede', 'd1d4f9', 'ffd5dc', 'ffdfbf'],
  }).toString();
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  displayName,
  avatarSeed,
  onSave,
  onClose,
}) => {
  const [name, setName] = useState(displayName);
  const [selectedSeed, setSelectedSeed] = useState(avatarSeed);

  const isNameValid = name.trim().length >= 2;

  const handleSave = () => {
    if (!isNameValid) return;
    onSave(name.trim(), selectedSeed);
    onClose();
  };

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-midnight/40 backdrop-blur-sm p-4"
      onClick={handleBackdropClick}
    >
      <div className="glass-overlay rounded-[16px] shadow-2xl w-full max-w-lg overflow-hidden bg-surface">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">Edit Profile</h2>
          <button
            onClick={onClose}
            className="p-2 rounded-[12px] text-text-muted hover:bg-background hover:text-text-primary transition-all duration-200"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8">

          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-surface ring-2 ring-indigo/20 bg-background"
              dangerouslySetInnerHTML={{ __html: generateAvatarSvg(selectedSeed) }}
            />
            <p className="text-sm font-semibold text-text-muted">Choose an avatar below</p>
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-8 gap-2">
            {AVATAR_PRESETS.map((seed) => (
              <button
                key={seed}
                onClick={() => setSelectedSeed(seed)}
                className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110 focus:outline-none ${
                  selectedSeed === seed
                    ? 'border-indigo shadow-md shadow-indigo/20 scale-110'
                    : 'border-border hover:border-indigo-light'
                }`}
                title={seed}
              >
                <div
                  className="w-full h-full bg-background"
                  dangerouslySetInnerHTML={{ __html: generateAvatarSvg(seed) }}
                />
                {selectedSeed === seed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-indigo/20">
                    <Check size={14} strokeWidth={3} className="text-indigo" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Display Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-text-secondary tracking-wide">
              Display Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder="Enter your name..."
              className={`w-full px-4 py-3 text-lg font-semibold text-text-primary border-2 rounded-[12px] outline-none transition-all duration-200 ${
                !isNameValid && name.length > 0
                  ? 'border-error focus:ring-2 focus:ring-error/20'
                  : 'border-border focus:border-indigo focus:ring-2 focus:ring-indigo/10'
              }`}
            />
            {!isNameValid && name.length > 0 && (
              <p className="text-xs text-error font-medium">Name must be at least 2 characters.</p>
            )}
            <p className="text-xs text-text-muted text-right">{name.length}/30</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="btn-secondary flex-1 border-2 border-border text-text-secondary rounded-[12px] hover:bg-background transition-all duration-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!isNameValid}
            className="btn-secondary flex-1 bg-indigo text-white rounded-[12px] hover:bg-indigo-dark disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-sm"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};
