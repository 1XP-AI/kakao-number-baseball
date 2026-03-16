---
name: number-baseball
description: Run a KakaoTalk-style 숫자야구 (number baseball) game in chat. Use when users want to play number baseball with commands like `@숫자야구`, `@숫자야구 4`, `@123`, `@1234`, `@상태`, `@랭킹`, `@포기`, or `@도움말`, especially for group-chat play where the bot owns one secret number per room and tracks cumulative stats/rankings.
---

# Number Baseball

Run a lightweight room-scoped 숫자야구 game.

## Command UX

Interpret these exact commands:

- `@숫자야구` → start a 3-digit game
- `@숫자야구 4` → start a 4-digit game
- `@123` or `@1234` → submit a guess
- `@상태` → show current room game state
- `@랭킹` → show cumulative ranking
- `@포기` → end the current room game and reveal answer
- `@도움말` → show command help

Keep command handling mobile-friendly and short. Do not require slash commands.

## Game Rules

- Use non-repeating digits only.
- Use one active game per room.
- Let the bot own the secret number.
- Return:
  - `nS mB` when guess partially matches
  - `아웃` when no digits match
  - a win message when all digits match

## State Rules

Persist state outside transient chat memory.
Track at minimum:

- active game by room/chat id
- digit length
- secret
- guess count
- guess history
- per-user cumulative stats:
  - wins
  - guesses
  - homeRunRate
  - optional displayName for chat-friendly ranking output

## Ranking Rules

When showing `@랭킹`:

- sort by wins descending first
- break ties by homeRunRate descending
- if still tied, prefer fewer total guesses
- show top users in a compact chat-friendly format

## Response Style

Keep outputs short and KakaoTalk-friendly.
Prefer plain Korean text.
Good patterns:

- `숫자야구 시작. 3자리 숫자를 맞혀봐. 중복 숫자는 없고 맨 앞자리는 0이 아니야.`
- `472 → 1S 2B`
- `381 → 아웃`
- `정답! 427 맞췄다. 홍길동 승리. 총 5번 만에 성공.`
- `1. 홍길동 - 3승 · 추측 12회 · 홈런율 25.0%`

## Implementation Guidance

If asked to build or wire this into code:

1. Prefer a small deterministic game engine over prompt-only play.
2. Persist room/game/user state in JSON or sqlite.
3. Keep parsing logic separate from transport/channel glue.
4. For KakaoTalk/OpenClaw integration, treat incoming message text as command input and return plain reply text.
5. Do not require bot-name mention for these commands if the user explicitly wants command-triggered gameplay.
6. Prefer `@`-prefixed commands over `!`-prefixed commands for this game when the user asks for the safer/mobile-friendly KakaoTalk variant.
7. Fast-path these commands before the normal LLM reply pipeline when possible; `@숫자야구`, `@숫자야구 4`, `@123`, `@1234`, `@상태`, `@랭킹`, `@포기`, `@도움말` should be handled by deterministic code, not by prompt reasoning.
8. Reject guesses with wrong digit length, duplicate digits, or leading zeroes.
9. Do not silently overwrite an active room game when a new start command arrives; return a compact guidance message instead.

## File/Repo Context

Current implementation repo:

- `1XP-AI/kakao-number-baseball`
- local path: `/home/jjangg96/.openclaw/workspace/skills/number-baseball`

Use this repo when the user asks to continue implementation, refactor, or connect the game to a runtime.
er asks to continue implementation, refactor, or connect the game to a runtime.
