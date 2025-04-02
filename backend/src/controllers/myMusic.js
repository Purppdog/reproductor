import { pool } from "../models/db.js";

export const getSavedSongs = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM songs");
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener las canciones" });
    }
};

export const addSavedSong = async (req, res) => {
    console.log("Archivo recibido:", req.file); // 👀 Esto nos dirá si Multer recibe el archivo

    if (!req.file) {
        return res.status(400).json({ error: "No se ha subido ningún archivo" });
    }

    const { title, artist } = req.body;
    const file_path = req.file.filename;

    try {
        const uploaded_at = new Date();
        await pool.query(
            "INSERT INTO songs (title, artist, file_path, uploaded_at, source_type) VALUES (?, ?, ?, ?, 'local')",
            [title, artist, file_path, uploaded_at]
        );
        res.status(201).json({ message: "Canción guardada correctamente" });
    } catch (error) {
        console.error("Error al guardar la canción:", error);
        res.status(500).json({ error: "Error al guardar la canción" });
    }
};

export const deleteSavedSong = async (req, res) => {
    const { id } = req.params;
    try {
        await pool.query("DELETE FROM songs WHERE id = ?", [id]);
        res.json({ message: "Canción eliminada" });
    } catch (error) {
        res.status(500).json({ error: "Error al eliminar la canción" });
    }
};
