// Borra el logo "sparkle" de Gemini de sala-actividades.png (maceta abajo a
// la derecha, sobre la tierra) — mismo problema que dormitorio/baño, pero
// acá se resuelve con inpaint por difusión (Jacobi) en vez de un parche
// clonado: la tierra es un degradé suave sin veta repetitiva que copiar, así
// que rellenar el agujero promediando los vecinos de a poco da mejor
// resultado que clonar un rectángulo de al lado (la maceta es chica, casi
// cualquier rectángulo vecino se come el borde de la maceta o el tallo).
const { Jimp, rgbaToInt } = require('jimp');
const path = require('path');

const INPUT  = path.join(__dirname, 'assets', 'sprites', 'sala-actividades.png');
const OUTPUT = path.join(__dirname, 'assets', 'sprites', 'sala-actividades-limpia.png');

// Bounding box de búsqueda alrededor del logo (medido a mano sobre capturas
// ampliadas 3x) — con margen de sobra para agarrar todo el brillo del sparkle.
const BOX = { x: 1385, y: 2600, w: 65, h: 65 };
const LUM_THRESHOLD = 94; // tierra base ~80-90, brillo del sparkle ~95-120
const ITERATIONS = 400;

function luminance(r, g, b) { return 0.299 * r + 0.587 * g + 0.114 * b; }

async function main() {
  const img = await Jimp.read(INPUT);
  const d = img.bitmap.data;
  const W = img.bitmap.width;

  const idxOf = (x, y) => (y * W + x) * 4;

  // 1. Máscara: píxeles del sparkle dentro del box.
  const mask = new Set();
  for (let y = BOX.y; y < BOX.y + BOX.h; y++) {
    for (let x = BOX.x; x < BOX.x + BOX.w; x++) {
      const i = idxOf(x, y);
      const lum = luminance(d[i], d[i + 1], d[i + 2]);
      if (lum > LUM_THRESHOLD) mask.add(`${x},${y}`);
    }
  }
  // Dilatar 1px para agarrar el halo suave del borde antialiaseado.
  const dilated = new Set(mask);
  for (const key of mask) {
    const [x, y] = key.split(',').map(Number);
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      dilated.add(`${x + dx},${y + dy}`);
    }
  }
  console.log(`Máscara: ${dilated.size} píxeles`);

  // 2. Semilla: cada píxel de la máscara arranca en el promedio de sus
  // vecinos NO enmascarados inmediatos (si tiene) o en el promedio global
  // del borde de la máscara.
  const values = new Map(); // key -> [r,g,b]
  for (const key of dilated) {
    const [x, y] = key.split(',').map(Number);
    let sum = [0, 0, 0], n = 0;
    for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
      const nx = x + dx, ny = y + dy;
      const nk = `${nx},${ny}`;
      if (!dilated.has(nk)) {
        const i = idxOf(nx, ny);
        sum[0] += d[i]; sum[1] += d[i+1]; sum[2] += d[i+2];
        n++;
      }
    }
    values.set(key, n > 0 ? [sum[0]/n, sum[1]/n, sum[2]/n] : [90, 55, 40]);
  }

  // 3. Difusión iterativa (Jacobi): cada píxel enmascarado se acerca al
  // promedio de sus 4 vecinos (enmascarados = valor actual, no enmascarados
  // = color original), reconstruyendo el degradé de la tierra sin costura.
  for (let it = 0; it < ITERATIONS; it++) {
    const next = new Map();
    for (const key of dilated) {
      const [x, y] = key.split(',').map(Number);
      let sum = [0, 0, 0], n = 0;
      for (const [dx, dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
        const nx = x + dx, ny = y + dy;
        const nk = `${nx},${ny}`;
        if (dilated.has(nk)) {
          const v = values.get(nk);
          sum[0] += v[0]; sum[1] += v[1]; sum[2] += v[2];
        } else {
          const i = idxOf(nx, ny);
          sum[0] += d[i]; sum[1] += d[i+1]; sum[2] += d[i+2];
        }
        n++;
      }
      next.set(key, [sum[0]/n, sum[1]/n, sum[2]/n]);
    }
    for (const [k, v] of next) values.set(k, v);
  }

  // 4. Escribir de vuelta.
  for (const key of dilated) {
    const [x, y] = key.split(',').map(Number);
    const [r, g, b] = values.get(key);
    const i = idxOf(x, y);
    img.setPixelColor(rgbaToInt(Math.round(r), Math.round(g), Math.round(b), d[i + 3]), x, y);
  }

  await img.write(OUTPUT);
  console.log(`✅ ${OUTPUT}`);
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
