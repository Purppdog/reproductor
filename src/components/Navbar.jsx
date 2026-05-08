import { NavLink, useNavigate } from 'react-router-dom';
import { FiHome, FiLogIn, FiLogOut, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import "../styles/components/Navbar.css";
import { Link } from 'react-router-dom';


export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
    const { user, logout, isAuthenticated } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/');
        setMobileMenuOpen(false);
    };

    return (
        <header className="navbar-container">
            <nav className="navbar">
                <div className="navbar-brand">
                    <h1 className="navbar-title">REPRODUCTOR</h1>
                </div>

                <div className="navbar-links">
                    <NavLink
                        to="/"
                        className={({ isActive }) =>
                            `navbar-link ${isActive ? 'navbar-link-active' : ''}`
                        }
                    >
                        <FiHome className="navbar-icon" />
                        <span>Inicio</span>
                    </NavLink>

                    {isAuthenticated ? (
                        <div className="navbar-user">
                            <Link to="/profile" className="navbar-username">
                            <FiUser className="navbar-icon" />
                            {user?.username}
                            </Link>
                            <button className="navbar-logout-btn" onClick={handleLogout}>
                                <FiLogOut className="navbar-icon" />
                                <span>Salir</span>
                            </button>
                        </div>
                    ) : (
                        <NavLink
                            to="/login"
                            className={({ isActive }) =>
                                `navbar-link ${isActive ? 'navbar-link-active' : ''}`
                            }
                        >
                            <FiLogIn className="navbar-icon" />
                            <span>Iniciar sesión</span>
                        </NavLink>
                    )}
                </div>

                <button
                    className="navbar-mobile-toggle"
                    onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                    aria-label="Menú"
                >
                    <div className={`hamburger ${mobileMenuOpen ? 'open' : ''}`}>
                        <span></span>
                        <span></span>
                        <span></span>
                    </div>
                </button>

                <div className={`navbar-mobile-menu ${mobileMenuOpen ? 'open' : ''}`}>
    <NavLink
        to="/"
        className={({ isActive }) =>
            `navbar-mobile-link ${isActive ? 'navbar-link-active' : ''}`
        }
        onClick={() => setMobileMenuOpen(false)}
    >
        <FiHome className="navbar-icon" />
        <span>Inicio</span>
    </NavLink>

    {isAuthenticated ? (
        <>
            <Link
                to="/profile"
                className="navbar-mobile-link"
                onClick={() => setMobileMenuOpen(false)}
            >
                <FiUser className="navbar-icon" />
                <span>{user?.username}</span>
            </Link>
            <button className="navbar-mobile-link" onClick={handleLogout}>
                <FiLogOut className="navbar-icon" />
                <span>Cerrar sesión</span>
            </button>
        </>
    ) : (
        <NavLink
            to="/login"
            className={({ isActive }) =>
                `navbar-mobile-link ${isActive ? 'navbar-link-active' : ''}`
            }
            onClick={() => setMobileMenuOpen(false)}
        >
            <FiLogIn className="navbar-icon" />
            <span>Iniciar sesión</span>
        </NavLink>
    )}
</div>
            </nav>
        </header>
    );
}