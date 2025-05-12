// Uvoz modula za rad sa MySQL
import mysql from "mysql";

// Kreiranje konekcije ka bazi
const connection = mysql.createConnection({
  host: "sv95.ifastnet.com",
  user: "pikadone_tracking",
  password: "Tracking2025",
  database: "pikadone_track",
});

export const insertInDB = (data: any) => {
  connection.connect((err) => {
    if (err) {
      console.error("Greška pri konekciji:", err);
      return;
    }
    console.log("Konekcija sa bazom uspješna.");

    const device_id = "0861261021070616";
    const latitude = data.latitude;
    const longitude = data.longitude;
    const battery = 85;
    const time = new Date();

    const sql =
      "INSERT INTO transport (device_id, time, longi, lati, battery) VALUES (?, ?, ?, ?, ?)";
    const values = [device_id, time, longitude, latitude, battery];

    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error("Greška pri upisu u bazu:", err);
      } else {
        console.log("Uspješno upisano, ID:", result.insertId);
      }

      connection.end();
    });
  });
};
