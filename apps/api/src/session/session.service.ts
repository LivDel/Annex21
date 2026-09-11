import { Injectable } from '@nestjs/common';
import { randomBytes } from 'crypto';
import type { SessionRecord, SessionUser } from '@annex21/shared';
import { RedisService } from './redis.service';

const SESSION_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 jours
const SESSION_PREFIX = 'session:';
/** user → last completed orgId (Redis cache for session hydration). */
const USER_ORG_PREFIX = 'user_org:';
const USER_ORG_TTL_SECONDS = 90 * 24 * 60 * 60;

@Injectable()
export class SessionService {
  constructor(private readonly redis: RedisService) {}

  cookieName(): string {
    return process.env.SESSION_COOKIE_NAME ?? 'annex21_session';
  }

  async create(
    user: SessionUser,
    hydrate?: Pick<SessionRecord, 'orgId' | 'onboardingCompletedAt' | 'org'>,
  ): Promise<{ sessionId: string; record: SessionRecord }> {
    const sessionId = randomBytes(32).toString('base64url');
    const now = new Date();
    const expiresAt = new Date(now.getTime() + SESSION_TTL_SECONDS * 1000);

    let orgId = hydrate?.orgId ?? null;
    let onboardingCompletedAt = hydrate?.onboardingCompletedAt ?? null;
    let org = hydrate?.org ?? null;

    if (!onboardingCompletedAt) {
      const cachedOrgId = await this.getUserOrgId(user.id);
      if (cachedOrgId) orgId = cachedOrgId;
    }

    const record: SessionRecord = {
      id: sessionId,
      user,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      orgId,
      onboardingCompletedAt,
      org,
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

  async update(
    sessionId: string,
    patch: Partial<
      Pick<SessionRecord, 'onboardingCompletedAt' | 'org' | 'orgId' | 'user'>
    >,
  ): Promise<SessionRecord | null> {
    const current = await this.get(sessionId);
    if (!current) return null;
    const next: SessionRecord = {
      ...current,
      ...patch,
      id: current.id,
      user: patch.user ?? current.user,
      createdAt: current.createdAt,
      expiresAt: current.expiresAt,
    };
    await this.redis.set(
      `${SESSION_PREFIX}${sessionId}`,
      JSON.stringify(next),
      SESSION_TTL_SECONDS,
    );
    return next;
  }

  async destroy(sessionId: string): Promise<void> {
    if (!sessionId) return;
    await this.redis.del(`${SESSION_PREFIX}${sessionId}`);
  }

  ttlSeconds(): number {
    return SESSION_TTL_SECONDS;
  }

  async setUserOrgId(userId: string, orgId: string): Promise<void> {
    if (!userId || !orgId) return;
    await this.redis.set(
      `${USER_ORG_PREFIX}${userId}`,
      orgId,
      USER_ORG_TTL_SECONDS,
    );
  }

  async getUserOrgId(userId: string): Promise<string | null> {
    if (!userId) return null;
    return this.redis.get(`${USER_ORG_PREFIX}${userId}`);
  }
}
