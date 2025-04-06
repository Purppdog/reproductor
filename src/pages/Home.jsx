import { useState, useEffect, useRef, useCallback } from 'react';
import { Howl } from 'howler';
import YouTubePlayer from '../components/YouTubePlayer';
import SongList from '../components/SongList';
import MyMusic from '../components/MyMusic';
import PlayerControls from '../components/PlayerControls';
import SearchBar from '../components/SearchBar';
import '../styles/pages/Home.css';

export default function Home() {
    // Estados
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
    const handleNextRef = useRef();

    // Funciones helper (sin dependencias)
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

    // Funciones de control de reproducción
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

    // Funciones de navegación de canciones
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

    useEffect(() => {
        handleNextRef.current = handleNext;
    }, [handleNext]);

    const handlePrevious = useCallback(() => {
        const list = activeTab === 'library' ? songs : youtubeResults;
        if (!list.length) return;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        const prevIndex = (currentIndex - 1 + list.length) % list.length;
        handlePlaySong(list[prevIndex]);
    }, [currentSong, activeTab, songs, youtubeResults, handlePlaySong]);

    // Funciones de control de audio
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
            onend: () => handleNextRef.current(),
            onloaderror: (_, err) => {
                console.error('Error al cargar audio:', err);
                setError({ playback: 'Error al cargar el audio' });
                setIsPlaying(false);
            },
            onplayerror: () => {
                console.error('Error al reproducir audio');
                setError({ playback: 'Error al reproducir el audio' });
                setIsPlaying(false);
            }
        });

        soundRef.current.play();
    }, [volume, isMuted, currentSong?.duration, stopCurrentPlayback, startProgressTracker]);

    // Función principal de reproducción
    const handlePlaySong = useCallback((song) => {
        if (!song) return;

        if (currentSong && currentSong.id !== song.id) {
            if (currentSong.source !== 'youtube') {
                stopCurrentPlayback();
            }
            setIsPlaying(false);
        }

        setCurrentSong(song);
        setProgress(0);

        if (song.source === 'youtube') {
            setIsPlaying(true);
        } else {
            playAudio(song);
        }
    }, [currentSong, playAudio, stopCurrentPlayback]);

    // Control de volumen y mute
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
                if (soundRef.current) {
                    soundRef.current.play();
                } else {
                    playAudio(currentSong);
                }
                setIsPlaying(true);
                startProgressTracker();
            }
        }
    }, [currentSong, isPlaying, playAudio, startProgressTracker, stopProgressTracker]);

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

    // Efectos
    useEffect(() => {
        const fetchLibrary = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`);
                const data = await response.json();

                setSongs(data.map(song => ({
                    ...song,
                    id: song.id || song.public_id,
                    source: 'cloudinary',
                    thumbnail: song.thumbnail || generateCloudinaryThumbnail(song.public_id),
                    url: song.url || generateCloudinaryAudioUrl(song.public_id)
                })));
            } catch (err) {
                setError({ library: err.message });
            } finally {
                setLoading(prev => ({ ...prev, library: false }));
            }
        };

        fetchLibrary();
    }, []);

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

    useEffect(() => {
        if (activeTab === 'youtube' && currentSong?.source !== 'youtube') {
            stopCurrentPlayback();
        }
    }, [activeTab, currentSong?.source, stopCurrentPlayback]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'youtube') searchYouTube(searchQuery);
        }, 500);

        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, searchYouTube]);

    // Render
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

            {(currentSong && (currentSong.source !== 'youtube' || isPlaying)) && (
                <PlayerControls
                    currentSong={currentSong}
                    onNext={handleNext}
                    onPrevious={handlePrevious}
                    onPlayPause={handlePlayPause}
                    isPlaying={isPlaying}
                    progress={progress}
                    onSeek={(newProgress) => {
                        if (currentSong.source === 'youtube') return;

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
                    duration={currentSong.duration || 0}
                />
            )}
        </div>
    );
}