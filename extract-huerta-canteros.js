// Recorta los 6 canteros de huerta-limpia.png directo del fondo (mismo
// criterio que BATHROOM_BOXES/BEDROOM_BOXES/ACTIVITY_BOXES) — cajas medidas
// a mano con capturas ampliadas + grilla de referencia, igual que el resto
// de las salas.
const { Jimp } = require('jimp');
const path = require('path');

const INPUT = path.join(__dirname, 'assets', 'sprites', 'huerta-limpia.png');
const OUTPUT_DIR = path.join(__dirname, 'assets', 'sprites');

const BOXES = {
  cantero_top:      { x: 460,  y: 1175, w: 770, h: 420 },
  cantero_left:     { x: 85,   y: 1390, w: 590, h: 420 },
  cantero_right:    { x: 1065, y: 1470, w: 445, h: 440 },
  cantero_farleft:  { x: 0,    y: 1595, w: 470, h: 440 },
  cantero_center:   { x: 660,  y: 1700, w: 610, h: 460 },
  cantero_front:    { x: 420,  y: 1930, w: 630, h: 450 },
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
