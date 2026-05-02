export type AuthRole = 'ROLE_USER' | 'ROLE_GUEST';
export type TeamRole = 'CAPTAIN' | 'ANALYST' | 'MEMBER';
export type GameStatus = 'LOBBY' | 'START_QUESTION' | 'SHOW_RESULTS' | 'PAUSED' | 'FINISHED';
export type ConfidenceLevel = 'HIGH' | 'MEDIUM' | 'LOW';

export interface AuthIdentity {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  provider: string;
}

export interface AuthResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  role: AuthRole;
  identity: AuthIdentity;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName: string;
  avatarUrl?: string | null;
}

export interface GuestAuthRequest {
  nickname: string;
  avatarUrl?: string | null;
}

export interface UserMeResponse {
  id: string;
  email: string | null;
  displayName: string;
  avatarUrl: string | null;
  provider: string;
}

export interface UpdateUserRequest {
  displayName?: string;
  avatarUrl?: string | null;
}

export interface QuizAnswerRequest {
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionRequest {
  text: string;
  imageUrl?: string | null;
  pointsWeight: number;
  timerOverride?: number | null;
  answers: QuizAnswerRequest[];
}

export interface QuizUpsertRequest {
  title: string;
  questions: QuizQuestionRequest[];
}

export interface QuizSummaryResponse {
  id: string;
  title: string;
  questionCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuizAnswerResponse {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface QuizQuestionResponse {
  id: string;
  text: string;
  imageUrl?: string | null;
  pointsWeight: number;
  timerOverride?: number | null;
  answers: QuizAnswerResponse[];
}

export interface QuizDetailResponse {
  id: string;
  title: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  questions: QuizQuestionResponse[];
}

export interface CreateRoomRequest {
  globalTimer: number;
  cbmEnabled: boolean;
  playInTeams: boolean;
  teamCount?: number | null;
}

export interface AutoDistributeTeamsRequest {
  teamCount: number;
}

export interface TeamRoleAssignmentRequest {
  teamId: string;
  captainParticipantId: string;
  analystParticipantId: string;
}

export interface TeamAssignmentRequest {
  teamId: string;
  participantIds: string[];
}

export interface UpdateTeamRolesRequest {
  assignments: TeamRoleAssignmentRequest[];
}

export interface UpdateTeamsRequest {
  assignments: TeamAssignmentRequest[];
}

export interface CbmSettingsResponse {
  highCorrectMultiplier: number;
  mediumCorrectMultiplier: number;
  lowCorrectMultiplier: number;
  highIncorrectPenaltyMultiplier: number;
  mediumIncorrectPenaltyMultiplier: number;
  lowIncorrectPenaltyMultiplier: number;
}

export interface CurrentQuestionAnswerResponse {
  id: string;
  text: string;
  correct?: boolean | null;
}

export interface CurrentQuestionResponse {
  id: string;
  text: string;
  imageUrl?: string | null;
  baseWeight: number;
  timerOverride?: number | null;
  answers: CurrentQuestionAnswerResponse[];
}

export interface LeaderboardEntryResponse {
  teamId: string;
  teamName: string;
  score: number;
  rank: number;
}

export interface TeamQuestionScoreResponse {
  questionId: string;
  selectedAnswerId?: string | null;
  confidenceLevel?: ConfidenceLevel | null;
  correct: boolean;
  speedFactor: number;
  appliedMultiplier: number;
  pointsAwarded: number;
}

export interface FinalTeamReportResponse {
  teamId: string;
  teamName: string;
  totalScore: number;
  questionScores: TeamQuestionScoreResponse[];
}

export interface FinalGameReportResponse {
  quizId: string;
  quizTitle: string;
  generatedAt: string;
  teams: FinalTeamReportResponse[];
}

export interface PlayerSlotResponse {
  participantId: string;
  userId?: string | null;
  displayName: string;
  avatarUrl?: string | null;
  provider: string;
  guest: boolean;
  teamId?: string | null;
  teamRole?: TeamRole | null;
  selectedAnswerId?: string | null;
}

export interface TeamStateResponse {
  teamId: string;
  name: string;
  participantIds: string[];
  captainParticipantId?: string | null;
  analystParticipantId?: string | null;
  confirmedConfidenceLevel?: ConfidenceLevel | null;
  selectedAnswerId?: string | null;
  confirmedAnswerId?: string | null;
  confirmedAnswerCorrect?: boolean | null;
  answerVoteCounts?: Record<string, number> | null;
  totalScore: number;
  analystPowerUsed: boolean;
}

export interface GameSessionResponse {
  pin: string;
  hostUserId: string;
  quizId?: string | null;
  quizTitle?: string | null;
  globalTimer: number;
  cbmEnabled: boolean;
  playInTeams: boolean;
  configuredTeamCount?: number | null;
  status: GameStatus;
  createdAt: string;
  updatedAt: string;
  currentQuestionIndex?: number | null;
  questionStartedAt?: string | null;
  questionDeadlineAt?: string | null;
  answersCount: number;
  cbmSettings?: CbmSettingsResponse | null;
  currentQuestion?: CurrentQuestionResponse | null;
  leaderboard: LeaderboardEntryResponse[];
  finalReport?: FinalGameReportResponse | null;
  participants: PlayerSlotResponse[];
  teams: TeamStateResponse[];
}

export interface StartGameRequest {
  quizId: string;
  cbmOverrides?: {
    highCorrectMultiplier?: number;
    mediumCorrectMultiplier?: number;
    lowCorrectMultiplier?: number;
    highIncorrectPenaltyMultiplier?: number;
    mediumIncorrectPenaltyMultiplier?: number;
    lowIncorrectPenaltyMultiplier?: number;
  };
}

export interface ModerationCommandRequest {
  command: 'TOGGLE_PAUSE' | 'KICK_PLAYER' | 'END_GAME';
  targetParticipantId?: string;
}

export interface TeamAnswerSelectionRequest {
  answerId: string;
  confidenceLevel?: ConfidenceLevel;
}

export interface TeamAnswerEventPayload {
  teamId: string;
  participantId: string;
  selectedAnswerId?: string | null;
  confirmedAnswerId?: string | null;
  finalized: boolean;
  confirmedCorrect?: boolean | null;
}

export interface AnswerHistogramPayload {
  pin: string;
  answersCount: number;
  totalTeams: number;
}

export interface SortAnswersResponse {
  teamId: string;
  hiddenAnswerIds: string[];
}

export interface SocketEnvelope<T = unknown> {
  type: string;
  data: T;
}
