import { createClient, RedisClientType } from "redis";
import { env } from "../config/env";



class RedisService {
  private client: RedisClientType | null = null;
  private isConnected: boolean = false;

  private connectionPromise: Promise<void> | null = null;

  async connect(): Promise<void> {
    if (this.isConnected) return;
    if (this.connectionPromise) return this.connectionPromise;

    this.connectionPromise = (async () => {
      try {
        const redisUrl = env.REDIS_URL;
        if (redisUrl) {
          const isSecure = redisUrl.startsWith("rediss://");
          
          this.client = createClient({ 
            url: redisUrl,
            pingInterval: 1000 * 60 * 4,
            ...(isSecure && {
              socket: {
                tls: true,
                rejectUnauthorized: false,
              }
            })
          });
        } else {
          const host = env.REDIS_HOST || "localhost";
          const port = parseInt(env.REDIS_PORT || "6379", 10);
          const password = env.REDIS_PASSWORD || undefined;

          this.client = createClient({
            socket: { host, port },
            ...(password && { password }),
          });
        }

        this.client.on("error", (err) => {
          console.error("Redis Client Error:", err);
          this.isConnected = false;
        });

        this.client.on("connect", () => {
          console.log("Redis Client Connected");
          this.isConnected = true;
        });

        this.client.on("ready", () => {
          console.log("Redis Client Ready");
          this.isConnected = true;
        });

        this.client.on("end", () => {
          console.log("Redis Client Disconnected");
          this.isConnected = false;
        });

        this.client.on("reconnecting", () => {
          console.log("Redis Client Reconnecting");
        });

        await this.client.connect();
      } catch (error) {
        console.error("Failed to connect to Redis:", error);
        this.isConnected = false;
      } finally {
        this.connectionPromise = null;
      }
    })();

    return this.connectionPromise;
  }

  private async ensureConnection(): Promise<RedisClientType> {
    if (!this.client || !this.isConnected) {
      await this.connect();
    }
    if (!this.client || !this.isConnected) {
      throw new Error("Redis client not connected.");
    }
    return this.client;
  }

  async get(key: string): Promise<string | null> {
    try {
      const client = await this.ensureConnection();
      return await client.get(key);
    } catch (error) {
      console.error("Redis GET error:", error);
      return null;
    }
  }

  async set(key: string, value: any, ttlInSeconds: number): Promise<void> {
    try {
      const client = await this.ensureConnection();
      const stringValue = typeof value === "string" ? value : JSON.stringify(value);
      await client.set(key, stringValue, { EX: ttlInSeconds });
    } catch (error) {
      console.error("Redis SET error:", error);
    }
  }

  async update(key: string, value: any, ttlInSeconds: number): Promise<void> {
    await this.set(key, value, ttlInSeconds);
  }

  async delete(key: string): Promise<void> {
    try {
      const client = await this.ensureConnection();
      await client.del(key);
    } catch (error) {
      console.error("Redis DELETE error:", error);
    }
  }

  async isAvailable(): Promise<boolean> {
    try {
      const client = await this.ensureConnection();
      await client.ping();
      return true;
    } catch (error) {
      console.log(error);
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