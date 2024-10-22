import { WebSocket } from 'ws';
import { CountryCodeName } from './functions';
import { v4 as uuidv4 } from 'uuid';

export interface Player {
  id: string;
  name: string;
  ws: WebSocket | null;
}

export interface Competition {
  id: string;
  host: Player;
  players: Player[];
  currentRound: number;
  totalRounds: number;
  currentFlag: CountryCodeName;
  options: CountryCodeName[];
  guesses: Map<string, string>; // Maps player IDs to their guesses
  scores: Map<string, number>;  // Maps player IDs to their scores
  status: 'waiting' | 'in-progress' | 'finished';
}

export function generateUniqueCompetitionId(): string {
  return uuidv4();
}

export function generateUniquePlayerId(): string {
  return uuidv4();
}
