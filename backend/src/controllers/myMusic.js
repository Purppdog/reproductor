import { pool } from "../models/db.js";

export const getSavedSongs = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT id, title, artist, cloudinary_url as url, duration, cloudinary_public_id as public_id FROM songs");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las canciones" });
    }
};

export const addSavedSong = async (songData, res) => {
    try {
        await pool.query(
            "INSERT INTO songs (...) VALUES (?, ?, ?, ?, ?, 'cloudinary')",
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