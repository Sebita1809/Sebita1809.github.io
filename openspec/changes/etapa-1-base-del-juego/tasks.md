# Tasks — Etapa 1: Base del juego

> Documentación retroactiva: el código de esta etapa ya fue implementado por fuera del flujo OPSX.
> `[x]` = verificado en el código. `[ ]` = pendiente o incompleto (con nota de qué falta).

## 1. Estructura del proyecto y runtime

- [x] 1.1 Configurar Phaser 3 (CDN 3.70.0) en `index.html` con carga de scripts en orden
- [x] 1.2 Configurar `Phaser.Game` 390×844, scale FIT + autoCenter, pixelArt true (`js/game.js`)
- [x] 1.3 Registrar las 9 escenas en la config (Boot, Cabin, Map, Settings, Kitchen, Bedroom, Bathroom, Activity, Garden)
- [x] 1.4 Implementar BootScene con precarga de todos los assets y barra de progreso
- [x] 1.5 Aplicar filtro LINEAR a fondos/íconos y NEAREST a pixel art
- [x] 1.6 Instanciar StatsSystem en el registry desde BootScene y arrancar CabinScene

## 2. Pantalla principal — La cabaña

- [x] 2.1 Dibujar el fondo de la cabaña escalado (`CabinScene._drawBackground`)
- [x] 2.2 Botón de engranaje con giro que abre SettingsScene
- [x] 2.3 Overlay de luz dinámica según hora real del dispositivo (día/atardecer/noche)
- [x] 2.4 Refresco periódico del overlay (timer cada 60s)

## 3. Mapita de navegación

- [x] 3.1 MapScene modal: abrir con pause+launch desde el cartel de la casa
- [x] 3.2 Listar salas clickeables (Cocina, Dormitorio, Baño, Sala de actividades, Huerta)
- [x] 3.3 Navegar a la sala seleccionada con transición de fade
- [x] 3.4 Botón de cerrar que reanuda la cabaña
- [x] 3.5 Botón "Ir a la ciudad" deshabilitado con leyenda "(próximamente)"
- [x] 3.6 Animación de Vero caminando al seleccionar una sala
      <!-- `MapScene._goToRoom` resume CabinScene y llama `CabinScene.playWalkAnimation` antes del fade -->

## 4. Sistema de stats

- [x] 4.1 Modelo StatsSystem con 4 stats (sleep, hunger, fun, glucemia)
- [x] 4.2 Decaimiento por acumuladores de delta (Sueño 30s, Hambre 25s, Diversión 40s)
- [x] 4.3 Glucemia acotada: fluctúa cada 20s con piso 32 y techo 200
- [x] 4.4 UI de stats en la cabaña con íconos e indicador de nivel
      <!-- NOTA: implementado como anillos circulares, no como barras lineales (ver design D6) -->
- [x] 4.5 Color del indicador de glucemia según zona (verde/amarillo/rojo)
- [x] 4.6 Temblor del ícono de glucemia cuando ≤32
      <!-- NOTA: se dispara automático en el update loop, no "al tocar" como pedía el proposal -->

## 5. Personaje de Vero

- [x] 5.1 Definir arte y expresiones de Vero (idle, feliz, cansada, aburrida, debil, colorada, sorprendida) — PNGs precargados en `BootScene`
- [x] 5.2 Lógica de selección de expresión prioritaria según stats (`StatsSystem.getExpression`)
- [x] 5.3 Precargar los PNGs de Vero (idle, expresiones, walk, poses) en BootScene
- [x] 5.4 Mostrar el sprite de Vero en la cabaña
      <!-- `CabinScene._createVero` agrega this._vero centrado en W/2, H*0.42, depth 10 -->
- [x] 5.5 Conectar `getExpression()` al sprite para cambio automático de expresión
      <!-- `CabinScene._updateVeroExpression` (llamado desde update()) combina hasFeliz()/getExpression() y hace setTexture -->
- [x] 5.6 Animación idle (parpadeo) de Vero en la cabaña
      <!-- `CabinScene._playBlink`, timer cada 4000ms, recorre vero_idle1..4 y vuelve a la expresión actual -->
- [x] 5.7 Consolidar la fuente canónica del sprite (VeroPixelArt vs VeroGraphic vs PNGs precargados)
      <!-- Se eliminaron js/sprites/VeroPixelArt.js y js/sprites/VeroGraphic.js (código muerto, ninguna escena los usaba)
           y su <script> en index.html; los PNGs de BootScene quedan como única fuente -->

## 6. Criterio de éxito (verificación)

- [x] 6.1 La cabaña se ve con luz dinámica
- [x] 6.2 El mapita navega entre salas (aunque estén vacías)
- [x] 6.3 Las 4 stats bajan con el tiempo
- [x] 6.4 Las stats cambian la expresión de Vero en pantalla
      <!-- Resuelto por 5.4/5.5 -->
- [x] 6.5 Vero se anima al seleccionar una sala
      <!-- Resuelto por 3.6; requirió además resumir CabinScene desde MapScene para que sus timers avancen (ver nota en 3.6) -->
