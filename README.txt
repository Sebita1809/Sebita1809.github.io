== JUEGO VERO — Instrucciones para testear ==

El juego usa Phaser 3 y carga imágenes locales. Los navegadores modernos bloquean
la carga de archivos locales por seguridad (política CORS), por lo que necesitás
levantar un servidor local simple.

OPCIÓN 1 — Python (recomendado, viene instalado en la mayoría de los sistemas):
  1. Abrí una terminal en la carpeta "juego-vero"
  2. Ejecutá: python -m http.server 8000
  3. Abrí el navegador en: http://localhost:8000

OPCIÓN 2 — Node.js (si tenés Node instalado):
  1. Instalá: npm install -g serve
  2. En la carpeta "juego-vero": serve .
  3. Abrí la URL que te muestre (normalmente http://localhost:3000)

OPCIÓN 3 — VS Code con Live Server:
  1. Instalá la extensión "Live Server" en VS Code
  2. Click derecho en index.html → "Open with Live Server"

== ESTRUCTURA DEL PROYECTO ==
index.html           ← entrada del juego
js/
  game.js            ← configuración de Phaser 3
  scenes/            ← una escena por sala
  systems/
    StatsSystem.js   ← lógica de las 4 stats
assets/sprites/      ← imágenes usadas por Phaser
imagenes/            ← originales de los sprites
openspec/            ← registro de cambios y progreso por etapas
