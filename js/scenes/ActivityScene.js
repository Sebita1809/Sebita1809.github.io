// Caja de la mesa de juego (único objeto interactivo, design D7) como % del
// fondo sala-actividades-limpia.png (1536x2752). Recortada directamente del
// fondo (mismo criterio que BATHROOM_BOXES/BEDROOM_BOXES) — alineación
// exacta por construcción. El resto de la decoración (estantería, caballete,
// compu/tablet, tela del techo, binoculares/cámara, food truck) queda
// pintada directo en el fondo, sin recorte aparte: no son interactivos,
// mismo criterio que escritorio/estantería/cuadrito en Dormitorio (3.3).
const ACTIVITY_BOXES = {
  mesa: { key: 'sala_mesa', left: 600 / 1536, top: 1650 / 2752, width: 770 / 1536, height: 560 / 2752 },
};

class ActivityScene extends RoomScene {
  constructor() { super('ActivityScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.stats = this.registry.get('stats');

    this._drawBackground(W, H, 'sala_fondo');

    // El menú de minijuegos (design D7) — Sudoku (9x9) y Crucigrama ya
    // están implementados (pedido del usuario); el resto sigue siendo
    // Etapa 4.
    this._makeHoverObject(ACTIVITY_BOXES.mesa, () => this._openMinijuegosMenu());

    this._makeHelpButton('activity');
    this._makeGearButton(W);
    this._makeBackButton(W, H);
    this._createStatsUI();

    // De pie sobre la alfombra, a la izquierda de la mesa, en el hueco
    // libre entre el food truck de juguete y las patas delanteras de la mesa.
    this._placeVero(90, 780);
  }

  // Mismo motivo que BedroomScene/BathroomScene.update(): las stats tienen
  // que seguir decayendo mientras el jugador está en esta sala.
  update(time, delta) {
    this.stats.update(delta);
    this._updateStatsUI();
    this._checkGlucemiaShake();
    this._updateVeroExpression();
  }

  // ── Menú de minijuegos (design D7) ───────────────────────────────────────
  // Mismo patrón overlay+panel que GardenScene._openSeedPicker — Sudoku abre
  // una escena de pantalla completa (pausa esta sala, la reanuda al volver,
  // mismo criterio que Ayuda/Configuración/Mapa); el resto queda como fila
  // deshabilitada con un stub al tocarla.
  _openMinijuegosMenu() {
    const W = this.scale.width;
    const H = this.scale.height;

    const overlay = this.add.rectangle(0, 0, W, H, 0x1a1a2e, 1)
      .setOrigin(0).setDepth(58).setInteractive();

    const panelW = W - 60;
    const panelH = 260;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    const panel = this.add.graphics().setDepth(59);
    panel.fillStyle(0xe3e0ee, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, 0x7c3aed, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    const elements = [overlay, panel];

    elements.push(this.add.text(W / 2, panelY + 26, '🎲 Minijuegos', {
      fontSize: '18px', fill: '#312e81', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(60));

    const closeBtn = this.add.text(panelX + panelW - 16, panelY + 12, '✕', {
      fontSize: '20px', fill: '#7c3aed', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(60).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerdown', () => elements.forEach(e => e.destroy()));
    elements.push(closeBtn);

    const ENTRIES = [
      { label: '🔢 Sudoku', sceneKey: 'SudokuScene' },
      { label: '📝 Crucigrama', sceneKey: 'CrosswordScene' },
    ];
    const rowH = 60;
    ENTRIES.forEach((entry, idx) => {
      const rowY = panelY + 70 + idx * rowH;
      const txt = this.add.text(W / 2, rowY, entry.label, {
        fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold',
        fill: '#312e81', backgroundColor: '#c4b5fd', padding: { x: 16, y: 10 },
      }).setOrigin(0.5).setDepth(60).setInteractive({ useHandCursor: true });

      txt.on('pointerdown', () => {
        elements.forEach(e => e.destroy());
        this.scene.pause();
        this.scene.launch(entry.sceneKey, { callerKey: this.scene.key });
        this.scene.bringToTop(entry.sceneKey);
      });
      elements.push(txt);
    });
  }

  // Mismo patrón que BedroomScene._stub/BathroomScene._stub. depth
  // opcional: por defecto FLOATING_TEXT (10), insuficiente si se llama desde
  // encima del menú de minijuegos (depth 58+) — ver _openMinijuegosMenu.
  _stub(msg, depth = RoomScene.DEPTH.FLOATING_TEXT) {
    const txt = this.add.text(this.scale.width / 2, this.scale.height / 2, msg, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#4c1d95', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(depth);

    this.tweens.add({
      targets: txt, y: txt.y - 30, alpha: 0, duration: 1200, delay: 400, ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }
}
