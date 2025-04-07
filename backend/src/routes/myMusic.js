import express from "express";
import { v2 as cloudinary } from 'cloudinary';
import multer from "multer";
import { getSavedSongs, addSavedSong, deleteSavedSong } from "../controllers/myMusic.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

// Configura Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

// Configuración de Multer para almacenamiento en memoria
const storage = multer.memoryStorage();
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

// Ruta POST modificada para subida directa a Cloudinary
router.post("/", upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No se proporcionó un archivo de audio válido"
            });
        }

        // Convertir el buffer a base64 para Cloudinary
        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        // Subir a Cloudinary
        const cloudinaryResult = await cloudinary.uploader.upload(fileStr, {
            resource_type: "video", // Cloudinary trata audio como video
            folder: "audio",
            allowed_formats: ["mp3", "wav", "ogg", "m4a", "aac"]
        });

        // Datos para guardar en DB
        const songData = {
            title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
            artist: req.body.artist || "Artista desconocido",
            cloudinary_public_id: cloudinaryResult.public_id,
            cloudinary_url: cloudinaryResult.secure_url,
            duration: Math.floor(cloudinaryResult.duration) || 0
        };

        // Llama al controlador para guardar en DB
        await addSavedSong({ body: songData }, res);

    } catch (error) {
        console.error("Error en la subida:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Error al procesar el archivo de audio"
        });
    }
});

// Otras rutas sin cambios
router.get("/", getSavedSongs);
router.delete("/:id", deleteSavedSong);

export default router;