import { useState } from 'react';
import { FaPlay, FaPause, FaTrash } from 'react-icons/fa';
import ViniloDefault from '../assets/images/VINILO.jpeg';
import ConfirmationModal from './ConfirmationModal';
import "../styles/components/SongCard.css";

export default function SongCard({ song, isPlaying, onPlay, onPause, onDelete }) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);

    const getThumbnail = () => {
        if (song.public_id) {
            return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${song.public_id}.jpg`;
        }
        return ViniloDefault;
    };

    const handleDeleteClick = (e) => {
        e.stopPropagation();
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        setShowDeleteModal(false);
        try {
            const success = await onDelete(song.id);
            if (success) {
                console.log("Canción eliminada correctamente");
            }
        } catch (error) {
            console.error("Error en la eliminación:", error);
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

    const handleCancelDelete = () => {
        setShowDeleteModal(false);
    };

    return (
        <>
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
                    onClick={handleDeleteClick}
                    aria-label="Eliminar canción"
                >
                    <FaTrash />
                </button>
            </div>

            {showDeleteModal && (
                <ConfirmationModal
                    message={`¿Seguro que quieres eliminar "${song.title}"?`}
                    onConfirm={handleConfirmDelete}
                    onCancel={handleCancelDelete}
                />
            )}
        </>
    );
}

function formatTime(seconds = 0) {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}