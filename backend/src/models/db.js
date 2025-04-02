import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
    host: process.env.MYSQLHOST,       // ✅ Usa env directamente
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    ssl: {
        rejectUnauthorized: true,
        ca: process.env.MYSQL_SSL_CA
    }
});