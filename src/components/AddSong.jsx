import { useState, useRef } from "react";

export default function AddSong({ onSongAdded, onUploadProgress }) {
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

        // Validación mejorada de tipos de archivo
        const validTypes = [
            'audio/mpeg', 'audio/wav', 'audio/ogg', 'audio/x-m4a',
            'audio/aac', 'audio/x-aac', 'audio/x-m4a'
        ];

        const fileExtension = selectedFile.name.split('.').pop().toLowerCase();
        const isValidType = validTypes.includes(selectedFile.type) ||
            ['mp3', 'wav', 'ogg', 'm4a', 'aac'].includes(fileExtension);

        if (!isValidType) {
            setError(`Formato no soportado: ${selectedFile.type || fileExtension}`);
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

        // Autocompletar título y artista si están vacíos
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
        setSuccess(null);
        setUploadProgress(0);

        if (!file) return setError("Selecciona un archivo de audio");

        setUploading(true);

        try {
            const formData = new FormData();
            formData.append('audio', file);
            formData.append('title', title.trim() || "Sin título");
            formData.append('artist', artist.trim() || "Artista desconocido");

            const xhr = new XMLHttpRequest();

            xhr.upload.addEventListener('progress', (event) => {
                if (event.lengthComputable) {
                    const progress = Math.round((event.loaded / event.total) * 100);
                    setUploadProgress(progress);
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
            setSuccess("Canción subida correctamente");
            onSongAdded(data.song);

            // Resetear formulario después de 2 segundos
            setTimeout(() => {
                setTitle("");
                setArtist("");
                setFile(null);
                setUploadProgress(0);
                if (fileInputRef.current) fileInputRef.current.value = "";
            }, 2000);

        } catch (err) {
            console.error("Error en la subida:", err);
            setError(err.message || "Error al subir la canción");
            setUploadProgress(0);
        } finally {
            setUploading(false);
        }
    };

    const handleDragOver = (e) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            const fileInput = document.getElementById("audio-file");
            fileInput.files = e.dataTransfer.files;
            handleFileChange({ target: fileInput });
        }
    };

    return (
        <div className="add-song-form">
            <div className="form-header">
                <h2>
                    <svg className="icon" viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12,3A3,3 0 0,0 9,6H15A3,3 0 0,0 12,3M19,6A2,2 0 0,1 21,8V20A2,2 0 0,1 19,22H5A2,2 0 0,1 3,20V8C3,6.89 3.9,6 5,6H7A5,5 0 0,1 12,1A5,5 0 0,1 17,6H19M12,11A4,4 0 0,0 8,15A4,4 0 0,0 12,19A4,4 0 0,0 16,15A4,4 0 0,0 12,11Z" />
                    </svg>
                    Agregar Canción
                </h2>
                <p className="form-subtitle">Sube tu música en formatos MP3, WAV, OGG, M4A o AAC</p>
            </div>

            {error && (
                <div className="alert error">
                    <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M11,15H13V17H11V15M11,7H13V13H11V7M12,2C6.47,2 2,6.5 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2M12,20A8,8 0 0,1 4,12A8,8 0 0,1 12,4A8,8 0 0,1 20,12A8,8 0 0,1 12,20Z" />
                    </svg>
                    <div>
                        <p>{error}</p>
                        <small>Formatos aceptados: MP3, WAV, OGG, M4A, AAC (Máx. 25MB)</small>
                    </div>
                </div>
            )}

            {success && (
                <div className="alert success">
                    <svg viewBox="0 0 24 24">
                        <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                    </svg>
                    <p>{success}</p>
                </div>
            )}

            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label htmlFor="title">
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M18.5,4L19.66,8.35L18.7,8.61C18.25,7.74 17.79,6.87 17.26,6.43C16.73,6 16.11,6 15.5,6H13V16.5C13,17 13,17.5 13.33,17.75C13.67,18 14.33,18 15,18V19H9V18C9.67,18 10.33,18 10.67,17.75C11,17.5 11,17 11,16.5V6H8.5C7.89,6 7.27,6 6.74,6.43C6.21,6.87 5.75,7.74 5.3,8.61L4.34,8.35L5.5,4H18.5Z" />
                        </svg>
                        Título
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
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12,3A4,4 0 0,1 16,7A4,4 0 0,1 12,11A4,4 0 0,1 8,7A4,4 0 0,1 12,3M16,13.54C16,14.6 15.72,17.07 13.81,19.83L13,15L13.94,13.12C13.32,13.05 12.67,13 12,13C11.33,13 10.68,13.05 10.06,13.12L11,15L10.19,19.83C8.28,17.07 8,14.6 8,13.54C5.61,14.24 4,15.5 4,17V21H20V17C20,15.5 18.4,14.24 16,13.54Z" />
                        </svg>
                        Artista
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
                    <label>
                        <svg viewBox="0 0 24 24">
                            <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20Z" />
                        </svg>
                        Archivo de audio
                    </label>
                    <div
                        className={`file-dropzone ${file ? 'has-file' : ''}`}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current.click()}
                    >
                        <input
                            id="audio-file"
                            type="file"
                            ref={fileInputRef}
                            accept="audio/*"
                            onChange={handleFileChange}
                            required
                            style={{ display: 'none' }}
                        />
                        {file ? (
                            <>
                                <svg className="file-icon" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M13,10V11H18V10H13M13,12V13H18V12H13M13,14V15H16V14H13M9,18V9H7V11H9V18H11V11H13V9H11V7H9V9H7V7H5V17H9V18Z" />
                                </svg>
                                <div className="file-info">
                                    <p className="file-name">{file.name}</p>
                                    <p className="file-size">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                                </div>
                                <button
                                    type="button"
                                    className="change-file"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        fileInputRef.current.value = "";
                                        setFile(null);
                                    }}
                                >
                                    Cambiar
                                </button>
                            </>
                        ) : (
                            <>
                                <svg className="upload-icon" viewBox="0 0 24 24">
                                    <path fill="currentColor" d="M14,13V17H10V13H7L12,8L17,13M19.35,10.03C18.67,6.59 15.64,4 12,4C9.11,4 6.6,5.64 5.35,8.03C2.34,8.36 0,10.9 0,14A6,6 0 0,0 6,20H19A5,5 0 0,0 24,15C24,12.36 21.95,10.22 19.35,10.03Z" />
                                </svg>
                                <p>Arrastra tu archivo aquí o haz clic para seleccionar</p>
                                <small>Formatos: MP3, WAV, OGG, M4A, AAC (Máx. 25MB)</small>
                            </>
                        )}
                    </div>
                </div>

                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="progress-container">
                        <div className="progress-bar" style={{ width: `${uploadProgress}%` }}>
                            <span className="progress-text">{uploadProgress}%</span>
                        </div>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={uploading || !file}
                    className={uploading ? 'uploading' : ''}
                >
                    {uploading ? (
                        <>
                            <svg className="spinner" viewBox="0 0 50 50">
                                <circle cx="25" cy="25" r="20" fill="none" strokeWidth="5"></circle>
                            </svg>
                            Subiendo...
                        </>
                    ) : (
                        <>
                            <svg viewBox="0 0 24 24">
                                <path fill="currentColor" d="M9,16V10H5L12,3L19,10H15V16H9M5,20V18H19V20H5Z" />
                            </svg>
                            Subir Canción
                        </>
                    )}
                </button>
            </form>
        </div>
    );
}