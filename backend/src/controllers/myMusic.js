import { pool } from "../models/db.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from 'dotenv';

// Configurar environment variables
dotenv.config();

// Configurar Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
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
    const { id } = req.params;

    // Validación básica del ID
    if (!id || isNaN(id)) {
        return res.status(400).json({
            success: false,
            error: "ID de canción no válido"
        });
    }

    const connection = await pool.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Obtener información de la canción
        const [song] = await connection.query(
            `SELECT cloudinary_public_id, user_id FROM songs WHERE id = ?`,
            [id]
        );

        if (!song.length) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: "Canción no encontrada"
            });
        }

        const publicId = song[0].cloudinary_public_id;

        // 2. Eliminar de Cloudinary (solo si tiene public_id)
        if (publicId) {
            console.log(`Eliminando de Cloudinary: ${publicId}`);
            const cloudinaryResult = await cloudinary.uploader.destroy(publicId, {
                resource_type: "video",
                invalidate: true
            });

            if (cloudinaryResult.result !== 'ok') {
                throw new Error(`Cloudinary respondió: ${cloudinaryResult.result}`);
            }
        }

        // 3. Eliminar de la base de datos
        const [dbResult] = await connection.query(
            `DELETE FROM songs WHERE id = ?`,
            [id]
        );

        if (dbResult.affectedRows === 0) {
            await connection.rollback();
            return res.status(404).json({
                success: false,
                error: "No se pudo eliminar la canción"
            });
        }

        await connection.commit();

        res.json({
            success: true,
            message: "Canción eliminada correctamente",
            cloudinaryResult: publicId ? cloudinaryResult : null
        });

    } catch (error) {
        await connection.rollback();
        console.error("Error en deleteSavedSong:", {
            message: error.message,
            stack: error.stack,
            ...(error.response && { cloudinaryError: error.response.body })
        });

        res.status(500).json({
            success: false,
            error: "Error al eliminar canción",
            details: error.message
        });
    } finally {
        connection.release();
    }
};