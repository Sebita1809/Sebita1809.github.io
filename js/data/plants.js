// Tabla de crecimiento de la Huerta (proposal.md, tasks.md 6.2). Los `id`
// coinciden 1:1 con los productos categoría 'cosecha' de products.js — al
// cosechar, GardenScene hace `inventory.add(id, 1)` con este mismo id, y usa
// `Products.byId(id).sprite` para dibujar el ícono de "listo para cosechar"
// (ya cargado por Cocina, no hace falta arte nuevo).
//
// seedCost/harvestCoins (tasks.md "monedas y mercado"): escalados a ojo con
// growthMs — cuanto más tarda una especie, más cara la semilla y más paga
// cosecharla. harvestCoins < seedCost siempre (si no, plantar sería gratis a
// la larga) pero la brecha es chica a propósito (montos "chicos", pedido
// explícito del usuario). Sin sistema de precios dinámico ni de mercado
// real — son constantes fijas, ajustables acá si hace falta rebalancear.
// `stages`: claves de textura (`planta_${id}_${stage}`) en orden de
// crecimiento — la ÚLTIMA es la que se muestra cuando Plants.isReady() da
// true (listo para cosechar), las anteriores se reparten en partes iguales
// a lo largo de growthMs (ver Plants.stageKey). Verduras traen 2 etapas
// (plántula → crecida = lista); frutas traen 3 (plántula → crecida → con
// frutos = lista) — arte de nuevos-sprites-plantas.png (extract-plantas-
// solas.js), única hoja que trae las 10 especies incluido choclo (2
// etapas: 'growing'/'ready', nombres heredados de la v1 sin arte nuevo
// intermedio) con etapas confiables.
const PLANTS = [
  // ⚠️ DEBUG TEMPORAL: growthMs a 10s de nuevo (pedido del usuario para
  // revisar el offset/tamaño nuevo del ícono en las 3 etapas) — valores
  // reales comentados al lado. RESTAURAR antes de entregar el juego.
  { id: 'lechuga',   growthMs: 10 * 1000, /* 30 * 60 * 1000 */      seedCost: 3,  harvestCoins: 2, stages: ['plantula', 'crecida'] },
  { id: 'zanahoria', growthMs: 10 * 1000, /* 60 * 60 * 1000 */      seedCost: 4,  harvestCoins: 2, stages: ['plantula', 'crecida'] },
  { id: 'tomate',    growthMs: 10 * 1000, /* 2 * 60 * 60 * 1000 */  seedCost: 5,  harvestCoins: 2, stages: ['plantula', 'crecida'] },
  { id: 'remolacha', growthMs: 10 * 1000, /* 2 * 60 * 60 * 1000 */  seedCost: 5,  harvestCoins: 2, stages: ['plantula', 'crecida'] },
  { id: 'frutilla',  growthMs: 10 * 1000, /* 3 * 60 * 60 * 1000 */  seedCost: 6,  harvestCoins: 3, stages: ['plantula', 'crecida', 'confrutos'] },
  { id: 'choclo',    growthMs: 10 * 1000, /* 4 * 60 * 60 * 1000 */  seedCost: 7,  harvestCoins: 3, stages: ['growing', 'ready'] },
  { id: 'mandarina', growthMs: 10 * 1000, /* 6 * 60 * 60 * 1000 */  seedCost: 8,  harvestCoins: 3, stages: ['plantula', 'crecida', 'confrutos'] },
  { id: 'naranja',   growthMs: 10 * 1000, /* 6 * 60 * 60 * 1000 */  seedCost: 8,  harvestCoins: 3, stages: ['plantula', 'crecida', 'confrutos'] },
  { id: 'manzana',   growthMs: 10 * 1000, /* 8 * 60 * 60 * 1000 */  seedCost: 10, harvestCoins: 4, stages: ['plantula', 'crecida', 'confrutos'] },
  { id: 'sandia',    growthMs: 10 * 1000, /* 12 * 60 * 60 * 1000 */ seedCost: 14, harvestCoins: 5, stages: ['plantula', 'crecida', 'confrutos'] },
];

// El crecimiento NO se acumula con un delta por frame (a diferencia de
// StatsSystem) — se DERIVA comparando el timestamp real de plantado contra
// Date.now() cada vez que hace falta (design D5), así una planta sigue
// madurando aunque el juego haya estado cerrado.
const Plants = {
  byId(id) {
    return PLANTS.find(p => p.id === id) || null;
  },

  // plot: { species, plantedAt, watered } o null (cantero vacío).
  isReady(plot) {
    if (!plot) return false;
    const def = this.byId(plot.species);
    return !!def && Date.now() - plot.plantedAt >= def.growthMs;
  },

  // 0..1 — fracción de tiempo transcurrido contra growthMs.
  progress(plot) {
    if (!plot) return 0;
    const def = this.byId(plot.species);
    if (!def) return 0;
    return Math.min(1, (Date.now() - plot.plantedAt) / def.growthMs);
  },

  // Clave de textura de la etapa visual actual (`planta_${species}_${key}`,
  // ver GardenScene._refreshPlot/_growingIcon). La ÚLTIMA etapa de
  // `def.stages` es exclusiva de isReady()=true; las anteriores se reparten
  // en partes iguales a lo largo del crecimiento — con 2 etapas
  // (['plantula','crecida']) es un simple binario creciendo/lista, igual
  // que el sistema viejo; con 3 (+'confrutos') la mitad se ve "plántula" y
  // la otra mitad "crecida" antes de estar lista.
  stageKey(plot) {
    if (!plot) return null;
    const def = this.byId(plot.species);
    if (!def) return null;
    const growingStages = def.stages.length - 1;
    if (this.isReady(plot)) return def.stages[growingStages];
    const idx = Math.min(growingStages - 1, Math.floor(this.progress(plot) * growingStages));
    return def.stages[idx];
  },
};
