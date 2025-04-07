import {
    FaPlay, FaPause,
    FaVolumeUp, FaVolumeMute,
    FaStepForward, FaStepBackward
} from 'react-icons/fa';
import ViniloDefault from '../assets/images/VINILO.jpeg';
import '../styles/components/PlayerControls.css';

export default function PlayerControls({
    currentSong,
    onNext,
    onPrevious,
    onPlayPause,
    isPlaying,
    progress,
    onSeek,
    volume,
    onVolumeChange,
    isMuted,
    onToggleMute,
    duration
}) {
    const formatTime = (seconds = 0) => {
        if (isNaN(seconds)) return "0:00";
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    if (!currentSong) {
        return (
            <div className="player-controls inactive">
                <div className="inactive-message">
                    Selecciona una canción para comenzar
                </div>
            </div>
        );
    }

    const currentTime = (progress / 100) * duration;
    const canSeek = currentSong.source !== 'youtube';

    return (
        <div className={`player-controls ${isPlaying ? 'is-playing' : ''}`}>
            {/* Información de la canción */}
            <div className="song-info">
                <img
                    src={currentSong.thumbnail || ViniloDefault}
                    alt={`Portada de ${currentSong.title}`}
                    className="song-thumbnail"
                    onError={(e) => {
                        e.target.src = ViniloDefault;
                        e.target.classList.add('default-thumbnail');
                    }}
                />
                <div className="song-text-container">
                    <p className="song-title">{currentSong.title || 'Sin título'}</p>
                    <p className="song-artist">{currentSong.artist || 'Artista desconocido'}</p>
                </div>
            </div>

            {/* Controles de reproducción */}
            <div className="playback-controls">
                <div className="transport-controls">
                    <button
                        onClick={onPrevious}
                        aria-label="Anterior"
                        disabled={!currentSong}
                    >
                        <FaStepBackward />
                    </button>
                    <button
                        onClick={onPlayPause}
                        className="play-pause-button"
                        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                        disabled={!currentSong}
                    >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button
                        onClick={onNext}
                        aria-label="Siguiente"
                        disabled={!currentSong}
                    >
                        <FaStepForward />
                    </button>
                </div>

                {/* Barra de progreso */}
                <div className="progress-container">
                    <span>{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="progress-bar"
                        disabled={!canSeek}
                    />
                    <span>{formatTime(duration)}</span>
                </div>
            </div>

            {/* Control de volumen */}
            <div className="volume-controls">
                <button
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Desmutear' : 'Mutear'}
                >
                    {isMuted ? <FaVolumeMute /> : <FaVolumeUp />}
                </button>
                <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.01"
                    value={isMuted ? 0 : volume}
                    onChange={(e) => onVolumeChange(parseFloat(e.target.value))}
                    className="volume-slider"
                />
            </div>
        </div>
    );
}