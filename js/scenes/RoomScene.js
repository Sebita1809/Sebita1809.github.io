// Patrón de escena reutilizable para las salas de la cabaña (design D1, tasks.md 1.1).
//
// Extraído de KitchenScene.js (que todavía NO fue migrada a esta base — ver
// Etapa 2 sección 2, fuera de esta tarea): fondo escalado a la altura de
// pantalla, mapeo de cajas relativas (0..1 del fondo) a coordenadas de
// escena, objetos interactivos con hover sutil, y botón "Volver" consistente.
//
// Las salas nuevas (BedroomScene, BathroomScene, ActivityScene, GardenScene)
// pueden extender esta clase y solo agregar su propio contenido en create():
//
//   class BedroomScene extends RoomScene {
//     constructor() { super('BedroomScene'); }
//     create() {
//       const W = this.scale.width, H = this.scale.height;
//       this._drawBackground(W, H, 'dormitorio_fondo');
//       this._makeHoverObject(BEDROOM_BOXES.cama, () => this._dormir());
//       this._makeBackButton(W, H);
//     }
//   }
//
// Depth layers consistentes en toda sala (design D1):
//   0  = overlays de fondo (p.ej. cielo dinámico de una ventana)
//   1  = fondo
//   5  = objetos interactivos
//   6  = personajes (Ámbar/Vero/Seba)
//   10 = textos flotantes
//   20 = botón volver
class RoomScene extends Phaser.Scene {
  // ── Fondo ─────────────────────────────────────────────────────────────
  // Carga `textureKey`, lo escala por H/tex.height, lo centra horizontalmente
  // y guarda _bgScale/_bgOffsetX/_bgW/_bgH para poder mapear cajas relativas
  // con _toScene(). Devuelve la imagen de fondo por si la escena la necesita
  // (p.ej. para agregar overlays encima, como el cielo dinámico de la Cocina).
  _drawBackground(W, H, textureKey) {
    const tex = this.textures.get(textureKey).getSourceImage();
    const scale = H / tex.height;
    const offsetX = (W - tex.width * scale) / 2;
    this._bgScale = scale;
    this._bgOffsetX = offsetX;
    this._bgW = tex.width * scale;
    this._bgH = tex.height * scale;

    return this.add.image(offsetX, 0, textureKey)
      .setOrigin(0, 0)
      .setScale(scale)
      .setDepth(RoomScene.DEPTH.BACKGROUND);
  }

  // Convierte una caja relativa { left, top, width, height } en 0..1 (fracción
  // del fondo) a coordenadas absolutas de escena { x, y, w, h }.
  _toScene(box) {
    return {
      x: this._bgOffsetX + box.left * this._bgW,
      y: box.top * this._bgH,
      w: box.width * this._bgW,
      h: box.height * this._bgH,
    };
  }

  // ── Objetos interactivos ─────────────────────────────────────────────
  // box: { key, left, top, width, height } — key es la textura recortada del
  // fondo para ese objeto. callback: función a ejecutar en pointerdown, o
  // null/undefined para un objeto solo decorativo (sin cursor de mano ni
  // callback). Sin efecto de hover visual (escala/zoom) a propósito: se
  // probó y desalinea el sprite contra el fondo; solo cambia el cursor.
  // opts: { depth } para casos que necesiten variar la capa. { hitInset }
  // (0..0.4) achica el área de click/tap un % de cada lado sin tocar el
  // tamaño visual del sprite — pensado para grupos de cajas medidas a mano
  // que se solapan un poco en las esquinas (ej. GARDEN_BOXES: 6 canteros en
  // diamante, las cajas rectangulares de formas romboides vecinas se
  // superponen apenas en los bordes). Sin esto, tocar cerca del borde entre
  // dos objetos puede activar el vecino en vez del que se ve debajo del
  // dedo — Phaser resuelve por profundidad/orden de creación, no por qué
  // sprite se ve más "encima" visualmente en esa esquina.
  _makeHoverObject(box, callback, opts = {}) {
    const s = this._toScene(box);
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;
    const depth = opts.depth ?? RoomScene.DEPTH.INTERACTIVE;
    const inset = opts.hitInset ?? 0;

    const img = this.add.image(cx, cy, box.key)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(s.w, s.h)
      .setDepth(depth);

    if (callback && inset > 0) {
      const hitArea = new Phaser.Geom.Rectangle(
        img.width * inset, img.height * inset,
        img.width * (1 - 2 * inset), img.height * (1 - 2 * inset),
      );
      img.setInteractive({ hitArea, hitAreaCallback: Phaser.Geom.Rectangle.Contains, useHandCursor: true });
    } else {
      img.setInteractive(callback ? { useHandCursor: true } : { useHandCursor: false });
    }

    if (callback) img.on('pointerdown', callback);

    return img;
  }

  // ── Botón de ayuda contextual ────────────────────────────────────────
  // Mismo ícono/posición que CabinScene._createHelpButton. `room` es la
  // clave que HelpScene.ENTRIES espera (ver HelpScene.js) — la sala debe
  // tener sus propias entradas ahí antes de llamar a este helper.
  _makeHelpButton(room) {
    const TARGET_SIZE = 52;
    const tex = this.textures.get('moneda_ayuda').getSourceImage();
    const scale = TARGET_SIZE / tex.height;

    const help = this.add.image(46, 38, 'moneda_ayuda')
      .setScale(scale)
      .setDepth(RoomScene.DEPTH.BACK_BUTTON + 5)
      .setInteractive({ useHandCursor: true });

    help.on('pointerover', () => help.setScale(scale * 1.12));
    help.on('pointerout',  () => help.setScale(scale));
    help.on('pointerdown', () => {
      // bringToTop: HelpScene está registrada antes que las salas en
      // game.js, así que sin esto Phaser podría dibujarla debajo de la sala.
      // pause(): sin esto los clicks en la zona oscura del overlay le llegan
      // igual a los objetos interactivos de la sala por debajo.
      this.scene.pause();
      this.scene.launch('HelpScene', { room, callerKey: this.scene.key });
      this.scene.bringToTop('HelpScene');
    });

    return help;
  }

  // ── Botón volver (mapa) ──────────────────────────────────────────────
  // Pedido del usuario: reemplaza el texto "← Volver" por el pergamino, que
  // abre MapScene en vez de ir directo a la Cabaña — la persona elige a qué
  // sala moverse tocando el ícono correspondiente sobre el mapa. Posición:
  // esquina superior derecha, debajo del engranaje (pedido explícito del
  // usuario — antes estaba abajo en el lugar de "Volver").
  // opts: { x, y } para variar la posición por sala si hace falta.
  _makeBackButton(W, H, opts = {}) {
    const x = opts.x ?? (W - 46);
    const y = opts.y ?? 106;
    // El pergamino es ancho y bajo — escalar por ancho, si no desborda el
    // margen derecho de la pantalla.
    const TARGET_WIDTH = 64;
    const tex = this.textures.get('pergamino').getSourceImage();
    const scale = TARGET_WIDTH / tex.width;

    const btn = this.add.image(x, y, 'pergamino')
      .setScale(scale)
      .setDepth(RoomScene.DEPTH.BACK_BUTTON)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(scale * 1.12));
    btn.on('pointerout', () => btn.setScale(scale));
    btn.on('pointerdown', () => {
      // bringToTop: MapScene está registrada antes que las salas en game.js,
      // así que sin esto Phaser podría dibujarla debajo de la sala.
      // pause(): sin esto los clicks en la zona oscura del mapa le llegan
      // igual a los objetos interactivos de la sala por debajo.
      this.scene.pause();
      this.scene.launch('MapScene', { callerKey: this.scene.key });
      this.scene.bringToTop('MapScene');
    });

    return btn;
  }

  // ── Engranaje (configuración) ─────────────────────────────────────────
  // Mismo ícono/comportamiento que CabinScene/KitchenScene._createGearButton
  // — extraído acá para que las salas nuevas no lo reimplementen cada vez
  // (pedido del usuario: Dormitorio necesita stats+engranaje igual que
  // Cocina). opts: { x, y } para variar la posición por sala si hace falta.
  _makeGearButton(W, opts = {}) {
    const x = opts.x ?? (W - 46);
    const y = opts.y ?? 38;
    const BASE_SCALE = 56 / 1536;

    const gear = this.add.image(x, y, 'engranaje')
      .setScale(BASE_SCALE)
      .setDepth(RoomScene.DEPTH.BACK_BUTTON + 5)
      .setInteractive({ useHandCursor: true });

    gear.on('pointerover', () => gear.setScale(BASE_SCALE * 1.12));
    gear.on('pointerout',  () => gear.setScale(BASE_SCALE));
    gear.on('pointerdown', () => {
      this.tweens.add({
        targets: gear, angle: '+=360', duration: 400, ease: 'Quad.easeOut',
        onComplete: () => {
          this.scene.pause();
          this.scene.launch('SettingsScene', { callerKey: this.scene.key });
          // Sin esto, SettingsScene (índice 3 en game.js) queda tapada por
          // esta misma sala (índice más alto en la lista de escenas: 5-9)
          // aunque esté pausada — una escena pausada sigue RENDERIZÁNDOSE
          // en Phaser, solo deja de actualizarse. Mismo bug que ya se había
          // resuelto para HelpScene/MapScene (ver sus botones), encontrado
          // ahora en el engranaje porque a este le faltaba el bringToTop.
          this.scene.bringToTop('SettingsScene');
        },
      });
    });

    return gear;
  }

  // ── Stats UI ───────────────────────────────────────────────────────────
  // Misma lógica que KitchenScene._createStatsUI/_updateStatsUI/
  // _checkGlucemiaShake, extraída acá por el mismo motivo que el engranaje.
  // Columna vertical debajo de la monedita de ayuda (46,38). Requiere
  // this.stats seteado (this.stats = this.registry.get('stats')) y que la
  // sala llame _updateStatsUI()/_checkGlucemiaShake() en su propio
  // update(time, delta) — RoomScene no define update() por sí sola, cada
  // sala decide cuándo tickear (ver KitchenScene.update() como referencia).
  _createStatsUI() {
    const ICON   = 36;
    const RING_R = 21;
    const RING_W = 4;
    const x      = 46;
    const startY = 100;
    const GAP    = 50;

    this._statDefs = [
      { key: 'sleep',    texture: 'stat_sueno',     color: 0x5b9bd5 },
      { key: 'hunger',   texture: 'stat_hambre',    color: 0xf5a623 },
      { key: 'fun',      texture: 'stat_diversion', color: 0xa855f7 },
      { key: 'glucemia', texture: 'stat_glucemia',  isGlucemia: true },
    ].map((d, i) => ({ ...d, x, y: startY + GAP * i, ringR: RING_R, ringW: RING_W }));

    this._statDefs.forEach(d => {
      this.add.image(d.x, d.y, d.texture)
        .setDisplaySize(ICON, ICON)
        .setDepth(RoomScene.DEPTH.BACK_BUTTON + 3);
    });

    this._statsGraphics = this.add.graphics().setDepth(RoomScene.DEPTH.BACK_BUTTON + 2);
  }

  // ── Monedas (tasks.md "monedas y mercado") ───────────────────────────────
  // Fila aparte debajo de la columna de stats (mismo x, siguiente GAP).
  // Requiere this.inventory seteado (this.inventory = this.registry.get
  // ('inventory')). KitchenScene NO usa esto — tiene su propia copia
  // inline, mismo criterio que el resto de sus helpers (no extiende
  // RoomScene, ver nota del engranaje en tasks.md 3.2).
  _createCoinsUI() {
    // 20px (antes 13px, pedido del usuario: "que se note bien cuantas
    // monedas poseemos") — mismo tamaño que KitchenScene._createCoinsUI.
    this._coinsText = this.add.text(46, 300, '🪙 0', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#facc15',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(RoomScene.DEPTH.BACK_BUTTON + 3);
    this._updateCoinsUI();
  }

  _updateCoinsUI() {
    if (this._coinsText) this._coinsText.setText(`🪙 ${this.inventory.coins}`);
  }

  _glucemiaColor(v) {
    if (v <= 50 || v >= 170) return 0xef4444;
    if (v <= 70 || v >= 140) return 0xfbbf24;
    return 0x22c55e;
  }

  _updateStatsUI() {
    const s = this.stats;
    const g = this._statsGraphics;
    g.clear();

    this._statDefs.forEach(d => {
      const ratio = d.isGlucemia
        ? Math.max(0, Math.min(1, s.glucemia / 200))
        : Math.max(0, Math.min(1, s[d.key] / 100));
      const color = d.isGlucemia ? this._glucemiaColor(s.glucemia) : d.color;

      g.lineStyle(d.ringW, 0x1a1a1a, 0.65);
      g.beginPath();
      g.arc(d.x, d.y, d.ringR, 0, Math.PI * 2);
      g.strokePath();

      if (ratio > 0.01) {
        g.lineStyle(d.ringW, color, 1.0);
        g.beginPath();
        g.arc(d.x, d.y, d.ringR, -Math.PI / 2, -Math.PI / 2 + ratio * Math.PI * 2, false);
        g.strokePath();
      }
    });
  }

  _checkGlucemiaShake() {
    if (this.stats.glucemia <= 32 && !this._shaking) {
      this._shaking = true;
      const glucIcon = this._statDefs[3];
      this.tweens.add({
        targets: { x: glucIcon.x },
        x: glucIcon.x + 4,
        duration: 60,
        yoyo: true,
        repeat: 4,
        onComplete: () => { this._shaking = false; },
      });
    }
  }

  // ── Vero en la sala ────────────────────────────────────────────────────
  // Misma lógica que KitchenScene._placeVero/_setVeroFrame/_updateVeroExpression
  // (extraída acá por el mismo motivo que el engranaje/stats), generalizada
  // para aceptar la posición de pie (x,y = pies de Vero, origen 0.5/1) en vez
  // de calcularla contra el panel de comer rápido, que es específico de
  // Cocina. Sin parpadeo a propósito — decisión ya tomada y documentada en
  // KitchenScene.js (los PNG de parpadeo no comparten recorte con vero_idle).
  // Requiere this.stats seteado y que la sala llame _updateVeroExpression()
  // en su propio update().
  _placeVero(x, y, targetH = 260) {
    this._veroTargetH = targetH;
    this._vero = this.add.image(x, y, 'vero_idle').setOrigin(0.5, 1).setDepth(RoomScene.DEPTH.CHARACTERS);
    this._setVeroFrame('vero_idle');
    this._currentVeroTexture = 'vero_idle';
  }

  // Prenda (Etapa 3, personalización — game.registry 'outfit', ver
  // js/data/outfits.js). Ya no hay elección de peinado (sacada a pedido
  // del usuario) — cada prenda usa siempre su versión "suelto". 'default'
  // vuelve a usar vero_idle directo (el look clásico de siempre): la
  // versión vero_default_suelto.png (vero-default-peinados.png, tanda de
  // arte más nueva) no coincide en diseño con jardinera/pijama/vestido
  // (extraídas de una hoja más vieja) — reportado por el usuario como una
  // inconsistencia visible entre prendas.
  _veroIdleTexture() {
    const outfit = this.registry.get('outfit') || 'default';
    if (outfit === 'default') return 'vero_idle';
    const key = `vero_${outfit}_suelto`;
    return this.textures.exists(key) ? key : 'vero_idle';
  }

  _setVeroFrame(tex) {
    this._vero.setTexture(tex);
    const scale = this._veroTargetH / this._vero.height;
    this._vero.setDisplaySize(this._vero.width * scale, this._veroTargetH);
  }

  // _veroExpressionOverride: para secuencias guionadas que necesitan forzar
  // una expresión puntual en vez de la que calculan las stats. La sala que
  // lo usa es responsable de limpiarlo (= null) cuando la secuencia
  // termina, si no Vero se queda trabada en esa expresión.
  // Compara la TEXTURA resultante, no el nombre de la expresión — si solo
  // comparara `expr` (como antes), cambiar de prenda mientras Vero sigue
  // en 'idle' nunca dispararía un redibujado (expr sigue siendo 'idle'
  // antes y después del cambio de prenda).
  //
  // Prioridad ropa > expresión (pedido explícito del usuario): no existe
  // arte que combine una prenda con las caras de cansada/aburrida/
  // colorada/feliz, así que si se muestra la cara de esa expresión se
  // pierde la ropa puesta. El usuario prefiere lo contrario — que la ropa
  // se vea siempre y se sacrifique el gesto de cara. La advertencia de
  // glucemia baja no depende de esta textura (es el ícono de stats que
  // tiembla, ver _checkGlucemiaShake), así que no se pierde información
  // importante al ocultar la cara "colorada".
  //
  // 'hambrienta' (hambre) ya NO cambia de sprite (antes tenía arte propio
  // por prenda+peinado, sacado junto con el peinado) — se trata como
  // 'idle' acá, y en cambio se muestra un ícono chico al lado de Vero (ver
  // _updateHungerIcon). 'sorprendida' se sacó directamente — BedroomScene
  // ya no fuerza esa expresión cuando aparece Seba.
  _updateVeroExpression() {
    this._updateHungerIcon(this.stats.isHungry());

    const expr = this._veroExpressionOverride || (this.stats.hasFeliz() ? 'feliz' : (this.stats.getExpression() || 'idle'));
    const outfit = this.registry.get('outfit') || 'default';
    const tex = (expr === 'idle' || expr === 'hambrienta' || outfit !== 'default')
      ? this._veroIdleTexture()
      : 'vero_' + expr;

    if (tex !== this._currentVeroTexture) {
      this._currentVeroTexture = tex;
      this._setVeroFrame(tex);
    }
  }

  // Ícono de "tiene hambre" (icono_hambre.png — el globo con el muslito,
  // recortado de vero-estados-variaciones.png) al lado de la cabeza de
  // Vero, en vez de un sprite entero distinto (pedido del usuario: sacar
  // la diferencia visible entre versiones de Vero). Se crea/destruye según
  // isHungry() y se reposiciona cada frame por si Vero se mueve (BedroomScene
  // la corre al costado durante la secuencia de Seba).
  _updateHungerIcon(hungry) {
    if (hungry && !this._hungerIcon) {
      const tex = this.textures.get('icono_hambre').getSourceImage();
      const h = 30;
      this._hungerIcon = this.add.image(0, 0, 'icono_hambre')
        .setDisplaySize(h * (tex.width / tex.height), h)
        .setDepth(RoomScene.DEPTH.CHARACTERS + 1);
    } else if (!hungry && this._hungerIcon) {
      this._hungerIcon.destroy();
      this._hungerIcon = null;
    }
    if (this._hungerIcon && this._vero) {
      this._hungerIcon.setPosition(
        this._vero.x - this._vero.displayWidth * 0.38,
        this._vero.y - this._vero.displayHeight * 0.92,
      );
    }
  }

  // ── Picker de lista genérico (prenda/peinado) ──────────────────────────
  // Pedido del usuario tras probar la v1 (swipe + texto sin fondo, "no se
  // ven las palabras" contra el fondo de la sala, y sin forma de confirmar
  // — tocar una fila la aplicaba al toque, sin repaso): ahora SIEMPRE es
  // una lista con miniatura real por fila (mismo panel con fondo que
  // GardenScene._openSeedPicker, no flota texto suelto encima del fondo de
  // la sala) — tocar una fila solo la RESALTA (no aplica nada todavía);
  // "✓ Confirmar" aplica la fila resaltada y cierra; "✕" cierra sin aplicar
  // nada. items: [{id, label, textureKey}]. onConfirm(id) se llama SOLO al
  // confirmar.
  _openListPicker({ title, items, initialId, onConfirm }) {
    const W = this.scale.width;
    const H = this.scale.height;
    let selectedId = initialId;

    const overlay = this.add.rectangle(0, 0, W, H, 0x1a1a2e, 1)
      .setOrigin(0).setDepth(58).setInteractive();

    const rowH = 90;
    const panelW = W - 48;
    const panelH = 60 + items.length * rowH + 54;
    const panelX = (W - panelW) / 2;
    const panelY = Math.max(16, (H - panelH) / 2);

    const panel = this.add.graphics().setDepth(59);
    panel.fillStyle(0xe3e0ee, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, 0x7c3aed, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    const elements = [overlay, panel];

    elements.push(this.add.text(W / 2, panelY + 24, title, {
      fontSize: '17px', fill: '#312e81', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60));

    const closeBtn = this.add.text(panelX + panelW - 16, panelY + 12, '✕', {
      fontSize: '20px', fill: '#7c3aed', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(60).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => elements.forEach(e => e.destroy()));
    elements.push(closeBtn);

    const rowZones = [];
    items.forEach((item, idx) => {
      const rowY = panelY + 54 + idx * rowH + rowH / 2;

      const rowZone = this.add.rectangle(W / 2, rowY, panelW - 16, rowH - 6, 0x7c3aed, item.id === selectedId ? 0.2 : 0.001)
        .setDepth(60).setInteractive({ useHandCursor: true });
      rowZones.push({ zone: rowZone, id: item.id });
      elements.push(rowZone);

      const tex = this.textures.get(item.textureKey).getSourceImage();
      const iconH = rowH - 16;
      const iconW = iconH * (tex.width / tex.height);
      elements.push(this.add.image(panelX + 24 + iconW / 2, rowY, item.textureKey)
        .setDisplaySize(iconW, iconH).setDepth(61));

      elements.push(this.add.text(panelX + 24 + iconW + 14, rowY, item.label, {
        fontSize: '14px', fill: '#312e81', fontFamily: 'monospace', fontStyle: 'bold',
        wordWrap: { width: panelW - 24 - iconW - 14 - 24 },
      }).setOrigin(0, 0.5).setDepth(61));

      rowZone.on('pointerdown', () => {
        selectedId = item.id;
        rowZones.forEach(rz => rz.zone.setFillStyle(0x7c3aed, rz.id === selectedId ? 0.2 : 0.001));
      });
    });

    const confirmBtn = this.add.text(W / 2, panelY + panelH - 30, '✓ Confirmar', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#16a34a', padding: { x: 16, y: 8 },
    }).setOrigin(0.5).setDepth(60).setInteractive({ useHandCursor: true });
    confirmBtn.on('pointerdown', () => {
      elements.forEach(e => e.destroy());
      onConfirm(selectedId);
    });
    elements.push(confirmBtn);
  }

  // ── Ventana con luz dinámica ──────────────────────────────────────────
  // Mismo patrón que KitchenScene._updateSky (esa no se tocó — ver nota del
  // engranaje sobre por qué Cocina sigue con su copia propia), generalizado
  // acá para que las salas nuevas con ventana lo hereden. box: caja
  // relativa 0..1 sobre el fondo, igual que _makeHoverObject. Requiere que
  // el fondo tenga un recorte transparente en esa zona (si la imagen es
  // opaca ahí, el rectángulo de color queda tapado por el fondo, que se
  // dibuja encima en depth BACKGROUND) — ver dormitorio_ventana.png.
  _makeWindowLight(box) {
    const win = this._toScene(box);
    this._windowRect = this.add.rectangle(win.x, win.y, win.w, win.h, 0xbfe3ff)
      .setOrigin(0, 0).setDepth(RoomScene.DEPTH.BG_OVERLAY);
    this._updateWindowLight();

    this.time.addEvent({
      delay: 60000,
      callback: this._updateWindowLight,
      callbackScope: this,
      loop: true,
    });

    return this._windowRect;
  }

  _updateWindowLight() {
    const h = new Date().getHours();
    if (h >= 6 && h < 18) {
      this._windowRect.setFillStyle(0xbfe3ff);
    } else if (h >= 18 && h < 22) {
      this._windowRect.setFillStyle(0xff9944);
    } else {
      this._windowRect.setFillStyle(0x151538);
    }
  }

  // ── Texto flotante reutilizable ────────────────────────────────────────
  // Mismo patrón que KitchenScene._showFloatingText (texto con stroke, sube
  // y se desvanece). Promovida acá desde BedroomScene (que la tenía local)
  // cuando BathroomScene la empezó a necesitar también — mismo criterio que
  // el resto de los helpers de esta clase.
  // depth: por defecto FLOATING_TEXT (10) — insuficiente para feedback
  // mostrado ENCIMA de un picker/modal propio de la sala (esos suelen vivir
  // en depth 55+, ver BathroomScene/GardenScene), así que quien llama desde
  // ahí pasa un depth mayor explícito.
  _showFloatingText(msg, x, y, color = '#22c55e', depth = RoomScene.DEPTH.FLOATING_TEXT) {
    const txt = this.add.text(x, y, msg, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
      color, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(depth);

    this.tweens.add({
      targets: txt, y: txt.y - 40, alpha: 0, duration: 900, ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }
}

RoomScene.DEPTH = {
  BG_OVERLAY: 0,
  BACKGROUND: 1,
  INTERACTIVE: 5,
  CHARACTERS: 6,
  FLOATING_TEXT: 10,
  BACK_BUTTON: 20,
};
