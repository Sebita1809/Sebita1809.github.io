// Recorta nuevos-sprites-plantas.png (1254x1254, hoja nueva del usuario:
// SOLO la planta, sin el cajón/cantero — reemplaza el intento anterior de
// superponer el cantero completo, que se veía feo pegado sobre el cantero
// ya dibujado en el fondo, ver [[opsx/etapa-2-salas/garden-v2]]). Grilla de
// 5 filas x 5 columnas, misma estructura que canteros-por-planta.png:
// columnas 0-1 = verdura de 2 etapas (plántula/crecida), columnas 2-4 =
// fruta de 3 etapas (plántula/crecida/con frutos) — con la mejora de que
// esta hoja SÍ trae choclo en la fila 4 (antes faltaba) y SÍ trae alfa
// real (a diferencia de la hoja de canteros).
//
// Pedido del usuario: un sombreado suave en la base de cada planta para
// simular que está enterrada en la tierra (si no, el corte se ve muy
// brusco contra la tierra del cantero del fondo) — ver addGroundShadow.
const { Jimp } = require('jimp');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'sprites', 'nuevos-sprites-plantas.png');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'sprites');
const PAD_SIDE = 6, PAD_TOP = 6, PAD_BOTTOM = 18; // más aire abajo para que entre la sombra

const ROWS = [
  { veg: 'lechuga',   fruit: 'frutilla' },
  { veg: 'zanahoria', fruit: 'mandarina' },
  { veg: 'tomate',    fruit: 'naranja' },
  { veg: 'remolacha', fruit: 'manzana' },
  { veg: 'choclo',    fruit: 'sandia' },
];
const VEG_STAGES = ['plantula', 'crecida'];   // choclo usa 'growing'/'ready' (ver más abajo)
const CHOCLO_STAGES = ['growing', 'ready'];
const FRUIT_STAGES = ['plantula', 'crecida', 'confrutos'];

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

// Baja un poco el brillo de la planta (pedido del usuario) — multiplica
// RGB por BRIGHTNESS, sin tocar alfa. Antes de la sombra, para que el
// blend de la sombra parta de los colores ya atenuados.
const BRIGHTNESS = 0.85;
function dim(img) {
  const w = img.bitmap.width, h = img.bitmap.height;
  const d = img.bitmap.data;
  for (let i = 0; i < d.length; i += 4) {
    if (d[i + 3] === 0) continue;
    d[i] = Math.round(d[i] * BRIGHTNESS);
    d[i + 1] = Math.round(d[i + 1] * BRIGHTNESS);
    d[i + 2] = Math.round(d[i + 2] * BRIGHTNESS);
  }
}

// Centro X del tallo/base de la planta — el centro horizontal de TODA la
// imagen (usado antes) no sirve para plantas que se inclinan o tienen el
// follaje asimétrico (la sombra quedaba debajo de las hojas, no del
// tallo, pedido del usuario de corregir esto): se promedia el X de los
// píxeles no transparentes SOLO en el 15% inferior de la imagen, que es
// donde está el tallo/raíz angosto, no la copa ancha de arriba.
function stemCenterX(w, h, alphaAt) {
  const y0 = Math.floor(h * 0.85);
  let sum = 0, count = 0;
  for (let y = y0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (alphaAt(x, y) > 10) { sum += x; count++; }
    }
  }
  return count > 0 ? sum / count : w / 2;
}

// Sombra elíptica plana pegada al borde inferior de la imagen final,
// centrada en el tallo (stemCenterX) — simula la planta "enterrada": donde
// el pixel ya es parte de la planta se oscurece un poco (blend hacia
// sombraColor), donde es fondo transparente se pinta un parche oscuro
// semitransparente (para que se note como sombra proyectada sobre la
// tierra del cantero real, detrás).
function addGroundShadow(img) {
  const w = img.bitmap.width, h = img.bitmap.height;
  const d = img.bitmap.data;
  const alphaAt = (x, y) => d[(y * w + x) * 4 + 3];
  const cx = stemCenterX(w, h, alphaAt);
  const baseY = h - 1;
  const rx = w * 0.3, ry = Math.max(5, h * 0.08);
  const shadowColor = [20, 12, 6];
  const maxAlpha = 130;

  for (let y = Math.max(0, h - Math.ceil(ry * 2.2)); y < h; y++) {
    for (let x = 0; x < w; x++) {
      const nx = (x - cx) / rx;
      const ny = (y - baseY) / ry;
      const dist = Math.sqrt(nx * nx + ny * ny);
      if (dist >= 1) continue;
      const shadowAlpha = maxAlpha * (1 - dist) * (1 - dist);
      const i = (y * w + x) * 4;
      const existingAlpha = d[i + 3];
      if (existingAlpha === 0) {
        d[i] = shadowColor[0]; d[i + 1] = shadowColor[1]; d[i + 2] = shadowColor[2];
        d[i + 3] = Math.round(shadowAlpha);
      } else {
        const mix = shadowAlpha / 255;
        d[i] = Math.round(d[i] * (1 - mix) + shadowColor[0] * mix);
        d[i + 1] = Math.round(d[i + 1] * (1 - mix) + shadowColor[1] * mix);
        d[i + 2] = Math.round(d[i + 2] * (1 - mix) + shadowColor[2] * mix);
      }
    }
  }
}

async function trimAndSave(img, box, outPath) {
  const cropped = img.clone().crop(box);
  const cw = cropped.bitmap.width, ch = cropped.bitmap.height;
  const d = cropped.bitmap.data;
  const alphaAt = (x, y) => d[(y * cw + x) * 4 + 3];

  const comp = largestComponentBBox(cw, ch, alphaAt);
  if (!comp) throw new Error(`Sin contenido en ${outPath}`);

  const minX = Math.max(0, comp.minX - PAD_SIDE);
  const minY = Math.max(0, comp.minY - PAD_TOP);
  const maxX = Math.min(cw - 1, comp.maxX + PAD_SIDE);
  const maxY = Math.min(ch - 1, comp.maxY + PAD_BOTTOM);

  const final = cropped.clone().crop({ x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 });
  dim(final);
  addGroundShadow(final);
  await final.write(outPath);
  console.log(`✅ ${path.basename(outPath)} (${final.bitmap.width}x${final.bitmap.height})`);
}

async function main() {
  const img = await Jimp.read(INPUT);
  const W = img.bitmap.width, H = img.bitmap.height;
  const cellW = W / 5, cellH = H / 5;

  for (let row = 0; row < 5; row++) {
    const { veg, fruit } = ROWS[row];
    const vegStages = veg === 'choclo' ? CHOCLO_STAGES : VEG_STAGES;
    for (let col = 0; col < vegStages.length; col++) {
      const box = { x: Math.round(col * cellW), y: Math.round(row * cellH), w: Math.round(cellW), h: Math.round(cellH) };
      await trimAndSave(img, box, path.join(OUTPUT_DIR, `planta_${veg}_${vegStages[col]}.png`));
    }
    for (let i = 0; i < FRUIT_STAGES.length; i++) {
      const col = 2 + i;
      const box = { x: Math.round(col * cellW), y: Math.round(row * cellH), w: Math.round(cellW), h: Math.round(cellH) };
      await trimAndSave(img, box, path.join(OUTPUT_DIR, `planta_${fruit}_${FRUIT_STAGES[i]}.png`));
    }
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
