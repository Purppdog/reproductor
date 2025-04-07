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

    // Cargar la API de YouTube solo una vez
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
                        controls: 1, // Ocultamos controles nativos para usar los nuestros
                        disablekb: 1,
                        modestbranding: 1,
                        rel: 0,
                        enablejsapi: 1,
                        playsinline: 1
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
            // Verificar si el video actual es diferente al nuevo
            if (playerInstanceRef.current.getVideoData().video_id !== videoId) {
                playerInstanceRef.current.loadVideoById({
                    videoId: videoId,
                    suggestedQuality: 'default'
                });
            }

            if (isPlaying) {
                playerInstanceRef.current.playVideo();
            } else {
                playerInstanceRef.current.pauseVideo();
            }
        } else {
            initializePlayer();
        }

        return () => {
            // No destruimos la instancia para evitar parpadeos
            // entre cambios de video
        };
    }, [apiReady, videoId]); // Eliminamos isPlaying de las dependencias

    // Control de reproducción/pausa
    useEffect(() => {
        if (!playerInstanceRef.current || !apiReady) return;

        try {
            if (isPlaying) {
                playerInstanceRef.current.playVideo();
            } else {
                playerInstanceRef.current.pauseVideo();
            }
        } catch (err) {
            console.error("Error al controlar reproducción:", err);
        }
    }, [isPlaying, apiReady]);

    // Manejar volumen
    useEffect(() => {
        if (!playerInstanceRef.current || !apiReady) return;

        try {
            playerInstanceRef.current.setVolume(isMuted ? 0 : volume * 100);
        } catch (err) {
            console.error("Error al ajustar volumen:", err);
        }
    }, [volume, isMuted, apiReady]);

    const onPlayerReady = (event) => {
        try {
            event.target.setVolume(isMuted ? 0 : volume * 100);
            if (isPlaying) {
                event.target.playVideo();
            }
        } catch (err) {
            console.error("Error en onPlayerReady:", err);
        }
    };

    const onPlayerStateChange = (event) => {
        if (!event || !event.data) return;

        try {
            switch (event.data) {
                case window.YT.PlayerState.PLAYING:
                    onPlay && onPlay();
                    break;
                case window.YT.PlayerState.PAUSED:
                    onPause && onPause();
                    break;
                case window.YT.PlayerState.ENDED:
                    onEnd && onEnd();
                    break;
                case window.YT.PlayerState.UNSTARTED:
                    // Manejar casos donde el video no inicia
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
            2: "La solicitud contiene un parámetro no válido",
            5: "El contenido solicitado no se puede reproducir en un reproductor HTML5",
            100: "El video solicitado no existe",
            101: "El video no se puede reproducir en reproductores incrustados",
            150: "Mismo error que 101"
        };

        const message = errorMessages[event.data] || `Error al reproducir (Código: ${event.data})`;
        console.error("YouTube Player Error:", message);
        setError(message);
    };

    if (error) {
        return (
            <div className="youtube-error">
                <p>{error}</p>
                {error.includes("Código") && (
                    <p>Intenta con otro video o verifica la URL</p>
                )}
                <button onClick={() => setError(null)}>Reintentar</button>
            </div>
        );
    }

    if (loading) {
        return <div className="youtube-loading">Cargando reproductor...</div>;
    }

    return (
        <div className="youtube-container">
            <div ref={playerRef} className="youtube-player"></div>
        </div>
    );
}