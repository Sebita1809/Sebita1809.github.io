// Recorta las etapas de crecimiento (plántula/crecida/con frutos) de
// canteros-por-planta.png (hoja nueva del usuario, 5 filas x 5 columnas:
// cada fila trae una verdura de 2 etapas a la izquierda + una fruta de 3
// etapas a la derecha). Cajas encontradas por detección de componentes
// conexos (find_cells.js, ver historial) — la hoja NO trae alfa real (todo
// el canvas tiene alpha=255; el cuadriculado de "transparencia" está
// pintado como píxeles gris/blanco), así que además de recortar hace
// falta reconstruir la transparencia a mano clasificando por color.
//
// La fila 4 (impresa "FRUTILLA (PLÁNTULA)"/"FRUTILLA (CRECIDA)" en las
// columnas 0-1) es un error de la hoja: duplica la fila 0 en vez de traer
// choclo — se descarta (SKIP). Choclo se queda con su arte viejo de 2
// etapas (planta_choclo_growing/ready, ver extract-plantas.js), no hay
// arte nuevo para esa especie.
const { Jimp } = require('jimp');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'sprites', 'canteros-por-planta.png');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'sprites');
const PAD = 5;

// [especie]: { etapa: [x0, y0, x1, y1] } — coordenadas del bounding box ya
// detectado (componente conexo), sin padding todavía.
const ENTRIES = {
  lechuga:   { plantula: [116, 94, 297, 213],  crecida: [422, 85, 606, 212] },
  zanahoria: { plantula: [116, 273, 294, 419], crecida: [426, 273, 605, 420] },
  tomate:    { plantula: [120, 485, 293, 596], crecida: [430, 475, 604, 598] },
  remolacha: { plantula: [123, 643, 294, 754], crecida: [432, 635, 604, 754] },
  frutilla:  { plantula: [737, 95, 920, 213],  crecida: [1061, 85, 1241, 213],  confrutos: [1386, 85, 1568, 213] },
  mandarina: { plantula: [740, 288, 919, 421], crecida: [1061, 281, 1240, 421], confrutos: [1386, 268, 1563, 420] },
  naranja:   { plantula: [745, 477, 918, 599], crecida: [1066, 475, 1239, 599], confrutos: [1389, 475, 1561, 599] },
  manzana:   { plantula: [747, 635, 917, 757], crecida: [1066, 635, 1238, 756], confrutos: [1389, 635, 1560, 756] },
  sandia:    { plantula: [751, 805, 914, 913], crecida: [1066, 805, 1232, 914], confrutos: [1388, 805, 1555, 914] },
};

// Fondo de la hoja: cuadriculado gris/blanco pintado como píxeles opacos
// (no hay canal alfa real) — mismo criterio de detección que find_cells.js.
function isBg(r, g, b) {
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b);
  return (mx - mn) < 10 && (r + g + b) / 3 > 195;
}

async function main() {
  const img = await Jimp.read(INPUT);
  const fullW = img.bitmap.width, fullH = img.bitmap.height;

  for (const [especie, etapas] of Object.entries(ENTRIES)) {
    for (const [etapa, [x0, y0, x1, y1]] of Object.entries(etapas)) {
      const cx0 = Math.max(0, x0 - PAD), cy0 = Math.max(0, y0 - PAD);
      const cx1 = Math.min(fullW, x1 + PAD), cy1 = Math.min(fullH, y1 + PAD);
      const cropped = img.clone().crop({ x: cx0, y: cy0, w: cx1 - cx0, h: cy1 - cy0 });

      const cw = cropped.bitmap.width, ch = cropped.bitmap.height;
      const d = cropped.bitmap.data;
      for (let py = 0; py < ch; py++) {
        for (let px = 0; px < cw; px++) {
          const i = (py * cw + px) * 4;
          if (isBg(d[i], d[i + 1], d[i + 2])) d[i + 3] = 0;
        }
      }

      const outPath = path.join(OUTPUT_DIR, `planta_${especie}_${etapa}.png`);
      await cropped.write(outPath);
      console.log(`✅ ${path.basename(outPath)} (${cw}x${ch})`);
    }
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
