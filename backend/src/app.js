import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import songsRouter from "./routes/songs.js";
import { router as searchRouter } from "./routes/search.js";
import myMusicRoutes from "./routes/myMusic.js";
import multer from "multer";
import axios from "axios";
import { v2 as cloudinary } from 'cloudinary';

dotenv.config();

// Configuración de Cloudinary
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

const app = express();

// 1. Configuración CORS mejorada
const allowedOrigins = [
    'http://localhost:5173',
    'https://reproductor-lake.vercel.app',
    'https://reproductornicolas.onrender.com'
];

const corsOptions = {
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen (como Postman)
        if (!origin) return callback(null, true);

        if (allowedOrigins.includes(origin)) {
            return callback(null, true);
        } else {
            return callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    optionsSuccessStatus: 200
};

// Aplicar CORS solo una vez (elimina los middlewares adicionales)
app.use(cors(corsOptions));

// 2. Middleware para subida de archivos (multer)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 50 * 1024 * 1024, // 50MB
    },
    fileFilter: (req, file, cb) => {
        const audioMimeTypes = [
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'audio/x-m4a', 'audio/webm', 'audio/x-flac',
            'audio/x-aiff', 'audio/x-wav'
        ];
        audioMimeTypes.includes(file.mimetype)
            ? cb(null, true)
            : cb(new Error('Solo se permiten archivos de audio (MP3, WAV, OGG, etc.)'), false);
    }
});

// 3. Middleware para JSON
app.use(express.json());

// 4. Ruta de subida a Cloudinary
app.post('/api/upload', upload.single('audio'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No se proporcionó ningún archivo" });
        }

        const allowedMimeTypes = [
            'audio/mpeg', 'audio/wav', 'audio/ogg',
            'audio/x-m4a', 'audio/webm', 'audio/x-flac',
            'audio/x-aiff', 'audio/x-wav'
        ];

        if (!allowedMimeTypes.includes(req.file.mimetype)) {
            return res.status(400).json({
                error: "Formato de audio no soportado",
                formats_soportados: allowedMimeTypes
            });
        }

        const fileExt = req.file.originalname.split('.').pop().toLowerCase();
        const result = await cloudinary.uploader.upload(
            `data:${req.file.mimetype};base64,${req.file.buffer.toString('base64')}`,
            {
                resource_type: 'auto',
                format: fileExt,
                allowed_formats: ['mp3', 'wav', 'ogg', 'm4a', 'aac', 'webm', 'flac', 'aiff'],
                use_filename: true,
                unique_filename: false
            }
        );

        res.json({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            duration: result.duration,
            format: result.format,
            original_name: req.file.originalname
        });
    } catch (error) {
        console.error("Error al subir el archivo:", error);
        res.status(500).json({
            error: "Error al subir el archivo a Cloudinary",
            details: error.message
        });
    }
});

// 5. Búsqueda en YouTube
app.get("/api/youtube-search", async (req, res) => {
    const { q } = req.query;
    try {
        const searchResponse = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                q,
                key: process.env.YT_API_KEY,
                type: "video",
                maxResults: 6
            }
        });

        const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');
        const detailsResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
            params: {
                part: "contentDetails,statistics",
                id: videoIds,
                key: process.env.YT_API_KEY
            }
        });

        const combinedResults = searchResponse.data.items.map(item => {
            const details = detailsResponse.data.items.find(v => v.id === item.id.videoId) || {};
            return {
                ...item,
                contentDetails: details.contentDetails,
                statistics: details.statistics
            };
        });

        res.json({ items: combinedResults.slice(0, 6) });
    } catch (error) {
        console.error("Error en YouTube API:", error.message);
        res.status(500).json({ error: "Error al buscar en YouTube" });
    }
});

// 6. Rutas adicionales
app.use("/api/songs", songsRouter);
app.use("/api/search", searchRouter);
app.use("/api/mymusic", myMusicRoutes);

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("¡Backend funcionando!");
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});