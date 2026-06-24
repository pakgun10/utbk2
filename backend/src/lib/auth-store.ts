const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const tokens = new Map<string, number>();

function cleanupExpiredTokens(now: number) {
  for (const [token, expiresAt] of tokens.entries()) {
    if (expiresAt <= now) {
      tokens.delete(token);
    }
  }
}

export function createToken(): string {
  const now = Date.now();
  cleanupExpiredTokens(now);

  const token = crypto.randomUUID();
  tokens.set(token, now + TOKEN_TTL_MS);
  return token;
}

export function isValidToken(token: string | undefined): boolean {
  if (!token) return false;

  const now = Date.now();
  cleanupExpiredTokens(now);

  const expiresAt = tokens.get(token);
  if (!expiresAt) return false;
  if (expiresAt <= now) {
    tokens.delete(token);
    return false;
  }

  return true;
}

export function removeToken(token: string): void {
  tokens.delete(token);
}

export function clearTokensForTest(): void {
  tokens.clear();
}
