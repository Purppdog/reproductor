import { pool } from "../models/db.js";

export const getSavedSongs = async (req, res) => {
    try {
        console.log("Obteniendo canciones...");
        const [rows] = await pool.query(`
            SELECT 
                id,
                title, 
                artist, 
                cloudinary_public_id, 
                cloudinary_url, 
                duration,
                source_type,
                uploaded_at
            FROM songs
            ORDER BY uploaded_at DESC
        `);

        console.log(`Encontradas ${rows.length} canciones`);
        res.json(rows);
    } catch (error) {
        console.error("Error en getSavedSongs:", {
            message: error.message,
            code: error.code,
            stack: error.stack,
            sqlMessage: error.sqlMessage
        });

        res.status(500).json({
            success: false,
            error: "Error al obtener canciones",
            details: {
                code: error.code,
                sqlMessage: error.sqlMessage
            }
        });
    }
};

export const addSavedSong = async (req, res) => {
    try {
        const {
            title,
            artist,
            cloudinary_public_id,
            cloudinary_url,
            duration
        } = req.body;

        console.log("Datos recibidos para nueva canción:", req.body);

        // Validaciones básicas
        if (!cloudinary_public_id || !cloudinary_url) {
            return res.status(400).json({
                success: false,
                error: "Faltan datos esenciales de Cloudinary"
            });
        }

        const [result] = await pool.query(
            `INSERT INTO songs 
            (title, artist, cloudinary_public_id, cloudinary_url, duration, source_type) 
            VALUES (?, ?, ?, ?, ?, 'cloudinary')`,
            [
                title || 'Sin título',
                artist || 'Artista desconocido',
                cloudinary_public_id,
                cloudinary_url,
                duration || 0
            ]
        );

        // Obtener la canción recién creada para devolverla
        const [newSong] = await pool.query(
            `SELECT * FROM songs WHERE id = ?`,
            [result.insertId]
        );

        console.log("Canción agregada con éxito:", newSong[0]);

        res.status(201).json({
            success: true,
            song: newSong[0]
        });
    } catch (error) {
        console.error("Error en addSavedSong:", {
            message: error.message,
            code: error.code,
            stack: error.stack,
            sqlMessage: error.sqlMessage
        });

        res.status(500).json({
            success: false,
            error: "Error al guardar canción",
            details: {
                code: error.code,
                sqlMessage: error.sqlMessage
            }
        });
    }
};

export const deleteSavedSong = async (req, res) => {
    try {
        const { id } = req.params;
        console.log(`Eliminando canción con ID: ${id}`);

        const [song] = await pool.query(
            "SELECT cloudinary_public_id FROM songs WHERE id = ?",
            [id]
        );

        if (song.length === 0) {
            return res.status(404).json({
                success: false,
                error: "Canción no encontrada"
            });
        }

        const public_id = song[0].cloudinary_public_id;

        await cloudinary.uploader.destroy(public_id, {
            resource_type: 'video' //
        });

        const [result] = await pool.query(
            "DELETE FROM songs WHERE id = ?",
            [id]
        );

        res.json({
            success: true,
            message: "Canción eliminada correctamente de la base de datos y Cloudinary"
        });
    } catch (error) {
        console.error("Error en deleteSavedSong:", {
            message: error.message,
            stack: error.stack
        });

        res.status(500).json({
            success: false,
            error: "Error al eliminar canción",
            details: error.message
        });
    }
};