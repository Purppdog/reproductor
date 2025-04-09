import { FaPlay, FaPause, FaTrash } from 'react-icons/fa';
import ViniloDefault from '../assets/images/VINILO.jpeg';
import "../styles/components/SongCard.css";

export default function SongCard({
    song,
    isPlaying,
    onPlay,
    onPause,
    onDelete
}) {
    const getThumbnail = () => {
        if (song.public_id) {
            return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${song.public_id}.jpg`;
        }
        return ViniloDefault;
    };

    const handleDelete = async (e) => {
        e.stopPropagation();

        try {
            if (window.confirm(`¿Seguro que quieres eliminar "${song.title}"?`)) {
                const success = await onDelete(song.id);

                if (success) {
                    // Opcional: Mostrar notificación de éxito
                    console.log("Canción eliminada correctamente");
                }
            }
        } catch (error) {
            console.error("Error en la eliminación:", error);

            // Mostrar mensaje más descriptivo
            let errorMessage = "No se pudo eliminar la canción. ";

            if (error.message.includes("500")) {
                errorMessage += "Error interno del servidor.";
            } else if (error.message.includes("401")) {
                errorMessage += "No autorizado. Por favor inicia sesión nuevamente.";
            } else {
                errorMessage += error.message;
            }

            alert(errorMessage);
        }
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
                        e.target.src = ViniloDefault;
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
            <button
                className="delete-button"
                onClick={handleDelete}
                aria-label="Eliminar canción"
            >
                <FaTrash />
            </button>
        </div>
    );
}

function formatTime(seconds = 0) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}