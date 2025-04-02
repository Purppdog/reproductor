import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs"; // Importar módulo para manejar archivos
import { getSavedSongs, addSavedSong, deleteSavedSong } from "../controllers/myMusic.js";

const router = express.Router();

// Crear la carpeta "uploads" si no existe
const uploadDir = "uploads";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir);
}

// Configuración de Multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname));
    },
});

const upload = multer({ storage });

// Rutas
router.get("/", getSavedSongs);
router.post("/", upload.single("file"), addSavedSong);
router.delete("/:id", deleteSavedSong);

export default router;
