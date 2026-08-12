## Context

"Juego Vero" es una mascota virtual (estilo Tamagotchi) en Phaser 3 sin bundler (ver Etapa 1). La Etapa 2 desarrolla el interior de las 5 salas de la cabaña: Cocina, Dormitorio, Baño, Sala de actividades y Huerta. Cada sala tiene objetos decorativos, objetos interactivos y mecánicas que afectan las stats de Vero.

Este design documenta el estado **real** del código al día de hoy y las decisiones técnicas para completar la etapa. La Etapa 1 dejó las 5 escenas registradas y navegables (`MapScene` → `scene.start`), pero **solo la Cocina tiene contenido implementado**; el resto son placeholders.

Estado actual del código relevante:
- `js/scenes/KitchenScene.js` — **178 líneas, parcialmente implementada**: fondo escalado, ventana con cielo dinámico, hover-zones de heladera/hornito/mercadería, Ámbar dormida sobre la heladera y la mecánica "comer rápido". Faltan microondas, cafetera, cocinar con timing y quemado.
- `js/scenes/BedroomScene.js` — **33 líneas, placeholder** (rectángulo de color + emoji 🛏️ + "En construcción..." + botón volver).
- `js/scenes/BathroomScene.js` — **33 líneas, placeholder** (🚿).
- `js/scenes/ActivityScene.js` — **33 líneas, placeholder** (🎮).
- `js/scenes/GardenScene.js` — **33 líneas, placeholder** (🌱).
- `js/scenes/BootScene.js` — precarga assets. **Solo hay assets de Cocina** (`cocina_fondo`=`cocina_nueva.png`, `heladera`, `hornito`, `mercaderia`) más los genéricos `ambar`, `ambar_dormida`, `seba`. **No hay assets** para bañera, inodoro, cama, armario, espejo, huerta/canteros, semillas, plantas, dron/caja, ni para los minijuegos.
- `js/systems/StatsSystem.js` — 4 stats: `sleep`, `hunger`, `fun`, `glucemia`. **No existe una stat de "higiene"** pese a que el proposal la menciona para Baño y Dormitorio (ver Open Questions).

## Goals / Non-Goals

**Goals:**
- Reemplazar los 4 placeholders (Dormitorio, Baño, Sala de actividades, Huerta) por salas reales con sus objetos e interacciones.
- Completar la Cocina reemplazando los objetos físicos de comida con estado visual (productos dibujados que aparecen/se vacían) por un **sistema de menús** sobre un **inventario de datos compartido** con la Huerta (paneles de heladera/alacena/recetario + panel fijo de comer rápido).
- Definir patrones reutilizables para las mecánicas transversales: barra de timing y gesto de swipe.
- Diseñar el sistema de crecimiento de plantas de la Huerta con tiempos reales (30 min a 12 hs) y persistencia entre sesiones.
- Definir cómo entran Ámbar y Seba en las escenas (Cocina, Dormitorio).

**Non-Goals:**
- Sistema de customización de ropa del armario (Dormitorio → Etapa 3).
- Los minijuegos que abre la Sala de actividades (Etapa 4); esta etapa solo entrega el ícono/menú de acceso.
- Notificaciones push reales del sistema operativo (requiere empaquetado Capacitor, Etapa 5); en esta etapa se modela la lógica de "planta lista" y, a lo sumo, un aviso in-game.
- Sistema económico global de monedas y su balance (se necesita para comprar semillas; ver Open Questions).
- **Microondas y cafetera como objetos separados con mecánica propia** — descartados definitivamente (no pendientes): el alcance se simplificó a heladera/alacena/recetario + comer rápido.
- **Quemado de comida** (carne/salchicha quemándose por dejarla mucho tiempo) — descartado definitivamente; el cocinar se resuelve con una única barra de timing sin penalización de sobrecocción.
- Sonido/música.

## Decisions

### D1. Todas las salas reutilizan el patrón de escena de la Cocina
Cada sala nueva SHALL seguir el patrón ya establecido en `KitchenScene` (y en `CabinScene` de Etapa 1):
- `_drawBackground(W, H)`: cargar el fondo, escalarlo por `H / tex.height`, centrarlo con `offsetX = (W - tex.width*scale)/2`, guardar `_bgScale/_bgOffsetX/_bgW/_bgH` para poder mapear cajas relativas.
- Cajas de objetos como fracciones (`left/top/width/height` en 0..1) del fondo, convertidas a coordenadas de escena con un helper `_toScene(box)` idéntico al de la Cocina.
- Depth layers consistentes: fondo=1 (overlays de fondo como el cielo=0), objetos interactivos≈5, personajes (Ámbar/Vero)≈6, textos flotantes≈10, botón volver=20.
- Objetos interactivos con `_makeHoverObject(box, callback)`: sprite recortado del fondo, crecimiento sutil (×1.025) en `pointerover`, cursor de mano solo si hay callback.
- `_makeBackButton(W, H)`: botón "← Volver" que hace `scene.start('CabinScene')` + `scene.launch('MapScene')`.
- **Por qué:** la Cocina ya probó este patrón; unificarlo evita divergencias y hace que cada sala sea un archivo autocontenido. Convendría extraer el patrón a una clase base `RoomScene` o a helpers compartidos, pero eso es refactor opcional (ver Risks).
- **Alternativa descartada:** un layout absoluto por píxeles distinto por sala — frágil ante cambios de arte y de resolución.

### D2. Clase reutilizable `TimingBar` para las mecánicas de "barrita de timing"
Cocina (cocinar cada paso), Baño (frotar/enjuagar, tirar cadena, destapar) e Inodoro comparten la mecánica de "barra de timing": un cursor se desplaza y el jugador debe tocar dentro de una zona objetivo. Se SHALL diseñar una única clase reutilizable (p.ej. `js/systems/TimingBar.js` o `js/ui/TimingBar.js`) que reciba `{ scene, x, y, width, targetZone, speed, onResult }` y emita `success` / `fail` (y `perfect` opcional). La barra vive como overlay dentro de la escena que la invoca.
- **Por qué:** la mecánica se repite en 3+ lugares; una sola implementación garantiza consistencia de sensación y reduce bugs.
- **Nota:** esta clase **no existe todavía** en el código; es una decisión de diseño a implementar, no algo ya presente.

### D3. Helper reutilizable de gesto swipe (`SwipeGesture` / `SwipeDetector`)
Baño (frotar shampoo, ciclar peinados en el espejito) usa gestos de swipe. Se SHALL diseñar un helper que detecte swipes sobre una zona (`pointerdown` → `pointermove` → `pointerup`, midiendo dirección y distancia mínima) y cuente repeticiones o dispare un ciclo de opciones. Puede combinarse con `TimingBar` bajo un paraguas conceptual "minijuego de paso" pero se mantienen como piezas separadas.
- **Por qué:** Phaser da eventos de puntero crudos; encapsular el reconocimiento de swipe evita duplicar la matemática en cada sala.

### D4. Ámbar y Seba entran como sprites simples posicionados por escena
- **Cocina:** Ámbar (`ambar_dormida`) ya se coloca sobre la heladera con `setOrigin(0.5,1)`, altura objetivo 48px, depth 6. Se mantiene.
- **Dormitorio (dormir sola):** Vero se acuesta en la cama y Ámbar (`ambar`) sube a los pies de la cama; ambos como sprites estáticos/tween simples, depth por encima de la cama.
- **Dormitorio (dormir con Seba):** secuencia scriptada con tweens — aparece un dron con una caja 📦, la caja "se rompe", aparece Seba (`seba`) y Vero+Seba se abrazan. **Faltan assets** de dron y caja; se resuelven con sprites nuevos o con emoji/formas temporales (ver Open Questions).
- **Por qué:** no hace falta un sistema de personajes complejo; son apariciones puntuales guionadas con los sprites `ambar`/`seba` ya cargados.

### D5. Persistencia de la Huerta con timestamps reales en `localStorage`
El crecimiento de plantas ocurre en tiempo real (30 min a 12 hs) y debe sobrevivir a cerrar la app. Se SHALL guardar el estado de cada cantero en `localStorage` como una lista de plantas con: `{ plotId, species, plantedAt (epoch ms), watered (bool/estado de riego), growthMs }`. Al entrar a la Huerta (y periódicamente), el estado de madurez se **deriva por cálculo**: `ready = Date.now() - plantedAt >= growthMs`. No se usa un timer que corra en vivo durante horas; se compara contra el reloj real cada vez que hace falta.
- **Por qué:** los tiempos son de horas y la app puede estar cerrada; guardar el timestamp de plantado y derivar el estado por diferencia contra `Date.now()` es la técnica estándar para farming games y no depende de que el proceso siga vivo.
- **Alternativa descartada:** acumuladores de delta como los de `StatsSystem` — solo avanzan mientras la escena corre, así que una planta nunca crecería con la app cerrada.
- **Clave de storage sugerida:** `juego-vero:garden` (JSON). Etapa 1 no persiste stats; este es el primer uso de `localStorage` del proyecto, así que conviene encapsularlo en un módulo `GardenStore` para poder cambiar el backend después (p.ej. Capacitor Preferences en Etapa 5).

### D6. "Notificación de planta lista": lógica ahora, push del SO después
En esta etapa la condición "planta lista" se calcula (D5) y puede señalarse **in-game** (badge en el cartel de la huerta, aviso al entrar). La **notificación push real** del sistema operativo depende del empaquetado nativo (Capacitor, Etapa 5) y queda fuera de alcance; el diseño solo deja el punto de enganche (una función `getReadyPlants()` que la capa nativa podrá consultar).

### D7. La Sala de actividades solo entrega el acceso a minijuegos
Decoración fija (estantería, caballete, compu/tablet, tela, binoculares/cámara, food truck) como sprites no interactivos, más **un** objeto interactivo: el ícono de juego de mesa que abre un menú de minijuegos. Los minijuegos en sí son Etapa 4; el menú puede quedar como stub ("próximamente") sin romper el contrato.

### D8. La Cocina usa un sistema de menús sobre inventario de datos, no objetos físicos de comida
En vez de dibujar/animar productos individuales apareciendo y vaciándose visualmente sobre la mesada, la Cocina SHALL usar el fondo limpio (sin productos dibujados encima) y **reutilizar las 3 zonas interactivas que ya existen en `KitchenScene.js`** (heladera, hornito, mercadería) cambiando su callback para abrir paneles sobre el inventario de datos compartido (ver D9 y Open Question 2):
- **Heladera** (click) → panel modal listando el inventario de categoría `heladera` (ícono + nombre + cantidad).
- **Mercadería/estantes** (click) → panel modal listando el inventario de categoría `alacena`.
- **Hornito** (click) → **Recetario**: panel modal con las 5 recetas (ver D9), cada una mostrando sus ingredientes (verde = disponible, gris = falta) y un botón "Cocinar" habilitado SOLO si están todos los ingredientes completos. Al cocinar se dispara **una única** barra de timing (no una por paso, para mantenerlo simple): si se acierta, se consume 1 unidad de cada ingrediente y sube el hambre según la receta; si falla, no se consume nada.
- Los paneles modales SHALL reutilizar el patrón visual que **ya existe en `js/scenes/MapScene.js`** (overlay oscuro + panel redondeado + lista de filas + botón cerrar) — no es una técnica nueva, es el mismo patrón aplicado a otro contenido.
- Aparte de las zonas de la mesada, un **panel fijo** (no modal, siempre visible en pantalla) con flechas `◀ ▶` cicla entre los productos del inventario marcados como "comestible directo", mostrando el ícono grande del actual + botón "Comer" (consume 1 unidad, sube el hambre poco, cooldown corto, texto flotante tipo "+8 🍽️"). Esto **reemplaza** la mecánica actual de tocar directo la heladera/mercadería para "comer rápido".
- **Por qué:** unifica la Cocina con la Huerta bajo un único inventario de datos, evita mantener estado visual pixel a pixel de cada producto sobre la mesada, y reutiliza dos patrones ya probados (las hover-zones existentes y el modal de `MapScene`). El usuario simplificó explícitamente el alcance para no complicar la implementación.
- **Alternativa descartada:** dibujar/animar cada producto físico sobre la mesada con su propio estado de aparición y vaciado — frágil ante el arte, duplica el estado del inventario en la capa visual y no escala al catálogo cerrado de D9. También quedan descartados definitivamente microondas, cafetera y el quemado de comida (ver Non-Goals).

### D9. Catálogo de contenido cerrado: 24 productos + 5 recetas
El contenido de comida SHALL ser un catálogo cerrado, definido como datos (no hardcodeado en la escena). Vero es vegetariana; la única carne que come es hamburguesa (no se incluye ninguna otra carne).

**Productos (24), por categoría:**
- No cultivables, categoría `alacena` (comprables, NO comestibles directo salvo Galletitas): **Fideos, Harina, Azúcar**.
- No cultivables, categoría `alacena`, SÍ comestible directo: **Galletitas**.
- No cultivables, categoría `heladera`, SÍ comestibles directo: **Yogur, Queso, Pan**.
- No cultivables, categoría `heladera`, ingrediente de receta (NO comestible directo): **Huevos, Hamburguesas (crudas)**.
- Frutas/verduras, categoría `cosecha` (comprables O cosechables en la Huerta), TODAS comestibles directo: **Manzana, Tomate, Lechuga, Zanahoria, Remolacha, Frutilla, Choclo, Mandarina, Naranja, Sandía**.
- Platos preparados, categoría `plato` (resultado de cocinar; NO están en el inventario para comprar, se generan al cocinar y se consumen al servírselos a Vero — no se acumulan como stock): **Ensalada armada, Sandwich armado, Pastas servidas, Torta, Hamburguesa armada**.

**Recetas (5)** — id, nombre, ingredientes y hambre (valores relativos; comer rápido da ~8-12):
1. `ensalada` — Ensalada: 1 Tomate + 1 Lechuga → sube hambre 18.
2. `sandwich` — Sandwich: 1 Pan + 1 Queso + 1 Tomate y/o Lechuga (el que haya disponible) → sube hambre 20.
3. `pastas` — Pastas: 1 Fideos + 1 Tomate → sube hambre 22.
4. `torta` — Torta: 1 Harina + 1 Azúcar + 1 Huevos → sube hambre 25.
5. `hamburguesa` — Hamburguesa: 1 Hamburguesas + 1 Pan → sube hambre 22.

**Modelo de datos sugerido** (a implementar más adelante; se documenta como decisión, no se escribe código aún):
- `js/data/products.js`: array de `{ id, nombre, categoria: 'heladera'|'alacena'|'cosecha'|'plato', comestibleDirecto: bool, sprite: 'nombre_textura' }`.
- `js/data/recetas.js`: array de `{ id, nombre, ingredientes: [{ productId, cantidad }], hambre: number }`.
- **Por qué:** un catálogo cerrado y declarativo permite que la Cocina (menús, recetario, comer rápido) y la Huerta (cosecha → inventario) compartan una única fuente de verdad de productos, y desacopla el contenido de la lógica de escena.

## Risks / Trade-offs

- **[No existe stat de "higiene"]** → El proposal dice que bañarse "sube higiene" y la ropa sucia "baja higiene", pero `StatsSystem` solo tiene sleep/hunger/fun/glucemia. Hay que decidir si se agrega una 5ª stat o se mapea a otra. **Mitigación:** decisión bloqueante para Baño/Dormitorio; ver Open Questions. Impacta la UI de stats de Etapa 1 si se agrega una nueva.
- **[Faltan casi todos los assets de Etapa 2]** → BootScene solo tiene arte de Cocina. Dormitorio, Baño, Sala de actividades y Huerta no tienen fondos ni sprites de objetos; tampoco existen dron/caja ni arte de semillas/plantas/canteros ni de los minijuegos. **Mitigación:** cada sala necesita una tarea previa de "conseguir/precargar assets"; sin ellos solo se puede maquetar con formas/emoji temporales.
- **[Patrón de escena copiado, no compartido]** → Reusar el patrón de la Cocina por copia lleva a divergencias. **Mitigación:** considerar una clase base `RoomScene` o helpers (`roomBackground`, `makeHoverObject`, `makeBackButton`) antes de escribir 4 salas casi iguales.
- **[Cocina incompleta afecta el criterio de éxito]** → Hoy la Cocina solo tiene "comer rápido" tocando la heladera/mercadería; falta el sistema de menús (heladera/alacena/recetario) y el panel fijo de comer rápido (D8/D9). **Mitigación:** tareas específicas de Cocina (catálogo de datos, paneles modales, cocinar con timing única, panel de comer rápido). Microondas, cafetera y quemado NO son parte del criterio de éxito (descartados; ver Non-Goals).
- **[Origen del stock de productos no cosechables sin resolver]** → El nuevo sistema de menús se apoya en un inventario de datos (D8/D9) compartido con la Huerta: la cosecha cae a ese mismo inventario (confirmado, ver Open Question 2). Lo que queda abierto es de dónde sale el stock de los productos NO cosechables (Fideos, Harina, Azúcar, Queso, Pan, Huevos, Hamburguesas, Galletitas, Yogur) y de dónde salen las monedas para comprarlos/comprar semillas. **Mitigación:** definir el sistema económico común de ambas salas (ver Open Question 2).
- **[`localStorage` en contexto file://]** → Si el juego se abre por `file://` en algunos navegadores, `localStorage` puede comportarse distinto; en el empaquetado Capacitor conviene migrar a Preferences. **Mitigación:** encapsular en `GardenStore` (D5).

## Migration Plan

No hay migración de datos (no había estado persistido en Etapa 1). El deploy sigue siendo servir estáticos (`index.html` + `js/` + `assets/`). Al introducir `localStorage` para la Huerta, prever un esquema versionado (`{ v: 1, plots: [...] }`) para poder migrar el formato de guardado más adelante sin romper partidas viejas. Rollback = revertir el commit; el estado de la huerta en `localStorage` del usuario quedaría huérfano pero no rompe el juego.

## Open Questions

1. **Stat de higiene: Resuelto** — no se agrega una 5ª stat ni anillo nuevo en la UI de la cabaña. Bañarse da un empujón chico a las stats existentes (**hambre + sueño + diversión**, vía los `add` que ya expone `StatsSystem`). La ropa sucia en el Dormitorio queda **puramente decorativa** (bultito visual hasta lavarse/guardarse), sin restar ninguna stat — decisión explícita del usuario para no complicar con una mecánica simétrica de penalización.
2. **Inventario y economía (parcialmente resuelta):** **Resuelto** — el inventario es **uno solo compartido** entre Huerta y Cocina: lo cosechado en la Huerta cae al mismo inventario que lo comprado/repuesto en la Cocina (D8/D9). **Abierto** — de dónde sale el stock de los productos NO cosechables (Fideos, Harina, Azúcar, Queso, Pan, Huevos, Hamburguesas, Galletitas, Yogur): ¿se compran con monedas? ¿se reponen solos con el tiempo? Y de dónde salen las **monedas** para comprar (semillas en la Huerta, productos en la Cocina). Es el mismo sistema económico pendiente para ambas salas, ahora unificado en esta única pregunta.
3. **Formato exacto de guardado de plantas:** confirmar campos y clave de `localStorage` de D5 (`plotId`, `species`, `plantedAt`, `watered`, `growthMs`), y si el riego es obligatorio para crecer o solo acelera/condiciona la cosecha.
4. **Assets faltantes:** ¿se produce arte nuevo (fondos de las 4 salas, objetos, dron/caja, semillas/plantas/canteros) o se maqueta con formas/emoji temporales para esta etapa? Define cuánto de cada sala es realmente jugable ahora.
5. **Menú de minijuegos:** ¿la Sala de actividades muestra un menú stub "próximamente" o ya lista los minijuegos previstos (deshabilitados) de Etapa 4?
6. **Notificación de planta lista:** ¿alcanza con un aviso in-game (badge en el cartel de huerta) en esta etapa, dejando la push nativa para Etapa 5?
7. **Extracción de `RoomScene`:** ¿se refactoriza el patrón común a una clase base/helpers antes de implementar las 4 salas, o se copia el patrón de la Cocina por sala?
8. **Asset de fondo de cocina sin productos dibujados:** `assets/sprites/cocina_nueva.png` (fondo actual) tiene productos de comida ya dibujados sobre la mesada (latas, frascos, pan, zanahorias). Para que el sistema de menús (D8) tenga sentido visualmente hace falta una **versión del fondo con la mesada despejada** (sin esos productos dibujados). Es un asset nuevo a producir/pedir, no algo resoluble por código.
