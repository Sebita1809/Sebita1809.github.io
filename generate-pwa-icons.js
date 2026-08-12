// Genera los íconos de la PWA (manifest.json) a partir de la cara de Vero
// (vero_idle.png, recorte de la cabeza+hombros — a tamaño de ícono el
// cuerpo completo queda ilegible). Fondo sólido del mismo color que el
// juego (#1a1a2e) en vez de transparente: los launchers de Android pintan
// blanco detrás de los íconos con alfa, se ve mal contra el pixel art.
//
// 4 archivos: "any" (192/512, el ícono se ve completo) y "maskable"
// (192/512, con más aire alrededor — Android puede recortarlo a un
// círculo/squircle, el estándar pide que el contenido importante quede
// dentro del 80% central).
const { Jimp } = require('jimp');
const path = require('path');

const OUT = path.join(__dirname, 'assets', 'icons');
const BG = 0x1a1a2eff;

async function makeIcon(faceCrop, canvasSize, faceFrac, outPath) {
  const canvas = new Jimp({ width: canvasSize, height: canvasSize, color: BG });
  const faceSize = Math.round(canvasSize * faceFrac);
  const resizedFace = faceCrop.clone().resize({ w: faceSize, h: faceSize * (faceCrop.bitmap.height / faceCrop.bitmap.width) });
  const fx = Math.round((canvasSize - resizedFace.bitmap.width) / 2);
  const fy = Math.round((canvasSize - resizedFace.bitmap.height) / 2.3); // un poco más arriba que el centro (cara, no cuerpo)
  canvas.composite(resizedFace, fx, fy);
  await canvas.write(outPath);
  console.log(`✅ ${path.basename(outPath)} (${canvasSize}x${canvasSize})`);
}

async function main() {
  const src = await Jimp.read(path.join(__dirname, 'assets', 'sprites', 'vero_idle.png'));
  // Cabeza + hombros — el resto del cuerpo no aporta a tamaño de ícono.
  const face = src.clone().crop({ x: 0, y: 0, w: src.bitmap.width, h: Math.round(src.bitmap.height * 0.48) });

  await makeIcon(face, 512, 0.82, path.join(OUT, 'icon-512.png'));
  await makeIcon(face, 192, 0.82, path.join(OUT, 'icon-192.png'));
  await makeIcon(face, 512, 0.62, path.join(OUT, 'icon-maskable-512.png'));
  await makeIcon(face, 192, 0.62, path.join(OUT, 'icon-maskable-192.png'));
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
