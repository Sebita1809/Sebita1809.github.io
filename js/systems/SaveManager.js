// Guardado general del juego (design: no existía ningún guardado hasta
// ahora — solo estaba planeada la persistencia de la Huerta, tasks.md
// etapa-2-salas 6.3). Guarda stats + inventario + huerta bajo la misma
// clave versionada, en vez de que la Huerta tenga su propio localStorage
// aparte (design.md D5 sugería una clave separada 'juego-vero:garden'; se
// prefirió unificar para no duplicar los 3 disparadores de autoguardado).
//
// No conoce Phaser ni escenas: solo sabe serializar/deserializar StatsSystem
// e Inventory a un objeto plano y leer/escribir eso en localStorage. Quien
// dispara cuándo guardar (autoguardado periódico, beforeunload,
// visibilitychange) vive en game.js, no acá.
const SaveManager = {
  KEY: 'juego-vero-save-v1',
  VERSION: 1,

  // garden: array plano de 6 canteros (GardenScene.PLOT_COUNT), cada uno
  // `{ species, plantedAt, watered }` o `null` — mismo criterio que
  // stats/inventory, un objeto plano sin conocer Phaser. plantedAt es un
  // epoch ms real (design D5): el crecimiento se deriva comparándolo contra
  // Date.now(), no hace falta reconstruir ningún timer al cargar.
  // outfit: string suelto (ej. 'pijama') que elige la prenda de Vero (Etapa
  // 3, personalización) — ver RoomScene._veroIdleTexture. Ya no hay
  // peinado elegible (sacado, cada prenda usa siempre su versión "suelto").
  // lastRoom: sceneKey de la última sala real visitada (ej. 'KitchenScene')
  // o null — CabinScene entra directo ahí al clickear la casa, sin
  // carteles (pedido del usuario). Se setea en MapScene._goToRoom, único
  // punto de entrada a cualquier sala.
  // volume/language: preferencias de SettingsScene (registry 'volume'/
  // 'language') — antes no se guardaban, se reseteaban a los defaults en
  // cada recarga.
  // tutorialSeen: si ya se cerró el tutorial alguna vez — CabinScene lo usa
  // para mostrarlo solo/automáticamente la primera vez (registry.get(...)
  // == null en un guardado viejo se trata como "no visto", ver BootScene).
  //
  // Recibe un objeto en vez de una lista de argumentos posicionales — con
  // varios campos sueltos era fácil pasar de largo alguno (bug real
  // encontrado: GardenScene._saveGarden llamaba a esto con solo 3
  // posicionales, pisando outfit con su default en cada guardado — ver
  // [[opsx/etapa-2-salas/garden-v2]]). _autosave() (game.js) es el único
  // punto que llama a esto, arma el objeto completo desde game.registry.
  save({ stats, inventory, garden, outfit, lastRoom, volume, language, tutorialSeen }) {
    const data = {
      version: this.VERSION,
      savedAt: Date.now(),
      stats: {
        sleep: stats.sleep,
        hunger: stats.hunger,
        fun: stats.fun,
        glucemia: stats.glucemia,
      },
      inventory: {
        qty: inventory._qty,
        coins: inventory.coins,
      },
      garden: garden || null,
      outfit: outfit || 'default',
      lastRoom: lastRoom || null,
      volume: typeof volume === 'number' ? volume : 0.7,
      language: language || 'es',
      tutorialSeen: !!tutorialSeen,
    };
    try {
      localStorage.setItem(this.KEY, JSON.stringify(data));
    } catch (e) {
      // localStorage puede fallar (modo privado, cuota llena) — no romper el
      // juego por esto, simplemente no se guarda esta vez.
      console.warn('[SaveManager] No se pudo guardar:', e);
    }
  },

  load() {
    try {
      const raw = localStorage.getItem(this.KEY);
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (!data || data.version !== this.VERSION) return null;
      return data;
    } catch (e) {
      console.warn('[SaveManager] No se pudo leer el guardado:', e);
      return null;
    }
  },

  // Vuelca los datos guardados sobre instancias YA CREADAS de StatsSystem e
  // Inventory (no las reemplaza — así BootScene.create() no cambia de forma
  // según haya o no partida guardada).
  applyTo(stats, inventory, data) {
    if (data.stats) {
      const s = data.stats;
      if (typeof s.sleep === 'number')    stats.sleep    = s.sleep;
      if (typeof s.hunger === 'number')   stats.hunger   = s.hunger;
      if (typeof s.fun === 'number')      stats.fun      = s.fun;
      if (typeof s.glucemia === 'number') stats.glucemia = s.glucemia;
    }
    if (data.inventory) {
      if (data.inventory.qty && typeof data.inventory.qty === 'object') {
        inventory._qty = { ...data.inventory.qty };
      }
      if (typeof data.inventory.coins === 'number') {
        inventory.coins = data.inventory.coins;
      }
    }
  },
};
