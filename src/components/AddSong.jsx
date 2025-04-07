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

        // Validación básica del tipo de archivo
        const validTypes = [
            'audio/mpeg', // MP3
            'audio/wav',  // WAV
            'audio/ogg',  // OGG
            'audio/x-m4a', // M4A
            'audio/aac'   // AAC
        ];

        if (selectedFile && !validTypes.includes(selectedFile.type)) {
            setError("Formato de audio no soportado. Use MP3, WAV, OGG o M4A");
            e.target.value = ""; // Limpiar el input
            return;
        }

        setFile(selectedFile);
        setError(null);

        // Autocompletar título si está vacío
        if (!title && selectedFile) {
            const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
            setTitle(fileName);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        // Validaciones
        if (!file) {
            return setError("Selecciona un archivo de audio");
        }

        if (file.size > 15 * 1024 * 1024) {
            return setError("El archivo excede el límite de 15MB");
        }

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('title', title.trim());
            formData.append('artist', artist.trim());

            // Mostrar el contenido del FormData para debug (opcional)
            for (let [key, value] of formData.entries()) {
                console.log(`${key}:`, value);
            }

            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`, {
                method: 'POST',
                body: formData
                // No incluir 'Content-Type': Multer lo maneja automáticamente
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || "Error al subir la canción");
            }

            console.log("Canción subida exitosamente:", data.song);

            // Notificar al componente padre
            onSongAdded(data.song);

            // Mostrar mensaje de éxito
            setSuccess("Canción subida correctamente");

            // Resetear formulario
            setTitle("");
            setArtist("");
            setFile(null);
            document.getElementById("audio-file").value = ""; // Limpiar input file

        } catch (err) {
            console.error("Error en el proceso de subida:", err);
            setError(err.message || "Ocurrió un error durante la subida");
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
                    <small>Intenta con otro archivo si el problema persiste</small>
                </div>
            )}

            {success && (
                <div className="success-message">
                    <p>{success}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">
                        Título:
                    </label>
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
                    <label htmlFor="artist">
                        Artista:
                    </label>
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
                    <label htmlFor="audio-file">
                        Archivo de audio:
                    </label>
                    <input
                        id="audio-file"
                        type="file"
                        accept="audio/*"
                        onChange={handleFileChange}
                        required
                    />
                    <small>Formatos soportados: MP3, WAV, OGG, M4A (Máx. 15MB)</small>
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                >
                    {uploading ? "Subiendo..." : "Subir Canción"}
                </button>
            </form>
        </div>
    );
}