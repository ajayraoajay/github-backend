const mysql = require("mysql2");
const dotenv = require("dotenv");

// Explicitly specify the path to the `.env` file
dotenv.config({ path: "./.env" });

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

db.connect((err) => {
    if (err) {
        console.error("Error connecting to the database:");
        console.error("Host:", process.env.DB_HOST);
        console.error("User:", process.env.DB_USER);
        console.error("Database:", process.env.DB_NAME);
        console.error(err.sqlMessage);
        process.exit(1);
    }
    console.log("Connected to the MySQL database!");
});

module.exports = db;

