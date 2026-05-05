import { pool } from "../models/db.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const getSavedSongs = async (req, res) => {
    try {
        const result = await pool.query(`
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
        res.json(result.rows);
    } catch (error) {
        console.error("Error en getSavedSongs:", error.message);
        res.status(500).json({
            success: false,
            error: "Error al obtener canciones"
        });
    }
};

export const addSavedSong = async (req, res) => {
    try {
        const { title, artist, cloudinary_public_id, cloudinary_url, duration } = req.body;

        if (!cloudinary_public_id || !cloudinary_url) {
            return res.status(400).json({
                success: false,
                error: "Faltan datos esenciales de Cloudinary"
            });
        }

        const result = await pool.query(
            `INSERT INTO songs 
            (title, artist, cloudinary_public_id, cloudinary_url, duration, source_type) 
            VALUES ($1, $2, $3, $4, $5, 'cloudinary')
            RETURNING *`,
            [
                title || 'Sin título',
                artist || 'Artista desconocido',
                cloudinary_public_id,
                cloudinary_url,
                duration || 0
            ]
        );

        res.status(201).json({
            success: true,
            song: result.rows[0]
        });
    } catch (error) {
        console.error("Error en addSavedSong:", error.message);
        res.status(500).json({
            success: false,
            error: "Error al guardar canción"
        });
    }
};

export const deleteSavedSong = async (req, res) => {
    const { id } = req.params;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');

        // 1. Obtener la canción
        const songResult = await client.query(
            `SELECT cloudinary_public_id FROM songs WHERE id = $1`,
            [id]
        );

        if (songResult.rows.length === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: "Canción no encontrada"
            });
        }

        const publicId = songResult.rows[0].cloudinary_public_id;

        // 2. Eliminar de Cloudinary
        if (publicId) {
            const cloudinaryResponse = await cloudinary.uploader.destroy(publicId, {
                resource_type: "video",
                invalidate: true
            });

            if (cloudinaryResponse.result !== 'ok') {
                throw new Error(`Cloudinary respondió: ${cloudinaryResponse.result}`);
            }
        }

        // 3. Eliminar de la BD
        const deleteResult = await client.query(
            `DELETE FROM songs WHERE id = $1`,
            [id]
        );

        if (deleteResult.rowCount === 0) {
            await client.query('ROLLBACK');
            return res.status(404).json({
                success: false,
                error: "No se pudo eliminar la canción"
            });
        }

        await client.query('COMMIT');

        res.json({
            success: true,
            message: "Canción eliminada correctamente"
        });

    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Error en deleteSavedSong:", error.message);
        res.status(500).json({
            success: false,
            error: "Error al eliminar canción",
            details: error.message
        });
    } finally {
        client.release();
    }
};