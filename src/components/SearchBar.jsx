import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import "../styles/components/SearchBar.css";

export default function SearchBar({
    onSearch,
    placeholder = 'Buscar canciones...',
    value = '',
    onChange = () => { }
}) {
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    // Eliminado el estado interno de query, ahora se maneja desde el padre
    useEffect(() => {
        if (typeof onSearch !== 'function') return;

        const delayDebounceFn = setTimeout(() => {
            onSearch(value);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [value, onSearch]);

    const handleClearSearch = () => {
        onChange(''); // Limpia el valor mediante la prop onChange
        inputRef.current.focus();
    };

    return (
        <div className={`search-bar-container ${isFocused ? 'focused' : ''}`}>
            <div className="search-bar">
                <FiSearch className="search-icon" />
                <input
                    ref={inputRef}
                    type="text"
                    placeholder={placeholder}
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    className="search-input"
                    aria-label="Buscar música"
                />
                {value && (
                    <button
                        onClick={handleClearSearch}
                        className="clear-button"
                        aria-label="Limpiar búsqueda"
                    >
                        <FiX />
                    </button>
                )}
            </div>
        </div>
    );
}