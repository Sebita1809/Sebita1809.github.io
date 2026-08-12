// Recorta las 12 combinaciones prenda x peinado (3 prendas: pijama,
// jardinera, vestido — x 4 peinados: suelto, colita, trenza, rodete) de las
// 4 hojas que mandó el usuario. Mismo criterio que extract-plantas.js:
// componente conexo más grande dentro de cada celda generosa, para separar
// el dibujo de Vero de la etiqueta de texto ("ORIGINAL"/"COLITA"/etc. es un
// componente mucho más chico, se descarta solo).
const { Jimp } = require('jimp');
const path = require('path');

const DIR = path.join(__dirname, 'assets', 'sprites');
const PAD = 8;

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
  // ── Pijama y Jardinera: grilla 2x2 (ORIGINAL/COLITA arriba, trenza/rodete
  // abajo), mismas 4 celdas para ambas hojas.
  for (const [file, outfit, w, h] of [
    ['vero-pijama-peinados.png', 'pijama', 1408, 2944],
    ['vero-jardinera-peinados.png', 'jardinera', 1440, 2960],
  ]) {
    const img = await Jimp.read(path.join(DIR, file));
    const halfW = w / 2, halfH = h / 2;
    const cells = {
      suelto: { x: 0, y: 0, w: halfW, h: halfH },
      colita: { x: halfW, y: 0, w: halfW, h: halfH },
      trenza: { x: 0, y: halfH, w: halfW, h: halfH },
      rodete: { x: halfW, y: halfH, w: halfW, h: halfH },
    };
    for (const [peinado, box] of Object.entries(cells)) {
      await trimAndSave(img, box, path.join(DIR, `vero_${outfit}_${peinado}.png`));
    }
  }

  // ── Vestido: pila vertical de 3 (colita, trenza, rodete — sin "suelto",
  // ese sale de la hoja "clasico" más abajo).
  {
    const img = await Jimp.read(path.join(DIR, 'vero-vestido-peinados.png'));
    const w = 1504, h = 2804;
    const third = h / 3;
    const rows = [['colita', 0], ['trenza', third], ['rodete', third * 2]];
    for (const [peinado, y] of rows) {
      await trimAndSave(img, { x: 0, y, w, h: third }, path.join(DIR, `vero_vestido_${peinado}.png`));
    }
  }

  // ── Clasico: solo nos interesa el vestido+suelto (mitad inferior de la
  // hoja — pijama/jardinera+suelto ya salen mejor de sus propias hojas
  // etiquetadas arriba, no hace falta duplicar la extracción).
  {
    const img = await Jimp.read(path.join(DIR, 'vero-clasico-peinados-ropa.png'));
    const w = 1472, h = 2856;
    await trimAndSave(img, { x: 0, y: Math.floor(h * 0.55), w, h: Math.ceil(h * 0.45) }, path.join(DIR, 'vero_vestido_suelto.png'));
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
