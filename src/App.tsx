import { useEffect, useMemo, useRef, useState } from 'react';
import { OAuthCallback } from './components/auth/OAuthCallback';
import { Dashboard } from './components/dashboard/Dashboard';
import type { HostGameSettings } from './components/dashboard/HostGameModal';
import { JoinView } from './components/lobby/JoinView';
import { ActiveLobby } from './components/lobby/ActiveLobby';
import { QuizEditorLayout } from './components/layout/QuizEditorLayout';
import { GameSessionScreen } from './components/game/GameSessionScreen';
import { DetailedResultScreen } from './components/game/DetailedResultScreen';
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
import { clearActiveQuiz, fetchQuiz, fetchQuizzes, removeQuiz, saveQuiz } from './store/quizzesSlice';
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
import { useI18n } from './i18n/I18nProvider';

type ScreenState = 'dashboard' | 'editor' | 'join' | 'room' | 'detailedResult';
type AppPath = '/' | '/dashboard' | '/editor' | '/join' | `/room/${string}` | `/room/${string}/detailedResult` | '/oauth2/callback';

const OAUTH_CALLBACK_PATH: AppPath = '/oauth2/callback';

function getRoomPinFromPath(pathname: string): string | null {
  const match = pathname.match(/^\/room\/([^/]+)(?:\/detailedResult)?$/);
  return match ? decodeURIComponent(match[1]) : null;
}

function getScreenFromPath(pathname: string): ScreenState {
  if (/^\/room\/[^/]+\/detailedResult$/.test(pathname)) {
    return 'detailedResult';
  }
  if (getRoomPinFromPath(pathname)) {
    return 'room';
  }
  switch (pathname) {
    case '/editor':
      return 'editor';
    case '/join':
      return 'join';
    default:
      return 'dashboard';
  }
}

function getPathFromScreen(screen: ScreenState): Exclude<AppPath, '/' | '/oauth2/callback' | `/room/${string}`> {
  switch (screen) {
    case 'editor':
      return '/editor';
    case 'join':
      return '/join';
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
  const { messages } = useI18n();

  const [pathname, setPathname] = useState<string>(() => window.location.pathname);
  const [currentScreen, setCurrentScreen] = useState<ScreenState>(() => getScreenFromPath(window.location.pathname));
  const [joiningError, setJoiningError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [editingQuizId, setEditingQuizId] = useState<string | null>(null);
  const [hostingQuizId, setHostingQuizId] = useState<string | null>(null);
  const routeRoomPin = useMemo(() => getRoomPinFromPath(pathname), [pathname]);
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

  const navigateToRoom = (pin: string, replace = false) => {
    setCurrentScreen('room');
    navigateToPath(`/room/${encodeURIComponent(pin)}` as AppPath, replace);
  };

  const navigateToDetailedResult = (pin: string, replace = false) => {
    setCurrentScreen('detailedResult');
    navigateToPath(`/room/${encodeURIComponent(pin)}/detailedResult` as AppPath, replace);
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
      onKicked: () => {
        dispatch(clearRoom());
        dispatch(setHistogram(null));
        dispatch(markKicked());
        setJoiningError(messages.app.kickedFromRoom);
        navigateToScreen('join', true);
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
    if (!auth.session || (currentScreen !== 'room' && currentScreen !== 'detailedResult') || !routeRoomPin) {
      return;
    }
    if (room.session?.pin === routeRoomPin) {
      return;
    }

    let cancelled = false;
    void apiClient.getRoom(routeRoomPin)
      .then((session) => {
        if (!cancelled) {
          dispatch(setRoomSession(session));
          setJoiningError(null);
        }
      })
      .catch((error: ApiError) => {
        if (cancelled) {
          return;
        }
        dispatch(clearRoom());
        dispatch(setRoomError(error.message));
        navigateToScreen(auth.session?.role === 'ROLE_USER' ? 'dashboard' : 'join', true);
      });

    return () => {
      cancelled = true;
    };
  }, [auth.session, currentScreen, routeRoomPin, room.session?.pin, dispatch]);

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
    if (room.session.hostUserId === auth.session.identity.id) {
      return;
    }
    const identityId = auth.session.identity.id;
    const stillPresent = room.session.participants.some(
      (participant) => participant.participantId === identityId
    );
    if (!stillPresent && (currentScreen === 'room' || currentScreen === 'detailedResult')) {
      socketRef.current?.disconnect();
      dispatch(clearRoom());
      dispatch(setHistogram(null));
      dispatch(markKicked());
      setJoiningError(messages.app.kickedFromRoom);
      navigateToScreen('join', true);
    }
  }, [room.session, auth.session, currentScreen, dispatch]);

  useEffect(() => {
    if (!room.session || !auth.session || currentScreen !== 'room') {
      return;
    }
    if (room.session.hostUserId === auth.session.identity.id) {
      return;
    }
    const roomEndedByHost = room.session.status === 'FINISHED' && !room.session.finalReport;
    if (!roomEndedByHost) {
      return;
    }

    socketRef.current?.disconnect();
    dispatch(clearRoom());
    dispatch(setHistogram(null));
    setHostingQuizId(null);
    setJoiningError(messages.app.hostEndedRoom);
    navigateToScreen('join', true);
  }, [room.session, auth.session, currentScreen, dispatch]);

  useEffect(() => {
    if (currentScreen !== 'detailedResult' || !room.session) {
      return;
    }
    if (!isHost) {
      navigateToRoom(room.session.pin, true);
    }
  }, [currentScreen, room.session, isHost]);

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

  const handleHostGame = async (quizId: string, settings: HostGameSettings) => {
    try {
      const roomSession = await apiClient.createRoom({
        globalTimer: 30,
        cbmEnabled: settings.cbmEnabled,
        playInTeams: settings.playInTeams,
        teamCount: settings.teamCount,
      });
      dispatch(setRoomSession(roomSession));
      setHostingQuizId(quizId);
      navigateToRoom(roomSession.pin);
    } catch (error) {
      dispatch(setRoomError((error as ApiError).message));
    }
  };

  const handleJoin = async (pin: string, nickname: string, avatarSeed: string) => {
    setJoiningError(null);
    setIsJoining(true);
    try {
      await dispatch(loginAsGuest({ nickname, avatarUrl: avatarSeed })).unwrap();
      const session = await apiClient.joinRoom(pin);
      dispatch(setRoomSession(session));
      setHostingQuizId(null);
      navigateToRoom(session.pin);
    } catch (error) {
      setJoiningError((error as Error).message);
    } finally {
      setIsJoining(false);
    }
  };

  const handleLeaveRoom = async () => {
    const finalizeLeaveRoom = () => {
      socketRef.current?.disconnect();
      dispatch(clearRoom());
      dispatch(setHistogram(null));
      setHostingQuizId(null);
      navigateToScreen(auth.session?.role === 'ROLE_USER' ? 'dashboard' : 'join');
    };

    if (isHost && room.session && room.session.status !== 'FINISHED') {
      try {
        socketRef.current?.send(`/app/rooms/${room.session.pin}/moderation`, { command: 'END_GAME' });
      } catch (error) {
        dispatch(setRoomError((error as Error).message));
        finalizeLeaveRoom();
        return;
      }
      window.setTimeout(finalizeLeaveRoom, 75);
      return;
    }

    if (room.session) {
      try {
        await apiClient.leaveRoom(room.session.pin);
      } catch (error) {
        dispatch(setRoomError((error as Error).message));
      }
    }

    finalizeLeaveRoom();
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
        <div className="screen-shell flex items-center justify-center">
          <div className="card px-6 py-5 text-lg font-semibold text-text-secondary">{messages.app.loadingProfile}</div>
        </div>
      );
    }
    return (
      <Dashboard
        onCreateQuiz={handleCreateQuiz}
        onJoinLobby={() => navigateToScreen('join')}
        onHostGame={handleHostGame}
        onEditQuiz={handleEditQuiz}
        onDeleteQuiz={(quizId, quizTitle) => {
          if (!window.confirm(messages.app.confirmDeleteQuiz(quizTitle))) {
            return;
          }
          void dispatch(removeQuiz(quizId));
        }}
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
          className="btn-secondary btn-glass absolute bottom-4 left-4 z-50 px-4 py-2 text-sm"
        >
          {messages.app.backDashboard}
        </button>
      </div>
    );
  }

  if (currentScreen === 'join') {
    return (
      <div className="relative h-screen">
        <JoinView onJoin={handleJoin} isJoining={isJoining} error={joiningError ?? (room.kicked ? messages.app.removedFromRoom : null)} />
        <button
          onClick={() => navigateToScreen('dashboard')}
          className="btn-secondary btn-glass absolute bottom-4 left-4 z-50 px-4 py-2 text-sm"
        >
          {messages.app.backDashboard}
        </button>
      </div>
    );
  }

  if (currentScreen === 'room' && room.session && currentParticipant) {
    if (room.session.status === 'LOBBY') {
      return (
        <ActiveLobby
          session={room.session}
          currentParticipantId={currentParticipant?.participantId}
          hostDisplayName={auth.session?.identity.displayName ?? messages.app.hostFallback}
          isHost={isHost}
          onAutoDistribute={() => {
            void apiClient.autoDistribute(room.session!.pin, { teamCount: room.session!.configuredTeamCount ?? 2 })
              .then((session) => dispatch(setRoomSession(session)))
              .catch((error: ApiError) => dispatch(setRoomError(error.message)));
          }}
          onUpdateTeams={(assignments) => {
            void apiClient.updateTeams(room.session!.pin, { assignments })
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
              dispatch(setRoomError(messages.app.noQuizSelected));
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
        teamSelectionEvent={room.teamSelectionEvent}
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
        onOpenDetailedResult={isHost ? () => navigateToDetailedResult(room.session!.pin) : undefined}
      />
    );
  }

  if (currentScreen === 'room' && room.session && isHost) {
    if (room.session.status === 'LOBBY') {
      return (
        <ActiveLobby
          session={room.session}
          currentParticipantId={null}
          hostDisplayName={auth.session?.identity.displayName ?? messages.app.hostFallback}
          isHost
          onAutoDistribute={() => {
            void apiClient.autoDistribute(room.session!.pin, { teamCount: room.session!.configuredTeamCount ?? 2 })
              .then((session) => dispatch(setRoomSession(session)))
              .catch((error: ApiError) => dispatch(setRoomError(error.message)));
          }}
          onUpdateTeams={(assignments) => {
            void apiClient.updateTeams(room.session!.pin, { assignments })
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
              dispatch(setRoomError(messages.app.noQuizSelected));
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
        participant={null}
        connectionStatus={room.connectionStatus}
        hiddenAnswerIds={room.hiddenAnswerIds}
        histogram={room.histogram}
        teamSelectionEvent={room.teamSelectionEvent}
        isHost
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
        onOpenDetailedResult={() => navigateToDetailedResult(room.session!.pin)}
      />
    );
  }

  if (currentScreen === 'detailedResult' && room.session?.finalReport && isHost) {
    return (
      <DetailedResultScreen
        quizTitle={room.session.finalReport.quizTitle}
        roomPin={room.session.pin}
        finalReport={room.session.finalReport}
        onBackToRoom={() => navigateToRoom(room.session!.pin)}
        onLeaveRoom={handleLeaveRoom}
      />
    );
  }

  if (currentScreen === 'room' && room.session) {
    return (
      <div className="screen-shell flex items-center justify-center">
        <div className="card px-6 py-5 text-lg font-semibold text-text-secondary">{messages.app.waitingForParticipantSync}</div>
      </div>
    );
  }

  return null;
}

export default App;
