import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import songsRouter from "./routes/songs.js";
import { router as searchRouter } from "./routes/search.js";
import myMusicRoutes from "./routes/myMusic.js";
import multer from "multer";
import axios from "axios"; // Importa axios para llamadas a APIs externas (como YouTube)

dotenv.config();

const app = express();

// 1. Configuración de CORS actualizada (¡incluye tu URL real de Vercel!)
const corsOptions = {
    origin: [
        'http://localhost:5173',
        'https://reproductor-three.vercel.app', // Reemplaza con tu URL real de frontend
        'https://reproductornicolas.onrender.com'
    ],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE'] // Métodos permitidos
};
app.use(cors(corsOptions));

// 2. Servir archivos estáticos con CORS
app.use("/uploads", express.static("uploads", {
    setHeaders: (res) => {
        res.header("Access-Control-Allow-Origin", "*");
        res.header("Cache-Control", "public, max-age=31536000");
    }
}));

// 3. Middleware para subida de archivos (multer)
const upload = multer({ dest: 'uploads/' });
app.use("/api/mymusic", myMusicRoutes); // Multer actúa aquí

// 4. Middleware para JSON (después de multer)
app.use(express.json());

// 5. Nueva ruta para buscar en YouTube (protegida en el backend)
app.get("/api/youtube-search", async (req, res) => {
    const { q } = req.query;
    try {
        // 1. Primera llamada: Búsqueda básica (maxResults=5)
        const searchResponse = await axios.get("https://www.googleapis.com/youtube/v3/search", {
            params: {
                part: "snippet",
                q,
                key: process.env.YT_API_KEY,
                type: "video",
                maxResults: 6 // ✅ Límite de 5 resultados aquí
            }
        });

        // 2. Obtener IDs de los videos encontrados
        const videoIds = searchResponse.data.items.map(item => item.id.videoId).join(',');

        // 3. Segunda llamada: Detalles de los 5 videos (maxResults implícito en los IDs)
        const detailsResponse = await axios.get("https://www.googleapis.com/youtube/v3/videos", {
            params: {
                part: "contentDetails,statistics",
                id: videoIds,
                key: process.env.YT_API_KEY
                // No necesita maxResults aquí porque ya está limitado por los IDs
            }
        });

        // Combinar resultados
        const combinedResults = searchResponse.data.items.map(item => {
            const details = detailsResponse.data.items.find(v => v.id === item.id.videoId) || {};
            return {
                ...item,
                contentDetails: details.contentDetails,
                statistics: details.statistics
            };
        });

        res.json({ items: combinedResults.slice(0, 6) }); // ✅ Aseguramos 5 resultados
    } catch (error) {
        console.error("Error en YouTube API:", error.message);
        res.status(500).json({ error: "Error al buscar en YouTube" });
    }
});

// 6. Rutas existentes
app.post('/api/upload', upload.single('audio'), (req, res) => {
    res.json({ path: req.file.path });
});
app.use("/api/songs", songsRouter);
app.use("/api/search", searchRouter);

// Ruta de prueba
app.get("/", (req, res) => {
    res.send("¡Backend funcionando!");
});

// Iniciar servidor
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
    console.log(`Servidor en http://localhost:${PORT}`);
});