import React, { useState } from 'react';
import { GoogleSignInButton } from './GoogleSignInButton';
import { useI18n } from '../../i18n/I18nProvider';

interface AuthPanelProps {
  isLoading: boolean;
  error: string | null;
  onLogin: (email: string, password: string) => void;
  onRegister: (payload: { email: string; password: string; displayName: string }) => void;
  onJoinLobby: () => void;
}

export const AuthPanel: React.FC<AuthPanelProps> = ({
  isLoading,
  error,
  onLogin,
  onRegister,
  onJoinLobby,
}) => {
  const { messages } = useI18n();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const normalizedEmail = email.trim();
    if (mode === 'login') {
      onLogin(normalizedEmail, password);
      return;
    }
    onRegister({ email: normalizedEmail, password, displayName: displayName.trim() });
  };

  const inputClass = 'glass-input w-full px-4 py-3.5 text-[15px] font-semibold transition-all';

  return (
    <div className="card p-8">
      <div className="glass-inset flex items-center gap-1 rounded-full p-1">
        <button
          onClick={() => setMode('login')}
          className={`flex-1 rounded-full py-2.5 text-sm font-extrabold transition-all ${
            mode === 'login'
              ? 'bg-white/80 text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          {messages.auth.login}
        </button>
        <button
          onClick={() => setMode('register')}
          className={`flex-1 rounded-full py-2.5 text-sm font-extrabold transition-all ${
            mode === 'register'
              ? 'bg-white/80 text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]'
          }`}
        >
          {messages.auth.register}
        </button>
      </div>

      <p className="section-label mt-5">{messages.auth.hostAccess}</p>
      <h2 className="mt-2 text-3xl font-black tracking-tight text-text-primary">
        {mode === 'login' ? messages.auth.continueAsHost : messages.auth.createHostAccount}
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-3">
        {mode === 'register' && (
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={messages.auth.displayName}
            className={inputClass}
          />
        )}
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder={messages.auth.email}
          className={inputClass}
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder={messages.auth.password}
          className={inputClass}
        />
        {error && <p className="text-sm font-medium text-error">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary btn-cta w-full disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? messages.auth.submitting : mode === 'login' ? messages.auth.login : messages.auth.register}
        </button>
      </form>

      <div className="mt-4">
        <GoogleSignInButton label={mode === 'login' ? messages.auth.signInWithGoogle : messages.auth.continueWithGoogle} />
      </div>

      <div className="mt-5 border-t border-border pt-5">
        <button
          onClick={onJoinLobby}
          className="btn-secondary btn-glass w-full"
        >
          {messages.auth.joinRoomAsPlayer}
        </button>
      </div>
    </div>
  );
};
