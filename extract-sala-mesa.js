// Recorta la mesa de juego de mesa (único objeto interactivo de la Sala de
// actividades, design D7) directo del fondo ya limpio — mismo criterio que
// BATHROOM_BOXES/BEDROOM_BOXES: recorte rectangular exacto, sin flood-fill de
// fondo (no hace falta transparencia, el objeto ocupa toda su caja).
const { Jimp } = require('jimp');
const path = require('path');

const INPUT  = path.join(__dirname, 'assets', 'sprites', 'sala-actividades-limpia.png');
const OUTPUT = path.join(__dirname, 'assets', 'sprites', 'sala_mesa.png');
const BOX = { x: 600, y: 1650, w: 770, h: 560 };

async function main() {
  const img = await Jimp.read(INPUT);
  const cropped = img.clone().crop(BOX);
  await cropped.write(OUTPUT);
  console.log(`✅ ${OUTPUT} (${BOX.w}x${BOX.h})`);
}

main().catch(err => { console.error('❌ Error:', err.message); process.exit(1); });
