import { useState, useEffect, useRef } from 'react';
import { FiSearch, FiX } from 'react-icons/fi';
import '../styles/components/SearchBar.css';

export default function SearchBar({
    onSearch,
    placeholder = 'Buscar canciones...'
}) {
    const [query, setQuery] = useState('');
    const [source, _setSource] = useState('youtube'); // 'youtube' o 'local'
    const [isFocused, setIsFocused] = useState(false);
    const inputRef = useRef(null);

    useEffect(() => {
        if (query.trim() === '') {
            onSearch('', source);
            return;
        }

        const delayDebounceFn = setTimeout(() => {
            onSearch(query, source);
        }, 300);

        return () => clearTimeout(delayDebounceFn);
    }, [query, source, onSearch]);



    const handleClearSearch = () => {
        setQuery('');
        onSearch('', source);
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
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                    className="search-input"
                    aria-label="Buscar música"
                />
                {query && (
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