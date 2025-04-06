import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import songsRouter from "./routes/songs.js";
import { router as searchRouter } from "./routes/search.js";
import myMusicRoutes from "./routes/myMusic.js";
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
    'https://reproductor-ivory.vercel.app',
    'https://reproductornicolas.onrender.com'
];

const corsOptions = {
    origin: function (origin, callback) {
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

// Aumentar límite de payload a 15MB
app.use(express.json({ limit: '15mb' }));
app.use(express.urlencoded({ limit: '15mb', extended: true }));
app.use(cors(corsOptions));

// 4. Búsqueda en YouTube (sin cambios)
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

// 5. Rutas adicionales
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