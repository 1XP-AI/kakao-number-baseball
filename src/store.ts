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
  private _db: Awaited<ReturnType<typeof JSONFilePreset<DatabaseSchema>>> | null = null;

  constructor(private filePath = DEFAULT_DB_PATH) {}

  async db() {
    if (!this._db) {
      const dir = dirname(this.filePath);
      if (!existsSync(dir)) mkdirSync(dir, { recursive: true });
      this._db = await JSONFilePreset<DatabaseSchema>(this.filePath, defaultData);
    }
    return this._db;
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
