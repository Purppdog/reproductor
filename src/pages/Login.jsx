import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import '../styles/pages/Auth.css';

export default function Login() {
    const [formData, setFormData] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login, isAuthenticated } = useAuth();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();

    useEffect(() => {
        if (isAuthenticated) navigate('/');
        if (searchParams.get('verified') === 'true') {
            toast.success('Email verificado correctamente. Ya puedes iniciar sesión.');
        }
        if (searchParams.get('error') === 'token_invalido') {
            toast.error('El link de verificación es inválido o expiró.');
        }
    }, [isAuthenticated, navigate, searchParams]);

    const handleChange = (e) => {
        setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await fetch(`${import.meta.env.VITE_API_URL}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (!response.ok) {
                toast.error(data.error || 'Error al iniciar sesión.');
                return;
            }

            login(data.user, data.token);
            toast.success(`¡Bienvenido, ${data.user.username}!`);
            navigate('/');
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
                    <h1>REPRODUCTOR</h1>
                    <p>Inicia sesión para acceder a tu biblioteca</p>
                </div>

                <form onSubmit={handleSubmit} className="auth-form">
                    <div className="auth-field">
                        <label>Email</label>
                        <input
                            type="email"
                            name="email"
                            placeholder="Correo electrónico"
                            value={formData.email}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="auth-field">
                        <label>Contraseña</label>
                        <input
                            type="password"
                            name="password"
                            placeholder="Contraseña"
                            value={formData.password}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <button type="submit" className="auth-btn" disabled={loading}>
                        {loading ? 'Iniciando sesión...' : 'Iniciar sesión'}
                    </button>
                </form>

                <div className="auth-footer">
                    <p>¿No tienes cuenta? <Link to="/register">Regístrate</Link></p>
                    <p>¿Solo quieres explorar? <Link to="/">Continuar sin cuenta</Link></p>
                </div>
                <div style={{ textAlign: 'center', marginTop: '8px' }}>
                    <Link to="/forgot-password" style={{ color: '#aaa', fontSize: '0.85rem' }}>
                     ¿Olvidaste tu contraseña?
                    </Link>
                </div>
            </div>
        </div>
    );
}