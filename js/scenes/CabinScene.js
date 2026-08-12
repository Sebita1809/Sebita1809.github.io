// Caja de la casa como % del fondo preview_movil_final_completo.png
// (1280x698) — medida a mano mirando la imagen (paredes+techo+puerta).
// Reemplaza los carteles "cartel_casa"/"cartel_huerta" (pedido del
// usuario: sin carteles, clickear la casa entra directo a la última sala
// visitada — ver _onHouseClick).
const HOUSE_BOX = { left: 0.512, top: 0.551, width: 0.199, height: 0.294 };

class CabinScene extends Phaser.Scene {
  constructor() { super('CabinScene'); }

  create() {
    this.stats = this.registry.get('stats');
    const W = this.scale.width;
    const H = this.scale.height;

    this._drawBackground(W, H);
    this._createHouseHotspot();
    this._createStatsUI(W, H);
    this._createGearButton(W);
    this._createHelpButton();
    this._createTutorialButton();
    this._createDayNightOverlay(W, H);

    this._dayTimer = this.time.addEvent({
      delay: 60000,
      callback: this._updateDayNight,
      callbackScope: this,
      loop: true,
    });

    // Primera vez que se abre el juego (pedido del usuario): el tutorial
    // se muestra solo, sin que haga falta tocar el botón. Se marca
    // "visto" y se guarda YA (no esperar los 10s del autoguardado
    // periódico) para que no vuelva a aparecer solo si cierra el juego
    // enseguida.
    if (!this.registry.get('tutorialSeen')) {
      this.registry.set('tutorialSeen', true);
      _autosave();
      this._openTutorial();
    }
  }

  update(time, delta) {
    this.stats.update(delta);
    this._updateStatsUI();
    this._checkGlucemiaShake();
  }

  // ── Fondo ─────────────────────────────────────────────────────────────────

  _drawBackground(W, H) {
    const bg = this.add.image(0, 0, 'bg_cabana')
      .setDepth(0)
      .setOrigin(0, 0);

    const scale = H / bg.height;
    bg.setScale(scale);
    bg.x = W / 2 - bg.width * scale * 0.62;

    // Guardado para mapear HOUSE_BOX (fracción del PNG original) a
    // coordenadas de escena, mismo mecanismo que RoomScene._toScene.
    this._bgScale = scale;
    this._bgOffsetX = bg.x;
    this._bgW = bg.width * scale;
    this._bgH = bg.height * scale;
  }

  _toScene(box) {
    return {
      x: this._bgOffsetX + box.left * this._bgW,
      y: box.top * this._bgH,
      w: box.width * this._bgW,
      h: box.height * this._bgH,
    };
  }

  // ── Entrar a la casa ──────────────────────────────────────────────────────
  // Sin carteles (pedido del usuario) — clickear la casa entra directo a la
  // última sala visitada (registry 'lastRoom', ver RoomScene._drawBackground
  // donde se guarda). Sin sala previa (primera vez que juega, o guardado
  // viejo sin este dato) cae al mapa, mismo destino que el viejo
  // "cartel_casa" — así siempre hay a dónde ir.
  _createHouseHotspot() {
    const s = this._toScene(HOUSE_BOX);
    const zone = this.add.zone(s.x, s.y, s.w, s.h)
      .setOrigin(0, 0)
      .setDepth(10)
      .setInteractive({ useHandCursor: true });
    zone.on('pointerdown', () => this._onHouseClick());
  }

  _onHouseClick() {
    const lastRoom = this.registry.get('lastRoom');
    if (lastRoom) {
      this._goToScene(lastRoom);
    } else {
      this.scene.pause();
      this.scene.launch('MapScene', { callerKey: this.scene.key });
    }
  }

  _goToScene(sceneKey) {
    this.cameras.main.fade(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.stop();
      this.scene.start(sceneKey);
    });
  }

  // ── Overlay día/noche ─────────────────────────────────────────────────────

  _createDayNightOverlay(W, H) {
    this._overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0)
      .setOrigin(0)
      .setDepth(5);
    this._updateDayNight();
  }

  _updateDayNight() {
    const h = new Date().getHours();
    if (h >= 6 && h < 18) {
      this._overlay.setFillStyle(0xfff5c0, 0.06);
    } else if (h >= 18 && h < 22) {
      this._overlay.setFillStyle(0xff9944, 0.18);
    } else {
      this._overlay.setFillStyle(0x0a0a3a, 0.45);
    }
  }

  // ── Engranaje (configuración) ──────────────────────────────────────────────

  _createGearButton(W) {
    // Escala uniforme por altura para mantener la proporción del engranaje
    const BASE_SCALE = 56 / 1536;

    const gear = this.add.image(W - 46, 38, 'engranaje')
      .setScale(BASE_SCALE)
      .setDepth(30)
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

  // ── Monedita de ayuda (manual) ───────────────────────────────────────────

  _createHelpButton() {
    const TARGET_SIZE = 52;
    const tex = this.textures.get('moneda_ayuda').getSourceImage();
    const scale = TARGET_SIZE / tex.height;

    const help = this.add.image(46, 38, 'moneda_ayuda')
      .setScale(scale)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });

    help.on('pointerover', () => help.setScale(scale * 1.12));
    help.on('pointerout',  () => help.setScale(scale));
    help.on('pointerdown', () => {
      this.scene.pause();
      this.scene.launch('HelpScene', { room: 'cabin', callerKey: this.scene.key });
      this.scene.bringToTop('HelpScene');
    });
  }

  // ── Tutorial (pedido del usuario: botón aparte del "?" de ayuda —  ese
  // sigue siendo la ayuda contextual de esta sala nomás; esto abre el
  // repaso completo del juego, TutorialScene, sala por sala) ─────────────
  // Debajo del ícono de ayuda, mismo tamaño, sin textura propia (círculo +
  // emoji en vez de un sprite recortado — no hace falta arte nuevo para
  // esto).
  _createTutorialButton() {
    const x = 46, y = 106, r = 26;
    const bg = this.add.circle(x, y, r, 0x7c3aed, 1)
      .setStrokeStyle(2, 0xe9d5ff, 1)
      .setDepth(30)
      .setInteractive({ useHandCursor: true });
    this.add.text(x, y, '🎓', { fontSize: '22px' }).setOrigin(0.5).setDepth(31);

    bg.on('pointerover', () => bg.setScale(1.12));
    bg.on('pointerout',  () => bg.setScale(1));
    bg.on('pointerdown', () => this._openTutorial());
  }

  _openTutorial() {
    this.scene.pause();
    this.scene.launch('TutorialScene', { callerKey: this.scene.key });
    this.scene.bringToTop('TutorialScene');
  }

  // ── Stats UI ──────────────────────────────────────────────────────────────

  _createStatsUI(W, H) {
    const ICON   = 60;
    const RING_R = 34;
    const RING_W = 5;
    const colW   = W / 4;
    const iconY  = H - 46;

    this._statDefs = [
      { key: 'sleep',    texture: 'stat_sueno',     color: 0x5b9bd5 },
      { key: 'hunger',   texture: 'stat_hambre',    color: 0xf5a623 },
      { key: 'fun',      texture: 'stat_diversion', color: 0xa855f7 },
      { key: 'glucemia', texture: 'stat_glucemia',  isGlucemia: true },
    ].map((d, i) => ({ ...d, x: colW * i + colW / 2, y: iconY, ringR: RING_R, ringW: RING_W }));

    // Íconos
    this._statDefs.forEach(d => {
      this.add.image(d.x, d.y, d.texture)
        .setDisplaySize(ICON, ICON)
        .setDepth(22);
    });

    // Graphics para los rings (se redibuja cada frame)
    this._statsGraphics = this.add.graphics().setDepth(21);
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

      // Ring de fondo (gris oscuro)
      g.lineStyle(d.ringW, 0x1a1a1a, 0.65);
      g.beginPath();
      g.arc(d.x, d.y, d.ringR, 0, Math.PI * 2);
      g.strokePath();

      // Ring de relleno (horario, desde arriba)
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
}
