import React, { useState } from "react";
import "../styles/components/Modals.css";

export default function Modal({
    children,
    onClose,
    uploadProgress = 0,
    uploadStatus = null
}) {
    const [closing, setClosing] = useState(false);

    const handleClose = () => {
        setClosing(true);
        setTimeout(onClose, 300);
    };

    return (
        <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={handleClose}>✖</button>

                {/* Barra de progreso */}
                {uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="upload-progress-container">
                        <div
                            className="upload-progress-bar"
                            style={{ width: `${uploadProgress}%` }}
                        ></div>
                        <span className="progress-text">{uploadProgress}%</span>
                    </div>
                )}

                {/* Alertas de estado */}
                {uploadStatus === 'success' && (
                    <div className="alert alert-success">
                        <span>¡Canción subida exitosamente!</span>
                    </div>
                )}

                {uploadStatus === 'error' && (
                    <div className="alert alert-error">
                        <span>Error al subir la canción</span>
                    </div>
                )}

                {children}
            </div>
        </div>
    );
}