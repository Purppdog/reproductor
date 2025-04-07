import { NavLink } from 'react-router-dom';
import { FiHome, FiMusic, FiSearch } from 'react-icons/fi';
import { useState } from 'react';
import "../styles/components/Navbar.css";

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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

                    <NavLink
                        to="/library"
                        className={({ isActive }) =>
                            `navbar-link ${isActive ? 'navbar-link-active' : ''}`
                        }
                    >
                        <FiMusic className="navbar-icon" />
                        <span>Playlist</span>
                    </NavLink>

                    <NavLink
                        to="/search"
                        className={({ isActive }) =>
                            `navbar-link ${isActive ? 'navbar-link-active' : ''}`
                        }
                    >
                        <FiSearch className="navbar-icon" />
                        <span>Buscar</span>
                    </NavLink>
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

                {/* Menú móvil (contenido) */}
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

                    <NavLink
                        to="/library"
                        className={({ isActive }) =>
                            `navbar-mobile-link ${isActive ? 'navbar-link-active' : ''}`
                        }
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <FiMusic className="navbar-icon" />
                        <span>Biblioteca</span>
                    </NavLink>

                    <NavLink
                        to="/search"
                        className={({ isActive }) =>
                            `navbar-mobile-link ${isActive ? 'navbar-link-active' : ''}`
                        }
                        onClick={() => setMobileMenuOpen(false)}
                    >
                        <FiSearch className="navbar-icon" />
                        <span>Buscar</span>
                    </NavLink>
                </div>
            </nav>
        </header>
    );
}