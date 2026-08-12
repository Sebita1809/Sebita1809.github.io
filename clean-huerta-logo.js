// Borra el logo "sparkle" de Gemini de huerta.png (esquina inferior derecha,
// follaje denso + una ramita cruzando cerca).
// Intento 1 (clonado circular con feather): dejó un manchón visible y rompió
// la ramita — el follaje es demasiado irregular para clonar por
// desplazamiento fijo.
// Intento 2 (difusión sobre máscara ajustada por saturación): ya no rompía
// la ramita, pero el contorno negro de la ramita (pegado a la máscara)
// contaminaba el promedio y el relleno salía gris/oscuro en vez de verde.
// Intento 3 (offset fijo): mejoró la forma pero seguía siendo la MISMA
// figura de diamante, solo que rellena con lo que había en el punto de
// origen — como el origen tampoco era uniforme, quedó un diamante amarillo
// en vez de uno blanco. Mover una máscara con forma reconocible a cualquier
// lado sigue dejando esa forma reconocible.
// Intento 4 (bloques 4x4 desde un parche fijo lejano): rompió la forma pero
// el parche elegido resultó ser follaje "iluminado" (amarillo), más claro
// que el entorno inmediato del sparkle (verde oscuro) — quedó un rombo
// amarillento reconocible igual, por color, no por forma.
// Intento 5 (este, el que queda): la paleta de bloques sale del ANILLO
// alrededor de la propia máscara (mismo parche de hojas donde vive el
// sparkle, no uno importado de otro lado) y se excluyen los bloques
// "ramita" (rojizos) para que no se cuelen en el relleno — así los bloques
// sorteados ya son, por definición, la mezcla real de tonos oscuros/claros
// que hay ahí mismo.
const BLOCK = 4;
const { Jimp, rgbaToInt } = require('jimp');
const path = require('path');

const INPUT  = path.join(__dirname, 'assets', 'sprites', 'huerta.png');
const OUTPUT = path.join(__dirname, 'assets', 'sprites', 'huerta-limpia.png');

const BOX = { x: 1385, y: 2600, w: 65, h: 65 };
const MIN_BRIGHT = 88;
const MAX_SAT = 0.27;

function satOf(r, g, b) {
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  return max === 0 ? 0 : (max - min) / max;
}

async function main() {
  const img = await Jimp.read(INPUT);
  const d = img.bitmap.data;
  const W = img.bitmap.width;
  const idxOf = (x, y) => (y * W + x) * 4;

  // 1. Máscara del sparkle.
  const mask = new Set();
  for (let y = BOX.y; y < BOX.y + BOX.h; y++) {
    for (let x = BOX.x; x < BOX.x + BOX.w; x++) {
      const i = idxOf(x, y);
      const r = d[i], g = d[i + 1], b = d[i + 2];
      if (Math.max(r, g, b) > MIN_BRIGHT && satOf(r, g, b) < MAX_SAT) mask.add(`${x},${y}`);
    }
  }
  const dilated = new Set(mask);
  for (const key of mask) {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) dilated.add(`${x + dx},${y + dy}`);
  }
  console.log(`Máscara: ${dilated.size} píxeles`);

  // 2. Paleta de colores de BLOQUES (4x4), tomada del anillo alrededor de
  // la propia máscara (BOX expandido), excluyendo bloques de la máscara
  // misma y bloques "ramita" (rojizos: r bastante mayor que g y b).
  const RING = { x: BOX.x - 25, y: BOX.y - 25, w: BOX.w + 50, h: BOX.h + 50 };
  const palette = [];
  for (let y = RING.y; y < RING.y + RING.h; y += BLOCK) {
    for (let x = RING.x; x < RING.x + RING.w; x += BLOCK) {
      let sum = [0, 0, 0], n = 0, touchesMask = false;
      for (let by = 0; by < BLOCK; by++) {
        for (let bx = 0; bx < BLOCK; bx++) {
          if (dilated.has(`${x + bx},${y + by}`)) touchesMask = true;
          const i = idxOf(x + bx, y + by);
          sum[0] += d[i]; sum[1] += d[i + 1]; sum[2] += d[i + 2];
          n++;
        }
      }
      if (touchesMask) continue;
      const [r, g, b] = [sum[0] / n, sum[1] / n, sum[2] / n];
      if (r - g > 15 && r - b > 15) continue; // ramita rojiza, afuera
      palette.push([r, g, b]);
    }
  }
  console.log(`Paleta: ${palette.length} bloques`);

  // 3. Relleno: cada bloque de 4x4 que toca la máscara sortea UN color de
  // bloque de la paleta — todos los píxeles de la máscara dentro de ese
  // bloque comparten el mismo color, rompiendo la forma del diamante en
  // manchas irregulares sin dejar ninguna figura reconocible.
  const blockColor = new Map(); // "bx,by" -> [r,g,b]
  for (const key of dilated) {
    const [x, y] = key.split(',').map(Number);
    const bKey = `${Math.floor(x / BLOCK)},${Math.floor(y / BLOCK)}`;
    if (!blockColor.has(bKey)) {
      blockColor.set(bKey, palette[Math.floor(Math.random() * palette.length)]);
    }
    const [r, g, b] = blockColor.get(bKey);
    const di = idxOf(x, y);
    img.setPixelColor(rgbaToInt(Math.round(r), Math.round(g), Math.round(b), d[di + 3]), x, y);
  }

  await img.write(OUTPUT);
  console.log(`✅ ${OUTPUT}`);
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
