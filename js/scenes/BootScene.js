class BootScene extends Phaser.Scene {
  constructor() { super('BootScene'); }

  preload() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Barra de carga
    const barBg = this.add.rectangle(W / 2, H / 2 + 40, 260, 20, 0x333355).setOrigin(0.5);
    const bar   = this.add.rectangle(W / 2 - 130, H / 2 + 40, 0, 16, 0xa78bfa).setOrigin(0, 0.5);
    this.add.text(W / 2, H / 2, 'Cargando...', {
      fontSize: '18px', fill: '#ffffff', fontFamily: 'monospace'
    }).setOrigin(0.5);

    this.load.on('progress', (v) => { bar.width = 256 * v; });

    // Sprite principal
    this.load.image('vero_idle',          'assets/sprites/vero_idle.png');

    // Expresiones. Ya no hay 'hambrienta'/'sorprendida' como sprite propio
    // (pedido del usuario: sacar la diferencia visible entre versiones de
    // Vero) — hambre ahora es un ícono superpuesto (icono_hambre, ver
    // RoomScene._updateHungerIcon) y sorprendida se sacó directamente
    // (BedroomScene ya no fuerza esa expresión cuando aparece Seba).
    this.load.image('vero_feliz',         'assets/sprites/vero_feliz.png');
    this.load.image('vero_cansada',       'assets/sprites/vero_cansada.png');
    this.load.image('vero_aburrida',      'assets/sprites/vero_aburrida.png');
    this.load.image('vero_colorada',      'assets/sprites/vero_colorada.png');
    this.load.image('icono_hambre',       'assets/sprites/icono_hambre.png');

    // Prendas (Etapa 3, personalización — ver js/data/outfits.js y
    // RoomScene._veroIdleTexture). Ya no hay elección de peinado (pedido
    // del usuario: sacar esa diferencia entre versiones) — cada prenda usa
    // siempre su versión "suelto" (recortadas con extract-vero-outfits.js).
    // Mismo filtro NEAREST que vero_idle (pixel art, no van en la lista
    // LINEAR de abajo).
    //
    // 'default' NO se carga acá — vuelve a usar vero_idle directo (el
    // clásico de siempre). vero_default_suelto.png (vero-default-
    // peinados.png, tanda de arte más nueva) no coincidía en diseño con
    // jardinera/pijama/vestido — reportado por el usuario, queda en disco
    // sin usar.
    ['pijama', 'jardinera', 'vestido'].forEach(outfit => {
      this.load.image(`vero_${outfit}_suelto`, `assets/sprites/vero_${outfit}_suelto.png`);
    });

    // Animaciones idle (parpadeo)
    this.load.image('vero_idle1',         'assets/sprites/vero_idle1.png');
    this.load.image('vero_idle2',         'assets/sprites/vero_idle2.png');
    this.load.image('vero_idle3',         'assets/sprites/vero_idle3.png');
    this.load.image('vero_idle4',         'assets/sprites/vero_idle4.png');

    // Animaciones caminando
    this.load.image('vero_walk1',         'assets/sprites/vero_walk1.png');
    this.load.image('vero_walk2',         'assets/sprites/vero_walk2.png');
    this.load.image('vero_walk3',         'assets/sprites/vero_walk3.png');
    this.load.image('vero_walk4',         'assets/sprites/vero_walk4.png');
    this.load.image('vero_walk5',         'assets/sprites/vero_walk5.png');

    // Otras poses
    this.load.image('vero_saludando',     'assets/sprites/vero_saludando.png');
    this.load.image('vero_victoria',      'assets/sprites/vero_victoria.png');
    this.load.image('vero_pensando',      'assets/sprites/vero_pensando.png');
    this.load.image('vero_usando_objeto', 'assets/sprites/vero_usando_objeto.png');
    this.load.image('vero_dano',          'assets/sprites/vero_dano.png');

    // Fondo principal
    this.load.image('bg_cabana', 'assets/sprites/preview_movil_final_completo.png');

    // Stats icons
    this.load.image('stat_sueno',     'assets/sprites/stat_sueno_movil (1).png');
    this.load.image('stat_hambre',    'assets/sprites/stat_hambre_movil (1).png');
    this.load.image('stat_diversion', 'assets/sprites/stat_diversion_movil (1).png');
    this.load.image('stat_glucemia',  'assets/sprites/stat_glucemia_movil (1).png');

    // UI
    this.load.image('engranaje', 'assets/sprites/engranaje_sin_fondo.png');
    // cartel_casa/cartel_huerta ya no se usan (CabinScene entra directo a la
    // última sala al clickear la casa, sin carteles — pedido del usuario).
    this.load.image('moneda_ayuda', 'assets/sprites/moneda_interrogacion_transparente.png');
    this.load.image('mano_ayuda', 'assets/sprites/mano_guante_transparente.png');
    this.load.image('gorro_cocinero', 'assets/sprites/gorro_sin_fondo.png');
    // pergamino_sin_fondo.png tiene mucho margen transparente alrededor del
    // dibujo (el pergamino real ocupa ~26% del alto del lienzo) — con
    // TARGET_SIZE/tex.height (mismo patrón que engranaje/moneda_ayuda, que sí
    // vienen recortados) el ícono renderizaba casi invisible. Se usa una
    // versión recortada al contenido real (pergamino_recortado.png, Jimp) en
    // vez de tocar el patrón de escala en los 6 lugares que lo usan.
    this.load.image('pergamino', 'assets/sprites/pergamino_recortado.png');

    // Mapa de la casa (reemplaza el botón "← Volver" — tocás el pergamino y
    // elegís a qué sala ir tocando su ícono sobre el mapa)
    this.load.image('mapa_fondo',    'assets/sprites/mapa_sin_fondo.png');
    this.load.image('mapa_cama',     'assets/sprites/mapa_cama.png');
    this.load.image('mapa_horno',    'assets/sprites/mapa_horno.png');
    this.load.image('mapa_inodoro',  'assets/sprites/mapa_inodoro.png');
    this.load.image('mapa_planta',   'assets/sprites/mapa_planta.png');
    this.load.image('mapa_diana',    'assets/sprites/mapa_diana.png');

    // Dormitorio (dormitorio_ventana.png = dormitorio_limpio.png con el
    // vidrio de la ventana recortado a transparente vía Jimp, para la luz
    // dinámica — ver RoomScene._makeWindowLight/BedroomScene.js). cama/
    // placard/espejo son recortes exactos de ese mismo fondo, mismo criterio
    // que heladera/hornito/mercaderia.
    this.load.image('dormitorio_fondo',   'assets/sprites/dormitorio_ventana.png');
    this.load.image('dormitorio_cama',    'assets/sprites/dormitorio_cama.png');
    this.load.image('dormitorio_placard', 'assets/sprites/dormitorio_placard.png');
    this.load.image('dormitorio_espejo',  'assets/sprites/dormitorio_espejo.png');

    // Secuencia de "dormir con Seba" (tasks.md 3.6, design D4). Los tres son
    // lienzos cuadrados 2048x2048, provistos por el usuario. No se carga
    // caja_sin_fondo.png (caja sola cayendo): su ángulo no calza con el de
    // la caja en drone_sin_fondo.png (una v2 pedida para que coincidiera no
    // salió bien) — la secuencia salta directo de dron a explosión con un
    // flash/shake de por medio en vez de mostrar ese frame intermedio.
    this.load.image('dron_caja',       'assets/sprites/drone_sin_fondo.png');
    this.load.image('caja_explosion',  'assets/sprites/caja_abierta_sin_fondo_v2.png');
    // Fondo alternativo para el tramo final (oscurecer → dormidos juntos →
    // oscurecer → vuelve el original sin Seba). Mismo cuarto/estilo que
    // dormitorio_ventana.png pero con Vero y Seba acostados en la cama;
    // 938x1677 (aspecto casi idéntico al fondo normal, 1536x2752) — se
    // reescala a la altura de pantalla igual que cualquier fondo de sala.
    // habitacion-pareja-durmiendo-limpia.png = la original con el logo
    // "sparkle" de Gemini de la pila de ropa sucia borrado vía Jimp (mismo
    // problema y mismo criterio que dormitorio_ventana.png: reemplazo de
    // píxeles oscuros/fuera de tono por el color base de la tela en la
    // zona de la marca, en vez de un parche rectangular — la marca es un
    // dibujo lineal fino, no un bloque, así que un parche copiado de otra
    // parte de la misma tela terminaba trayendo piso o la prenda roja de
    // al lado).
    this.load.image('dormitorio_pareja', 'assets/sprites/habitacion-pareja-durmiendo-limpia.png');

    // Fondo para "dormir sola" (tasks.md 3.5). Mismo criterio que
    // dormitorio_pareja: Vero sola en la cama, Ámbar enroscada a los pies;
    // habitacion-durmiendo-sola-limpia.png = la original con el mismo logo
    // de Gemini en la pila de ropa sucia (una sola marca esta vez, no dos)
    // borrado vía Jimp.
    this.load.image('dormitorio_sola', 'assets/sprites/habitacion-durmiendo-sola-limpia.png');

    // Baño (tasks.md 4.1/4.2). bano-limpio.png = baño.png con el logo de
    // Gemini de la esquina inferior derecha (piso de madera) parchado vía
    // Jimp — esta vez un parche recortado de la misma tabla, corrido
    // horizontalmente, alcanzó solo (el grano diagonal de la madera es
    // repetitivo, a diferencia de los pliegues de tela del Dormitorio).
    // bano_banera/inodoro/espejo son recortes exactos de ese mismo fondo,
    // mismo criterio que BEDROOM_BOXES.
    this.load.image('bano_fondo',   'assets/sprites/bano-limpio.png');
    this.load.image('bano_banera',  'assets/sprites/bano_banera.png');
    this.load.image('bano_inodoro', 'assets/sprites/bano_inodoro.png');
    this.load.image('bano_espejo',  'assets/sprites/bano_espejo.png');

    // Bañarse (tasks.md 4.3/4.4): escenas de apoyo para cepillar/shampoo,
    // provistas por el usuario. cepillo_recortado.png y mano_recortada.png
    // son cepillo_sin_fondo.png/mano_sin_fondo.png recortados al bounding
    // box real del contenido vía trim-bano-sprites.js (Jimp, mismo motivo
    // que pergamino_recortado.png: sin recortar, el margen transparente los
    // hacía casi invisibles al escalarlos chicos como cursor/ícono).
    this.load.image('bano_cepillado_fondo', 'assets/sprites/vero-cepillandose.png');
    this.load.image('cepillo',              'assets/sprites/cepillo_recortado.png');
    this.load.image('bano_shampoo_fondo',   'assets/sprites/cabeza-shampoo.png');
    this.load.image('mano_shampoo',         'assets/sprites/mano_recortada.png');

    // Sala de actividades (tasks.md 5.1/5.2). sala-actividades-limpia.png =
    // sala-actividades.png con el logo "sparkle" de Gemini de la maceta
    // (abajo a la derecha, sobre la tierra) borrado vía Jimp — acá no había
    // veta repetitiva que clonar (a diferencia del piso del Baño), así que
    // se usó difusión iterativa (relleno tipo "inpaint") en vez de un parche
    // clonado (clean-sala-logo.js). Decoración fija (estantería, caballete,
    // compu/tablet, tela del techo, binoculares/cámara, food truck) queda
    // pintada directo en el fondo, sin recorte aparte — mismo criterio que
    // escritorio/estantería/cuadrito en Dormitorio (3.3): no son
    // interactivos, no hace falta un GameObject propio por cada uno. La
    // mesa de juego SÍ se recorta (extract-sala-mesa.js): es el único
    // objeto interactivo de la sala (design D7).
    this.load.image('sala_fondo', 'assets/sprites/sala-actividades-limpia.png');
    this.load.image('sala_mesa',  'assets/sprites/sala_mesa.png');

    // Huerta (tasks.md 6.1, luego reemplazada por huerta-nueva.png — imagen
    // nueva del usuario con 9 canteros de distinto tamaño en diamante). El
    // usuario pidió explícitamente que no hace falta usar los 9, con que 6
    // se vean/funcionen alcanza — se recortaron 6 directo de ese fondo
    // (extract-huerta-canteros-v2.js, mismo criterio que la v1: son el
    // único objeto interactivo de la sala) formando una silueta de
    // hexágono pareja; far-left/far-right/bottom-center quedan sin cantero
    // interactivo encima (decorativos, el fondo ya los muestra vacíos).
    //
    // huerta-nueva.png es PANORÁMICA (2812x1504, aspect ratio ~1.87) — muy
    // distinta de la vertical que espera RoomScene._drawBackground (escala
    // por altura, como huerta-limpia.png v1, 1536x2752). Usada entera, el
    // fondo escalado quedaba ~4x más ancho que el canvas (390px) y los 6
    // canteros elegidos (que abarcan ~820px de la imagen origen) no entraban
    // parejo: iban a quedar tapados por los íconos de stats de la esquina
    // izquierda o cortados del otro lado sin importar cómo se centrara. Se
    // generó huerta-nueva-recortada.png (recorte horizontal x:850-1820,
    // alto completo — no se toca el alto para no cambiar la escala) como
    // punto intermedio: dos canteros de la izquierda entran completos, dos
    // de la derecha quedan ~60% visibles pero con el centro (y el área de
    // tap) bien adentro del canvas. huerta-nueva.png completa queda sin
    // usar como fondo pero no se borró (los cantero2_*.png SÍ se recortan
    // de ella, coordenadas absolutas sin cambios).
    this.load.image('huerta_fondo',        'assets/sprites/huerta-nueva-recortada.png');
    this.load.image('cantero2_top',        'assets/sprites/cantero2_top.png');
    this.load.image('cantero2_left',       'assets/sprites/cantero2_left.png');
    this.load.image('cantero2_right',      'assets/sprites/cantero2_right.png');
    this.load.image('cantero2_center',     'assets/sprites/cantero2_center.png');
    this.load.image('cantero2_frontleft',  'assets/sprites/cantero2_frontleft.png');
    this.load.image('cantero2_frontright', 'assets/sprites/cantero2_frontright.png');

    // Sprites de crecimiento por especie y ETAPA (PLANTS[].stages, js/data/
    // plants.js) — las 10 especies con arte de 2 o 3 etapas (nuevos-
    // sprites-plantas.png, extract-plantas-solas.js: plántula→crecida para
    // verduras/choclo, +con-frutos para frutas). Reemplaza dos intentos
    // anteriores: plantas_sin_fondo.png (v1, solo creciendo/lista, sin
    // choclo confiable) y canteros-por-planta.png (v2, traía el cajón del
    // cantero pegado a la planta — se veía feo superpuesto al cantero real
    // del fondo, pedido del usuario de volver a solo-la-planta). Esta
    // versión ya trae un sombreado propio en la base de cada sprite para
    // simular que está enterrada en la tierra del cantero.
    PLANTS.forEach(p => {
      p.stages.forEach(stage => {
        this.load.image(`planta_${p.id}_${stage}`, `assets/sprites/planta_${p.id}_${stage}.png`);
      });
    });

    // Panel de configuración (bandera_espanol/bandera_ingles ya no se usan
    // — selector de idioma sacado, ver SettingsScene._createVolumeSection)
    this.load.image('ruta_vacia',            'assets/sprites/ruta_vacia.png');
    this.load.image('barra_volumen_llena',   'assets/sprites/barra_volumen_llena.png');
    this.load.image('boton_dial',            'assets/sprites/boton_dial.png');

    // Otros personajes
    this.load.image('ambar', 'assets/sprites/ambar.png');
    // seba_frente.png = recorte de la pose "de frente" de sprites-seba.png
    // (hoja nueva del usuario con 8 poses: frente/3-4/espalda/perfil arriba,
    // 4 frames de caminata abajo — reemplaza al Seba viejo, que no convenció
    // al usuario). Ya viene con transparencia real, solo hizo falta
    // recortar la celda. El resto de las poses/caminata quedan sin usar por
    // ahora — se recortan cuando haga falta una de ellas.
    this.load.image('seba',  'assets/sprites/seba_frente.png');
    this.load.image('ambar_dormida', 'assets/sprites/ambar_dormida.png');

    // Cocina
    this.load.image('cocina_fondo', 'assets/sprites/cocina_nueva.png');
    this.load.image('heladera',     'assets/sprites/extracted_heladera.png');
    this.load.image('hornito',      'assets/sprites/extracted_hornito.png');
    this.load.image('mercaderia',   'assets/sprites/extracted_mercaderia.png');

    // Íconos del catálogo de productos (design D9, tasks.md 2.8-2.12): la
    // definición de datos (js/data/products.js) declara `sprite` pero no
    // precargaba las texturas — se usan recién acá, en los paneles de
    // Heladera/Alacena/Recetario/Comer rápido de la Cocina. PRODUCTS es
    // global (script sin módulos) y products.js se carga antes que este
    // archivo en index.html, así que ya está disponible en preload().
    PRODUCTS.forEach(p => {
      this.load.image(p.sprite, `assets/sprites/${p.sprite}.png`);
    });
  }

  create() {
    // Las stats y el fondo son ilustraciones de alta resolución → filtro LINEAR
    // Los sprites de Vero quedan con NEAREST (pixelArt: true del config global)
    // 1 = LINEAR (suavizado), 0 = NEAREST (pixel art)
    // Las stats y el fondo son ilustraciones → LINEAR
    // Vero y el engranaje son pixel art → se quedan con el NEAREST global
    [  'stat_sueno', 'stat_hambre', 'stat_diversion', 'stat_glucemia', 'bg_cabana',
       'ruta_vacia', 'barra_volumen_llena', 'boton_dial',
       'ambar_dormida', 'cocina_fondo', 'heladera', 'hornito', 'mercaderia', 'moneda_ayuda', 'mano_ayuda',
       'gorro_cocinero', 'pergamino', 'mapa_fondo', 'mapa_cama', 'mapa_horno', 'mapa_inodoro', 'mapa_planta', 'mapa_diana',
       'dormitorio_fondo', 'dormitorio_cama', 'dormitorio_placard', 'dormitorio_espejo',
       'dron_caja', 'caja_explosion', 'dormitorio_pareja', 'dormitorio_sola',
       'bano_fondo', 'bano_banera', 'bano_inodoro', 'bano_espejo',
       'bano_cepillado_fondo', 'cepillo', 'bano_shampoo_fondo', 'mano_shampoo',
       'sala_fondo', 'sala_mesa',
       'huerta_fondo', 'cantero2_top', 'cantero2_left', 'cantero2_right', 'cantero2_center', 'cantero2_frontleft', 'cantero2_frontright',
       ...PRODUCTS.map(p => p.sprite),
       ...PLANTS.flatMap(p => p.stages.map(stage => `planta_${p.id}_${stage}`))]
      .forEach(key => this.textures.get(key).setFilter(1));

    const stats = new StatsSystem();

    // Inventario compartido Cocina/Huerta (design D8/D9, tasks.md 1.5).
    // Arranca vacío: el origen del stock y el sistema de monedas siguen sin
    // resolver (design Open Question 2) — ver comentario en Inventory.js.
    const inventory = new Inventory();

    // Sistema de guardado general (nuevo — antes el juego no persistía nada,
    // ni siquiera al recargar la página). Si hay una partida guardada, se
    // vuelca sobre las instancias recién creadas ANTES de registrarlas, así
    // el resto del juego no tiene que saber si venía de un save o no.
    // Huerta: array plano de 6 canteros (GardenScene.PLOT_COUNT), cada uno
    // `{ species, plantedAt, watered }` o `null`. No es una clase (a
    // diferencia de StatsSystem/Inventory) — no hace falta más que un dato
    // plano, así que SaveManager lo guarda/restaura directo, sin un
    // applyTo() propio.
    let garden = new Array(GardenScene.PLOT_COUNT).fill(null);
    // Prenda de Vero (Etapa 3, personalización) — string suelto, 'default'
    // es el look de siempre (vero_idle sin cambios). Ya no hay elección de
    // peinado (pedido del usuario, sacado por completo).
    let outfit = 'default';
    // Última sala real visitada (ver MapScene._goToRoom) — null hasta la
    // primera vez que entra a alguna, CabinScene cae al mapa en ese caso.
    let lastRoom = null;
    // Preferencias de SettingsScene — mismos defaults que usaba ahí antes
    // de que existiera este guardado (0.7 / 'es').
    let volume = 0.7;
    let language = 'es';
    // Si ya cerró el tutorial alguna vez (ver TutorialScene/CabinScene) —
    // false acá y en cualquier guardado viejo (sin este campo) hace que se
    // muestre solo la primera vez que se abre el juego.
    let tutorialSeen = false;

    const saved = SaveManager.load();
    if (saved) {
      SaveManager.applyTo(stats, inventory, saved);
      if (Array.isArray(saved.garden) && saved.garden.length === garden.length) {
        garden = saved.garden;
      }
      if (typeof saved.outfit === 'string') outfit = saved.outfit;
      if (typeof saved.lastRoom === 'string') lastRoom = saved.lastRoom;
      if (typeof saved.volume === 'number') volume = saved.volume;
      if (typeof saved.language === 'string') language = saved.language;
      tutorialSeen = !!saved.tutorialSeen;
    }

    this.registry.set('stats', stats);
    this.registry.set('inventory', inventory);
    this.registry.set('garden', garden);
    this.registry.set('outfit', outfit);
    this.registry.set('lastRoom', lastRoom);
    this.registry.set('volume', volume);
    this.registry.set('language', language);
    this.registry.set('tutorialSeen', tutorialSeen);

    this.scene.start('CabinScene');
  }
}
