import { useState, useRef } from "react";
import './AddSong.css';

export default function AddSong({ onSongAdded, onClose }) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        setFile(selectedFile);
        setError(null);

        // Autocompletar título si está vacío
        if (!title.trim()) {
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!file) {
            setError("Debes seleccionar un archivo de audio");
            return;
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('title', title.trim() || "Sin título");
            formData.append('artist', artist.trim() || "Artista desconocido");

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.message || `Error ${response.status}`);
            }

            const data = await response.json();
            onSongAdded(data.song);

            // Resetear formulario
            setTitle("");
            setArtist("");
            setFile(null);
            fileInputRef.current.value = "";

        } catch (err) {
            console.error("Error en la subida:", err);
            setError(err.message || "Error al subir la canción");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="add-song-modal">
            <div className="add-song-content">
                <button className="close-button" onClick={onClose}>×</button>
                <h2>Agregar Canción</h2>

                {error && (
                    <div className="alert error">
                        <p>{error}</p>
                        <small>Por favor, verifica los datos e intenta nuevamente</small>
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="form-group">
                        <label htmlFor="title">Título:</label>
                        <input
                            id="title"
                            type="text"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            placeholder="Nombre de la canción"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="artist">Artista:</label>
                        <input
                            id="artist"
                            type="text"
                            value={artist}
                            onChange={(e) => setArtist(e.target.value)}
                            placeholder="Nombre del artista"
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label htmlFor="audio-file">Archivo de audio:</label>
                        <div className="file-input-container">
                            <input
                                id="audio-file"
                                type="file"
                                ref={fileInputRef}
                                accept="audio/*"
                                onChange={handleFileChange}
                                className="file-input"
                                required
                            />
                            <label htmlFor="audio-file" className="file-input-label">
                                <span>Seleccionar archivo</span>
                                <small>Formatos soportados: MP3, WAV, FLAC, etc.</small>
                            </label>
                            {file && (
                                <div className="file-info">
                                    {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="form-actions">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={uploading}
                            className="cancel-button"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            disabled={uploading || !file}
                            className="submit-button"
                        >
                            {uploading ? (
                                <>
                                    <span className="spinner" />
                                    Subiendo...
                                </>
                            ) : "Subir Canción"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}