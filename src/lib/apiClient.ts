import { isSessionExpired, readAuthSession } from './authStorage';
import { appConfig } from '../config/appConfig';
import type {
  AuthResponse,
  AutoDistributeTeamsRequest,
  CreateRoomRequest,
  GameSessionResponse,
  GuestAuthRequest,
  LoginRequest,
  QuizDetailResponse,
  QuizSummaryResponse,
  QuizUpsertRequest,
  RegisterRequest,
  UpdateTeamsRequest,
  UpdateTeamRolesRequest,
  UpdateUserRequest,
  UserMeResponse,
} from '../types/api';

let unauthorizedHandler: (() => void) | null = null;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export function setUnauthorizedHandler(handler: (() => void) | null) {
  unauthorizedHandler = handler;
}

async function request<T>(path: string, init: RequestInit = {}, authRequired = true): Promise<T> {
  const headers = new Headers(init.headers);
  headers.set('Accept', 'application/json');

  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json');
  }

  if (authRequired) {
    const session = readAuthSession();
    if (!session || isSessionExpired(session)) {
      unauthorizedHandler?.();
      throw new ApiError(401, 'Session expired');
    }
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${appConfig.apiBaseUrl}${path}`, {
    ...init,
    headers,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const contentType = response.headers.get('content-type') ?? '';
  const payload = contentType.includes('application/json')
    ? await response.json()
    : await response.text();

  if (!response.ok) {
    const validationMessage = typeof payload === 'string'
      ? undefined
      : payload?.validationErrors && typeof payload.validationErrors === 'object'
        ? Object.entries(payload.validationErrors as Record<string, string>)
          .map(([field, message]) => `${field}: ${message}`)
          .join(', ')
        : undefined;
    const message =
      typeof payload === 'string'
        ? payload
        : validationMessage || payload?.message || payload?.error || `Request failed with ${response.status}`;
    if (response.status === 401) {
      unauthorizedHandler?.();
    }
    throw new ApiError(response.status, message);
  }

  return payload as T;
}

export const apiClient = {
  login(body: LoginRequest) {
    return request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false);
  },
  register(body: RegisterRequest) {
    return request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false);
  },
  guest(body: GuestAuthRequest) {
    return request<AuthResponse>('/api/auth/guest', {
      method: 'POST',
      body: JSON.stringify(body),
    }, false);
  },
  getMe() {
    return request<UserMeResponse>('/api/users/me');
  },
  updateMe(body: UpdateUserRequest) {
    return request<UserMeResponse>('/api/users/me', {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  listQuizzes() {
    return request<QuizSummaryResponse[]>('/api/quizzes');
  },
  getQuiz(id: string) {
    return request<QuizDetailResponse>(`/api/quizzes/${id}`);
  },
  createQuiz(body: QuizUpsertRequest) {
    return request<QuizDetailResponse>('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateQuiz(id: string, body: QuizUpsertRequest) {
    return request<QuizDetailResponse>(`/api/quizzes/${id}`, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  },
  deleteQuiz(id: string) {
    return request<void>(`/api/quizzes/${id}`, { method: 'DELETE' });
  },
  createRoom(body: CreateRoomRequest) {
    return request<GameSessionResponse>('/api/rooms', {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  getRoom(pin: string) {
    return request<GameSessionResponse>(`/api/rooms/${pin}`);
  },
  joinRoom(pin: string) {
    return request<GameSessionResponse>(`/api/rooms/${pin}/join`, {
      method: 'POST',
    });
  },
  leaveRoom(pin: string) {
    return request<GameSessionResponse>(`/api/rooms/${pin}/leave`, {
      method: 'DELETE',
    });
  },
  autoDistribute(pin: string, body: AutoDistributeTeamsRequest) {
    return request<GameSessionResponse>(`/api/rooms/${pin}/teams/auto-distribute`, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  },
  updateRoles(pin: string, body: UpdateTeamRolesRequest) {
    return request<GameSessionResponse>(`/api/rooms/${pin}/teams/roles`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
  updateTeams(pin: string, body: UpdateTeamsRequest) {
    return request<GameSessionResponse>(`/api/rooms/${pin}/teams`, {
      method: 'PATCH',
      body: JSON.stringify(body),
    });
  },
};
