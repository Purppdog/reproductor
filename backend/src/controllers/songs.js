import { pool } from "../models/db.js";

export const getSongs = async (req, res) => {
    try {
        const [rows] = await pool.query(`
            SELECT 
                id, 
                title, 
                artist, 
                cloudinary_url as url, 
                duration, 
                cloudinary_public_id as public_id 
            FROM songs
        `);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener canciones" });
    }
};

export const addSong = async (req, res) => {
    const { title, artist, public_id, url, duration } = req.body;
    try {
        await pool.query(
            "INSERT INTO songs (title, artist, cloudinary_public_id, cloudinary_url, duration, source_type) VALUES (?, ?, ?, ?, ?, 'cloudinary')",
            [title, artist, public_id, url, duration]
        );
        res.status(201).json({ message: "Canción agregada a Cloudinary" });
    } catch (error) {
        res.status(500).json({ error: "Error al agregar canción" });
    }
};