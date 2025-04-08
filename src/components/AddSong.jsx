import { useState, useRef } from "react";

export default function AddSong({ onSongAdded, onUploadProgress, onUploadStatus }) {
    const [title, setTitle] = useState("");
    const [artist, setArtist] = useState("");
    const [file, setFile] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState(null);
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (!selectedFile) return;

        const validTypes = ['audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a', 'audio/aac'];
        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();

        if (!validTypes.includes(selectedFile.type) &&
            !['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension)) {
            setError(`Formato no soportado: ${fileExtension}`);
            e.target.value = "";
            return;
        }

        if (selectedFile.size > 25 * 1024 * 1024) {
            setError("El archivo excede el límite de 25MB");
            e.target.value = "";
            return;
        }

        setFile(selectedFile);
        setError(null);

        // Autocompletar título si está vacío
        if (!title.trim()) {
            const fileName = selectedFile.name.replace(/\.[^/.]+$/, "");
            setTitle(fileName);

            // Intenta extraer artista si el formato es "Artista - Canción"
            const artistMatch = fileName.match(/(.+?)\s*-\s*(.+)/);
            if (artistMatch && !artist.trim()) {
                setArtist(artistMatch[1].trim());
                setTitle(artistMatch[2].trim());
            }
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        if (onUploadStatus) onUploadStatus(null);

        if (!file) return setError("Selecciona un archivo de audio");

        setUploading(true);
        if (onUploadProgress) onUploadProgress(0);

        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('title', title.trim() || "Sin título");
            formData.append('artist', artist.trim() || "Artista desconocido");

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    if (onUploadProgress) onUploadProgress(progress);
                }
            });

            const uploadPromise = new Promise((resolve, reject) => {
                xhr.onreadystatechange = () => {
                    if (xhr.readyState === 4) {
                        if (xhr.status === 200) {
                            resolve(JSON.parse(xhr.responseText));
                        } else {
                            reject(new Error(xhr.statusText || 'Error en la subida'));
                        }
                    }
                };

                xhr.open('POST', `${import.meta.env.VITE_API_URL}/api/mymusic`, true);
                xhr.send(formData);
            });

            const data = await uploadPromise;
            if (onUploadStatus) onUploadStatus('success');
            onSongAdded(data.song);

            // Resetear formulario después de 2 segundos
            setTimeout(() => {
                setTitle("");
                setArtist("");
                setFile(null);
                if (onUploadProgress) onUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }, 2000);

        } catch (err) {
            console.error("Error en la subida:", err);
            setError(err.message || "Error al subir la canción");
            if (onUploadStatus) onUploadStatus('error');
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
                        ref={fileInputRef}
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
                    disabled={uploading || !file}
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