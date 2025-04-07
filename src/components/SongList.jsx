import { FaPlay, FaPause } from "react-icons/fa";
import ViniloImage from "../assets/images/VINILO.jpeg";

export default function SongList({
    songs = [],
    currentSong,
    onPlay,
    isLoading = false,
    error = null,
    horizontal = false
}) {
    // Función para obtener la miniatura de la canción
    const getThumbnailSrc = (song) => {
        if (song.thumbnail) return song.thumbnail;

        if (song.source === 'youtube') {
            return `https://img.youtube.com/vi/${song.id}/mqdefault.jpg`;
        }

        if (song.source === 'cloudinary' && song.public_id) {
            return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${song.public_id}.jpg`;
        }

        return ViniloImage;
    };

    // Formatear duración de manera consistente
    const formatDuration = (duration) => {
        if (!duration) return "0:00";

        // Si es un número (segundos)
        if (typeof duration === 'number') {
            const minutes = Math.floor(duration / 60);
            const seconds = Math.floor(duration % 60);
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        // Si es formato ISO 8601 (YouTube)
        if (typeof duration === 'string') {
            const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            if (!match) return "0:00";

            const minutes = (parseInt(match[1]) || 0) * 60 + (parseInt(match[2]) || 0);
            const seconds = parseInt(match[3]) || 0;
            return `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }

        return "0:00";
    };

    // Manejar clic en la canción
    const handleSongClick = (song) => {
        const isPlaying = currentSong?.id === song.id;
        isPlaying ? onPlay?.(null) : onPlay?.(song);
    };

    if (error) {
        return (
            <div className="error-container">
                <p className="error-message">
                    {typeof error === 'string' ? error : error.message || "Error al cargar canciones"}
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="loading-container">
                <div className="loading-spinner"></div>
                <p>Cargando canciones...</p>
            </div>
        );
    }

    return (
        <div className={`song-list-container ${horizontal ? 'horizontal' : ''}`}>
            {songs.length === 0 ? (
                <p className="no-results">No se encontraron canciones</p>
            ) : (
                <div className={`song-grid ${horizontal ? 'horizontal-layout' : ''}`}>
                    {songs.map((song) => {
                        const isPlaying = currentSong?.id === song.id;
                        const thumbnailSrc = getThumbnailSrc(song);
                        const durationText = formatDuration(song.duration);

                        return (
                            <div
                                key={`${song.id}-${song.uploaded_at || ''}`}
                                className={`song-card ${isPlaying ? 'playing' : ''}`}
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
                                <div className="thumbnail-container">
                                    <img
                                        src={thumbnailSrc}
                                        alt={`Portada de ${song.title}`}
                                        className="song-thumbnail"
                                        onError={(e) => {
                                            e.target.src = ViniloImage;
                                            e.target.classList.add('default-thumbnail');
                                        }}
                                        loading="lazy"
                                    />
                                    <div className="duration-badge">{durationText}</div>
                                    <div className="play-indicator">
                                        {isPlaying ? <FaPause /> : <FaPlay />}
                                    </div>
                                </div>

                                <div className="song-info">
                                    <h3 className="song-title" title={song.title}>
                                        {song.title || "Sin título"}
                                    </h3>
                                    <p className="song-artist" title={song.artist}>
                                        {song.artist || "Artista desconocido"}
                                    </p>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}