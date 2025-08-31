import { createClient } from "redis";
import * as distance from "./distance";
import * as notification from "./notification";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (err) => {
  console.error("🔴 Redis Client Error:", err);
});

const connectRedis = async () => {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("✅ Redis connected");
  }
};

const redisMethodes = {
  distance,
  notification,
};

export { redis, redisMethodes, connectRedis };
