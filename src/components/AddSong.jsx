import { useState } from "react";
export default function AddSong({ onSongAdded }) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        // Validación mejorada de tipos de archivo
        const validTypes = [
            'audio/mpeg', // MP3
            'audio/wav',  // WAV
            'audio/ogg',  // OGG
            'audio/x-m4a', // M4A
            'audio/aac',   // AAC
            'audio/x-aac', // AAC alternativo
            'audio/x-m4a'  // M4A alternativo
        ];

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        const isValidType = validTypes.includes(selectedFile.type) ||
            ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension);

        if (!isValidType) {
            setError(`Formato no soportado: ${selectedFile.type || fileExtension}`);
            e.target.value = "";
            return;
        }

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
        setSuccess(null);

        if (!file) return setError("Selecciona un archivo de audio");
        if (file.size > 15 * 1024 * 1024) {
            return setError("El archivo excede el límite de 15MB");
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
                throw new Error(errorData.error || `Error ${response.status}`);
            }

            const data = await response.json();
            setSuccess("Canción subida correctamente");
            onSongAdded(data.song);

            // Resetear formulario
            setTitle("");
            setArtist("");
            setFile(null);
            document.getElementById("audio-file").value = "";

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
                <div className="error-message">
                    <p>{error}</p>
                    <small>Formatos aceptados: MP3, WAV, OGG, M4A, AAC (Máx. 15MB)</small>
                </div>
            )}

            {success && (
                <div className="success-message">
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
                        maxLength={100}
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
                        maxLength={100}
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="audio-file">Archivo de audio:</label>
                    <input
                        id="audio-file"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        required
                    />
                    {file && (
                        <small>
                            Archivo seleccionado: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                        </small>
                    )}
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    aria-busy={uploading}
                >
                    {uploading ? "Subiendo..." : "Subir Canción"}
                </button>
            </form>
        </div>
    );
}