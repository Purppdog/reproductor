import { useRef, useEffect } from 'react';
import { FaPlay, FaPause, FaVolumeUp, FaVolumeMute, FaStepForward, FaStepBackward } from 'react-icons/fa';
import ViniloDefault from '../assets/images/VINILO.jpeg';
import '../styles/components/PlayerControls.css';

export default function PlayerControls({
    currentSong,
    isPlaying,
    onPlay,
    onPause,
    onNext,
    onPlayPause,
    onPrevious,
    progress,
    currentTime = 0,
    duration = 0,
    onProgressChange,
    onVolumeChange,
    volume = 0.7,
    isYouTubePlayer = false,
    onToggleMute,
    isMuted
}) {
    const youtubePlayerRef = useRef(null);
    const volumeBeforeMute = useRef(volume);
    const safeVolume = Math.max(0, Math.min(volume, 1));

    useEffect(() => {
        if (isYouTubePlayer && youtubePlayerRef.current) {
            youtubePlayerRef.current.setVolume(isMuted ? 0 : safeVolume * 100);
        }
    }, [safeVolume, isMuted, isYouTubePlayer]);

    useEffect(() => {
        if (!isYouTubePlayer || !currentSong) return;

        const loadYouTubeAPI = () => {
            if (!window.YT) {
                const tag = document.createElement('script');
                tag.src = "https://www.youtube.com/iframe_api";
                const firstScript = document.getElementsByTagName('script')[0];
                firstScript.parentNode.insertBefore(tag, firstScript);
            }

            window.onYouTubeIframeAPIReady = initializePlayer;
        };

        const initializePlayer = () => {
            youtubePlayerRef.current = new window.YT.Player('youtube-player', {
                videoId: currentSong.id,
                playerVars: {
                    autoplay: isPlaying ? 1 : 0,
                    controls: 0,
                    disablekb: 1,
                    modestbranding: 1,
                    rel: 0
                },
                events: {
                    onReady: (e) => {
                        e.target.setVolume(isMuted ? 0 : safeVolume * 100);
                        if (isPlaying) e.target.playVideo();
                    },
                    onStateChange: handlePlayerStateChange
                }
            });
        };

        loadYouTubeAPI();

        return () => {
            if (youtubePlayerRef.current) {
                youtubePlayerRef.current.destroy();
            }
        };
    }, [currentSong?.id, isYouTubePlayer]);

    const handlePlayerStateChange = (event) => {
        switch (event.data) {
            case window.YT.PlayerState.PLAYING:
                onPlay();
                break;
            case window.YT.PlayerState.PAUSED:
                onPause();
                break;
            case window.YT.PlayerState.ENDED:
                onNext();
                break;
            default:
                break;
        }
    };

    const formatTime = (seconds) => {
        if (!seconds || isNaN(seconds)) return "0:00";
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs.toString().padStart(2, "0")}`;
    };

    const handleTogglePlay = () => {
        onPlayPause();

        // Opcional: Mantén el control de YouTube si lo necesitas
        if (isYouTubePlayer && youtubePlayerRef.current) {
            isPlaying
                ? youtubePlayerRef.current.pauseVideo()
                : youtubePlayerRef.current.playVideo();
        }
    };

    const handleSeek = (e) => {
        const newProgress = parseFloat(e.target.value);
        if (isYouTubePlayer && youtubePlayerRef.current) {
            const seekTo = (newProgress / 100) * youtubePlayerRef.current.getDuration();
            youtubePlayerRef.current.seekTo(seekTo, true);
        }
        onProgressChange(newProgress);
    };

    const handleVolumeAdjust = (e) => {
        const newVolume = parseFloat(e.target.value);
        if (onVolumeChange) onVolumeChange(newVolume);
        if (isMuted && newVolume > 0 && onToggleMute) {
            onToggleMute();
        }
    };

    const handleMuteToggle = () => {
        if (onToggleMute) {
            onToggleMute();
        } else {
            if (isMuted) {
                onVolumeChange?.(volumeBeforeMute.current);
            } else {
                volumeBeforeMute.current = safeVolume;
                onVolumeChange?.(0);
            }
        }
    };

    if (!currentSong) return null;

    return (
        <div className="player-controls">
            {isYouTubePlayer && <div id="youtube-player" style={{ display: 'none' }} />}

            {/* Sección izquierda - Info de canción */}
            <div className="song-info">
                <img
                    src={currentSong.thumbnail || ViniloDefault}
                    alt={`Portada de ${currentSong.title}`}
                    className="song-thumbnail"
                    onError={(e) => { e.target.src = ViniloDefault }}
                />
                <div className="song-text-container">
                    <p className="song-title">{currentSong.title}</p>
                    <p className="song-artist">{currentSong.artist || 'Artista desconocido'}</p>
                </div>
            </div>

            {/* Sección central - Controles de reproducción */}
            <div className="playback-controls">
                <div className="transport-controls">
                    <button
                        onClick={onPrevious}
                        className="control-button"
                        aria-label="Canción anterior"
                    >
                        <FaStepBackward />
                    </button>
                    <button onClick={handleTogglePlay}>
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
                <div className="progress-container">
                    <span className="time-display">{formatTime(currentTime)}</span>
                    <input
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

            {/* Sección derecha - Control de volumen */}
            <div className="volume-controls">
                <button
                    onClick={handleMuteToggle}
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
                    value={isMuted ? 0 : safeVolume}
                    onChange={handleVolumeAdjust}
                    className="volume-slider"
                    aria-label="Control de volumen"
                />
            </div>
        </div>
    );
}