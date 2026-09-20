# Kanban Flow

## ¿Qué es el proyecto?

**Kanban Flow** es una aplicación web de gestión de tareas basada en un tablero Kanban, con tres estados principales:

- Por hacer
- En proceso
- Finalizado

## ¿Para qué sirve?

Permite organizar y gestionar tareas de un proyecto de forma visual.

La aplicación permite crear, editar, eliminar y mover tareas entre las diferentes columnas, además de añadir comentarios y buscar tareas por título.

Los datos se gestionan mediante una API REST simulada con `json-server`.

## ¿Cómo ponerlo en funcionamiento?

### 1. Instalar las dependencias

### json-server

Instalar json-server:

npm install json-server

### SortableJS
Instalar SortableJS:

npm install sortablejs

También se pueden instalar todas las dependencias del proyecto de una vez mediante:

npm install

### 2. Iniciar json-server
npm run server

La API estará disponible en:

http://localhost:3000

### 3. Abrir la aplicación

Abrir index.html con Live Server desde Visual Studio Code.

Para utilizar correctamente las funciones de gestión de tareas y comentarios, es necesario mantener json-server ejecutándose.