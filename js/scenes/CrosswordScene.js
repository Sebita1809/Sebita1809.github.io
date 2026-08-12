// Minijuego Crucigrama — 10 temas de cultura general (elementos químicos,
// animales, países, inventos, científicos, cuerpo humano, deportes,
// espacio, instrumentos musicales, mitología griega), ~10 palabras cada
// uno. Acceso: menú de minijuegos de la Sala de actividades
// (ActivityScene._openMinijuegosMenu). Escena de pantalla completa, mismo
// criterio que SudokuScene (no es una sala, pausa/reanuda a quien la abre).
//
// A diferencia de la primera versión (2 grillas armadas a mano, verificadas
// letra por letra a mano — inviable para 10 temas x 10 palabras, son 100
// cruces para verificar), esta versión arma los cruces con un generador
// (_generateCrossword): agarra las palabras de un banco, las va ubicando
// una por una buscando una letra en común con alguna palabra ya puesta, y
// verifica que no choque ninguna letra antes de confirmarla, Y que ninguna
// celda nueva quede pegada de costado a otra palabra sin ser un cruce real
// (si no, dos palabras paralelas podían tocarse sin compartir letra,
// formando una "palabra" que no está en ningún banco). Se reintenta con
// varios órdenes al azar y se queda con el que más palabras logró ubicar
// (de hasta WORDS_PER_PUZZLE).
//
// Sin acentos/ñ en las palabras de la grilla (mismo criterio que la v1):
// simplifica el teclado en pantalla a A-Z. Los acentos SÍ van en las
// pistas (son solo texto, no se tipean).
const WORDS_PER_PUZZLE = 10;
// 60 intentos en vez de 12: ya no solo buscan ubicar las 10 palabras, ahora
// también compiten por la grilla más COMPACTA (ver bboxArea/generateCrossword
// más abajo) — con más intentos hay más candidatos entre los que elegir el
// más chico. Sigue siendo barato (generar un puzzle de 10 palabras tarda
// microsegundos), no hay costo real en subirlo.
const GENERATE_ATTEMPTS = 60;
// Tamaño de celda objetivo, fijo entre partidas (pedido del usuario: todas
// las celdas siempre del mismo tamaño — antes se recalculaba según cuántas
// filas/columnas necesitaba CADA puzzle generado, y podía ir de 14px a
// 26px según el caso, muy inconsistente entre partidas). El generador
// ahora prioriza grillas compactas para que este tamaño entre siempre en
// pantalla; el clamp en _loadPuzzle es solo una red de seguridad.
const TARGET_CELL_SIZE = 16;

const THEMES = [
  {
    name: 'Elementos químicos',
    bank: [
      { word: 'HIERRO', clue: 'Metal magnético, símbolo Fe' },
      { word: 'ORO', clue: 'Metal precioso amarillo, símbolo Au' },
      { word: 'PLATA', clue: 'Metal precioso brillante, símbolo Ag' },
      { word: 'COBRE', clue: 'Metal rojizo usado en cables eléctricos' },
      { word: 'SODIO', clue: 'Elemento presente en la sal de mesa' },
      { word: 'CALCIO', clue: 'Mineral clave para los huesos' },
      { word: 'CARBONO', clue: 'Elemento base de toda la vida orgánica' },
      { word: 'OXIGENO', clue: 'Gas que respiramos para vivir' },
      { word: 'HELIO', clue: 'Gas que hace flotar los globos' },
      { word: 'NEON', clue: 'Gas usado en carteles luminosos' },
      { word: 'PLOMO', clue: 'Metal pesado y tóxico, símbolo Pb' },
      { word: 'ZINC', clue: 'Metal usado para galvanizar, símbolo Zn' },
    ],
  },
  {
    name: 'Animales',
    bank: [
      { word: 'LEON', clue: 'El rey de la selva' },
      { word: 'TIGRE', clue: 'Felino rayado de Asia' },
      { word: 'ELEFANTE', clue: 'El mamífero terrestre más grande' },
      { word: 'JIRAFA', clue: 'El animal de cuello más largo' },
      { word: 'DELFIN', clue: 'Mamífero marino muy inteligente' },
      { word: 'AGUILA', clue: 'Ave rapaz de vista aguda' },
      { word: 'BALLENA', clue: 'El animal más grande del planeta' },
      { word: 'CEBRA', clue: 'Equino africano con rayas' },
      { word: 'MONO', clue: 'Primate trepador' },
      { word: 'OSO', clue: 'Mamífero que hiberna en invierno' },
      { word: 'LOBO', clue: 'Cánido que vive en manada' },
      { word: 'ZORRO', clue: 'Cánido astuto de cola tupida' },
      { word: 'CONEJO', clue: 'Roedor de orejas largas' },
      { word: 'PINGUINO', clue: 'Ave que no vuela, vive en el hielo' },
    ],
  },
  {
    name: 'Países',
    bank: [
      { word: 'ARGENTINA', clue: 'País del tango y el asado' },
      { word: 'BRASIL', clue: 'El país más grande de Sudamérica' },
      { word: 'CHILE', clue: 'País largo y angosto de Sudamérica' },
      { word: 'PERU', clue: 'Cuna del Imperio Inca' },
      { word: 'MEXICO', clue: 'País de las pirámides aztecas' },
      { word: 'ESPANA', clue: 'País ibérico, capital Madrid' },
      { word: 'FRANCIA', clue: 'País de la Torre Eiffel' },
      { word: 'ITALIA', clue: 'País con forma de bota' },
      { word: 'JAPON', clue: 'País del sol naciente' },
      { word: 'CHINA', clue: 'El país más poblado del mundo' },
      { word: 'EGIPTO', clue: 'País de las pirámides y el Nilo' },
      { word: 'CANADA', clue: 'País de las hojas de arce' },
      { word: 'GRECIA', clue: 'Cuna de la civilización occidental' },
      { word: 'CUBA', clue: 'Isla caribeña de La Habana' },
    ],
  },
  {
    name: 'Inventos',
    bank: [
      { word: 'TELEFONO', clue: 'Invento para hablar a distancia' },
      { word: 'BOMBILLA', clue: 'Invento que ilumina con electricidad' },
      { word: 'IMPRENTA', clue: 'Invento de Gutenberg para imprimir libros' },
      { word: 'RADIO', clue: 'Invento para transmitir sonido sin cables' },
      { word: 'RUEDA', clue: 'Uno de los inventos más antiguos de la humanidad' },
      { word: 'AVION', clue: 'Invento que permite volar' },
      { word: 'BRUJULA', clue: 'Invento que siempre apunta al norte' },
      { word: 'INTERNET', clue: 'Red mundial que conecta computadoras' },
      { word: 'PENICILINA', clue: 'Primer antibiótico descubierto' },
      { word: 'MICROSCOPIO', clue: 'Invento para ver lo diminuto' },
      { word: 'TELESCOPIO', clue: 'Invento para ver el espacio' },
    ],
  },
  {
    name: 'Científicos y artistas',
    bank: [
      { word: 'EINSTEIN', clue: 'Físico de la teoría de la relatividad' },
      { word: 'NEWTON', clue: 'Físico de la ley de gravedad' },
      { word: 'DARWIN', clue: 'Naturalista de la teoría de la evolución' },
      { word: 'MOZART', clue: 'Compositor prodigio austríaco' },
      { word: 'PICASSO', clue: 'Pintor del cubismo' },
      { word: 'GALILEO', clue: 'Astrónomo que defendió el heliocentrismo' },
      { word: 'EDISON', clue: 'Inventor de la bombilla comercial' },
      { word: 'TESLA', clue: 'Inventor de la corriente alterna' },
      { word: 'CURIE', clue: 'Científica pionera en radiactividad' },
      { word: 'BEETHOVEN', clue: 'Compositor que siguió componiendo sordo' },
    ],
  },
  {
    name: 'Cuerpo humano',
    bank: [
      { word: 'CORAZON', clue: 'Órgano que bombea la sangre' },
      { word: 'CEREBRO', clue: 'Órgano que controla el cuerpo' },
      { word: 'PULMON', clue: 'Órgano para respirar' },
      { word: 'HIGADO', clue: 'Órgano que filtra toxinas' },
      { word: 'ESTOMAGO', clue: 'Órgano donde se digiere la comida' },
      { word: 'PIEL', clue: 'El órgano más grande del cuerpo' },
      { word: 'HUESO', clue: 'Parte dura del esqueleto' },
      { word: 'MUSCULO', clue: 'Tejido que permite el movimiento' },
      { word: 'SANGRE', clue: 'Líquido que circula por las venas' },
      { word: 'RINON', clue: 'Órgano que filtra la sangre (hay dos)' },
    ],
  },
  {
    name: 'Deportes',
    bank: [
      { word: 'FUTBOL', clue: 'El deporte más popular del mundo' },
      { word: 'TENIS', clue: 'Deporte de raqueta con red' },
      { word: 'BASQUET', clue: 'Deporte de encestar la pelota' },
      { word: 'VOLEY', clue: 'Deporte de red que se juega con las manos' },
      { word: 'NATACION', clue: 'Deporte que se practica en el agua' },
      { word: 'BOXEO', clue: 'Deporte de combate con guantes' },
      { word: 'GOLF', clue: 'Deporte de meter la pelota en un hoyo' },
      { word: 'RUGBY', clue: 'Deporte de pelota ovalada y placajes' },
      { word: 'CICLISMO', clue: 'Deporte que se practica en bicicleta' },
      { word: 'ATLETISMO', clue: 'Deporte de correr, saltar y lanzar' },
      { word: 'ESQUI', clue: 'Deporte de deslizarse sobre la nieve' },
    ],
  },
  {
    name: 'Espacio',
    bank: [
      { word: 'MERCURIO', clue: 'El planeta más cercano al sol' },
      { word: 'VENUS', clue: 'El planeta más caliente del sistema solar' },
      { word: 'MARTE', clue: 'El planeta rojo' },
      { word: 'JUPITER', clue: 'El planeta más grande del sistema solar' },
      { word: 'SATURNO', clue: 'El planeta de los anillos' },
      { word: 'URANO', clue: 'Planeta que gira de costado' },
      { word: 'NEPTUNO', clue: 'El planeta más lejano del sol' },
      { word: 'LUNA', clue: 'Satélite natural de la Tierra' },
      { word: 'SOL', clue: 'Estrella que ilumina nuestro sistema' },
      { word: 'COMETA', clue: 'Cuerpo helado con cola brillante' },
      { word: 'ESTRELLA', clue: 'Astro que brilla con luz propia' },
      { word: 'GALAXIA', clue: 'Conjunto gigante de estrellas' },
    ],
  },
  {
    name: 'Instrumentos musicales',
    bank: [
      { word: 'GUITARRA', clue: 'Instrumento de cuerdas que se rasguea' },
      { word: 'PIANO', clue: 'Instrumento de teclas blancas y negras' },
      { word: 'VIOLIN', clue: 'Instrumento de cuerda que se toca con arco' },
      { word: 'TROMPETA', clue: 'Instrumento de viento metal brillante' },
      { word: 'FLAUTA', clue: 'Instrumento de viento que se sopla de costado o de frente' },
      { word: 'TAMBOR', clue: 'Instrumento de percusión que se golpea' },
      { word: 'ARPA', clue: 'Instrumento de muchas cuerdas verticales' },
      { word: 'SAXOFON', clue: 'Instrumento de viento típico del jazz' },
      { word: 'CLARINETE', clue: 'Instrumento de viento madera de un solo tubo' },
      { word: 'BATERIA', clue: 'Conjunto de tambores y platillos' },
      { word: 'ACORDEON', clue: 'Instrumento de fuelle que se estira y comprime' },
    ],
  },
  {
    name: 'Mitología griega',
    bank: [
      { word: 'ZEUS', clue: 'Rey de los dioses griegos' },
      { word: 'HERA', clue: 'Diosa del matrimonio, esposa de Zeus' },
      { word: 'POSEIDON', clue: 'Dios del mar' },
      { word: 'HADES', clue: 'Dios del inframundo' },
      { word: 'ATENEA', clue: 'Diosa de la sabiduría' },
      { word: 'APOLO', clue: 'Dios del sol y la música' },
      { word: 'ARES', clue: 'Dios de la guerra' },
      { word: 'AFRODITA', clue: 'Diosa del amor y la belleza' },
      { word: 'HERMES', clue: 'Dios mensajero de pies alados' },
      { word: 'HERCULES', clue: 'Héroe de fuerza sobrehumana' },
      { word: 'PEGASO', clue: 'Caballo alado de la mitología' },
      { word: 'MEDUSA', clue: 'Monstruo de cabellera de serpientes' },
    ],
  },
];

const CROSSWORD_WIN_FUN = 20;
const CROSSWORD_WIN_COINS = 10;

// Pool combinado de las 10 categorías — el usuario pidió que un mismo
// puzzle mezcle temas en vez de ser todo de una sola categoría (antes
// "Nuevo" rotaba THEMES[i] entero). Cada entrada conserva de qué categoría
// viene (útil si en algún momento se quiere mostrar, no se usa por ahora).
const ALL_WORDS = THEMES.flatMap(t => t.bank.map(e => ({ ...e, theme: t.name })));

// ── Generador de cruces ───────────────────────────────────────────────────
// Ubica palabras del banco una por una: la primera va horizontal en (0,0);
// cada una siguiente busca una letra en común con alguna palabra YA puesta
// (en cualquier posición de ambas) y calcula la posición cruzada — si esa
// posición no choca ninguna letra existente NI pega la palabra nueva contra
// el borde de otra (celda ocupada justo antes/después), la confirma.
// Se reintenta con el banco en distinto orden al azar (GENERATE_ATTEMPTS
// veces) y se devuelve el intento que más palabras logró ubicar.
function shuffleArrayCw(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function tryGenerate(bank, targetCount) {
  // Bug real reportado por el usuario: acá había un `.sort((a,b) =>
  // b.word.length - a.word.length)` DESPUÉS del shuffle — Array.sort es
  // estable, así que el shuffle solo importaba como desempate entre
  // palabras de IGUAL longitud; la selección real terminaba dominada por
  // las palabras más largas de TODO el banco (siempre las mismas ~7-10 de
  // 117), sin importar cuántas veces se generara. Medido: 7.45/10 palabras
  // repetidas en promedio entre generaciones distintas. Sacar el sort deja
  // el shuffle hacer su trabajo de verdad — bajó a 1.2/10 de overlap
  // promedio, sigue ubicando las 10 palabras siempre (findSpot ya se
  // saltea sola cualquier palabra que no cruce, no hace falta ordenar por
  // longitud para que funcione) y hasta las grillas salen más compactas en
  // promedio al no forzar meter siempre las palabras más largas del banco.
  const order = shuffleArrayCw(bank);
  const placed = [];
  const grid = new Map(); // "r,c" -> letra

  function cellFree(r, c, letter) {
    const key = `${r},${c}`;
    return !grid.has(key) || grid.get(key) === letter;
  }

  function fits(word, row, col, dir) {
    for (let i = 0; i < word.length; i++) {
      const r = dir === 'down' ? row + i : row;
      const c = dir === 'across' ? col + i : col;
      if (!cellFree(r, c, word[i])) return false;

      // Si la celda todavía no existe en la grilla, esta letra NO es un
      // cruce real (no hay ninguna palabra ya puesta ahí) — sus vecinos
      // perpendiculares tienen que estar libres. Sin este chequeo dos
      // palabras paralelas (ej. dos verticales en columnas contiguas)
      // podían terminar pegadas de costado sin compartir ninguna letra,
      // formando en la grilla una "palabra fantasma" que no está en
      // ningún banco — el bug reportado por el usuario. En el punto de
      // cruce real esto no aplica: ahí la celda ya existe (la puso la
      // otra palabra) y sus vecinos perpendiculares son, legítimamente,
      // el resto de esa otra palabra.
      if (!grid.has(`${r},${c}`)) {
        if (dir === 'across') {
          if (grid.has(`${r - 1},${c}`) || grid.has(`${r + 1},${c}`)) return false;
        } else {
          if (grid.has(`${r},${c - 1}`) || grid.has(`${r},${c + 1}`)) return false;
        }
      }
    }
    // Las celdas justo antes/después de la palabra deben estar libres — si
    // no, quedaría pegada sin espacio contra otra palabra en su misma
    // dirección (se vería como una sola palabra más larga, ambigua).
    const beforeR = dir === 'down' ? row - 1 : row;
    const beforeC = dir === 'across' ? col - 1 : col;
    if (grid.has(`${beforeR},${beforeC}`)) return false;
    const afterR = dir === 'down' ? row + word.length : row;
    const afterC = dir === 'across' ? col + word.length : col;
    if (grid.has(`${afterR},${afterC}`)) return false;
    return true;
  }

  function place(entry, row, col, dir) {
    placed.push({ ...entry, row, col, dir });
    for (let i = 0; i < entry.word.length; i++) {
      const r = dir === 'down' ? row + i : row;
      const c = dir === 'across' ? col + i : col;
      grid.set(`${r},${c}`, entry.word[i]);
    }
  }

  // Entre TODOS los cruces válidos para esta palabra, se queda con el que
  // deja la caja delimitadora (bounding box) de la grilla más chica hasta
  // el momento — antes tomaba el primer cruce válido que encontraba, lo
  // que podía desparramar la grilla mucho más de lo necesario. Grillas más
  // compactas es lo que permite fijar TARGET_CELL_SIZE sin que la mayoría
  // de los puzzles necesite achicarlo.
  function findSpot(entry) {
    let bestSpot = null, bestArea = Infinity;
    for (const p of placed) {
      for (let pi = 0; pi < p.word.length; pi++) {
        for (let ei = 0; ei < entry.word.length; ei++) {
          if (p.word[pi] !== entry.word[ei]) continue;
          const dir = p.dir === 'across' ? 'down' : 'across';
          const pr = p.dir === 'across' ? p.row : p.row + pi;
          const pc = p.dir === 'across' ? p.col + pi : p.col;
          const row = dir === 'down' ? pr - ei : pr;
          const col = dir === 'across' ? pc - ei : pc;
          if (!fits(entry.word, row, col, dir)) continue;

          let minR = row, maxR = row, minC = col, maxC = col;
          if (dir === 'down') maxR = row + entry.word.length - 1;
          else maxC = col + entry.word.length - 1;
          placed.forEach(p2 => {
            const er = p2.dir === 'down' ? p2.row + p2.word.length - 1 : p2.row;
            const ec = p2.dir === 'across' ? p2.col + p2.word.length - 1 : p2.col;
            minR = Math.min(minR, p2.row); maxR = Math.max(maxR, er);
            minC = Math.min(minC, p2.col); maxC = Math.max(maxC, ec);
          });
          const area = (maxR - minR + 1) * (maxC - minC + 1);
          if (area < bestArea) { bestArea = area; bestSpot = { row, col, dir }; }
        }
      }
    }
    return bestSpot;
  }

  place(order[0], 0, 0, 'across');
  for (let i = 1; i < order.length && placed.length < targetCount; i++) {
    const spot = findSpot(order[i]);
    if (spot) place(order[i], spot.row, spot.col, spot.dir);
  }

  return placed;
}

function bboxArea(words) {
  let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
  words.forEach(w => {
    const endRow = w.dir === 'down' ? w.row + w.word.length - 1 : w.row;
    const endCol = w.dir === 'across' ? w.col + w.word.length - 1 : w.col;
    minRow = Math.min(minRow, w.row); maxRow = Math.max(maxRow, endRow);
    minCol = Math.min(minCol, w.col); maxCol = Math.max(maxCol, endCol);
  });
  return (maxRow - minRow + 1) * (maxCol - minCol + 1);
}

// Genera un puzzle mezclando palabras de TODAS las categorías (antes
// tomaba un solo theme.bank — un puzzle entero de "Países", otro entero de
// "Animales", etc; pedido del usuario: mezclar las pistas dentro de un
// mismo crucigrama). Entre los GENERATE_ATTEMPTS intentos, prioriza primero
// ubicar las 10 palabras y, entre los que lo logran, la grilla con menor
// área (bboxArea) — antes se quedaba con el primer intento que llegaba a
// 10 palabras sin importar cuán desparramada quedara.
function generateCrossword() {
  let best = null, bestArea = Infinity;
  for (let a = 0; a < GENERATE_ATTEMPTS; a++) {
    const attempt = tryGenerate(ALL_WORDS, WORDS_PER_PUZZLE);
    const area = bboxArea(attempt);
    const attemptFull = attempt.length >= WORDS_PER_PUZZLE;
    const bestFull = best && best.length >= WORDS_PER_PUZZLE;
    if (!best || (attemptFull && !bestFull) ||
        (attemptFull === bestFull && (attempt.length > best.length ||
          (attempt.length === best.length && area < bestArea)))) {
      best = attempt; bestArea = area;
    }
  }
  return { name: 'Cultura general', words: best };
}

// Arma la grilla (celdas activas + número de pista) a partir de la lista de
// palabras ya ubicadas — normaliza coordenadas para que arranquen en (0,0).
function buildGrid(puzzle) {
  let minRow = Infinity, maxRow = -Infinity, minCol = Infinity, maxCol = -Infinity;
  puzzle.words.forEach(w => {
    const endRow = w.dir === 'down' ? w.row + w.word.length - 1 : w.row;
    const endCol = w.dir === 'across' ? w.col + w.word.length - 1 : w.col;
    minRow = Math.min(minRow, w.row); maxRow = Math.max(maxRow, endRow);
    minCol = Math.min(minCol, w.col); maxCol = Math.max(maxCol, endCol);
  });

  const rows = maxRow - minRow + 1;
  const cols = maxCol - minCol + 1;
  const cells = Array.from({ length: rows }, () => Array(cols).fill(null));

  puzzle.words.forEach((w, wi) => {
    for (let k = 0; k < w.word.length; k++) {
      const r = (w.dir === 'down' ? w.row + k : w.row) - minRow;
      const c = (w.dir === 'across' ? w.col + k : w.col) - minCol;
      const letter = w.word[k];
      if (!cells[r][c]) cells[r][c] = { letter, refs: [] };
      cells[r][c].refs.push({ wordId: wi, index: k });
    }
  });

  let num = 1;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!cells[r][c]) continue;
      if (cells[r][c].refs.some(ref => ref.index === 0)) cells[r][c].number = num++;
    }
  }

  return { cells, rows, cols, minRow, minCol };
}

class CrosswordScene extends Phaser.Scene {
  constructor() { super('CrosswordScene'); }

  init(data) {
    this._callerKey = data && data.callerKey;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.stats = this.registry.get('stats');
    this.inventory = this.registry.get('inventory');

    this.add.rectangle(0, 0, W, H, 0x1a1a2e, 1).setOrigin(0).setDepth(0);

    this.add.text(W / 2, 22, '📝 Crucigrama', {
      fontSize: '17px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e9d5ff',
    }).setOrigin(0.5).setDepth(1);
    this._themeText = this.add.text(W / 2, 42, '', {
      fontSize: '12px', fontFamily: 'monospace', fill: '#a78bfa',
    }).setOrigin(0.5).setDepth(1);

    const closeBtn = this.add.text(W - 16, 18, '✕', {
      fontSize: '18px', fill: '#a78bfa', fontFamily: 'monospace',
    }).setOrigin(1, 0.5).setDepth(1).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ fill: '#a78bfa' }));
    closeBtn.on('pointerdown', () => {
      this.scene.stop();
      if (this._callerKey) this.scene.resume(this._callerKey);
    });

    // Borde superior mínimo (no puede subir más que esto o pisa el título
    // "📝 Crucigrama" / el texto de tema). El valor final de this._gridTop
    // se recalcula por puzzle en _loadPuzzle para centrar verticalmente el
    // conjunto grilla+pista en el espacio libre hasta el teclado.
    this._gridMinTop = 62;
    this._gridTop = this._gridMinTop;
    this._gridGfx = this.add.graphics().setDepth(1);
    this._clueTexts = [];

    // Pista de la palabra activa — una sola línea, truncada con "..." si no
    // entra (el texto completo queda en this._clueFull y se puede leer
    // entero tocándola, ver _openClueModal). Antes envolvía en hasta ~3
    // líneas con wordWrap; con pistas largas eso se veía feo y con ~10
    // palabras por puzzle empujaba el resto del layout. Interactiva: tocarla
    // abre el modal con la pista completa.
    this._clueText = this.add.text(0, 0, '', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#facc15',
    }).setOrigin(0.5, 0.5).setDepth(1).setInteractive({ useHandCursor: true });
    this._clueText.on('pointerdown', () => this._openClueModal());

    // Flechas para pasar de palabra en palabra en orden (antes solo existía
    // el botón "⇄ Cambiar palabra", que solo alterna entre las 2 palabras
    // que cruzan en la celda seleccionada — pedido del usuario: poder saltar
    // a la palabra siguiente/anterior aunque no sea un cruce, para saltear
    // una que no sabe).
    this._prevWordBtn = this.add.text(0, 0, '◀', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#7c3aed', padding: { x: 9, y: 4 },
    }).setOrigin(0, 0.5).setDepth(1).setInteractive({ useHandCursor: true });
    this._prevWordBtn.on('pointerdown', () => this._goToWord(-1));
    this._prevWordBtn.on('pointerover', () => this._prevWordBtn.setStyle({ backgroundColor: '#9333ea' }));
    this._prevWordBtn.on('pointerout', () => this._prevWordBtn.setStyle({ backgroundColor: '#7c3aed' }));

    this._nextWordBtn = this.add.text(0, 0, '▶', {
      fontSize: '15px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#7c3aed', padding: { x: 9, y: 4 },
    }).setOrigin(1, 0.5).setDepth(1).setInteractive({ useHandCursor: true });
    this._nextWordBtn.on('pointerdown', () => this._goToWord(1));
    this._nextWordBtn.on('pointerover', () => this._nextWordBtn.setStyle({ backgroundColor: '#9333ea' }));
    this._nextWordBtn.on('pointerout', () => this._nextWordBtn.setStyle({ backgroundColor: '#7c3aed' }));

    // Botón explícito para cambiar de palabra en un cruce (antes solo
    // existía el gesto oculto de tocar dos veces la misma celda — el
    // usuario lo reportó como no descubrible). Se habilita/deshabilita
    // (opacidad + interactividad) desde _selectByWord según si la celda
    // seleccionada pertenece a 2 palabras o solo a 1.
    this._toggleDirBtn = this.add.text(0, 0, '⇄ Cambiar palabra', {
      fontSize: '11px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#7c3aed', padding: { x: 8, y: 4 },
    }).setOrigin(1, 0.5).setDepth(1).setInteractive({ useHandCursor: true });
    this._toggleDirBtn.on('pointerdown', () => this._toggleDirection());

    this._msgText = this.add.text(W / 2, 0, '', {
      fontSize: '12px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#22c55e',
    }).setOrigin(0.5).setDepth(1);

    this._buildKeyboard(W, H);
    this._makeButton(W / 2 - 105, H - 18, '💡 Pista', () => this._useHint());
    this._makeButton(W / 2, H - 18, 'Verificar', () => this._verify());
    this._makeButton(W / 2 + 105, H - 18, 'Nuevo', () => this._newPuzzle());

    this._loadPuzzle();
  }

  _makeButton(x, y, label, onTap) {
    const btn = this.add.text(x, y, label, {
      fontSize: '13px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#7c3aed', padding: { x: 12, y: 6 },
    }).setOrigin(0.5).setDepth(1).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#9333ea' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#7c3aed' }));
    btn.on('pointerdown', onTap);
    return btn;
  }

  // Teclado A-Z + ⌫ en 4 filas de 7 (antes 3 de 9 — pedido del usuario, las
  // teclas de 9 por fila quedaban muy finitas para reconocer la letra).
  // Anclado abajo (posición fija, no depende del tamaño de la grilla — así
  // siempre queda alcanzable aunque el puzzle generado sea grande).
  //
  // Cada tecla es un rectángulo real (this.add.rectangle) del tamaño exacto
  // de celda reservado (btnW x btnH) con el texto de la letra encima —
  // antes era un Text con backgroundColor, que en Phaser solo pinta el
  // fondo del ancho del glyph + padding (acá padding.x era 0), no del
  // btnW calculado: el espacio reservado por tecla era generoso pero el
  // fondo visible era angosto como una sola letra ("flacas", reportado por
  // el usuario). El rectángulo hace que toda la celda sea visible Y
  // clickeable, no solo el glyph.
  _buildKeyboard(W, H) {
    const ROWS = ['ABCDEFG', 'HIJKLMN', 'OPQRSTU', 'VWXYZ⌫'];
    const cols = 7;
    const gap = 6;
    const btnW = (W - 20 - gap * (cols - 1)) / cols;
    const btnH = 42;
    const startX = 10 + btnW / 2;
    this._keyboardTop = H - 18 - 34 - ROWS.length * (btnH + gap);

    ROWS.forEach((rowStr, ri) => {
      [...rowStr].forEach((ch, ci) => {
        const x = startX + ci * (btnW + gap);
        const y = this._keyboardTop + ri * (btnH + gap);

        const bg = this.add.rectangle(x, y, btnW, btnH, 0x3730a3, 1)
          .setStrokeStyle(1, 0x7c3aed, 1)
          .setDepth(1).setInteractive({ useHandCursor: true });
        this.add.text(x, y, ch, {
          fontSize: '16px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
        }).setOrigin(0.5).setDepth(2);

        bg.on('pointerdown', () => this._onKey(ch === '⌫' ? null : ch));
        bg.on('pointerover', () => bg.setFillStyle(0x4338ca, 1));
        bg.on('pointerout', () => bg.setFillStyle(0x3730a3, 1));
      });
    });
  }

  _newPuzzle() {
    this._loadPuzzle();
  }

  _loadPuzzle() {
    const W = this.scale.width;
    this._closeClueModal();
    this._puzzle = generateCrossword();
    this._grid = buildGrid(this._puzzle);
    // Orden de navegación de las flechas ◀/▶ (_goToWord): por número de
    // pista y, a igual número (cruce horizontal+vertical arrancando en la
    // misma celda), horizontal antes que vertical — mismo criterio de
    // lectura que un crucigrama de diario.
    this._wordOrder = this._puzzle.words
      .map((_, i) => i)
      .sort((a, b) => {
        const na = this._numberOfWord(a);
        const nb = this._numberOfWord(b);
        if (na !== nb) return na - nb;
        return this._puzzle.words[a].dir === 'across' ? -1 : 1;
      });
    this._answers = this._grid.cells.map(row => row.map(cell => (cell ? '' : null)));
    this._selected = null;
    this._activeWordId = null;
    // _drawGrid() (más abajo) destruye todos los _cellTexts viejos,
    // incluida la celda que _selectedTxt todavía apuntaba — sin limpiar
    // esta referencia acá, el primer _select() del puzzle nuevo intenta
    // hacer setStyle() sobre un objeto ya destruido y tira una excepción
    // que deja la selección rota para el resto de la sesión (encontrado
    // por Playwright: "Nuevo" quedaba irrecuperable después del primer tap).
    this._selectedTxt = null;
    this._rewardClaimed = false;
    this._msgText.setText('');
    this._themeText.setText(`Cultura general — ${this._puzzle.words.length} palabras mezcladas`);

    // Tamaño de celda: siempre TARGET_CELL_SIZE (pedido del usuario — antes
    // se recalculaba según el tamaño de CADA puzzle generado y podía ir de
    // 14px a 26px, muy inconsistente entre partidas). El generador ya
    // prioriza grillas compactas para que este tamaño entre siempre; el
    // Math.min contra el espacio disponible es solo una red de seguridad
    // por si algún puzzle igual se pasara (nunca debería achicarlo en la
    // práctica, pero así nunca se pisa el teclado).
    const availH = this._keyboardTop - this._gridMinTop - 60; // 60 = pista + mensaje + aire
    const availW = W - 24;
    this._cellSize = Math.max(10, Math.min(TARGET_CELL_SIZE, Math.floor(availW / this._grid.cols), Math.floor(availH / this._grid.rows)));
    this._gridLeft = (W - this._grid.cols * this._cellSize) / 2;

    // Centrado vertical (pedido del usuario: que el crucigrama no quede
    // pegado arriba) — si la grilla+pista ocupan menos que el espacio
    // disponible entre el header y el teclado, se reparte la diferencia
    // como margen arriba. CLUE_AREA_H es una estimación fija del alto que
    // ocupa la pista + flechas + botón "Cambiar palabra" + mensaje debajo
    // de la grilla (ver clueY/msgText en _drawGrid). Si por algún puzzle
    // extremo no entrara (cellSize ya en su piso de seguridad), el margen
    // da 0 y queda anclado arriba como antes.
    const CLUE_AREA_H = 80;
    const contentH = this._grid.rows * this._cellSize + CLUE_AREA_H;
    const availBottom = this._keyboardTop - 10;
    const availSpace = availBottom - this._gridMinTop;
    this._gridTop = this._gridMinTop + Math.max(0, (availSpace - contentH) / 2);

    this._drawGrid();
    this._renderAnswers();

    // Selecciona la primera celda de la primera palabra para arrancar con
    // una pista ya mostrada (mejor que dejar el panel de pista vacío). OJO:
    // la primera palabra se ubica en (0,0) ANTES de normalizar la grilla,
    // pero buildGrid resta minRow/minCol de TODO (puede ser negativo si
    // alguna palabra cruzó hacia arriba/la izquierda de la primera) — no se
    // puede asumir que sigue estando en (0,0) de la grilla ya normalizada.
    const first = this._puzzle.words[0];
    this._select(first.row - this._grid.minRow, first.col - this._grid.minCol, 0);
  }

  _drawGrid() {
    if (this._cellTexts) this._cellTexts.flat().forEach(t => t && t.destroy());
    if (this._numberTexts) this._numberTexts.forEach(t => t.destroy());
    this._numberTexts = [];

    const g = this._gridGfx;
    g.clear();

    this._cellTexts = [];
    // Umbrales pensados para TARGET_CELL_SIZE=16 (el caso normal): '11px'
    // entra cómodo en una celda de 16px con la tipografía monospace bold.
    const fontSize = this._cellSize >= 24 ? '15px' : (this._cellSize >= 20 ? '12px' : (this._cellSize >= 15 ? '11px' : '9px'));
    for (let r = 0; r < this._grid.rows; r++) {
      const rowTexts = [];
      for (let c = 0; c < this._grid.cols; c++) {
        const cell = this._grid.cells[r][c];
        const x = this._gridLeft + c * this._cellSize;
        const y = this._gridTop + r * this._cellSize;
        if (!cell) { rowTexts.push(null); continue; }

        g.fillStyle(0x2a2a4a, 1);
        g.fillRect(x, y, this._cellSize, this._cellSize);
        g.lineStyle(1, 0x7c3aed, 1);
        g.strokeRect(x, y, this._cellSize, this._cellSize);

        if (cell.number) {
          // Chip de fondo detrás del número: el usuario reportó que los
          // números "solo se veían en las verticales" — el generador SÍ
          // los asigna bien a ambas direcciones (verificado con un test
          // aparte), el problema era que un texto de 8px sin contraste se
          // pierde fácil, sobre todo si una letra grande queda al lado.
          // Un chip oscuro + texto más grande y en amarillo lo hace
          // inconfundible en cualquier celda.
          const chipSize = Math.min(13, Math.max(9, this._cellSize * 0.5));
          g.fillStyle(0x000000, 0.55);
          g.fillRect(x + 1, y + 1, chipSize, chipSize);
          this._numberTexts.push(
            this.add.text(x + 1 + chipSize / 2, y + 1 + chipSize / 2, String(cell.number), {
              fontSize: chipSize >= 12 ? '9px' : '8px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#fde047',
            }).setOrigin(0.5).setDepth(3)
          );
        }

        const txt = this.add.text(x + this._cellSize / 2, y + this._cellSize / 2, '', {
          fontSize, fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
        }).setOrigin(0.5).setDepth(2);
        rowTexts.push(txt);
      }
      this._cellTexts.push(rowTexts);
    }

    if (this._gridZone) this._gridZone.destroy();
    this._gridZone = this.add.zone(this._gridLeft, this._gridTop, this._grid.cols * this._cellSize, this._grid.rows * this._cellSize)
      .setOrigin(0).setDepth(3).setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer) => this._onCellTap(pointer));

    const W = this.scale.width;
    const clueY = this._gridTop + this._grid.rows * this._cellSize + 18;
    this._clueText.setPosition(W / 2, clueY);
    this._prevWordBtn.setPosition(16, clueY);
    this._nextWordBtn.setPosition(W - 16, clueY);
    this._toggleDirBtn.setPosition(W - 16, clueY + 26);
    // Ancho disponible para la pista en una sola línea, dejando lugar a las
    // flechas ◀/▶ a los costados — si el texto no entra, _setClue la trunca
    // con "..." (se puede leer completa tocándola, ver _openClueModal).
    this._clueMaxWidth = W - 130;
    this._msgText.setY(clueY + 48);
  }

  // Trunca la pista a una sola línea con "..." si no entra en
  // this._clueMaxWidth (búsqueda binaria contra el ancho real renderizado,
  // más preciso que estimar por cantidad de caracteres). El texto completo
  // queda en this._clueFull para el modal (_openClueModal) sin importar si
  // se truncó o no.
  _setClue(prefix, clue) {
    const full = `${prefix}: ${clue}`;
    this._clueFull = full;
    this._clueText.setText(full);
    if (this._clueText.width <= this._clueMaxWidth) return;

    const head = `${prefix}: `;
    let lo = 0, hi = clue.length;
    while (lo < hi) {
      const mid = Math.ceil((lo + hi) / 2);
      this._clueText.setText(`${head}${clue.slice(0, mid)}...`);
      if (this._clueText.width <= this._clueMaxWidth) lo = mid; else hi = mid - 1;
    }
    this._clueText.setText(`${head}${clue.slice(0, lo)}...`);
  }

  _openClueModal() {
    if (!this._clueFull) return;
    this._closeClueModal();
    const W = this.scale.width;
    const H = this.scale.height;
    const objs = [];

    const overlay = this.add.rectangle(0, 0, W, H, 0x000000, 0.65).setOrigin(0).setDepth(20).setInteractive();
    objs.push(overlay);

    const panelW = W - 40;
    const panelX = 20;
    const bodyText = this.add.text(0, 0, this._clueFull, {
      fontSize: '15px', fontFamily: 'monospace', fill: '#e9d5ff',
      wordWrap: { width: panelW - 40 },
    }).setDepth(22);
    const titleH = 46;
    const panelH = Math.min(H - 100, titleH + bodyText.height + 28);
    const panelY = (H - panelH) / 2;
    bodyText.setPosition(panelX + 20, panelY + titleH);
    objs.push(bodyText);

    const panel = this.add.graphics().setDepth(21);
    panel.fillStyle(0x1e1b4b, 0.97);
    panel.fillRoundedRect(panelX, panelY, panelW, panelH, 16);
    panel.lineStyle(2, 0x7c3aed, 1);
    panel.strokeRoundedRect(panelX, panelY, panelW, panelH, 16);
    objs.push(panel);

    const titleTxt = this.add.text(W / 2, panelY + 22, 'Pista completa', {
      fontSize: '15px', fill: '#e9d5ff', fontFamily: 'monospace', fontStyle: 'bold',
    }).setOrigin(0.5).setDepth(22);
    objs.push(titleTxt);

    const closeBtn = this.add.text(panelX + panelW - 14, panelY + 14, '✕', {
      fontSize: '18px', fill: '#a78bfa', fontFamily: 'monospace',
    }).setOrigin(1, 0).setDepth(22).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ fill: '#a78bfa' }));
    closeBtn.on('pointerdown', () => this._closeClueModal());
    objs.push(closeBtn);

    this._clueModalObjects = objs;
  }

  _closeClueModal() {
    if (!this._clueModalObjects) return;
    this._clueModalObjects.forEach(o => o.destroy());
    this._clueModalObjects = null;
  }

  _onCellTap(pointer) {
    const c = Math.floor((pointer.x - this._gridLeft) / this._cellSize);
    const r = Math.floor((pointer.y - this._gridTop) / this._cellSize);
    if (r < 0 || r >= this._grid.rows || c < 0 || c >= this._grid.cols) return;
    if (!this._grid.cells[r][c]) return;

    const sameCell = this._selected && this._selected.r === r && this._selected.c === c;
    const cell = this._grid.cells[r][c];

    if (sameCell && cell.refs.length > 1) {
      // Ya estaba seleccionada y pertenece a 2 palabras — alternar a la otra.
      const other = cell.refs.find(ref => ref.wordId !== this._activeWordId);
      this._select(r, c, other ? other.wordId : this._activeWordId);
    } else {
      this._select(r, c, cell.refs[0].wordId);
    }
  }

  _select(r, c, wordId) {
    if (this._selectedTxt) this._selectedTxt.setStyle({ fill: '#ffffff' });
    this._selected = { r, c };
    this._selectedTxt = this._cellTexts[r][c];
    this._selectedTxt.setStyle({ fill: '#facc15' });
    this._selectByWord(wordId);
  }

  _selectByWord(wordId) {
    this._activeWordId = wordId;
    const w = this._puzzle.words[wordId];
    const cell = this._grid.cells[this._selected.r][this._selected.c];
    const ref = cell.refs.find(rf => rf.wordId === wordId);
    const num = this._numberOfWord(wordId);
    this._setClue(`${num}${w.dir === 'across' ? 'H' : 'V'}`, w.clue);

    // El botón de cambiar palabra solo tiene sentido si la celda
    // seleccionada es un cruce (pertenece a 2 palabras) — si no, se ve
    // atenuado y no responde al tap, para que quede claro que acá no hay
    // nada para cambiar.
    const canToggle = cell.refs.length > 1;
    this._toggleDirBtn.setAlpha(canToggle ? 1 : 0.35);
    if (canToggle) this._toggleDirBtn.setInteractive({ useHandCursor: true });
    else this._toggleDirBtn.disableInteractive();
  }

  _toggleDirection() {
    if (!this._selected) return;
    const cell = this._grid.cells[this._selected.r][this._selected.c];
    const other = cell.refs.find(ref => ref.wordId !== this._activeWordId);
    if (other) this._selectByWord(other.wordId);
  }

  // Flechas ◀/▶: salta a la primera celda de la palabra siguiente/anterior
  // en this._wordOrder (con wraparound), sin importar si cruza o no la
  // palabra activa — así el jugador puede saltear una pista que no sabe.
  _goToWord(delta) {
    if (!this._wordOrder || !this._wordOrder.length) return;
    const pos = this._wordOrder.indexOf(this._activeWordId);
    const nextPos = (pos + delta + this._wordOrder.length) % this._wordOrder.length;
    const wordId = this._wordOrder[nextPos];
    const w = this._puzzle.words[wordId];
    this._select(w.row - this._grid.minRow, w.col - this._grid.minCol, wordId);
  }

  // Botón "💡 Pista": revela la primera letra vacía o mal escrita de la
  // palabra ACTIVA (no de cualquier palabra) y selecciona esa celda, para
  // que la persona pueda seguir tipeando desde ahí. Tocarlo varias veces
  // va revelando la palabra letra por letra.
  _useHint() {
    const w = this._puzzle.words[this._activeWordId];
    for (let i = 0; i < w.word.length; i++) {
      const r = (w.dir === 'down' ? w.row + i : w.row) - this._grid.minRow;
      const c = (w.dir === 'across' ? w.col + i : w.col) - this._grid.minCol;
      if (this._answers[r][c] !== w.word[i]) {
        this._answers[r][c] = w.word[i];
        this._renderAnswers();
        this._select(r, c, this._activeWordId);
        return;
      }
    }
    this._msgText.setText('Esa palabra ya está completa').setStyle({ fill: '#fbbf24' });
  }

  _numberOfWord(wordId) {
    for (let r = 0; r < this._grid.rows; r++) {
      for (let c = 0; c < this._grid.cols; c++) {
        const cell = this._grid.cells[r][c];
        if (cell && cell.number && cell.refs.some(ref => ref.wordId === wordId && ref.index === 0)) return cell.number;
      }
    }
    return '?';
  }

  // Tipea la letra en la celda seleccionada y avanza a la siguiente celda
  // de la palabra ACTIVA (no de cualquier palabra que pase por ahí — con
  // ~10 palabras cruzando bastante seguido, avanzar por la palabra que el
  // jugador eligió es más predecible que "la primera que tenga hueco").
  _onKey(letter) {
    if (!this._selected) return;
    const { r, c } = this._selected;
    this._answers[r][c] = letter || '';
    this._renderAnswers();
    this._msgText.setText('');
    if (!letter) return;

    const w = this._puzzle.words[this._activeWordId];
    const cell = this._grid.cells[r][c];
    const ref = cell.refs.find(rf => rf.wordId === this._activeWordId);
    const nextIndex = ref.index + 1;
    if (nextIndex >= w.word.length) return;

    const nr = w.dir === 'down' ? w.row + nextIndex - this._grid.minRow : r;
    const nc = w.dir === 'across' ? w.col + nextIndex - this._grid.minCol : c;
    if (this._grid.cells[nr] && this._grid.cells[nr][nc]) this._select(nr, nc, this._activeWordId);
  }

  _renderAnswers() {
    for (let r = 0; r < this._grid.rows; r++) {
      for (let c = 0; c < this._grid.cols; c++) {
        const txt = this._cellTexts[r][c];
        if (txt) txt.setText(this._answers[r][c] || '');
      }
    }
  }

  _verify() {
    let complete = true;
    let correct = true;
    for (let r = 0; r < this._grid.rows; r++) {
      for (let c = 0; c < this._grid.cols; c++) {
        const cell = this._grid.cells[r][c];
        if (!cell) continue;
        if (!this._answers[r][c]) complete = false;
        else if (this._answers[r][c] !== cell.letter) correct = false;
      }
    }

    if (!complete) {
      this._msgText.setText('Faltan casilleros por completar').setStyle({ fill: '#fbbf24' });
      return;
    }
    if (!correct) {
      this._msgText.setText('Hay alguna letra mal — revisá las pistas').setStyle({ fill: '#ef4444' });
      return;
    }

    if (!this._rewardClaimed) {
      this._rewardClaimed = true;
      this.stats.addFun(CROSSWORD_WIN_FUN);
      this.inventory.addCoins(CROSSWORD_WIN_COINS);
      this._msgText.setText(`¡Ganaste! 🎉 +${CROSSWORD_WIN_FUN} 🎉 +${CROSSWORD_WIN_COINS} 🪙`).setStyle({ fill: '#22c55e' });
    } else {
      this._msgText.setText('¡Ganaste! 🎉').setStyle({ fill: '#22c55e' });
    }
  }
}
