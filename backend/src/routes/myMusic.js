import express from "express";
import { getSavedSongs, addSavedSong, deleteSavedSong } from "../controllers/myMusic.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";
import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";

dotenv.config();

// Configura Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const router = express.Router();

// Configuración de Multer para Cloudinary
const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "audio",
        resource_type: "video", // Cloudinary trata audio como video
        allowed_formats: ["mp3", "wav", "ogg", "m4a", "aac"],
        format: async (req, file) => {
            // Mantener la extensión original
            const ext = file.originalname.split('.').pop();
            return ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(ext) ? ext : 'mp3';
        }
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 15 * 1024 * 1024 }, // 15MB
    fileFilter: (req, file, cb) => {
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/aac'];
        if (validTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no soportado'), false);
        }
    }
});

// Ruta POST modificada para manejar uploads directos
router.post("/", upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No se proporcionó un archivo de audio válido"
            });
        }

        // Datos del archivo subido a Cloudinary
        const cloudinaryResult = req.file;

        // Datos para guardar en DB
        const songData = {
            title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
            artist: req.body.artist || "Artista desconocido",
            cloudinary_public_id: cloudinaryResult.public_id,
            cloudinary_url: cloudinaryResult.secure_url,
            duration: Math.floor(req.body.duration) || 0
        };

        console.log("Datos preparados para DB:", songData);

        // Llama al controlador
        const [result] = await pool.query(
            `INSERT INTO songs 
      (title, artist, cloudinary_public_id, cloudinary_url, duration, source_type) 
      VALUES (?, ?, ?, ?, ?, 'cloudinary')`,
            [
                songData.title,
                songData.artist,
                songData.cloudinary_public_id,
                songData.cloudinary_url,
                songData.duration
            ]
        );

        // Obtener la canción recién creada
        const [newSong] = await pool.query(
            `SELECT * FROM songs WHERE id = ?`,
            [result.insertId]
        );

        res.status(201).json({
            success: true,
            song: {
                id: newSong[0].id.toString(),
                title: newSong[0].title,
                artist: newSong[0].artist,
                url: newSong[0].cloudinary_url,
                thumbnail: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${newSong[0].cloudinary_public_id}.jpg`,
                duration: newSong[0].duration || 0,
                public_id: newSong[0].cloudinary_public_id,
                source: 'cloudinary'
            }
        });

    } catch (error) {
        console.error("Error en la subida:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Error al procesar el archivo de audio",
            details: process.env.NODE_ENV === 'development' ? error.stack : undefined
        });
    }
});

// Ruta GET para obtener canciones
router.get("/", async (req, res) => {
    try {
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

        const songs = rows.map(song => ({
            id: song.id.toString(),
            title: song.title || "Sin título",
            artist: song.artist || "Artista desconocido",
            url: song.cloudinary_url,
            thumbnail: `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${song.cloudinary_public_id}.jpg`,
            duration: song.duration || 0,
            public_id: song.cloudinary_public_id,
            source: song.source_type || 'cloudinary'
        }));

        res.json({ success: true, songs });
    } catch (error) {
        console.error("Error al obtener canciones:", error);
        res.status(500).json({
            success: false,
            error: "Error al obtener canciones",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

// Ruta DELETE para eliminar canciones
router.delete("/:id", async (req, res) => {
    try {
        const { id } = req.params;

        // Primero obtenemos la canción para eliminar de Cloudinary
        const [song] = await pool.query(
            "SELECT cloudinary_public_id FROM songs WHERE id = ?",
            [id]
        );

        if (!song.length) {
            return res.status(404).json({
                success: false,
                error: "Canción no encontrada"
            });
        }

        // Eliminar de Cloudinary
        await cloudinary.uploader.destroy(song[0].cloudinary_public_id, {
            resource_type: 'video'
        });

        // Eliminar de la base de datos
        await pool.query("DELETE FROM songs WHERE id = ?", [id]);

        res.json({
            success: true,
            message: "Canción eliminada correctamente"
        });
    } catch (error) {
        console.error("Error al eliminar:", error);
        res.status(500).json({
            success: false,
            error: "Error al eliminar canción",
            details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
    }
});

export default router;