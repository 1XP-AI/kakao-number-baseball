import { describe, expect, it } from 'vitest';
import { judgeGuess, isValidGuess } from '../src/game';

describe('game logic', () => {
  it('judges strike and ball correctly', () => {
    expect(judgeGuess('427', '472')).toEqual({ strike: 1, ball: 2 });
  });

  it('rejects duplicated guess', () => {
    expect(isValidGuess('112', 3)).toBe(false);
  });
});
