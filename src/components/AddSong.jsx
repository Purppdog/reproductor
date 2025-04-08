import { useState, useRef } from "react";

export default function AddSong({ onSongAdded }) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [uploadProgress, setUploadProgress] = useState(0);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/aac'];
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(selectedFile.type) && !['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension)) {
            setError(`Formato no soportado: ${fileExtension}`);
            e.target.value = "";
            return;
        }

        setFile(selectedFile);
        setError(null);

        if (!title.trim()) {
            setTitle(selectedFile.name.replace(/\.[^/.]+$/, ""));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!file) return setError("Selecciona un archivo de audio");
        if (file.size > 25 * 1024 * 1024) return setError("El archivo excede el límite de 25MB");

        setUploading(true);
        setUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('title', title.trim() || "Sin título");
            formData.append('artist', artist.trim() || "Artista desconocido");

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error(`Error ${response.status}`);

            const data = await response.json();
            setSuccess("Canción subida correctamente");
            onSongAdded(data.song);

            // Resetear formulario
            setTitle("");
            setArtist("");
            setFile(null);
            setUploadProgress(0);
            fileInputRef.current.value = "";

        } catch (err) {
            console.error("Error en la subida:", err);
            setError(err.message || "Error al subir la canción");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="add-song-form">
            <h2>Agregar Canción</h2>

            {error && (
                <div className="alert error">
                    <p>{error}</p>
                    <small>Formatos aceptados: MP3, WAV, OGG, M4A, AAC (Máx. 25MB)</small>
                </div>
            )}

            {success && (
                <div className="alert success">
                    <p>{success}</p>
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
                    <input
                        id="audio-file"
                        type="file"
                        ref={fileInputRef}
                        accept="audio/*"
                        onChange={handleFileChange}
                        required
                    />
                    {file && <small>Archivo seleccionado: {file.name}</small>}
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}></div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploading || !file}
                >
                    {uploading ? "Subiendo..." : "Subir Canción"}
                </button>
            </form>
        </div>
    );
}