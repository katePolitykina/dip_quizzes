import { useEffect, useMemo, useRef, useState } from 'react';
import { OAuthCallback } from './components/auth/OAuthCallback';
import { Dashboard } from './components/dashboard/Dashboard';
import { JoinView } from './components/lobby/JoinView';
import { ActiveLobby } from './components/lobby/ActiveLobby';
import { QuizEditorLayout } from './components/layout/QuizEditorLayout';
import { GameSessionScreen } from './components/game/GameSessionScreen';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
  clearAuthError,
  fetchMe,
  login,
  loginAsGuest,
  logout,
  register,
  updateProfile,
} from './store/authSlice';
import { clearActiveQuiz, fetchQuiz, fetchQuizzes, saveQuiz } from './store/quizzesSlice';
import {
  clearRoom,
  markKicked,
  setConnectionStatus,
  setHiddenAnswers,
  setHistogram,
  setLastEventType,
  setLeaderboard,
  setRoomError,
  setRoomSession,
  setTeamSelectionEvent,
} from './store/roomSlice';
import { apiClient, ApiError, setUnauthorizedHandler } from './lib/apiClient';
import { mapEditorStateToQuizUpsertRequest, mapQuizDetailToEditorState } from './lib/quizMapper';
import { RoomSocketClient } from './services/roomSocket';
import type {
  AnswerHistogramPayload,
  GameSessionResponse,
  SocketEnvelope,
  TeamAnswerEventPayload,
} from './types/api';

type ScreenState = 'dashboard' | 'editor' | 'join' | 'room';
type AppPath = '/' | '/dashboard' | '/editor' | '/join' | '/room' | '/oauth2/callback';

const OAUTH_CALLBACK_PATH: AppPath = '/oauth2/callback';

function getScreenFromPath(pathname: string): ScreenState {
  switch (pathname) {
    case '/editor':
      return 'editor';
    case '/join':
      return 'join';
    case '/room':
      return 'room';
    default:
      return 'dashboard';
  }
}

function getPathFromScreen(screen: ScreenState): Exclude<AppPath, '/' | '/oauth2/callback'> {
  switch (screen) {
    case 'editor':
      return '/editor';
    case 'join':
      return '/join';
    case 'room':
      return '/room';
    case 'dashboard':
    default:
      return '/dashboard';
  }
}

function App() {
  const dispatch = useAppDispatch();
  const auth = useAppSelector((state) => state.auth);
  const quizzes = useAppSelector((state) => state.quizzes);
  const room = useAppSelector((state) => state.room);

  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => getScreenFromPath(window.location.pathname));
  const [joiningError, setJoiningError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [hostingQuizId, setHostingQuizId] = useState<string | null>(null);
  const socketRef = useRef<RoomSocketClient | null>(null);
  const subscribedTeamRef = useRef<string | null>(null);

  const currentParticipant = useMemo(() => {
    if (!auth.session || !room.session) {
      return null;
    }
    return room.session.participants.find(
      (participant) => participant.participantId === auth.session?.identity.id
    ) ?? null;
  }, [auth.session, room.session]);

  const isHost = Boolean(auth.session && room.session && room.session.hostUserId === auth.session.identity.id);

  const navigateToPath = (path: AppPath, replace = false) => {
    if (replace || window.location.pathname !== path) {
      window.history[replace ? 'replaceState' : 'pushState']({}, '', path);
    }

    setPathname(path);
    if (path !== OAUTH_CALLBACK_PATH) {
      setCurrentScreen(getScreenFromPath(path));
    }
  };

  const navigateToScreen = (screen: ScreenState, replace = false) => {
    const path = getPathFromScreen(screen);
    setCurrentScreen(screen);
    navigateToPath(path, replace);
  };

  useEffect(() => {
    const handlePopState = () => {
      const nextPath = window.location.pathname;
      setPathname(nextPath);
      if (nextPath !== OAUTH_CALLBACK_PATH) {
        setCurrentScreen(getScreenFromPath(nextPath));
      }
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      dispatch(logout());
      dispatch(clearRoom());
      navigateToScreen('dashboard', true);
    });
    return () => setUnauthorizedHandler(null);
  }, [dispatch]);

  useEffect(() => {
    if (auth.session?.role === 'ROLE_USER') {
      void dispatch(fetchMe());
      void dispatch(fetchQuizzes());
    }
  }, [auth.session?.role, dispatch]);

  useEffect(() => {
    if (!auth.session || !room.pin) {
      socketRef.current?.disconnect();
      socketRef.current = null;
      subscribedTeamRef.current = null;
      return;
    }

    socketRef.current?.disconnect();
    const client = new RoomSocketClient({
      pin: room.pin,
      onConnectionChange: (status) => dispatch(setConnectionStatus(status)),
      onError: (message) => dispatch(setRoomError(message)),
      onUnauthorized: () => {
        dispatch(logout());
        dispatch(clearRoom());
        navigateToScreen('dashboard', true);
      },
      onEnvelope: (envelope) => handleSocketEnvelope(envelope),
    });
    socketRef.current = client;
    client.connect();

    return () => {
      client.disconnect();
      socketRef.current = null;
      subscribedTeamRef.current = null;
    };
  }, [auth.session, room.pin, dispatch]);

  useEffect(() => {
    if (!socketRef.current || !room.session || !auth.session) {
      return;
    }
    const identityId = auth.session.identity.id;
    socketRef.current.subscribe(`/topic/rooms/${room.session.pin}/leaderboard`);
    const participant = room.session.participants.find(
      (entry) => entry.participantId === identityId
    );
    if (participant?.teamId && subscribedTeamRef.current !== participant.teamId) {
      socketRef.current.subscribe(`/topic/rooms/${room.session.pin}/teams/${participant.teamId}`);
      subscribedTeamRef.current = participant.teamId;
    }
  }, [room.session, auth.session]);

  useEffect(() => {
    if (!room.session || !auth.session) {
      return;
    }
    const identityId = auth.session.identity.id;
    const stillPresent = room.session.participants.some(
      (participant) => participant.participantId === identityId
    );
    if (!stillPresent && currentScreen === 'room') {
      dispatch(markKicked());
      navigateToScreen('join', true);
    }
  }, [room.session, auth.session, currentScreen, dispatch]);

  const handleSocketEnvelope = (envelope: SocketEnvelope) => {
    switch (envelope.type) {
      case 'ROOM_STATE':
      case 'QUESTION_STARTED':
      case 'QUESTION_RESULTS':
      case 'GAME_PAUSED':
      case 'GAME_RESUMED':
      case 'PLAYER_KICKED':
        dispatch(setRoomSession(envelope.data as GameSessionResponse));
        dispatch(setLastEventType(envelope.type));
        return;
      case 'ANSWER_HISTOGRAM':
        dispatch(setHistogram(envelope.data as AnswerHistogramPayload));
        return;
      case 'TEAM_SELECTION_UPDATED':
      case 'TEAM_ANSWER_CONFIRMED':
        dispatch(setTeamSelectionEvent(envelope.data as TeamAnswerEventPayload));
        return;
      case 'ANALYST_SORT_ANSWERS':
        dispatch(setHiddenAnswers(envelope.data as { teamId: string; hiddenAnswerIds: string[] }));
        return;
      case 'LEADERBOARD_UPDATED':
        dispatch(setLeaderboard(envelope.data as GameSessionResponse['leaderboard']));
        return;
      case 'FINAL_REPORT':
        dispatch(setLastEventType('FINAL_REPORT'));
        return;
      default:
        dispatch(setLastEventType(envelope.type));
    }
  };

  const handleLogin = (email: string, password: string) => {
    void dispatch(login({ email, password }));
  };

  const handleRegister = (payload: { email: string; password: string; displayName: string }) => {
    void dispatch(register(payload));
  };

  const handleCreateQuiz = () => {
    dispatch(clearActiveQuiz());
    setEditingQuizId(null);
    navigateToScreen('editor');
  };

  const handleEditQuiz = async (quizId: string) => {
    setEditingQuizId(quizId);
    await dispatch(fetchQuiz(quizId));
    navigateToScreen('editor');
  };

  const handleHostGame = async (quizId: string) => {
    try {
      const roomSession = await apiClient.createRoom({
        globalTimer: 30,
        cbmEnabled: false,
      });
      dispatch(setRoomSession(roomSession));
      setHostingQuizId(quizId);
      navigateToScreen('room');
    } catch (error) {
      dispatch(setRoomError((error as ApiError).message));
    }
  };

  const handleJoin = async (pin: string, nickname: string) => {
    setJoiningError(null);
    setIsJoining(true);
    try {
      await dispatch(loginAsGuest(nickname)).unwrap();
      const session = await apiClient.joinRoom(pin);
      dispatch(setRoomSession(session));
      setHostingQuizId(null);
      navigateToScreen('room');
    } catch (error) {
      setJoiningError((error as Error).message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = () => {
    socketRef.current?.disconnect();
    dispatch(clearRoom());
    dispatch(setHistogram(null));
    setHostingQuizId(null);
    navigateToScreen(auth.session?.role === 'ROLE_USER' ? 'dashboard' : 'join');
  };

  const sendRoomMessage = (destination: string, body?: unknown) => {
    try {
      socketRef.current?.send(destination, body);
    } catch (error) {
      dispatch(setRoomError((error as Error).message));
    }
  };

  const editorInitialQuiz = quizzes.activeQuiz
    ? mapQuizDetailToEditorState(quizzes.activeQuiz)
    : undefined;

  if (pathname === OAUTH_CALLBACK_PATH) {
    return <OAuthCallback onResolved={navigateToPath} />;
  }

  if (currentScreen === 'dashboard') {
    if (auth.session?.role === 'ROLE_USER' && !auth.profile) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center">
          <div className="card px-6 py-5 text-lg font-semibold text-text-secondary">Loading profile...</div>
        </div>
      );
    }
    return (
      <Dashboard
        onCreateQuiz={handleCreateQuiz}
        onJoinLobby={() => navigateToScreen('join')}
        onHostGame={handleHostGame}
        onEditQuiz={handleEditQuiz}
        user={auth.profile}
        quizzes={quizzes.items}
        isGuest={auth.session?.role === 'ROLE_GUEST'}
        isLoading={auth.status === 'loading'}
        authError={auth.error}
        onLogin={handleLogin}
        onRegister={handleRegister}
        onSaveProfile={(displayName, avatarSeed) => {
          void dispatch(updateProfile({ displayName, avatarUrl: avatarSeed }));
        }}
        onLogout={() => {
          dispatch(logout());
          dispatch(clearRoom());
          dispatch(clearAuthError());
        }}
      />
    );
  }

  if (currentScreen === 'editor') {
    return (
      <div className="relative h-screen">
        <QuizEditorLayout
          initialQuiz={editorInitialQuiz}
          isSaving={quizzes.saveStatus === 'loading'}
          saveError={quizzes.error}
          onSave={(quiz, quizDispatch) => {
            void dispatch(saveQuiz({ id: editingQuizId ?? undefined, quiz: mapEditorStateToQuizUpsertRequest(quiz) }))
              .unwrap()
              .then((saved) => {
                quizDispatch({ type: 'SET_LAST_SAVED', payload: saved.updatedAt });
                setEditingQuizId(saved.id);
              })
              .catch(() => undefined);
          }}

        />
        <button
          onClick={() => navigateToScreen('dashboard')}
          className="absolute bottom-4 left-4 bg-black/50 hover:bg-black text-white px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-colors z-50"
        >
          ← Dashboard
        </button>
      </div>
    );
  }

  if (currentScreen === 'join') {
    return (
      <div className="relative h-screen">
        <JoinView onJoin={handleJoin} isJoining={isJoining} error={joiningError ?? (room.kicked ? 'You were removed from the room.' : null)} />
        <button
          onClick={() => navigateToScreen('dashboard')}
          className="absolute bottom-4 left-4 bg-white/20 hover:bg-white text-white hover:text-black px-4 py-2 rounded-lg text-sm backdrop-blur-sm transition-colors z-50"
        >
          ← Dashboard
        </button>
      </div>
    );
  }

  if (currentScreen === 'room' && room.session && currentParticipant) {
    if (room.session.status === 'LOBBY') {
      return (
        <ActiveLobby
          session={room.session}
          currentParticipantId={currentParticipant.participantId}
          isHost={isHost}
          onAutoDistribute={(teamCount) => {
            void apiClient.autoDistribute(room.session!.pin, { teamCount })
              .then((session) => dispatch(setRoomSession(session)))
              .catch((error: ApiError) => dispatch(setRoomError(error.message)));
          }}
          onUpdateRoles={(teamId, captainParticipantId, analystParticipantId) => {
            const assignments = room.session!.teams.map((team) => ({
              teamId: team.teamId,
              captainParticipantId: team.teamId === teamId ? captainParticipantId : team.captainParticipantId || team.participantIds[0],
              analystParticipantId: team.teamId === teamId ? analystParticipantId : team.analystParticipantId || team.participantIds[1] || team.participantIds[0],
            }));
            void apiClient.updateRoles(room.session!.pin, { assignments })
              .then((session) => dispatch(setRoomSession(session)))
              .catch((error: ApiError) => dispatch(setRoomError(error.message)));
          }}
          onStartQuiz={() => {
            if (!hostingQuizId) {
              dispatch(setRoomError('No quiz was selected for this room.'));
              return;
            }
            const pin = room.session?.pin;
            if (!pin) {
              return;
            }
            sendRoomMessage(`/app/rooms/${pin}/game/start`, {
              quizId: hostingQuizId,
            });
          }}
          onBackToDashboard={handleLeaveRoom}
        />
      );
    }

    return (
      <GameSessionScreen
        session={room.session}
        participant={currentParticipant}
        connectionStatus={room.connectionStatus}
        hiddenAnswerIds={room.hiddenAnswerIds}
        histogram={room.histogram}
        isHost={isHost}
        onSelectAnswer={(teamId, answerId) => {
          sendRoomMessage(`/app/rooms/${room.session!.pin}/teams/${teamId}/selection`, { answerId });
        }}
        onConfirmAnswer={(teamId, answerId, confidenceLevel) => {
          sendRoomMessage(`/app/rooms/${room.session!.pin}/teams/${teamId}/confirm`, {
            answerId,
            confidenceLevel,
          });
        }}
        onUseFiftyFifty={(teamId) => {
          sendRoomMessage(`/app/rooms/${room.session!.pin}/teams/${teamId}/sort-answers`);
        }}
        onAdvance={() => {
          sendRoomMessage(`/app/rooms/${room.session!.pin}/game/advance`);
        }}
        onTogglePause={() => {
          sendRoomMessage(`/app/rooms/${room.session!.pin}/moderation`, { command: 'TOGGLE_PAUSE' });
        }}
        onKick={(participantId) => {
          sendRoomMessage(`/app/rooms/${room.session!.pin}/moderation`, {
            command: 'KICK_PLAYER',
            targetParticipantId: participantId,
          });
        }}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (currentScreen === 'room' && room.session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="card px-6 py-5 text-lg font-semibold text-text-secondary">Waiting for participant sync...</div>
      </div>
    );
  }

  return null;
}

export default App;
