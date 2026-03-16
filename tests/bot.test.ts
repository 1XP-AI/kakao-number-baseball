import { beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { NumberBaseballBot } from '../src/bot';
import { Store } from '../src/store';

describe('bot flow', () => {
  const dbPath = 'data/test-db.json';

  beforeEach(() => {
    rmSync(dbPath, { force: true });
  });

  it('starts a game and handles guesses', async () => {
    const store = new Store(dbPath);
    const bot = new NumberBaseballBot(store);

    const startReply = await bot.handle({ chatId: 'room-1', userId: 'alice', message: '!숫자야구' });
    expect(startReply).toContain('숫자야구 시작');

    const db = await store.db();
    db.data.games['room-1'].secret = '427';
    await db.write();

    const guessReply = await bot.handle({ chatId: 'room-1', userId: 'alice', message: '!472' });
    expect(guessReply).toBe('472 → 1S 2B');

    const winReply = await bot.handle({ chatId: 'room-1', userId: 'alice', message: '!427' });
    expect(winReply).toContain('정답! 427');
  });
});
