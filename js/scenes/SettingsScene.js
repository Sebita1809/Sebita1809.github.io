class SettingsScene extends Phaser.Scene {
  constructor() { super('SettingsScene'); }

  init(data) {
    this._callerKey = data && data.callerKey;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.sound.volume = this.registry.get('volume');

    this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setDepth(0);

    const panelW = W - 60;
    // Antes 380 (con la sección de Idioma) — sin selector de idioma
    // (español único, ver _createVolumeSection) el panel entra más chico.
    const panelH = 210;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    this._panelX = panelX;
    this._panelW = panelW;

    const panel = this.add.graphics().setDepth(1);
    panel.fillStyle(0xe3e0ee, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, 0x7c3aed, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    this.add.text(W / 2, panelY + 28, 'Configuración', {
      fontSize: '20px', fill: '#312e81', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(2);

    const closeBtn = this.add.text(panelX + panelW - 14, panelY + 14, '✕', {
      fontSize: '20px', fill: '#7c3aed', fontFamily: 'monospace'
    }).setOrigin(1, 0).setDepth(2).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#4c1d95' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ fill: '#7c3aed' }));
    closeBtn.on('pointerdown', () => {
      this.scene.stop();
      if (this._callerKey) this.scene.resume(this._callerKey);
    });

    this._drawSeparator(panelY + 54);
    this._createVolumeSection(W, panelY);
  }

  _drawSeparator(y) {
    const sep = this.add.graphics().setDepth(2);
    sep.lineStyle(1, 0x8b5cf6, 0.4);
    sep.lineBetween(this._panelX + 20, y, this._panelX + this._panelW - 20, y);
  }

  // ── Volumen ─────────────────────────────────────────────────────────────
  // El selector de Idioma (español/inglés) se sacó — no había ningún
  // sistema de traducción atrás (game.registry 'language' se guardaba pero
  // ningún texto del juego lo leía), así que elegir inglés no hacía nada.
  // El usuario prefirió sacarlo por ahora antes que fingir que funciona;
  // language sigue en el save (SaveManager) para cuando se traduzca de
  // verdad, solo no hay UI para cambiarlo mientras tanto.
  _createVolumeSection(W, panelY) {
    this.add.text(W / 2, panelY + 90, 'Volumen', {
      fontSize: '15px', fill: '#6d28d9', fontFamily: 'monospace'
    }).setOrigin(0.5).setDepth(2);

    const trackW = 220;
    const trackH = trackW * (144 / 1270);
    const trackX = W / 2 - trackW / 2;
    const trackY = panelY + 140;

    this._volTrackX = trackX;
    this._volTrackW = trackW;

    // Pista vacía (fondo)
    this.add.image(trackX, trackY, 'ruta_vacia')
      .setOrigin(0, 0.5)
      .setDisplaySize(trackW, trackH)
      .setDepth(2);

    // Relleno: se va recortando según el volumen actual
    this._volFill = this.add.image(trackX, trackY, 'barra_volumen_llena')
      .setOrigin(0, 0.5)
      .setDisplaySize(trackW, trackH)
      .setDepth(3);

    const fillTex = this.textures.get('barra_volumen_llena').getSourceImage();
    this._volFillTexW = fillTex.width;
    this._volFillTexH = fillTex.height;

    this._volText = this.add.text(trackX + trackW + 14, trackY, '', {
      fontSize: '13px', fill: '#4c1d95', fontFamily: 'monospace'
    }).setOrigin(0, 0.5).setDepth(3);

    // Botón deslizante (dial)
    const knobSize = 34;
    this._volKnob = this.add.image(trackX, trackY, 'boton_dial')
      .setDisplaySize(knobSize, knobSize)
      .setDepth(4)
      .setInteractive({ useHandCursor: true, draggable: true });

    this.input.setDraggable(this._volKnob);

    this._volKnob.on('drag', (pointer, dragX) => {
      this._volKnob.x = Phaser.Math.Clamp(dragX, trackX, trackX + trackW);
      const ratio = (this._volKnob.x - this._volTrackX) / this._volTrackW;
      this._applyVolumeRatio(ratio);
    });

    this._setVolumeRatio(this.registry.get('volume'));
  }

  _setVolumeRatio(ratio) {
    this._volKnob.x = this._volTrackX + this._volTrackW * ratio;
    this._applyVolumeRatio(ratio);
  }

  _applyVolumeRatio(ratio) {
    ratio = Phaser.Math.Clamp(ratio, 0, 1);
    this._volFill.setCrop(0, 0, this._volFillTexW * ratio, this._volFillTexH);
    this._volText.setText(Math.round(ratio * 100) + '%');
    this.registry.set('volume', ratio);
    this.sound.volume = ratio;
    // Music (js/systems/MusicSystem.js) no usa this.sound de Phaser — tiene
    // su propio GainNode maestro, hay que sincronizarlo acá aparte.
    Music.setVolume(ratio);
  }
}
