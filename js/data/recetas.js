// Catálogo cerrado de recetas (design D9, tasks.md 1.5 / 2.7).
// Las usa el Recetario de la Cocina (D8): cada receta se cocina con UNA única
// barra de timing (ver TimingBar, tasks.md 1.2) — si se acierta, se consumen
// los ingredientes y sube el hambre; si falla, no se consume nada.
//
// Campos:
//   id           : identificador estable
//   nombre       : texto a mostrar en el recetario
//   resultado    : id del producto (categoría 'plato', ver products.js) que
//                  se genera al cocinar con éxito
//   ingredientes : lista de requisitos. Cada entrada es una de dos formas:
//                    { productId, cantidad }              → un producto puntual
//                    { anyOf: [productId, ...], cantidad } → "el que haya
//                      disponible" entre varias opciones (usado por el
//                      Sandwich: tomate y/o lechuga, lo que haya)
//   hambre       : cuánto sube StatsSystem.hunger al servir el plato
//                  (valores relativos; comer rápido da ~8-12, ver D9)
//   coins        : monedas que gana Vero al cocinar esta receta con éxito
//                  (tasks.md "monedas y mercado" — resuelve de dónde sale el
//                  dinero para comprar semillas/stock de Mercadería, ver
//                  Inventory.js Open Question 2). Escalado a ojo con
//                  `hambre` (más completa la receta, más paga) — montos
//                  chicos a propósito, pedido explícito del usuario.
const RECETAS = [
  {
    id: 'ensalada',
    nombre: 'Ensalada',
    resultado: 'ensalada_armada',
    ingredientes: [
      { productId: 'tomate', cantidad: 1 },
      { productId: 'lechuga', cantidad: 1 },
    ],
    hambre: 18,
    coins: 3,
  },
  {
    id: 'sandwich',
    nombre: 'Sandwich',
    resultado: 'sandwich_armado',
    ingredientes: [
      { productId: 'pan', cantidad: 1 },
      { productId: 'queso', cantidad: 1 },
      { anyOf: ['tomate', 'lechuga'], cantidad: 1 },
    ],
    hambre: 20,
    coins: 4,
  },
  {
    id: 'pastas',
    nombre: 'Pastas',
    resultado: 'pastas_servidas',
    ingredientes: [
      { productId: 'fideos', cantidad: 1 },
      { productId: 'tomate', cantidad: 1 },
    ],
    hambre: 22,
    coins: 6,
  },
  {
    id: 'torta',
    nombre: 'Torta',
    resultado: 'torta',
    ingredientes: [
      { productId: 'harina', cantidad: 1 },
      { productId: 'azucar', cantidad: 1 },
      { productId: 'huevos', cantidad: 1 },
    ],
    hambre: 25,
    coins: 8,
  },
  {
    id: 'hamburguesa',
    nombre: 'Hamburguesa',
    resultado: 'hamburguesa_armada',
    ingredientes: [
      { productId: 'hamburguesas', cantidad: 1 },
      { productId: 'pan', cantidad: 1 },
    ],
    hambre: 22,
    coins: 6,
  },
];

const Recetas = {
  byId(id) {
    return RECETAS.find(r => r.id === id) || null;
  },
  all() {
    return RECETAS;
  },
};
