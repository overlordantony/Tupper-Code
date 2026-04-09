const W = 106, H = 17, SCALE = 5;
let grid = Array.from({length:H}, () => new Array(W).fill(0));
let isDrawing = false, drawValue = 1;
let lastDecodedGrid = null;

const drawCanvas = document.getElementById('drawCanvas');
const dctx = drawCanvas.getContext('2d');
drawCanvas.width = W * SCALE;
drawCanvas.height = H * SCALE;

const decodeCanvas = document.getElementById('decodeCanvas');
const rctx = decodeCanvas.getContext('2d');
decodeCanvas.width = W * SCALE;
decodeCanvas.height = H * SCALE;

function renderDraw() {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      dctx.fillStyle = grid[y][x]
        ? getComputedStyle(document.documentElement).getPropertyValue('--pixel-on').trim() || '#1a1a18'
        : getComputedStyle(document.documentElement).getPropertyValue('--pixel-off').trim() || '#f0efea';
      dctx.fillRect(x * SCALE, y * SCALE, SCALE - 1, SCALE - 1);
    }
  }
  const active = grid.flat().filter(Boolean).length;
  document.getElementById('pixelCount').textContent = `píxeles activos: ${active} / ${W*H}`;
}

function getCell(e) {
  const r = drawCanvas.getBoundingClientRect();
  const scaleX = drawCanvas.width / r.width;
  const scaleY = drawCanvas.height / r.height;
  const cx = (e.clientX - r.left) * scaleX;
  const cy = (e.clientY - r.top) * scaleY;
  return [Math.floor(cx / SCALE), Math.floor(cy / SCALE)];
}

function setCell(x, y, val) {
  if (x >= 0 && x < W && y >= 0 && y < H) {
    grid[y][x] = val;
  }
}

drawCanvas.addEventListener('mousedown', e => {
  const [x, y] = getCell(e);
  if (x >= 0 && x < W && y >= 0 && y < H) {
    drawValue = grid[y][x] ? 0 : 1;
    isDrawing = true;
    setCell(x, y, drawValue);
    renderDraw();
    renderZoom && renderZoom(x, y);
  }
});
drawCanvas.addEventListener('mouseup', () => isDrawing = false);

drawCanvas.addEventListener('touchstart', e => {
  e.preventDefault();
  const t = e.touches[0];
  const [x, y] = getCell(t);
  if (x >= 0 && x < W && y >= 0 && y < H) {
    drawValue = grid[y][x] ? 0 : 1;
    isDrawing = true;
    setCell(x, y, drawValue);
    renderDraw();
  }
}, { passive: false });
drawCanvas.addEventListener('touchmove', e => {
  e.preventDefault();
  if (!isDrawing) return;
  const t = e.touches[0];
  const [x, y] = getCell(t);
  setCell(x, y, drawValue);
  renderDraw();
}, { passive: false });
drawCanvas.addEventListener('touchend', () => isDrawing = false);

function switchTab(tab) {
  document.querySelectorAll('.tab').forEach((b, i) =>
    b.classList.toggle('active', ['encode','decode'][i] === tab));
  document.querySelectorAll('.panel').forEach((p, i) =>
    p.classList.toggle('active', ['panel-encode','panel-decode'][i] === 'panel-' + tab));
}

function clearGrid() {
  grid = Array.from({length:H}, () => new Array(W).fill(0));
  renderDraw();
  document.getElementById('encodeOutput').style.display = 'none';
}

function invertGrid() {
  for (let y = 0; y < H; y++)
    for (let x = 0; x < W; x++)
      grid[y][x] = grid[y][x] ? 0 : 1;
  renderDraw();
}

function promptText() {
  const txt = prompt('Texto a dibujar (máx ~14 chars recomendado):', 'HOLA');
  if (!txt) return;
  const off = document.createElement('canvas');
  off.width = W * SCALE;
  off.height = H * SCALE;
  const ctx2 = off.getContext('2d');
  const fs = Math.min(H * SCALE * 0.82, Math.floor(W * SCALE * 0.9 / Math.max(txt.length, 1) * 1.55));
  ctx2.font = `bold ${fs}px monospace`;
  ctx2.textBaseline = 'middle';
  const tw = ctx2.measureText(txt).width;
  const tx = Math.max(2, (W * SCALE - tw) / 2);
  ctx2.fillStyle = '#000';
  ctx2.fillText(txt, tx, H * SCALE / 2);
  const id = ctx2.getImageData(0, 0, W * SCALE, H * SCALE);
  grid = Array.from({length:H}, () => new Array(W).fill(0));
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      let hit = 0;
      for (let dy = 0; dy < SCALE && !hit; dy++)
        for (let dx = 0; dx < SCALE && !hit; dx++) {
          const i = ((y * SCALE + dy) * W * SCALE + (x * SCALE + dx)) * 4;
          if (id.data[i] < 128) hit = 1;
        }
      grid[y][x] = hit;
    }
  }
  renderDraw();
}

function loadExample(type) {
  grid = Array.from({length:H}, () => new Array(W).fill(0));
  if (type === 'smile') {
    const pts = [
      [2,4],[3,4],[4,4],[5,5],[5,6],[4,7],[3,7],[2,7],[1,6],[1,5],
      [3,2],[3,3],[7,2],[7,3],
    ];
    const ox = 40, oy = 2;
    pts.forEach(([x,y]) => { if(oy+y<H && ox+x<W) grid[oy+y][ox+x]=1; });
    const mirror = pts.map(([x,y])=>[-x+9,y]);
    mirror.forEach(([x,y]) => { if(oy+y<H && ox+x<W) grid[oy+y][ox+x]=1; });
  }
  renderDraw();
}

const SELF_K = "960939379918958884971672962127852754715004339660129306651505519271702802395266424689642842174350718121267153782770623355993237280874144307891325963941337723487857735749823926629715517173716995165232890538221612403238855866184013";

function loadSelfRef() {
  const k = BigInt(SELF_K);
  const g = bigIntToGrid(k);
  grid = g;
  renderDraw();
}

function gridToBigInt() {
  let n = 0n;
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++)
      if (grid[y][x]) n |= (1n << BigInt(x * H + (H - 1 - y)));
  return n;
}

function bigIntToGrid(k) {
  const n = k / 17n;
  const g = Array.from({length:H}, () => new Array(W).fill(0));
  for (let x = 0; x < W; x++)
    for (let y = 0; y < H; y++) {
      const bit = n >> BigInt(x * H + (H - 1 - y));
      g[y][x] = Number(bit & 1n);
    }
  return g;
}

function encode() {
  const n = gridToBigInt();
  const k = n * 17n;
  const str = k.toString();
  document.getElementById('kValue').textContent = str;
  document.getElementById('encodeOutput').style.display = 'block';
  document.getElementById('copyStatus').textContent = '';
  window._lastK = str;
}

function copyK() {
  const val = document.getElementById('kValue').textContent;
  navigator.clipboard.writeText(val)
    .then(() => { document.getElementById('copyStatus').textContent = 'Número copiado al portapapeles.'; })
    .catch(() => {
      document.getElementById('copyStatus').textContent = 'Selecciona el número manualmente y copia con Ctrl+C.';
    });
}

function downloadK() {
  const val = document.getElementById('kValue').textContent;
  const blob = new Blob([val], { type: 'text/plain' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'tupper-k.txt';
  a.click();
}

function shareK() {
  const val = document.getElementById('kValue').textContent;
  if (navigator.share) {
    navigator.share({ title: 'Tupper k', text: val })
      .catch(() => copyK());
  } else {
    copyK();
  }
}

function decode() {
  const raw = document.getElementById('kInput').value.trim().replace(/\s+/g, '');
  const status = document.getElementById('decodeStatus');
  if (!raw) { status.textContent = 'Pega un número k primero.'; status.className = 'status error'; return; }
  let k;
  try { k = BigInt(raw); } catch(e) { status.textContent = 'El número no es válido.'; status.className = 'status error'; return; }
  if (k < 0n) { status.textContent = 'k debe ser positivo.'; status.className = 'status error'; return; }
  const g = bigIntToGrid(k);
  lastDecodedGrid = g;
  renderDecoded(g);
  document.getElementById('decodeOutput').style.display = 'block';
  const bits = g.flat().filter(Boolean).length;
  status.textContent = `Decodificado: ${bits} píxeles activos. ` + (k % 17n === 0n ? '' : '(k no es múltiplo de 17)');
  status.className = 'status';
}

function renderDecoded(g) {
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      rctx.fillStyle = g[y][x] ? '#1a1a18' : '#f0efea';
      rctx.fillRect(x * SCALE, y * SCALE, SCALE - 1, SCALE - 1);
    }
  }
}

function downloadImage() {
  const a = document.createElement('a');
  a.href = decodeCanvas.toDataURL('image/png');
  a.download = 'tupper-imagen.png';
  a.click();
}

function sendToEncoder() {
  if (!lastDecodedGrid) return;
  grid = lastDecodedGrid.map(r => [...r]);
  renderDraw();
  switchTab('encode');
}

function loadSelfRefDecode() {
  document.getElementById('kInput').value = SELF_K;
  decode();
}

renderDraw();

const zoomLens = document.getElementById('zoomLens');
const zoomCanvas = document.getElementById('zoomCanvas');
const zoomCtx = zoomCanvas.getContext('2d');
const zoomCoords = document.getElementById('zoomCoords');
const ZOOM_RADIUS = 3;
const ZOOM_CELL = 20;

function renderZoom(cx, cy) {
  const dark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const colorOn   = dark ? '#f0efea' : '#1a1a18';
  const colorOff  = dark ? '#2a2a26' : '#f0efea';
  const colorOut  = dark ? '#333330' : '#dddcd6';
  const colorAcc  = '#534AB7';

  zoomCtx.clearRect(0, 0, zoomCanvas.width, zoomCanvas.height);

  for (let dy = -ZOOM_RADIUS; dy <= ZOOM_RADIUS; dy++) {
    for (let dx = -ZOOM_RADIUS; dx <= ZOOM_RADIUS; dx++) {
      const gx = cx + dx, gy = cy + dy;
      const px = (dx + ZOOM_RADIUS) * ZOOM_CELL;
      const py = (dy + ZOOM_RADIUS) * ZOOM_CELL;
      const inBounds = gx >= 0 && gx < W && gy >= 0 && gy < H;
      zoomCtx.fillStyle = !inBounds ? colorOut : (grid[gy] && grid[gy][gx] ? colorOn : colorOff);
      zoomCtx.fillRect(px, py, ZOOM_CELL - 1, ZOOM_CELL - 1);
    }
  }

  const midX = ZOOM_RADIUS * ZOOM_CELL;
  const midY = ZOOM_RADIUS * ZOOM_CELL;
  zoomCtx.strokeStyle = colorAcc;
  zoomCtx.lineWidth = 1.5;
  zoomCtx.beginPath();
  zoomCtx.moveTo(midX - 5, midY + ZOOM_CELL / 2);
  zoomCtx.lineTo(midX + ZOOM_CELL + 5, midY + ZOOM_CELL / 2);
  zoomCtx.moveTo(midX + ZOOM_CELL / 2, midY - 5);
  zoomCtx.lineTo(midX + ZOOM_CELL / 2, midY + ZOOM_CELL + 5);
  zoomCtx.stroke();
  zoomCtx.strokeRect(midX + 1, midY + 1, ZOOM_CELL - 2, ZOOM_CELL - 2);

  zoomCoords.textContent = 'x:' + cx + '  y:' + cy;
}

function positionZoom(e) {
  const lensW = 158, lensH = 175, pad = 20;
  let lx = e.clientX + pad;
  let ly = e.clientY + pad;
  if (lx + lensW > window.innerWidth - 8)  lx = e.clientX - lensW - pad;
  if (ly + lensH > window.innerHeight - 8) ly = e.clientY - lensH - pad;
  zoomLens.style.left = lx + 'px';
  zoomLens.style.top  = ly + 'px';
}

drawCanvas.addEventListener('mouseenter', () => zoomLens.style.display = 'block');
drawCanvas.addEventListener('mouseleave', () => { zoomLens.style.display = 'none'; isDrawing = false; });
drawCanvas.addEventListener('mousemove', e => {
  const [x, y] = getCell(e);
  positionZoom(e);
  renderZoom(x, y);
  if (isDrawing) { setCell(x, y, drawValue); renderDraw(); }
});
