import { useState, useEffect } from "react";
import YouTube from "react-youtube";
import "../styles/pages/Library.css";

export default function Library() {
    const [playlist, setPlaylist] = useState([]);
    const [currentVideo, setCurrentVideo] = useState(null); // Video actual

    useEffect(() => {
        const storedPlaylist = localStorage.getItem("playlist");
        if (storedPlaylist) {
            setPlaylist(JSON.parse(storedPlaylist));
        }
    }, []);

    const removeFromPlaylist = (id) => {
        const updatedPlaylist = playlist.filter((song) => song.id !== id);
        setPlaylist(updatedPlaylist);
        localStorage.setItem("playlist", JSON.stringify(updatedPlaylist));

        if (currentVideo && currentVideo.id === id) {
            setCurrentVideo(null);
        }
    };

    const playVideo = (song) => {
        setCurrentVideo(song);
    };

    return (
        <div className="library-container">
            <h2>Mi Playlist</h2>
            {playlist.length === 0 ? (
                <p>No tienes canciones en tu playlist.</p>
            ) : (
                <ul>
                    {playlist.map((song) => (
                        <li key={song.id}>
                            <button className="play-btn" onClick={() => playVideo(song)}>
                                ▶️ {song.title}
                            </button>
                            <button className="remove-btn" onClick={() => removeFromPlaylist(song.id)}>❌</button>
                        </li>
                    ))}
                </ul>
            )}

            {currentVideo && (
                <div className="youtube-player">
                    <h3>Reproduciendo: {currentVideo.title}</h3>
                    <YouTube
                        videoId={currentVideo.url.split("v=")[1] || currentVideo.id}
                        opts={{
                            width: "100%",
                            playerVars: { autoplay: 1, controls: 1 }
                        }}
                    />
                </div>
            )}
        </div>
    );
}
