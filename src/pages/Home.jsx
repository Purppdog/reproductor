import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import YouTube from 'react-youtube';
import SongList from '../components/SongList';
import PlayerControls from '../components/PlayerControls';
import SearchBar from '../components/SearchBar';
import MyMusic from '../components/MyMusic';
import '../styles/pages/Home.css';

export default function Home() {
    // Estados principales
    const [songs, setSongs] = useState([]);
    const [youtubeResults, setYoutubeResults] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('local');
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [isLoadingYouTube, setIsLoadingYouTube] = useState(false);
    const [youtubeError, setYoutubeError] = useState(null);

    // Refs
    const soundRef = useRef(null);
    const progressInterval = useRef(null);
    const volumeBeforeMute = useRef(volume);

    // Función para formatear la duración
    const formatDuration = (secondsOrISO) => {
        // Si es duración en segundos (número)
        if (typeof secondsOrISO === 'number') {
            const minutes = Math.floor(secondsOrISO / 60);
            const remainingSeconds = Math.floor(secondsOrISO % 60);
            return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
        }
        // Si es formato ISO 8601 de YouTube (string)
        else if (typeof secondsOrISO === 'string') {
            const match = secondsOrISO.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
            const hours = parseInt(match[1]) || 0;
            const minutes = parseInt(match[2]) || 0;
            const seconds = parseInt(match[3]) || 0;

            return hours > 0
                ? `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                : `${minutes}:${seconds.toString().padStart(2, '0')}`;
        }
        return "--:--";
    };

    // Función para formatear las visualizaciones
    const formatViews = (views) => {
        if (!views) return "0 vistas";
        const num = typeof views === 'string' ? parseInt(views.replace(/\./g, '')) : views;
        return num.toLocaleString() + " vistas";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "Fecha no disponible";
        return new Date(dateString).toLocaleDateString('es-ES');
    };


    // Cargar canciones locales al inicio
    useEffect(() => {
        const fetchLocalSongs = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/songs`)

                const data = await response.json();
                setSongs(data.map(song => ({
                    ...song,
                    title: song.title || "Título desconocido",
                    artist: song.artist || "Artista desconocido",
                    thumbnail: song.thumbnail || null,
                    duration: song.duration || 0,
                    file_path: song.file_path || "",
                    source: 'local'
                })));
            } catch (err) {
                console.error('Error al cargar canciones locales:', err);
            }
        };
        fetchLocalSongs();
    }, []);

    // Buscar en YouTube
    const searchYouTube = useCallback(async (query) => {
        if (!query.trim() || activeTab !== 'youtube') return;

        setIsLoadingYouTube(true);
        setYoutubeError(null);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/youtube-search?q=${encodeURIComponent(query)}`
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error en la búsqueda");
            }

            const data = await response.json();

            // Asegurar máximo 5 resultados (aunque el backend ya lo haga)
            const limitedResults = data.items.slice(0, 5).map(video => ({
                id: video.id.videoId,
                title: video.snippet.title,
                artist: video.snippet.channelTitle,
                thumbnail: video.snippet.thumbnails.medium?.url || video.snippet.thumbnails.default.url,
                duration: video.contentDetails?.duration,
                views: video.statistics?.viewCount,
                publishedAt: video.snippet.publishedAt,
                source: 'youtube'
            }));

            setYoutubeResults(limitedResults);

        } catch (error) {
            console.error('Error en búsqueda YouTube:', error);
            setYoutubeError(error.message || 'Error al cargar videos');
        } finally {
            setIsLoadingYouTube(false);
        }
    }, [activeTab]);

    // Manejar cambios en la búsqueda
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'youtube') {
                searchYouTube(searchQuery);
            }
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, searchYouTube]);

    // Reproducción de audio local
    const playAudio = useCallback((song) => {
        stopCurrentPlayback();

        soundRef.current = new Howl({
            src: [`${import.meta.env.VITE_API_URL}/uploads/${song.file_path}`],
            html5: true,
            volume: isMuted ? 0 : volume,
            onplay: () => {
                setIsPlaying(true);
                startProgressTracker();
                setCurrentSong(prev => ({
                    ...prev,
                    duration: soundRef.current.duration()
                }));
            },
            onpause: () => setIsPlaying(false),
            onend: () => handlePlaySong(getNextSong()),
            onload: () => {
                setCurrentSong(prev => ({
                    ...prev,
                    duration: soundRef.current.duration()
                }));
            },
            onloaderror: (_, error) => {
                console.error('Error al cargar audio:', error);
                setIsPlaying(false);
            }
        });

        soundRef.current.play();
    }, [volume, isMuted]);

    // Control de reproducción principal
    const handlePlaySong = useCallback((song) => {
        console.log('handlePlaySong received:', song);
        if (!song) return;

        if (currentSong?.id === song.id) {
            return isPlaying ? handlePause() : handleResume();
        }

        console.log('Setting currentSong:', {
            ...song,
            source: song.source || 'local'
        });

        setCurrentSong({
            ...song,
            source: song.source || 'local'
        });
        setIsPlaying(true);
        setProgress(0);

        song.source === 'youtube' ? handlePlayYouTube(song) : playAudio(song);
    }, [currentSong, isPlaying, playAudio]);

    const handlePlayYouTube = useCallback((song) => {
        // Solo actualiza el estado, el reproductor YouTube manejará la reproducción
        setCurrentSong(song);
        setIsPlaying(true);
    }, []);

    useEffect(() => {
        // Pausar la reproducción local al cambiar a YouTube
        if (activeTab === 'youtube' && currentSong?.source === 'local') {
            handlePause();
        }
    }, [activeTab, currentSong]);

    // Control de pausa
    const handlePause = useCallback(() => {
        if (soundRef.current) {
            soundRef.current.pause();
        }
        setIsPlaying(false);
        stopProgressTracker();
    }, []);

    // Control de reanudación
    const handleResume = useCallback(() => {
        if (soundRef.current) {
            soundRef.current.play();
        }
        setIsPlaying(true);
        startProgressTracker();
    }, []);

    // Navegación entre canciones
    const getNextSong = useCallback(() => {
        const list = activeTab === 'local' ? songs : youtubeResults;
        if (list.length === 0) return null;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        return list[(currentIndex + 1) % list.length];
    }, [currentSong, activeTab, songs, youtubeResults]);

    const getPreviousSong = useCallback(() => {
        const list = activeTab === 'local' ? songs : youtubeResults;
        if (list.length === 0) return null;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        return list[(currentIndex - 1 + list.length) % list.length];
    }, [currentSong, activeTab, songs, youtubeResults]);

    // Control de progreso
    const startProgressTracker = useCallback(() => {
        stopProgressTracker();
        progressInterval.current = setInterval(() => {
            if (soundRef.current) {
                const seek = soundRef.current.seek();
                const duration = soundRef.current.duration();
                if (duration > 0) {
                    setProgress((seek / duration) * 100);
                }
            }
        }, 1000);
    }, []);

    const stopProgressTracker = useCallback(() => {
        if (progressInterval.current) {
            clearInterval(progressInterval.current);
            progressInterval.current = null;
        }
    }, []);

    const stopCurrentPlayback = useCallback(() => {
        if (soundRef.current) {
            soundRef.current.stop();
            soundRef.current.unload();
            soundRef.current = null;
        }
        stopProgressTracker();
    }, []);

    // Control de volumen
    const handleVolumeChange = useCallback((newVolume) => {
        const volumeValue = parseFloat(newVolume);
        setVolume(volumeValue);

        if (isMuted && volumeValue > 0) {
            setIsMuted(false);
        }

        if (soundRef.current) {
            soundRef.current.volume(isMuted ? 0 : volumeValue);
        }
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        if (isMuted) {
            const restoreVolume = volumeBeforeMute.current;
            setVolume(restoreVolume);
            if (soundRef.current) soundRef.current.volume(restoreVolume);
        } else {
            volumeBeforeMute.current = volume;
            setVolume(0);
            if (soundRef.current) soundRef.current.volume(0);
        }
        setIsMuted(!isMuted);
    }, [isMuted, volume]);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            stopCurrentPlayback();
        };
    }, [stopCurrentPlayback]);

    return (
        <div className="home-container">
            <div className="search-container">
                <SearchBar
                    onSearch={setSearchQuery}
                    placeholder="Buscar canciones..."
                />
                <div className="search-tabs">
                    <button
                        className={activeTab === 'local' ? 'active' : ''}
                        onClick={() => {
                            setActiveTab('local');
                        }}
                    >
                        Mi Biblioteca
                    </button>
                    <button
                        className={activeTab === 'youtube' ? 'active' : ''}
                        onClick={() => {
                            // Pausar al cambiar a YouTube
                            if (currentSong?.source === 'local') {
                                handlePause();
                            }
                            setActiveTab('youtube');
                        }}
                    >
                        YouTube
                    </button>
                </div>
            </div>

            {activeTab === 'local' ? (
                <MyMusic
                    songs={songs.filter(song =>
                        searchQuery.trim()
                            ? song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            song.artist.toLowerCase().includes(searchQuery.toLowerCase())
                            : true
                    )}
                    onPlaySong={handlePlaySong}
                    currentPlayingSong={currentSong}
                    isGlobalPlaying={isPlaying}
                />
            ) : (
                <div className="youtube-content">
                    {/* Reproductor de YouTube con detalles */}
                    {currentSong?.source === 'youtube' && (
                        <div className="youtube-player-container">
                            <YouTube
                                videoId={currentSong.id}
                                opts={{
                                    height: '390',
                                    width: '100%',
                                    playerVars: {
                                        autoplay: 1,
                                        controls: 1,
                                        rel: 0
                                    }
                                }}
                                onReady={(e) => e.target.playVideo()}
                            />
                            <div className="video-details">
                                <h3>{currentSong.title}</h3>
                                <div className="video-meta">
                                    <span>{currentSong.artist}</span>
                                    <div className="video-stats">
                                        <span>⏱️ {formatDuration(currentSong.duration)}</span>
                                        <span>👁️ {formatViews(currentSong.views)}</span>
                                        <span>📅 {formatDate(currentSong.publishedAt)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Lista de videos con título */}
                    <div className="youtube-list-section">
                        <h2 className="section-title">Lista de videos</h2>
                        <SongList
                            songs={youtubeResults}
                            currentSong={currentSong}
                            onPlay={(song) => {
                                setCurrentSong(song);
                                setIsPlaying(true);
                            }}
                            onPause={() => { }}
                            isLoading={isLoadingYouTube}
                            error={youtubeError}
                            horizontal={true}
                        />
                    </div>
                </div>
            )}

            {/* PlayerControls SOLO para audio local */}
            {currentSong?.source === 'local' && activeTab === 'local' && (
                <PlayerControls
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    onPlayPause={() => isPlaying ? handlePause() : handleResume()}
                    onNext={getNextSong}
                    onPrevious={getPreviousSong}
                    progress={progress}
                    onProgressChange={(newProgress) => {
                        if (soundRef.current) {
                            soundRef.current.seek((newProgress / 100) * soundRef.current.duration());
                        }
                        setProgress(newProgress);
                    }}
                    volume={isMuted ? 0 : volume}
                    onVolumeChange={handleVolumeChange}
                    isMuted={isMuted}
                    onToggleMute={toggleMute}
                    currentTime={soundRef.current ? soundRef.current.seek() || 0 : 0}
                    duration={currentSong?.duration || 0}
                />
            )}
        </div>
    );
}