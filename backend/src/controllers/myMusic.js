import { pool } from "../models/db.js";

export const getSavedSongs = async (req, res) => {
    try {
        console.log("Conectando a la base de datos...");
        const [rows] = await pool.query("SELECT id, title, artist FROM songs");
        console.log("Resultados de la consulta:", rows);
        res.json(rows || []);
    } catch (error) {
        console.error("Error en /api/mymusic:", {
            message: error.message,
            code: error.code,
            stack: error.stack,
            envVariables: { // Agrega esto para debug
                host: process.env.MYSQLHOST,
                port: process.env.MYSQLPORT,
                user: process.env.MYSQLUSER,
                database: process.env.MYSQLDATABASE,
                ssl: process.env.SSL_CERT ? "Configurado" : "Falta SSL"
            }
        });
        res.status(500).json({
            error: "Error al obtener canciones",
            details: error.code // Devuelve el código de error específico
        });
    }
};

export const addSavedSong = async (songData, res) => {
    try {
        await pool.query(
            "INSERT INTO songs (title, artist, cloudinary_public_id, cloudinary_url, duration, source_type) VALUES (?, ?, ?, ?, ?, 'cloudinary')",
            [songData.title, songData.artist, songData.public_id, songData.url, songData.duration]
        );
        res.status(201).json({ message: "Canción guardada en Cloudinary" });
    } catch (error) {
        console.error("Error al guardar:", error);
        res.status(500).json({ error: "Error al guardar en DB" });
    }
};
export const deleteSavedSong = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM songs WHERE id = ?", [id]);
        res.json({ message: "Canción eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar" });
    }
};