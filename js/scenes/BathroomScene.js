// Cajas de cada objeto interactivo como % del fondo bano-limpio.png
// (1536x2752). Recortados directamente del fondo (mismo criterio que
// BEDROOM_BOXES en BedroomScene.js) — la alineación es exacta por
// construcción, no por medición aparte. bano-limpio.png es baño.png con
// la marca de agua de Gemini de la esquina inferior derecha (piso) parchada
// con un recorte de la misma tabla de madera, corrido — pedido del usuario.
const BATHROOM_BOXES = {
  banera:  { key: 'bano_banera',  left: 0    / 1536, top: 1290 / 2752, width: 680 / 1536, height: 1000 / 2752 },
  inodoro: { key: 'bano_inodoro', left: 1180 / 1536, top: 1600 / 2752, width: 356 / 1536, height: 850  / 2752 },
  espejo:  { key: 'bano_espejo',  left: 830  / 1536, top: 590  / 2752, width: 500 / 1536, height: 730  / 2752 },
};

// Monedas por bañarse completo (pedido del usuario: la higiene también
// tiene que pagar, no solo la huerta y los minijuegos). "No muchas pero
// razonable" — en línea con lo que ya paga la huerta (2 a 5 por cosecha,
// 30min-12h de espera) y los minijuegos (10 por partida ganada, rejugable
// al toque): bañarse es rápido y repetible como los minijuegos pero más
// simple, así que va un poco por debajo de esos 10.
const BATH_COINS = 5;

class BathroomScene extends RoomScene {
  constructor() { super('BathroomScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.stats = this.registry.get('stats');
    this.inventory = this.registry.get('inventory');
    this._bathActive = false;   // guarda contra re-disparar bañarse mientras ya está corriendo
    this._toiletActive = false; // ídem para el inodoro

    this._drawBackground(W, H, 'bano_fondo');

    this._makeHoverObject(BATHROOM_BOXES.banera, () => this._banarse());
    this._makeHoverObject(BATHROOM_BOXES.inodoro, () => this._usarInodoro());
    // El espejo ya no abre nada (elegir peinado se sacó, pedido del
    // usuario) — queda decorativo.
    this._makeHoverObject(BATHROOM_BOXES.espejo);

    this._makeHelpButton('bathroom');
    this._makeGearButton(W);
    this._makeBackButton(W, H);
    this._createStatsUI();
    this._createCoinsUI();

    // Parada sobre la alfombra, entre la bañera y la bacha/inodoro.
    this._placeVero(200, 790);
  }

  // Mismo motivo que BedroomScene.update(): las stats tienen que seguir
  // decayendo mientras el jugador está en esta sala.
  update(time, delta) {
    this.stats.update(delta);
    this._updateStatsUI();
    this._checkGlucemiaShake();
    this._updateVeroExpression();
    this._updateCoinsUI();
  }

  // ── 4.3-4.5: Bañarse en tres pasos — cepillar (2 barras de timing),
  // shampoo (5 swipes) y el resto del baño (barra final). Al completar los
  // tres sube un poco hambre + sueño + diversión (decisión ya tomada en
  // design.md Open Questions: no hay stat de "higiene" propia, bañarse le
  // da un empujón chico a las stats existentes). El N de cepillado queda
  // fijo en 2 (el spec original lo variaba "según el peinado", pero la
  // elección de peinado se sacó del juego). ──────────────────────────────
  _banarse() {
    if (this._bathActive) return;
    this._bathActive = true;
    this._brushStep(1);
  }

  _brushStep(n) {
    const W = this.scale.width;
    const H = this.scale.height;
    const TOTAL = 2;

    // Solo se crea una vez, al entrar al paso 1 — se destruye al pasar a
    // shampoo (ver onResult más abajo).
    if (n === 1) this._brushSceneImg = this._showBathScene('bano_cepillado_fondo');

    // Abajo de la barra + fondo semi-opaco: pedido del usuario, arriba no se
    // leía bien contra la escena de apoyo (bano_cepillado_fondo) de atrás.
    const label = this.add.text(W / 2, H / 2 + 50, `Cepillar (${n}/${TOTAL})`, {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e9d5ff',
      backgroundColor: 'rgba(26,26,46,0.85)', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(60);

    new TimingBar({
      scene: this, x: W / 2, y: H / 2, width: 240,
      targetStart: 0.35, targetWidth: 0.2, speed: 1.0, depth: 55,
      cursorTexture: 'cepillo', cursorWidth: 30,
      onResult: () => {
        label.destroy();
        if (n < TOTAL) this._brushStep(n + 1);
        else {
          this._brushSceneImg.destroy();
          this._shampooStep();
        }
      },
    });
  }

  _shampooStep() {
    const W = this.scale.width;
    const H = this.scale.height;
    const TARGET = 5;
    const RANGE = 44;         // cuánto se puede arrastrar la mano desde el centro (px)
    const REP_DISTANCE = 55;  // px acumulados de arrastre para contar 1 pasada
    let count = 0;
    let traveled = 0;

    this._shampooSceneImg = this._showBathScene('bano_shampoo_fondo');

    // Abajo de la zona de la mano + fondo semi-opaco (mismo pedido que
    // "Cepillar" — no se leían contra la escena de apoyo de atrás).
    const label = this.add.text(W / 2, H / 2 + 150, 'Frotá el shampoo (arrastrá la mano)', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e9d5ff',
      backgroundColor: 'rgba(26,26,46,0.85)', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(60);
    const progress = this.add.text(W / 2, H / 2 + 180, `0/${TARGET}`, {
      fontSize: '13px', fontFamily: 'monospace', fill: '#a78bfa',
      backgroundColor: 'rgba(26,26,46,0.85)', padding: { x: 10, y: 4 },
    }).setOrigin(0.5).setDepth(60);

    // La mano ES el objeto que se agarra y arrastra (pedido del usuario:
    // "que sea como un grab... la mueves de arriba hacia abajo"), no un
    // gesto de swipe abstracto que dispara una animación aparte. Mismo
    // patrón de drag que el dial de volumen (SettingsScene._volKnob):
    // setInteractive({draggable:true}) + input.setDraggable + on('drag').
    // Cada REP_DISTANCE px de arrastre acumulado (en cualquier dirección)
    // cuenta como una pasada — recompensa mover la mano de verdad, no solo
    // tocar en cualquier lado.
    const handBaseY = H / 2;
    const hand = this.add.image(W / 2, handBaseY, 'mano_shampoo')
      .setDisplaySize(150, 150).setDepth(58)
      .setInteractive({ useHandCursor: true, draggable: true });
    this.input.setDraggable(hand);

    hand.on('drag', (pointer, dragX, dragY) => {
      if (count >= TARGET) return;
      const clampedY = Phaser.Math.Clamp(dragY, handBaseY - RANGE, handBaseY + RANGE);
      traveled += Math.abs(clampedY - hand.y);
      hand.y = clampedY;

      const before = count;
      while (traveled >= REP_DISTANCE && count < TARGET) {
        traveled -= REP_DISTANCE;
        count++;
      }
      if (count === before) return;

      progress.setText(`${count}/${TARGET}`);
      this.tweens.add({ targets: hand, scaleX: '+=0.08', scaleY: '+=0.08', duration: 90, yoyo: true });

      if (count >= TARGET) {
        hand.destroy();
        label.destroy();
        progress.destroy();
        this._shampooSceneImg.destroy();
        this._finalBathStep();
      }
    });

    hand.on('dragend', () => {
      if (count < TARGET) this.tweens.add({ targets: hand, y: handBaseY, duration: 150, ease: 'Quad.easeOut' });
    });
  }

  // Escena de apoyo (cepillar/shampoo) superpuesta al fondo normal del Baño.
  // Mismo escalado que _drawBackground (H/tex.height, centrada) pero sin
  // tocar _bgScale/_bgOffsetX — esos siguen mapeando bañera/inodoro/espejo.
  _showBathScene(key) {
    const W = this.scale.width;
    const H = this.scale.height;
    const tex = this.textures.get(key).getSourceImage();
    const scale = H / tex.height;
    const offsetX = (W - tex.width * scale) / 2;
    return this.add.image(offsetX, 0, key).setOrigin(0, 0).setScale(scale).setDepth(45);
  }

  _finalBathStep() {
    const W = this.scale.width;
    const H = this.scale.height;

    const label = this.add.text(W / 2, H / 2 - 60, 'Enjuagarse', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e9d5ff',
      backgroundColor: 'rgba(26,26,46,0.85)', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(60);

    new TimingBar({
      scene: this, x: W / 2, y: H / 2, width: 240,
      targetStart: 0.35, targetWidth: 0.18, speed: 1.1, depth: 55,
      onResult: () => {
        label.destroy();
        this._finishBath();
      },
    });
  }

  _finishBath() {
    const vero = this._vero;
    this.stats.addHunger(10);
    this.stats.addSleep(10);
    this.stats.addFun(10);
    this.inventory.addCoins(BATH_COINS);
    this._updateCoinsUI();
    this._showFloatingText(`+10 🍽️ +10 😴 +10 🎉 +${BATH_COINS} 🪙`, vero.x, vero.y - vero.displayHeight - 20, '#facc15');
    this._bathActive = false;
  }

  // ── 4.6-4.8: Inodoro — sentarse (con carita colorada al azar, puro gag),
  // tirar la cadena (barra de timing) y, a veces, destapar con la sopapa
  // (otra barra). Decisión del usuario: sin recompensa de stats, es una
  // interacción de humor nada más. ───────────────────────────────────────
  _usarInodoro() {
    if (this._toiletActive) return;
    this._toiletActive = true;

    const vero = this._vero;
    const blush = Math.random() < 0.5;
    this._showFloatingText(
      blush ? '😳 se sienta...' : 'se sienta...',
      vero.x, vero.y - vero.displayHeight - 10, '#f9a8d4'
    );

    this.time.delayedCall(700, () => this._flushStep());
  }

  _flushStep() {
    const W = this.scale.width;
    const H = this.scale.height;

    const label = this.add.text(W / 2, H / 2 - 60, 'Tirar la cadena', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e9d5ff',
      backgroundColor: 'rgba(26,26,46,0.85)', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(60);

    new TimingBar({
      scene: this, x: W / 2, y: H / 2, width: 220,
      targetStart: 0.4, targetWidth: 0.2, speed: 1.0, depth: 55,
      onResult: (result) => {
        label.destroy();
        // Fallar la barra sube bastante la chance de que se tape — le da
        // consecuencia real al resultado sin hacerlo puramente aleatorio.
        const clogChance = result === 'fail' ? 0.5 : 0.15;
        if (Math.random() < clogChance) this._unclogStep();
        else this._finishToilet();
      },
    });
  }

  _unclogStep() {
    const W = this.scale.width;
    const H = this.scale.height;

    this._showFloatingText('¡Se tapó! 🪠', W / 2, H / 2 - 100, '#ef4444');
    const label = this.add.text(W / 2, H / 2 - 60, 'Destapar con la sopapa', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e9d5ff',
      backgroundColor: 'rgba(26,26,46,0.85)', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(60);

    new TimingBar({
      scene: this, x: W / 2, y: H / 2, width: 220,
      targetStart: 0.3, targetWidth: 0.16, speed: 1.2, depth: 55,
      onResult: () => {
        label.destroy();
        this._finishToilet();
      },
    });
  }

  _finishToilet() {
    const vero = this._vero;
    this._showFloatingText('🚽 ¡Listo!', vero.x, vero.y - vero.displayHeight - 10, '#22c55e');
    this._toiletActive = false;
  }

  // Mismo patrón que BedroomScene._stub.
  _stub(msg) {
    const txt = this.add.text(this.scale.width / 2, this.scale.height / 2, msg, {
      fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#4c1d95', padding: { x: 14, y: 8 },
    }).setOrigin(0.5).setDepth(RoomScene.DEPTH.FLOATING_TEXT);

    this.tweens.add({
      targets: txt, y: txt.y - 30, alpha: 0, duration: 1200, delay: 400, ease: 'Quad.easeOut',
      onComplete: () => txt.destroy(),
    });
  }
}
