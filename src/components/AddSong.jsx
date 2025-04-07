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

        // Validaciones mejoradas
        if (!file) return setError("Selecciona un archivo de audio");
        if (file.size > 15 * 1024 * 1024) return setError("El archivo excede el límite de 15MB");

        const validTypes = [
            'audio/mpeg', // MP3
            'audio/wav',  // WAV
            'audio/ogg',  // OGG
            'audio/x-m4a', // M4A
            'audio/aac',   // AAC
            'audio/x-wav'  // WAV alternativo
        ];

        if (!validTypes.includes(file.type)) {
            return setError("Formato de audio no soportado. Use MP3, WAV, OGG o M4A");
        }

        setUploading(true);

        try {
            // 1. Subir a Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);
            formData.append('folder', 'audio'); // Asegura que se suba al folder correcto

            const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
                {
                    method: 'POST',
                    body: formData
                }
            );

            if (!cloudRes.ok) {
                const errorData = await cloudRes.json();
                throw new Error(errorData.message || "Error al subir a Cloudinary");
            }

            const cloudData = await cloudRes.json();
            console.log('Respuesta de Cloudinary:', cloudData);

            // 2. Guardar en DB con la estructura correcta
            const dbRes = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    artist,
                    cloudinary_public_id: cloudData.public_id, // Nombre exacto de tu columna
                    cloudinary_url: cloudData.secure_url,      // Nombre exacto de tu columna
                    duration: Math.round(cloudData.duration) || 0, // Si Cloudinary devuelve duración
                    source_type: 'cloudinary'                  // Nombre exacto de tu columna
                })
            });

            if (!dbRes.ok) {
                const errorText = await dbRes.text();
                throw new Error(errorText || "Error al guardar en la base de datos");
            }

            const newSong = await dbRes.json();
            console.log('Canción agregada:', newSong);

            // Notificar al componente padre
            onSongAdded({
                ...newSong,
                id: newSong.id.toString(),
                thumbnail: `https://res.cloudinary.com/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/image/upload/w_300,h_300,c_fill/${cloudData.public_id}.jpg`
            });

            // Resetear formulario
            setTitle("");
            setArtist("");
            setFile(null);

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
                <div className="error">
                    <p>{error}</p>
                    <small>Intenta con otro archivo si el problema persiste</small>
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
                        onChange={(e) => setFile(e.target.files[0])}
                        required
                    />
                    <small>Formatos soportados: MP3, WAV, OGG, M4A (Máx. 15MB)</small>
                </div>

                <button
                    type="submit"
                    disabled={uploading}
                    aria-busy={uploading}
                >
                    {uploading ? (
                        <>
                            <span className="spinner"></span>
                            Subiendo...
                        </>
                    ) : "Subir Canción"}
                </button>
            </form>
        </div>
    );
}