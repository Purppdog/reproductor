/* eslint-disable no-undef */
import express from "express";
import { v2 as cloudinary } from 'cloudinary';
import multer from "multer";
import { getSavedSongs, addSavedSong, deleteSavedSong } from "../controllers/myMusic.js";
import { verifyToken } from "../middleware/auth.js";
import dotenv from "dotenv";

dotenv.config();

const router = express.Router();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    limits: { fileSize: 80 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/aac'];
        if (validTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Tipo de archivo no soportado'), false);
        }
    }
});

//GET — solo usuarios logueados ven sus canciones
router.get("/", verifyToken, getSavedSongs);

// POST — solo usuarios logueados pueden subir
router.post("/", verifyToken, upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                error: "No se proporcionó un archivo de audio válido"
            });
        }

        const fileStr = `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`;

        const cloudinaryResult = await cloudinary.uploader.upload(fileStr, {
            resource_type: "video",
            folder: "audio",
            allowed_formats: ["mp3", "wav", "ogg", "m4a", "aac"],
            use_filename: true,
            unique_filename: false
        });

        const songData = {
            title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
            artist: req.body.artist || "Artista desconocido",
            cloudinary_public_id: cloudinaryResult.public_id,
            cloudinary_url: cloudinaryResult.secure_url,
            duration: Math.floor(cloudinaryResult.duration) || 0,
            user_id: req.user.id  // ⬅️ asociar canción al usuario logueado
        };

        await addSavedSong({ body: songData }, res);

    } catch (error) {
        console.error("Error en la subida:", error);
        res.status(500).json({
            success: false,
            error: error.message || "Error al procesar el archivo de audio"
        });
    }
});

// DELETE — solo usuarios logueados pueden eliminar
router.delete("/:id", verifyToken, deleteSavedSong);

export default router;