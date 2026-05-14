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
    const [sortBy, setSortBy] = useState('recent');

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
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic?t=${lastUpdated}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
            const data = await response.json();

            const normalizedSongs = data.map(song => {
                const publicId = song.cloudinary_public_id;
                const audioUrl = song.cloudinary_url;
                if (!audioUrl && !publicId) return null;
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
            setError(`Error al cargar canciones: ${err.message}`);
        } finally {
            setLoading(false);
        }
    }, [generateCloudinaryUrl, lastUpdated]);

    useEffect(() => {
        fetchSongs();
    }, [fetchSongs]);

    // ✅ Función de ordenación
    const getSortedSongs = useCallback((songs) => {
        const sorted = [...songs];
        switch (sortBy) {
            case 'title':
                return sorted.sort((a, b) => a.title.localeCompare(b.title));
            case 'artist':
                return sorted.sort((a, b) => a.artist.localeCompare(b.artist));
            case 'duration':
                return sorted.sort((a, b) => b.duration - a.duration);
            case 'recent':
            default:
                return sorted.sort((a, b) =>
                    new Date(b.uploaded_at) - new Date(a.uploaded_at)
                );
        }
    }, [sortBy]);

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
            const token = localStorage.getItem('token');
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic/${songId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Error al eliminar canción');
            if (currentPlayingSong?.id === songId) onPlaySong(null);
            setSongs(prev => prev.filter(song => song.id !== songId));
            return true;
    }, [currentPlayingSong, onPlaySong]);

    if (loading) return (
        <div className="loading">
            <div className="spinner"></div>
            <p>Cargando tu biblioteca...</p>
        </div>
    );

    if (error) return (
        <div className="error">
            <p>{error}</p>
            <button onClick={() => fetchSongs()}>Reintentar</button>
        </div>
    );

    const sortedSongs = getSortedSongs(songs);

    return (
        <div className="my-music">
            <div className="header">
                <div className="header-left">
                    <h1>Mi Biblioteca</h1>
                    <span className="song-count">{songs.length} {songs.length === 1 ? 'canción' : 'canciones'}</span>
                </div>
                <div className="header-right">
                    <select
                        className="sort-select"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                    >
                        <option value="recent">Más reciente</option>
                        <option value="title">Título A-Z</option>
                        <option value="artist">Artista A-Z</option>
                        <option value="duration">Duración</option>
                    </select>
                    <button
                        className="add-song-button"
                        onClick={() => setShowAddSong(true)}
                    >
                        Agregar Canción
                    </button>
                </div>
            </div>

            {showAddSong && (
                <AddSong
                    onSongAdded={handleSongAdded}
                    onClose={() => setShowAddSong(false)}
                />
            )}

            <div className="song-grid">
                {sortedSongs.length > 0 ? (
                    sortedSongs.map(song => (
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