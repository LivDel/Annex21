import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

/**
 * Client Redis in-EU (RG-10).
 * Fallback in-memory UNIQUEMENT en development si Redis indisponible — warning clair.
 */
@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private memory = new Map<string, { value: string; expiresAt?: number }>();
  private useMemory = false;

  async onModuleInit(): Promise<void> {
    const host = process.env.REDIS_HOST ?? 'localhost';
    const port = Number(process.env.REDIS_PORT ?? 6379);
    const password = process.env.REDIS_PASSWORD || undefined;
    const isDev = (process.env.NODE_ENV ?? 'development') !== 'production';

    try {
      const redis = new Redis({
        host,
        port,
        password,
        maxRetriesPerRequest: 1,
        connectTimeout: 2000,
        lazyConnect: true,
        // Sessions / magic-links restent in-EU (DATA_RESIDENCY=EU).
      });
      await redis.connect();
      await redis.ping();
      this.client = redis;
      this.logger.log(`Redis connecté ${host}:${port} (data residency EU)`);
    } catch (err) {
      if (!isDev) {
        throw new Error(
          `Redis requis en production (RG-10 sessions in-EU). Connexion échouée: ${String(err)}`,
        );
      }
      this.useMemory = true;
      this.logger.warn(
        '⚠️  Redis indisponible — fallback IN-MEMORY (development only). ' +
          'Les sessions/magic-links ne survivent pas au redémarrage. Préférer ioredis + Redis EU.',
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    if (this.client) {
      await this.client.quit().catch(() => undefined);
    }
  }

  isMemoryFallback(): boolean {
    return this.useMemory;
  }

  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.useMemory || !this.client) {
      const expiresAt = ttlSeconds ? Date.now() + ttlSeconds * 1000 : undefined;
      this.memory.set(key, { value, expiresAt });
      return;
    }
    if (ttlSeconds) {
      await this.client.set(key, value, 'EX', ttlSeconds);
    } else {
      await this.client.set(key, value);
    }
  }

  async get(key: string): Promise<string | null> {
    if (this.useMemory || !this.client) {
      const entry = this.memory.get(key);
      if (!entry) return null;
      if (entry.expiresAt && entry.expiresAt < Date.now()) {
        this.memory.delete(key);
        return null;
      }
      return entry.value;
    }
    return this.client.get(key);
  }

  async del(key: string): Promise<void> {
    if (this.useMemory || !this.client) {
      this.memory.delete(key);
      return;
    }
    await this.client.del(key);
  }

  /** GET + DEL atomique approximé (one-shot magic link). */
  async getDel(key: string): Promise<string | null> {
    if (this.useMemory || !this.client) {
      const value = await this.get(key);
      if (value !== null) await this.del(key);
      return value;
    }
    // ioredis GETDEL (Redis ≥6.2)
    const result = await (this.client as Redis & { getdel?: (k: string) => Promise<string | null> }).getdel?.(
      key,
    );
    if (result !== undefined) return result;
    const value = await this.client.get(key);
    if (value !== null) await this.client.del(key);
    return value;
  }
}
