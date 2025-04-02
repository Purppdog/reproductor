import { useState } from "react";

export default function AddSong({ onSongAdded }) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!file) {
            alert("Por favor, selecciona un archivo de audio.");
            return;
        }

        const formData = new FormData();
        formData.append("title", title);
        formData.append("artist", artist);
        formData.append("file", file);

        setUploading(true);

        try {
            const response = await fetch("http://localhost:3001/api/mymusic", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                throw new Error("Error al subir la canción");
            }

            const data = await response.json(); // Se usa correctamente

            // ✅ Ahora usamos `data` en el alert
            alert(`Canción "${data.title}" agregada exitosamente`);

            onSongAdded(data.title); // También pasamos el título a la función
            setTitle("");
            setArtist("");
            setFile(null);
        } catch (error) {
            console.error(error);
            alert("Hubo un error al subir la canción");
        } finally {
            setUploading(false);
        }
    };

    return (
        <div>
            <h2>Agregar Canción</h2>
            <form onSubmit={handleSubmit}>
                <input
                    type="text"
                    placeholder="Título"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                />
                <input
                    type="text"
                    placeholder="Artista"
                    value={artist}
                    onChange={(e) => setArtist(e.target.value)}
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
