// Detector de gesto de swipe reutilizable (design D3, tasks.md 1.3).
//
// Lo usa el Baño: frotar shampoo (repetir swipes). Encapsula la
// matemática de Phaser (pointerdown → pointermove/pointerup, medir dirección
// y distancia) para que cada sala no la repita.
//
// Solo detecta y reporta — no sabe nada de "repeticiones" ni de "ciclar
// opciones": la escena que la usa decide qué hacer con cada evento de swipe
// (sumar un contador de frotado, mover un índice de array, etc.).
//
// Uso:
//   const swipe = new SwipeGesture({
//     scene: this,
//     zone: { x: 195, y: 400, width: 120, height: 120 }, // o un GameObject interactivo ya existente
//     minDistance: 30,
//     onSwipe: (direction, distance) => { ... }, // direction: 'left'|'right'|'up'|'down'
//   });
//   // ...
//   swipe.destroy();
class SwipeGesture {
  // depth: solo aplica cuando `zone` es una caja simple (se crea una Zone
  // nueva) — pasarlo si en la escena hay OTROS objetos interactivos que
  // puedan superponerse con esta zona (ej. los hover-objects de la sala,
  // que se quedan activos durante un minijuego encima). Sin esto, Phaser
  // (topOnly: true por default) le manda el evento al objeto de mayor
  // depth en esa posición, no a la zona nueva — bug real encontrado en el
  // shampoo del Baño: la zona (depth 0) quedaba tapada por la bañera
  // (depth 5) en la mitad de su área, y los swipes que arrancaban ahí se
  // perdían en silencio (el 'pointerdown' nunca llegaba a la zona).
  constructor({ scene, zone, minDistance = 30, depth = 0, onSwipe }) {
    this.scene = scene;
    this.minDistance = minDistance;
    this.onSwipe = onSwipe || (() => {});

    this._startX = null;
    this._startY = null;
    this._ownsZone = false;

    this._target = this._resolveZone(zone, depth);
    this._bindEvents();
  }

  // Acepta un GameObject de Phaser ya interactivo (o interactivable), o una
  // caja simple { x, y, width, height, originX, originY } sobre la que crea
  // una zona nueva.
  _resolveZone(zone, depth) {
    if (zone && typeof zone.setInteractive === 'function') {
      if (!zone.input) zone.setInteractive({ useHandCursor: true });
      return zone;
    }
    const z = this.scene.add
      .zone(zone.x, zone.y, zone.width, zone.height)
      .setOrigin(zone.originX ?? 0.5, zone.originY ?? 0.5)
      .setDepth(depth)
      .setInteractive();
    this._ownsZone = true;
    return z;
  }

  _bindEvents() {
    this._onDown = (pointer) => {
      this._startX = pointer.x;
      this._startY = pointer.y;
    };
    this._onUp = (pointer) => {
      if (this._startX === null) return;
      const dx = pointer.x - this._startX;
      const dy = pointer.y - this._startY;
      this._startX = null;
      this._startY = null;

      const absX = Math.abs(dx);
      const absY = Math.abs(dy);
      const distance = Math.max(absX, absY);
      if (distance < this.minDistance) return;

      const direction = absX > absY
        ? (dx > 0 ? 'right' : 'left')
        : (dy > 0 ? 'down' : 'up');

      this.onSwipe(direction, distance);
    };

    this._target.on('pointerdown', this._onDown);
    // Se escucha pointerup a nivel de escena (no solo del target) porque el
    // dedo/mouse puede salir de la zona antes de soltar y el swipe igual debe contar.
    this.scene.input.on('pointerup', this._onUp);
  }

  destroy() {
    if (this._target) this._target.off('pointerdown', this._onDown);
    this.scene.input.off('pointerup', this._onUp);
    if (this._ownsZone && this._target) this._target.destroy();
  }
}
