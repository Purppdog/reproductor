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

    useEffect(() => {
        const fetchSongs = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`);
                if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

                const data = await response.json();
                const normalizedSongs = data.map(song => ({
                    id: song.id?.toString(),
                    title: song.title || "Sin título",
                    artist: song.artist || "Artista desconocido",
                    url: song.cloudinary_url || song.url,
                    thumbnail: ViniloDefault, // Imagen por defecto
                    duration: Number(song.duration) || 0,
                    public_id: song.cloudinary_public_id,
                    source: 'cloudinary'
                }));
                setSongs(normalizedSongs);
            } catch (err) {
                console.error("Fetch error:", err);
                setError("Error al cargar canciones");
            } finally {
                setLoading(false);
            }
        };
        fetchSongs();
    }, []);

    const handleSongAdded = (newSong) => {
        setSongs(prev => [{
            ...newSong,
            thumbnail: ViniloDefault // Forzar imagen por defecto
        }, ...prev]);
        setShowAddSong(false);
    };

    if (loading) return <div className="loading">Cargando...</div>;
    if (error) return <div className="error">{error} <button onClick={() => window.location.reload()}>Reintentar</button></div>;

    return (
        <div className="my-music">
            <div className="header">
                <h1>Mi Biblioteca Musical</h1>
                <button className="add-btn" onClick={() => setShowAddSong(true)}>
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
                        <p>No hay canciones</p>
                        <button onClick={() => setShowAddSong(true)}>
                            Agregar primera canción
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}