import mySql from "mysql";

const pool = mySql.createPool({
  host: "sv95.ifastnet.com",
  user: "pikadone_tracking",
  password: "Tracking2025",
  database: "pikadone_track",
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

export const insertInDB = (data: any) => {
  const device_id = "0861261021070616";
  const latitude = data.latitude;
  const longitude = data.longitude;
  const battery = data.speed;
  const time = new Date();
  query(
    `INSERT INTO transport (device_id, time, longi, lati, battery) VALUES (${device_id}, ${time}, ${longitude}, ${latitude}, ${battery})`
  );
};

// export const insertInDB = (data: any) => {
//   connection.connect((err) => {
//     if (err) {
//       console.error("Greška pri konekciji:", err);
//       return;
//     }
//     console.log("Konekcija sa bazom uspješna.");

//     const device_id = "0861261021070616";
//     const latitude = data.latitude;
//     const longitude = data.longitude;
//     const battery = 86;
//     const time = new Date();

//     const sql =
//       "INSERT INTO transport (device_id, time, longi, lati, battery) VALUES (?, ?, ?, ?, ?)";
//     const values = [device_id, time, longitude, latitude, battery];

//     connection.query(sql, values, (err, result) => {
//       if (err) {
//         console.error("Greška pri upisu u bazu:", err);
//       } else {
//         console.log("Uspješno upisano, ID:", result.insertId);
//       }

//       connection.end();
//     });
//   });
// };
