import React, { useEffect, useEffectEvent, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { fetchMe, completeOAuthLogin, logout, setAuthError } from '../../store/authSlice';
import { fetchQuizzes } from '../../store/quizzesSlice';
import { getOAuthErrorMessage, parseOAuthSessionFromUrl } from '../../lib/oauth';

interface OAuthCallbackProps {
  onResolved: (path: '/dashboard', replace?: boolean) => void;
}

export const OAuthCallback: React.FC<OAuthCallbackProps> = ({ onResolved }) => {
  const dispatch = useAppDispatch();
  const [message, setMessage] = useState('Completing Google sign-in...');
  const resolveNavigation = useEffectEvent(onResolved);

  useEffect(() => {
    let redirectTimer: number | null = null;

    const finalizeLogin = async () => {
      const params = new URLSearchParams(window.location.search);

      if (params.has('error')) {
        const errorMessage = getOAuthErrorMessage(params);
        setMessage(errorMessage);
        dispatch(setAuthError(errorMessage));
        redirectTimer = window.setTimeout(() => {
          resolveNavigation('/dashboard', true);
        }, 1200);
        return;
      }

      const session = parseOAuthSessionFromUrl(window.location.search);
      if (!session) {
        setMessage('Authentication failed');
        dispatch(setAuthError('Authentication failed'));
        redirectTimer = window.setTimeout(() => {
          resolveNavigation('/dashboard', true);
        }, 1200);
        return;
      }

      try {
        dispatch(completeOAuthLogin(session));
        await dispatch(fetchMe()).unwrap();
        await dispatch(fetchQuizzes()).unwrap();
        resolveNavigation('/dashboard', true);
      } catch {
        dispatch(logout());
        dispatch(setAuthError('Authentication failed'));
        setMessage('Authentication failed');
        redirectTimer = window.setTimeout(() => {
          resolveNavigation('/dashboard', true);
        }, 1200);
      }
    };

    void finalizeLogin();

    return () => {
      if (redirectTimer) {
        window.clearTimeout(redirectTimer);
      }
    };
  }, [dispatch]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(79,70,229,0.18),_transparent_38%),linear-gradient(135deg,#f8fafc_0%,#eef2ff_48%,#ffffff_100%)] px-4">
      <div className="card w-full max-w-md px-8 py-10 text-center shadow-xl">
        <div className="mx-auto h-14 w-14 rounded-full border-4 border-[var(--color-border)] border-t-[var(--color-indigo)] animate-spin" />
        <h1 className="mt-6 text-3xl font-black tracking-tight text-text-primary">Google Authentication</h1>
        <p className="mt-3 text-base leading-7 text-text-secondary">{message}</p>
      </div>
    </div>
  );
};
