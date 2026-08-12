// Recorta 6 de los 9 canteros de huerta-nueva.png (imagen nueva del
// usuario, reemplaza huerta-limpia.png — ver extract-huerta-canteros.js
// para el criterio original). La imagen nueva trae 9 canteros de distinto
// tamaño en diamante; el usuario pidió explícitamente que no hace falta
// usarlos los 9, con que 6 se vean/funcionen alcanza. Se eligieron 6 que
// dan una silueta de hexágono pareja (top/left/right/center/frontleft/
// frontright), salteando far-left/far-right/bottom-center (quedan como
// decoración sin cantero interactivo encima).
//
// Cajas medidas a mano con una grilla de referencia de 50px superpuesta
// sobre un recorte de la zona de canteros (mismo criterio "capturas
// ampliadas + grilla" que el resto de las salas).
const { Jimp } = require('jimp');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'sprites', 'huerta-nueva.png');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'sprites');

const BOXES = {
  cantero2_top:         { x: 1235, y: 810,  w: 280, h: 175 },
  cantero2_left:        { x: 960,  y: 935,  w: 290, h: 175 },
  cantero2_right:       { x: 1490, y: 935,  w: 290, h: 175 },
  cantero2_center:      { x: 1230, y: 1060, w: 285, h: 175 },
  cantero2_frontleft:   { x: 975,  y: 1180, w: 285, h: 180 },
  cantero2_frontright:  { x: 1490, y: 1180, w: 290, h: 180 },
};

async function main() {
  const img = await Jimp.read(INPUT);
  for (const [name, box] of Object.entries(BOXES)) {
    const cropped = img.clone().crop(box);
    const outPath = path.join(OUTPUT_DIR, `${name}.png`);
    await cropped.write(outPath);
    console.log(`✅ ${name}.png (${box.w}x${box.h})`);
  }
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
