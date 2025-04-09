import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import YouTubePlayer from '../components/YouTubePlayer';
import SongList from '../components/SongList';
import MyMusic from '../components/MyMusic';
import PlayerControls from '../components/PlayerControls';
import SearchBar from '../components/SearchBar';
import AddSong from '../components/AddSong';
import '../styles/pages/Home.css';

export default function Home() {
    // Estados
    const [songs, setSongs] = useState([]);
    const [youtubeResults, setYoutubeResults] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showAddSong, setShowAddSong] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('library');
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState({
        youtube: false,
        library: true
    });
    const [error, setError] = useState(null);

    // Refs
    const soundRef = useRef(null);
    const progressInterval = useRef(null);
    const volumeBeforeMute = useRef(volume);
    const searchController = useRef(null);
    const handleNextRef = useRef();
    const handlePlaySongRef = useRef();

    // Funciones helper
    const generateCloudinaryAudioUrl = (publicId) => {
        if (!publicId) return null;
        return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/video/upload/${publicId}`;
    };

    const generateCloudinaryThumbnail = (publicId) => {
        if (!publicId) return null;
        return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${publicId}.jpg`;
    };

    const formatViews = (views) => {
        if (!views) return "0 vistas";
        const num = typeof views === 'string' ? parseInt(views.replace(/\D/g, '')) : views;
        return num.toLocaleString() + " vistas";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    // Control de progreso
    const stopProgressTracker = useCallback(() => {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
    }, []);

    const startProgressTracker = useCallback(() => {
        stopProgressTracker();
        progressInterval.current = setInterval(() => {
            if (soundRef.current?.playing()) {
                const seek = soundRef.current.seek();
                const duration = soundRef.current.duration();
                if (duration > 0) {
                    setProgress((seek / duration) * 100);
                }
            }
        }, 200);
    }, [stopProgressTracker]);

    const stopCurrentPlayback = useCallback(() => {
        if (soundRef.current) {
            soundRef.current.stop();
            soundRef.current.unload();
            soundRef.current = null;
        }
        stopProgressTracker();
        setIsPlaying(false);
    }, [stopProgressTracker]);

    // Control de audio
    const playAudio = useCallback((song) => {
        if (!song?.url) {
            console.error('Intento de reproducir canción sin URL:', song);
            setError({ playback: 'La canción no tiene URL válida' });
            return;
        }

        stopCurrentPlayback();

        soundRef.current = new Howl({
            src: [song.url],
            html5: true,
            volume: isMuted ? 0 : volume,
            onplay: () => {
                setIsPlaying(true);
                startProgressTracker();

                if (!song.duration && soundRef.current) {
                    const duration = soundRef.current.duration();
                    setCurrentSong(prev => ({
                        ...prev,
                        duration: isFinite(duration) ? duration : 0
                    }));
                }
            },
            onpause: () => setIsPlaying(false),
            onend: () => handleNextRef.current?.(),
            onloaderror: (_, err) => {
                console.error('Error al cargar audio:', err);
                setError({ playback: `Error al cargar: ${err.message || 'Verifica la URL'}` });
                setIsPlaying(false);
            },
            onplayerror: (_, err) => {
                console.error('Error al reproducir:', err);
                setError({ playback: `Error al reproducir: ${err.message || 'Formato no soportado'}` });
                setIsPlaying(false);
            }
        });

        try {
            soundRef.current.play();
        } catch (err) {
            console.error('Error al iniciar reproducción:', err);
            setError({ playback: 'Error al iniciar reproducción' });
        }
    }, [volume, isMuted, stopCurrentPlayback, startProgressTracker]);

    // Control de play/pause
    const handlePlayPause = useCallback(() => {
        if (!currentSong) return;

        if (currentSong.source === 'youtube') {
            setIsPlaying(!isPlaying);
        } else {
            if (isPlaying) {
                soundRef.current?.pause();
                setIsPlaying(false);
                stopProgressTracker();
            } else {
                soundRef.current?.play() || playAudio(currentSong);
                setIsPlaying(true);
                startProgressTracker();
            }
        }
    }, [currentSong, isPlaying, playAudio, startProgressTracker, stopProgressTracker]);

    // Manejo de reproducción
    const handlePlaySong = useCallback((song) => {
        // Si no hay canción, detener todo
        if (!song) {
            stopCurrentPlayback();
            setCurrentSong(null);
            setIsPlaying(false);
            return;
        }

        // Si intentamos reproducir un video de YouTube fuera de su pestaña, ignorar
        if (song.source === 'youtube' && activeTab !== 'youtube') {
            return;
        }

        // Si es la misma canción, pausar/reanudar
        if (currentSong?.id === song.id) {
            handlePlayPause();
            return;
        }

        // Configurar nueva canción
        setCurrentSong(song);
        setProgress(0);

        // Manejar reproducción según el tipo
        if (song.source === 'youtube') {
            stopCurrentPlayback(); // Asegurarse de detener audio local
            setIsPlaying(true); // Iniciar reproducción de YouTube
        } else {
            playAudio(song); // Reproducir audio local
        }
    }, [currentSong, activeTab, stopCurrentPlayback, handlePlayPause, playAudio]);

    useEffect(() => {
        handlePlaySongRef.current = handlePlaySong;
    }, [handlePlaySong]);

    // Navegación entre canciones
    const getNextSong = useCallback(() => {
        const list = activeTab === 'library' ? songs : youtubeResults;
        if (!list.length) return null;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        return list[(currentIndex + 1) % list.length];
    }, [currentSong, activeTab, songs, youtubeResults]);

    const handleNext = useCallback(() => {
        const nextSong = getNextSong();
        if (nextSong) handlePlaySongRef.current(nextSong);
    }, [getNextSong]);

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    const handlePrevious = useCallback(() => {
        const list = activeTab === 'library' ? songs : youtubeResults;
        if (!list.length) return;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        const prevIndex = (currentIndex - 1 + list.length) % list.length;
        handlePlaySongRef.current(list[prevIndex]);
    }, [currentSong, activeTab, songs, youtubeResults]);

    // Control de volumen
    const handleVolumeChange = useCallback((newVolume) => {
        const vol = Math.max(0, Math.min(newVolume, 1));
        setVolume(vol);
        if (soundRef.current) soundRef.current.volume(isMuted ? 0 : vol);
        if (isMuted && vol > 0) setIsMuted(false);
    }, [isMuted]);

    const toggleMute = useCallback(() => {
        if (isMuted) {
            handleVolumeChange(volumeBeforeMute.current);
        } else {
            volumeBeforeMute.current = volume;
            handleVolumeChange(0);
        }
        setIsMuted(!isMuted);
    }, [isMuted, volume, handleVolumeChange]);

    // Búsqueda en YouTube
    const searchYouTube = useCallback(async (query) => {
        if (!query.trim()) {
            setYoutubeResults([]);
            return;
        }

        if (searchController.current) {
            searchController.current.abort();
        }
        searchController.current = new AbortController();

        setLoading(prev => ({ ...prev, youtube: true }));
        setError(null);

        try {
            const response = await fetch(
                `${import.meta.env.VITE_API_URL}/api/youtube-search?q=${encodeURIComponent(query)}`,
                { signal: searchController.current.signal }
            );

            if (!response.ok) throw new Error('Error en búsqueda');

            const data = await response.json();
            setYoutubeResults(data.items.map(video => ({
                id: video.id.videoId,
                title: video.snippet.title,
                artist: video.snippet.channelTitle,
                thumbnail: video.snippet.thumbnails.medium?.url,
                duration: video.contentDetails?.duration,
                views: video.statistics?.viewCount,
                publishedAt: video.snippet.publishedAt,
                source: 'youtube'
            })));
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError({ youtube: err.message });
            }
        } finally {
            setLoading(prev => ({ ...prev, youtube: false }));
        }
    }, []);

    // Carga inicial de canciones
    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`);
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);

                const data = await response.json();
                const processedSongs = data.map(song => {
                    const publicId = song.cloudinary_public_id;
                    const audioUrl = song.cloudinary_url || generateCloudinaryAudioUrl(publicId);

                    if (!audioUrl) {
                        console.warn('Canción sin URL válida:', song);
                        return null;
                    }

                    return {
                        id: song.id.toString(),
                        title: song.title || "Sin título",
                        artist: song.artist || "Artista desconocido",
                        url: audioUrl,
                        thumbnail: generateCloudinaryThumbnail(publicId),
                        duration: Number(song.duration) || 0,
                        public_id: publicId,
                        source: song.source_type || 'cloudinary'
                    };
                }).filter(Boolean);

                setSongs(processedSongs);
            } catch (err) {
                console.error("Error al cargar biblioteca:", err);
                setError({ library: err.message });
            } finally {
                setLoading(prev => ({ ...prev, library: false }));
            }
        };

        fetchLibrary();
    }, []);

    // Limpieza al desmontar
    useEffect(() => {
        return () => {
            if (soundRef.current) {
                soundRef.current.unload();
                soundRef.current = null;
            }
            stopProgressTracker();
            if (searchController.current) {
                searchController.current.abort();
            }
        };
    }, [stopProgressTracker]);

    // Efectos secundarios
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'youtube') searchYouTube(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, searchYouTube]);

    // Función para cambiar de pestaña
    const handleTabChange = (tab) => {
        stopCurrentPlayback();

        if (activeTab !== tab) {
            setCurrentSong(null);
            setIsPlaying(false);
        }

        // Cambiar la pestaña activa
        setActiveTab(tab);
    };

    // Render
    return (
        <div className="home-container">
            <div className="search-container">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={`Buscar en ${activeTab === 'library' ? 'mi biblioteca' : 'YouTube'}`}
                />

                <div className="header-actions">
                    <div className="tabs">
                        <button
                            className={activeTab === 'library' ? 'active' : ''}
                            onClick={() => handleTabChange('library')}
                        >
                            Mi Biblioteca
                        </button>
                        <button
                            className={activeTab === 'youtube' ? 'active' : ''}
                            onClick={() => handleTabChange('youtube')}
                        >
                            YouTube
                        </button>
                    </div>
                </div>
            </div>

            {error?.library && (
                <div className="error-message">
                    {error.library}
                </div>
            )}

            {error?.success && (
                <div className="success-message">
                    {error.success}
                </div>
            )}

            {activeTab === 'library' ? (
                <MyMusic
                    songs={songs.filter(song =>
                        searchQuery.trim()
                            ? song.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            song.artist?.toLowerCase().includes(searchQuery.toLowerCase())
                            : true
                    )}
                    onPlaySong={handlePlaySong}
                    currentPlayingSong={currentSong}
                    isGlobalPlaying={isPlaying}
                    showAddSong={showAddSong}
                    setShowAddSong={setShowAddSong}
                />
            ) : (
                <div className="youtube-content">
                    {error?.youtube && (
                        <div className="error-message">
                            Error en YouTube: {error.youtube}
                        </div>
                    )}

                    {currentSong?.source === 'youtube' && (
                        <div className="youtube-player-container">
                            <div className="youtube-player-wrapper">
                                <YouTubePlayer
                                    videoId={currentSong.id}
                                    isPlaying={isPlaying}
                                    onPlay={() => setIsPlaying(true)}
                                    onPause={() => setIsPlaying(false)}
                                    onEnd={handleNext}
                                    volume={volume}
                                    isMuted={isMuted}
                                    opts={{
                                        playerVars: {
                                            autoplay: isPlaying ? 1 : 0,
                                            controls: 1,
                                            modestbranding: 1,
                                            rel: 0
                                        }
                                    }}
                                />
                            </div>
                            <div className="video-info">
                                <h3 className="truncate">{currentSong.title}</h3>
                                <p className="artist">{currentSong.artist}</p>
                                <div className="video-stats">
                                    <span>{formatViews(currentSong.views)}</span>
                                    <span>{formatDate(currentSong.publishedAt)}</span>
                                </div>
                            </div>
                        </div>
                    )}
                    <SongList
                        songs={youtubeResults}
                        currentSong={currentSong}
                        onPlay={(song) => {
                            // Solo permite reproducir si estamos en YouTube
                            if (activeTab === 'youtube') {
                                handlePlaySong(song);
                            }
                        }}
                        isLoading={loading.youtube}
                        error={error?.youtube}
                    />
                </div>
            )}

            {/* Reproductor solo visible para canciones locales en la biblioteca */}
            {currentSong && activeTab === 'library' && currentSong?.source !== 'youtube' && (
                <PlayerControls
                    currentSong={currentSong}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onPlayPause={handlePlayPause}
                    isPlaying={isPlaying}
                    progress={progress}
                    onSeek={(newProgress) => {
                        if (soundRef.current) {
                            const newTime = (newProgress / 100) * soundRef.current.duration();
                            soundRef.current.seek(newTime);
                        }
                        setProgress(newProgress);
                    }}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    isMuted={isMuted}
                    onToggleMute={toggleMute}
                    duration={currentSong?.duration || 0}
                />
            )}
        </div>
    );
}