export type DigitLength = 3 | 4;

export interface ActiveGame {
  chatId: string;
  digits: DigitLength;
  secret: string;
  startedAt: string;
  guessCount: number;
  history: Array<{
    userId: string;
    guess: string;
    strike: number;
    ball: number;
    at: string;
  }>;
}

export interface UserStats {
  userId: string;
  displayName?: string;
  wins: number;
  guesses: number;
}

export interface DatabaseSchema {
  games: Record<string, ActiveGame>;
  stats: Record<string, UserStats>;
}

export interface ChatEvent {
  chatId: string;
  userId: string;
  userName?: string;
  message: string;
}
