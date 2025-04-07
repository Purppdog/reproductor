import { useEffect, useRef, useState } from 'react';

export default function YouTubePlayer({
    videoId,
    onPlay,
    onPause,
    onEnd,
    isPlaying,
    volume = 0.7,
    isMuted = false
}) {
    const playerRef = useRef(null);
    const playerInstanceRef = useRef(null);
    const [apiReady, setApiReady] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Cargar la API de YouTube
    useEffect(() => {
        if (window.YT) {
            setApiReady(true);
            setLoading(false);
            return;
        }

        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.defer = true;

        tag.onerror = () => {
            setError("Error al cargar YouTube API");
            setLoading(false);
        };

        const originalOnYouTubeIframeAPIReady = window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady = () => {
            setApiReady(true);
            setLoading(false);
            if (originalOnYouTubeIframeAPIReady) {
                originalOnYouTubeIframeAPIReady();
            }
        };

        document.body.appendChild(tag);

        return () => {
            if (window.onYouTubeIframeAPIReady === window.onYouTubeIframeAPIReady) {
                window.onYouTubeIframeAPIReady = originalOnYouTubeIframeAPIReady;
            }
            if (!window.onYouTubeIframeAPIReady) {
                delete window.onYouTubeIframeAPIReady;
            }
        };
    }, []);

    // Inicializar/actualizar el reproductor
    useEffect(() => {
        if (!apiReady || !videoId) return;

        const initializePlayer = () => {
            try {
                playerInstanceRef.current = new window.YT.Player(playerRef.current, {
                    videoId: videoId,
                    playerVars: {
                        autoplay: isPlaying ? 1 : 0,
                        controls: 1, // Mostrar controles nativos
                        disablekb: 0, // Habilitar teclado
                        modestbranding: 1,
                        rel: 0,
                        enablejsapi: 1,
                        playsinline: 1,
                        fs: 1, // Permitir pantalla completa
                        iv_load_policy: 3 // No mostrar anotaciones
                    },
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange,
                        'onError': onPlayerError
                    }
                });
            } catch (err) {
                console.error("YouTube Player init error:", err);
                setError("Error al inicializar el reproductor. Intenta recargar la página.");
                setTimeout(() => setError(null), 5000);
            }
        };

        if (!playerInstanceRef.current) {
            initializePlayer();
        } else {
            try {
                const currentVideoId = playerInstanceRef.current.getVideoData()?.video_id;
                if (currentVideoId !== videoId) {
                    playerInstanceRef.current.loadVideoById(videoId);
                }
                handlePlayback();
            } catch (err) {
                console.error("Error updating player:", err);
                initializePlayer(); // Reintentar inicialización
            }
        }

        return () => {
            // Limpieza opcional
        };
    }, [apiReady, videoId]);

    const handlePlayback = () => {
        if (!playerInstanceRef.current) return;
        try {
            if (isPlaying) {
                playerInstanceRef.current.playVideo().catch(err => {
                    console.warn("Autoplay prevented:", err);
                    // Fallback para autoplay bloqueado
                });
            } else {
                playerInstanceRef.current.pauseVideo();
            }
        } catch (err) {
            console.error("Playback error:", err);
        }
    };

    const onPlayerReady = (event) => {
        try {
            event.target.setVolume(isMuted ? 0 : volume * 100);
            if (isPlaying) {
                setTimeout(() => { // Retraso para autoplay en móviles
                    event.target.playVideo().catch(err => {
                        console.warn("Autoplay prevented:", err);
                    });
                }, 300);
            }
        } catch (err) {
            console.error("onPlayerReady error:", err);
        }
    };

    const onPlayerStateChange = (event) => {
        if (!event?.data) return;
        try {
            switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                    onPlay?.();
                    break;
                case window.YT.PlayerState.PAUSED:
                    onPause?.();
                    break;
                case window.YT.PlayerState.ENDED:
                    onEnd?.();
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error("onPlayerStateChange error:", err);
        }
    };

    const onPlayerError = (event) => {
        const errorMessages = {
            2: "Parámetro no válido",
            5: "No se puede reproducir en HTML5",
            100: "El video no existe",
            101: "No se puede reproducir en embebidos",
            150: "Restricciones de reproducción"
        };
        const message = errorMessages[event.data] || `Error (Código: ${event.data})`;
        setError(message);
        setTimeout(() => setError(null), 5000);
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        setApiReady(false);
        // Forzar recarga del script
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.defer = true;
        document.body.appendChild(tag);
    };

    if (error) {
        return (
            <div className="youtube-error">
                <p>Error: {error}</p>
                <button onClick={handleRetry}>Reintentar</button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="youtube-loading">
                <div className="spinner"></div>
                <p>Cargando reproductor...</p>
            </div>
        );
    }

    return (
        <div className="youtube-player-wrapper">
            <div ref={playerRef} className="youtube-player"></div>
        </div>
    );
}