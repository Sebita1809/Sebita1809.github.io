// Barra de timing reutilizable (design D2, tasks.md 1.2).
//
// La usan Cocina (cocinar, una única barra por receta — D8) y Baño (cepillar,
// resto del baño). Un cursor se desplaza ida y vuelta sobre una barra; el
// jugador toca la barra (o la zona de golpe) para intentar detenerlo dentro
// de la zona objetivo. Emite el resultado por `onResult('success' | 'fail' | 'perfect')`.
//
// No conoce nada de la sala que la usa: solo dibuja el overlay, mide el toque
// y llama al callback. La escena que la invoca decide qué hacer con el
// resultado (consumir inventario, subir una stat, etc.) y es responsable de
// llamar a `destroy()` cuando termina (el propio TimingBar se autodestruye
// tras emitir el resultado, pero exponer destroy() sirve para cancelarla
// antes, p.ej. si la escena se cierra a mitad de la barra).
//
// Uso:
//   new TimingBar({
//     scene: this, x: 195, y: 500, width: 240,
//     targetStart: 0.4, targetWidth: 0.2, // fracciones 0..1 del ancho de la barra
//     speed: 0.9,                          // fracciones de barra recorridas por segundo
//     onResult: (result) => { ... },
//   });
//
// useHitZone: false (pedido del usuario en Cocina) desactiva el toque sobre
// la barra misma — quien la crea debe llamar a `bar.tap()` desde su propio
// control (ej. un botón "Cocinar").
// cursorTexture: clave de una textura para reemplazar el cursor rectangular
// blanco por defecto (ej. un gorrito de cocinero) — ver KitchenScene._cocinar.
class TimingBar {
  constructor({
    scene, x, y,
    width = 240,
    height = 24,
    targetStart = 0.4,
    targetWidth = 0.2,
    perfectWidth = null, // fracción (del ancho de la barra) de una sub-zona "perfect" opcional, centrada en la zona objetivo
    speed = 0.9,
    depth = 50,
    useHitZone = true, // false = no se puede tocar la barra; quien la crea debe llamar a tap() (ej. desde un botón "Cocinar")
    cursorTexture = null, // clave de textura para el cursor en vez del rectángulo blanco (ej. gorrito de cocinero); null = rectángulo (default)
    cursorWidth = null, // fuerza el ancho del cursor en vez de escalarlo proporcionalmente por altura (ej. cepillo del Baño, muy angosto/alto — escalado por altura quedaba de ~12px, ilegible)
    onResult,
  }) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.targetStart = targetStart;
    this.targetWidth = targetWidth;
    this.perfectWidth = perfectWidth;
    this.speed = speed;
    this.depth = depth;
    this.useHitZone = useHitZone;
    this.cursorTexture = cursorTexture;
    this.cursorWidth = cursorWidth;
    this.onResult = onResult || (() => {});

    this._direction = 1;
    this._cursorPos = 0; // 0..1 a lo largo de la barra
    this._active = true;

    this._build();
    this._updateHandler = (time, delta) => this._update(delta);
    this.scene.events.on('update', this._updateHandler);
  }

  _build() {
    const { scene, width, height, depth } = this;

    this.container = scene.add.container(this.x, this.y).setDepth(depth);

    const track = scene.add.graphics();
    track.fillStyle(0x1e1b4b, 0.9);
    track.fillRoundedRect(-width / 2, -height / 2, width, height, height / 2);
    track.lineStyle(2, 0x7c3aed, 1);
    track.strokeRoundedRect(-width / 2, -height / 2, width, height, height / 2);

    this._targetX = -width / 2 + this.targetStart * width;
    this._targetW = this.targetWidth * width;

    const targetRect = scene.add.graphics();
    targetRect.fillStyle(0x22c55e, 0.6);
    targetRect.fillRoundedRect(this._targetX, -height / 2, this._targetW, height, 4);

    this.container.add([track, targetRect]);

    if (this.perfectWidth) {
      this._perfectW = this.perfectWidth * width;
      this._perfectX = this._targetX + (this._targetW - this._perfectW) / 2;
      const perfectRect = scene.add.graphics();
      perfectRect.fillStyle(0xfacc15, 0.85);
      perfectRect.fillRoundedRect(this._perfectX, -height / 2, this._perfectW, height, 3);
      this.container.add(perfectRect);
    }

    if (this.cursorTexture) {
      const cursorH = height + 16;
      const tex = scene.textures.get(this.cursorTexture).getSourceImage();
      const cursorScale = cursorH / tex.height;
      const cursorW = this.cursorWidth ?? (tex.width * cursorScale);
      this.cursor = scene.add.image(-width / 2, 0, this.cursorTexture)
        .setDisplaySize(cursorW, cursorH);
    } else {
      this.cursor = scene.add.rectangle(-width / 2, 0, 4, height + 8, 0xffffff).setOrigin(0.5);
    }
    this.container.add(this.cursor);

    if (this.useHitZone) {
      this.hitZone = scene.add.zone(this.x, this.y, width, height + 20)
        .setOrigin(0.5)
        .setDepth(depth + 1)
        .setInteractive({ useHandCursor: true });
      this.hitZone.on('pointerdown', () => this._onTap());
    }
  }

  // Para usar con useHitZone: false — quien crea la barra dispara el toque
  // desde su propio control (ej. un botón "Cocinar").
  tap() {
    this._onTap();
  }

  _update(delta) {
    if (!this._active) return;
    const dt = delta / 1000;
    this._cursorPos += this._direction * this.speed * dt;
    if (this._cursorPos >= 1) { this._cursorPos = 1; this._direction = -1; }
    if (this._cursorPos <= 0) { this._cursorPos = 0; this._direction = 1; }
    this.cursor.x = -this.width / 2 + this._cursorPos * this.width;
  }

  _onTap() {
    if (!this._active) return;
    this._active = false;

    const cursorLocalX = -this.width / 2 + this._cursorPos * this.width;
    let result = 'fail';
    if (this._perfectW && cursorLocalX >= this._perfectX && cursorLocalX <= this._perfectX + this._perfectW) {
      result = 'perfect';
    } else if (cursorLocalX >= this._targetX && cursorLocalX <= this._targetX + this._targetW) {
      result = 'success';
    }

    this.onResult(result);
    this.destroy();
  }

  destroy() {
    this._active = false;
    this.scene.events.off('update', this._updateHandler);
    if (this.hitZone) this.hitZone.destroy();
    if (this.container) this.container.destroy();
  }
}
