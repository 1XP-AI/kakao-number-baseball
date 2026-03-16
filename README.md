# kakao-number-baseball

카카오톡 단톡방에서 즐기는 숫자야구 MVP입니다. 봇이 방마다 하나의 비밀 숫자를 들고 있고, 유저들은 `@` 명령어로 함께 맞춥니다.

## 핵심 기능

- 방별 1개 활성 게임 유지
- `@숫자야구`로 3자리 게임 시작
- `@숫자야구 4`로 4자리 게임 시작
- `@123`, `@1234`로 모바일 친화적 추측
- `@상태`, `@랭킹`, `@포기`, `@도움말` 지원
- 유저별 누적 전적 저장: wins, losses, gamesPlayed, guesses, winRate
- JSON 파일 기반 로컬 영속화
- OpenClaw/Kakao 메시지 어댑터에 붙이기 쉬운 인터페이스 제공

## 명령어

- `@숫자야구` → 3자리 시작
- `@숫자야구 4` → 4자리 시작
- `@123` / `@1234` → 추측
- `@상태` → 현재 게임 상태
- `@랭킹` → 누적 랭킹
- `@포기` → 현재 게임 종료
- `@도움말` → 사용법 안내

## 개발

```bash
npm install
npm test
```

## 코드 구조

- `src/game.ts` - 숫자 생성/검증/판정 로직
- `src/store.ts` - lowdb 기반 저장소
- `src/bot.ts` - 명령어 파싱 + 게임 진행
- `tests/` - 기본 테스트

## OpenClaw 연동 방향

`handleChatMessage({ chatId, userId, message })` 를 호출하면 reply string 또는 null 을 반환합니다.

예시:

```ts
import { handleChatMessage } from './src';

const reply = await handleChatMessage({
  chatId: 'kakaotalk:chat:123',
  userId: 'alice',
  message: '@숫자야구',
});
```

이 반환값을 OpenClaw의 카카오톡 메시지 송신 경로에 연결하면 됩니다.
