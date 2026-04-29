import React, { useState } from 'react';
import { GoogleSignInButton } from './GoogleSignInButton';

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

  return (
    <div className="card p-8">
      <div className="flex items-center gap-2 text-sm font-bold text-text-muted uppercase tracking-[0.2em]">
        <button
          onClick={() => setMode('login')}
          className={mode === 'login' ? 'text-indigo' : ''}
        >
          Login
        </button>
        <span>/</span>
        <button
          onClick={() => setMode('register')}
          className={mode === 'register' ? 'text-indigo' : ''}
        >
          Register
        </button>
      </div>

      <h2 className="mt-4 text-3xl font-black tracking-tight text-text-primary">
        {mode === 'login' ? 'Continue as host' : 'Create host account'}
      </h2>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4">
        {mode === 'register' && (
          <input
            value={displayName}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder="Display name"
            className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-indigo"
          />
        )}
        <input
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          type="email"
          placeholder="Email"
          className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-indigo"
        />
        <input
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          type="password"
          placeholder="Password"
          className="w-full rounded-2xl border border-border px-4 py-3 outline-none focus:border-indigo"
        />
        {error && <p className="text-sm font-medium text-error">{error}</p>}
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full bg-indigo text-white disabled:opacity-60"
        >
          {isLoading ? 'Submitting...' : mode === 'login' ? 'Login' : 'Register'}
        </button>
      </form>

      <div className="mt-4">
        <GoogleSignInButton label={mode === 'login' ? 'Sign in with Google' : 'Continue with Google'} />
      </div>

      <div className="mt-6 border-t border-border pt-6">
        <button
          onClick={onJoinLobby}
          className="w-full rounded-2xl border border-border px-4 py-3 font-bold text-text-primary hover:bg-background"
        >
          Join a room as player
        </button>
      </div>
    </div>
  );
};
