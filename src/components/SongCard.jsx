//import { useState } from 'react';
import { FaPlay, FaPause } from 'react-icons/fa';
import '../styles/components/SongCard.css';

export default function SongCard({ song, isPlaying, onPlay, onPause }) {
    const handlePlayClick = (e) => {
        e.stopPropagation();
        isPlaying ? onPause() : onPlay(song);
    };

    return (
        <div
            className="song-card-horizontal"
            onClick={handlePlayClick}
        >
            <div className="song-image-container-horizontal">
                <img
                    src={song.thumbnail}
                    alt={`Portada de ${song.title}`}
                    className="song-thumbnail-horizontal"
                    onError={(e) => {
                        e.target.src = '/path/to/VINILO.jpeg';
                        e.target.className = 'song-thumbnail-horizontal default-thumbnail';
                    }}
                />
            </div>

            <div className="song-info-horizontal">
                <div className="song-text-horizontal">
                    <h3 className="song-title-horizontal">{song.title}</h3>
                    <p className="song-artist-horizontal">{song.artist}</p>
                </div>

                <button
                    className={`play-button-horizontal ${isPlaying ? 'playing' : ''}`}
                    aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
                >
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </button>
            </div>
        </div>
    );
}