const API_URL = "http://localhost:3000";

/**
 * Obtiene las tareas desde json-server
 */
async function obtenerTareas() {
    try {
        const respuesta = await fetch(`${API_URL}/tasks`);

        if (!respuesta.ok) {
            throw new Error("No se han podido obtener las tareas");
        }

        const tareas = await respuesta.json();

        console.log("Tareas recibidas:", tareas);

        mostrarTareas(tareas);

    } catch (error) {
        console.error("Error al obtener las tareas:", error);
    }
}


/**
 * Muestra las tareas en la columna correspondiente
 */
function mostrarTareas(tareas) {

    const listaTodo = document.getElementById("lista-todo");
    const listaDoing = document.getElementById("lista-doing");
    const listaDone = document.getElementById("lista-done");

    // Vaciar las listas antes de volver a pintarlas
    listaTodo.innerHTML = "";
    listaDoing.innerHTML = "";
    listaDone.innerHTML = "";

    tareas.forEach(tarea => {

        const tarjeta = crearTarjeta(tarea);

        if (tarea.status === "todo") {
            listaTodo.appendChild(tarjeta);
        }

        if (tarea.status === "doing") {
            listaDoing.appendChild(tarjeta);
        }

        if (tarea.status === "done") {
            listaDone.appendChild(tarjeta);
        }
    });

    actualizarContadores(tareas);
}


/**
 * Crea una tarjeta HTML a partir de una tarea
 */
function crearTarjeta(tarea) {

    const tarjeta = document.createElement("article");

    tarjeta.classList.add("tarjeta");

    tarjeta.dataset.id = tarea.id;
    tarjeta.dataset.priority = tarea.priority;

    tarjeta.setAttribute("tabindex", "0");
    tarjeta.setAttribute("role", "button");
    tarjeta.setAttribute(
        "aria-label",
        `Ver detalles de ${tarea.title}`
    );

    tarjeta.innerHTML = `
        <div class="tarjeta-cabecera">
            <span class="prioridad ${obtenerClasePrioridad(tarea.priority)}">
                ${obtenerIconoPrioridad(tarea.priority)}
                ${tarea.priority}
            </span>
        </div>

        <h3>${tarea.title}</h3>

        <p>${tarea.description}</p>

        <div class="tarjeta-fecha">
            <span aria-hidden="true">▣</span>
            <time datetime="${tarea.dueDate}">
                ${formatearFecha(tarea.dueDate)}
            </time>
        </div>
    `;

    return tarjeta;
}


/**
 * Devuelve la clase CSS correspondiente a la prioridad
 */
function obtenerClasePrioridad(priority) {

    if (priority === "Alta") {
        return "prioridad-alta";
    }

    if (priority === "Media") {
        return "prioridad-media";
    }

    return "prioridad-baja";
}


/**
 * Devuelve un símbolo según la prioridad
 */
function obtenerIconoPrioridad(priority) {

    if (priority === "Alta") {
        return "↑";
    }

    if (priority === "Media") {
        return "−";
    }

    return "↓";
}


/**
 * Convierte 2026-09-15 en 15/09/2026
 */
function formatearFecha(fecha) {

    const partes = fecha.split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


/**
 * Actualiza los contadores del tablero
 */
function actualizarContadores(tareas) {

    const todo = tareas.filter(tarea => tarea.status === "todo").length;
    const doing = tareas.filter(tarea => tarea.status === "doing").length;
    const done = tareas.filter(tarea => tarea.status === "done").length;

    document.getElementById("contador-todo").textContent = todo;
    document.getElementById("contador-doing").textContent = doing;
    document.getElementById("contador-done").textContent = done;

    document.getElementById("total-tareas").textContent = tareas.length;
    document.getElementById("total-todo").textContent = todo;
    document.getElementById("total-doing").textContent = doing;
    document.getElementById("total-done").textContent = done;
}


// Iniciar aplicación
obtenerTareas();