import React from 'react';
import { getGoogleOAuthStartUrl } from '../../lib/oauth';

interface GoogleSignInButtonProps {
  className?: string;
  label?: string;
}

function GoogleLogo() {
  return (
    <svg aria-hidden="true" viewBox="0 0 18 18" className="h-[18px] w-[18px] shrink-0">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.56 2.68-3.87 2.68-6.62Z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A8.99 8.99 0 0 0 9 18Z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72A5.41 5.41 0 0 1 3.69 9c0-.6.1-1.19.28-1.72V4.95H.96A8.99 8.99 0 0 0 0 9c0 1.45.35 2.82.96 4.05l3.01-2.33Z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.43 1.33l2.57-2.57C13.46.9 11.42 0 9 0A8.99 8.99 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58Z"
      />
    </svg>
  );
}

export const GoogleSignInButton: React.FC<GoogleSignInButtonProps> = ({
  className = '',
  label = 'Sign in with Google',
}) => {
  return (
    <a
      href={getGoogleOAuthStartUrl()}
      className={`btn-secondary btn-glass flex h-14 w-full items-center justify-center gap-3 px-4 text-[15px] font-extrabold text-[var(--color-text-primary)] ${className}`}
    >
      <GoogleLogo />
      <span>{label}</span>
    </a>
  );
};
