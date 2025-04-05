import { FaPlay, FaPause } from "react-icons/fa";
import ViniloImage from "../assets/images/VINILO.jpeg";

export default function SongList({
    songs = [],
    currentSong,
    onPlay,
    onPause,
    isLoading = false,
    error = null,
    horizontal = false
}) {
    // Función para determinar la fuente de la miniatura
    const getThumbnailSrc = (song) => {
        if (song.thumbnail) return song.thumbnail;

        switch (song.source) {
            case 'youtube':
                return `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`;
            case 'cloudinary':
                return song.public_id
                    ? `https://res.cloudinary.com/dh5v8wspm/image/upload/w_300,h_300,c_thumb/${song.public_id}.jpg`
                    : ViniloImage;
            default:
                return ViniloImage;
        }
    };

    // Formatear duración para cualquier fuente
    const formatDuration = (duration) => {
        if (!duration) return "--:--";

        // Si es número (segundos)
        if (typeof duration === 'number') {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Si es formato ISO 8601 (YouTube)
        if (typeof duration === 'string') {
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

    // Formatear visualizaciones (para YouTube)
    const formatViews = (views) => {
        if (!views) return null;

        const num = typeof views === 'string'
            ? parseInt(views.replace(/\D/g, ''))
            : views;

        if (isNaN(num)) return views;

        return num >= 1000000
            ? `${(num / 1000000).toFixed(1)}M`
            : num >= 1000
                ? `${(num / 1000).toFixed(1)}K`
                : num.toString();
    };

    const handleSongClick = (song) => {
        const isPlaying = currentSong?.id === song.id;
        isPlaying ? onPause?.() : onPlay?.(song);
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
                        const thumbnailSrc = getThumbnailSrc(song);
                        const durationText = formatDuration(song.duration);
                        const viewsText = song.source === 'youtube' ? formatViews(song.views) : null;

                        return (
                            <div
                                key={song.id}
                                className={`song-card ${isPlaying ? 'playing' : ''}`}
                                onClick={() => handleSongClick(song)}
                                role="button"
                                tabIndex={0}
                                aria-label={`Reproducir ${song.title}`}
                                onKeyDown={(e) => {
                                    if (e.key === 'Enter' || e.key === ' ') {
                                        handleSongClick(song);
                                    }
                                }}
                            >
                                <div className="thumbnail-container">
                                    <img
                                        src={thumbnailSrc}
                                        alt={`Miniatura de ${song.title}`}
                                        className={`song-thumbnail ${song.source || 'local'}-thumbnail`}
                                        onError={(e) => {
                                            e.target.src = ViniloImage;
                                            e.target.classList.add('default-thumbnail');
                                        }}
                                        loading="lazy"
                                    />
                                    <div className="duration-badge">{durationText}</div>
                                    {isPlaying && (
                                        <div className="playing-indicator">
                                            <FaPause />
                                        </div>
                                    )}
                                </div>

                                <div className="song-content">
                                    <h3 className="song-title" title={song.title}>
                                        {song.title}
                                    </h3>
                                    <p className="song-artist">{song.artist || 'Artista desconocido'}</p>
                                    {viewsText && (
                                        <div className="song-stats">
                                            <span>{viewsText} visualizaciones</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}