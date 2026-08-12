// Tutorial general del juego (pedido del usuario: un botón que muestre una
// modal explicando el juego en general y qué se puede hacer en cada sala,
// y que se vea sola la primera vez que se abre el juego). Reusa el
// contenido de HelpScene.ENTRIES/TITLES (ya escrito y mantenido ahí, sala
// por sala) en vez de duplicarlo — HelpScene.js tiene que estar cargado
// antes que este archivo en index.html.
//
// A diferencia de HelpScene (una sala por vez, la que la abrió), esto junta
// una portada general + las 6 salas en un solo picker paginado (◀ ▶ +
// "página X/N", mismo lenguaje que el panel de comer rápido de Cocina y
// las flechas de palabra del Crucigrama) — mostrar las 7 páginas en una
// sola pantalla sin scroll no entraba.
class TutorialScene extends Phaser.Scene {
  constructor() { super('TutorialScene'); }

  init(data) {
    this._callerKey = data && data.callerKey;
    this._page = 0;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setDepth(0);

    this._panelW = W - 48;
    this._panelH = 680;
    this._panelX = (W - this._panelW) / 2;
    this._panelY = (H - this._panelH) / 2;

    const panel = this.add.graphics().setDepth(1);
    panel.fillStyle(0xe3e0ee, 0.98);
    panel.fillRoundedRect(this._panelX, this._panelY, this._panelW, this._panelH, 16);
    panel.lineStyle(2, 0x7c3aed, 1);
    panel.strokeRoundedRect(this._panelX, this._panelY, this._panelW, this._panelH, 16);

    this._titleText = this.add.text(W / 2, this._panelY + 26, '', {
      fontSize: '17px', fill: '#312e81', fontFamily: 'monospace', fontStyle: 'bold',
      wordWrap: { width: this._panelW - 100 },
    }).setOrigin(0.5).setDepth(2);

    const closeBtn = this.add.text(this._panelX + this._panelW - 14, this._panelY + 12, '✕', {
      fontSize: '20px', fill: '#7c3aed', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(2).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#4c1d95' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ fill: '#7c3aed' }));
    closeBtn.on('pointerdown', () => this._close());

    const sep = this.add.graphics().setDepth(2);
    sep.lineStyle(1, 0x8b5cf6, 0.4);
    sep.lineBetween(this._panelX + 20, this._panelY + 54, this._panelX + this._panelW - 20, this._panelY + 54);

    // ── Navegación (footer) ──────────────────────────────────────────────
    const navY = this._panelY + this._panelH - 28;
    const navSep = this.add.graphics().setDepth(2);
    navSep.lineStyle(1, 0x8b5cf6, 0.4);
    navSep.lineBetween(this._panelX + 20, navY - 24, this._panelX + this._panelW - 20, navY - 24);

    const prevBtn = this.add.text(this._panelX + 24, navY, '◀', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#7c3aed',
      backgroundColor: '#ffffff', padding: { x: 10, y: 4 },
    }).setOrigin(0, 0.5).setDepth(2).setInteractive({ useHandCursor: true });
    prevBtn.on('pointerdown', () => this._goPage(-1));

    const nextBtn = this.add.text(this._panelX + this._panelW - 24, navY, '▶', {
      fontSize: '18px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#7c3aed',
      backgroundColor: '#ffffff', padding: { x: 10, y: 4 },
    }).setOrigin(1, 0.5).setDepth(2).setInteractive({ useHandCursor: true });
    nextBtn.on('pointerdown', () => this._goPage(1));

    this._pageText = this.add.text(W / 2, navY, '', {
      fontSize: '12px', fontFamily: 'monospace', fill: '#6d28d9',
    }).setOrigin(0.5).setDepth(2);

    this._contentObjs = [];
    this._renderPage();
  }

  _goPage(delta) {
    this._page = Phaser.Math.Wrap(this._page + delta, 0, TutorialScene.PAGES.length);
    this._renderPage();
  }

  _renderPage() {
    this._contentObjs.forEach(o => o.destroy());
    this._contentObjs = [];

    const page = TutorialScene.PAGES[this._page];
    this._titleText.setText(page.title);
    this._pageText.setText(`${this._page + 1} / ${TutorialScene.PAGES.length}`);

    const textX = this._panelX + 24;
    const textW = this._panelW - 48;
    const contentTop = this._panelY + 72;

    if (page.intro) {
      const t = this.add.text(textX, contentTop, page.body, {
        fontSize: '13px', fill: '#3f3d56', fontFamily: 'monospace', lineSpacing: 7,
        wordWrap: { width: textW },
      }).setOrigin(0, 0).setDepth(2);
      this._contentObjs.push(t);
      return;
    }

    // Mismo criterio visual que HelpScene._createEntries (manito = "esto se
    // puede tocar").
    const iconColW = 30;
    const handH = 26;
    const handTex = this.textures.get('mano_ayuda').getSourceImage();
    const handW = handH * (handTex.width / handTex.height);
    const handGapBefore = 4, handGapAfter = 6;
    const handColW = handGapBefore + handW + handGapAfter;
    const ENTRY_GAP = 16;
    let y = contentTop;

    HelpScene.ENTRIES[page.room].forEach(entry => {
      const icon = this.add.text(textX, y, entry.icon, { fontSize: '18px', fontFamily: 'monospace' }).setOrigin(0, 0).setDepth(2);
      this._contentObjs.push(icon);

      const bodyIndent = entry.clickable ? iconColW + handColW : iconColW;
      if (entry.clickable) {
        const hand = this.add.image(textX + iconColW + handGapBefore, y + 9, 'mano_ayuda')
          .setOrigin(0, 0.5).setDisplaySize(handW, handH).setDepth(2);
        this._contentObjs.push(hand);
      }

      const title = this.add.text(textX + bodyIndent, y, entry.title, {
        fontSize: '14px', fill: '#4c1d91', fontFamily: 'monospace', fontStyle: 'bold',
        wordWrap: { width: textW - bodyIndent },
      }).setOrigin(0, 0).setDepth(2);
      this._contentObjs.push(title);

      const bodyY = y + 20;
      const body = this.add.text(textX + bodyIndent, bodyY, entry.body, {
        fontSize: '12px', fill: '#3f3d56', fontFamily: 'monospace',
        wordWrap: { width: textW - bodyIndent },
      }).setOrigin(0, 0).setDepth(2);
      this._contentObjs.push(body);

      y = bodyY + body.height + ENTRY_GAP;
    });
  }

  _close() {
    this.scene.stop();
    if (this._callerKey) this.scene.resume(this._callerKey);
  }
}

TutorialScene.PAGES = [
  {
    title: '👋 Bienvenida a la cabaña',
    intro: true,
    body:
`Este juego es para cuidar a Vero día a día.

Tiene 4 indicadores para mantener altos (sueño, hambre, diversión) o en rango (glucemia) — los anillos de colores de abajo en cada sala.

Hay 5 salas conectadas por un mapa: Cocina, Dormitorio, Baño, Sala de actividades y Huerta.

Jardinería, bañarse y ganar los minijuegos dan monedas 🪙 — se gastan en semillas y en el Mercado de la Cocina.

Para moverte: tocá la casa para ir a tu última sala (el mapa la primera vez), o el pergamino para abrir el mapa desde cualquier sala.

Usá ◀ ▶ para ver el resto, sala por sala.`,
  },
  { title: HelpScene.TITLES.cabin,    room: 'cabin' },
  { title: HelpScene.TITLES.kitchen,  room: 'kitchen' },
  { title: HelpScene.TITLES.bedroom,  room: 'bedroom' },
  { title: HelpScene.TITLES.bathroom, room: 'bathroom' },
  { title: HelpScene.TITLES.activity, room: 'activity' },
  { title: HelpScene.TITLES.garden,   room: 'garden' },
];
