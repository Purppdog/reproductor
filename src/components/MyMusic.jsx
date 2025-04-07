import { useState, useEffect } from "react";
import SongCard from "./SongCard";
import AddSong from "./AddSong";
import Modal from "./Modal";
import ViniloDefault from '../assets/images/VINILO.jpeg';

export default function MyMusic({ onPlaySong, currentPlayingSong, isGlobalPlaying }) {
    const [songs, setSongs] = useState([]);
    const [showAddSong, setShowAddSong] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Función para generar URLs de Cloudinary
    const generateCloudinaryUrl = (publicId, resourceType = 'video') => {
        if (!publicId) return null;
        const baseUrl = `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}`;

        return resourceType === 'video'
            ? `${baseUrl}/video/upload/${publicId}`
            : `${baseUrl}/image/upload/w_300,h_300,c_fill/${publicId}.jpg`;
    };

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`);
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const data = await response.json();
                console.log('Datos recibidos de la API:', data);

                const normalizedSongs = data.map(song => {
                    // Usamos EXACTAMENTE los nombres de campos que tienes en tu DB
                    const publicId = song.cloudinary_public_id;
                    const audioUrl = song.cloudinary_url;

                    // Validación de campos requeridos
                    if (!audioUrl && !publicId) {
                        console.warn('Canción sin URL ni public_id:', song);
                        return null;
                    }

                    return {
                        id: song.id.toString(), // Aseguramos que sea string
                        title: song.title || "Sin título",
                        artist: song.artist || "Artista desconocido",
                        url: audioUrl || generateCloudinaryUrl(publicId),
                        thumbnail: generateCloudinaryUrl(publicId, 'image') || ViniloDefault,
                        duration: Number(song.duration) || 0,
                        public_id: publicId,
                        source: song.source_type || 'cloudinary' // Usamos source_type de tu DB
                    };
                }).filter(Boolean);

                console.log('Canciones procesadas:', normalizedSongs);
                setSongs(normalizedSongs);
            } catch (err) {
                console.error("Error al cargar canciones:", err);
                setError(`Error al cargar canciones: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        fetchSongs();
    }, []);

    const handleSongAdded = (newSong) => {
        setSongs(prev => [{
            ...newSong,
            id: newSong.id?.toString(),
            thumbnail: newSong.thumbnail || ViniloDefault,
            source: 'cloudinary'
        }, ...prev]);
        setShowAddSong(false);
    };

    if (loading) return (
        <div className="loading">
            <div className="spinner"></div>
            <p>Cargando tu biblioteca...</p>
        </div>
    );

    if (error) return (
        <div className="error">
            <p>{error}</p>
            <button onClick={() => window.location.reload()}>
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

            {showAddSong && (
                <Modal onClose={() => setShowAddSong(false)}>
                    <AddSong onSongAdded={handleSongAdded} />
                </Modal>
            )}

            <div className="song-grid">
                {songs.length > 0 ? (
                    songs.map(song => (
                        <SongCard
                            key={song.id}
                            song={song}
                            isPlaying={currentPlayingSong?.id === song.id && isGlobalPlaying}
                            onPlay={() => onPlaySong(song)}
                            onPause={() => onPlaySong(null)}
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