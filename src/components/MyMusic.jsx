import { useState, useEffect, _useRef } from "react";
import { Howl } from "howler";
import SongCard from "./SongCard";
import AddSong from "./AddSong";
import Modal from "./Modal";
import ViniloDefault from '../assets/images/VINILO.jpeg';
import '../styles/components/MyMusic.css';

export default function MyMusic({ onPlaySong, currentPlayingSong, isGlobalPlaying }) {
    const [songs, setSongs] = useState([]);
    const [showAddSong, setShowAddSong] = useState(false);
    //const [localProgress, setLocalProgress] = useState(0);
    //const progressInterval = useRef(null);

    useEffect(() => {
        fetchSongs();
    }, []);

    const fetchSongs = async () => {
        try {
            const response = await fetch("http://localhost:3001/api/mymusic");
            const data = await response.json();

            const normalizedSongs = data.map(song => ({
                ...song,
                title: song.title || "Título desconocido",
                artist: song.artist || "Artista desconocido",
                thumbnail: song.thumbnail || null,
                file_path: song.file_path || "",
                source: 'local',
                duration: song.duration || 0
            }));

            setSongs(normalizedSongs);
        } catch (error) {
            console.error("Error al obtener las canciones:", error);
        }
    };

    const handlePlay = (song) => {
        if (onPlaySong) {
            onPlaySong({
                ...song,
                url: `http://localhost:3001/uploads/${song.file_path}`,
                source: 'local'
            });
        }
    };

    const isSongPlaying = (song) => {
        return currentPlayingSong?.id === song.id && isGlobalPlaying;
    };

    return (
        <div className="my-music">
            <div className="header">
                <h1>Mis Canciones</h1>
                <button
                    className="add-song-btn"
                    onClick={() => setShowAddSong(true)}
                    aria-label="Agregar canción"
                >
                    Agregar Canción
                </button>
            </div>

            {showAddSong && (
                <Modal onClose={() => setShowAddSong(false)}>
                    <AddSong
                        onSongAdded={(songName) => {
                            setShowAddSong(false);
                            alert(`Canción "${songName}" agregada correctamente`);
                            fetchSongs();
                        }}
                    />
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
                            onPause={() => onPlaySong?.(null)} // Pausar la reproducción
                        />
                    ))
                ) : (
                    <div className="no-songs-message">
                        <p>No hay canciones disponibles</p>
                    </div>
                )}
            </div>
        </div>
    );
}