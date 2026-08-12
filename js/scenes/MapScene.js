// Mapa de la casa (reemplaza el "← Volver" de cada sala + la lista de texto
// que tenía esta escena antes): se muestra mapa_sin_fondo.png (fondo pintado
// con las 5 salas ya dibujadas y rotuladas) y encima, en la posición exacta
// de cada sala, un ícono transparente de items_sin_fondo.png (recortado en
// mapa_cama/mapa_horno/mapa_inodoro/mapa_planta/mapa_diana) que captura el
// click — mismo patrón que Cocina (fondo + objetos recortados encima), salvo
// que acá el fondo y los objetos son dos artes separados en vez de un mismo
// recorte, así que la alineación es por medición manual (ver MAP_BOXES) y no
// exacta por construcción.
//
// Cajas de cada sala como % de mapa_sin_fondo.png (2816x1536).
// dormitorio/bano/huerta: medidas a mano con una grilla de referencia.
// cocina/actividades: la medición a mano quedó corrida (reportado por el
// usuario) — recalculadas con un ancla de color (llama del horno / anillo
// azul del target, ambos muy distintivos contra el pergamino tostado):
// se ubica el mismo color dentro del ícono en items_sin_fondo.png, se
// calcula la escala items→mapa comparando esa misma marca en ambas
// imágenes, y se proyecta el bounding box completo del ícono con esa
// escala. Ver [[architecture/mapa-navegacion]] en engram.
const MAP_BOXES = {
  dormitorio:  { icon: 'mapa_cama',    room: 'BedroomScene',  left: 700  / 2816, top: 290  / 1536, width: 400 / 2816, height: 360 / 1536 },
  cocina:      { icon: 'mapa_horno',   room: 'KitchenScene',  left: 1423 / 2816, top: 197  / 1536, width: 292 / 2816, height: 385 / 1536 },
  bano:        { icon: 'mapa_inodoro', room: 'BathroomScene', left: 1930 / 2816, top: 460  / 1536, width: 265 / 2816, height: 275 / 1536 },
  huerta:      { icon: 'mapa_planta',  room: 'GardenScene',   left: 845  / 2816, top: 870  / 1536, width: 390 / 2816, height: 330 / 1536 },
  actividades: { icon: 'mapa_diana',   room: 'ActivityScene', left: 1774 / 2816, top: 924  / 1536, width: 298 / 2816, height: 306 / 1536 },
};

class MapScene extends Phaser.Scene {
  constructor() { super('MapScene'); }

  // callerKey: sala que abrió el mapa (pausada mientras el mapa está
  // abierto) — quien la abre debe hacer this.scene.pause() antes de
  // lanzar esta escena (mismo patrón que HelpScene/SettingsScene, ver
  // [[architecture/modal-pause-pattern]]). Fallback a 'CabinScene' por si
  // algo la lanza sin pasar data (no debería pasar).
  init(data) {
    this._callerKey = (data && data.callerKey) || 'CabinScene';
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    // Opaco (no 0.65-0.75 como Help/Settings): el panel de comer rápido de
    // Cocina es oscuro (0x1e1b4b) y con un overlay semitransparente se seguía
    // viendo "a través" por debajo del mapa — reportado por el usuario como
    // que el mapa quedaba debajo del panel. Con el fondo del juego
    // (0x1a1a2e) a alpha 1 no hay contenido de la sala de atrás que se
    // pueda filtrar visualmente.
    this.add.rectangle(0, 0, W, H, 0x1a1a2e, 1).setOrigin(0);

    this.add.text(W / 2, 44, '¿A dónde vas?', {
      fontSize: '20px', fill: '#e9d5ff', fontFamily: 'monospace', fontStyle: 'bold'
    }).setOrigin(0.5);

    this._drawMap(W, H);

    Object.values(MAP_BOXES).forEach(box => this._makeRoomHotspot(box));

    this.add.text(W / 2, this._mapY + this._mapH + 34, '🚌 Ir a la ciudad (próximamente)', {
      fontSize: '13px', fill: '#9ca3af', fontFamily: 'monospace'
    }).setOrigin(0.5);

    const closeBtn = this.add.text(W - 18, 44, '✕', {
      fontSize: '22px', fill: '#e9d5ff', fontFamily: 'monospace'
    }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });

    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ fill: '#e9d5ff' }));
    closeBtn.on('pointerdown', () => this._close());
  }

  // Escala mapa_fondo por ancho de pantalla (la imagen es muy panorámica —
  // 2816x1536 — así que ajustar por alto la desbordaría de lado a lado).
  // Guarda _mapX/_mapY/_mapScale/_mapW/_mapH para mapear las cajas relativas
  // con _toScene(), mismo mecanismo que RoomScene._drawBackground/_toScene.
  _drawMap(W, H) {
    const tex = this.textures.get('mapa_fondo').getSourceImage();
    // Pedido del usuario: más grande (menos margen lateral) y más abajo,
    // separado del engranaje/ayuda de la sala de atrás (visibles a través
    // del overlay, arriba de todo) en vez de centrado más cerca del título.
    const mapW = W - 8;
    const scale = mapW / tex.width;
    const mapH = tex.height * scale;
    const mapX = (W - mapW) / 2;
    const mapY = (H - mapH) / 2 + 70;

    this._mapX = mapX;
    this._mapY = mapY;
    this._mapScale = scale;
    this._mapW = mapW;
    this._mapH = mapH;

    this.add.image(mapX, mapY, 'mapa_fondo').setOrigin(0, 0).setScale(scale);
  }

  _toScene(box) {
    return {
      x: this._mapX + box.left * this._mapW,
      y: this._mapY + box.top * this._mapH,
      w: box.width * this._mapW,
      h: box.height * this._mapH,
    };
  }

  _makeRoomHotspot(box) {
    const s = this._toScene(box);
    const cx = s.x + s.w / 2;
    const cy = s.y + s.h / 2;

    const tex = this.textures.get(box.icon).getSourceImage();
    // "contain": encaja el ícono dentro de la caja sin deformarlo (el arte
    // de items_sin_fondo.png no tiene exactamente la misma proporción que
    // la caja medida a mano sobre el mapa).
    const iconScale = Math.min(s.w / tex.width, s.h / tex.height);

    const icon = this.add.image(cx, cy, box.icon)
      .setDisplaySize(tex.width * iconScale, tex.height * iconScale)
      .setInteractive({ useHandCursor: true });

    const baseScaleX = icon.scaleX;
    const baseScaleY = icon.scaleY;
    icon.on('pointerover', () => icon.setScale(baseScaleX * 1.08, baseScaleY * 1.08));
    icon.on('pointerout',  () => icon.setScale(baseScaleX, baseScaleY));
    icon.on('pointerdown', () => this._goToRoom(box.room));

    return icon;
  }

  _goToRoom(sceneKey) {
    // 'lastRoom' (registry, persistido por el autoguardado global de
    // game.js): CabinScene lo usa para entrar directo a esta sala la
    // próxima vez, sin pasar por el mapa (pedido del usuario, ver
    // CabinScene._onHouseClick). Único punto de entrada a cualquier sala
    // real (KitchenScene/BedroomScene/BathroomScene/GardenScene/
    // ActivityScene siempre navegan para acá), así que alcanza con
    // guardarlo acá.
    this.registry.set('lastRoom', sceneKey);
    this.cameras.main.fade(200, 0, 0, 0);
    this.time.delayedCall(200, () => {
      this.scene.stop();
      this.scene.stop(this._callerKey);
      this.scene.start(sceneKey);
    });
  }

  _close() {
    this.scene.stop();
    this.scene.resume(this._callerKey);
  }
}
