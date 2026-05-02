import { createAsyncThunk, createSlice, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient, ApiError } from '../lib/apiClient';
import { isSessionExpired, readAuthSession, writeAuthSession, type StoredAuthSession } from '../lib/authStorage';
import type { RegisterRequest, UpdateUserRequest, UserMeResponse } from '../types/api';

interface AuthState {
  session: StoredAuthSession | null;
  profile: UserMeResponse | null;
  status: 'idle' | 'loading' | 'authenticated' | 'guest';
  error: string | null;
}

const restoredSession = readAuthSession();

const initialState: AuthState = {
  session: restoredSession && !isSessionExpired(restoredSession) ? restoredSession : null,
  profile: null,
  status:
    restoredSession && !isSessionExpired(restoredSession)
      ? restoredSession.role === 'ROLE_USER'
        ? 'authenticated'
        : 'guest'
      : 'idle',
  error: null,
};

export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      return await apiClient.login(credentials);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const register = createAsyncThunk(
  'auth/register',
  async (request: RegisterRequest, { rejectWithValue }) => {
    try {
      return await apiClient.register(request);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const loginAsGuest = createAsyncThunk(
  'auth/guest',
  async (request: { nickname: string; avatarUrl?: string | null }, { rejectWithValue }) => {
    try {
      return await apiClient.guest(request);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const fetchMe = createAsyncThunk(
  'auth/fetchMe',
  async (_, { rejectWithValue }) => {
    try {
      return await apiClient.getMe();
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

export const updateProfile = createAsyncThunk(
  'auth/updateProfile',
  async (request: UpdateUserRequest, { rejectWithValue }) => {
    try {
      return await apiClient.updateMe(request);
    } catch (error) {
      return rejectWithValue((error as ApiError).message);
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    logout(state) {
      state.session = null;
      state.profile = null;
      state.status = 'idle';
      state.error = null;
      writeAuthSession(null);
    },
    clearAuthError(state) {
      state.error = null;
    },
    setAuthError(state, action: PayloadAction<string>) {
      state.error = action.payload;
    },
    hydrateAuth(state) {
      const session = readAuthSession();
      if (session && !isSessionExpired(session)) {
        state.session = session;
        state.status = session.role === 'ROLE_USER' ? 'authenticated' : 'guest';
      } else {
        state.session = null;
        state.status = 'idle';
      }
    },
    completeOAuthLogin(state, action: PayloadAction<StoredAuthSession>) {
      state.session = action.payload;
      state.profile = null;
      state.status = 'authenticated';
      state.error = null;
      writeAuthSession(action.payload);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(login.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        const session: StoredAuthSession = action.payload;
        state.session = session;
        state.profile = null;
        state.status = session.role === 'ROLE_USER' ? 'authenticated' : 'guest';
        writeAuthSession(session);
      })
      .addCase(login.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload as string;
      })
      .addCase(register.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(register.fulfilled, (state, action) => {
        const session: StoredAuthSession = action.payload;
        state.session = session;
        state.profile = null;
        state.status = 'authenticated';
        writeAuthSession(session);
      })
      .addCase(register.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload as string;
      })
      .addCase(loginAsGuest.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginAsGuest.fulfilled, (state, action) => {
        const session: StoredAuthSession = action.payload;
        state.session = session;
        state.profile = null;
        state.status = 'guest';
        writeAuthSession(session);
      })
      .addCase(loginAsGuest.rejected, (state, action) => {
        state.status = 'idle';
        state.error = action.payload as string;
      })
      .addCase(fetchMe.fulfilled, (state, action) => {
        state.profile = action.payload;
        if (state.session?.role === 'ROLE_USER') {
          state.session = {
            ...state.session,
            identity: {
              ...state.session.identity,
              id: action.payload.id,
              email: action.payload.email,
              displayName: action.payload.displayName,
              avatarUrl: action.payload.avatarUrl,
              provider: action.payload.provider,
            },
          };
          writeAuthSession(state.session);
        }
      })
      .addCase(updateProfile.fulfilled, (state, action) => {
        state.profile = action.payload;
        if (state.session?.role === 'ROLE_USER') {
          state.session = {
            ...state.session,
            identity: {
              ...state.session.identity,
              email: action.payload.email,
              displayName: action.payload.displayName,
              avatarUrl: action.payload.avatarUrl,
              provider: action.payload.provider,
            },
          };
          writeAuthSession(state.session);
        }
      });
  },
});

export const { logout, clearAuthError, setAuthError, hydrateAuth, completeOAuthLogin } = authSlice.actions;
export default authSlice.reducer;
