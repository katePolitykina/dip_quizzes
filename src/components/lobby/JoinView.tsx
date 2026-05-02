import React, { useState } from 'react';
import { createAvatar } from '@dicebear/core';
import { botttsNeutral } from '@dicebear/collection';
import { Check } from 'lucide-react';
import { GoogleSignInButton } from '../auth/GoogleSignInButton';

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
    <div className="min-h-screen bg-gradient-to-br from-[var(--color-indigo)] via-[var(--color-violet)] to-[var(--color-amber)] flex items-center justify-center p-4">
      <div className="w-full max-w-md card p-8 sm:p-10 transform transition-all hover:scale-[1.01]">
        
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[var(--color-text-primary)] mb-2 tracking-tight">Quizzly</h1>
          <p className="text-[var(--color-text-secondary)] font-medium">Enter PIN to join the game</p>
        </div>

        <form onSubmit={handleJoin} className="space-y-6">
          <div>
            <input
              type="text"
              value={pin}
              onChange={handlePinChange}
              placeholder="Game PIN"
              className="w-full text-center text-4xl sm:text-5xl font-bold tracking-widest text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] border-2 border-[var(--color-border)] rounded-2xl py-4 focus:outline-none focus:border-[var(--color-violet)] focus:ring-4 focus:ring-[var(--color-violet)]/20 transition-all bg-transparent"
            />
          </div>

          <div>
            <input
              type="text"
              value={nickname}
              onChange={(e) => setNickname(e.target.value)}
              placeholder="Nickname"
              maxLength={20}
              className="w-full text-center text-xl sm:text-2xl font-semibold text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] border-2 border-[var(--color-border)] rounded-xl py-3 focus:outline-none focus:border-[var(--color-violet)] focus:ring-4 focus:ring-[var(--color-violet)]/20 transition-all bg-transparent"
            />
          </div>

          <div className="space-y-4">
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-24 h-24 rounded-full overflow-hidden shadow-lg border-4 border-surface ring-2 ring-[var(--color-violet)]/20 bg-background"
                dangerouslySetInnerHTML={{ __html: generateAvatarSvg(selectedAvatarSeed) }}
              />
              <p className="text-sm font-semibold text-[var(--color-text-secondary)]">Choose your avatar</p>
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
                      : 'border-[var(--color-border)] hover:border-[var(--color-violet)]'
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
            className="w-full btn-primary bg-[var(--color-midnight)] text-white hover:bg-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
          >
            {isJoining ? 'Joining...' : 'Enter'}
          </button>
          {error && (
            <p className="text-center text-sm font-semibold text-[var(--color-error)]">{error}</p>
          )}
        </form>

        <div className="mt-6 border-t border-white/30 pt-6">
          <GoogleSignInButton label="Sign in with Google as host" />
        </div>

      </div>
    </div>
  );
};
