import { endOfDay, startOfDay, subDays } from "date-fns";
import prisma from "./prizma";

interface AnalyticsType {
  rows: { day: string; totalDistance: number }[];
  monthlyAverage: number;
  last24h: number;
}

const get = async () => {
  return await prisma.logs.findMany({
    take: 500,
    orderBy: {
      createdAt: "desc",
    },
  });
};

const getByIMEI = async (imei: string): Promise<AnalyticsType> => {
  const last24h = await prisma.records.aggregate({
    where: {
      deviceId: imei,
      createdAt: {
        gte: subDays(new Date(), 1),
      },
    },
    _sum: {
      distance: true,
    },
  });
  const past30Days = await prisma.records.groupBy({
    by: ["createdAt"],
    where: {
      deviceId: imei,
      createdAt: {
        gte: subDays(new Date(), 30),
        lt: subDays(new Date(), 1),
      },
    },
    _sum: { distance: true },
  });

  const dailyTotals: Record<string, number> = {};
  past30Days.forEach((r) => {
    const dateKey = r.createdAt.toISOString().slice(0, 10); // "2025-10-03"
    dailyTotals[dateKey] = (dailyTotals[dateKey] ?? 0) + (r._sum.distance ?? 0);
  });

  const totalDistance = Object.values(dailyTotals).reduce((a, b) => a + b, 0);
  const monthlyAverage = totalDistance / Object.keys(dailyTotals).length;

  const rows = await prisma.$queryRaw<{ day: string; totalDistance: number }[]>`
  SELECT
    to_char( ("createdAt" AT TIME ZONE 'Europe/Paris')::date, 'YYYY-MM-DD') AS day,
    SUM("distance")::double precision AS "totalDistance"
  FROM "records"
  WHERE "deviceId" = ${imei}
    AND "createdAt" >= (NOW() AT TIME ZONE 'Europe/Paris') - INTERVAL '7 days'
  GROUP BY 1
  ORDER BY 1
`;

  return { monthlyAverage, last24h: last24h._sum.distance ?? 0, rows };
};

export { get, getByIMEI };
