class StatsSystem {
  constructor() {
    this.sleep     = 80;
    this.hunger    = 80;
    this.fun       = 80;
    this.glucemia  = 100;

    // Acumuladores de tiempo en ms
    this._sleepAcc    = 0;
    this._hungerAcc   = 0;
    this._funAcc      = 0;
    this._glucemiaAcc = 0;
  }

  update(delta) {
    this._sleepAcc    += delta;
    this._hungerAcc   += delta;
    this._funAcc      += delta;
    this._glucemiaAcc += delta;

    if (this._sleepAcc >= 30000) {
      this.sleep = Math.max(0, this.sleep - 1);
      this._sleepAcc = 0;
    }
    if (this._hungerAcc >= 25000) {
      this.hunger = Math.max(0, this.hunger - 1);
      this._hungerAcc = 0;
    }
    if (this._funAcc >= 40000) {
      this.fun = Math.max(0, this.fun - 1);
      this._funAcc = 0;
    }
    // Glucemia fluctúa ±0.5 cada 20s, nunca baja de 32
    if (this._glucemiaAcc >= 20000) {
      const drift = (Math.random() - 0.5) * 1;
      this.glucemia = Math.min(200, Math.max(32, this.glucemia + drift));
      this._glucemiaAcc = 0;
    }
  }

  isSleepy()  { return this.sleep  <= 20; }
  isHungry()  { return this.hunger <= 20; }
  isBored()   { return this.fun    <= 20; }

  glucemiaStatus() {
    if (this.glucemia <= 70)  return 'low';
    if (this.glucemia >= 140) return 'high';
    return 'ok';
  }

  // Devuelve la expresión prioritaria según el estado actual.
  // Devuelve null cuando todo está bien → CabinScene muestra la animación idle.
  getExpression() {
    if (this.glucemia <= 32) return 'colorada';
    if (this.isSleepy())     return 'cansada';
    if (this.isHungry())     return 'hambrienta';
    if (this.isBored())      return 'aburrida';
    return null;
  }

  // Llama esto explícitamente cuando Vero hace algo bueno (actividad, comida, etc.)
  triggerFeliz() { this._felizTimer = 5000; }
  hasFeliz()     { return this._felizTimer > 0; }

  // Modificadores externos
  addSleep(v)    { this.sleep    = Math.min(100, this.sleep    + v); }
  addHunger(v)   { this.hunger   = Math.min(100, this.hunger   + v); }
  addFun(v)      { this.fun      = Math.min(100, this.fun      + v); }
  setGlucemia(v) { this.glucemia = Math.min(200, Math.max(32, v));   }
}
