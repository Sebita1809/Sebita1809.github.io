// Inventario compartido entre Cocina y Huerta (design D8/D9, tasks.md 1.5).
//
// Resuelto por diseño (Open Question 2, parcial): es UN SOLO inventario — lo
// cosechado en la Huerta cae al mismo stock que lo comprado/repuesto en la
// Cocina. Esta clase modela ESE dato compartido y las operaciones que ambas
// salas necesitan (consultar cantidad, sumar/restar, listar por categoría,
// chequear y cocinar una receta).
//
// RESUELTO (tasks.md "monedas y mercado", cierra Open Question 2): las
// monedas se ganan cocinando (RECETAS[].coins, ver recetas.js) y cosechando
// en la Huerta (PLANTS[].harvestCoins, ver plants.js); se gastan en semillas
// (PLANTS[].seedCost) y en el Mercado de la Cocina, que vende los productos
// NO cosechables (Fideos, Harina, Azúcar, Queso, Pan, Huevos, Hamburguesas —
// botón de compra agregado directo a los paneles de Heladera/Alacena que ya
// existían, ver KitchenScene._comprarProducto). `coins` arranca en
// STARTING_COINS (no en 0) para que el circuito no quede trabado el primer
// día: sin algo de saldo inicial, el jugador no podría comprar ni la
// semilla más barata para arrancar a ganar monedas. 60 (antes 20, pedido
// del usuario) — solo aplica a partidas nuevas: si ya hay un guardado,
// BootScene pisa esto con SaveManager.applyTo().
const STARTING_COINS = 60;

class Inventory {
  constructor(seed = {}) {
    this._qty = { ...seed };
    this.coins = STARTING_COINS;
  }

  addCoins(cantidad) {
    this.coins += cantidad;
    return this.coins;
  }

  // Devuelve false sin descontar nada si no alcanza — quien llama decide
  // qué hacer (no completar la compra/plantado, mostrar feedback, etc.).
  spendCoins(cantidad) {
    if (this.coins < cantidad) return false;
    this.coins -= cantidad;
    return true;
  }

  get(productId) {
    return this._qty[productId] || 0;
  }

  has(productId, cantidad = 1) {
    return this.get(productId) >= cantidad;
  }

  add(productId, cantidad = 1) {
    this._qty[productId] = this.get(productId) + cantidad;
    return this._qty[productId];
  }

  remove(productId, cantidad = 1) {
    if (!this.has(productId, cantidad)) return false;
    this._qty[productId] -= cantidad;
    return true;
  }

  // Lista los productos de una categoría (design D9) con su cantidad actual,
  // para pintar los paneles de Heladera/Alacena directamente.
  listByCategory(categoria) {
    return Products.byCategory(categoria).map(p => ({ ...p, cantidad: this.get(p.id) }));
  }

  // Igual que listByCategory pero juntando varias categorías en una sola
  // lista (pedido del usuario: el panel Heladera muestra 'heladera' +
  // 'cosecha' juntos, porque antes las frutas/verduras no se veían en
  // ningún panel aunque sí tenían stock usable en recetas/comer rápido).
  listByCategories(categorias) {
    return categorias.flatMap(c => this.listByCategory(c));
  }

  // ── Recetas (D8: recetario) ──────────────────────────────────────────
  // Resuelve un ingrediente { productId, cantidad } o { anyOf, cantidad }
  // a un productId concreto disponible en stock, o null si ninguno alcanza.
  _resolveIngredient(ing) {
    if (ing.productId) return this.has(ing.productId, ing.cantidad) ? ing.productId : null;
    const found = (ing.anyOf || []).find(id => this.has(id, ing.cantidad));
    return found || null;
  }

  canCraft(recetaId) {
    const receta = Recetas.byId(recetaId);
    if (!receta) return false;
    return receta.ingredientes.every(ing => this._resolveIngredient(ing) !== null);
  }

  // Consume los ingredientes, SUMA 1 del plato resultado al stock (pedido
  // del usuario: cocinar prepara y guarda, no sirve el plato solo) y
  // devuelve el id del resultado, o null si falta algo (no consume nada en
  // ese caso). Esta clase solo mueve inventario, no toca StatsSystem — comer
  // el plato preparado es responsabilidad de quien llama (ver KitchenScene
  // _eatQuick, que ahora también cicla platos con comestibleDirecto: true).
  craft(recetaId) {
    const receta = Recetas.byId(recetaId);
    if (!receta || !this.canCraft(recetaId)) return null;

    receta.ingredientes.forEach(ing => {
      const productId = this._resolveIngredient(ing);
      this.remove(productId, ing.cantidad);
    });
    this.add(receta.resultado, 1);

    return receta.resultado;
  }
}
