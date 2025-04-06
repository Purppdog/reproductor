import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import {
    FaPlay, FaPause,
    FaVolumeUp, FaVolumeMute,
    FaStepForward, FaStepBackward
} from 'react-icons/fa';
import ViniloDefault from '../assets/images/VINILO.jpeg';

export default function PlayerControls({
    currentSong,
    onNext,
    onPrevious,
    onVolumeChange,
    onToggleMute,
    initialVolume = 0.7,
    isMuted = false
}) {
    // Estados y referencias
    const [sound, setSound] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const progressInterval = useRef(null);

    // 1. Inicializar Howl cuando cambia la canción
    useEffect(() => {
        if (!currentSong?.url) return;

        const newSound = new Howl({
            src: [currentSong.url],
            html5: true, // Usar audio HTML5 para mejor compatibilidad
            volume: isMuted ? 0 : initialVolume,
            onplay: () => {
                setIsPlaying(true);
                startProgressTracker();
                if (duration === 0) setDuration(newSound.duration());
            },
            onpause: () => setIsPlaying(false),
            onend: () => {
                onNext?.();
            },
            onloaderror: (id, error) => {
                console.error('Error al cargar audio:', error);
                setIsPlaying(false);
            },
            onplayerror: () => {
                console.error('Error al reproducir');
                setIsPlaying(false);
            }
        });

        setSound(newSound);

        // Limpieza al desmontar o cambiar canción
        return () => {
            newSound.unload();
            stopProgressTracker();
        };
    }, [currentSong?.url]);

    // 2. Manejar play/pause
    const handlePlayPause = () => {
        if (!sound) return;

        if (isPlaying) {
            sound.pause();
        } else {
            sound.play();
        }
    };

    // 3. Control de progreso
    const startProgressTracker = () => {
        stopProgressTracker();
        progressInterval.current = setInterval(() => {
            if (sound?.playing()) {
                const seek = sound.seek();
                setProgress((seek / sound.duration()) * 100);
            }
        }, 200);
    };

    const stopProgressTracker = () => {
        clearInterval(progressInterval.current);
    };

    const handleSeek = (e) => {
        if (!sound) return;
        const newProgress = parseFloat(e.target.value);
        const newTime = (newProgress / 100) * sound.duration();
        sound.seek(newTime);
        setProgress(newProgress);
    };

    // 4. Control de volumen
    useEffect(() => {
        if (!sound) return;
        sound.volume(isMuted ? 0 : initialVolume);
    }, [initialVolume, isMuted, sound]);

    const handleVolumeChange = (e) => {
        const newVolume = parseFloat(e.target.value);
        onVolumeChange?.(newVolume);

        if (isMuted && newVolume > 0) {
            onToggleMute?.();
        }
    };

    // 5. Formatear tiempo (mm:ss)
    const formatTime = (seconds = 0) => {
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${mins}:${secs.toString().padStart(2, '0')}`;
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
                    <p className="song-title">{currentSong.title || 'Sin título'}</p>
                    <p className="song-artist">{currentSong.artist || 'Artista desconocido'}</p>
                </div>
            </div>

            {/* Controles de reproducción */}
            <div className="playback-controls">
                <div className="transport-controls">
                    <button onClick={onPrevious} aria-label="Anterior">
                        <FaStepBackward />
                    </button>
                    <button
                        onClick={handlePlayPause}
                        className="play-pause-button"
                        aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                    >
                        {isPlaying ? <FaPause /> : <FaPlay />}
                    </button>
                    <button onClick={onNext} aria-label="Siguiente">
                        <FaStepForward />
                    </button>
                </div>

                {/* Barra de progreso */}
                <div className="progress-container">
                    <span>{formatTime((progress / 100) * duration)}</span>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={progress}
                        onChange={handleSeek}
                        className="progress-bar"
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
                    value={isMuted ? 0 : initialVolume}
                    onChange={handleVolumeChange}
                    className="volume-slider"
                />
            </div>
        </div>
    );
}