import axios from "axios";
import { Router } from "express";

const router = Router();

router.get("/", async (req, res) => {
    const { q } = req.query;
    try {
        const searchResponse = await axios.get(
            `https://www.googleapis.com/youtube/v3/search`,
            {
                params: {
                    part: "snippet",
                    q: q,
                    type: "video",
                    key: process.env.YT_API_KEY,
                    maxResults: 5
                }
            }
        );

        const videoIds = searchResponse.data.items.map((item) => item.id.videoId).join(",");

        const videosResponse = await axios.get(
            `https://www.googleapis.com/youtube/v3/videos`,
            {
                params: {
                    part: "contentDetails,statistics,snippet",
                    id: videoIds,
                    key: process.env.YT_API_KEY
                }
            }
        );

        const formattedSongs = searchResponse.data.items.map((item, index) => {
            const videoDetails = videosResponse.data.items[index] || {};
            const duration = videoDetails.contentDetails?.duration || "PT0S";
            const views = videoDetails.statistics?.viewCount || "0";
            const publishedAt = videoDetails.snippet?.publishedAt || "Desconocido";

            return {
                id: item.id.videoId,
                title: item.snippet.title,
                artist: item.snippet.channelTitle,
                thumbnail: item.snippet.thumbnails.medium?.url || "",
                url: `https://www.youtube.com/watch?v=${item.id.videoId}`,
                duration: parseYouTubeDuration(duration),
                views: parseInt(views).toLocaleString(),
                publishedAt: new Date(publishedAt).toLocaleDateString("es-ES")
            };
        });

        res.json(formattedSongs);
    } catch (error) {
        console.error("Error YouTube API:", error.response?.data);
        res.status(500).json({
            error: "Error en búsqueda",
            details: error.response?.data?.error?.message
        });
    }
});

function parseYouTubeDuration(duration) {
    const match = duration.match(/PT(\d+H)?(\d+M)?(\d+S)?/);
    const hours = match[1] ? parseInt(match[1]) * 3600 : 0;
    const minutes = match[2] ? parseInt(match[2]) * 60 : 0;
    const seconds = match[3] ? parseInt(match[3]) : 0;
    return hours + minutes + seconds;
}

export { router };
