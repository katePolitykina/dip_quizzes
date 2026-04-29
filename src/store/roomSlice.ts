import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type {
  AnswerHistogramPayload,
  GameSessionResponse,
  LeaderboardEntryResponse,
  SortAnswersResponse,
  TeamAnswerEventPayload,
} from '../types/api';

interface RoomState {
  pin: string | null;
  session: GameSessionResponse | null;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'reconnecting';
  histogram: AnswerHistogramPayload | null;
  hiddenAnswerIds: string[];
  teamSelectionEvent: TeamAnswerEventPayload | null;
  kicked: boolean;
  error: string | null;
  lastEventType: string | null;
}

const initialState: RoomState = {
  pin: null,
  session: null,
  connectionStatus: 'disconnected',
  histogram: null,
  hiddenAnswerIds: [],
  teamSelectionEvent: null,
  kicked: false,
  error: null,
  lastEventType: null,
};

const roomSlice = createSlice({
  name: 'room',
  initialState,
  reducers: {
    setRoomSession(state, action: PayloadAction<GameSessionResponse | null>) {
      state.session = action.payload;
      state.pin = action.payload?.pin ?? null;
      if (action.payload?.status !== 'START_QUESTION') {
        state.hiddenAnswerIds = [];
      }
      state.kicked = false;
    },
    setConnectionStatus(state, action: PayloadAction<RoomState['connectionStatus']>) {
      state.connectionStatus = action.payload;
    },
    setRoomError(state, action: PayloadAction<string | null>) {
      state.error = action.payload;
    },
    setHistogram(state, action: PayloadAction<AnswerHistogramPayload | null>) {
      state.histogram = action.payload;
    },
    setHiddenAnswers(state, action: PayloadAction<SortAnswersResponse>) {
      state.hiddenAnswerIds = action.payload.hiddenAnswerIds;
      state.lastEventType = 'ANALYST_SORT_ANSWERS';
    },
    setTeamSelectionEvent(state, action: PayloadAction<TeamAnswerEventPayload | null>) {
      state.teamSelectionEvent = action.payload;
    },
    setLeaderboard(state, action: PayloadAction<LeaderboardEntryResponse[]>) {
      if (state.session) {
        state.session = { ...state.session, leaderboard: action.payload };
      }
      state.lastEventType = 'LEADERBOARD_UPDATED';
    },
    markKicked(state) {
      state.kicked = true;
      state.connectionStatus = 'disconnected';
    },
    clearRoom() {
      return { ...initialState };
    },
    setLastEventType(state, action: PayloadAction<string | null>) {
      state.lastEventType = action.payload;
    },
  },
});

export const {
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
} = roomSlice.actions;
export default roomSlice.reducer;
