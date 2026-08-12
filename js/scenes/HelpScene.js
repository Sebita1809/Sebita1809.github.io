// Manual del juego: se abre al tocar la monedita de interrogación (patrón
// overlay + panel + botón cerrar, igual que SettingsScene, lanzada encima de
// la sala actual). La sala que la lanza se pausa (this.scene.pause()) para
// que el overlay sea realmente modal — antes no se pausaba y los clicks en
// la zona oscura de fondo seguían llegando a los objetos interactivos de la
// sala (heladera/hornito/mercadería etc.), abriéndolos "por debajo" sin que
// el jugador los viera hasta cerrar la ayuda. Se reanuda con
// this.scene.resume(callerKey) al cerrar.
//
// Ayuda contextual por sala (pedido del usuario): cada sala pasa su propia
// clave y su callerKey al lanzar la escena
// (`this.scene.launch('HelpScene', { room: 'kitchen', callerKey: this.scene.key })`)
// y acá se muestran solo las entradas de ESA sala, no el manual completo.
// Si no se pasa `room` (o no hay entradas para esa clave), cae a 'cabin'.
class HelpScene extends Phaser.Scene {
  constructor() { super('HelpScene'); }

  init(data) {
    this._room = (data && HelpScene.ENTRIES[data.room]) ? data.room : 'cabin';
    this._callerKey = data && data.callerKey;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setDepth(0);

    const panelW = W - 48;
    const panelH = 560;
    const panelX = (W - panelW) / 2;
    const panelY = (H - panelH) / 2;

    const panel = this.add.graphics().setDepth(1);
    panel.fillStyle(0xe3e0ee, 0.98);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, 0x7c3aed, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);

    this.add.text(W / 2, panelY + 26, HelpScene.TITLES[this._room], {
      fontSize: '19px', fill: '#312e81', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(2);

    const closeBtn = this.add.text(panelX + panelW - 14, panelY + 12, '✕', {
      fontSize: '20px', fill: '#7c3aed', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(2).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#4c1d95' }));
    closeBtn.on('pointerout',  () => closeBtn.setStyle({ fill: '#7c3aed' }));
    closeBtn.on('pointerdown', () => {
      this.scene.stop();
      if (this._callerKey) this.scene.resume(this._callerKey);
    });

    const sep = this.add.graphics().setDepth(2);
    sep.lineStyle(1, 0x8b5cf6, 0.4);
    sep.lineBetween(panelX + 20, panelY + 54, panelX + panelW - 20, panelY + 54);

    this._createEntries(panelX, panelY, panelW, panelH);
  }

  _createEntries(panelX, panelY, panelW, panelH) {
    const ENTRIES = HelpScene.ENTRIES[this._room];

    const textX = panelX + 24;
    const textW = panelW - 48;
    const iconColW = 30;

    // Manito = "esto se puede tocar" (pedido del usuario, asset
    // mano_guante_transparente.png, real 1413x709 ~2:1). El sprite no tiene
    // margen transparente — llena todo el lienzo — así que hay que escalarlo
    // a un tamaño legible (no un ícono chiquito, se ve borroso/manchado) y
    // dejarle aire antes del título. Solo se muestra en entradas que
    // describen una interacción real, no en las meramente informativas.
    const handH = 26;
    const handTex = this.textures.get('mano_ayuda').getSourceImage();
    const handW = handH * (handTex.width / handTex.height);
    const handGapBefore = 4;
    const handGapAfter = 6;
    const handColW = handGapBefore + handW + handGapAfter;

    const ENTRY_GAP = 14;
    let y = panelY + 70;

    ENTRIES.forEach((entry) => {
      this.add.text(textX, y, entry.icon, {
        fontSize: '18px', fontFamily: 'monospace',
      }).setOrigin(0, 0).setDepth(2);

      const bodyIndent = entry.clickable ? iconColW + handColW : iconColW;

      if (entry.clickable) {
        this.add.image(textX + iconColW + handGapBefore, y + 9, 'mano_ayuda')
          .setOrigin(0, 0.5).setDisplaySize(handW, handH).setDepth(2);
      }

      this.add.text(textX + bodyIndent, y, entry.title, {
        fontSize: '14px', fill: '#4c1d95', fontFamily: 'monospace', fontStyle: 'bold',
        wordWrap: { width: textW - bodyIndent },
      }).setOrigin(0, 0).setDepth(2);

      const bodyY = y + 20;
      const bodyText = this.add.text(textX + bodyIndent, bodyY, entry.body, {
        fontSize: '12px', fill: '#3f3d56', fontFamily: 'monospace',
        wordWrap: { width: textW - bodyIndent },
      }).setOrigin(0, 0).setDepth(2);

      y = bodyY + bodyText.height + ENTRY_GAP;
    });
  }
}

// `clickable: true` = la entrada describe algo que se toca en pantalla → se
// le antepone la manito. Las meramente informativas (anillos de stats,
// "próximamente") no la llevan.
HelpScene.TITLES = {
  cabin: '¿Qué podés hacer?',
  kitchen: 'Ayuda — Cocina',
  bedroom: 'Ayuda — Dormitorio',
  bathroom: 'Ayuda — Baño',
  activity: 'Ayuda — Sala de actividades',
  garden: 'Ayuda — Huerta',
};

HelpScene.ENTRIES = {
  cabin: [
    { icon: '🚪', title: 'Entrar a la casa', body: 'Tocá la casa para entrar directo a la última sala en la que estuviste (o al mapa, la primera vez). El ícono de la tuerca abre configuración (volumen).', clickable: true },
    { icon: '💤', title: 'Cuidá a Vero', body: 'Los anillos de abajo son sueño, hambre, diversión y glucemia. Mantenelos altos (o en rango, en el caso de la glucemia).', clickable: false },
    { icon: '🗺️', title: 'Moverte entre salas', body: 'Desde cualquier sala, el pergamino (arriba) abre el mapa para ir a otra.', clickable: true },
  ],
  kitchen: [
    { icon: '🧊', title: 'Heladera y Alacena', body: 'Tocalas para ver qué productos tenés guardados.', clickable: true },
    { icon: '🍳', title: 'Recetario', body: 'Tocá el hornito para ver las recetas. Cociná la que tenga todos los ingredientes en verde: se juega una barra de tiempo, si acertás se prepara el plato.', clickable: true },
    { icon: '🍎', title: 'Comer rápido', body: 'El panel fijo de abajo cicla productos con las flechas ◀ ▶; tocá "Comer" para comer uno ya.', clickable: true },
  ],
  bedroom: [
    { icon: '🛏️', title: 'Cama', body: 'Tocala para elegir dormir sola o con Seba. Sube el sueño (y la diversión, si es con Seba).', clickable: true },
    { icon: '🚪', title: 'Placard', body: 'Tocalo para elegir la prenda de Vero: ropa de todos los días, jardinería, pijama o vestido.', clickable: true },
  ],
  bathroom: [
    { icon: '🛁', title: 'Bañera', body: 'Tocala para bañarte: cepillar, shampoo y enjuagar. Sube hambre, sueño y diversión, y te da algunas monedas.', clickable: true },
    { icon: '🚽', title: 'Inodoro', body: 'Tocalo para usarlo — es solo humor, no cambia ninguna stat.', clickable: true },
  ],
  activity: [
    { icon: '🎲', title: 'Mesa de juego', body: 'Tocala para abrir el menú de minijuegos: Sudoku y Crucigrama. Ganar te da diversión y monedas.', clickable: true },
  ],
  garden: [
    { icon: '🌱', title: 'Cantero vacío', body: 'Tocalo para elegir qué semilla plantar. Cada especie tarda un tiempo distinto en crecer.', clickable: true },
    { icon: '💧', title: 'Cantero creciendo', body: 'Tocalo para regarlo (es solo decorativo, no acelera el crecimiento).', clickable: true },
    { icon: '🎉', title: 'Cantero listo', body: 'Cuando la planta se ve crecida del todo, tocala para cosecharla — va al inventario de la Cocina y te da monedas.', clickable: true },
  ],
};
