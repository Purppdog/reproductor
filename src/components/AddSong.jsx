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
            // Paso 1: Subir el archivo a Cloudinary
            const cloudinaryFormData = new FormData();
            cloudinaryFormData.append("audio", file);

            const uploadResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/upload`, {
                method: "POST",
                body: cloudinaryFormData
            });

            if (!uploadResponse.ok) {
                const errorData = await uploadResponse.json();
                throw new Error(errorData.error || "Error al subir el archivo");
            }

            const cloudinaryData = await uploadResponse.json();

            // Paso 2: Guardar metadatos en tu base de datos
            const songData = {
                title,
                artist,
                url: cloudinaryData.url,
                public_id: cloudinaryData.public_id,
                duration: cloudinaryData.duration,
                thumbnail: generateThumbnailUrl(cloudinaryData.public_id)
            };

            const saveResponse = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(songData)
            });

            if (!saveResponse.ok) {
                throw new Error("Error al guardar los metadatos");
            }

            const savedSong = await saveResponse.json();

            // Notificar éxito
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

    // Generar URL de thumbnail a partir del public_id de Cloudinary
    const generateThumbnailUrl = (publicId) => {
        if (!publicId) return null;
        return `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_500,h_500,c_thumb,g_faces/${publicId}.jpg`;
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
                        placeholder="Nombre de la canción"
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
                        placeholder="Nombre del artista"
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
                    <small>Formatos soportados: MP3, WAV, OGG, M4A, WEBM</small>
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    className={`submit-button ${uploading ? 'uploading' : ''}`}
                >
                    {uploading ? (
                        <>
                            <span className="spinner"></span>
                            Subiendo...
                        </>
                    ) : (
                        "Subir Canción"
                    )}
                </button>
            </form>
        </div>
    );
}