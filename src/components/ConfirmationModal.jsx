// src/components/ConfirmationModal.jsx
import { useEffect } from 'react';
import '../styles/components/ConfirmationModal.css';

export default function ConfirmationModal({
    message,
    onConfirm,
    onCancel
}) {
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => document.body.style.overflow = 'unset';
    }, []);

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-content">
                    <p>{message}</p>
                    <div className="modal-actions">
                        <button
                            onClick={onCancel}
                            className="cancel-btn"
                        >
                            Cancelar
                        </button>
                        <button
                            onClick={onConfirm}
                            className="confirm-btn"
                        >
                            Aceptar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}