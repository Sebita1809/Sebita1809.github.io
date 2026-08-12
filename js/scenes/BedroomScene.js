// Cajas de cada objeto interactivo como % del fondo dormitorio_limpio.png
// (1536x2752). Recortados directamente del fondo (mismo criterio que
// KITCHEN_BOXES en KitchenScene.js) — la alineación es exacta por
// construcción, no por medición aparte. dormitorio_limpio.png es
// dormitorio.png con la pila de ropa sucia "parchada" (tenía la marca de
// agua de Gemini metida en el dibujo — pedido del usuario, no se muestra).
const BEDROOM_BOXES = {
  cama:    { key: 'dormitorio_cama',    left: 260 / 1536, top: 1020 / 2752, width: 695 / 1536, height: 990  / 2752 },
  placard: { key: 'dormitorio_placard', left: 965 / 1536, top: 615  / 2752, width: 571 / 1536, height: 1475 / 2752 },
  espejo:  { key: 'dormitorio_espejo',  left: 0   / 1536, top: 1150 / 2752, width: 250 / 1536, height: 330  / 2752 },
};

// Vidrio de la ventana (para la luz dinámica) — recorte transparente en
// dormitorio_ventana.png, hallado por umbral de color (glass ~ r>190,
// g>140, b>60) restringido a x>=1385 para no comerse el visillo, que tiene
// resaltos casi tan claros como el vidrio y se solapa con la caja del lado
// izquierdo. Caja sobre 1536x2752, mismo criterio que WINDOW_BOX de
// KitchenScene (nombre distinto a propósito: los scripts son clásicos, no
// módulos, y comparten un único scope top-level — dos `const WINDOW_BOX`
// en archivos distintos chocan con SyntaxError apenas carga la página).
const BEDROOM_WINDOW_BOX = { left: 1388 / 1536, top: 402 / 2752, width: 102 / 1536, height: 864 / 2752 };

class BedroomScene extends RoomScene {
  constructor() { super('BedroomScene'); }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.stats = this.registry.get('stats');
    this._sleepSequenceActive = false; // guarda contra re-disparar la secuencia mientras ya está corriendo

    this._bg = this._drawBackground(W, H, 'dormitorio_fondo');
    this._makeWindowLight(BEDROOM_WINDOW_BOX);

    // Se guardan las referencias de cama/placard/espejo (antes se
    // descartaban) porque las secuencias de dormir necesitan ocultarlas
    // mientras se muestra dormitorio_pareja/dormitorio_sola (fondos
    // distintos, donde no calzan) y volver a mostrarlas al terminar.
    this._camaObj = this._makeHoverObject(BEDROOM_BOXES.cama, () => this._openSleepChoice());
    this._placardObj = this._makeHoverObject(BEDROOM_BOXES.placard, () => this._openArmario());
    // El espejo ya no abre nada (elegir peinado se sacó, pedido del
    // usuario) — queda como objeto decorativo sin callback, solo para
    // poder ocultarlo/mostrarlo junto con cama/placard en la secuencia de
    // dormir (ver más abajo).
    this._espejoObj = this._makeHoverObject(BEDROOM_BOXES.espejo);

    this._makeHelpButton('bedroom');
    this._makeGearButton(W);
    this._makeBackButton(W, H);
    this._createStatsUI();

    // Pedido del usuario: más arriba y a la derecha, a la altura de la
    // silla, entre esta y la puerta del placard.
    this._placeVero(220, 685);
    this._veroHomeX = 220; // _sleepTogether la devuelve acá al terminar la secuencia de Seba
  }

  // Mismo motivo que KitchenScene.update(): las stats tienen que seguir
  // decayendo mientras el jugador está en esta sala, no solo en la Cabaña.
  update(time, delta) {
    this.stats.update(delta);
    this._updateStatsUI();
    this._checkGlucemiaShake();
    this._updateVeroExpression();
  }

  // ── 3.5/3.6: elegir cómo dormir ──────────────────────────────────────
  // Panel chico con dos botones, mismo lenguaje visual que los modales de
  // KitchenScene (panel indigo redondeado + borde violeta) pero armado acá
  // en vez de reusar _openModal (esa vive en KitchenScene, no en RoomScene,
  // y para 2 botones no hace falta toda su maquinaria de lista con scroll).
  _openSleepChoice() {
    if (this._sleepSequenceActive) return; // ya durmiendo, ignorar el re-tap

    const W = this.scale.width;
    const H = this.scale.height;
    const depth = RoomScene.DEPTH.BACK_BUTTON + 10;
    const objs = [];

    // Interactivo para que intercepte los clicks y no le lleguen a los
    // objetos de atrás (mismo criterio que KitchenScene._openModal).
    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.6)
      .setOrigin(0, 0).setDepth(depth).setInteractive();
    objs.push(overlay);

    const panelW = W - 60;
    const panelH = 176;
    const panelX = 30;
    const panelY = (H - panelH) / 2;

    const panel = this.add.graphics().setDepth(depth + 1);
    panel.fillStyle(0x1e1b4b, 0.97);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, 0x7c3aed, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);
    objs.push(panel);

    const title = this.add.text(W / 2, panelY + 26, '¿Cómo querés dormir?', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e9d5ff',
    }).setOrigin(0.5).setDepth(depth + 2);
    objs.push(title);

    const close = () => objs.forEach(o => o.destroy());

    // Botón "✕" para cancelar sin elegir — bug real reportado por el
    // usuario: antes, si tocaba la cama sin querer, no había forma de
    // volver atrás salvo eligiendo una de las dos opciones para dormir.
    // Mismo lenguaje visual que el resto de los modales del juego
    // (KitchenScene._openModal, GardenScene._openSeedPicker, etc).
    const closeBtn = this.add.text(panelX + panelW - 14, panelY + 14, '✕', {
      fontSize: '18px', fill: '#a78bfa', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(depth + 2).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ fill: '#a78bfa' }));
    closeBtn.on('pointerdown', () => close());
    objs.push(closeBtn);

    const makeBtn = (y, label, onTap) => {
      const btnW = panelW - 40;
      const btnH = 46;
      const btnX = panelX + 20;

      const bg = this.add.graphics().setDepth(depth + 2);
      bg.fillStyle(0x7c3aed, 1);
      bg.fillRoundedRect(btnX, y, btnW, btnH, 10);
      objs.push(bg);

      const txt = this.add.text(W / 2, y + btnH / 2, label, {
        fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      }).setOrigin(0.5).setDepth(depth + 3);
      objs.push(txt);

      const zone = this.add.zone(btnX, y, btnW, btnH).setOrigin(0)
        .setInteractive({ useHandCursor: true }).setDepth(depth + 3);
      objs.push(zone);
      zone.on('pointerdown', () => { close(); onTap(); });
    };

    makeBtn(panelY + 62, '💤 Dormir sola', () => this._dormirSola());
    makeBtn(panelY + 118, '🤗 Dormir con Seba', () => this._dormirConSeba());
  }

  // ── 3.5: Dormir sola — sube el sueño (spec: sin diversión, a diferencia
  // de dormir con Seba) y usa el mismo fundido de _runSleepFade con el
  // fondo dormitorio_sola (Vero + Ámbar enroscada a los pies, ya dibujada
  // en el fondo — no hace falta un sprite de Ámbar aparte). ─────────────
  _dormirSola() {
    if (this._sleepSequenceActive) return;
    this._sleepSequenceActive = true;

    const vero = this._vero;
    this.stats.addSleep(50);
    this._showFloatingText('+50 😴', vero.x, vero.y - vero.displayHeight - 20);

    this.time.delayedCall(500, () => {
      this._runSleepFade('dormitorio_sola', {
        onDark: () => {
          vero.setVisible(false);
          [this._camaObj, this._placardObj, this._espejoObj].forEach(o => o.setVisible(false));
        },
        onWake: () => {
          vero.setVisible(true);
          [this._camaObj, this._placardObj, this._espejoObj].forEach(o => o.setVisible(true));
        },
      });
    });
  }

  // ── 3.6: Dormir con Seba, primer tramo (dron llega → flash/shake →
  // explosión) ──────────────────────────────────────────────────────────
  // Assets provistos por el usuario, los tres lienzos cuadrados 2048x2048
  // (dron_caja/caja_explosion) para que se puedan mostrar con el mismo
  // tamaño y origen sin distorsión. NO se usa caja_sin_fondo.png (caja sola
  // cayendo): su ángulo (vista de frente) no calza con el de la caja en
  // drone_sin_fondo.png (isométrica) — se pidió una v2 en el mismo ángulo
  // y no salió bien, así que en vez de reintentar el arte se resolvió en
  // código: la secuencia salta directo de "dron con caja" a "explosión"
  // con un flash + shake de cámara en el medio que disimula el corte.
  _dormirConSeba() {
    if (this._sleepSequenceActive) return; // ya está corriendo, ignorar el re-tap
    this._sleepSequenceActive = true;

    const W = this.scale.width;
    const H = this.scale.height;
    const cx = W / 2;
    const landY = H / 2 - 20; // punto de "aterrizaje", sobre la cama
    const SIZE = 220;
    const depth = RoomScene.DEPTH.FLOATING_TEXT + 1;

    const drone = this.add.image(cx, -SIZE, 'dron_caja')
      .setDisplaySize(SIZE, SIZE)
      .setDepth(depth);

    this.tweens.add({
      targets: drone,
      y: landY,
      duration: 900,
      ease: 'Quad.easeIn',
      onComplete: () => {
        // vaivén sutil, como si flotara un instante antes de soltar la caja
        this.tweens.add({
          targets: drone,
          y: landY - 8,
          duration: 220,
          yoyo: true,
          repeat: 1,
          onComplete: () => this._dropAndExplode(drone),
        });
      },
    });
  }

  _dropAndExplode(drone) {
    this.cameras.main.flash(180, 255, 255, 255);
    this.cameras.main.shake(220, 0.008);

    // caja_explosion ya trae dibujada la estrella de impacto y la tapa
    // saltando, no hace falta agregar nada más encima.
    drone.setTexture('caja_explosion');

    this.time.delayedCall(700, () => {
      this.tweens.add({
        targets: drone,
        alpha: 0,
        duration: 400,
        onComplete: () => drone.destroy(),
      });
      this._appearSeba();
    });
  }

  // ── 3.6, segundo tramo: aparece Seba (pop-in), abrazo con Vero, sube
  // sueño + diversión. Textura 'seba' = seba_frente.png (recorte de
  // sprites-seba.png, ver BootScene.js) ────────────────────────────────
  _appearSeba() {
    const vero = this._vero;
    const targetH = this._veroTargetH; // misma altura que Vero (260) — antes 225, se veía más bajo
    const tex = this.textures.get('seba').getSourceImage();
    const finalScale = targetH / tex.height;

    // Se corre a Vero un poco a la izquierda: con los dos a la misma altura
    // y depth, si se quedaba en su lugar Seba terminaba tapándola parcialmente
    // al abrazarse (pedido del usuario tras verlo en pantalla).
    const veroFinalX = vero.x - 45;
    this.tweens.add({ targets: vero, x: veroFinalX, duration: 350, ease: 'Quad.easeOut' });

    // Antes acá se forzaba la expresión "sorprendida" al ver aparecer a
    // Seba — sacada a pedido del usuario (junto con el resto de las caras
    // por prenda), Vero se queda con su expresión normal en esta escena.

    const hugX = veroFinalX + 95; // offset entre centros: suficiente para que no se tapen del todo, pero se toquen al abrazarse
    const startX = Math.min(this.scale.width - 40, hugX + 60);

    const seba = this.add.image(startX, vero.y, 'seba')
      .setOrigin(0.5, 1)
      .setDepth(RoomScene.DEPTH.CHARACTERS)
      .setAlpha(0)
      .setScale(finalScale * 0.3);

    this.tweens.add({
      targets: seba,
      alpha: 1,
      scaleX: finalScale,
      scaleY: finalScale,
      duration: 350,
      ease: 'Back.easeOut',
      onComplete: () => this._hugSeba(seba, vero, hugX),
    });
  }

  _hugSeba(seba, vero, hugX) {
    this.tweens.add({
      targets: seba,
      x: hugX,
      duration: 300,
      ease: 'Quad.easeOut',
      onComplete: () => {
        // "apretón" del abrazo: un pulso de escala breve en los dos
        [seba, vero].forEach(sprite => {
          this.tweens.add({
            targets: sprite,
            scaleX: sprite.scaleX * 1.08,
            scaleY: sprite.scaleY * 1.08,
            duration: 160,
            yoyo: true,
          });
        });

        // Mismo +50 sueño que dormir sola (pedido del usuario: "normalmente
        // solo se debería llenar la de sueño") — dormir con Seba solo suma
        // un empujón CHICO de diversión encima, no igual de grande (antes
        // era +20/+20 parejo).
        this.stats.addSleep(50);
        this.stats.addFun(5);
        this._showFloatingText('+50 😴  +5 🎉', (vero.x + hugX) / 2, vero.y - vero.displayHeight - 20);

        this.time.delayedCall(900, () => this._sleepTogether(seba, vero));
      },
    });
  }

  // ── 3.6, tramo final: oscurecer → fondo con los dos acostados → sigue
  // oscuro un rato (pasa la noche) → oscurecer de nuevo → vuelve el fondo
  // original sin Seba, Vero de pie. Delega el fundido en sí a
  // _runSleepFade (compartido con _dormirSola); acá solo van los hooks
  // específicos de esta variante: Seba se destruye al oscurecer, y Vero
  // vuelve a su posición original al despertar. ───────────────────────
  _sleepTogether(seba, vero) {
    this._runSleepFade('dormitorio_pareja', {
      onDark: () => {
        seba.destroy();
        vero.setVisible(false);
        [this._camaObj, this._placardObj, this._espejoObj].forEach(o => o.setVisible(false));
      },
      onWake: () => {
        // Bug encontrado por el usuario: sin esto, Vero se quedaba en
        // veroFinalX (la corrida a la izquierda de _appearSeba) para
        // siempre — cada vez que se repetía la secuencia se corría 45px
        // más, hasta desaparecer de la pantalla. Se reubica mientras sigue
        // invisible/a oscuras, sin salto.
        vero.x = this._veroHomeX;
        vero.setVisible(true);
        [this._camaObj, this._placardObj, this._espejoObj].forEach(o => o.setVisible(true));
        this._veroExpressionOverride = null;
        this._updateVeroExpression();
      },
    });
  }

  // Núcleo común de toda secuencia de dormir (sola o con Seba): parpadeo
  // previo → oscurece del todo → onDark (cambiar lo que haga falta mientras
  // no se ve nada) → swapea al fondo alternativo → aclara parcial (nunca
  // del todo — a pedido del usuario, que se note que están durmiendo, no
  // un corte a negro) → pasa la noche → oscurece de nuevo → vuelve el
  // fondo original + onWake → aclara del todo. Libera _sleepSequenceActive
  // al terminar.
  _runSleepFade(bgTextureKey, { onDark, onWake } = {}) {
    const W = this.scale.width;
    const H = this.scale.height;
    const DARK = 0.85;
    const DIM = 0.45; // "iluminado pero no del todo" mientras duermen

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 1)
      .setOrigin(0, 0)
      .setDepth(RoomScene.DEPTH.BACK_BUTTON + 10)
      .setAlpha(0)
      .setName('sleepOverlay');

    // Parpadeo previo a dormirse (pedido del usuario: el primer oscurecido
    // era muy brusco — un solo fundido de 500ms — y pidió que diera la
    // sensación de párpados pesados cerrándose de a poco). Cada guiño es
    // más largo y se queda más oscuro que el anterior; recién el último
    // llega a DARK y se queda.
    this._tweenSequence(overlay, [
      { alpha: 0.30, duration: 250 },
      { alpha: 0.05, duration: 250 },
      { alpha: 0.55, duration: 320 },
      { alpha: 0.12, duration: 320 },
      { alpha: DARK, duration: 700, ease: 'Sine.easeIn' },
    ], () => {
      if (onDark) onDark();
      this._swapBackground(bgTextureKey, true);

      this.tweens.add({
        targets: overlay,
        alpha: DIM,
        duration: 700,
        ease: 'Quad.easeOut',
        onComplete: () => {
          // pasa la noche — pedido del usuario: que se quede más tiempo
          // mostrando la escena de dormir antes de despertar (antes 1600ms)
          this.time.delayedCall(3200, () => {
            this.tweens.add({
              targets: overlay,
              alpha: DARK,
              duration: 700,
              ease: 'Quad.easeIn',
              onComplete: () => {
                this._swapBackground('dormitorio_fondo', false);
                if (onWake) onWake();

                this.tweens.add({
                  targets: overlay,
                  alpha: 0,
                  duration: 900,
                  ease: 'Quad.easeOut',
                  onComplete: () => {
                    overlay.destroy();
                    this._sleepSequenceActive = false;
                  },
                });
              },
            });
          });
        },
      });
    });
  }

  // Corre una lista de tweens de alpha sobre `target` en orden, uno atrás
  // del otro, y llama a onDone al final. steps: [{ alpha, duration, ease? }].
  // Usado para el parpadeo previo a dormirse (varios pasos cortos en vez de
  // un solo fundido) sin anidar un tween adentro de otro a mano.
  _tweenSequence(target, steps, onDone) {
    const [step, ...rest] = steps;
    if (!step) { onDone(); return; }
    this.tweens.add({
      targets: target,
      alpha: step.alpha,
      duration: step.duration,
      ease: step.ease || 'Sine.easeInOut',
      onComplete: () => this._tweenSequence(target, rest, onDone),
    });
  }

  // Recalcula escala/offset para la nueva textura (mismo criterio que
  // _drawBackground) y la aplica sobre el mismo Image en vez de crear uno
  // nuevo — más simple que llevar dos imágenes de fondo superpuestas.
  //
  // vignette: oscurece los bordes/esquinas del fondo dejando el centro
  // (donde están las dos personas dormidas) bien visible. Se usa en los
  // fondos alternativos de dormir (dormitorio_pareja/dormitorio_sola) —
  // pedido del usuario como alternativa a seguir puliendo a mano el logo
  // de Gemini de la pila de ropa sucia, que quedaba en la esquina inferior
  // derecha y ahí es justo donde tapa la viñeta. postFX es WebGL-only,
  // pero el juego corre con Phaser.AUTO (WebGL con fallback a Canvas); se
  // guarda por si algún día corre en Canvas puro y postFX no existe.
  _swapBackground(textureKey, vignette = false) {
    const W = this.scale.width;
    const H = this.scale.height;
    const tex = this.textures.get(textureKey).getSourceImage();
    const scale = H / tex.height;
    const offsetX = (W - tex.width * scale) / 2;

    this._bg.setTexture(textureKey).setScale(scale).setX(offsetX);

    if (this._bg.postFX) {
      this._bg.postFX.clear();
      if (vignette) this._bg.postFX.addVignette(0.5, 0.5, 0.62, 0.55);
    }
  }

  // Placeholder de interacción: los objetos ya son clickeables y muestran
  // feedback, pero customización de ropa/peinado (3.7, Etapa 3) todavía no
  // está diseñada en detalle. Reemplazar cuando se implemente.
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

  // ── Placard — elegir prenda (Etapa 3, personalización). Usa el picker
  // genérico de RoomScene._openListPicker (pedido del usuario: tocar una
  // fila solo la resalta, "✓ Confirmar" recién ahí aplica y guarda — antes
  // se aplicaba al toque, sin forma de repasar antes de confirmar). Ya no
  // hay peinado elegible — cada prenda usa siempre su versión "suelto".
  _openArmario() {
    const items = OUTFITS.map(outfit => {
      const combo = `vero_${outfit.id}_suelto`;
      const textureKey = this.textures.exists(combo) ? combo : 'vero_idle';
      return { id: outfit.id, label: outfit.nombre, textureKey };
    });

    this._openListPicker({
      title: '👗 Elegí una prenda',
      items,
      initialId: this.registry.get('outfit') || 'default',
      onConfirm: (id) => {
        this.registry.set('outfit', id);
        _autosave();
      },
    });
  }
}
