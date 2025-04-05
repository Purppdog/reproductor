// src/models/db.js
import { createPool } from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración del pool
export const pool = createPool({  // <-- Exportación nombrada
    host: process.env.MYSQLHOST,
    user: process.env.MYSQLUSER,
    password: process.env.MYSQLPASSWORD,
    database: process.env.MYSQLDATABASE,
    port: process.env.MYSQLPORT,
    ssl: { rejectUnauthorized: true },
    waitForConnections: true,
    connectionLimit: 10
});

// Elimina "export default"