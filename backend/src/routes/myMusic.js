import express from "express";
import { getSavedSongs, addSavedSong, deleteSavedSong } from "../controllers/myMusic.js";
import { v2 as cloudinary } from 'cloudinary';
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Configuración de Cloudinary (usando folder 'audio/')
const uploadToCloudinary = (fileBuffer) => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
            {
                resource_type: 'auto',
                folder: 'audio',
                allowed_formats: ['mp3', 'wav', 'ogg', 'm4a'],
                format: 'mp3' // Opcional: forzar formato
            },
            (error, result) => {
                if (error) return reject(error);
                resolve(result);
            }
        ).end(fileBuffer);
    });
};

// Ruta POST modificada para Cloudinary
router.post("/", async (req, res) => {
    try {
        if (!req.body.audio) {
            return res.status(400).json({ error: "No se proporcionó audio" });
        }

        const result = await uploadToCloudinary(Buffer.from(req.body.audio, 'base64'));

        // Datos para guardar en DB
        const songData = {
            title: req.body.title,
            artist: req.body.artist,
            public_id: result.public_id,
            url: result.secure_url,
            duration: Math.floor(result.duration)
        };

        // Llama al controlador
        await addSavedSong(songData, res);
    } catch (error) {
        console.error("Error en upload:", error);
        res.status(500).json({ error: "Error al subir a Cloudinary" });
    }
});

// Otras rutas sin cambios
router.get("/", getSavedSongs);
router.delete("/:id", deleteSavedSong);

export default router;