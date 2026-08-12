// Recorta los sprites de crecimiento de plantas de plantas_sin_fondo.png
// (hoja con 10 especies, provista por el usuario).
//
// La hoja tiene errores reales de contenido/rotulado — verificado
// imagen por imagen a resolución completa, NO confiando en el texto
// impreso (que en varias celdas está mal o pertenece a otra fila):
//   - Fila 0 derecha (impresa "FRUTILLA"): contenido real = CHOCLO
//     (maíz, inconfundible). Se usa para choclo.
//   - Fila 1 derecha (impresa "MANDARINA"): la celda 1 (brote genérico)
//     y la celda 3 (árbol con fruta rojo-anaranjada) SÍ son cítricos —
//     se usan para mandarina. La celda 2 (flor blanca + una frutilla)
//     es en realidad FRUTILLA, mezclada por error en esta fila.
//   - Fila 4 izquierda, celda 1 (impresa "FRUTILLA"): sí es frutilla
//     (brote con capullo) — las celdas 2 y 3 de esa fila son choclo
//     roto, se descartan (choclo ya sale limpio de la fila 0 derecha).
//   - El resto (Lechuga, Zanahoria, Tomate, Remolacha, Naranja, Manzana,
//     Sandía) coincide con lo impreso.
//
// Con esto, Frutilla y Mandarina terminan con solo 2 imágenes confiables
// cada una (no 3) — se usan igual que Lechuga (que la hoja tampoco trae
// con 3 etapas): creciendo/lista, sin etapa intermedia. Si el usuario
// manda una hoja más prolija de estas dos especies más adelante, alcanza
// con re-recortar y sobreescribir sus 2 archivos.
const { Jimp } = require('jimp');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'sprites', 'plantas_sin_fondo.png');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'sprites');
const ROW_HEIGHT = 307;
const PAD = 6;

// [especie]: { growing: [row, x0, x1], ready: [row, x0, x1] }
const ENTRIES = {
  lechuga:   { growing: [0, 403, 617],   ready: [0, 1118, 1345] },
  zanahoria: { growing: [1, 428, 596],   ready: [1, 1117, 1343] },
  tomate:    { growing: [2, 428, 597],   ready: [2, 1136, 1328] },
  remolacha: { growing: [3, 428, 597],   ready: [3, 1113, 1360] },
  choclo:    { growing: [0, 1873, 2004], ready: [0, 2543, 2728] }, // fila impresa "Frutilla", contenido real = choclo
  frutilla:  { growing: [4, 408, 622],   ready: [1, 2203, 2419] }, // creciendo: fila 4 izq ("Frutilla" impreso, correcto); lista: fila 1 der ("Mandarina" impreso, contenido real = frutilla)
  mandarina: { growing: [1, 1853, 2020], ready: [1, 2522, 2761] }, // fila impresa "Mandarina", celdas 1 y 3 sí son cítricos
  naranja:   { growing: [2, 1854, 2021], ready: [2, 2522, 2765] },
  manzana:   { growing: [3, 1853, 2020], ready: [3, 2526, 2751] },
  sandia:    { growing: [4, 1861, 2079], ready: [4, 2511, 2777] },
};

// Algunas celdas tienen un fragmento SUELTO de la fila de arriba/abajo
// colándose en el recorte generoso (un pedacito de maceta/tallo de la
// planta vecina, sin conexión real con la planta que nos importa). Una caja
// del bounding box de TODO lo no transparente agarraría ese fragmento
// también — en vez de eso, se buscan componentes conexos (flood-fill 4-way)
// y se usa solo el más grande (la planta real siempre es mucho más grande
// que el fragmento suelto).
function largestComponentBBox(cw, ch, alphaAt) {
  const visited = new Uint8Array(cw * ch);
  let best = null;

  for (let sy = 0; sy < ch; sy++) {
    for (let sx = 0; sx < cw; sx++) {
      const startIdx = sy * cw + sx;
      if (visited[startIdx] || alphaAt(sx, sy) <= 10) continue;

      let minX = sx, maxX = sx, minY = sy, maxY = sy, count = 0;
      const stack = [[sx, sy]];
      visited[startIdx] = 1;
      while (stack.length) {
        const [x, y] = stack.pop();
        count++;
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = x + dx, ny = y + dy;
          if (nx < 0 || nx >= cw || ny < 0 || ny >= ch) continue;
          const nIdx = ny * cw + nx;
          if (visited[nIdx] || alphaAt(nx, ny) <= 10) continue;
          visited[nIdx] = 1;
          stack.push([nx, ny]);
        }
      }
      if (!best || count > best.count) best = { minX, maxX, minY, maxY, count };
    }
  }
  return best;
}

async function trimAndSave(img, box, outPath) {
  const { x0, x1, y0, y1 } = box;
  const cropped = img.clone().crop({ x: x0, y: y0, w: x1 - x0, h: y1 - y0 });

  const cw = cropped.bitmap.width, ch = cropped.bitmap.height;
  const d = cropped.bitmap.data;
  const alphaAt = (x, y) => d[(y * cw + x) * 4 + 3];

  const comp = largestComponentBBox(cw, ch, alphaAt);
  if (!comp) throw new Error(`Sin contenido en ${outPath}`);

  const minX = Math.max(0, comp.minX - PAD);
  const minY = Math.max(0, comp.minY - PAD);
  const maxX = Math.min(cw - 1, comp.maxX + PAD);
  const maxY = Math.min(ch - 1, comp.maxY + PAD);

  const final = cropped.clone().crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
  await final.write(outPath);
  console.log(`✅ ${path.basename(outPath)} (${final.bitmap.width}x${final.bitmap.height})`);
}

async function main() {
  const img = await Jimp.read(INPUT);

  for (const [especie, def] of Object.entries(ENTRIES)) {
    for (const stage of ['growing', 'ready']) {
      const [row, x0, x1] = def[stage];
      const y0 = row * ROW_HEIGHT;
      const y1 = Math.min(img.bitmap.height, y0 + ROW_HEIGHT);
      const outPath = path.join(OUTPUT_DIR, `planta_${especie}_${stage}.png`);
      await trimAndSave(img, { x0, x1, y0, y1 }, outPath);
    }
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
