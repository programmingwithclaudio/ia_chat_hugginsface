// src/config/redis.ts
import { createClient } from "redis";

// Create Redis client with reconnect strategy
const redis = createClient({
  url: process.env.REDIS_URL || "redis://:admin@172.21.0.3:6379",
  socket: {
    reconnectStrategy: (retries) => {
      // Max reconnect attempts
      if (retries > 10) {
        console.error("Redis max reconnect attempts reached. Giving up.");
        return new Error("Redis max reconnect attempts reached");
      }

      // Wait time increases with number of retries (exponential backoff)
      const delay = Math.min(Math.pow(2, retries) * 100, 3000);
      console.log(`Redis reconnecting in ${delay}ms...`);
      return delay;
    },
  },
});

redis.on("error", (err) => {
  console.error("Redis Error:", err);
});

redis.on("connect", () => {
  console.log("Redis connected");
});

redis.on("reconnecting", () => {
  console.log("Redis reconnecting...");
});

redis.on("ready", () => {
  console.log("Redis ready");
});

// Connect on export
(async () => {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
  } catch (error) {
    console.error("Redis initial connection error:", error);
  }
})();

// Make sure Redis client is properly closed on app termination
process.on("SIGINT", async () => {
  if (redis.isOpen) {
    await redis.quit();
  }
  process.exit(0);
});

export default redis;
