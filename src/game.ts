import { DigitLength } from './types';

export function generateSecret(digits: DigitLength): string {
  const pool = ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'];
  let result = '';

  while (result.length < digits) {
    const index = Math.floor(Math.random() * pool.length);
    const next = pool.splice(index, 1)[0];
    if (result.length === 0 && next === '0') {
      pool.push(next);
      continue;
    }
    result += next;
  }

  return result;
}

export function isValidGuess(input: string, digits: DigitLength): boolean {
  return (
    new RegExp(`^[0-9]{${digits}}$`).test(input)
    && input[0] !== '0'
    && new Set(input).size === digits
  );
}

export function judgeGuess(secret: string, guess: string) {
  let strike = 0;
  let ball = 0;

  for (let i = 0; i < guess.length; i += 1) {
    if (secret[i] === guess[i]) {
      strike += 1;
    } else if (secret.includes(guess[i])) {
      ball += 1;
    }
  }

  return { strike, ball };
}
