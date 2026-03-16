import { existsSync, mkdirSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { JSONFilePreset } from 'lowdb/node';
import { DatabaseSchema, UserStats } from './types';

const defaultData: DatabaseSchema = {
  games: {},
  stats: {},
};

const DEFAULT_DB_PATH = resolve(__dirname, '..', 'data', 'db.json');

export class Store {
  constructor(private filePath = DEFAULT_DB_PATH) {}

  async db() {
    const dir = dirname(this.filePath);
    if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
    return JSONFilePreset<DatabaseSchema>(this.filePath, defaultData);
  }

  async getStats(userId: string, displayName?: string): Promise<UserStats> {
    const db = await this.db();
    if (!db.data.stats[userId]) {
      db.data.stats[userId] = { userId, displayName, wins: 0, guesses: 0 };
      await db.write();
    } else if (displayName && db.data.stats[userId].displayName !== displayName) {
      db.data.stats[userId].displayName = displayName;
      await db.write();
    }
    return db.data.stats[userId];
  }
}
