import { pool } from "../models/db.js";

export const getSavedSongs = async (req, res) => {
    try {
        console.log("Conectando a la base de datos..."); // ← Verás esto en los logs de Render
        const [rows] = await pool.query("SELECT id, title, artist FROM songs");
        console.log("Resultados de la consulta:", rows); // ← Verás esto si la consulta funciona
        res.json(rows || []); // Devuelve array vacío si no hay datos
    } catch (error) {
        console.error("Error en /api/mymusic:", error); // ← Esto aparecerá en los logs
        res.status(500).json({ error: "Error al obtener canciones" });
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