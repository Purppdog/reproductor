import { FaPlay, FaPause } from 'react-icons/fa';
import ViniloDefault from '../assets/images/VINILO.jpeg';

export default function SongCard({ song, isPlaying, onPlay, onPause }) {
    const getThumbnail = () => {
        // Intenta usar la miniatura de Cloudinary si existe
        if (song.public_id) {
            return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${song.public_id}.jpg`;
        }
        return ViniloDefault; // Fallback a imagen local
    };

    return (
        <div
            className={`song-card ${isPlaying ? 'playing' : ''}`}
            onClick={() => isPlaying ? onPause() : onPlay(song)}
            role="button"
            tabIndex={0}
        >
            <div className="thumbnail-container">
                <img
                    src={getThumbnail()}
                    alt={`Portada de ${song.title}`}
                    onError={(e) => {
                        e.target.src = ViniloDefault; // Doble fallback
                        e.target.classList.add('default-thumb');
                    }}
                />
                <div className="play-icon">
                    {isPlaying ? <FaPause /> : <FaPlay />}
                </div>
            </div>
            <div className="song-info">
                <h3>{song.title}</h3>
                <p>{song.artist}</p>
                <span>{formatTime(song.duration)}</span>
            </div>
        </div>
    );
}

function formatTime(seconds = 0) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}