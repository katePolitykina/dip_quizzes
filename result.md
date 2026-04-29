# Google Social Login Frontend Integration

## OAuth Flow Description

Sequence:
Frontend Google link -> Spring Security endpoint `http://localhost:8080/oauth2/authorization/google` -> Google consent -> Spring Security OAuth callback -> backend redirect to frontend `/oauth2/callback` with JWT/auth query params -> frontend callback handler stores the session, validates it with `/api/users/me`, updates Redux auth state, and redirects to `/dashboard`.

## Security Note

The JWT is handled on a dedicated `/oauth2/callback` route so the app can isolate token parsing, persistence, validation, and failure handling in one short-lived screen. This keeps the main login page free of token-bearing URLs, reduces accidental reuse of stale query params during normal login/register flows, and makes the redirect logic deterministic after backend OAuth success.

## Component Mapping

New files:
- `src/components/auth/GoogleSignInButton.tsx`
- `src/components/auth/OAuthCallback.tsx`
- `src/lib/oauth.ts`

Modified files:
- `src/App.tsx`
- `src/components/auth/AuthPanel.tsx`
- `src/components/lobby/JoinView.tsx`
- `src/store/authSlice.ts`

## Notes On Backend/Frontend Consistency

- The Google button is a direct browser navigation to the Spring endpoint, not an XHR call.
- The frontend callback accepts either:
  - a full serialized auth payload (`auth` or `session`), or
  - a token-centric redirect (`token` / `accessToken` / `jwt`) plus optional identity fields.
- If only the JWT is provided, the frontend derives `expiresAt` and fallback identity data from the token, then immediately validates and normalizes the session through `/api/users/me`.
- Successful callback completion redirects to `/dashboard`; failed callback processing writes an auth error and returns the user to the dashboard login view.
