import { useEffect, useRef } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaStepForward, FaStepBackward } from 'react-icons/fa';
import ViniloDefault from '../assets/images/VINILO.jpeg';

export default function PlayerControls({
    currentSong,
    isPlaying,
    onPlayPause,
    onNext,
    onPrevious,
    progress,
    currentTime = 0,
    duration = 0,
    onProgressChange,
    onVolumeChange,
    volume = 0.7,
    onToggleMute,
    isMuted = false
}) {
    const progressRef = useRef(null);
    const volumeBeforeMute = useRef(volume);

    // Efecto para manejar cambios de volumen
    useEffect(() => {
        if (isMuted && volume > 0) {
            volumeBeforeMute.current = volume;
        }
    }, [volume, isMuted]);

    // Formatear tiempo (mm:ss)
    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    // Manejar cambio de progreso
    const handleSeek = (e) => {
        const newProgress = parseFloat(e.target.value);
        onProgressChange(newProgress);
    };

    // Manejar cambio de volumen
    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        onVolumeChange(newVolume);

        // Desmutear si se ajusta el volumen
        if (isMuted && newVolume > 0 && onToggleMute) {
            onToggleMute();
        }
    };

    // Manejar mute/unmute
    const handleToggleMute = () => {
        if (onToggleMute) {
            onToggleMute();
        }
    };

    if (!currentSong) return null;

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
                    <p className="song-title" title={currentSong.title}>
                        {currentSong.title}
                    </p>
                    <p className="song-artist" title={currentSong.artist}>
                        {currentSong.artist || 'Artista desconocido'}
                    </p>
                </div>
            </div>

            {/* Controles de reproducción */}
            <div className="playback-controls">
                <div className="transport-controls">
                    <button
                        onClick={onPrevious}
                        className="control-button"
                        aria-label="Canción anterior"
                    >
                        <FaStepBackward />
                    </button>
                    <button
                        onClick={onPlayPause}
                        className="play-pause-button"
                        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button
                        onClick={onNext}
                        className="control-button"
                        aria-label="Siguiente canción"
                    >
                        <FaStepForward />
                    </button>
                </div>

                {/* Barra de progreso */}
                <div className="progress-container">
                    <span className="time-display">{formatTime(currentTime)}</span>
                    <input
                        ref={progressRef}
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        className="progress-bar"
                        onChange={handleSeek}
                        aria-label="Barra de progreso"
                    />
                    <span className="time-display">{formatTime(duration)}</span>
                </div>
            </div>

            {/* Control de volumen */}
            <div className="volume-controls">
                <button
                    onClick={handleToggleMute}
                    className="volume-button"
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
                    onChange={handleVolumeChange}
                    className="volume-slider"
                    aria-label="Control de volumen"
                />
            </div>
        </div>
    );
}