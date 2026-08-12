# Etapa 1 — Base del juego

## Qué y por qué

Construir la estructura base del juego: pantalla principal con la cabaña, navegación entre salas, sistema de stats y el personaje de Vero con sus expresiones.

Sin esta base no se puede construir nada más. Es el esqueleto sobre el que se van a montar todas las etapas siguientes.

## Stack

- **Phaser 3** — framework de juego 2D HTML5
- **HTML/CSS/JS** — sin frameworks adicionales
- **Capacitor** — se integra al final (Etapa 5) para empaquetar como app mobile

## Sprites disponibles

- `imagenes/vero.png` — sprite sheet de Vero con expresiones y capas de customización
- `imagenes/ambar.png` — sprite sheet de Ámbar con animaciones
- `imagenes/seba.png` — sprite de Seba con expresiones de videollamada

## Qué incluye esta etapa

### 1. Estructura del proyecto
- Carpeta base con Phaser 3 configurado
- Escenas de Phaser organizadas por sala
- Sistema de assets (carga de sprites e imágenes)

### 2. Pantalla principal — La cabaña
- Cabaña de madera estilo Yellowstone con interior de paredes blancas
- Mucha luz natural, plantas decorativas
- Luz dinámica según la hora real del celular (día/noche sincronizado)

### 3. Mapita de navegación
- Mapa simple de la cabaña con todas las salas clickeables
- Botón separado "Ir a la ciudad" (se implementa en Etapa 3)
- Animación de Vero caminando al seleccionar una sala

### 4. Sistema de stats (UI)
- 4 stats visibles en pantalla: Sueño 😴, Hambre 🍽️, Diversión 🎉, Glucemia 🩸
- Barras de progreso para cada stat
- Las stats bajan con el tiempo automáticamente
- Glucemia tiene rango ideal (no llega a 0, mínimo 32)
- Visualización del estado de Vero según stats:
  - Sueño = 0 → expresión cansada
  - Hambre = 0 → expresión débil/con hambre
  - Diversión = 0 → expresión aburrida
  - Glucemia baja (≤32) → UI tiembla levemente al tocar

### 5. Personaje de Vero
- Sprite principal animado en la pantalla
- Sistema de expresiones (feliz, cansada, aburrida, débil, colorada, sorprendida)
- Expresión cambia automáticamente según el estado de las stats

## Criterio de éxito
- La cabaña se ve correctamente con luz dinámica
- El mapita navega entre salas (aunque las salas estén vacías)
- Las 4 stats bajan con el tiempo y cambian la expresión de Vero
- Vero se anima al seleccionar una sala
