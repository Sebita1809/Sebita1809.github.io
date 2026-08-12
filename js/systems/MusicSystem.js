// Música de fondo generada por código con Web Audio API — el proyecto no
// tenía ningún archivo de audio (mp3/ogg) y el usuario prefirió un loop
// simple en vez de salir a conseguir uno (se puede reemplazar más
// adelante por un archivo real sin tocar el resto del juego, solo esta
// clase). Pad de acordes sostenido (con un leve "respirar" de volumen, LFO
// lento) + una frase melódica en pentatónica con ritmo variado (no todas
// corcheas iguales) + un eco un octava abajo a bajo volumen. Reemplaza un
// primer intento de 8 corcheas idénticas en loop de ~6.7s — el usuario lo
// encontró tedioso/mecánico muy rápido; esta versión es una frase de 16
// tiempos (~14.5s a 66 BPM) con silencios y notas largas, para que no se
// sienta como el mismo compasito repitiendo sin parar.
const Music = {
  _ctx: null,
  _master: null,
  _started: false,
  _nextLoopStart: 0,
  _lookaheadTimer: null,

  // Notas (Hz, temperamento igual) — pentatónica de Do mayor, 3 octavas.
  NOTES: {
    C3: 130.81, D3: 146.83, E3: 164.81, G3: 196.00, A3: 220.00,
    C4: 261.63, D4: 293.66, E4: 329.63, G4: 392.00, A4: 440.00,
    C5: 523.25,
  },

  TEMPO_BPM: 66,

  // Frase de 16 tiempos: [nota o null (silencio), duración en tiempos].
  // Arco melódico con silencios y notas largas en vez de corcheas parejas
  // — sube hasta C5 a mitad de frase y resuelve en un Do largo al final
  // (el loop empalma limpio ahí).
  PHRASE: [
    ['C4', 1], ['E4', 0.5], ['G4', 0.5], ['A4', 1], ['G4', 0.5], ['E4', 0.5],
    ['D4', 1], ['C4', 1], [null, 0.5], ['A3', 0.5], ['G3', 1],
    ['E4', 0.5], ['G4', 0.5], ['A4', 1], ['C5', 1], ['A4', 1],
    ['G4', 0.5], ['E4', 0.5], ['D4', 1], ['C4', 2],
  ],

  // Los navegadores bloquean el audio hasta el primer gesto del usuario —
  // game.js llama esto en varios tipos de primer gesto (pointerdown,
  // touchstart, keydown) por las dudas de que alguno no dispare en algún
  // navegador/dispositivo (reportado por el usuario: no sonaba abriéndolo
  // desde el link — puede ser esto, o el AudioContext arrancando
  // 'suspended' pese al gesto, por eso el resume() explícito de abajo).
  start(initialVolume) {
    if (this._started) return;
    this._started = true;

    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return; // navegador sin Web Audio — sin música, no rompe el juego
    this._ctx = new AudioContextClass();
    this._master = this._ctx.createGain();
    this._master.gain.value = initialVolume;
    this._master.connect(this._ctx.destination);

    // Algunos navegadores (sobre todo mobile) crean el AudioContext ya
    // 'suspended' incluso disparado desde un gesto real — sin este resume()
    // explícito el contexto queda mudo para siempre, sin ningún error
    // visible que lo delate.
    if (this._ctx.state === 'suspended') this._ctx.resume();

    this._startDrone();
    this._nextLoopStart = this._ctx.currentTime + 0.2;
    this._scheduleLoop();
    this._lookaheadTimer = setInterval(() => this._checkSchedule(), 500);
  },

  setVolume(ratio) {
    if (!this._master) return;
    this._master.gain.setTargetAtTime(Phaser.Math.Clamp(ratio, 0, 1), this._ctx.currentTime, 0.05);
  },

  // Pad de fondo: dos senos graves (tónica + quinta) sostenidos todo el
  // tiempo — un LFO lento (~1 ciclo cada 9s) le mueve el volumen entre
  // 0.035 y 0.065 para que respire un poco en vez de ser un zumbido plano.
  _startDrone() {
    ['C3', 'G3'].forEach((note, i) => {
      const osc = this._ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.value = this.NOTES[note];
      const gain = this._ctx.createGain();
      gain.gain.value = 0.05;
      osc.connect(gain);
      gain.connect(this._master);
      osc.start();

      const lfo = this._ctx.createOscillator();
      lfo.type = 'sine';
      lfo.frequency.value = 1 / 9;
      const lfoGain = this._ctx.createGain();
      lfoGain.gain.value = 0.015;
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      lfo.start(this._ctx.currentTime + i * 2); // arrancan desfasados, no laten juntos
    });
  },

  // Un "pluck" tipo caja de música: triangular con ataque instantáneo y
  // decaimiento exponencial. peak/octaveShift permiten el eco más grave y
  // más bajito sin duplicar la función.
  _pluck(freq, time, duration, peak) {
    const osc = this._ctx.createOscillator();
    osc.type = 'triangle';
    osc.frequency.value = freq;
    const gain = this._ctx.createGain();
    gain.gain.setValueAtTime(0.0001, time);
    gain.gain.exponentialRampToValueAtTime(peak, time + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, time + duration);
    osc.connect(gain);
    gain.connect(this._master);
    osc.start(time);
    osc.stop(time + duration + 0.05);
  },

  // Programa una repetición completa de PHRASE arrancando en
  // this._nextLoopStart (más un eco de la misma frase una octava abajo, un
  // toque más tarde y bajito — le da algo de profundidad sin ser una
  // segunda melodía real). Deja calculado cuándo debería empezar la
  // siguiente vuelta para que _checkSchedule sepa cuándo volver a llamar.
  _scheduleLoop() {
    const beatS = 60 / this.TEMPO_BPM;
    let t = this._nextLoopStart;

    this.PHRASE.forEach(([note, beats]) => {
      const dur = beats * beatS;
      if (note) {
        // Pequeña humanización: +-6% de pico y +-15ms de timing, para que
        // no suene como un secuenciador perfectamente cuantizado.
        const jitterMs = (Math.random() - 0.5) * 0.03;
        const peak = 0.16 + (Math.random() - 0.5) * 0.02;
        this._pluck(this.NOTES[note], t + jitterMs, dur * 0.92, peak);
        // Eco una octava abajo, 90ms después, bien bajito.
        this._pluck(this.NOTES[note] / 2, t + 0.09, dur * 0.85, 0.045);
      }
      t += dur;
    });

    this._nextLoopStart = t;
  },

  // Scheduler con lookahead (patrón estándar de Web Audio): programa la
  // próxima vuelta un poco antes de que termine la actual, para no
  // depender de que un setTimeout dispare en el milisegundo exacto.
  _checkSchedule() {
    if (this._ctx.currentTime > this._nextLoopStart - 1) this._scheduleLoop();
  },
};
