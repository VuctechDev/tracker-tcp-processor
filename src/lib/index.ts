import { createClient } from "redis";

const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});

redis.on("error", (err) => {
  console.error("🔴 Redis Client Error:", err);
});

export async function connectRedis() {
  if (!redis.isOpen) {
    await redis.connect();
    console.log("✅ Redis connected");
  }
}

export { redis };

export const clearRedis = async () => {
  await redis.del(`device:4oho53h435o:distances`);
  await redis.del(`device:4oho53h435o:buffer`);
};
