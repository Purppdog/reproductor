import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import '../styles/pages/Auth.css';

export default function Profile() {
    const { user, token, logout } = useAuth();
    const navigate = useNavigate();
    const [showConfirm, setShowConfirm] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleDeleteAccount = async () => {
        setLoading(true);
        setError('');
        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/account`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.error || 'Error al eliminar la cuenta.');
                return;
            }

            logout();
            navigate('/');

        } catch {
            setError('Error de conexión. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <h1>👤 Mi Perfil</h1>
                </div>

                <div className="profile-info">
                    <div className="profile-field">
                        <span className="profile-label">Usuario</span>
                        <span className="profile-value">{user?.username}</span>
                    </div>
                    <div className="profile-field">
                        <span className="profile-label">Email</span>
                        <span className="profile-value">{user?.email}</span>
                    </div>
                </div>

                {error && <div className="auth-alert error">{error}</div>}

                {!showConfirm ? (
                    <button
                        className="delete-account-btn"
                        onClick={() => setShowConfirm(true)}
                    >
                        🗑️ Eliminar mi cuenta
                    </button>
                ) : (
                    <div className="confirm-delete">
                        <p>⚠️ Esta acción eliminará tu cuenta y <strong>todas tus canciones</strong> permanentemente. ¿Estás seguro?</p>
                        <div className="confirm-buttons">
                            <button
                                className="auth-btn"
                                onClick={() => setShowConfirm(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </button>
                            <button
                                className="delete-confirm-btn"
                                onClick={handleDeleteAccount}
                                disabled={loading}
                            >
                                {loading ? 'Eliminando...' : 'Sí, eliminar cuenta'}
                            </button>
                        </div>
                    </div>
                )}

                <div className="auth-footer">
                    <p><span className="back-link" onClick={() => navigate('/')}>← Volver al inicio</span></p>
                </div>
            </div>
        </div>
    );
}