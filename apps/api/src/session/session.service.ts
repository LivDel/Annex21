import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { SessionRecord, SessionUser } from '@annex21/shared';
import { RedisService } from './redis.service';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 jours
const SESSION_PREFIX = 'session:';

@Injectable()
export class SessionService {
  constructor(private readonly redis: RedisService) {}

  cookieName(): string {
    return process.env.SESSION_COOKIE_NAME ?? 'annex21_session';
  }

  async create(user: SessionUser): Promise<{ sessionId: string; record: SessionRecord }> {
    const sessionId = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);
    const record: SessionRecord = {
      id: sessionId,
      user,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };
    await this.redis.set(
      `${SESSION_PREFIX}${sessionId}`,
      JSON.stringify(record),
      SESSION_TTL_SECONDS,
    );
    return { sessionId, record };
  }

  async get(sessionId: string): Promise<SessionRecord | null> {
    if (!sessionId) return null;
    const raw = await this.redis.get(`${SESSION_PREFIX}${sessionId}`);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as SessionRecord;
    } catch {
      return null;
    }
  }

  async destroy(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await this.redis.del(`${SESSION_PREFIX}${sessionId}`);
  }

  ttlSeconds(): number {
    return SESSION_TTL_SECONDS;
  }
}
