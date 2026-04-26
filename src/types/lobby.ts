export type PlayerRole = 'captain' | 'analyst' | 'member';

export interface Player {
  id: string;
  nickname: string;
  avatarSeed: string; // Seed for dicebear
  teamId?: string; // undefined means in Waiting Room
  role?: PlayerRole;
}

export interface Team {
  id: string;
  name: string;
}
