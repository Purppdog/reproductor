import { pool } from "../models/db.js";

export const getSongs = async (req, res) => {
    try {
        const [rows] = await pool.query("SELECT * FROM songs");
        console.log("Canciones obtenidas de la BD:", rows);
        res.json(rows);
    } catch (error) {
        res.status(500).json({ error: "Error al obtener canciones" });
    }
};

export const addSong = async (req, res) => {
    const { title, artist, url, duration, thumbnail } = req.body;
    try {
        await pool.query(
            "INSERT INTO songs (title, artist, url, duration, thumbnail) VALUES (?, ?, ?, ?, ?)",
            [title, artist, url, duration, thumbnail]
        );
        res.status(201).json({ message: "Canción agregada" });
    } catch (error) {
        res.status(500).json({ error: "Error al agregar canción" });
    }
};