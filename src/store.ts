import { existsSync, mkdirSync } from 'node:fs';
import { dirname } from 'node:path';
import { JSONFilePreset } from 'lowdb/node';
import { DatabaseSchema, UserStats } from './types';

const defaultData: DatabaseSchema = {
  games: {},
  stats: {},
};

export class Store {
  constructor(private filePath = 'data/db.json') {}

  async db() {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return JSONFilePreset<DatabaseSchema>(this.filePath, defaultData);
  }

  async getStats(userId: string): Promise<UserStats> {
    const db = await this.db();
    if (!db.data.stats[userId]) {
      db.data.stats[userId] = { userId, wins: 0, losses: 0, gamesPlayed: 0, guesses: 0 };
      await db.write();
    }
    return db.data.stats[userId];
  }
}
