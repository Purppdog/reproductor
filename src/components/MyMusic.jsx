import { useState, useEffect } from "react";
import { Howl } from "howler";
import SongCard from "./SongCard";
import AddSong from "./AddSong";
import Modal from "./Modal";
import ViniloDefault from '../assets/images/VINILO.jpeg';

export default function MyMusic({ onPlaySong, currentPlayingSong, isGlobalPlaying }) {
    const [songs, setSongs] = useState([]);
    const [showAddSong, setShowAddSong] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchSongs();
    }, []);

    const fetchSongs = async () => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`);

            if (!response.ok) {
                throw new Error(`Error ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();

            const normalizedSongs = data.map(song => ({
                ...song,
                id: song.id || song.public_id,
                title: song.title || "Título desconocido",
                artist: song.artist || "Artista desconocido",
                thumbnail: song.thumbnail || generateThumbnailUrl(song.public_id) || ViniloDefault,
                url: song.cloudinary_url,  // Cambiado a cloudinary_url
                source: 'cloudinary',
                duration: song.duration || 0
            }));

            setSongs(normalizedSongs);
        } catch (err) {
            console.error("Error al obtener las canciones:", err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const generateThumbnailUrl = (publicId) => {
        if (!publicId) return null;
        return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_thumb,g_faces/${publicId}.jpg`;
    };

    const handlePlay = (song) => {
        if (onPlaySong) {
            onPlaySong({
                ...song,
                url: song.url,
                source: 'cloudinary'
            });
        }
    };

    const isSongPlaying = (song) => {
        return currentPlayingSong?.id === song.id && isGlobalPlaying;
    };

    const handleSongAdded = (newSong) => {
        setSongs(prev => [
            {
                ...newSong,
                id: newSong.public_id,
                thumbnail: generateThumbnailUrl(newSong.public_id),
                source: 'cloudinary'
            },
            ...prev
        ]);
        setShowAddSong(false);
    };

    if (loading) {
        return <div className="loading-container">Cargando tus canciones...</div>;
    }

    if (error) {
        return (
            <div className="error-container">
                <p>Error al cargar las canciones: {error}</p>
                <button onClick={fetchSongs}>Reintentar</button>
            </div>
        );
    }

    return (
        <div className="my-music">
            <div className="header">
                <h1>Mi Biblioteca Musical</h1>
                <button
                    className="add-song-btn"
                    onClick={() => setShowAddSong(true)}
                >
                    Agregar Canción
                </button>
            </div>

            {showAddSong && (
                <Modal onClose={() => setShowAddSong(false)}>
                    <AddSong onSongAdded={handleSongAdded} />
                </Modal>
            )}

            <div className="song-grid">
                {songs.length > 0 ? (
                    songs.map((song) => (
                        <SongCard
                            key={song.id}
                            song={{
                                ...song,
                                thumbnail: song.thumbnail || ViniloDefault
                            }}
                            isPlaying={isSongPlaying(song)}
                            onPlay={() => handlePlay(song)}
                            onPause={() => onPlaySong?.(null)}
                        />
                    ))
                ) : (
                    <div className="no-songs-message">
                        <p>No hay canciones en tu biblioteca</p>
                        <button onClick={() => setShowAddSong(true)}>
                            Agrega tu primera canción
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}