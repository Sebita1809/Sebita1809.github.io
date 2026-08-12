// Recorta el margen transparente de cepillo_sin_fondo.png y mano_sin_fondo.png
// (tasks.md 4.3/4.4 — sprites nuevos para cepillar/shampoo) al bounding box real
// del contenido con alpha>0 + padding chico, mismo motivo que pergamino_recortado.png
// (BootScene.js): sin recortar, escalados a un tamaño chico (cursor de TimingBar /
// ícono de mano) quedan casi invisibles por el margen transparente.
const { Jimp } = require('jimp');
const path = require('path');

const DIR = path.join(__dirname, 'assets', 'sprites');
const PAD = 12;

async function trim(inputName, outputName) {
  const img = await Jimp.read(path.join(DIR, inputName));
  const W = img.bitmap.width;
  const H = img.bitmap.height;

  let minX = W, minY = H, maxX = -1, maxY = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const idx = img.getPixelIndex(x, y);
      const a = img.bitmap.data[idx + 3];
      if (a > 10) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }

  if (maxX < 0) throw new Error(`${inputName}: no se encontró contenido con alpha`);

  minX = Math.max(0, minX - PAD);
  minY = Math.max(0, minY - PAD);
  maxX = Math.min(W - 1, maxX + PAD);
  maxY = Math.min(H - 1, maxY + PAD);
  const w = maxX - minX + 1;
  const h = maxY - minY + 1;

  const cropped = img.clone().crop({ x: minX, y: minY, w, h });
  const outPath = path.join(DIR, outputName);
  await cropped.write(outPath);
  console.log(`✅ ${outputName}  (${w}x${h}, de ${W}x${H})`);
}

async function main() {
  await trim('cepillo_sin_fondo.png', 'cepillo_recortado.png');
  await trim('mano_sin_fondo.png', 'mano_recortada.png');
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
