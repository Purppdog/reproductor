import { useState, useEffect, useCallback } from "react";
import SongCard from "./SongCard";
import AddSong from "./AddSong";
import ViniloDefault from '../assets/images/VINILO.jpeg';
import "../styles/components/MyMusic.css";

export default function MyMusic({
    onPlaySong,
    currentPlayingSong,
    isGlobalPlaying,
    showAddSong,
    setShowAddSong
}) {
    const [songs, setSongs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(Date.now());

    const generateCloudinaryUrl = useCallback((publicId, resourceType = 'video') => {
        if (!publicId) return null;
        const baseUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}`;
        return resourceType === 'video'
            ? `${baseUrl}/video/upload/${publicId}`
            : `${baseUrl}/image/upload/w_300,h_300,c_fill/${publicId}.jpg`;
    }, []);

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

    useEffect(() => {
        fetchSongs();
    }, [fetchSongs]);

    const handleSongAdded = useCallback((newSong) => {
        setSongs(prev => [{
            ...newSong,
            thumbnail: newSong.thumbnail || ViniloDefault,
            source: 'cloudinary'
        }, ...prev]);
        setShowAddSong(false);
        setLastUpdated(Date.now());
    }, [setShowAddSong]);

    const handleDeleteSong = useCallback(async (songId) => {
        try {
            const token = localStorage.getItem('token'); // Asegúrate de tener el token

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic/${songId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            const data = await response.json(); // Añade esta línea para obtener detalles del error

            if (!response.ok) {
                throw new Error(data.error || 'Error al eliminar canción');
            }

            setSongs(prev => prev.filter(song => song.id !== songId));
            return true;

        } catch (error) {
            console.error("Error completo al eliminar:", {
                message: error.message,
                ...(error.response && { response: error.response })
            });

            alert(`Error al eliminar: ${error.message}`);
            throw error;
        }
    }, []);

    if (loading) return (
        <div className="loading">
            <div className="spinner"></div>
            <p>Cargando tu biblioteca...</p>
        </div>
    );

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
                <h1>Mi Biblioteca</h1>
                <button
                    className="add-song-button"
                    onClick={() => setShowAddSong(true)}
                    aria-label="Agregar canción"
                >
                    Agregar Canción
                </button>
            </div>

            {showAddSong && (
                <AddSong
                    onSongAdded={handleSongAdded}
                    onClose={() => setShowAddSong(false)}
                />
            )}

            <div className="song-grid">
                {songs.length > 0 ? (
                    songs.map(song => (
                        <SongCard
                            key={`${song.id}-${song.uploaded_at || ''}`}
                            song={song}
                            isPlaying={currentPlayingSong?.id === song.id && isGlobalPlaying}
                            onPlay={() => onPlaySong(song)}
                            onPause={onPlaySong}
                            onDelete={handleDeleteSong}
                        />
                    ))
                ) : (
                    <div className="empty-state">
                        <p>No hay canciones en tu biblioteca</p>
                    </div>
                )}
            </div>
        </div>
    );
}