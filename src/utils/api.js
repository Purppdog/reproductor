export const fetchSongs = async () => {
    try {
        const response = await fetch('http://localhost:3001/api/songs');
        if (!response.ok) throw new Error('Error en la respuesta del servidor');
        return await response.json();
    } catch (error) {
        console.error('Error fetching songs:', error);
        return [];
    }
};