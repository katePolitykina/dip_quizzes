import React, { useEffect, useEffectEvent, useState } from 'react';
import { useAppDispatch } from '../../store/hooks';
import { fetchMe, completeOAuthLogin, logout, setAuthError } from '../../store/authSlice';
import { fetchQuizzes } from '../../store/quizzesSlice';
import { getOAuthErrorMessage, parseOAuthSessionFromUrl } from '../../lib/oauth';
import { useI18n } from '../../i18n/I18nProvider';

interface OAuthCallbackProps {
  onResolved: (path: '/dashboard', replace?: boolean) => void;
}

export const OAuthCallback: React.FC<OAuthCallbackProps> = ({ onResolved }) => {
  const dispatch = useAppDispatch();
  const { messages } = useI18n();
  const [message, setMessage] = useState(messages.auth.completingGoogleSignIn);
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
        setMessage(messages.auth.authenticationFailed);
        dispatch(setAuthError(messages.auth.authenticationFailed));
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
        dispatch(setAuthError(messages.auth.authenticationFailed));
        setMessage(messages.auth.authenticationFailed);
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
  }, [dispatch, messages.auth.authenticationFailed]);

  return (
    <div className="screen-shell flex min-h-screen items-center justify-center px-4">
      <div className="card w-full max-w-md px-8 py-10 text-center shadow-xl">
        <div className="mx-auto h-14 w-14 animate-spin rounded-full border-4 border-[rgba(255,255,255,0.9)] border-t-[var(--color-indigo)]" />
        <h1 className="mt-6 text-3xl font-black tracking-tight text-text-primary">{messages.auth.googleAuthentication}</h1>
        <p className="mt-3 text-base leading-7 text-text-secondary">{message}</p>
      </div>
    </div>
  );
};
