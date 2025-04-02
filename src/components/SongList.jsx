import { FaPlay, FaPause } from "react-icons/fa";
import ViniloImage from "../assets/images/VINILO.jpeg";
import "../styles/components/SongList.css";

const formatDuration = (duration) => {
    if (!duration) return "--:--";

    if (typeof duration === "number") {
        const minutes = Math.floor(duration / 60);
        const seconds = Math.floor(duration % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    if (typeof duration === "string") {
        const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
        if (!match) return "--:--";

        const hours = parseInt(match[1]) || 0;
        const minutes = parseInt(match[2]) || 0;
        const seconds = parseInt(match[3]) || 0;

        return hours > 0
            ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
            : `${minutes}:${seconds.toString().padStart(2, '0')}`;
    }

    return "--:--";
};

const formatViews = (views) => {
    if (!views) return "N/A";

    if (typeof views === "string") {
        const num = parseInt(views.replace(/\D/g, ''));
        if (isNaN(num)) return views;

        return num >= 1000000
            ? `${(num / 1000000).toFixed(1)}M`
            : num >= 1000
                ? `${(num / 1000).toFixed(1)}K`
                : num.toString();
    }

    return views >= 1000000
        ? `${(views / 1000000).toFixed(1)}M`
        : views >= 1000
            ? `${(views / 1000).toFixed(1)}K`
            : views.toString();
};

const formatDate = (dateString) => {
    if (!dateString) return null;
    try {
        return new Date(dateString).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    } catch {
        return dateString;
    }
};

export default function SongList({
    songs = [],
    currentSong,
    onPlay,
    onPause,
    isLoading = false,
    error = null,
    horizontal = false
}) {
    const handleSongClick = (song, isPlaying) => {
        if (isPlaying) {
            onPause?.();
        } else {
            onPlay?.(song);
        }
    };

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">
                    {error.message || "Error al cargar contenido"}
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando...</p>
            </div>
        );
    }

    return (
        <div className={`song-list-container ${horizontal ? 'horizontal' : ''}`}>
            {songs.length === 0 ? (
                <p className="no-results">No se encontraron resultados</p>
            ) : (
                <div className={`song-grid ${horizontal ? 'horizontal-layout' : ''}`}>
                    {songs.map((song) => {
                        const isPlaying = currentSong?.id === song.id;
                        const durationText = formatDuration(song.duration);
                        const viewsText = song.source === 'youtube' ? formatViews(song.views) : null;
                        const dateText = song.source === 'youtube' ? formatDate(song.publishedAt) : null;

                        return (
                            <div
                                key={song.id}
                                className={`song-card ${isPlaying ? 'playing' : ''}`}
                                onClick={() => handleSongClick(song, isPlaying)}
                            >
                                <div className="thumbnail-container">
                                    <img
                                        src={song.source === 'local' ? ViniloImage : `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`}
                                        alt={`Miniatura de ${song.title}`}
                                        className={`song-thumbnail ${song.source === 'local' ? 'local-thumbnail' : 'youtube-thumbnail'}`}
                                        onError={(e) => {
                                            e.target.src = song.source === 'local' ? ViniloImage : `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;
                                        }}
                                    />
                                    <div className="duration-badge">{durationText}</div>
                                </div>

                                <div className="song-info">
                                    <h3 className="song-title" title={song.title}>
                                        {song.title}
                                    </h3>
                                    <div className="song-meta">
                                        <p className="song-artist">{song.artist || 'Artista desconocido'}</p>
                                        <div className="song-stats">
                                            {viewsText && <span>{viewsText}</span>}
                                            {dateText && <span>{dateText}</span>}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}