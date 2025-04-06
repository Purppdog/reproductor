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

        // Validaciones
        if (!file) return setError("Selecciona un archivo");
        if (file.size > 15 * 1024 * 1024) return setError("Máximo 15MB permitidos");

        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a'];
        if (!validTypes.includes(file.type)) {
            return setError("Formato no soportado (MP3, WAV, OGG, M4A)");
        }

        setUploading(true);

        try {
            // 1. Subir a Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('upload_preset', import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET);

            const cloudRes = await fetch(
                `https://api.cloudinary.com/v1_1/${import.meta.env.VITE_CLOUDINARY_CLOUD_NAME}/upload`,
                { method: 'POST', body: formData }
            );
            const cloudData = await cloudRes.json();

            // 2. Guardar en DB
            const dbRes = await fetch(`${import.meta.env.VITE_API_URL}/api/mymusic`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    title,
                    artist,
                    public_id: cloudData.public_id,
                    url: cloudData.secure_url,
                    duration: 0 // Puedes calcularlo luego
                })
            });

            if (!dbRes.ok) throw new Error(await dbRes.text());
            onSongAdded(await dbRes.json());

            // Resetear formulario
            setTitle("");
            setArtist("");
            setFile(null);

        } catch (err) {
            console.error("Upload error:", err);
            setError(err.message || "Error al subir");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="add-song-form">
            <h2>Agregar Canción</h2>
            {error && <div className="error">{error}</div>}

            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Título"
                    required
                />
                <input
                    type="text"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
                    placeholder="Artista"
                    required
                />
                <input
                    type="file"
                    accept="audio/*"
                    onChange={(e) => setFile(e.target.files[0])}
                    required
                />
                <button type="submit" disabled={uploading}>
                    {uploading ? "Subiendo..." : "Subir Canción"}
                </button>
            </form>
        </div>
    );
}