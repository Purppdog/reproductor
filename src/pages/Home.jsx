import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import YouTubePlayer from '../components/YouTubePlayer';
import SongList from '../components/SongList';
import MyMusic from '../components/MyMusic';
import PlayerControls from '../components/PlayerControls';
import SearchBar from '../components/SearchBar';
import '../styles/pages/Home.css';

export default function Home() {
    const [songs, setSongs] = useState([]);
    const [youtubeResults, setYoutubeResults] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
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

    // Cargar canciones iniciales
    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`);
                const data = await response.json();

                setSongs(data.map(song => ({
                    ...song,
                    id: song.id || song.public_id,
                    source: 'cloudinary',
                    thumbnail: song.thumbnail || generateCloudinaryThumbnail(song.public_id)
                })));
            } catch (err) {
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
    }, []);

    // Detener audio local al cambiar a YouTube
    useEffect(() => {
        if (activeTab === 'youtube' && currentSong?.source !== 'youtube') {
            stopCurrentPlayback();
        }
    }, [activeTab]);

    // Generar thumbnail desde Cloudinary con fallback
    const generateCloudinaryThumbnail = (publicId) => {
        if (!publicId) return null;
        return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${publicId}.jpg`;
    };

    // Buscar en YouTube con cancelación
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

    // Búsqueda con debounce
    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'youtube') searchYouTube(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, searchYouTube]);

    // Reproducción de audio (Howler)
    const playAudio = useCallback((song) => {
        stopCurrentPlayback();

        soundRef.current = new Howl({
            src: [song.url],
            html5: true,
            volume: isMuted ? 0 : volume,
            onplay: () => {
                setIsPlaying(true);
                startProgressTracker();
                if (!currentSong?.duration) {
                    setCurrentSong(prev => ({
                        ...prev,
                        duration: soundRef.current.duration()
                    }));
                }
            },
            onpause: () => setIsPlaying(false),
            onend: () => handleNext(),
            onloaderror: (_, err) => {
                console.error('Error al cargar audio:', err);
                setError({ playback: 'Error al cargar el audio' });
                setIsPlaying(false);
            }
        });

        soundRef.current.play();
    }, [volume, isMuted]);

    // Control principal de reproducción
    const handlePlaySong = useCallback((song) => {
        if (!song) return;

        if (currentSong && currentSong.id !== song.id) {
            if (currentSong.source !== 'youtube') {
                stopCurrentPlayback();
            }
            setIsPlaying(false);
        }

        setCurrentSong(song);
        setIsPlaying(true);
        setProgress(0);

        song.source === 'youtube'
            ? setIsPlaying(true)
            : playAudio(song);
    }, [currentSong, playAudio]);

    // Navegación entre canciones
    const getNextSong = useCallback(() => {
        const list = activeTab === 'library' ? songs : youtubeResults;
        if (!list.length) return null;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        return list[(currentIndex + 1) % list.length];
    }, [currentSong, activeTab, songs, youtubeResults]);

    const handleNext = useCallback(() => {
        const nextSong = getNextSong();
        if (nextSong) handlePlaySong(nextSong);
    }, [getNextSong, handlePlaySong]);

    const handlePrevious = useCallback(() => {
        const list = activeTab === 'library' ? songs : youtubeResults;
        if (!list.length) return;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        const prevIndex = (currentIndex - 1 + list.length) % list.length;
        handlePlaySong(list[prevIndex]);
    }, [currentSong, activeTab, songs, youtubeResults, handlePlaySong]);

    // Control de progreso (Howler)
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
        }, 200); // Actualización más frecuente
    }, []);

    const stopProgressTracker = useCallback(() => {
        clearInterval(progressInterval.current);
        progressInterval.current = null;
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

    // Funciones auxiliares
    const handlePause = useCallback(() => {
        if (soundRef.current) soundRef.current.pause();
        setIsPlaying(false);
        stopProgressTracker();
    }, []);

    const handleResume = useCallback(() => {
        if (soundRef.current) soundRef.current.play();
        setIsPlaying(true);
        startProgressTracker();
    }, []);

    const formatViews = (views) => {
        if (!views) return "0 vistas";
        const num = typeof views === 'string' ? parseInt(views.replace(/\D/g, '')) : views;
        return num.toLocaleString() + " vistas";
    };

    const formatDate = (dateString) => {
        if (!dateString) return "";
        return new Date(dateString).toLocaleDateString('es-ES');
    };

    return (
        <div className="home-container">
            <div className="search-container">
                <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    placeholder={`Buscar en ${activeTab === 'library' ? 'mi biblioteca' : 'YouTube'}`}
                />

                <div className="tabs">
                    <button
                        className={activeTab === 'library' ? 'active' : ''}
                        onClick={() => setActiveTab('library')}
                    >
                        Mi Biblioteca
                    </button>
                    <button
                        className={activeTab === 'youtube' ? 'active' : ''}
                        onClick={() => setActiveTab('youtube')}
                    >
                        YouTube
                    </button>
                </div>
            </div>

            {error?.library && (
                <div className="error-message">
                    Error al cargar biblioteca: {error.library}
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
                    loading={loading.library}
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
                            <YouTubePlayer
                                videoId={currentSong.id}
                                isPlaying={isPlaying}
                                onPlay={() => setIsPlaying(true)}
                                onPause={() => setIsPlaying(false)}
                                onEnd={handleNext}
                                volume={volume}
                                isMuted={isMuted}
                            />
                            <div className="video-info">
                                <h3>{currentSong.title}</h3>
                                <p>{currentSong.artist}</p>
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
                        onPlay={handlePlaySong}
                        onPause={() => setIsPlaying(false)}
                        isLoading={loading.youtube}
                        error={error?.youtube}
                    />
                </div>
            )}

            {currentSong?.source !== 'youtube' && currentSong && (
                <PlayerControls
                    currentSong={currentSong}
                    isPlaying={isPlaying}
                    onPlayPause={() => isPlaying ? handlePause() : handleResume()}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    progress={progress}
                    onProgressChange={(newProgress) => {
                        if (soundRef.current) {
                            soundRef.current.seek((newProgress / 100) * soundRef.current.duration());
                        }
                        setProgress(newProgress);
                    }}
                    volume={volume}
                    onVolumeChange={handleVolumeChange}
                    isMuted={isMuted}
                    onToggleMute={toggleMute}
                    currentTime={soundRef.current?.seek() || 0}
                    duration={currentSong.duration || 0}
                />
            )}
        </div>
    );
}