import { endOfDay, startOfDay, subDays } from "date-fns";
import prisma from "./prizma";
import { getTZ } from "../lib/utils/getTZ";

interface AnalyticsType {
  rows: { day: string; totalDistance: number }[];
  monthlyAverage: number;
  last24h: number;
  hourly: any;
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

  const hourly = await prisma.$queryRaw<
    { hour: string; hourTs: Date; totalDistance: number; samples: number }[]
  >`WITH hours AS (
    SELECT generate_series(
      date_trunc('hour', NOW() - INTERVAL '23 hours'),
      date_trunc('hour',  NOW()),
      INTERVAL '1 hour'
    ) AS hour
)
SELECT
  to_char(h.hour, 'YYYY-MM-DD HH24:00')           AS "hour",
  h.hour                                          AS "hourTs",
  COALESCE(SUM(r."distance")::double precision, 0) AS "totalDistance",
  COALESCE(COUNT(r.*), 0)::int                     AS "samples"
FROM hours h
LEFT JOIN "records" r
  ON r."deviceId" = ${imei}
 AND ("createdAt") >= h.hour
 AND ("createdAt") <  h.hour + INTERVAL '1 hour'
GROUP BY h.hour
ORDER BY h.hour;`;

  return {
    monthlyAverage,
    last24h: last24h._sum.distance ?? 0,
    rows,
    hourly,
  };
};

const getByIMEI2 = async (imei: string, tz = "2"): Promise<any> => {
  const last24h = await prisma.health.aggregate({
    where: {
      deviceId: imei,
      createdAt: {
        gte: subDays(new Date(), 10),
      },
    },
    _sum: {
      steps: true,
    },
  });

  const rows = await prisma.health.findMany({
    select: { id: true, steps: true, activity: true, createdAt: true },
    where: {
      deviceId: imei,
      createdAt: {
        gte: subDays(new Date(), 1),
      },
    },
  });

  const tzName = getTZ(tz);

  const dailyMax = await prisma.$queryRawUnsafe(`
    SELECT DISTINCT ON (date_local)
        id,
        steps,
        activity,
        "createdAt",
        date_local
    FROM (
      SELECT
        id,
        steps,
        activity,
        "createdAt",                                  
        ("createdAt" AT TIME ZONE '${tzName}')  AS local_ts,   
        ("createdAt" AT TIME ZONE '${tzName}')::date AS date_local
      FROM "health"
      WHERE "deviceId" = $1
        -- compare in local time to get the last 7 local days window
        AND ("createdAt" AT TIME ZONE '${tzName}') >= (NOW() AT TIME ZONE '${tzName}') - INTERVAL '7 days'
    ) t
    ORDER BY
        date_local,     
        steps DESC,    
        local_ts DESC;
  `, imei);

  return {
    last24h: last24h._sum.steps ?? 0,
    dailyMax,
    rows,
  };
};

export { get, getByIMEI, getByIMEI2 };
