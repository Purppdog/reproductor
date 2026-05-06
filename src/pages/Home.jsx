import { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { Howl } from 'howler';
import YouTubePlayer from '../components/YouTubePlayer';
import SongList from '../components/SongList';
import MyMusic from '../components/MyMusic';
import PlayerControls from '../components/PlayerControls';
import SearchBar from '../components/SearchBar';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Home.css';

export default function Home() {
    const { isAuthenticated, token } = useAuth();

    // Estados
    const [songs, setSongs] = useState([]);
    const [youtubeResults, setYoutubeResults] = useState([]);
    const [currentSong, setCurrentSong] = useState(null);
    const [isPlaying, setIsPlaying] = useState(false);
    const [showAddSong, setShowAddSong] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('youtube');
    const [volume, setVolume] = useState(0.7);
    const [isMuted, setIsMuted] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loading, setLoading] = useState({ youtube: false, library: true });
    const [error, setError] = useState(null);
    const [isShuffled, setIsShuffled] = useState(false);
    const [repeatMode, setRepeatMode] = useState('none');

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
                if (duration > 0) setProgress((seek / duration) * 100);
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

    const playAudio = useCallback((song) => {
        if (!song?.url) {
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
                setError({ playback: `Error al cargar audio` });
                setIsPlaying(false);
            },
            onplayerror: (_, err) => {
                setError({ playback: `Error al reproducir` });
                setIsPlaying(false);
            }
        });
        soundRef.current.play();
    }, [volume, isMuted, stopCurrentPlayback, startProgressTracker]);

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

    const handleDeleteSong = useCallback(async (songId) => {
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic/${songId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}` // ⬅️ ahora sí tenemos token real
                }
            });
            if (!response.ok) throw new Error('Error al eliminar canción');
            if (currentSong?.id === songId.toString()) {
                stopCurrentPlayback();
                setCurrentSong(null);
                setIsPlaying(false);
            }
            setSongs(prev => prev.filter(song => song.id !== songId.toString()));
            return true;
        } catch (error) {
            setError({ library: error.message });
            return false;
        }
    }, [currentSong, stopCurrentPlayback, token]);

    const handlePlaySong = useCallback((song) => {
        if (!song) {
            stopCurrentPlayback();
            setCurrentSong(null);
            setIsPlaying(false);
            return;
        }
        if (song.source === 'youtube' && activeTab !== 'youtube') return;
        if (currentSong?.id === song.id) {
            handlePlayPause();
            return;
        }
        setCurrentSong(song);
        setProgress(0);
        if (song.source === 'youtube') {
            stopCurrentPlayback();
            setIsPlaying(true);
        } else {
            playAudio(song);
        }
    }, [currentSong, activeTab, stopCurrentPlayback, handlePlayPause, playAudio]);

    useEffect(() => {
    if (isAuthenticated) {
        setActiveTab('library');
    } else {
        setActiveTab('youtube');
    }
}, [isAuthenticated]);

    useEffect(() => { handlePlaySongRef.current = handlePlaySong; }, [handlePlaySong]);

    const getNextSong = useCallback(() => {
        const list = activeTab === 'library' ? songs : youtubeResults;
        if (!list.length) return null;
        if (repeatMode === 'one') return currentSong;
        if (isShuffled) {
            const otherSongs = list.filter(s => s.id !== currentSong?.id);
            if (!otherSongs.length) return currentSong;
            return otherSongs[Math.floor(Math.random() * otherSongs.length)];
        }
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        const nextIndex = currentIndex + 1;
        if (nextIndex >= list.length) return repeatMode === 'all' ? list[0] : null;
        return list[nextIndex];
    }, [currentSong, activeTab, songs, youtubeResults, isShuffled, repeatMode]);

    const handleNext = useCallback(() => {
        const nextSong = getNextSong();
        if (nextSong) handlePlaySongRef.current(nextSong);
    }, [getNextSong]);

    useEffect(() => { handleNextRef.current = handleNext; }, [handleNext]);

    const handlePrevious = useCallback(() => {
        const list = activeTab === 'library' ? songs : youtubeResults;
        if (!list.length) return;
        const currentIndex = list.findIndex(s => s.id === currentSong?.id);
        const prevIndex = (currentIndex - 1 + list.length) % list.length;
        handlePlaySongRef.current(list[prevIndex]);
    }, [currentSong, activeTab, songs, youtubeResults]);

    const handleVolumeChange = useCallback((newVolume) => {
        const vol = Math.max(0, Math.min(newVolume, 1));
        setVolume(vol);
        setIsMuted(false);
        if (soundRef.current) soundRef.current.volume(vol);
    }, []);

    const toggleMute = useCallback(() => {
        if (isMuted) {
            const restoredVol = volumeBeforeMute.current || 0.7;
            setIsMuted(false);
            setVolume(restoredVol);
            if (soundRef.current) soundRef.current.volume(restoredVol);
        } else {
            volumeBeforeMute.current = volume;
            setIsMuted(true);
            if (soundRef.current) soundRef.current.volume(0);
        }
    }, [isMuted, volume]);

    const handleToggleShuffle = useCallback(() => setIsShuffled(prev => !prev), []);

    const handleToggleRepeat = useCallback(() => {
        setRepeatMode(prev => {
            if (prev === 'none') return 'all';
            if (prev === 'all') return 'one';
            return 'none';
        });
    }, []);

    const searchYouTube = useCallback(async (query) => {
        if (!query.trim()) { setYoutubeResults([]); return; }
        if (searchController.current) searchController.current.abort();
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
            if (err.name !== 'AbortError') setError({ youtube: err.message });
        } finally {
            setLoading(prev => ({ ...prev, youtube: false }));
        }
    }, []);

    // ✅ Carga canciones solo si está autenticado
    useEffect(() => {
        if (!isAuthenticated) {
            setLoading(prev => ({ ...prev, library: false }));
            return;
        }
        const fetchLibrary = async () => {
            try {
                const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`, {
                    headers: { 'Authorization': `Bearer ${token}` }
                });
                if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
                const data = await response.json();
                const processedSongs = data.map(song => {
                    const publicId = song.cloudinary_public_id;
                    const audioUrl = song.cloudinary_url || generateCloudinaryAudioUrl(publicId);
                    if (!audioUrl) return null;
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
                setError({ library: err.message });
            } finally {
                setLoading(prev => ({ ...prev, library: false }));
            }
        };
        fetchLibrary();
    }, [isAuthenticated, token]);

    useEffect(() => {
        return () => {
            if (soundRef.current) { soundRef.current.unload(); soundRef.current = null; }
            stopProgressTracker();
            if (searchController.current) searchController.current.abort();
        };
    }, [stopProgressTracker]);

    useEffect(() => {
        const timer = setTimeout(() => {
            if (activeTab === 'youtube') searchYouTube(searchQuery);
        }, 500);
        return () => clearTimeout(timer);
    }, [searchQuery, activeTab, searchYouTube]);

    const handleTabChange = (tab) => {
    stopCurrentPlayback();
    if (activeTab !== tab) {
        setCurrentSong(null);
        setIsPlaying(false);
        setSearchQuery('');
    }
    setActiveTab(tab); // ⬅️ permite cambiar a library siempre
};

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

            {error?.library && <div className="error-message">{error.library}</div>}

            {/* ✅ Mensaje si no está autenticado y quiere ver biblioteca */}
            {activeTab === 'library' && !isAuthenticated ? (
                <div className="auth-required">
                    <div className="auth-required-content">
                        <span className="auth-required-icon">🎵</span>
                        <h2>Tu biblioteca personal</h2>
                        <p>Inicia sesión para acceder a tu música, subir canciones y crear tu biblioteca personal.</p>
                    </div>
                </div>
            ) : activeTab === 'library' ? (
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
                    onDeleteSong={handleDeleteSong}
                />
            ) : (
                <div className="youtube-content">
                    {error?.youtube && <div className="error-message">Error en YouTube: {error.youtube}</div>}
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
                            if (activeTab === 'youtube') handlePlaySong(song);
                        }}
                        isLoading={loading.youtube}
                        error={error?.youtube}
                    />
                </div>
            )}

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
                    isShuffled={isShuffled}
                    onToggleShuffle={handleToggleShuffle}
                    repeatMode={repeatMode}
                    onToggleRepeat={handleToggleRepeat}
                />
            )}
        </div>
    );
}