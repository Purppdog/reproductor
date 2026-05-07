import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import '../styles/pages/Auth.css';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/forgot-password`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email })
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Error al procesar la solicitud.');
                return;
            }

            setSent(true);
            toast.success('Email enviado correctamente.');

        } catch {
            toast.error('Error de conexión. Intenta nuevamente.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="auth-container">
            <div className="auth-card">
                <div className="auth-logo">
                    <h1>🔑 Recuperar contraseña</h1>
                    <p>Te enviaremos un link para restablecer tu contraseña</p>
                </div>

                {sent ? (
                    <div className="auth-alert success">
                        ✅ Revisa tu email — si existe una cuenta con ese correo, recibirás el link en breve.
                        <div style={{ marginTop: '16px' }}>
                            <Link to="/login" className="auth-btn" style={{ display: 'inline-block', textDecoration: 'none', textAlign: 'center' }}>
                                Volver al login
                            </Link>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="auth-form">
                        <div className="auth-field">
                            <label>Email</label>
                            <input
                                type="email"
                                placeholder="tu@email.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                        </div>

                        <button type="submit" className="auth-btn" disabled={loading}>
                            {loading ? 'Enviando...' : 'Enviar link de recuperación'}
                        </button>
                    </form>
                )}

                <div className="auth-footer">
                    <p><Link to="/login">← Volver al login</Link></p>
                </div>
            </div>
        </div>
    );
}