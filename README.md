# number-baseball

카카오톡 단톡방에서 즐기는 숫자야구 스킬/구현 레포입니다. 이 폴더는 `SKILL.md`와 실제 TypeScript 구현을 함께 보관하는 단일 기준 경로입니다.

## 핵심 기능

- 방별 1개 활성 게임 유지
- 이미 진행 중인 게임은 덮어쓰지 않고 안내 메시지 반환
- `@숫자야구`로 3자리 게임 시작
- `@숫자야구 4`로 4자리 게임 시작
- `@123`, `@1234`로 모바일 친화적 추측
- 숫자 추측은 LLM 없이 내부 룰 엔진으로 즉시 판정
- `@상태`, `@랭킹`, `@포기`, `@도움말` 지원
- 유저별 누적 전적 저장: wins, guesses, homeRunRate(= wins / guesses)
- 유저 이름(displayName)을 함께 저장해 승리 메시지/랭킹 가독성 개선
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
npm run build
```

## 코드 구조

- `src/game.ts` - 숫자 생성/검증/판정 로직
- `src/store.ts` - lowdb 기반 저장소
- `src/bot.ts` - 명령어 파싱 + 게임 진행
- `tests/` - 기본 테스트

## 저장/랭킹 규칙

- 활성 게임은 방(chatId) 단위로 1개만 유지합니다.
- 승리 시 전적은 `wins`, `guesses` 기준으로 누적됩니다.
- 홈런율은 `wins / guesses` 로 계산합니다.
- 랭킹은 `승수 > 홈런율 > 총 추측 수(적은 쪽 우선)` 순서로 정렬합니다.
- 표시 이름은 `SenderName`에서 온 `userName(displayName)`을 우선 사용하고, 없으면 `SenderId` 기반 `userId`를 사용합니다.

## OpenClaw 연동 방향

`handleChatMessage({ chatId, userId, userName, message })` 를 호출하면 reply string 또는 null 을 반환합니다.

예시:

```ts
import { handleChatMessage } from './src';

const reply = await handleChatMessage({
  chatId: 'kakaotalk:chat:123',
  userId: '208977', // SenderId
  userName: '이진우', // SenderName
  message: '@숫자야구',
});
```

이 반환값을 OpenClaw의 카카오톡 메시지 송신 경로에 연결하면 됩니다.
