// Recorta vero-estados-variaciones.png (1536x1024, hoja nueva del usuario):
// grilla de 4 filas (peinados, mismo orden que PEINADOS: suelto/colita/
// trenza/rodete) x 4 grupos de 2 columnas (prendas: default/jardinera/
// pijama/vestido — confirmado visual contra vero_idle.png/vero_vestido_
// suelto.png etc, el look de cada grupo coincide 1:1). Dentro de cada
// grupo: columna izquierda = "hambrienta" (con globo de pensamiento y un
// muslito 🍗), columna derecha = "sorprendida" (boca bien abierta, sin
// globo). Mismo criterio que extract-vero-outfits.js: componente conexo
// más grande dentro de cada celda generosa (la hoja SÍ trae alfa real,
// a diferencia de canteros-por-planta.png).
const { Jimp } = require('jimp');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'sprites', 'vero-estados-variaciones.png');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'sprites');
const PAD = 6;

const PEINADOS_ROW = ['suelto', 'colita', 'trenza', 'rodete'];
const OUTFIT_GROUP = ['default', 'jardinera', 'pijama', 'vestido'];
const ESTADOS = ['hambrienta', 'sorprendida'];

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
  const cropped = img.clone().crop(box);
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
  const W = img.bitmap.width, H = img.bitmap.height;
  const cellW = W / 8, cellH = H / 4;

  for (let row = 0; row < 4; row++) {
    const peinado = PEINADOS_ROW[row];
    for (let group = 0; group < 4; group++) {
      const outfit = OUTFIT_GROUP[group];
      for (let sub = 0; sub < 2; sub++) {
        const estado = ESTADOS[sub];
        const col = group * 2 + sub;
        const box = { x: Math.round(col * cellW), y: Math.round(row * cellH), w: Math.round(cellW), h: Math.round(cellH) };
        const outPath = path.join(OUTPUT_DIR, `vero_${outfit}_${peinado}_${estado}.png`);
        await trimAndSave(img, box, outPath);
      }
    }
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
