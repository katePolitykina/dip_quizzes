import React, { useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';
import { X, Check } from 'lucide-react';
import { useI18n } from '../../i18n/I18nProvider';

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
  const { messages } = useI18n();
  const [name, setName] = useState(displayName);
  const [selectedSeed, setSelectedSeed] = useState(avatarSeed);

  const isNameValid = name.trim().length >= 3;

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
      <div className="glass-overlay w-full max-w-lg overflow-hidden">

        {/* Modal Header */}
        <div className="flex items-center justify-between p-6 border-b border-border">
          <h2 className="text-2xl font-extrabold text-text-primary tracking-tight">{messages.dashboard.editProfile}</h2>
          <button
            onClick={onClose}
            className="btn-secondary btn-glass min-h-0 rounded-full p-2 text-text-muted"
          >
            <X size={22} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-8">

          {/* Avatar Preview */}
          <div className="flex flex-col items-center gap-3">
            <div
              className="w-24 h-24 rounded-full overflow-hidden border border-white/90 bg-background shadow-lg"
              dangerouslySetInnerHTML={{ __html: generateAvatarSvg(selectedSeed) }}
            />
            <p className="text-sm font-semibold text-text-muted">{messages.dashboard.chooseAvatarBelow}</p>
          </div>

          {/* Avatar Grid */}
          <div className="grid grid-cols-8 gap-2">
            {AVATAR_PRESETS.map((seed) => (
              <button
                key={seed}
                onClick={() => setSelectedSeed(seed)}
                className={`relative w-full aspect-square rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110 focus:outline-none ${
                  selectedSeed === seed
                    ? 'border-[var(--color-indigo)] shadow-md shadow-[rgba(236,72,153,0.24)] scale-110'
                    : 'border-white/80 hover:border-[var(--color-indigo-light)]'
                }`}
                title={seed}
              >
                <div
                  className="h-full w-full bg-background"
                  dangerouslySetInnerHTML={{ __html: generateAvatarSvg(seed) }}
                />
                {selectedSeed === seed && (
                  <div className="absolute inset-0 flex items-center justify-center bg-[rgba(236,72,153,0.16)]">
                    <Check size={14} strokeWidth={3} className="text-[var(--color-indigo)]" />
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* Display Name Input */}
          <div className="flex flex-col gap-2">
            <label className="text-sm font-bold text-text-secondary tracking-wide">
              {messages.dashboard.displayNameLabel}
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={30}
              placeholder={messages.dashboard.enterYourName}
              className={`glass-input w-full px-4 py-3 text-lg font-semibold text-text-primary rounded-[14px] transition-all duration-200 ${
                !isNameValid && name.length > 0
                  ? 'border-[var(--color-error)]'
                  : ''
              }`}
            />
            {!isNameValid && name.length > 0 && (
              <p className="text-xs text-error font-medium">{messages.dashboard.nameValidation}</p>
            )}
            <p className="text-xs text-text-muted text-right">{name.length}/30</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex gap-3 p-6 pt-0">
          <button
            onClick={onClose}
            className="btn-secondary btn-glass flex-1"
          >
            {messages.dashboard.cancel}
          </button>
          <button
            onClick={handleSave}
            disabled={!isNameValid}
            className="btn-secondary btn-cta flex-1 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {messages.dashboard.saveChanges}
          </button>
        </div>
      </div>
    </div>
  );
};
