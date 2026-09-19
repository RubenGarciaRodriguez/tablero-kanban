let sortableInstances = [];

const API_URL = "http://localhost:3000";


// =========================================================
// OBTENER TODAS LAS TAREAS
// =========================================================

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


// =========================================================
// MOSTRAR TAREAS
// =========================================================

function mostrarTareas(tareas) {

    const listaTodo = document.getElementById("lista-todo");
    const listaDoing = document.getElementById("lista-doing");
    const listaDone = document.getElementById("lista-done");

    // Destruir Sortable anterior antes de volver a pintar
    destruirSortable();

    // Vaciar listas
    listaTodo.innerHTML = "";
    listaDoing.innerHTML = "";
    listaDone.innerHTML = "";

    // Crear tarjetas
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

    // Activar Drag & Drop
    inicializarSortable();
}

function inicializarSortable() {

    const listas = document.querySelectorAll(".lista-tareas");

    listas.forEach(lista => {

        const sortable = new Sortable(lista, {

            group: "kanban",

            animation: 200,

            ghostClass: "tarjeta-arrastrando",

            onEnd: async function (evento) {

                const tarjeta = evento.item;

                const taskId = tarjeta.dataset.id;

                const columnaAnterior =
                    evento.from.closest(".columna");

                const columnaNueva =
                    evento.to.closest(".columna");


                const oldStatus =
                    columnaAnterior.dataset.status;

                const newStatus =
                    columnaNueva.dataset.status;


                // Si se ha movido dentro de la misma columna,
                // no necesitamos PATCH
                if (oldStatus === newStatus) {
                    return;
                }


                console.log(
                    `Tarea ${taskId}: ${oldStatus} → ${newStatus}`
                );


                await actualizarEstadoTarea(
                    taskId,
                    newStatus
                );
            }
        });


        sortableInstances.push(sortable);
    });
}

async function actualizarEstadoTarea(taskId, nuevoStatus) {

    try {

        const respuesta = await fetch(
            `${API_URL}/tasks/${encodeURIComponent(taskId)}`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    status: nuevoStatus
                })
            }
        );


        if (!respuesta.ok) {
            throw new Error(
                "No se ha podido actualizar el estado de la tarea"
            );
        }


        const tareaActualizada =
            await respuesta.json();


        console.log(
            "Estado actualizado:",
            tareaActualizada
        );


        // Volver a cargar datos del servidor
        await obtenerTareas();


    } catch (error) {

        console.error(
            "Error al actualizar el estado:",
            error
        );


        alert(
            "No se ha podido actualizar el estado de la tarea."
        );


        // Restaurar el tablero al estado del servidor
        await obtenerTareas();
    }
}

function destruirSortable() {

    sortableInstances.forEach(sortable => {
        sortable.destroy();
    });

    sortableInstances = [];
}


// =========================================================
// CREAR TARJETA
// =========================================================

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


    // =====================================================
    // CLIC EN LA TARJETA
    // =====================================================

    tarjeta.addEventListener("click", () => {
        abrirModalDetalle(tarea.id);
    });


    // =====================================================
    // ACCESO MEDIANTE TECLADO
    // =====================================================

    tarjeta.addEventListener("keydown", (evento) => {

        if (evento.key === "Enter" || evento.key === " ") {

            evento.preventDefault();

            abrirModalDetalle(tarea.id);
        }
    });


    return tarjeta;
}


// =========================================================
// ABRIR MODAL DE DETALLE
// =========================================================

async function abrirModalDetalle(taskId) {

    try {

        console.log("Abriendo tarea:", taskId);


        // Obtener la tarea concreta

        const respuesta = await fetch(
            `${API_URL}/tasks/${encodeURIComponent(taskId)}`
        );


        if (!respuesta.ok) {
            throw new Error("No se ha podido obtener la tarea");
        }


        const tarea = await respuesta.json();


        console.log("Tarea seleccionada:", tarea);


        // ================================================
        // RELLENAR MODAL
        // ================================================

        document.getElementById("detalle-titulo").value =
            tarea.title || "";

        document.getElementById("detalle-descripcion").value =
            tarea.description || "";

        document.getElementById("detalle-prioridad").value =
            tarea.priority || "Media";

        document.getElementById("detalle-estado").value =
            tarea.status || "todo";

        document.getElementById("detalle-fecha").value =
            tarea.dueDate || "";


        // Guardamos temporalmente el ID de la tarea
        // en el propio modal

        const modal = document.getElementById(
            "modal-detalle-tarea"
        );

        modal.dataset.taskId = tarea.id;


        // ================================================
        // CARGAR COMENTARIOS
        // ================================================

        await cargarComentarios(tarea.id);


        // ================================================
        // MOSTRAR MODAL
        // ================================================

        modal.classList.remove("oculto");

    } catch (error) {

        console.error(
            "Error al abrir el detalle:",
            error
        );
    }
}


// =========================================================
// CARGAR COMENTARIOS
// =========================================================

async function cargarComentarios(taskId) {

    const listaComentarios =
        document.getElementById("lista-comentarios");

    const contadorComentarios =
        document.getElementById("numero-comentarios");


    try {

        const respuesta = await fetch(
            `${API_URL}/comments?taskId=${encodeURIComponent(taskId)}`
        );


        if (!respuesta.ok) {
            throw new Error(
                "No se han podido obtener los comentarios"
            );
        }


        const comentarios = await respuesta.json();


        // Limpiar comentarios anteriores

        listaComentarios.innerHTML = "";


        // Actualizar contador

        contadorComentarios.textContent =
            `(${comentarios.length})`;


        // Si no hay comentarios

        if (comentarios.length === 0) {

            listaComentarios.innerHTML = `
                <p class="sin-comentarios">
                    No hay comentarios todavía.
                </p>
            `;

            return;
        }


        // Crear cada comentario

        comentarios.forEach(comentario => {

            const elemento =
                document.createElement("article");

            elemento.classList.add("comentario");


            elemento.innerHTML = `
                <div class="comentario-cabecera">

                    <span class="comentario-autor">
                        ${comentario.author}
                    </span>

                    <span class="comentario-fecha">
                        ${formatearFechaComentario(
                            comentario.createdAt
                        )}
                    </span>

                </div>

                <p class="comentario-texto">
                    ${comentario.text}
                </p>
            `;


            listaComentarios.appendChild(elemento);
        });


    } catch (error) {

        console.error(
            "Error al cargar comentarios:",
            error
        );

        listaComentarios.innerHTML = `
            <p class="sin-comentarios">
                No se han podido cargar los comentarios.
            </p>
        `;

        contadorComentarios.textContent = "(0)";
    }
}


// =========================================================
// CERRAR MODAL
// =========================================================

function cerrarModalDetalle() {

    const modal =
        document.getElementById("modal-detalle-tarea");

    modal.classList.add("oculto");

    delete modal.dataset.taskId;
}


// Botón X

document
    .getElementById("cerrar-modal-detalle")
    .addEventListener(
        "click",
        cerrarModalDetalle
    );


// Botón Cerrar

document
    .getElementById("btn-cerrar-detalle")
    .addEventListener(
        "click",
        cerrarModalDetalle
    );


// =========================================================
// CERRAR MODAL HACIENDO CLIC FUERA
// =========================================================

document
    .getElementById("modal-detalle-tarea")
    .addEventListener("click", (evento) => {

        if (
            evento.target.id ===
            "modal-detalle-tarea"
        ) {
            cerrarModalDetalle();
        }
    });


// =========================================================
// PRIORIDAD
// =========================================================

function obtenerClasePrioridad(priority) {

    if (priority === "Alta") {
        return "prioridad-alta";
    }

    if (priority === "Media") {
        return "prioridad-media";
    }

    return "prioridad-baja";
}


function obtenerIconoPrioridad(priority) {

    if (priority === "Alta") {
        return "↑";
    }

    if (priority === "Media") {
        return "−";
    }

    return "↓";
}


// =========================================================
// FECHA DE TAREA
// =========================================================

function formatearFecha(fecha) {

    if (!fecha) {
        return "";
    }

    const partes = fecha.split("-");

    return `${partes[2]}/${partes[1]}/${partes[0]}`;
}


// =========================================================
// FECHA DE COMENTARIO
// =========================================================

function formatearFechaComentario(fecha) {

    if (!fecha) {
        return "";
    }

    const fechaObjeto = new Date(fecha);

    return fechaObjeto.toLocaleDateString(
        "es-ES",
        {
            day: "2-digit",
            month: "2-digit",
            year: "numeric"
        }
    );
}


// =========================================================
// CONTADORES
// =========================================================

function actualizarContadores(tareas) {

    const todo =
        tareas.filter(
            tarea => tarea.status === "todo"
        ).length;

    const doing =
        tareas.filter(
            tarea => tarea.status === "doing"
        ).length;

    const done =
        tareas.filter(
            tarea => tarea.status === "done"
        ).length;


    document.getElementById(
        "contador-todo"
    ).textContent = todo;

    document.getElementById(
        "contador-doing"
    ).textContent = doing;

    document.getElementById(
        "contador-done"
    ).textContent = done;


    document.getElementById(
        "total-tareas"
    ).textContent = tareas.length;

    document.getElementById(
        "total-todo"
    ).textContent = todo;

    document.getElementById(
        "total-doing"
    ).textContent = doing;

    document.getElementById(
        "total-done"
    ).textContent = done;
}


// =========================================================
// INICIAR APLICACIÓN
// =========================================================

obtenerTareas();

// =========================================================
// MODAL CREAR TAREA
// =========================================================

const modalCrearTarea = document.getElementById("modal-crear-tarea");
const btnNuevaTarea = document.getElementById("btn-nueva-tarea");
const btnCerrarModalCrear = document.getElementById("cerrar-modal-crear");
const btnCancelarTarea = document.getElementById("cancelar-tarea");
const formularioTarea = document.getElementById("formulario-tarea");


// =========================================================
// ABRIR MODAL DE CREAR TAREA
// =========================================================

btnNuevaTarea.addEventListener("click", () => {
    modalCrearTarea.classList.remove("oculto");

    // Colocar el cursor en el primer campo
    document.getElementById("titulo").focus();
});


// =========================================================
// CERRAR MODAL
// =========================================================

function cerrarModalCrear() {
    modalCrearTarea.classList.add("oculto");
    formularioTarea.reset();
}


// Botón X
btnCerrarModalCrear.addEventListener(
    "click",
    cerrarModalCrear
);


// Botón Cancelar
btnCancelarTarea.addEventListener(
    "click",
    cerrarModalCrear
);


// Cerrar haciendo clic fuera del modal
modalCrearTarea.addEventListener("click", (evento) => {

    if (evento.target === modalCrearTarea) {
        cerrarModalCrear();
    }

});


// =========================================================
// CREAR TAREA - POST
// =========================================================

formularioTarea.addEventListener("submit", async (evento) => {

    evento.preventDefault();


    // Obtener valores del formulario
    const titulo =
        document.getElementById("titulo").value.trim();

    const descripcion =
        document.getElementById("descripcion").value.trim();

    const prioridad =
        document.getElementById("prioridad").value;

    const fecha =
        document.getElementById("fecha").value;


    // Validación básica
    if (!titulo) {
        alert("El título de la tarea es obligatorio.");
        return;
    }


    if (!fecha) {
        alert("La fecha límite es obligatoria.");
        return;
    }


    // Objeto que vamos a enviar a json-server
    const nuevaTarea = {
        id: Date.now().toString(),
        title: titulo,
        description: descripcion,
        priority: prioridad,
        dueDate: fecha,
        status: "todo"
    };


    try {

        const respuesta = await fetch(
            `${API_URL}/tasks`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(nuevaTarea)
            }
        );


        if (!respuesta.ok) {
            throw new Error(
                "No se ha podido crear la tarea."
            );
        }


        const tareaCreada = await respuesta.json();


        console.log(
            "Tarea creada correctamente:",
            tareaCreada
        );


        // Cerrar modal
        cerrarModalCrear();


        // Recargar las tareas desde json-server
        await obtenerTareas();


    } catch (error) {

        console.error(
            "Error al crear la tarea:",
            error
        );

        alert(
            "No se ha podido crear la tarea. " +
            "Comprueba que json-server está funcionando."
        );
    }

});

// =========================================================
// EDITAR TAREA DESDE EL MODAL
// =========================================================

const btnGuardarCambios = document.getElementById(
    "btn-guardar-cambios"
);


btnGuardarCambios.addEventListener("click", async () => {

    const modal = document.getElementById(
        "modal-detalle-tarea"
    );

    const taskId = modal.dataset.taskId;


    // Comprobar que existe una tarea seleccionada
    if (!taskId) {
        console.error("No hay ninguna tarea seleccionada.");
        return;
    }


    // Obtener los valores del modal
    const titulo =
        document.getElementById("detalle-titulo").value.trim();

    const descripcion =
        document
            .getElementById("detalle-descripcion")
            .value
            .trim();

    const prioridad =
        document.getElementById("detalle-prioridad").value;

    const estado =
        document.getElementById("detalle-estado").value;

    const fecha =
        document.getElementById("detalle-fecha").value;


    // Validaciones
    if (!titulo) {
        alert("El título no puede estar vacío.");
        return;
    }

    if (!fecha) {
        alert("La fecha límite es obligatoria.");
        return;
    }


    // Objeto con los cambios
    const cambios = {
        title: titulo,
        description: descripcion,
        priority: prioridad,
        status: estado,
        dueDate: fecha
    };


    try {

        const respuesta = await fetch(
            `${API_URL}/tasks/${encodeURIComponent(taskId)}`,
            {
                method: "PATCH",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(cambios)
            }
        );


        if (!respuesta.ok) {
            throw new Error(
                "No se han podido guardar los cambios."
            );
        }


        const tareaActualizada =
            await respuesta.json();


        console.log(
            "Tarea actualizada:",
            tareaActualizada
        );


        // Cerrar modal
        cerrarModalDetalle();


        // Volver a cargar el tablero desde el servidor
        await obtenerTareas();


    } catch (error) {

        console.error(
            "Error al editar la tarea:",
            error
        );

        alert(
            "No se han podido guardar los cambios."
        );
    }

});

// =========================================================
// ELIMINAR TAREA
// =========================================================

const btnEliminarTarea = document.getElementById(
    "btn-eliminar-tarea"
);


btnEliminarTarea.addEventListener("click", async () => {

    const modal = document.getElementById(
        "modal-detalle-tarea"
    );

    const taskId = modal.dataset.taskId;


    // Comprobar que existe una tarea seleccionada
    if (!taskId) {
        console.error("No hay ninguna tarea seleccionada.");
        return;
    }


    // Obtener el título para mostrarlo en la confirmación
    const titulo =
        document.getElementById("detalle-titulo").value.trim();


    const confirmar = confirm(
        `¿Seguro que quieres eliminar la tarea "${titulo}"?`
    );


    if (!confirmar) {
        return;
    }


    try {

        const respuesta = await fetch(
            `${API_URL}/tasks/${encodeURIComponent(taskId)}`,
            {
                method: "DELETE"
            }
        );


        if (!respuesta.ok) {
            throw new Error(
                "No se ha podido eliminar la tarea."
            );
        }


        console.log(
            `Tarea ${taskId} eliminada correctamente.`
        );


        // Cerrar modal
        cerrarModalDetalle();


        // Volver a cargar las tareas desde json-server
        await obtenerTareas();


    } catch (error) {

        console.error(
            "Error al eliminar la tarea:",
            error
        );


        alert(
            "No se ha podido eliminar la tarea. " +
            "Comprueba que json-server está funcionando."
        );
    }

});

// =========================================================
// CREAR COMENTARIO - POST
// =========================================================

const btnPublicarComentario = document.getElementById(
    "btn-publicar-comentario"
);

const inputNuevoComentario = document.getElementById(
    "nuevo-comentario"
);


btnPublicarComentario.addEventListener("click", async () => {

    // Obtener el modal de detalle
    const modal = document.getElementById(
        "modal-detalle-tarea"
    );

    // Obtener el ID de la tarea que está abierta
    const taskId = modal.dataset.taskId;

    // Obtener el texto escrito
    const texto = inputNuevoComentario.value.trim();


    // Comprobar que hay una tarea seleccionada
    if (!taskId) {
        console.error(
            "No hay ninguna tarea seleccionada."
        );
        return;
    }


    // Comprobar que el comentario no está vacío
    if (!texto) {
        alert("Escribe un comentario antes de publicarlo.");
        return;
    }


    // Crear el objeto del comentario
    const nuevoComentario = {
        id: Date.now().toString(),
        taskId: taskId,
        author: "Tú",
        text: texto,
        createdAt: new Date().toISOString()
    };


    try {

        const respuesta = await fetch(
            `${API_URL}/comments`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify(nuevoComentario)
            }
        );


        if (!respuesta.ok) {
            throw new Error(
                "No se ha podido crear el comentario."
            );
        }


        const comentarioCreado =
            await respuesta.json();


        console.log(
            "Comentario creado correctamente:",
            comentarioCreado
        );


        // Limpiar el campo de texto
        inputNuevoComentario.value = "";


        // Volver a cargar los comentarios
        await cargarComentarios(taskId);


    } catch (error) {

        console.error(
            "Error al crear el comentario:",
            error
        );

        alert(
            "No se ha podido publicar el comentario. " +
            "Comprueba que json-server está funcionando."
        );
    }

});