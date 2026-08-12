// Cajas de 6 de los 9 canteros de huerta-nueva.png (2812x1504, imagen nueva
// del usuario — reemplaza huerta-limpia.png/1536x2752). El usuario pidió
// explícitamente que no hace falta usar los 9 canteros que trae la imagen
// nueva, con que 6 se vean/funcionen alcanza — se eligieron 6 que forman
// una silueta de hexágono pareja (top/left/right/center/frontleft/
// frontright), salteando far-left/far-right/bottom-center de la imagen
// (quedan decorativos, sin cantero interactivo encima). Recortadas
// directamente del fondo original (extract-huerta-canteros-v2.js, mismo
// criterio que BATHROOM_BOXES).
//
// Las fracciones son sobre huerta-nueva-RECORTADA.png (970x1504, ver
// comentario en BootScene.js sobre por qué el fondo panorámico original no
// entraba parejo), no sobre la imagen completa de 2812px — por eso las
// cajas de left/right/frontleft/frontright son más anchas en fracción que
// top/center (misma caja en píxeles absolutos, pero el denominador del
// fondo recortado es mucho más chico).
//
// PLOT_KEYS fija el orden = índice en el array `garden` de game.registry
// (GardenScene.PLOT_COUNT).
const GARDEN_BOXES = {
  top:        { key: 'cantero2_top',        left: 0.3969, top: 0.5386, width: 0.2887, height: 0.1164 },
  left:       { key: 'cantero2_left',       left: 0.1134, top: 0.6217, width: 0.2990, height: 0.1164 },
  right:      { key: 'cantero2_right',      left: 0.6598, top: 0.6217, width: 0.2990, height: 0.1164 },
  center:     { key: 'cantero2_center',     left: 0.3918, top: 0.7048, width: 0.2938, height: 0.1164 },
  frontleft:  { key: 'cantero2_frontleft',  left: 0.1289, top: 0.7846, width: 0.2938, height: 0.1197 },
  frontright: { key: 'cantero2_frontright', left: 0.6598, top: 0.7846, width: 0.2990, height: 0.1197 },
};
const PLOT_KEYS = ['top', 'left', 'right', 'center', 'frontleft', 'frontright'];

function formatDuration(ms) {
  const min = ms / 60000;
  if (min < 60) return `${min} min`;
  const hours = min / 60;
  return `${hours} hora${hours === 1 ? '' : 's'}`;
}

class GardenScene extends RoomScene {
  constructor() { super('GardenScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.stats = this.registry.get('stats');
    this.inventory = this.registry.get('inventory');

    this._drawBackground(W, H, 'huerta_fondo');

    // this._plotOverlay[i] = GameObject dinámico (brote o ícono de cosecha)
    // encima del cantero i, o null si está vacío. this._plotSignature[i]
    // evita recrearlo (y reiniciar el tween de pulso del ícono listo) en
    // cada refresh de 1s si el estado visual no cambió — ver _refreshPlot.
    this._plotOverlay = new Array(PLOT_KEYS.length).fill(null);
    this._plotSig = new Array(PLOT_KEYS.length).fill(null);
    // hitInset: las 6 cajas (rombos vecinos en diagonal) se solapan bastante
    // en algunas esquinas — sin esto, tocar cerca del borde entre dos
    // canteros podía activar el vecino en vez del que se ve debajo del dedo
    // (encontrado durante la verificación con Playwright de los sprites de
    // plantas). 0.18 reduce mucho la franja ambigua entre left/farleft y
    // center/front sin achicar demasiado el área de tap (el centro de cada
    // cantero queda cubierto de sobra, verificado) — eliminarla del todo
    // pediría ~0.36 de inset, dejando canteros incómodos de tocar; no vale
    // la pena para una franja de unos pocos px que en el peor caso solo
    // hace falta tocar de nuevo. No afecta el tamaño visual del cantero.
    this._plotImgs = PLOT_KEYS.map((key, i) =>
      this._makeHoverObject(GARDEN_BOXES[key], () => this._onPlotTap(i), { hitInset: 0.18 })
    );

    this._makeHelpButton('garden');
    this._makeGearButton(W);
    this._makeBackButton(W, H);
    this._createStatsUI();
    this._createCoinsUI();

    // Sin Vero en esta sala (pedido del usuario): con 6 canteros ocupando
    // casi toda la pantalla no hay un hueco realmente libre que no la haga
    // sentir "en el medio" tapando algo — mismo criterio que la Cabaña, que
    // tampoco la tiene desde que las salas con contenido real son donde
    // vive el jugador (ver tasks.md 2.15).

    this._refreshAllPlots();
    // Chequeo periódico (1s) — NO es un acumulador de crecimiento (ver
    // Plants.isReady, siempre deriva contra Date.now()), solo refresca la UI
    // mientras el jugador está parado en la sala para que un cantero pase a
    // "listo" sin tener que salir y volver a entrar.
    this.time.addEvent({ delay: 1000, loop: true, callback: this._refreshAllPlots, callbackScope: this });
  }

  update(time, delta) {
    this.stats.update(delta);
    this._updateStatsUI();
    this._checkGlucemiaShake();
    this._updateCoinsUI();
  }

  // ── 6.4/6.5/6.6/6.7: interacción por cantero — el estado (vacío/
  // creciendo/listo) se relee fresco en cada tap, no se guarda en el
  // GameObject. ──────────────────────────────────────────────────────────
  _onPlotTap(i) {
    const garden = this.registry.get('garden');
    const plot = garden[i];

    if (!plot) { this._openSeedPicker(i); return; }
    if (Plants.isReady(plot)) { this._harvest(i); return; }
    this._water(i);
  }

  _plant(i, speciesId) {
    const garden = this.registry.get('garden');
    garden[i] = { species: speciesId, plantedAt: Date.now(), watered: false };
    this._saveGarden();
    this._refreshAllPlots();

    const c = this._plotCenter(i);
    const nombre = Products.byId(speciesId).nombre;
    this._showFloatingText(`🌱 ${nombre} plantada`, c.x, c.y - 20);
  }

  // Regar es puramente visual (tasks.md 6.6 dice explícito "estado visual")
  // — resuelve la Open Question de design.md (¿el riego es obligatorio o
  // solo acelera?): no es ninguna de las dos, no toca el cálculo de
  // Plants.isReady en absoluto. Solo deja `watered:true` para que el brote
  // se dibuje con una gotita al lado (ver _growingIcon).
  _water(i) {
    const garden = this.registry.get('garden');
    garden[i].watered = true;
    this._saveGarden();
    this._refreshAllPlots();

    const c = this._plotCenter(i);
    this._showFloatingText('💧', c.x, c.y - 20, '#38bdf8');
  }

  _harvest(i) {
    const garden = this.registry.get('garden');
    const plot = garden[i];
    const producto = Products.byId(plot.species);
    const def = Plants.byId(plot.species);

    this.inventory.add(plot.species, 1);
    this.inventory.addCoins(def.harvestCoins);
    garden[i] = null;
    this._saveGarden();
    this._refreshAllPlots();
    this._updateCoinsUI();

    const c = this._plotCenter(i);
    this._showFloatingText(`+1 ${producto.nombre}  🪙+${def.harvestCoins}`, c.x, c.y - 20, '#22c55e');
  }

  // Guardado inmediato además del autoguardado periódico de game.js — una
  // planta recién sembrada (o una cosecha) no debería perderse si el
  // navegador se cierra antes de los 10s del intervalo.
  //
  // Llama al _autosave() global (game.js) en vez de armar su propio
  // SaveManager.save() parcial — bug real encontrado acá: la versión
  // anterior llamaba a SaveManager.save(stats, inventory, garden) con solo
  // 3 argumentos, y como SaveManager.save() sobreescribe TODO el blob (no
  // mergea), cada vez que se plantaba/regaba/cosechaba se pisaban outfit y
  // peinado con sus valores por defecto ('default'/'suelto'), perdiendo en
  // silencio la prenda/peinado elegidos. _autosave() sí junta los 6
  // registry keys completos.
  _saveGarden() {
    _autosave();
  }

  _plotCenter(i) {
    const s = this._toScene(GARDEN_BOXES[PLOT_KEYS[i]]);
    return { x: s.x + s.w / 2, y: s.y + s.h / 2 };
  }

  // ── Overlays dinámicos + aviso de plantas listas (6.8, in-game — D6 deja
  // la notificación push del SO para Etapa 5) ──────────────────────────────
  _refreshAllPlots() {
    const garden = this.registry.get('garden');
    let readyCount = 0;

    PLOT_KEYS.forEach((key, i) => {
      this._refreshPlot(i, garden[i]);
      if (Plants.isReady(garden[i])) readyCount++;
    });

    if (readyCount > 0) {
      const msg = `🌱 ${readyCount} list${readyCount === 1 ? 'a' : 'as'} para cosechar`;
      if (this._readyBanner) this._readyBanner.setText(msg);
      else {
        this._readyBanner = this.add.text(this.scale.width / 2, 130, msg, {
          fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
          backgroundColor: 'rgba(21,94,58,0.9)', padding: { x: 10, y: 5 },
        }).setOrigin(0.5).setDepth(RoomScene.DEPTH.FLOATING_TEXT);
      }
    } else if (this._readyBanner) {
      this._readyBanner.destroy();
      this._readyBanner = null;
    }
  }

  _refreshPlot(i, plot) {
    const signature = this._plotSignature(plot);
    if (signature === this._plotSig[i]) return; // sin cambios visuales — no reinicia el tween del ícono listo
    this._plotSig[i] = signature;

    if (this._plotOverlay[i]) {
      this._plotOverlay[i].destroy();
      this._plotOverlay[i] = null;
    }
    if (!plot) return;

    const c = this._plotCenter(i);
    const box = this._toScene(GARDEN_BOXES[PLOT_KEYS[i]]);
    // Ícono de la planta SOLA (sin cajón propio) flotando sobre el cantero
    // vacío que ya dibuja el fondo — la v2 (sprites con cantero incluido,
    // canteros-por-planta.png) se superponía fea contra el cantero real del
    // fondo (dos cajones dibujados uno sobre el otro, pedido del usuario:
    // volver al criterio de la v1). Tamaño: se respeta el aspect ratio
    // propio de cada sprite (varía mucho entre etapas/especies, de hoja
    // chica a arbusto ancho) en vez de estirar a box.w x box.h — se fija la
    // ALTURA a un % del cantero y el ancho sale de ahí. Iteración 2 (pedido
    // del usuario tras ver la 1: seguía quedando sobre la madera del
    // frente, y pidió que fuera más chica en vez de más grande) — la caja
    // es el diamante completo (tierra arriba + borde de madera del frente
    // abajo), corrida bastante más arriba para que quede sobre la tierra.
    const stageKey = Plants.stageKey(plot);
    const texKey = `planta_${plot.species}_${stageKey}`;
    const tex = this.textures.get(texKey).getSourceImage();
    const dispH = box.h * 0.62;
    const dispW = dispH * (tex.width / tex.height);
    const cy = c.y - box.h * 0.30;

    if (Plants.isReady(plot)) {
      const icon = this.add.image(c.x, cy, texKey)
        .setDisplaySize(dispW, dispH)
        .setDepth(RoomScene.DEPTH.INTERACTIVE + 1);
      this.tweens.add({ targets: icon, scale: icon.scale * 1.08, duration: 500, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
      this._plotOverlay[i] = icon;
    } else {
      this._plotOverlay[i] = this._growingIcon(c.x, cy, plot, dispW, dispH, texKey);
    }
  }

  // Firma corta del estado VISUAL de un cantero — distinta de Plants.isReady
  // porque acá también importa la etapa (Plants.stageKey, plántula/crecida/
  // etc — cambia varias veces durante el crecimiento) y si está regado
  // (gotita extra), sin que haga falta destruir/recrear el GameObject en
  // cada refresh de 1s si nada de esto cambió.
  _plotSignature(plot) {
    if (!plot) return 'empty';
    return `${plot.species}:${Plants.stageKey(plot)}:${plot.watered}`;
  }

  // Sprite real de la especie en su etapa actual (planta_X_<etapa>,
  // Plants.stageKey — plántula/crecida/con-frutos según cuánto creció,
  // solo la planta con un sombreado propio de "enterrada" en la base, ver
  // extract-plantas-solas.js). Container para poder sumarle la gotita 💧
  // como hijo aparte cuando está regado, sin tocar la textura de la planta.
  _growingIcon(x, y, plot, dispW, dispH, texKey) {
    const container = this.add.container(x, y).setDepth(RoomScene.DEPTH.INTERACTIVE + 1);
    const img = this.add.image(0, 0, texKey).setDisplaySize(dispW, dispH);
    container.add(img);
    if (plot.watered) {
      const dropOffset = Math.min(dispW, dispH) * 0.3;
      container.add(this.add.text(dropOffset, -dropOffset, '💧', { fontSize: '16px' }).setOrigin(0.5));
    }
    return container;
  }

  // ── 6.4: elegir semilla para un cantero vacío, cada una con su costo
  // (PLANTS[].seedCost) — descuenta inventory.coins antes de plantar; si no
  // alcanza, feedback en el momento sin cerrar el picker. ─────────────────
  _openSeedPicker(plotIndex) {
    const W = this.scale.width;
    const H = this.scale.height;

    const overlay = this.add.rectangle(0, 0, W, H, 0x1a1a2e, 1)
      .setOrigin(0).setDepth(58).setInteractive();

    const panelW = W - 48;
    const panelH = 620;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    const panel = this.add.graphics().setDepth(59);
    panel.fillStyle(0xe3e0ee, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, 0x16a34a, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    const elements = [overlay, panel];

    elements.push(this.add.text(W / 2, panelY + 24, '🌱 Elegí una semilla', {
      fontSize: '17px', fill: '#14532d', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60));

    const closeBtn = this.add.text(panelX + panelW - 16, panelY + 12, '✕', {
      fontSize: '20px', fill: '#16a34a', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(60).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => elements.forEach(e => e.destroy()));
    elements.push(closeBtn);

    const rowH = (panelH - 60) / PLANTS.length;
    PLANTS.forEach((plantDef, idx) => {
      const producto = Products.byId(plantDef.id);
      const rowY = panelY + 54 + idx * rowH + rowH / 2;
      const affordable = this.inventory.coins >= plantDef.seedCost;

      const rowZone = this.add.rectangle(W / 2, rowY, panelW - 16, rowH - 4, 0xffffff, 0.001)
        .setDepth(60).setInteractive({ useHandCursor: true });
      rowZone.on('pointerover', () => rowZone.setFillStyle(0x16a34a, 0.12));
      rowZone.on('pointerout', () => rowZone.setFillStyle(0xffffff, 0.001));
      rowZone.on('pointerdown', () => {
        // No alcanza: feedback en el momento, sin cerrar el picker (así
        // puede elegir una semilla más barata en vez de perder el progreso
        // de haber abierto el panel).
        if (!this.inventory.spendCoins(plantDef.seedCost)) {
          this._showFloatingText('🪙 No te alcanza', W / 2, rowY, '#ef4444', 62);
          return;
        }
        elements.forEach(e => e.destroy());
        this._updateCoinsUI();
        this._plant(plotIndex, plantDef.id);
      });
      elements.push(rowZone);

      const iconSize = rowH - 14;
      elements.push(this.add.image(panelX + 30, rowY, producto.sprite)
        .setDisplaySize(iconSize, iconSize).setDepth(61)
        .setAlpha(affordable ? 1 : 0.4));

      elements.push(this.add.text(panelX + 60, rowY - 9, producto.nombre, {
        fontSize: '13px', fill: affordable ? '#312e81' : '#9ca3af', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(0, 0.5).setDepth(61));
      elements.push(this.add.text(panelX + 60, rowY + 9, formatDuration(plantDef.growthMs), {
        fontSize: '11px', fill: '#6b7280', fontFamily: 'monospace',
      }).setOrigin(0, 0.5).setDepth(61));
      elements.push(this.add.text(panelX + panelW - 24, rowY, `🪙${plantDef.seedCost}`, {
        fontSize: '13px', fill: affordable ? '#a16207' : '#ef4444', fontFamily: 'monospace', fontStyle: 'bold',
      }).setOrigin(1, 0.5).setDepth(61));
    });
  }
}

GardenScene.PLOT_COUNT = PLOT_KEYS.length;
