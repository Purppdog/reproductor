import { FaPlay, FaPause } from "react-icons/fa";
import ViniloImage from "../assets/images/VINILO.jpeg";
import "../styles/components/SongList.css";

export default function SongList({
    songs = [],
    currentSong,
    onPlay,
    isLoading = false,
    error = null,
    horizontal = false
}) {
    // Función para obtener la miniatura
    const getThumbnail = (song) => {
        if (song.thumbnail) return song.thumbnail;
        if (song.source === 'youtube') return `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;
        if (song.source === 'cloudinary' && song.public_id) {
            return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${song.public_id}.jpg`;
        }
        return ViniloImage;
    };

    // Formateadores
    const formatDuration = (duration) => {
        if (!duration) return "0:00";

        if (typeof duration === 'number') {
            const mins = Math.floor(duration / 60);
            const secs = Math.floor(duration % 60);
            return `${mins}:${secs.toString().padStart(2, '0')}`;
        }

        if (typeof duration === 'string') { // Para formato ISO 8601 de YouTube
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return "0:00";
            const hours = parseInt(match[1]) || 0;
            const mins = parseInt(match[2]) || 0;
            const secs = parseInt(match[3]) || 0;
            return `${hours > 0 ? hours + ':' : ''}${mins}:${secs.toString().padStart(2, '0')}`;
        }

        return "0:00";
    };

    const formatStats = (song) => {
        if (song.source !== 'youtube') return null;

        const views = song.views ? parseInt(song.views).toLocaleString('es') + ' vistas' : 'Sin vistas';
        const date = song.publishedAt ? new Date(song.publishedAt).toLocaleDateString('es-ES') : '';

        return (
            <div className="video-stats">
                <span>{views}</span>
                {date && <span>{date}</span>}
            </div>
        );
    };

    const handleSongClick = (song) => {
        const isPlaying = currentSong?.id === song.id;
        isPlaying ? onPlay?.(null) : onPlay?.(song);
    };

    // Estados de carga y error
    if (error) {
        return (
            <div className="error-container">
                {typeof error === 'string' ? error : error.message || "Error al cargar canciones"}
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="spinner"></div>
                <p>Cargando contenido...</p>
            </div>
        );
    }

    return (
        <div className={`song-list ${horizontal ? 'horizontal-layout' : ''}`}>
            {songs.length === 0 ? (
                <p className="empty-message">No se encontraron canciones</p>
            ) : (
                <div className="song-grid">
                    {songs.map((song) => {
                        const isPlaying = currentSong?.id === song.id;
                        const isYouTube = song.source === 'youtube';

                        return (
                            <div
                                key={`${song.id}-${song.uploaded_at || ''}`}
                                className={`song-card ${isPlaying ? 'playing' : ''} ${isYouTube ? 'youtube-card' : 'local-song'}`}
                                onClick={() => handleSongClick(song)}
                                role="button"
                                tabIndex={0}
                                aria-label={`${isPlaying ? 'Pausar' : 'Reproducir'} ${song.title}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleSongClick(song);
                                    }
                                }}
                            >
                                <div className={`thumbnail-container ${isYouTube ? 'youtube-thumbnail' : ''}`}>
                                    <img
                                        src={getThumbnail(song)}
                                        alt={`Portada de ${song.title}`}
                                        className="song-thumbnail"
                                        onError={(e) => {
                                            e.target.src = ViniloImage;
                                            e.target.classList.add('thumbnail-fallback');
                                        }}
                                        loading="lazy"
                                    />
                                    <div className="duration-badge">{formatDuration(song.duration)}</div>
                                    <div className="play-indicator">
                                        {isPlaying ? <FaPause /> : <FaPlay />}
                                    </div>
                                </div>

                                <div className="song-info">
                                    <h3 className="song-title">{song.title || "Sin título"}</h3>
                                    <p className={`song-artist ${isYouTube ? 'youtube-channel' : ''}`}>
                                        {song.artist || "Artista desconocido"}
                                    </p>
                                    {isYouTube && formatStats(song)}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}