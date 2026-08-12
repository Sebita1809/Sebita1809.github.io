const { Jimp, rgbaToInt } = require('jimp');
const path = require('path');

const INPUT  = path.join(__dirname, 'assets', 'sprites', 'personaje-nuevo.png');
const OUTPUT = path.join(__dirname, 'assets', 'sprites');

// ── Sprites a extraer ─────────────────────────────────────────────────────────
// Coordenadas (x1,y1,x2,y2) → convertidas a { x, y, w, h }
function rect(x1, y1, x2, y2) {
  return { x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
}

const SPRITES = [
  // Sprite principal
  { name: 'vero_idle',          ...rect(82,  158, 217, 473) },

  // Idle (parpadeo) — 4 frames
  { name: 'vero_idle1',         ...rect(312,  84, 379, 214) },
  { name: 'vero_idle2',         ...rect(395,  84, 461, 214) },
  { name: 'vero_idle3',         ...rect(479,  84, 546, 214) },
  { name: 'vero_idle4',         ...rect(560,  84, 627, 214) },

  // Caminando — 5 frames
  { name: 'vero_walk1',         ...rect( 654,  84,  723, 213) },
  { name: 'vero_walk2',         ...rect( 741,  84,  809, 213) },
  { name: 'vero_walk3',         ...rect( 827,  84,  896, 213) },
  { name: 'vero_walk4',         ...rect( 915,  84,  984, 213) },
  { name: 'vero_walk5',         ...rect(1004,  84, 1072, 213) },

  // Otras animaciones
  { name: 'vero_saludando',     ...rect(315, 271, 409, 365) },
  { name: 'vero_victoria',      ...rect(474, 270, 567, 365) },
  { name: 'vero_pensando',      ...rect(633, 271, 706, 363) },
  { name: 'vero_usando_objeto', ...rect(779, 270, 853, 365) },
  { name: 'vero_dano',          ...rect(915, 273,1006, 365) },

  // Variaciones de expresión
  { name: 'vero_feliz',         ...rect( 299, 500,  406, 660) },
  { name: 'vero_cansada',       ...rect( 454, 500,  554, 660) },
  { name: 'vero_aburrida',      ...rect( 582, 499,  660, 660) },
  { name: 'vero_debil',         ...rect( 687, 500,  829, 660) },
  { name: 'vero_colorada',      ...rect( 831, 499,  949, 660) },
  { name: 'vero_sorprendida',   ...rect( 981, 499, 1082, 660) },
];

// ── Remoción de fondo por flood-fill desde los bordes ────────────────────────
// Así nunca toca píxeles interiores del personaje, solo el fondo accesible.
let BG = null;
const TOLERANCE = 18;

function isBg(r, g, b) {
  return (
    Math.abs(r - BG.r) < TOLERANCE &&
    Math.abs(g - BG.g) < TOLERANCE &&
    Math.abs(b - BG.b) < TOLERANCE
  );
}

// Flood-fill iterativo desde todos los bordes del recorte.
// Devuelve un Set de índices "fondo" que se deben hacer transparentes.
function floodFillBorder(img, x0, y0, w, h) {
  const transparent = new Set();
  const queue = [];

  function key(x, y)  { return y * w + x; }
  function enqueue(x, y) {
    const k = key(x, y);
    if (transparent.has(k)) return;
    const si = img.getPixelIndex(x0 + x, y0 + y);
    const r = img.bitmap.data[si];
    const g = img.bitmap.data[si + 1];
    const b = img.bitmap.data[si + 2];
    if (!isBg(r, g, b)) return;
    transparent.add(k);
    queue.push([x, y]);
  }

  // Semillas: todos los píxeles del borde del recorte
  for (let x = 0; x < w; x++) { enqueue(x, 0); enqueue(x, h - 1); }
  for (let y = 1; y < h - 1; y++) { enqueue(0, y); enqueue(w - 1, y); }

  // BFS
  while (queue.length) {
    const [x, y] = queue.shift();
    if (x > 0)     enqueue(x - 1, y);
    if (x < w - 1) enqueue(x + 1, y);
    if (y > 0)     enqueue(x, y - 1);
    if (y < h - 1) enqueue(x, y + 1);
  }

  return transparent;
}

// ── Extracción ────────────────────────────────────────────────────────────────
async function extract() {
  console.log('Cargando personaje-nuevo.png...');
  const img = await Jimp.read(INPUT);
  const W = img.bitmap.width;
  const H = img.bitmap.height;
  console.log(`Imagen: ${W}x${H}px`);

  // Detectar color de fondo desde esquina superior-izquierda
  const idx0 = img.getPixelIndex(0, 0);
  BG = {
    r: img.bitmap.data[idx0],
    g: img.bitmap.data[idx0 + 1],
    b: img.bitmap.data[idx0 + 2],
  };
  console.log(`Fondo detectado: rgb(${BG.r}, ${BG.g}, ${BG.b}) ±${TOLERANCE}\n`);

  for (const sp of SPRITES) {
    // Flood-fill desde bordes para identificar solo el fondo externo
    const bgPixels = floodFillBorder(img, sp.x, sp.y, sp.w, sp.h);

    const cropped = new Jimp({ width: sp.w, height: sp.h, color: 0x00000000 });

    for (let dy = 0; dy < sp.h; dy++) {
      for (let dx = 0; dx < sp.w; dx++) {
        // Solo salta los píxeles de fondo accesibles desde el borde
        if (bgPixels.has(dy * sp.w + dx)) continue;

        const sx = sp.x + dx;
        const sy = sp.y + dy;
        if (sx >= W || sy >= H) continue;

        const si = img.getPixelIndex(sx, sy);
        const r  = img.bitmap.data[si];
        const g  = img.bitmap.data[si + 1];
        const b  = img.bitmap.data[si + 2];
        const a  = img.bitmap.data[si + 3];

        cropped.setPixelColor(rgbaToInt(r, g, b, a), dx, dy);
      }
    }

    const outPath = path.join(OUTPUT, `${sp.name}.png`);
    await cropped.write(outPath);
    console.log(`✅  ${sp.name}.png  (${sp.w}×${sp.h})`);
  }

  console.log('\n¡Listo! Sprites guardados en assets/sprites/');
}

extract().catch(err => console.error('❌ Error:', err.message));
