import {
    FaPlay, FaPause,
    FaVolumeUp, FaVolumeMute,
    FaStepForward, FaStepBackward
} from 'react-icons/fa';
import ViniloDefault from '../assets/images/VINILO.jpeg';
import "../styles/components/PlayerControls.css";

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
                <div className="player-inactive-message">
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
            <div className="player-track-info">
                <img
                    src={currentSong?.thumbnail || ViniloDefault}
                    alt={`Portada de ${currentSong?.title || 'canción'}`}
                    className={`player-thumbnail ${!currentSong?.thumbnail ? 'player-default-thumbnail' : ''}`}
                    onError={(e) => {
                        e.target.src = ViniloDefault;
                        e.target.classList.add('player-default-thumbnail');
                    }}
                />
                <div className="player-track-text">
                    <p className="player-track-title">
                        {currentSong?.title || 'Sin título'}
                    </p>
                    <p className="player-track-artist">
                        {currentSong?.artist || 'Artista desconocido'}
                    </p>
                </div>
            </div>

            {/* Controles de reproducción */}
            <div className="player-playback-controls">
                <div className="player-transport-controls">
                    <button
                        onClick={onPrevious}
                        aria-label="Anterior"
                        disabled={!currentSong}
                        className="player-control-btn"
                    >
                        <FaStepBackward />
                    </button>
                    <button
                        onClick={onPlayPause}
                        className="player-play-pause-btn"
                        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                        disabled={!currentSong}
                    >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button
                        onClick={onNext}
                        aria-label="Siguiente"
                        disabled={!currentSong}
                        className="player-control-btn"
                    >
                        <FaStepForward />
                    </button>
                </div>

                {/* Barra de progreso */}
                <div className="player-progress-container">
                    <span className="player-time">{formatTime(currentTime)}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={(e) => onSeek(parseFloat(e.target.value))}
                        className="player-progress-bar"
                        disabled={!canSeek}
                    />
                    <span className="player-time">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Control de volumen */}
            <div className="player-volume-controls">
                <button
                    onClick={onToggleMute}
                    aria-label={isMuted ? 'Desmutear' : 'Mutear'}
                    className="player-volume-btn"
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
                    className="player-volume-slider"
                />
            </div>
        </div>
    );
}