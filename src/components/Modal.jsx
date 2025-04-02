import React from "react";
import "../styles/components/Modals.css"; // Archivo de estilos del modal

export default function Modal({ children, onClose }) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="close-btn" onClick={onClose}>✖</button>
                {children}
            </div>
        </div>
    );
}