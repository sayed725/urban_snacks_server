import { createClient, RedisClientType } from "redis";
import { env } from "../config/env";



class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;
  private isDisabled: boolean = false;
  private memoryCache = new Map<string, { value: any; expiresAt: number }>();
  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.isDisabled) return;
    if (this.isConnected) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async () => {
      try {
        const redisUrl = env.REDIS_URL;
        
        const reconnectStrategy = (retries: number) => {
          if (retries > 3) {
            console.warn("Redis: Connection failed after 3 attempts. Disabling Redis and falling back to memory cache.");
            this.isDisabled = true;
            this.isConnected = false;
            return false; // stop reconnecting
          }
          return Math.min(retries * 500, 2000);
        };

        if (redisUrl) {
          const isSecure = redisUrl.startsWith("rediss://");
          
          this.client = createClient({ 
            url: redisUrl,
            pingInterval: 1000 * 60 * 4,
            socket: {
              reconnectStrategy,
              ...(isSecure && {
                tls: true,
                rejectUnauthorized: false,
              })
            }
          });
        } else {
          const host = env.REDIS_HOST || "localhost";
          const port = parseInt(env.REDIS_PORT || "6379", 10);
          const password = env.REDIS_PASSWORD || undefined;

          this.client = createClient({
            socket: { host, port, reconnectStrategy },
            ...(password && { password }),
          });
        }

        this.client.on("error", (err) => {
          // Log only unique or critical errors, and avoid flooding if disabled
          if (!this.isDisabled) {
            console.error("Redis Client Error:", err.message || err);
          }
          this.isConnected = false;
        });

        this.client.on("connect", () => {
          console.log("Redis Client Connected");
          this.isConnected = true;
          this.isDisabled = false;
        });

        this.client.on("ready", () => {
          console.log("Redis Client Ready");
          this.isConnected = true;
          this.isDisabled = false;
        });

        this.client.on("end", () => {
          console.log("Redis Client Disconnected");
          this.isConnected = false;
        });

        this.client.on("reconnecting", () => {
          if (!this.isDisabled) {
            console.log("Redis Client Reconnecting");
          }
        });

        await this.client.connect();
      } catch (error: any) {
        console.error("Failed to connect to Redis:", error.message || error);
        this.isConnected = false;
        this.isDisabled = true;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  private async ensureConnection(): Promise<RedisClientType> {
    if (this.isDisabled) {
      throw new Error("Redis client is disabled.");
    }
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected.");
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    // If Redis is disabled/disconnected, use memory fallback immediately
    if (this.isDisabled || !this.isConnected) {
      const cached = this.memoryCache.get(key);
      if (cached) {
        if (Date.now() < cached.expiresAt) {
          return typeof cached.value === "string" ? cached.value : JSON.stringify(cached.value);
        }
        this.memoryCache.delete(key);
      }
      return null;
    }

    try {
      const client = await this.ensureConnection();
      return await client.get(key);
    } catch (error) {
      // Fallback on error
      const cached = this.memoryCache.get(key);
      if (cached && Date.now() < cached.expiresAt) {
        return typeof cached.value === "string" ? cached.value : JSON.stringify(cached.value);
      }
      return null;
    }
  }

  async set(key: string, value: any, ttlInSeconds: number): Promise<void> {
    const expiresAt = Date.now() + ttlInSeconds * 1000;
    this.memoryCache.set(key, { value, expiresAt });

    if (this.isDisabled || !this.isConnected) {
      return;
    }

    try {
      const client = await this.ensureConnection();
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      await client.set(key, stringValue, { EX: ttlInSeconds });
    } catch (error) {
      // Already stored in memory cache, so we can ignore/log the Redis error
    }
  }

  async update(key: string, value: any, ttlInSeconds: number): Promise<void> {
    await this.set(key, value, ttlInSeconds);
  }

  async delete(key: string): Promise<void> {
    this.memoryCache.delete(key);
    if (this.isDisabled || !this.isConnected) {
      return;
    }
    try {
      const client = await this.ensureConnection();
      await client.del(key);
    } catch (error) {
      // Ignore or log error
    }
  }

  async isAvailable(): Promise<boolean> {
    if (this.isDisabled) return false;
    try {
      const client = await this.ensureConnection();
      await client.ping();
      return true;
    } catch (error) {
      return false;
    }
  }

  async disconnect(): Promise<void> {
    if (this.client && this.isConnected) {
      await this.client.quit();
      this.isConnected = false;
    }
  }
} 


// Export a singleton instance
export const redisService = new RedisService();

// Connect on module import (optional - can also connect manually)
// redisService.connect().catch(console.error);