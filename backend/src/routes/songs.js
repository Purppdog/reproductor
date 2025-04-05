import { Router } from "express";
import { getSongs, addSong } from "../controllers/songs.js";

const router = Router();

router.get("/", getSongs);

// Ruta POST para añadir desde frontend (si es necesario)
router.post("/", async (req, res) => {
    try {
        const { title, artist, public_id, url, duration } = req.body;
        if (!public_id || !url) {
            return res.status(400).json({ error: "Faltan datos de Cloudinary" });
        }
        await addSong({ title, artist, public_id, url, duration }, res);
    } catch (error) {
        res.status(500).json({ error: "Error al procesar la solicitud" });
    }
});

export default router;