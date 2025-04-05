import { FaPlay, FaPause } from 'react-icons/fa';
import ViniloImage from '../assets/images/VINILO.jpeg';

export default function SongCard({ song, isPlaying, onPlay, onPause, showPlayButton = true }) {
    const handleClick = () => {
        if (isPlaying) {
            onPause?.();
        } else {
            onPlay?.(song);
        }
    };

    // Determinar la fuente de la imagen miniatura
    const getThumbnailSrc = () => {
        if (song.thumbnail) return song.thumbnail;
        if (song.source === 'cloudinary' && song.public_id) {
            return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${song.public_id}.jpg`;
        }
        return ViniloImage;
    };

    // Formatear duración
    const formatDuration = (seconds) => {
        if (!seconds) return "--:--";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return (
        <div
            className={`song-card ${isPlaying ? 'playing' : ''}`}
            onClick={handleClick}
            role="button"
            tabIndex={0}
            aria-label={`Reproducir ${song.title}`}
            onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                    handleClick();
                }
            }}
        >
            <div className="card-thumbnail-container">
                <img
                    src={getThumbnailSrc()}
                    alt={`Portada de ${song.title}`}
                    className={`card-thumbnail ${!song.thumbnail ? 'default-thumbnail' : ''}`}
                    onError={(e) => {
                        e.target.src = ViniloImage;
                        e.target.classList.add('default-thumbnail');
                    }}
                    loading="lazy"
                />

                {song.duration && (
                    <span className="duration-badge">
                        {formatDuration(song.duration)}
                    </span>
                )}

                {showPlayButton && (
                    <div className="play-button-overlay">
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </div>
                )}
            </div>

            <div className="card-info">
                <h3 className="card-title" title={song.title}>
                    {song.title}
                </h3>
                <div className="card-meta">
                    <p className="card-artist" title={song.artist}>
                        {song.artist || 'Artista desconocido'}
                    </p>
                    {song.views && (
                        <div className="card-stats">
                            <span>{song.views} visualizaciones</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}