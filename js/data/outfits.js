// Prendas de Vero (Etapa 3, personalización — tasks.md 3.7). Cada una usa
// siempre su versión de pelo suelto — la clave de textura es
// `vero_${outfit}_suelto` (ver RoomScene._veroIdleTexture), incluido
// 'default' (que antes usaba 'vero_idle' directo; ahora tiene su propia
// versión "suelto" — mismo look, ver vero-default-peinados.png). Sprites
// recortados con extract-vero-outfits.js / extract-vero-default-
// peinados.js.
//
// Antes existía elección de peinado (Suelto/Colita/Trenza/Rodete) — se
// sacó a pedido del usuario: no le convencía la diferencia de calidad
// entre las variantes generadas y prefirió una sola versión consistente
// por prenda.
const OUTFITS = [
  { id: 'default',   nombre: 'Ropa de todos los días' },
  { id: 'pijama',    nombre: 'Pijama' },
  { id: 'jardinera', nombre: 'Jardinería' },
  { id: 'vestido',   nombre: 'Vestido de salida' },
];

const Outfits = {
  byId(id) {
    return OUTFITS.find(o => o.id === id) || OUTFITS[0];
  },
};
