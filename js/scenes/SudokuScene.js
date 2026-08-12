// Minijuego Sudoku 9x9 estándar (el usuario pidió cambiarlo de la versión
// mínima 4x4 original a un 9x9 de verdad). Acceso: la mesa de la Sala de
// actividades (ActivityScene._openMinijuegosMenu) la lanza igual que
// HelpScene/SettingsScene — pausa a quien la abre, se cierra con "✕" y la
// reanuda. No es una RoomScene (no es una sala de la cabaña, es un
// minijuego de pantalla completa), mismo criterio que Help/Settings/Map.
//
// Generación: construye una grilla resuelta con el patrón diagonal clásico
// `(3*(r%3) + floor(r/3) + c) % 9` (siempre válido) y le aplica las
// simetrías que preservan validez de un sudoku: reordenar las 3 bandas de
// filas y las filas dentro de cada banda, ídem con columnas/pilas, y
// permutar los 9 dígitos — variedad real sin necesitar backtracking para
// generar. NO se verifica que el tablero resultante tenga solución única
// (eso sí requeriría un solver con backtracking) — para un minijuego casual
// alcanza con validar por REGLAS al verificar (ver isSolved), no contra una
// solución única precalculada.
const SIZE = 9;
const BOX = 3;
const SUDOKU_HOLES = 41; // de 81 celdas, cuántas quedan vacías — deja 40 pistas fijas (dificultad fácil/media)

// Recompensa al ganar (pedido del usuario tras probar el minijuego: no daba
// nada). Solo diversión — Sudoku no toca sueño ni hambre. Monto de monedas
// por encima de cosechar/cocinar (2-8, ver js/data/plants.js y recetas.js)
// porque resolver un 9x9 lleva bastante más esfuerzo que esas acciones.
const SUDOKU_WIN_FUN = 20;
const SUDOKU_WIN_COINS = 10;

function shuffleArray(arr) {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Reordena los índices 0..8 agrupados en 3 bandas de 3: cada banda se ubica
// en un orden al azar, y dentro de cada banda sus 3 índices también se
// mezclan entre sí — mismo criterio para filas y columnas.
function shuffledBandOrder() {
  const order = [];
  shuffleArray([0, 1, 2]).forEach(band => {
    shuffleArray([0, 1, 2]).forEach(i => order.push(band * BOX + i));
  });
  return order;
}

function generateSolution() {
  const rowOrder = shuffledBandOrder();
  const colOrder = shuffledBandOrder();
  const digitPerm = shuffleArray([1, 2, 3, 4, 5, 6, 7, 8, 9]);

  const grid = [];
  for (let ri = 0; ri < SIZE; ri++) {
    const r = rowOrder[ri];
    const row = [];
    for (let ci = 0; ci < SIZE; ci++) {
      const c = colOrder[ci];
      const base = (BOX * (r % BOX) + Math.floor(r / BOX) + c) % SIZE; // 0..8, patrón diagonal clásico
      row.push(digitPerm[base]);
    }
    grid.push(row);
  }
  return grid;
}

function generatePuzzle() {
  const solution = generateSolution();
  const given = solution.map(row => row.map(() => true));

  const cells = [];
  for (let r = 0; r < SIZE; r++) for (let c = 0; c < SIZE; c++) cells.push([r, c]);
  shuffleArray(cells).slice(0, SUDOKU_HOLES).forEach(([r, c]) => { given[r][c] = false; });

  const puzzle = solution.map((row, r) => row.map((v, c) => (given[r][c] ? v : 0)));
  return { solution, puzzle, given };
}

function groupValid(values) {
  if (values.some(v => v === 0)) return false;
  return new Set(values).size === SIZE;
}

// true solo si está completo Y respeta las reglas — no compara contra la
// solución generada (un sudoku con celdas vacías puede tener más de una
// solución válida; lo correcto es validar las reglas, no la igualdad exacta).
function isSolved(grid) {
  for (let i = 0; i < SIZE; i++) {
    if (!groupValid(grid[i])) return false;
    if (!groupValid(grid.map(row => row[i]))) return false;
  }
  for (let br = 0; br < SIZE; br += BOX) {
    for (let bc = 0; bc < SIZE; bc += BOX) {
      const box = [];
      for (let dr = 0; dr < BOX; dr++) for (let dc = 0; dc < BOX; dc++) box.push(grid[br + dr][bc + dc]);
      if (!groupValid(box)) return false;
    }
  }
  return true;
}

class SudokuScene extends Phaser.Scene {
  constructor() { super('SudokuScene'); }

  init(data) {
    this._callerKey = data && data.callerKey;
  }

  create() {
    const W = this.scale.width;
    const H = this.scale.height;

    this.stats = this.registry.get('stats');
    this.inventory = this.registry.get('inventory');

    this.add.rectangle(0, 0, W, H, 0x1a1a2e, 1).setOrigin(0).setDepth(0);

    this.add.text(W / 2, 50, '🔢 Sudoku', {
      fontSize: '20px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#e9d5ff',
    }).setOrigin(0.5).setDepth(1);

    const closeBtn = this.add.text(W - 20, 26, '✕', {
      fontSize: '20px', fill: '#a78bfa', fontFamily: 'monospace',
    }).setOrigin(1, 0.5).setDepth(1).setInteractive({ useHandCursor: true });
    closeBtn.on('pointerover', () => closeBtn.setStyle({ fill: '#ffffff' }));
    closeBtn.on('pointerout', () => closeBtn.setStyle({ fill: '#a78bfa' }));
    closeBtn.on('pointerdown', () => {
      this.scene.stop();
      if (this._callerKey) this.scene.resume(this._callerKey);
    });

    // 9 celdas en ~324px (36px c/u) — entra con margen en los 390px de ancho
    // del juego, a diferencia del 4x4 anterior que usaba celdas de 68px.
    this._cellSize = 36;
    this._gridSize = this._cellSize * SIZE;
    this._gridX = (W - this._gridSize) / 2;
    this._gridY = 90;

    this._gridGfx = this.add.graphics().setDepth(1);
    this._cellTexts = [];
    for (let r = 0; r < SIZE; r++) {
      const row = [];
      for (let c = 0; c < SIZE; c++) {
        const cx = this._gridX + c * this._cellSize + this._cellSize / 2;
        const cy = this._gridY + r * this._cellSize + this._cellSize / 2;
        const txt = this.add.text(cx, cy, '', {
          fontSize: '17px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
        }).setOrigin(0.5).setDepth(3);
        row.push(txt);
      }
      this._cellTexts.push(row);
    }
    // Zona interactiva única sobre toda la grilla — resuelve la celda tocada
    // por posición en vez de 81 zonas individuales.
    this.add.zone(this._gridX, this._gridY, this._gridSize, this._gridSize)
      .setOrigin(0).setDepth(2).setInteractive({ useHandCursor: true })
      .on('pointerdown', (pointer) => this._onGridTap(pointer));

    this._msgText = this.add.text(W / 2, this._gridY + this._gridSize + 26, '', {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#22c55e',
    }).setOrigin(0.5).setDepth(1);

    const btnY = this._gridY + this._gridSize + 66;
    this._makeButton(W / 2 - 80, btnY, 'Verificar', () => this._verify());
    this._makeButton(W / 2 + 80, btnY, 'Nuevo', () => this._newPuzzle());

    this.add.text(W / 2, btnY + 46, 'Tocá una celda vacía para ciclar 1-9', {
      fontSize: '11px', fontFamily: 'monospace', fill: '#94a3b8',
    }).setOrigin(0.5).setDepth(1);

    this._newPuzzle();
  }

  _makeButton(x, y, label, onTap) {
    const btn = this.add.text(x, y, label, {
      fontSize: '14px', fontFamily: 'monospace', fontStyle: 'bold', fill: '#ffffff',
      backgroundColor: '#7c3aed', padding: { x: 14, y: 7 },
    }).setOrigin(0.5).setDepth(1).setInteractive({ useHandCursor: true });
    btn.on('pointerover', () => btn.setStyle({ backgroundColor: '#9333ea' }));
    btn.on('pointerout', () => btn.setStyle({ backgroundColor: '#7c3aed' }));
    btn.on('pointerdown', onTap);
    return btn;
  }

  _newPuzzle() {
    const { puzzle, given } = generatePuzzle();
    this._grid = puzzle.map(row => row.slice());
    this._given = given;
    this._rewardClaimed = false; // un puzzle nuevo habilita la recompensa de nuevo
    this._msgText.setText('');
    this._drawGridLines();
    this._renderGrid();
  }

  _drawGridLines() {
    const g = this._gridGfx;
    g.clear();
    g.fillStyle(0x2a2a4a, 1);
    g.fillRect(this._gridX, this._gridY, this._gridSize, this._gridSize);

    for (let i = 0; i <= SIZE; i++) {
      const thick = i % BOX === 0;
      g.lineStyle(thick ? 3 : 1, thick ? 0x7c3aed : 0x4c4c74, 1);
      g.lineBetween(this._gridX + i * this._cellSize, this._gridY, this._gridX + i * this._cellSize, this._gridY + this._gridSize);
      g.lineBetween(this._gridX, this._gridY + i * this._cellSize, this._gridX + this._gridSize, this._gridY + i * this._cellSize);
    }
  }

  _renderGrid() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        const v = this._grid[r][c];
        const txt = this._cellTexts[r][c];
        txt.setText(v === 0 ? '' : String(v));
        txt.setStyle({ fill: this._given[r][c] ? '#facc15' : '#e9d5ff' });
      }
    }
  }

  _onGridTap(pointer) {
    const c = Math.floor((pointer.x - this._gridX) / this._cellSize);
    const r = Math.floor((pointer.y - this._gridY) / this._cellSize);
    if (r < 0 || r >= SIZE || c < 0 || c >= SIZE) return;
    if (this._given[r][c]) return; // las pistas fijas no se tocan

    this._grid[r][c] = (this._grid[r][c] + 1) % (SIZE + 1); // 0(vacío)→1→...→9→0...
    this._renderGrid();
    this._msgText.setText('');
  }

  _verify() {
    const complete = this._grid.every(row => row.every(v => v !== 0));
    if (!complete) {
      this._msgText.setText('Faltan celdas por completar').setStyle({ fill: '#fbbf24' });
      return;
    }
    if (isSolved(this._grid)) {
      // Guarda contra farmear: tocar "Verificar" varias veces sobre el
      // mismo tablero ya resuelto no debe repartir la recompensa cada vez
      // — solo se vuelve a habilitar con "Nuevo" (ver _newPuzzle).
      if (!this._rewardClaimed) {
        this._rewardClaimed = true;
        this.stats.addFun(SUDOKU_WIN_FUN);
        this.inventory.addCoins(SUDOKU_WIN_COINS);
        this._msgText.setText(`¡Ganaste! 🎉 +${SUDOKU_WIN_FUN} 🎉 +${SUDOKU_WIN_COINS} 🪙`).setStyle({ fill: '#22c55e' });
      } else {
        this._msgText.setText('¡Ganaste! 🎉').setStyle({ fill: '#22c55e' });
      }
    } else {
      this._msgText.setText('Hay un error en alguna fila/columna/cuadro').setStyle({ fill: '#ef4444' });
    }
  }
}
