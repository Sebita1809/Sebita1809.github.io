## Context

"Juego Vero" es una mascota virtual (estilo Tamagotchi) construida como app HTML5 pensada para empaquetarse luego como app mobile (Capacitor, Etapa 5). La Etapa 1 define el esqueleto técnico sobre el que se montan todas las etapas siguientes: el runtime del juego, la pantalla principal (la cabaña), la navegación entre salas, el sistema de stats y el personaje de Vero.

Este design documenta **retroactivamente** las decisiones técnicas que ya se tomaron durante la implementación (el código de Etapa 1 y parte de Etapa 2 fue escrito por fuera del flujo OPSX formal). Sirve como registro de la arquitectura real y como base para cerrar los huecos pendientes.

Estado actual del código relevante:
- `js/game.js` — configuración global de Phaser y registro de escenas.
- `js/scenes/` — una escena por pantalla/sala (BootScene, CabinScene, MapScene, SettingsScene, y las salas).
- `js/systems/StatsSystem.js` — modelo de datos y lógica de las 4 stats.
- `js/sprites/VeroPixelArt.js` y `js/sprites/VeroGraphic.js` — dos generadores de sprites de Vero en canvas.
- `assets/sprites/` — 70 assets PNG (fondos, íconos, sprites de Vero pre-renderizados).
- `index.html` — carga Phaser 3.70.0 desde CDN y todos los scripts en orden manual (sin bundler).

## Goals / Non-Goals

**Goals:**
- Establecer el runtime de Phaser 3 con resolución mobile-first (390×844) y escalado FIT.
- Organizar el juego en escenas de Phaser, una por pantalla/sala.
- Cargar todos los assets en un único punto (BootScene) antes de arrancar el juego.
- Modelar 4 stats (Sueño, Hambre, Diversión, Glucemia) que decaen con el tiempo real transcurrido.
- Mostrar la cabaña como pantalla principal con luz dinámica según la hora real del dispositivo.
- Permitir navegar a las salas desde un mapita modal.
- Definir el personaje de Vero con un set de expresiones seleccionables según el estado de las stats.

**Non-Goals:**
- Lógica interna de cada sala (cocinar, dormir, jugar) — corresponde a etapas posteriores.
- Ir a la ciudad / mapa exterior — Etapa 3.
- Empaquetado mobile con Capacitor — Etapa 5.
- Persistencia de stats entre sesiones (guardado/carga) — fuera de alcance de Etapa 1.
- Sonido/música.

## Decisions

### D1. Phaser 3 sin bundler, scripts globales en orden
Se usa Phaser 3.70.0 cargado por CDN en `index.html`, seguido de cada archivo `.js` como script global (sin módulos ES, sin `import`/`export`, sin build step). Las clases (`BootScene`, `StatsSystem`, etc.) quedan en el scope global y Phaser las referencia por nombre.
- **Por qué:** minimiza fricción de tooling para un proyecto chico y facilita el empaquetado posterior con Capacitor (que sirve archivos estáticos). El orden de carga en `index.html` es la única "dependencia" a mantener.
- **Alternativa descartada:** Vite/webpack + módulos ES. Aporta tree-shaking y HMR pero agrega complejidad de build innecesaria para el tamaño actual.

### D2. Una escena de Phaser por pantalla/sala
`game.js` registra 9 escenas: `BootScene`, `CabinScene`, `MapScene`, `SettingsScene`, `KitchenScene`, `BedroomScene`, `BathroomScene`, `ActivityScene`, `GardenScene`. La cabaña es la escena raíz tras el boot.
- **Por qué:** cada sala tiene su propio ciclo de vida, assets y estado; el modelo de escenas de Phaser encaja naturalmente (pause/resume/launch/stop).
- **Patrón de navegación:** el mapita (`MapScene`) se abre con `scene.pause()` + `scene.launch('MapScene')` (overlay modal encima de la cabaña pausada). Entrar a una sala usa `cameras.main.fade` + `scene.stop` + `scene.start` (transición dura, reemplaza la escena).

### D3. Estado compartido vía `registry`
`StatsSystem` se instancia una sola vez en `BootScene.create()` y se guarda en `this.registry.set('stats', ...)`. Cada escena lo recupera con `this.registry.get('stats')`.
- **Por qué:** el registry de Phaser es un store global entre escenas; evita singletons manuales y sobrevive a los cambios de escena.

### D4. StatsSystem: decaimiento por acumuladores de delta
`StatsSystem.update(delta)` acumula el `delta` (ms del frame) en un acumulador por stat y decrementa 1 punto cuando el acumulador supera un umbral fijo (Sueño 30s, Hambre 25s, Diversión 40s). La Glucemia no decae linealmente: fluctúa ±0.5 cada 20s con un piso de 32 y techo de 200.
- **Por qué:** desacopla el ritmo de decaimiento del framerate. Usar acumuladores en vez de `setInterval` mantiene todo dentro del loop de Phaser y respeta pausas de escena.
- **Umbrales de expresión:** `getExpression()` devuelve la expresión prioritaria (glucemia≤32 → 'colorada' > cansada > debil > aburrida), usando ≤20 como umbral de "stat baja" (no 0, para dar aviso antes del piso).

### D5. Luz dinámica por overlay de color según hora real
`CabinScene` dibuja un `rectangle` semitransparente a pantalla completa (depth 5) y ajusta su color/alpha según `new Date().getHours()`: día (6–18) tinte cálido tenue, atardecer (18–22) naranja, noche (22–6) azul oscuro más opaco. Se refresca con un `time.addEvent` cada 60s.
- **Por qué:** un overlay de color es la forma más barata de simular luz sin múltiples fondos ni shaders. Leer la hora real del dispositivo cumple el requisito de sincronización día/noche sin backend.

### D6. Stats UI como anillos (rings) circulares, no barras lineales
La UI de stats se dibuja con un `Graphics` que redibuja cada frame 4 anillos (arcos): un anillo de fondo gris + un arco de relleno proporcional al valor, desde arriba en sentido horario. La glucemia colorea el anillo según zona (verde/amarillo/rojo).
- **Nota:** el proposal pide "barras de progreso"; la implementación resolvió con anillos circulares alrededor de cada ícono. Funcionalmente equivalente (feedback visual del nivel) pero difiere de la letra del proposal.

### D7. Dos generadores de sprite de Vero en canvas (pixel art procedural)
Existen dos módulos que generan la textura de Vero dibujando píxeles en un `<canvas>` y registrándola como textura de Phaser (`textures.addCanvas`): `VeroPixelArt.js` (grilla 48×64, paleta rica, expresiones idle/feliz/cansada/aburrida/debil/colorada/sorprendida) y `VeroGraphic.js` (grilla 20×42, más simple, idle/feliz/cansada). Además BootScene precarga PNGs de Vero ya renderizados (`vero_idle`, `vero_walk1..5`, expresiones, poses).
- **Por qué canvas procedural:** permite generar/ajustar expresiones sin depender de un pipeline de arte externo.
- **Deuda:** hay redundancia (dos generadores + PNGs precargados) y **ninguno está conectado a una escena todavía** (ver Risks). La decisión de cuál usar como fuente canónica quedó abierta.

## Risks / Trade-offs

- **[Vero no se muestra en pantalla]** → CabinScene dibuja fondo, botones, stats UI, engranaje y overlay, pero **nunca agrega un sprite de Vero**. `getExpression()`, `buildVeroTexture()` y `createVeroTexture()` existen pero **no son llamados por ninguna escena**. El criterio de éxito "las stats cambian la expresión de Vero" no se cumple aún. Mitigación: tarea pendiente 5.x — instanciar el sprite en CabinScene y suscribirlo a `getExpression()`.
- **[Animación de caminata pendiente]** → al elegir sala, `MapScene._goToRoom` sólo hace un fade de cámara; no hay animación de Vero caminando. Los frames `vero_walk1..5` están cargados pero sin usar. Mitigación: tarea pendiente 3.x.
- **[Orden de scripts frágil]** → sin bundler, un reordenamiento en `index.html` puede romper el juego (clase referenciada antes de definirse). Mitigación: mantener BootScene/StatsSystem antes de las escenas que los usan.
- **[Redundancia de sprites]** → dos generadores canvas + PNGs precargados para el mismo personaje. Trade-off: flexibilidad vs. mantener tres fuentes en sync. Convendría elegir una fuente canónica.
- **[Temblor de glucemia automático, no "al tocar"]** → el proposal dice "UI tiembla al tocar"; la implementación hace temblar el ícono de glucemia automáticamente en el update loop cuando ≤32. Diferencia de disparador.
- **[Sin persistencia]** → las stats se reinician en cada arranque. Aceptable para Etapa 1; a resolver antes de release.

## Migration Plan

No aplica migración de datos (proyecto greenfield, sin usuarios ni estado persistido). El "deploy" es servir los archivos estáticos (`index.html` + `js/` + `assets/`). Rollback = revertir el commit. La integración con Capacitor (empaquetado) se hará en Etapa 5 y no afecta esta base.

## Open Questions

1. ¿Cuál generador de sprite de Vero es el canónico: `VeroPixelArt` (48×64, más expresiones), `VeroGraphic` (20×42) o los PNGs precargados? Hay que consolidar en uno.
2. ¿La UI de stats debe migrar a barras lineales (como pide el proposal) o se acepta el diseño de anillos actual?
3. ¿El temblor de glucemia debe ser al tocar (proposal) o automático (implementación actual)?
4. ¿Se necesita persistencia de stats entre sesiones ya en esta base o se difiere?
