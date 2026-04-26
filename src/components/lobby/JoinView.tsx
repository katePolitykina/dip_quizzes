import React, { useState } from 'react';

interface JoinViewProps {
  onJoin: (pin: string, nickname: string) => void;
  onHostLogin?: () => void; // Optional, user said "do not implement this now" but we can leave the prop out or hide the button
}

export const JoinView: React.FC<JoinViewProps> = ({ onJoin }) => {
  const [pin, setPin] = useState('');
  const [nickname, setNickname] = useState('');

  const handlePinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers, max 6 digits
    const value = e.target.value.replace(/\D/g, '').slice(0, 6);
    setPin(value);
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length === 6 && nickname.trim().length > 0) {
      onJoin(pin, nickname.trim());
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

          <button
            type="submit"
            disabled={!isFormValid}
            className="w-full btn-primary bg-[var(--color-midnight)] text-white hover:bg-[var(--color-text-primary)] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl active:scale-95"
          >
            Enter
          </button>
        </form>

      </div>
    </div>
  );
};
