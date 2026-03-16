import { beforeEach, describe, expect, it } from 'vitest';
import { rmSync } from 'node:fs';
import { NumberBaseballBot } from '../src/bot';
import { Store } from '../src/store';
import { isValidGuess } from '../src/game';

const dbPath = 'data/test-db.json';

beforeEach(() => {
  rmSync(dbPath, { force: true });
});

describe('bot flow', () => {

  it('starts a game and handles guesses', async () => {
    const store = new Store(dbPath);
    const bot = new NumberBaseballBot(store);

    const startReply = await bot.handle({ chatId: 'room-1', userId: 'alice', userName: 'Alice', message: '@숫자야구' });
    expect(startReply).toContain('숫자야구 시작');

    const db = await store.db();
    db.data.games['room-1'].secret = '427';
    await db.write();

    const guessReply = await bot.handle({ chatId: 'room-1', userId: 'alice', userName: 'Alice', message: '@472' });
    expect(guessReply).toBe('472 → 1S 2B');

    const winReply = await bot.handle({ chatId: 'room-1', userId: 'alice', userName: 'Alice', message: '@427' });
    expect(winReply).toContain('정답! 427');
    expect(winReply).toContain('Alice 승리');
  });

  it('does not overwrite an active game on duplicate start', async () => {
    const store = new Store(dbPath);
    const bot = new NumberBaseballBot(store);

    await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@숫자야구' });
    const sameReply = await bot.handle({ chatId: 'room-1', userId: 'bob', message: '@숫자야구' });
    expect(sameReply).toContain('이미 3자리 게임이 진행 중이야');

    const changeReply = await bot.handle({ chatId: 'room-1', userId: 'bob', message: '@숫자야구 4' });
    expect(changeReply).toContain('바꾸려면 먼저 @포기');
  });

  it('rejects wrong-length guesses with a clear message', async () => {
    const store = new Store(dbPath);
    const bot = new NumberBaseballBot(store);

    await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@숫자야구' });
    const reply = await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@1234' });
    expect(reply).toBe('지금은 3자리 게임이야. @123 형식으로 입력해줘.');
  });

  it('shows 아웃 in status history', async () => {
    const store = new Store(dbPath);
    const bot = new NumberBaseballBot(store);

    await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@숫자야구' });
    const db = await store.db();
    db.data.games['room-1'].secret = '427';
    await db.write();

    await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@156' });
    const statusReply = await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@상태' });
    expect(statusReply).toContain('156 → 아웃');
  });

  it('returns no active game status after a win', async () => {
    const store = new Store(dbPath);
    const bot = new NumberBaseballBot(store);

    await bot.handle({ chatId: 'room-1', userId: 'alice', userName: 'Alice', message: '@숫자야구' });
    const db = await store.db();
    db.data.games['room-1'].secret = '427';
    await db.write();

    await bot.handle({ chatId: 'room-1', userId: 'alice', userName: 'Alice', message: '@427' });
    const statusReply = await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@상태' });

    expect(statusReply).toBe('진행 중인 게임이 없어. @숫자야구 또는 @숫자야구 4 로 시작해.');
  });

  it('returns no active game status after give up', async () => {
    const store = new Store(dbPath);
    const bot = new NumberBaseballBot(store);

    await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@숫자야구' });
    await bot.handle({ chatId: 'room-1', userId: 'alice', userName: 'Alice', message: '@포기' });
    const statusReply = await bot.handle({ chatId: 'room-1', userId: 'alice', message: '@상태' });

    expect(statusReply).toBe('진행 중인 게임이 없어. @숫자야구 또는 @숫자야구 4 로 시작해.');
  });
});

describe('guess validation', () => {
  it('rejects leading zero guesses', () => {
    expect(isValidGuess('012', 3)).toBe(false);
    expect(isValidGuess('102', 3)).toBe(true);
  });
});

describe('ranking display', () => {
  it('prefers displayName over userId in ranking output', async () => {
    const isolatedDbPath = `data/test-ranking-db-${Date.now()}-${Math.random().toString(16).slice(2)}.json`;
    const store = new Store(isolatedDbPath);
    const bot = new NumberBaseballBot(store);

    await bot.handle({ chatId: 'room-1', userId: 'alice', userName: '이진우', message: '@숫자야구' });
    const db = await store.db();
    db.data.games['room-1'].secret = '427';
    await db.write();

    await bot.handle({ chatId: 'room-1', userId: 'alice', userName: '이진우', message: '@427' });
    const rankingReply = await bot.handle({ chatId: 'room-1', userId: 'alice', userName: '이진우', message: '@랭킹' });

    expect(rankingReply).toContain('이진우 - ');
    expect(rankingReply).toContain('홈런율 ');
    expect(rankingReply).not.toContain('alice - ');
    expect(rankingReply).not.toContain('패');
    expect(rankingReply).not.toContain('승률');
  });
});
