import { Router } from "express";
import { getSongs, addSong } from "../controllers/songs.js";

const router = Router();

router.get("/", getSongs);
router.post("/", addSong);

export default router;
