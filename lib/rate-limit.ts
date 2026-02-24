interface RateLimitEntry {
  count: number;
  resetAt: number;
}

interface RateLimitOptions {
  maxRequests: number;
  windowMs: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry>;
  private maxRequests: number;
  private windowMs: number;
  private cleanupInterval: NodeJS.Timeout | null;

  constructor(options: RateLimitOptions) {
    this.store = new Map();
    this.maxRequests = options.maxRequests;
    this.windowMs = options.windowMs;
    this.cleanupInterval = null;
    this.startCleanup();
  }

  private startCleanup(): void {
    this.cleanupInterval = setInterval(() => {
      const now = Date.now();
      for (const [key, entry] of this.store.entries()) {
        if (entry.resetAt < now) {
          this.store.delete(key);
        }
      }
    }, this.windowMs);
  }

  check(ip: string): { allowed: boolean; retryAfter: number; remaining: number } {
    const now = Date.now();
    const entry = this.store.get(ip);

    if (!entry || entry.resetAt < now) {
      this.store.set(ip, {
        count: 1,
        resetAt: now + this.windowMs,
      });
      return {
        allowed: true,
        retryAfter: 0,
        remaining: this.maxRequests - 1,
      };
    }

    if (entry.count >= this.maxRequests) {
      const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
      return {
        allowed: false,
        retryAfter,
        remaining: 0,
      };
    }

    entry.count++;
    return {
      allowed: true,
      retryAfter: 0,
      remaining: this.maxRequests - entry.count,
    };
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
  }
}

const authRateLimiter = new RateLimiter({
  maxRequests: 5,
  windowMs: 60 * 1000,
});

export function checkRateLimit(ip: string): {
  allowed: boolean;
  retryAfter: number;
  remaining: number;
} {
  return authRateLimiter.check(ip);
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");

  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }

  if (realIP) {
    return realIP;
  }

  return "unknown";
}
