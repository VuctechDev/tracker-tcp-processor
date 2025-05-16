import mySql from "mysql";
import { GpsPacket } from "./decoders/gps";

const pool = mySql.createPool({
  host: "sv95.ifastnet.com",
  user: "pikadone_tracking",
  password: "Tracking2025",
  database: "pikadone_track",
  port: 3306,
});

export const query = <T>(
  query: string,
  values?: (string | number)[][]
): Promise<T> => {
  const start = new Date().getTime();
  return new Promise((resolve, reject) => {
    pool.getConnection((err, connection) => {
      if (err) {
        return reject(err);
      }
      connection.query(query, [values], (err, res) => {
        connection.release();
        if (err) {
          console.log("ERROR QUERY: ", query);
          return reject(err);
        }
        console.log("SUCCESS QUERY: ", query);
        console.log(`QUERY TOOK: ${(new Date().getTime() - start) / 1000}s`);
        return resolve(res);
      });
    });
  });
};

export const insertInDB = (data: GpsPacket) => {
  const device_id = data.deviceId;
  const latitude = data.latitude?.toFixed(6);
  const longitude = data.longitude?.toFixed(6);
  const battery = data.speed;
  const time = data?.dateTimeUTC ? new Date(data?.dateTimeUTC) : new Date();
  const formattedTime = time.toISOString().slice(0, 19).replace("T", " ");

  query<{ insertId: number }>(
    `INSERT INTO transport (device_id, time, longi, lati, battery) VALUES ?`,
    [[device_id, formattedTime, longitude, latitude, battery]]
  );
};
