import { NavLink } from 'react-router-dom';
import { FiHome } from 'react-icons/fi';
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
                </div>
            </nav>
        </header>
    );
}