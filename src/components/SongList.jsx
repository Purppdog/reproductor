import { FaPlay, FaPause } from "react-icons/fa";
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
    if (typeof views === "number") {
        return views >= 1000000
            ? `${(views / 1000000).toFixed(1)}M`
            : views >= 1000
                ? `${(views / 1000).toFixed(1)}K`
                : views.toString();
    }
    return views;
};

export default function YouTubeSongList({
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
            onPause();
        } else {
            onPlay(song);
        }
    };

    if (error) {
        return (
            <div className="youtube-error-container">
                <p className="youtube-error-message">
                    Error al cargar videos: {error.message || "Intenta nuevamente más tarde"}
                </p>
            </div>
        );
    }

    if (isLoading) {
        return (
            <div className="youtube-loading-container">
                <p>Cargando videos de YouTube...</p>
            </div>
        );
    }

    return (
        <div className={`youtube-list-container ${horizontal ? 'horizontal-mode' : ''}`}>
            {songs.length === 0 ? (
                <p className="no-results">No se encontraron videos</p>
            ) : (
                <div className={`youtube-grid ${horizontal ? 'horizontal-layout' : ''}`}>
                    {songs.map((song) => {
                        const isPlaying = currentSong?.id === song.id;
                        const durationText = formatDuration(song.duration);
                        const viewsText = formatViews(song.views);

                        return (
                            <div
                                key={song.id}
                                className={`youtube-card ${horizontal ? 'horizontal' : ''} ${isPlaying ? 'playing' : ''}`}
                                onClick={() => handleSongClick(song, isPlaying)}
                            >
                                <div className="thumbnail-container">
                                    <img
                                        src={song.thumbnail || `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`}
                                        alt={`Miniatura de ${song.title}`}
                                        className="youtube-thumbnail"
                                        onError={(e) => {
                                            e.target.src = `https://img.youtube.com/vi/${song.id}/hqdefault.jpg`;
                                        }}
                                    />
                                    <div className="duration-badge">{durationText}</div>
                                    {horizontal && (
                                        <div className="play-overlay">
                                            <button
                                                className={`play-button ${isPlaying ? 'pause' : 'play'}`}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleSongClick(song, isPlaying);
                                                }}
                                            >
                                                {isPlaying ? <FaPause /> : <FaPlay />}
                                            </button>
                                        </div>
                                    )}
                                </div>

                                <div className="video-info">
                                    <h3 className="video-title">{song.title}</h3>
                                    <p className="video-channel">{song.artist || 'Artista desconocido'}</p>
                                    {horizontal && (
                                        <div className="video-stats">
                                            <span className="stat-item">
                                                <i className="stat-icon">👁️</i> {viewsText}
                                            </span>
                                            <span className="stat-item">
                                                <i className="stat-icon">⏱️</i> {durationText}
                                            </span>
                                        </div>
                                    )}
                                </div>

                                {!horizontal && (
                                    <button
                                        className={`play-button ${isPlaying ? 'pause' : 'play'}`}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleSongClick(song, isPlaying);
                                        }}
                                    >
                                        {isPlaying ? <FaPause /> : <FaPlay />}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}