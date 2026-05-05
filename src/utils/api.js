// utils/api.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Cache simple (opcional)
const cache = {
    songs: null,
    youtubeResults: null,
    lastFetch: {}
};

/**
 * Obtiene canciones desde la API local
 * @param {boolean} force - Ignorar cache
 * @returns {Promise<Array>} Lista de canciones normalizadas
 */
export const fetchSongs = async (force = false) => {
    try {
        if (cache.songs && !force) return cache.songs;

        const response = await fetch(`${API_BASE}/api/mymusic`);

        if (!response.ok) {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }

        const data = await response.json();

        // Normalización de datos
        const normalized = data.map(song => ({
            ...song,
            id: song.id || song.public_id,
            source: 'cloudinary',
            thumbnail: song.thumbnail || generateCloudinaryThumbnail(song.public_id),
            duration: song.duration || 0
        }));

        cache.songs = normalized;
        cache.lastFetch.songs = Date.now();
        return normalized;

    } catch (error) {
        console.error('[API] Error fetching songs:', error.message);
        throw new Error('No se pudieron cargar las canciones');
    }
};

/**
 * Busca videos en YouTube
 * @param {string} query - Término de búsqueda
 * @param {AbortSignal} [signal] - Para cancelación
 * @returns {Promise<Array>} Resultados normalizados
 */
export const searchYouTube = async (query, signal) => {
    try {
        if (!query.trim()) return [];

        const response = await fetch(
            `${API_BASE}/api/youtube-search?q=${encodeURIComponent(query)}`,
            { signal }
        );

        if (!response.ok) {
            throw new Error(`YouTube search failed: ${response.status}`);
        }

        const { items } = await response.json();

        return items.map(video => ({
            id: video.id.videoId,
            title: video.snippet.title,
            artist: video.snippet.channelTitle,
            thumbnail: video.snippet.thumbnails?.medium?.url,
            duration: video.contentDetails?.duration,
            views: video.statistics?.viewCount,
            publishedAt: video.snippet.publishedAt,
            source: 'youtube'
        }));

    } catch (error) {
        if (error.name !== 'AbortError') {
            console.error('[API] YouTube search error:', error.message);
            throw new Error('Error al buscar en YouTube');
        }
        return [];
    }
};

/**
 * Sube un audio a Cloudinary
 * @param {Object} file - Archivo de audio (File o Blob)
 * @param {string} title - Título de la canción
 * @param {string} artist - Artista
 * @returns {Promise<Object>} Datos de la canción subida
 */
export const uploadSong = async (file, title, artist) => {
    try {
        // Validación básica
        if (!file || !title) throw new Error('Datos incompletos');

        const base64Audio = await readFileAsBase64(file);
        const response = await fetch(`${API_BASE}/api/mymusic`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                title,
                artist,
                audio: base64Audio
            })
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.error || 'Error en la subida');
        }

        return await response.json();

    } catch (error) {
        console.error('[API] Upload error:', error.message);
        throw new Error(`Subida fallida: ${error.message}`);
    }
};

// --- Funciones auxiliares ---
const generateCloudinaryThumbnail = (publicId) => {
    if (!publicId) return null;
    return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${publicId}.jpg`;
};

const readFileAsBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result.split(',')[1]);
        reader.onerror = error => reject(error);
    });
};

// Opcional: Limpiar cache después de X tiempo
setInterval(() => {
    const now = Date.now();
    Object.keys(cache.lastFetch).forEach(key => {
        if (now - cache.lastFetch[key] > 5 * 60 * 1000) { // 5 minutos
            cache[key] = null;
        }
    });
}, 60 * 1000);