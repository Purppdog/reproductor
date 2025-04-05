import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';
import fs from 'fs';

dotenv.config();

const sslConfig = process.env.NODE_ENV === 'production' ? {
    ssl: {
        rejectUnauthorized: true,
        ca: process.env.SSL_CERT ? fs.readFileSync(process.env.SSL_CERT) : null
    }
} : {};

const pool = createPool({
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    ...sslConfig, // 👈 Aplica SSL solo en producción
    waitForConnections: true,
    connectionLimit: 10
});

export default pool;