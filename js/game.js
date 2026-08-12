const config = {
  type: Phaser.AUTO,
  width: 390,
  height: 844,
  backgroundColor: '#1a1a2e',
  parent: document.body,
  scene: [
    BootScene,
    CabinScene,
    MapScene,
    SettingsScene,
    HelpScene,
    TutorialScene,
    KitchenScene,
    BedroomScene,
    BathroomScene,
    ActivityScene,
    GardenScene,
    SudokuScene,
    CrosswordScene,
  ],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  render: {
    pixelArt: true,
    antialias: false,
  },
};

const game = new Phaser.Game(config);

// Autoguardado (sistema de guardado general — ver js/systems/SaveManager.js).
// Vive acá y no en una escena porque stats/inventory están en game.registry,
// que sobrevive a los cambios de escena; no hace falta que ninguna escena en
// particular esté activa para guardar. Tres disparadores:
//   - periódico (red de seguridad si el usuario nunca cierra la pestaña)
//   - beforeunload (cerrar pestaña / recargar en desktop)
//   - visibilitychange a 'hidden' (el que realmente importa en mobile: al
//     cambiar de app o bajar el celu, beforeunload no siempre dispara, pero
//     visibilitychange sí)
//
// _autosave() es la ÚNICA fuente de verdad de "qué es un guardado completo"
// — SaveManager.save() sobreescribe TODO el blob de localStorage en cada
// llamada (no mergea), así que una escena que llame a SaveManager.save()
// pasando solo SU propio pedacito de estado (ej. GardenScene guardando solo
// stats/inventory/garden) borraría sin querer lo último guardado de
// outfit (quedaría `undefined`, JSON.stringify lo omite, y al recargar la
// página se perdería la prenda elegida). Por eso
// cualquier escena que necesite guardar YA (no esperar al intervalo de 10s)
// llama a este mismo _autosave() global en vez de armar su propio
// SaveManager.save() parcial.
function _autosave() {
  const stats = game.registry.get('stats');
  const inventory = game.registry.get('inventory');
  if (!stats || !inventory) return;
  SaveManager.save({
    stats,
    inventory,
    garden: game.registry.get('garden'),
    outfit: game.registry.get('outfit'),
    lastRoom: game.registry.get('lastRoom'),
    volume: game.registry.get('volume'),
    language: game.registry.get('language'),
    tutorialSeen: game.registry.get('tutorialSeen'),
  });
}

setInterval(_autosave, 10000);
window.addEventListener('beforeunload', _autosave);
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') _autosave();
});

// Música de fondo (js/systems/MusicSystem.js — sin archivo de audio,
// generada por código, decisión del usuario). Arranca recién en el primer
// gesto del usuario (los navegadores bloquean el audio hasta entonces) con
// el volumen guardado si había una partida previa, o 0.7 por defecto —
// mismo default que usa SettingsScene si nunca se tocó el slider.
//
// 3 tipos de evento en vez de solo pointerdown (reportado por el usuario:
// no sonaba abriéndolo desde el link) — Music.start() ya se guarda a sí
// mismo (this._started), así que no hay riesgo de arrancar 2 veces aunque
// disparen varios de estos.
function _unlockMusic() {
  const vol = game.registry.get('volume');
  Music.start(typeof vol === 'number' ? vol : 0.7);
}
document.addEventListener('pointerdown', _unlockMusic, { once: true });
document.addEventListener('touchstart', _unlockMusic, { once: true, passive: true });
document.addEventListener('keydown', _unlockMusic, { once: true });
