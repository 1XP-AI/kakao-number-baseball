import { generateSecret, isValidGuess, judgeGuess } from './game';
import { ChatEvent, DigitLength } from './types';
import { DEFAULT_DB_PATH, Store } from './store';

function formatHomeRunRate(wins: number, guesses: number) {
  if (guesses === 0) return '0.0';
  return ((wins / guesses) * 100).toFixed(1);
}

export class NumberBaseballBot {
  constructor(private store = new Store()) {}

  async handle(event: ChatEvent): Promise<string | null> {
    const message = event.message.trim();
    console.info(`[number-baseball] event chatId=${event.chatId} userId=${event.userId} userName=${event.userName ?? '-'} message=${message} db=${DEFAULT_DB_PATH}`);
    if (!message.startsWith('@')) return null;

    if (message === '@도움말') return this.help();
    if (message === '@상태') return this.status(event.chatId);
    if (message === '@랭킹') return this.rank();
    if (message === '@포기') return this.giveUp(event.chatId, event.userId, event.userName);
    if (message === '@숫자야구' || message === '@숫자야구 4') {
      const digits: DigitLength = message === '@숫자야구 4' ? 4 : 3;
      return this.start(event.chatId, digits);
    }

    const guess = message.slice(1);
    if (/^[0-9]{3,4}$/.test(guess)) {
      return this.guess(event.chatId, event.userId, guess, event.userName);
    }

    return null;
  }

  private help() {
    return [
      '숫자야구 명령어',
      '- @숫자야구 → 3자리 시작',
      '- @숫자야구 4 → 4자리 시작',
      '- @123 / @1234 → 추측',
      '- @상태 → 현재 게임',
      '- @랭킹 → 누적 랭킹',
      '- @포기 → 현재 게임 종료',
    ].join('\n');
  }

  private async start(chatId: string, digits: DigitLength) {
    const db = await this.store.db();
    const existing = db.data.games[chatId];

    if (existing) {
      if (existing.digits === digits) {
        return `이미 ${digits}자리 게임이 진행 중이야. 현재 ${existing.guessCount}번 시도했어.`;
      }
      return `이미 ${existing.digits}자리 게임이 진행 중이야. 바꾸려면 먼저 @포기 해줘.`;
    }

    db.data.games[chatId] = {
      chatId,
      digits,
      secret: generateSecret(digits),
      startedAt: new Date().toISOString(),
      guessCount: 0,
      history: [],
    };
    await db.write();
    return `숫자야구 시작. ${digits}자리 숫자를 맞혀봐. 중복 숫자는 없고 맨 앞자리는 0이 아니야.`;
  }

  private async status(chatId: string) {
    const db = await this.store.db();
    const game = db.data.games[chatId];
    if (!game || !game.secret || !game.digits) return '진행 중인 게임이 없어. @숫자야구 또는 @숫자야구 4 로 시작해.';
    const recent = game.history
      .slice(-3)
      .map((item) => `${item.guess} → ${item.strike === 0 && item.ball === 0 ? '아웃' : `${item.strike}S ${item.ball}B`}`)
      .join('\n');
    return [
      `진행 중: ${game.digits}자리 숫자야구`,
      `총 시도: ${game.guessCount}회`,
      recent ? `최근 기록:\n${recent}` : '아직 추측이 없어.',
    ].join('\n');
  }

  private async rank() {
    const db = await this.store.db();
    const rows = Object.values(db.data.stats)
      .sort((a, b) => {
        const winsDiff = b.wins - a.wins;
        if (winsDiff !== 0) return winsDiff;
        const homeRunDiff = (b.wins / Math.max(b.guesses, 1)) - (a.wins / Math.max(a.guesses, 1));
        if (homeRunDiff !== 0) return homeRunDiff;
        return a.guesses - b.guesses;
      })
      .slice(0, 10);

    console.info(`[number-baseball] rank db=${DEFAULT_DB_PATH} statsKeys=${Object.keys(db.data.stats).join(',') || '(none)'}`);
    if (rows.length === 0) return '아직 랭킹 데이터가 없어.';

    return ['숫자야구 랭킹', ...rows.map((row, index) => {
      const name = row.displayName ?? row.userId;
      return `${index + 1}. ${name} - ${row.wins}승 · 추측 ${row.guesses}회 · 홈런율 ${formatHomeRunRate(row.wins, row.guesses)}%`;
    })].join('\n');
  }

  private async giveUp(chatId: string, userId: string, userName?: string) {
    const db = await this.store.db();
    const game = db.data.games[chatId];
    if (!game) return '포기할 게임이 없어.';

    await this.store.getStats(userId, userName);
    delete db.data.games[chatId];
    await db.write();
    return `게임 종료. 정답은 ${game.secret} 였어.`;
  }

  private async guess(chatId: string, userId: string, guess: string, userName?: string) {
    const db = await this.store.db();
    const game = db.data.games[chatId];
    if (!game) return '먼저 @숫자야구 또는 @숫자야구 4 로 게임을 시작해.';
    if (guess.length !== game.digits) {
      const example = game.digits === 3 ? '@123' : '@1234';
      return `지금은 ${game.digits}자리 게임이야. ${example} 형식으로 입력해줘.`;
    }
    if (!isValidGuess(guess, game.digits)) return `${game.digits}자리 중복 없는 숫자로 입력해줘. 맨 앞자리는 0이 아니야.`;

    const result = judgeGuess(game.secret, guess);
    game.guessCount += 1;
    game.history.push({ userId, guess, strike: result.strike, ball: result.ball, at: new Date().toISOString() });

    const stats = await this.store.getStats(userId, userName);
    stats.guesses += 1;
    console.info(`[number-baseball] guess db=${DEFAULT_DB_PATH} userId=${userId} displayName=${userName ?? '-'} wins=${stats.wins} guesses=${stats.guesses}`);

    if (result.strike === game.digits) {
      stats.wins += 1;
      const tries = game.guessCount;
      delete db.data.games[chatId];
      await db.write();
      const winnerName = userName ?? userId;
      return `정답! ${guess} 맞췄다. ${winnerName} 승리. 총 ${tries}번 만에 성공.`;
    }

    await db.write();
    if (result.strike === 0 && result.ball === 0) return `${guess} → 아웃`;
    return `${guess} → ${result.strike}S ${result.ball}B`;
  }
}

const sharedBot = new NumberBaseballBot();

export async function handleChatMessage(event: ChatEvent) {
  return sharedBot.handle(event);
}
