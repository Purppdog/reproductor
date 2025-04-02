import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import songsRouter from "./routes/songs.js";
import { router as searchRouter } from "./routes/search.js";
import myMusicRoutes from "./routes/myMusic.js";
//import { pool } from "./models/db.js"; 
import multer from "multer"; // Importa multer si lo usas

// Configuración de multer (si es necesario)
const upload = multer({ dest: 'uploads/' });

dotenv.config();

const app = express();

// Configurar CORS
const corsOptions = {
    origin: [
        'http://localhost:5173', // Desarrollo
        'https://tu-frontend.vercel.app', // Producción
        'https://tu-backend.onrender.com' // Permite acceso directo a los MP3
    ],
    credentials: true
};
app.use(cors(corsOptions));

// Servir archivos MP3 con CORS y caché (una sola vez)
app.use("/uploads", express.static("uploads", {
    setHeaders: (res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Access-Control-Expose-Headers", "Content-Length");
        res.header("Cache-Control", "public, max-age=31536000");
    }
}));

// 🚀 Importante: NO usar express.json() antes de multer en rutas de subida de archivos
app.use("/api/mymusic", myMusicRoutes); // Multer actúa antes aquí

// JSON solo en rutas que no usan archivos
app.use(express.json());

// Ruta para subir archivos (si aplica)
app.post('/api/upload', upload.single('audio'), (req, res) => {
    res.json({ path: req.file.path });
});

// Rutas de la API (aquí se manejará /api/songs a través del router)
app.use("/api/songs", songsRouter);
app.use("/api/search", searchRouter);

app.get("/", (req, res) => {
    res.send("¡Backend funcionando!");
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});