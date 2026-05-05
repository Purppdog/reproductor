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

        const originalCallback = window.onYouTubeIframeAPIReady;

        window.onYouTubeIframeAPIReady = () => {
            setApiReady(true);
            setLoading(false);
            originalCallback?.();
        };

        document.body.appendChild(tag);

        return () => {
            // Limpiar callback solo si es el nuestro
            if (window.onYouTubeIframeAPIReady === window.onYouTubeIframeAPIReady) {
                window.onYouTubeIframeAPIReady = originalCallback || undefined;
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
                        controls: 1,
                        disablekb: 0,
                        modestbranding: 1,
                        rel: 0,
                        enablejsapi: 1,
                        playsinline: 1,
                        fs: 1,
                        iv_load_policy: 3
                    },
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange,
                        'onError': onPlayerError
                    }
                });
            } catch (err) {
                console.error("YouTube Player init error:", err);
                setError("Error al inicializar el reproductor");
                setTimeout(() => setError(null), 3000);
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
                if (isPlaying) {
                    playerInstanceRef.current.playVideo();
                } else {
                    playerInstanceRef.current.pauseVideo();
                }
            } catch (err) {
                console.error("Error updating player:", err);
                initializePlayer();
            }
        }

        return () => {
            // No destruir la instancia para evitar parpadeos
        };
    }, [apiReady, videoId, isPlaying]);

    // Manejar volumen
    useEffect(() => {
        if (!playerInstanceRef.current || !apiReady) return;
        try {
            playerInstanceRef.current.setVolume(isMuted ? 0 : volume * 100);
        } catch (err) {
            console.error("Volume error:", err);
        }
    }, [volume, isMuted, apiReady]);

    const onPlayerReady = (event) => {
        try {
            event.target.setVolume(isMuted ? 0 : volume * 100);
            if (isPlaying) {
                setTimeout(() => {
                    event.target.playVideo().catch(console.warn);
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
            5: "Error de contenido HTML5",
            100: "Video no encontrado",
            101: "Reproducción no permitida",
            150: "Restricciones de reproducción"
        };
        setError(errorMessages[event.data] || `Error (Código: ${event.data})`);
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        const tag = document.createElement('script');
        tag.src = "https://www.youtube.com/iframe_api";
        tag.async = true;
        tag.defer = true;
        document.body.appendChild(tag);
    };

    if (error) {
        return (
            <div className="youtube-error">
                <p>{error}</p>
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
        <div ref={playerRef} className="youtube-player"></div>
    );
}