export const searchYouTube = async (query) => {
    try {
        console.log(`Buscando en YouTube con query: ${query}`);

        const response = await fetch(`${import.meta.env.VITE_API_URL}/api/search?q=${encodeURIComponent(query)}`);
        if (!response.ok) {
            throw new Error('Error en la búsqueda');
        }

        const data = await response.json();
        console.log("Respuesta del backend:", data);
        return data;
    } catch (error) {
        console.error("Error buscando en YouTube:", error);
        return [];
    }
};