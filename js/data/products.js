// Catálogo cerrado de productos de comida (design D9, tasks.md 1.5 / 2.7).
// Fuente de verdad compartida entre Cocina (D8: paneles heladera/alacena/
// recetario + comer rápido) y Huerta (cosecha → mismo inventario).
//
// Vero es vegetariana; la única carne del catálogo es la hamburguesa.
//
// Campos:
//   id                : identificador estable, usado como clave de inventario
//   nombre            : texto a mostrar en los paneles
//   categoria         : 'alacena' | 'heladera' | 'cosecha' | 'plato'
//     - 'alacena'  → comprable, panel Mercadería/estantes de la Cocina
//     - 'heladera' → comprable, panel Heladera de la Cocina (junto con 'cosecha' — ver más abajo)
//     - 'cosecha'  → comprable O cosechable en la Huerta; se ve en el panel
//                    Heladera de la Cocina junto a 'heladera' (pedido del
//                    usuario: antes no aparecían en ningún panel, solo se
//                    podían usar "a ciegas" en recetas/comer rápido)
//     - 'plato'    → NO comprable, pero SÍ almacenable: se genera al cocinar
//                    una receta (Inventory.craft ahora lo suma al stock, no
//                    se sirve solo) y se come después desde el panel de
//                    "comer rápido" (comestibleDirecto: true, con su propio
//                    campo `hambre` — no usa el HUNGER_GAIN fijo del comer
//                    rápido de ingredientes crudos). No aparece en los
//                    paneles de heladera/alacena.
//   comestibleDirecto : si aparece en el panel fijo de "comer rápido" (D8)
//   hambre            : SOLO en 'plato' — cuánto sube el hambre al comerlo
//                        (copiado del campo `hambre` de la receta en
//                        recetas.js; duplicado a propósito para que el panel
//                        de comer rápido no dependa de recetas.js)
//   sprite            : clave de textura sugerida (nombre de archivo en
//                        assets/sprites/, sin extensión ni preload todavía —
//                        cargarlas queda para las tareas de Cocina/Huerta,
//                        no para esta infraestructura de datos)
//
// Nota: 'pastas_servidas' usa como sprite sugerido el único asset de pasta
// existente, 'espagueti_albondiga_transparente', pese a que su nombre sugiere
// albóndiga (carne). Vero es vegetariana y la receta de pastas no lleva
// carne — es un desajuste de nombre de archivo/arte a resolver cuando se
// produzcan assets nuevos (ver design.md Open Question 4), no un error del
// catálogo de datos.
// `precio` (tasks.md "monedas y mercado"): SOLO en productos alacena/
// heladera — resuelve la otra mitad de la Open Question 2 ("de dónde sale
// el stock de los NO cosechables"). Se compran con monedas en los paneles
// de Heladera/Alacena de la Cocina (KitchenScene._comprarProducto). Los
// productos 'cosecha' NO tienen precio a propósito: se consiguen plantando
// en la Huerta (PLANTS[].seedCost, ver plants.js), no comprando acá — evita
// dos fuentes de verdad para el mismo costo.
const PRODUCTS = [
  // ── Alacena — NO comestibles directo (salvo Galletitas) ──────────────
  { id: 'fideos',      nombre: 'Fideos',      categoria: 'alacena',  comestibleDirecto: false, sprite: 'fideos_secos_transparente', precio: 4 },
  { id: 'harina',      nombre: 'Harina',      categoria: 'alacena',  comestibleDirecto: false, sprite: 'harina_transparente', precio: 3 },
  { id: 'azucar',      nombre: 'Azúcar',      categoria: 'alacena',  comestibleDirecto: false, sprite: 'azucar_transparente', precio: 3 },
  { id: 'galletitas',  nombre: 'Galletitas',  categoria: 'alacena',  comestibleDirecto: true,  sprite: 'galletas_transparente', precio: 4 },

  // ── Heladera ───────────────────────────────────────────────────────
  { id: 'yogur',        nombre: 'Yogur',        categoria: 'heladera', comestibleDirecto: true,  sprite: 'yogurt', precio: 4 },
  { id: 'queso',        nombre: 'Queso',        categoria: 'heladera', comestibleDirecto: true,  sprite: 'queso_transparente', precio: 5 },
  { id: 'pan',          nombre: 'Pan',           categoria: 'heladera', comestibleDirecto: true,  sprite: 'pan_atado_transparente', precio: 4 },
  { id: 'huevos',       nombre: 'Huevos',        categoria: 'heladera', comestibleDirecto: false, sprite: 'huevos_transparente', precio: 4 },
  { id: 'hamburguesas', nombre: 'Hamburguesas',  categoria: 'heladera', comestibleDirecto: false, sprite: 'carne_cruda_transparente', precio: 6 },

  // ── Cosecha (comprable O cosechable en la Huerta) ─────────────────────
  // Solo las FRUTAS son comestibleDirecto (se comen crudas tal cual). Las
  // verduras (tomate/lechuga/zanahoria/remolacha/choclo) son ingredientes de
  // cocina, no snacks — quedaron con comestibleDirecto:true por error y
  // aparecían en el panel de comer rápido (pedido del usuario: sacarlas,
  // ahí solo van comida rápida/fruta/snack/yogur/comida preparada).
  { id: 'manzana',    nombre: 'Manzana',    categoria: 'cosecha', comestibleDirecto: true,  sprite: 'manzana_transparente' },
  { id: 'tomate',     nombre: 'Tomate',     categoria: 'cosecha', comestibleDirecto: false, sprite: 'tomate_transparente' },
  { id: 'lechuga',    nombre: 'Lechuga',    categoria: 'cosecha', comestibleDirecto: false, sprite: 'lechuga_transparente' },
  { id: 'zanahoria',  nombre: 'Zanahoria',  categoria: 'cosecha', comestibleDirecto: false, sprite: 'zanahorias_transparente' },
  { id: 'remolacha',  nombre: 'Remolacha',  categoria: 'cosecha', comestibleDirecto: false, sprite: 'remolacha_transparente' },
  { id: 'frutilla',   nombre: 'Frutilla',   categoria: 'cosecha', comestibleDirecto: true,  sprite: 'frutilla_transparente' },
  { id: 'choclo',     nombre: 'Choclo',     categoria: 'cosecha', comestibleDirecto: false, sprite: 'maiz_transparente' },
  { id: 'mandarina',  nombre: 'Mandarina',  categoria: 'cosecha', comestibleDirecto: true,  sprite: 'mandarina' },
  { id: 'naranja',    nombre: 'Naranja',    categoria: 'cosecha', comestibleDirecto: true,  sprite: 'naranja2_transparente' },
  { id: 'sandia',     nombre: 'Sandía',     categoria: 'cosecha', comestibleDirecto: true,  sprite: 'sandia_transparente' },

  // ── Platos preparados (resultado de cocinar; no son stock comprable, pero
  // sí quedan guardados hasta que se comen — pedido del usuario: antes se
  // servían solos apenas se cocinaban) ──
  { id: 'ensalada_armada',    nombre: 'Ensalada',              categoria: 'plato', comestibleDirecto: true, hambre: 18, sprite: 'ensalada_transparente' },
  { id: 'sandwich_armado',    nombre: 'Sandwich',              categoria: 'plato', comestibleDirecto: true, hambre: 20, sprite: 'sandwich_transparente' },
  { id: 'pastas_servidas',    nombre: 'Pastas',                categoria: 'plato', comestibleDirecto: true, hambre: 22, sprite: 'espagueti_albondiga_transparente' },
  { id: 'torta',              nombre: 'Torta',                 categoria: 'plato', comestibleDirecto: true, hambre: 25, sprite: 'torta_transparente' },
  { id: 'hamburguesa_armada', nombre: 'Hamburguesa',           categoria: 'plato', comestibleDirecto: true, hambre: 22, sprite: 'hamburguesa_transparente' },
];

// Helpers de consulta básicos sobre el catálogo (no dependen de Inventory).
const Products = {
  byId(id) {
    return PRODUCTS.find(p => p.id === id) || null;
  },
  byCategory(categoria) {
    return PRODUCTS.filter(p => p.categoria === categoria);
  },
  comestiblesDirecto() {
    return PRODUCTS.filter(p => p.comestibleDirecto);
  },
};
