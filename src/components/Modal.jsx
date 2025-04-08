import React, { useState } from "react";
import "../styles/components/Modals.css";

export default function Modal({ children, onClose, uploadProgress = 0, uploadStatus = null }) {
    const [closing, setClosing] = useState(false);

    const handleClose = () => {
        setClosing(true);
        setTimeout(onClose, 300); // Espera a que termine la animación
    };

    return (
        <div className={`modal-overlay ${closing ? 'closing' : ''}`} onClick={handleClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={handleClose}>✖</button>

                {/* Alertas de estado */}
                {uploadStatus === 'success' && (
                    <div className="alert alert-success">
                        <svg className="alert-icon" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M12 2C6.5 2 2 6.5 2 12S6.5 22 12 22 22 17.5 22 12 17.5 2 12 2M10 17L5 12L6.41 10.59L10 14.17L17.59 6.58L19 8L10 17Z" />
                        </svg>
                        <span>¡Canción subida exitosamente!</span>
                    </div>
                )}

                {uploadStatus === 'error' && (
                    <div className="alert alert-error">
                        <svg className="alert-icon" viewBox="0 0 24 24">
                            <path fill="currentColor" d="M13 13H11V7H13M13 17H11V15H13M12 2C6.47 2 2 6.5 2 12S6.47 22 12 22 22 17.5 22 12 17.52 2 12 2Z" />
                        </svg>
                        <span>Error al subir la canción</span>
                    </div>
                )}

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

                {children}
            </div>
        </div>
    );
}