// El usuario mandó una segunda tanda de sprites, esta vez ya individuales
// (no hojas para recortar) y con nombres claros por combinación — mejor
// fuente que la extracción heurística de la v1 (que salió de 4 hojas
// compuestas y tenía más margen de error). Reemplaza los 12
// vero_{outfit}_{peinado}.png anteriores.
//
// Igual se pasa por el mismo recorte de componente conexo más grande que
// extract-plantas.js/extract-vero-outfits.js: alguna de estas imágenes
// traía un fragmento suelto en el borde (verificado a ojo en
// vero-rodete-vestido.png — una esquina de otro sprite colándose arriba).
const { Jimp } = require('jimp');
const path = require('path');

const DIR = path.join(__dirname, 'assets', 'sprites');
const PAD = 8;

const MAP = {
  'vero-pelo-suelto-pijama.png':    'vero_pijama_suelto.png',
  'vero-colita-pijama.png':         'vero_pijama_colita.png',
  'vero-trenza-pijama.png':         'vero_pijama_trenza.png',
  'vero-rodete-pijama.png':         'vero_pijama_rodete.png',
  'vero-pelo-suelto-jardinero.png': 'vero_jardinera_suelto.png',
  'vero-colita-jardinero.png':      'vero_jardinera_colita.png',
  'vero-trenza-jardinero.png':      'vero_jardinera_trenza.png',
  'vero-rodete-jardinero.png':      'vero_jardinera_rodete.png',
  'vero-pelo-suelto-vestido.png':   'vero_vestido_suelto.png',
  'vero-colita-vestido.png':        'vero_vestido_colita.png',
  'vero-trenza-vestido.png':        'vero_vestido_trenza.png',
  'vero-rodete-vestido.png':        'vero_vestido_rodete.png',
};

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

async function main() {
  for (const [src, dst] of Object.entries(MAP)) {
    const img = await Jimp.read(path.join(DIR, src));
    const cw = img.bitmap.width, ch = img.bitmap.height;
    const d = img.bitmap.data;
    const alphaAt = (x, y) => d[(y * cw + x) * 4 + 3];

    const comp = largestComponentBBox(cw, ch, alphaAt);
    const minX = Math.max(0, comp.minX - PAD);
    const minY = Math.max(0, comp.minY - PAD);
    const maxX = Math.min(cw - 1, comp.maxX + PAD);
    const maxY = Math.min(ch - 1, comp.maxY + PAD);

    const final = img.clone().crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
    await final.write(path.join(DIR, dst));
    console.log(`✅ ${src} → ${dst} (${final.bitmap.width}x${final.bitmap.height})`);
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
