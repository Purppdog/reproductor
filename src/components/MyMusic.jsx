import { useState, useEffect, useCallback } from "react";
import SongCard from "./SongCard";
import AddSong from "./AddSong";
import ViniloDefault from '../assets/images/VINILO.jpeg';
import "../styles/components/MyMusic.css";

export default function MyMusic({ onPlaySong, currentPlayingSong, isGlobalPlaying }) {
    const [songs, setSongs] = useState([]);
    const [showAddSong, setShowAddSong] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    // Función para generar URLs de Cloudinary (memoizada)
    const generateCloudinaryUrl = useCallback((publicId, resourceType = 'video') => {
        if (!publicId) return null;
        const baseUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}`;
        return resourceType === 'video'
            ? `${baseUrl}/video/upload/${publicId}`
            : `${baseUrl}/image/upload/w_300,h_300,c_fill/${publicId}.jpg`;
    }, []);

    // Función para cargar canciones (memoizada)
    const fetchSongs = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic?t=${lastUpdated}`);
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

            const data = await response.json();

            const normalizedSongs = data.map(song => {
                const publicId = song.cloudinary_public_id;
                const audioUrl = song.cloudinary_url;

                if (!audioUrl && !publicId) {
                    console.warn('Canción sin URL válida:', song);
                    return null;
                }

                return {
                    id: song.id.toString(),
                    title: song.title || "Sin título",
                    artist: song.artist || "Artista desconocido",
                    url: audioUrl || generateCloudinaryUrl(publicId),
                    thumbnail: publicId ? generateCloudinaryUrl(publicId, 'image') : ViniloDefault,
                    duration: Number(song.duration) || 0,
                    public_id: publicId,
                    source: song.source_type || 'cloudinary',
                    uploaded_at: song.uploaded_at
                };
            }).filter(Boolean);

            setSongs(normalizedSongs);
        } catch (err) {
            console.error("Error al cargar canciones:", err);
            setError(`Error al cargar canciones: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [generateCloudinaryUrl, lastUpdated]);

    // Efecto para cargar canciones
    useEffect(() => {
        fetchSongs();
    }, [fetchSongs]);

    // Manejar nueva canción agregada
    const handleSongAdded = useCallback((newSong) => {
        setSongs(prev => [{
            ...newSong,
            thumbnail: newSong.thumbnail || ViniloDefault,
            source: 'cloudinary'
        }, ...prev]);
        setShowAddSong(false);
        setLastUpdated(Date.now()); // Forzar recarga
    }, []);

    // Estado de carga
    if (loading) return (
        <div className="loading">
            <div className="spinner"></div>
            <p>Cargando tu biblioteca...</p>
        </div>
    );

    // Estado de error
    if (error) return (
        <div className="error">
            <p>{error}</p>
            <button onClick={() => fetchSongs()}>
                Reintentar
            </button>
        </div>
    );

    return (
        <div className="my-music">
            <div className="header">
                <h1>Mi Biblioteca Musical</h1>
                <button
                    className="add-btn"
                    onClick={() => setShowAddSong(true)}
                    aria-label="Agregar canción"
                >
                    Agregar Canción
                </button>
            </div>

            {showAddSong && <AddSong onSongAdded={handleSongAdded} onClose={() => setShowAddSong(false)} />}

            <div className="song-grid">
                {songs.length > 0 ? (
                    songs.map(song => (
                        <SongCard
                            key={`${song.id}-${song.uploaded_at || ''}`}
                            song={song}
                            isPlaying={currentPlayingSong?.id === song.id && isGlobalPlaying}
                            onPlay={() => onPlaySong(song)}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No hay canciones en tu biblioteca</p>
                        <button onClick={() => setShowAddSong(true)}>
                            Agregar primera canción
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}