import React, { useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';
import { Check } from 'lucide-react';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';
import { useI18n } from '../../i18n/I18nProvider';

interface JoinViewProps {
  onJoin: (pin: string, nickname: string, avatarSeed: string) => void;
  isJoining?: boolean;
  error?: string | null;
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

export const JoinView: React.FC<JoinViewProps> = ({ onJoin, isJoining = false, error }) => {
  const { messages } = useI18n();
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');
  const [selectedAvatarSeed, setSelectedAvatarSeed] = useState(AVATAR_PRESETS[0]);

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, max 6 digits
    const value = e.target.value.slice(0, 6);
    setPin(value);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6 && nickname.trim().length > 0) {
      onJoin(pin, nickname.trim(), selectedAvatarSeed);
    }
  };

  const isFormValid = pin.length === 6 && nickname.trim().length > 0;

  return (
    <div className="screen-shell flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-8 sm:p-10 transition-all hover:scale-[1.01]">
        <div className="text-center mb-8">
          <p className="section-label">{messages.join.playerEntry}</p>
          <h1 className="mb-2 text-4xl font-black tracking-tight"><span className="gradient-text">Quizzly</span></h1>
          <p className="font-semibold text-[var(--color-text-secondary)]">{messages.join.enterPinToJoin}</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <input
              type="text"
              value={pin}
              onChange={handlePinChange}
              placeholder={messages.join.gamePin}
              className="glass-input table-numbers w-full py-4 text-center text-4xl font-black tracking-[0.24em] placeholder-[var(--color-text-muted)] sm:text-5xl"
            />
          </div>

          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder={messages.join.nickname}
              maxLength={20}
              className="glass-input w-full py-3 text-center text-xl font-extrabold sm:text-2xl"
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-24 h-24 rounded-full overflow-hidden border border-white/90 bg-background shadow-lg"
                dangerouslySetInnerHTML={{ __html: generateAvatarSvg(selectedAvatarSeed) }}
              />
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">{messages.join.chooseYourAvatar}</p>
            </div>

            <div className="grid grid-cols-8 gap-2">
              {AVATAR_PRESETS.map((seed) => (
                <button
                  key={seed}
                  type="button"
                  onClick={() => setSelectedAvatarSeed(seed)}
                  className={`relative aspect-square rounded-full overflow-hidden border-2 transition-all duration-200 hover:scale-110 focus:outline-none ${
                    selectedAvatarSeed === seed
                      ? 'border-[var(--color-violet)] shadow-md shadow-[var(--color-violet)]/20 scale-110'
                      : 'border-white/80 hover:border-[var(--color-violet)]'
                  }`}
                  title={seed}
                >
                  <div
                    className="w-full h-full bg-background"
                    dangerouslySetInnerHTML={{ __html: generateAvatarSvg(seed) }}
                  />
                  {selectedAvatarSeed === seed && (
                    <div className="absolute inset-0 flex items-center justify-center bg-[var(--color-violet)]/20">
                      <Check size={14} strokeWidth={3} className="text-[var(--color-violet)]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={!isFormValid || isJoining}
            className="btn-primary btn-cta w-full disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isJoining ? messages.join.joining : messages.join.enter}
          </button>
          {error && (
            <p className="text-center text-sm font-semibold text-[var(--color-error)]">{error}</p>
          )}
        </form>

        <div className="mt-6 border-t border-white/30 pt-6">
          <GoogleSignInButton label={messages.join.signInAsHost} />
        </div>

      </div>
    </div>
  );
};
