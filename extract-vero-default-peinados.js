// Recorta vero-default-peinados.png (1536x1024, hoja nueva del usuario):
// fila 0 (parada neutra) x 4 peinados (suelto/colita/trenza/rodete), con
// la prenda 'default' (remera roja + cargo). Antes 'default' no tenía
// NINGÚN sprite propio por peinado — RoomScene._veroIdleTexture() cortaba
// directo a vero_idle sin mirar el peinado elegido. Con estos 4 archivos
// ('vero_default_${peinado}.png') el peinado por fin se ve también con la
// ropa de todos los días, no solo con jardinera/pijama/vestido. La fila 1
// (sorprendida) no se usa — ya está cubierta por vero_default_${peinado}_
// sorprendida (vero-estados-variaciones.png).
//
// Los 4 personajes de la fila NO están parejo distribuidos en los 1536px
// (hay una franja negra vacía grande a la derecha) — en vez de asumir una
// grilla de 4 columnas iguales, se detectan los 4 componentes conexos más
// grandes de la mitad superior de la imagen y se ordenan por X.
const { Jimp } = require('jimp');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'sprites', 'vero-default-peinados.png');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'sprites');
const PAD = 6;

const PEINADOS_ORDER = ['suelto', 'colita', 'trenza', 'rodete'];

function components(img, y0, y1, minArea) {
  const fullW = img.bitmap.width;
  const h = y1 - y0;
  const d = img.bitmap.data;
  const alphaAt = (x, y) => d[((y + y0) * fullW + x) * 4 + 3];
  const visited = new Uint8Array(fullW * h);
  const comps = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < fullW; x++) {
      const idx = y * fullW + x;
      if (visited[idx] || alphaAt(x, y) <= 10) continue;
      let minX = x, maxX = x, minY = y, maxY = y, count = 0;
      const stack = [[x, y]];
      visited[idx] = 1;
      while (stack.length) {
        const [cx, cy] = stack.pop();
        count++;
        if (cx < minX) minX = cx; if (cx > maxX) maxX = cx;
        if (cy < minY) minY = cy; if (cy > maxY) maxY = cy;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
          const nx = cx + dx, ny = cy + dy;
          if (nx < 0 || nx >= fullW || ny < 0 || ny >= h) continue;
          const nIdx = ny * fullW + nx;
          if (visited[nIdx] || alphaAt(nx, ny) <= 10) continue;
          visited[nIdx] = 1;
          stack.push([nx, ny]);
        }
      }
      if (count >= minArea) comps.push({ minX, maxX, minY: minY + y0, maxY: maxY + y0, count });
    }
  }
  return comps;
}

async function main() {
  const img = await Jimp.read(INPUT);
  const H = img.bitmap.height;
  const comps = components(img, 0, H / 2, 3000);
  comps.sort((a, b) => b.count - a.count);
  const top4 = comps.slice(0, 4).sort((a, b) => a.minX - b.minX);
  console.log(`detectados ${comps.length} componentes grandes, usando los 4 más grandes`);

  for (let i = 0; i < 4; i++) {
    const c = top4[i];
    const box = {
      x: Math.max(0, c.minX - PAD),
      y: Math.max(0, c.minY - PAD),
      w: (c.maxX - c.minX + 1) + PAD * 2,
      h: (c.maxY - c.minY + 1) + PAD * 2,
    };
    const cropped = img.clone().crop(box);
    const outPath = path.join(OUTPUT_DIR, `vero_default_${PEINADOS_ORDER[i]}.png`);
    await cropped.write(outPath);
    console.log(`✅ ${path.basename(outPath)} (${cropped.bitmap.width}x${cropped.bitmap.height})`);
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
