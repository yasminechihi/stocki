const mysql = require("mysql2");

const conn = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "stocki"
});

conn.connect(error => {
  if (error) throw error;
  console.log("Connecté à MySQL (EasyPHP)");
});

module.exports = conn;
