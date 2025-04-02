import { FaPlay, FaPause } from 'react-icons/fa';
import ViniloImage from '../assets/images/VINILO.jpeg';
import '../styles/components/SongCard.css';

export default function SongCard({ song, isPlaying, onPlay, onPause }) {
    const handlePlayClick = (e) => {
        e.stopPropagation();
        isPlaying ? onPause() : onPlay(song);
    };

    return (
        <div className="song-card-container" onClick={handlePlayClick}>
            <div className="thumbnail-wrapper">
                <img
                    src={song.thumbnail || ViniloImage}
                    alt={`Portada de ${song.title}`}
                    className="song-thumbnail"
                    onError={(e) => {
                        e.target.src = ViniloImage;
                        e.target.classList.add('default-thumbnail');
                    }}
                />
            </div>

            <div className="song-info">
                <h3 className="song-title">{song.title}</h3>
                <div className="song-meta">
                    <p className="song-artist">{song.artist || 'Artista desconocido'}</p>
                    <div className="song-stats">
                        {song.views && <span>{song.views}</span>}
                        {song.date && <span>{song.date}</span>}
                    </div>
                </div>
            </div>
        </div>
    );
}