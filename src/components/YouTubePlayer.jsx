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
    const [playerReady, setPlayerReady] = useState(false);

    // Cargar la API de YouTube
    useEffect(() => {
        if (window.YT) {
            setApiReady(true);
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

        window.onYouTubeIframeAPIReady = () => {
            setApiReady(true);
            setLoading(false);
        };

        document.body.appendChild(tag);

        return () => {
            if (window.onYouTubeIframeAPIReady) {
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
                        disablekb: 0, // Permitir teclado
                        modestbranding: 1,
                        rel: 0,
                        enablejsapi: 1,
                        playsinline: 1,
                        fs: 1, // Permitir pantalla completa
                        iv_load_policy: 3, // Ocultar anotaciones
                        cc_load_policy: 0 // Subtítulos ocultos por defecto
                    },
                    events: {
                        'onReady': onPlayerReady,
                        'onStateChange': onPlayerStateChange,
                        'onError': onPlayerError
                    }
                });
            } catch (err) {
                setError("Error al inicializar el reproductor");
                console.error("YouTube Player init error:", err);
            }
        };

        if (playerInstanceRef.current) {
            const currentVideoId = playerInstanceRef.current.getVideoData()?.video_id;

            if (currentVideoId !== videoId) {
                playerInstanceRef.current.loadVideoById({
                    videoId: videoId,
                    suggestedQuality: 'hd720'
                });
            }

            handlePlayback();
            handleVolume();
        } else {
            initializePlayer();
        }

        return () => {
            // Limpieza opcional si es necesaria
        };
    }, [apiReady, videoId]);

    // Manejar reproducción/pausa y volumen
    useEffect(() => {
        if (!playerReady || !playerInstanceRef.current) return;

        handlePlayback();
        handleVolume();
    }, [isPlaying, volume, isMuted, playerReady]);

    const handlePlayback = () => {
        try {
            if (isPlaying) {
                playerInstanceRef.current?.playVideo();
            } else {
                playerInstanceRef.current?.pauseVideo();
            }
        } catch (err) {
            console.error("Error al controlar reproducción:", err);
        }
    };

    const handleVolume = () => {
        try {
            playerInstanceRef.current?.setVolume(isMuted ? 0 : volume * 100);
        } catch (err) {
            console.error("Error al ajustar volumen:", err);
        }
    };

    const onPlayerReady = (event) => {
        try {
            setPlayerReady(true);
            event.target.setVolume(isMuted ? 0 : volume * 100);

            // Solución para autoplay en móviles
            if (isPlaying) {
                setTimeout(() => {
                    event.target.playVideo().catch(err => {
                        console.warn("Autoplay prevented:", err);
                        // Fallback: Mostrar botón de play manual
                    });
                }, 500);
            }
        } catch (err) {
            console.error("Error en onPlayerReady:", err);
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
                case window.YT.PlayerState.BUFFERING:
                case window.YT.PlayerState.CUED:
                    // Estados adicionales para manejar
                    break;
                default:
                    break;
            }
        } catch (err) {
            console.error("Error en onPlayerStateChange:", err);
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
        console.error("YouTube Error:", message);
        setError(message);

        // Reintentar después de 5 segundos
        setTimeout(() => {
            playerInstanceRef.current?.loadVideoById(videoId);
            setError(null);
        }, 5000);
    };

    const handleRetry = () => {
        setError(null);
        setLoading(true);
        if (playerInstanceRef.current) {
            playerInstanceRef.current.loadVideoById(videoId);
        }
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
        <div className="youtube-container">
            <div
                ref={playerRef}
                className="youtube-player"
                aria-label="Reproductor de YouTube"
            />
        </div>
    );
}