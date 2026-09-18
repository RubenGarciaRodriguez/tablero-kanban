const API_URL = "http://localhost:3000";

/**
 * Obtiene todas las tareas desde json-server
 */
async function obtenerTareas() {
    try {
        const respuesta = await fetch(`${API_URL}/tasks`);

        if (!respuesta.ok) {
            throw new Error("No se han podido obtener las tareas");
        }

        const tareas = await respuesta.json();

        console.log("Tareas recibidas:", tareas);

        return tareas;
    } catch (error) {
        console.error("Error al obtener las tareas:", error);
    }
}

obtenerTareas();