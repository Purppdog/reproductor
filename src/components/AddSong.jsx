import { useState } from "react";

export default function AddSong({ onSongAdded }) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        if (!file) {
            setError("Por favor, selecciona un archivo de audio.");
            return;
        }

        // Validar tamaño del archivo (10MB máximo)
        const MAX_FILE_SIZE = 10 * 1024 * 1024;
        if (file.size > MAX_FILE_SIZE) {
            setError("El archivo es demasiado grande (máximo 10MB)");
            return;
        }

        // Validar tipo de archivo
        const allowedTypes = [
            'audio/mpeg', // MP3
            'audio/wav',  // WAV
            'audio/ogg',  // OGG
            'audio/x-m4a', // M4A
            'audio/webm'  // WEBM
        ];

        if (!allowedTypes.includes(file.type)) {
            setError("Formato de audio no soportado. Use MP3, WAV, OGG, M4A o WEBM.");
            return;
        }

        setUploading(true);

        try {
            // Convertir a base64 para Cloudinary
            const reader = new FileReader();
            reader.readAsDataURL(file);

            const base64Audio = await new Promise((resolve, reject) => {
                reader.onload = () => resolve(reader.result.split(',')[1]);
                reader.onerror = error => reject(error);
            });

            // Enviar al backend
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    title,
                    artist,
                    audio: base64Audio
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || "Error al subir la canción");
            }

            const savedSong = await response.json();
            onSongAdded(savedSong);

            // Resetear formulario
            setTitle("");
            setArtist("");
            setFile(null);

        } catch (err) {
            console.error("Error en la subida:", err);
            setError(err.message || "Error al subir la canción");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="add-song-container">
            <h2>Agregar Canción</h2>
            {error && <div className="error-message">{error}</div>}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">Título</label>
                    <input
                        id="title"
                        type="text"
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="artist">Artista</label>
                    <input
                        id="artist"
                        type="text"
                        value={artist}
                        onChange={(e) => setArtist(e.target.value)}
                        required
                    />
                </div>

                <div className="form-group">
                    <label htmlFor="audio-file">Archivo de audio</label>
                    <input
                        id="audio-file"
                        type="file"
                        accept="audio/*"
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                    />
                </div>

                <button type="submit" disabled={uploading}>
                    {uploading ? "Subiendo..." : "Subir Canción"}
                </button>
            </form>
        </div>
    );
}