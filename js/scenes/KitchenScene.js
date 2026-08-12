// Cajas de cada objeto como % de la imagen de fondo. Los tres sprites
// (heladera/hornito/mercaderia) están recortados directamente de cocina_nueva.png
// en estas mismas coordenadas, así que la alineación es exacta por construcción:
// no hace falta escalar distinto ni compensar recortes por el marco.
const KITCHEN_BOXES = {
  heladera:   { key: 'heladera',   left: 0.8310, top: 0.3158, width: 0.1690, height: 0.5954 },
  hornito:    { key: 'hornito',    left: 0,      top: 0.4309, width: 0.2131, height: 0.2253 },
  mercaderia: { key: 'mercaderia', left: 0.0675, top: 0.4079, width: 0.7813, height: 0.1349 },
};

// Ventana (para el cielo dinámico): x 790-1068, y 667-1247 sobre 1408x3040
const WINDOW_BOX = { left: 790 / 1408, top: 667 / 3040, width: 278 / 1408, height: 580 / 3040 };

// Depth layers (design D1, igual que RoomScene.DEPTH — KitchenScene todavía
// no extiende RoomScene, ver design.md D1 nota "refactor opcional").
const DEPTH = {
  BG_OVERLAY: 0,
  BACKGROUND: 1,
  INTERACTIVE: 5,
  CHARACTERS: 6,
  COMER_PANEL: 8,
  FLOATING_TEXT: 10,
  BACK_BUTTON: 20,
  MODAL_OVERLAY: 30,
  MODAL_PANEL: 31,
  MODAL_CONTENT: 32,
};

class KitchenScene extends Phaser.Scene {
  constructor() { super('KitchenScene'); }

  create() {
    this.stats = this.registry.get('stats');
    this.inventory = this.registry.get('inventory');
    const W = this.scale.width;
    const H = this.scale.height;

    this._feedCooldown = 0;
    this._comerIndex = 0;
    this._modalObjects = null;

    this._drawBackground(W, H);
    this._createHoverZones();
    this._placeAmbar();
    this._createComerPanel(W, H);
    this._placeVero(W, H);
    this._createHelpButton();
    this._createGearButton(W);
    this._createStatsUI();
    this._createCoinsUI();
    this._makeBackButton(W, H);

    this._dayTimer = this.time.addEvent({
      delay: 60000,
      callback: this._updateSky,
      callbackScope: this,
      loop: true,
    });
  }

  update(time, delta) {
    if (this._feedCooldown > 0) this._feedCooldown -= delta;
    this._updateVeroExpression();

    // Las stats solo se tickeaban en CabinScene; ahora que Vero (y el tiempo
    // real de juego) vive en las salas, el decay tiene que seguir corriendo
    // acá también o se congela mientras estás en la Cocina.
    this.stats.update(delta);
    this._updateStatsUI();
    this._checkGlucemiaShake();
    this._updateCoinsUI();
  }

  // ── Fondo + ventana dinámica ─────────────────────────────────────────────

  _drawBackground(W, H) {
    const tex = this.textures.get('cocina_fondo').getSourceImage();
    const scale = H / tex.height;
    const offsetX = (W - tex.width * scale) / 2;
    this._bgScale = scale;
    this._bgOffsetX = offsetX;
    this._bgW = tex.width * scale;
    this._bgH = tex.height * scale;

    const win = this._toScene(WINDOW_BOX);
    this._skyRect = this.add.rectangle(win.x, win.y, win.w, win.h, 0xbfe3ff)
      .setOrigin(0, 0).setDepth(DEPTH.BG_OVERLAY);
    this._updateSky();

    this.add.image(offsetX, 0, 'cocina_fondo')
      .setOrigin(0, 0)
      .setScale(scale)
      .setDepth(DEPTH.BACKGROUND);
  }

  _updateSky() {
    const h = new Date().getHours();
    if (h >= 6 && h < 18) {
      this._skyRect.setFillStyle(0xbfe3ff);
    } else if (h >= 18 && h < 22) {
      this._skyRect.setFillStyle(0xff9944);
    } else {
      this._skyRect.setFillStyle(0x151538);
    }
  }

  // ── Objetos interactivos (mismo sprite recortado del fondo, crecimiento sutil en hover) ─

  _toScene(box) {
    return {
      x: this._bgOffsetX + box.left * this._bgW,
      y: box.top * this._bgH,
      w: box.width * this._bgW,
      h: box.height * this._bgH,
    };
  }

  // design D8: las 3 zonas ya NO dan hambre directo — abren paneles sobre el
  // inventario de datos compartido. Heladera→panel heladera, mercadería→panel
  // alacena, hornito→Recetario. El "comer rápido" viejo se reemplaza por el
  // panel fijo de flechas (ver _createComerPanel).
  _createHoverZones() {
    // Heladera muestra 'heladera' + 'cosecha' juntas (pedido del usuario:
    // frutas/verduras no aparecían en ningún panel aunque sí se podían usar
    // en recetas/comer rápido — confuso, ahora se ven acá).
    this._heladeraObj = this._makeHoverObject(KITCHEN_BOXES.heladera, () => this._openStoragePanel(['heladera', 'cosecha'], 'Heladera'));
    // hornito con depth +1: su caja se solapa con la de mercaderia del lado
    // derecho (zona de las perillas, ver KITCHEN_BOXES) — como las tres
    // comparten el mismo depth por defecto, en esa franja ganaba mercaderia
    // (se crea después) y tocar las perillas del horno abría la Alacena en
    // vez del Recetario (bug reportado por el usuario).
    this._makeHoverObject(KITCHEN_BOXES.hornito, () => this._openRecetario(), DEPTH.INTERACTIVE + 1);
    this._makeHoverObject(KITCHEN_BOXES.mercaderia, () => this._openStoragePanel(['alacena'], 'Alacena'));
  }

  _makeHoverObject(box, callback, depth = DEPTH.INTERACTIVE) {
    const s = this._toScene(box);
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;

    const img = this.add.image(cx, cy, box.key)
      .setOrigin(0.5, 0.5)
      .setDisplaySize(s.w, s.h)
      .setDepth(depth)
      .setInteractive(callback ? { useHandCursor: true } : { useHandCursor: false });

    if (callback) img.on('pointerdown', callback);

    return img;
  }

  // ── Vero (migrada acá desde CabinScene: pedido del usuario, ya no aparece
  // en la Cabaña, solo dentro de las salas con contenido real) ─────────────

  // Centrada horizontalmente y parada justo arriba del panel de "comer
  // rápido" (pedido del usuario: más grande y centrada; hay lugar de sobra
  // porque heladera/hornito/mercadería quedan en los costados y arriba del
  // piso — Vero no es interactiva, así que aunque los tape visualmente
  // nunca bloquea sus zonas de click).
  _placeVero(W, H) {
    this._veroTargetH = 260;
    const feetY = this._comerPanelY - 8;
    this._vero = this.add.image(W / 2, feetY, 'vero_idle').setOrigin(0.5, 1).setDepth(DEPTH.CHARACTERS);
    this._setVeroFrame('vero_idle');
    this._currentVeroTexture = 'vero_idle';
  }

  // Prenda (Etapa 3, personalización) — misma lógica que
  // RoomScene._veroIdleTexture, copiada acá porque KitchenScene no extiende
  // RoomScene (mismo criterio que el resto de sus helpers propios). Ya no
  // hay peinado elegible — cada prenda usa siempre su versión "suelto".
  // 'default' vuelve a vero_idle directo (ver RoomScene._veroIdleTexture).
  _veroIdleTexture() {
    const outfit = this.registry.get('outfit') || 'default';
    if (outfit === 'default') return 'vero_idle';
    const key = `vero_${outfit}_suelto`;
    return this.textures.exists(key) ? key : 'vero_idle';
  }

  // Cada textura de Vero (idle, expresiones) tiene un tamaño nativo DISTINTO
  // y ninguna comparte el mismo recorte/proporción cabeza-cuerpo entre sí
  // (confirmado a ojo comparándolas todas a la misma altura — ni siquiera
  // normalizar por ancho de cabeza alcanza, cada expresión es un dibujo con
  // proporciones propias, no la misma imagen recortada distinto). Sin
  // parpadeo (ver más abajo) el único swap real es idle↔expresión de ánimo,
  // que sigue escalando por altura de lienzo — no es perfecto pero es el
  // caso que ya estaba y no fue reportado como problema.
  _setVeroFrame(tex) {
    this._vero.setTexture(tex);
    const scale = this._veroTargetH / this._vero.height;
    this._vero.setDisplaySize(this._vero.width * scale, this._veroTargetH);
  }

  // Compara la TEXTURA resultante, no el nombre de la expresión (mismo
  // motivo que RoomScene._updateVeroExpression: si solo comparara `expr`,
  // cambiar de prenda estando en 'idle' nunca redibujaría).
  // Prioridad ropa > expresión (mismo criterio que RoomScene._updateVeroExpression,
  // pedido explícito del usuario) — con una prenda no-default puesta, se
  // muestra siempre esa textura aunque la expresión no sea 'idle'.
  // 'hambrienta' ya no cambia de sprite — se trata como 'idle' acá, y en
  // cambio se muestra un ícono chico al lado (ver _updateHungerIcon).
  _updateVeroExpression() {
    this._updateHungerIcon(this.stats.isHungry());

    const expr = this.stats.hasFeliz() ? 'feliz' : (this.stats.getExpression() || 'idle');
    const outfit = this.registry.get('outfit') || 'default';
    const tex = (expr === 'idle' || expr === 'hambrienta' || outfit !== 'default')
      ? this._veroIdleTexture()
      : 'vero_' + expr;
    if (tex !== this._currentVeroTexture) {
      this._currentVeroTexture = tex;
      this._setVeroFrame(tex);
    }
  }

  // Copia de RoomScene._updateHungerIcon (KitchenScene no extiende RoomScene).
  _updateHungerIcon(hungry) {
    if (hungry && !this._hungerIcon) {
      const tex = this.textures.get('icono_hambre').getSourceImage();
      const h = 30;
      this._hungerIcon = this.add.image(0, 0, 'icono_hambre')
        .setDisplaySize(h * (tex.width / tex.height), h)
        .setDepth(DEPTH.CHARACTERS + 1);
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

  // NOTA: el parpadeo (vero_idle1..4) se sacó a pedido del usuario — esos
  // PNG no comparten el recorte de vero_idle (vero_idle deja aire debajo de
  // los zapatos, los frames del parpadeo vienen recortados bien ajustados) y
  // ningún escalado de una sola textura por otra lo resuelve del todo: por
  // altura de lienzo se veía "encoger", por ancho de cabeza el cuerpo
  // igual quedaba más ancho ("zoom"). Reactivar esto necesita assets de
  // parpadeo re-exportados con el mismo recorte que vero_idle.

  // ── Monedita de ayuda (manual contextual de esta sala) ────────────────────
  // Mismo ícono/posición que CabinScene._createHelpButton, pero acá abre
  // HelpScene con { room: 'kitchen' } → solo ve las entradas de Cocina.

  _createHelpButton() {
    const TARGET_SIZE = 52;
    const tex = this.textures.get('moneda_ayuda').getSourceImage();
    const scale = TARGET_SIZE / tex.height;

    const help = this.add.image(46, 38, 'moneda_ayuda')
      .setScale(scale)
      .setDepth(DEPTH.BACK_BUTTON + 5)
      .setInteractive({ useHandCursor: true });

    help.on('pointerover', () => help.setScale(scale * 1.12));
    help.on('pointerout',  () => help.setScale(scale));
    help.on('pointerdown', () => {
      // bringToTop: HelpScene está registrada antes que KitchenScene en
      // game.js, así que sin esto Phaser la dibuja DEBAJO de esta sala.
      // pause(): sin esto los clicks en la zona oscura del overlay seguían
      // llegando a heladera/hornito/mercadería por debajo (bug reportado).
      this.scene.pause();
      this.scene.launch('HelpScene', { room: 'kitchen', callerKey: this.scene.key });
      this.scene.bringToTop('HelpScene');
    });
  }

  // ── Engranaje (configuración) ──────────────────────────────────────────────
  // Mismo ícono/comportamiento que CabinScene._createGearButton — faltaba acá
  // porque las stats/config eran solo de la Cabaña; ahora la Cocina también
  // las necesita (pedido del usuario).

  _createGearButton(W) {
    const BASE_SCALE = 56 / 1536;

    const gear = this.add.image(W - 46, 38, 'engranaje')
      .setScale(BASE_SCALE)
      .setDepth(DEPTH.BACK_BUTTON + 5)
      .setInteractive({ useHandCursor: true });

    gear.on('pointerover', () => gear.setScale(BASE_SCALE * 1.12));
    gear.on('pointerout',  () => gear.setScale(BASE_SCALE));
    gear.on('pointerdown', () => {
      this.tweens.add({
        targets: gear, angle: '+=360', duration: 400, ease: 'Quad.easeOut',
        onComplete: () => {
          this.scene.pause();
          this.scene.launch('SettingsScene', { callerKey: this.scene.key });
          this.scene.bringToTop('SettingsScene');
        },
      });
    });
  }

  // ── Stats UI ──────────────────────────────────────────────────────────────
  // Misma lógica que CabinScene._createStatsUI/_updateStatsUI/_checkGlucemiaShake,
  // pero en columna vertical debajo de la monedita de ayuda (pedido del
  // usuario) en vez de la fila horizontal de abajo — acá abajo ya está
  // ocupado por el panel de comer rápido y el botón volver.

  _createStatsUI() {
    const ICON   = 36;
    const RING_R = 21;
    const RING_W = 4;
    const x      = 46; // alineado con la monedita de ayuda
    const startY = 100; // debajo de la monedita (y=38, radio ~26 -> borde ~64)
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
        .setDepth(DEPTH.BACK_BUTTON + 3);
    });

    this._statsGraphics = this.add.graphics().setDepth(DEPTH.BACK_BUTTON + 2);
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

  // ── Monedas (tasks.md "monedas y mercado") ───────────────────────────────
  // Misma fila/posición que RoomScene._createCoinsUI (debajo de la columna
  // de stats) — copia propia, mismo criterio que el resto de los helpers de
  // esta escena (KitchenScene no extiende RoomScene).
  _createCoinsUI() {
    // 20px (antes 13px, pedido del usuario: "que se note bien cuantas
    // monedas poseemos") — mismo tamaño que RoomScene._createCoinsUI.
    this._coinsText = this.add.text(46, 300, '🪙 0', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#facc15',
      stroke: '#000000', strokeThickness: 4,
    }).setOrigin(0.5).setDepth(DEPTH.BACK_BUTTON + 3);
    this._updateCoinsUI();
  }

  _updateCoinsUI() {
    if (this._coinsText) this._coinsText.setText(`🪙 ${this.inventory.coins}`);
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

  // ── Ámbar dormida arriba de la heladera ──────────────────────────────────

  _placeAmbar() {
    // Se ubica en el centro de la porción de la heladera que realmente entra en cámara
    // (heladera está anclada por su centro, así que recalculamos su borde izquierdo/superior)
    const left = this._heladeraObj.x - this._heladeraObj.displayWidth / 2;
    const top  = this._heladeraObj.y - this._heladeraObj.displayHeight / 2;
    const visibleRight = Math.min(this.scale.width, left + this._heladeraObj.displayWidth);
    const x = left + (visibleRight - left) * 0.5;
    const y = top + 14;

    const tex = this.textures.get('ambar_dormida').getSourceImage();
    const targetH = 48;
    const scale = targetH / tex.height;

    this.add.image(x, y, 'ambar_dormida')
      .setOrigin(0.5, 1)
      .setScale(scale)
      .setDepth(DEPTH.CHARACTERS);
  }

  // ── Paneles modales genéricos (design D8: mismo patrón visual que MapScene:
  // overlay oscuro + panel redondeado + lista de filas + botón cerrar; solo
  // se cierra con el botón "✕", igual que MapScene) ──────────────────────

  // minContentH: alto de contenido deseado (filas + header) para que el panel
  // crezca si hace falta (ej. Heladera con heladera+cosecha juntas, más
  // filas que antes) — sin esto la lista se desbordaba por debajo del
  // panel. Sigue topeado a la pantalla (H-80).
  _openModal(title, minContentH = 0) {
    this._closeModal();
    const W = this.scale.width;
    const H = this.scale.height;
    const objs = [];

    // setInteractive (sin handler): esto NO es una escena separada como
    // Ayuda/Configuración/Mapa (donde el fix fue pausar la sala — ver
    // [[architecture/modal-pause-pattern]]) — heladera/hornito/mercadería y
    // el engranaje/ayuda/pergamino son objetos de ESTA MISMA escena, así que
    // pausar no aplica. El overlay no interactivo dejaba pasar el click a
    // cualquier objeto interactivo detrás (bug reportado: tocar la Heladera
    // a la altura de la Alacena la abría "por debajo"). Al hacerlo
    // interactivo, con topOnly (default de Phaser) solo el objeto de mayor
    // depth bajo el puntero recibe el evento — el overlay (depth 30, el más
    // alto de la sala) lo intercepta y nada de abajo se entera. Sin
    // tap-outside-to-close a propósito (mismo criterio que 2.8, MapScene
    // tampoco lo tiene) — solo la "✕" cierra.
    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setDepth(DEPTH.MODAL_OVERLAY).setInteractive();
    objs.push(overlay);

    const panelW = W - 40;
    const panelH = Math.min(Math.max(520, minContentH), H - 80);
    const panelX = 20;
    const panelY = (H - panelH) / 2;

    const panel = this.add.graphics().setDepth(DEPTH.MODAL_PANEL);
    panel.fillStyle(0x1e1b4b, 0.97);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, 0x7c3aed, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);
    objs.push(panel);

    const titleTxt = this.add.text(W / 2, panelY + 26, title, {
      fontSize: '20px', fill: '#e9d5ff', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(DEPTH.MODAL_CONTENT);
    objs.push(titleTxt);

    const sep = this.add.graphics().setDepth(DEPTH.MODAL_CONTENT);
    sep.lineStyle(1, 0x7c3aed, 0.5);
    sep.lineBetween(panelX + 20, panelY + 54, panelX + panelW - 20, panelY + 54);
    objs.push(sep);

    const closeBtn = this.add.text(panelX + panelW - 14, panelY + 14, '✕', {
      fontSize: '20px', fill: '#a78bfa', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(DEPTH.MODAL_CONTENT).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ fill: '#a78bfa' }));
    closeBtn.on('pointerdown', () => this._closeModal());
    objs.push(closeBtn);

    this._modalObjects = objs;
    return { panelX, panelY, panelW, panelH };
  }

  _closeModal() {
    if (!this._modalObjects) return;
    this._modalObjects.forEach(o => o.destroy());
    this._modalObjects = null;
  }

  _addModalObj(obj) {
    if (this._modalObjects) this._modalObjects.push(obj);
    return obj;
  }

  // ── 2.8 / 2.9: paneles de inventario (Heladera / Alacena) — ahora también
  // "Mercado": cada producto con `precio` (solo alacena/heladera, ver
  // products.js) suma un botón de compra en su fila. this._lastStorage
  // guarda los args para poder reabrir el mismo panel refrescado después de
  // comprar (ver _comprarProducto). ─────────────────────────────────────

  _openStoragePanel(categorias, titulo) {
    this._lastStorage = { categorias, titulo };
    const items = this.inventory.listByCategories(categorias);
    const rowH = 44;
    const { panelX, panelY, panelW } = this._openModal(titulo, 70 + items.length * rowH + 20);
    let y = panelY + 70;

    if (items.length === 0) {
      this._addModalObj(this.add.text(this.scale.width / 2, y + 20, 'No hay nada acá todavía.', {
        fontSize: '13px', fill: '#94a3b8', fontFamily: 'monospace'
      }).setOrigin(0.5).setDepth(DEPTH.MODAL_CONTENT));
      return;
    }

    items.forEach(item => {
      this._addInventoryRow(panelX + 20, y, panelW - 40, item);
      y += rowH;
    });
  }

  _addInventoryRow(x, y, w, item) {
    const hasPrecio = typeof item.precio === 'number';
    // Con botón de compra, la cantidad se corre a la izquierda para dejarle
    // lugar al botón en el borde derecho de la fila.
    const qtyX = hasPrecio ? x + w - 62 : x + w;

    this._addModalObj(
      this.add.image(x + 16, y + 16, item.sprite).setDisplaySize(32, 32).setDepth(DEPTH.MODAL_CONTENT)
    );
    this._addModalObj(
      this.add.text(x + 42, y + 16, item.nombre, {
        fontSize: '14px', fontFamily: 'monospace',
        fill: item.cantidad > 0 ? '#e2e8f0' : '#64748b',
      }).setOrigin(0, 0.5).setDepth(DEPTH.MODAL_CONTENT)
    );
    this._addModalObj(
      this.add.text(qtyX, y + 16, `x${item.cantidad}`, {
        fontSize: '14px', fontFamily: 'monospace',
        fill: item.cantidad > 0 ? '#22c55e' : '#64748b',
      }).setOrigin(1, 0.5).setDepth(DEPTH.MODAL_CONTENT)
    );

    if (hasPrecio) {
      const btnW = 54, btnH = 26;
      const btnX = x + w - btnW;
      const btnY = y + 16 - btnH / 2;
      const afford = this.inventory.coins >= item.precio;

      const btnBg = this.add.graphics().setDepth(DEPTH.MODAL_CONTENT);
      btnBg.fillStyle(afford ? 0x7c3aed : 0x3f3f46, 1);
      btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 7);
      this._addModalObj(btnBg);

      this._addModalObj(
        this.add.text(btnX + btnW / 2, btnY + btnH / 2, `🪙${item.precio}`, {
          fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold',
          fill: afford ? '#ffffff' : '#a1a1aa',
        }).setOrigin(0.5).setDepth(DEPTH.MODAL_CONTENT + 1)
      );

      const zone = this.add.zone(btnX, btnY, btnW, btnH).setOrigin(0)
        .setInteractive({ useHandCursor: true }).setDepth(DEPTH.MODAL_CONTENT + 1);
      this._addModalObj(zone);
      zone.on('pointerdown', () => this._comprarProducto(item.id, item.precio));
    }
  }

  // Compra 1 unidad si alcanza; si no, feedback en el momento sin cerrar el
  // panel (depth por encima del modal — _showFloatingText por defecto queda
  // DEBAJO del overlay/panel, ver el parámetro `depth` agregado ahí).
  // Reabre el mismo panel (mismos categorias/titulo guardados en
  // _openStoragePanel) para refrescar cantidad/saldo/estado de los botones.
  _comprarProducto(productId, precio) {
    if (!this.inventory.spendCoins(precio)) {
      this._showFloatingText('🪙 No te alcanza', this.scale.width / 2, this.scale.height / 2, '#ef4444', DEPTH.MODAL_CONTENT + 2);
      return;
    }
    this.inventory.add(productId, 1);
    this._updateCoinsUI();
    this._openStoragePanel(this._lastStorage.categorias, this._lastStorage.titulo);
  }

  // ── 2.10 / 2.11: Recetario + cocinar con timing única ────────────────────

  _openRecetario() {
    const { panelX, panelY, panelW } = this._openModal('Recetario');
    const rowH = 76;
    let y = panelY + 66;

    Recetas.all().forEach(receta => {
      this._addRecetaRow(panelX + 20, y, panelW - 40, receta);
      y += rowH;
    });
  }

  _ingredienteDisponible(ing) {
    if (ing.productId) return this.inventory.has(ing.productId, ing.cantidad);
    return (ing.anyOf || []).some(id => this.inventory.has(id, ing.cantidad));
  }

  _ingredienteLabel(ing) {
    if (ing.productId) {
      const p = Products.byId(ing.productId);
      return `${ing.cantidad}x ${p ? p.nombre : ing.productId}`;
    }
    const nombres = (ing.anyOf || []).map(id => (Products.byId(id) || {}).nombre || id).join('/');
    return `${ing.cantidad}x ${nombres}`;
  }

  _addRecetaRow(x, y, w, receta) {
    this._addModalObj(
      this.add.text(x, y, receta.nombre, {
        fontSize: '15px', fill: '#e9d5ff', fontFamily: 'monospace', fontStyle: 'bold'
      }).setOrigin(0, 0).setDepth(DEPTH.MODAL_CONTENT)
    );

    let ix = x;
    const iy = y + 24;
    receta.ingredientes.forEach((ing, idx) => {
      const disponible = this._ingredienteDisponible(ing);
      const txt = this.add.text(ix, iy, this._ingredienteLabel(ing), {
        fontSize: '12px', fontFamily: 'monospace',
        fill: disponible ? '#22c55e' : '#64748b',
      }).setOrigin(0, 0).setDepth(DEPTH.MODAL_CONTENT);
      this._addModalObj(txt);
      ix += txt.width;

      if (idx < receta.ingredientes.length - 1) {
        const sep = this.add.text(ix, iy, ', ', {
          fontSize: '12px', fill: '#94a3b8', fontFamily: 'monospace'
        }).setOrigin(0, 0).setDepth(DEPTH.MODAL_CONTENT);
        this._addModalObj(sep);
        ix += sep.width;
      }
    });

    const canCraft = this.inventory.canCraft(receta.id);
    const btnW = 90;
    const btnH = 30;
    const btnX = x + w - btnW;
    const btnY = y;

    const btnBg = this.add.graphics().setDepth(DEPTH.MODAL_CONTENT);
    btnBg.fillStyle(canCraft ? 0x7c3aed : 0x3f3f46, 1);
    btnBg.fillRoundedRect(btnX, btnY, btnW, btnH, 8);
    this._addModalObj(btnBg);

    this._addModalObj(
      this.add.text(btnX + btnW / 2, btnY + btnH / 2, 'Cocinar', {
        fontSize: '13px', fontFamily: 'monospace',
        fill: canCraft ? '#ffffff' : '#71717a',
      }).setOrigin(0.5).setDepth(DEPTH.MODAL_CONTENT + 1)
    );

    if (canCraft) {
      const zone = this.add.zone(btnX, btnY, btnW, btnH).setOrigin(0)
        .setInteractive({ useHandCursor: true }).setDepth(DEPTH.MODAL_CONTENT + 1);
      this._addModalObj(zone);
      zone.on('pointerdown', () => this._cocinar(receta));
    }
  }

  // design D8: al cocinar se dispara UNA ÚNICA barra de timing (no una por
  // ingrediente). Acierto = consume ingredientes y el plato QUEDA GUARDADO
  // en el inventario (Inventory.craft lo suma al stock — pedido del usuario:
  // antes se servía solo apenas se cocinaba, ahora cocinar y comer son dos
  // pasos separados, el plato se come después desde el panel de comer
  // rápido). Fallo = no consume nada. Se cierra el Recetario antes de
  // mostrar la barra (mismo criterio que un diálogo de confirmación; evita
  // solapar la barra con el modal).
  //
  // useHitZone: false + botón "Cocinar" propio (pedido del usuario: no
  // tocar la barra). targetWidth/speed más difíciles que antes (0.22→0.14,
  // 0.9→1.3, también pedido del usuario).
  // cursorTexture: 'gorro_cocinero' reemplaza el cursor rectangular blanco.
  _cocinar(receta) {
    this._closeModal();
    const W = this.scale.width;
    const H = this.scale.height;

    const bar = new TimingBar({
      scene: this,
      x: W / 2,
      y: H / 2,
      width: 260,
      targetStart: 0.4,
      targetWidth: 0.14,
      speed: 1.3,
      useHitZone: false,
      cursorTexture: 'gorro_cocinero',
      depth: 60,
      onResult: (result) => {
        cookBtn.destroy();
        if (result === 'success' || result === 'perfect') {
          this.inventory.craft(receta.id);
          this.inventory.addCoins(receta.coins);
          this._updateCoinsUI();
          this._showFloatingText(`¡${receta.nombre} lista! 🍳 🪙+${receta.coins}`, W / 2, H / 2 - 60, '#22c55e');
        } else {
          // No consume nada (spec kitchen-scene: "Cocinar con timing
          // fallido"). El texto es solo feedback visual, no afecta el estado.
          this._showFloatingText('¡Uy, no llegaste a tiempo!', W / 2, H / 2 - 60, '#ef4444');
        }
        this._updateComerPanel();
      },
    });

    const cookBtn = this.add.text(W / 2, H / 2 + 50, 'Cocinar', {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#7c3aed', padding: { x: 24, y: 10 },
    }).setOrigin(0.5).setDepth(61).setInteractive({ useHandCursor: true });
    cookBtn.on('pointerover', () => cookBtn.setStyle({ backgroundColor: '#9333ea' }));
    cookBtn.on('pointerout',  () => cookBtn.setStyle({ backgroundColor: '#7c3aed' }));
    cookBtn.on('pointerdown', () => bar.tap());
  }

  // ── 2.12: panel fijo de comer rápido (reemplaza la mecánica vieja de tocar
  // heladera/mercadería directo — ver design D8, tasks.md 2.5) ─────────────

  _createComerPanel(W, H) {
    const panelW = W - 40;
    const panelH = 112; // más alto que antes (84): nombre/ícono/cantidad apilados verticalmente
    const panelX = 20;
    const panelY = H - 122; // el botón volver ya no vive acá abajo (ahora es el pergamino, arriba junto al engranaje), así que el panel puede bajar y crecer sin chocar con nada
    const cy = panelY + panelH / 2;

    const bg = this.add.graphics().setDepth(DEPTH.COMER_PANEL);
    bg.fillStyle(0x1e1b4b, 0.97); // más sólido (antes 0.9)
    bg.fillRoundedRect(panelX, panelY, panelW, panelH, 14);
    bg.lineStyle(2, 0x7c3aed, 0.8);
    bg.strokeRoundedRect(panelX, panelY, panelW, panelH, 14);

    this._comerPanelY = panelY;

    // Botón Comer (a la derecha)
    this._comerBtnW = 64;
    this._comerBtnH = 32;
    this._comerBtnX = panelX + panelW - this._comerBtnW - 14;
    this._comerBtnY = cy - this._comerBtnH / 2;
    this._comerBtnBg = this.add.graphics().setDepth(DEPTH.COMER_PANEL + 1);
    this._comerBtnTxt = this.add.text(
      this._comerBtnX + this._comerBtnW / 2, cy, 'Comer', {
        fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff'
      }
    ).setOrigin(0.5).setDepth(DEPTH.COMER_PANEL + 2);

    const comerZone = this.add.zone(this._comerBtnX, this._comerBtnY, this._comerBtnW, this._comerBtnH)
      .setOrigin(0).setInteractive({ useHandCursor: true }).setDepth(DEPTH.COMER_PANEL + 2);
    comerZone.on('pointerdown', () => this._eatQuick());

    // Flechas ◀ ▶
    const leftArrow = this.add.text(panelX + 16, cy, '◀', {
      fontSize: '22px', fill: '#a78bfa', fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(DEPTH.COMER_PANEL + 1);
    leftArrow.on('pointerover', () => leftArrow.setStyle({ fill: '#ffffff' }));
    leftArrow.on('pointerout', () => leftArrow.setStyle({ fill: '#a78bfa' }));
    leftArrow.on('pointerdown', () => this._cycleComer(-1));

    const rightArrow = this.add.text(this._comerBtnX - 18, cy, '▶', {
      fontSize: '22px', fill: '#a78bfa', fontFamily: 'monospace'
    }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setDepth(DEPTH.COMER_PANEL + 1);
    rightArrow.on('pointerover', () => rightArrow.setStyle({ fill: '#ffffff' }));
    rightArrow.on('pointerout', () => rightArrow.setStyle({ fill: '#a78bfa' }));
    rightArrow.on('pointerdown', () => this._cycleComer(1));

    // Nombre arriba, plato en el medio, cantidad abajo — apilados y
    // centrados en el espacio entre las flechas ◀ ▶ (pedido del usuario:
    // antes era ícono a la izquierda + texto a la derecha y quedaba
    // apretado/cortado con nombres largos).
    const contentCenterX = (leftArrow.x + leftArrow.width / 2 + rightArrow.x - rightArrow.width / 2) / 2;

    this._comerNombre = this.add.text(contentCenterX, cy - 34, '', {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e2e8f0'
    }).setOrigin(0.5).setDepth(DEPTH.COMER_PANEL + 1);
    this._comerIcon = this.add.image(contentCenterX, cy, PRODUCTS[0].sprite)
      .setDisplaySize(40, 40).setDepth(DEPTH.COMER_PANEL + 1);
    this._comerQty = this.add.text(contentCenterX, cy + 32, '', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#94a3b8'
    }).setOrigin(0.5).setDepth(DEPTH.COMER_PANEL + 1);

    this._updateComerPanel();
  }

  // Solo productos con stock > 0 (pedido del usuario: antes ciclaba TODO el
  // catálogo comestibleDirecto —14 ítems— mostrando "Tenés: 0" para casi
  // todos apenas había un solo producto con stock; ahora solo se ve lo que
  // realmente hay para comer).
  _availableComer() {
    return Products.comestiblesDirecto().filter(p => this.inventory.get(p.id) > 0);
  }

  _cycleComer(dir) {
    const list = this._availableComer();
    if (list.length === 0) return;
    this._comerIndex = (this._comerIndex + dir + list.length) % list.length;
    this._updateComerPanel();
  }

  _updateComerPanel() {
    const list = this._availableComer();

    if (list.length === 0) {
      this._comerIndex = 0;
      this._comerIcon.setVisible(false);
      this._comerNombre.setText('Vacío');
      this._comerNombre.setStyle({ fill: '#64748b' });
      this._comerQty.setText('');
      this._setComerBtnEnabled(false);
      return;
    }

    if (this._comerIndex >= list.length) this._comerIndex = 0;
    const product = list[this._comerIndex];

    this._comerIcon.setVisible(true);
    this._comerIcon.setTexture(product.sprite);
    this._comerNombre.setText(product.nombre);
    this._comerNombre.setStyle({ fill: '#e2e8f0' });
    this._comerQty.setText(`Tenés: ${this.inventory.get(product.id)}`);

    this._setComerBtnEnabled(true);
  }

  _setComerBtnEnabled(enabled) {
    this._comerBtnEnabled = enabled;
    this._comerBtnTxt.setStyle({ fill: enabled ? '#ffffff' : '#71717a' });
    this._comerBtnBg.clear();
    this._comerBtnBg.fillStyle(enabled ? 0x7c3aed : 0x3f3f46, 1);
    this._comerBtnBg.fillRoundedRect(this._comerBtnX, this._comerBtnY, this._comerBtnW, this._comerBtnH, 8);
  }

  _eatQuick() {
    if (this._feedCooldown > 0) return;
    if (!this._comerBtnEnabled) return;

    const list = this._availableComer();
    const product = list[this._comerIndex];
    if (!product || !this.inventory.has(product.id, 1)) return;

    this.inventory.remove(product.id, 1);
    this._feedCooldown = 1500;

    // Ingrediente crudo: "sube poco" (D9: comer rápido da ~8-12). Plato
    // cocinado: usa su propio campo `hambre` (ver products.js), bastante más
    // alto — pedido del usuario: cocinar y comer un plato ahora es dos pasos
    // separados, así que el plato tiene que valer lo que valía la receta.
    const HUNGER_GAIN = product.hambre ?? 8;
    this.stats.addHunger(HUNGER_GAIN);
    this._showFloatingText(`+${HUNGER_GAIN} 🍽️`, this.scale.width / 2, this._comerPanelY - 10, '#22c55e');
    this._updateComerPanel();
  }

  // ── Texto flotante reutilizable (comer rápido + resultado de cocinar) ────

  _showFloatingText(msg, x, y, color = '#22c55e', depth = DEPTH.FLOATING_TEXT) {
    const txt = this.add.text(x, y, msg, {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold',
      color, stroke: '#000000', strokeThickness: 3,
    }).setOrigin(0.5).setDepth(depth);

    this.tweens.add({
      targets: txt, y: txt.y - 40, alpha: 0, duration: 800, ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }

  // ── Botón volver (mapa) ──────────────────────────────────────────────────
  // Pedido del usuario: reemplaza el texto "← Volver" por el pergamino, que
  // abre MapScene en vez de ir directo a la Cabaña — la persona elige a qué
  // sala moverse tocando el ícono correspondiente sobre el mapa. Posición:
  // esquina superior derecha, debajo del engranaje (pedido explícito del
  // usuario — antes estaba abajo en el lugar de "Volver").

  _makeBackButton(W, H) {
    // El pergamino es ancho y bajo (no ~cuadrado como engranaje/moneda_ayuda)
    // — escalar por ancho, si no desborda el margen derecho de la pantalla.
    const TARGET_WIDTH = 64;
    const tex = this.textures.get('pergamino').getSourceImage();
    const scale = TARGET_WIDTH / tex.width;

    const btn = this.add.image(W - 46, 106, 'pergamino')
      .setScale(scale)
      .setDepth(DEPTH.BACK_BUTTON)
      .setInteractive({ useHandCursor: true });

    btn.on('pointerover', () => btn.setScale(scale * 1.12));
    btn.on('pointerout',  () => btn.setScale(scale));
    btn.on('pointerdown', () => {
      // bringToTop: MapScene está registrada antes que KitchenScene en
      // game.js, así que sin esto Phaser la dibuja DEBAJO de esta sala.
      // pause(): mismo motivo que Ayuda/Configuración — sin esto los clicks
      // en la zona oscura del mapa le llegan igual a la Cocina de abajo.
      this.scene.pause();
      this.scene.launch('MapScene', { callerKey: this.scene.key });
      this.scene.bringToTop('MapScene');
    });
  }
}
