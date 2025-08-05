// AGGRESSIVE DEBUGGING - This should ALWAYS work
console.log('🚀 SCRIPT.JS IS LOADING...');
document.title = 'PixelPro - Script Loaded';
document.body.style.border = '5px solid red';
console.log('🚀 SCRIPT.JS BASIC SETUP COMPLETE');

// WRAP EVERYTHING IN ERROR HANDLING
try {
  console.log('=== PIXELPRO SCRIPT STARTING ===');
  console.log('✅ DOM manipulation test passed');

  // Safe event listener helper to prevent null pointer errors
  function safeAddEventListener(element, event, handler) {
    if (element && typeof element.addEventListener === 'function') {
      element.addEventListener(event, handler);
      return true;
    }
    console.warn(`⚠️ Element not found for ${event} event listener:`, element);
    return false;
  }

// --- Menu Bar Logic ---
const menuBar = document.querySelector('.menubar');
let openMenu = null;
let menuBtns = menuBar ? menuBar.querySelectorAll('button[data-menu]') : [];
function closeAllMenus() {
  document.querySelectorAll('.dropdown').forEach(d => d.classList.remove('open'));
  openMenu = null;
}
menuBtns.forEach(btn => {
  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    let parent = btn.closest('.dropdown');
    let wasOpen = parent.classList.contains('open');
    closeAllMenus();
    if (!wasOpen) {
      parent.classList.add('open');
      openMenu = parent;
      setTimeout(() => parent.querySelector('.menuitem')?.focus(), 30);
    }
  });
  btn.addEventListener('keydown', (e) => {
    let idx = Array.from(menuBtns).indexOf(e.target);
    if (["ArrowRight", "ArrowLeft"].includes(e.key)) {
      closeAllMenus();
      let next = e.key === "ArrowRight" ? (idx + 1) % menuBtns.length : (idx - 1 + menuBtns.length) % menuBtns.length;
      menuBtns[next].focus();
    }
    if (e.key === "Enter" || e.key === "ArrowDown" || e.key === " ") {
      e.preventDefault();
      e.target.click();
    }
  });
});
document.body.addEventListener('click', (e) => {
  if (!e.target.closest('.dropdown')) closeAllMenus();
});
document.querySelectorAll('.dropdown-menu').forEach(menu => {
  let items = menu.querySelectorAll('.menuitem');
  items.forEach((item, idx) => {
    if (item) {
    item.tabIndex = 0;
    item.addEventListener('keydown', (e) => {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        items[(idx + 1) % items.length].focus();
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        items[(idx - 1 + items.length) % items.length].focus();
      }
      if (e.key === "Escape") {
        closeAllMenus();
        menu.parentElement.querySelector('button[data-menu]').focus();
      }
    });
    }
  });
});

// --- Modals ---
function showModal(contentHtml) {
  const modalContent = document.getElementById('modal-content');
  const modalBg = document.getElementById('modal-bg');
  if (modalContent) modalContent.innerHTML = contentHtml;
  if (modalBg) {
    modalBg.classList.remove('hidden');
    setTimeout(() => modalBg.focus(), 50);
  }
}
function closeModal() {
  const modalBg = document.getElementById('modal-bg');
  if (modalBg) modalBg.classList.add('hidden');
}
const modalCloseBtn = document.getElementById('modalCloseBtn');
const modalBg = document.getElementById('modal-bg');
if (modalCloseBtn) modalCloseBtn.onclick = closeModal;
if (modalBg) {
  modalBg.addEventListener('click', function(e) {
  if (e.target === this) closeModal();
});
}
document.addEventListener('keydown', function(e) {
  const modalBg = document.getElementById('modal-bg');
  if (modalBg && !modalBg.classList.contains('hidden') && e.key === "Escape") closeModal();
});

// --- Theme ---
function applyTheme(dark) {
  document.body.classList.toggle('dark', dark);
  if (dark) localStorage.setItem('pixelpro-theme', 'dark');
  else localStorage.setItem('pixelpro-theme', 'light');
}
function loadTheme() {
  const t = localStorage.getItem('pixelpro-theme');
  applyTheme(t === 'dark' || (!t && window.matchMedia('(prefers-color-scheme: dark)').matches));
}
loadTheme();
const toggleDarkModeBtn = document.getElementById('toggleDarkMode');
if (toggleDarkModeBtn) {
  toggleDarkModeBtn.onclick = function() {
  const dark = !document.body.classList.contains('dark');
  applyTheme(dark);
};
}

// --- Pixel Art App Logic ---
const DEFAULT_GRID_SIZE = 16;
const DEFAULT_COLOR = "#22223b";
const TRANSPARENT = null; // Use null for transparent pixels
let gridSize = DEFAULT_GRID_SIZE;
let currentColor = DEFAULT_COLOR;
let frames = [];
let currentFrame = 0;
let currentLayer = 0;
let layers = []; // Each frame has multiple layers
let layerIdCounter = 1;
let tool = "draw";
let brushSize = 3;
let brushShape = "square";
let shapeMode = "outline"; // "outline" or "filled"
let palette = ['#22223b', '#f72585', '#b5179e', '#3a86ff', '#ffbe0b', '#fb5607', '#fff'];
let undoStack = [];
let redoStack = [];
let mouseDown = false;
let hasPushedUndoThisDrag = false;
let startPixel = null; // For line/shape tools
let previewPixels = []; // For shape preview
let layersPanelShown = window.innerWidth > 1024; // Show by default only on large screens
let draggedLayerIndex = null;
let isEditingLayerName = false;
let moveStartPixel = null;
let moveOriginalData = null;
let movePreviewData = null;
let isMoving = false;
let textClickPosition = null;

// Transform tool state
let transformMode = "rotate"; // "rotate" or "scale"
let isTransforming = false;
let transformOriginalData = null;
let transformPreviewData = null;
let transformBounds = null;
let transformCenter = null;
let transformStartAngle = 0;
let transformCurrentAngle = 0;
let transformScale = 1.0;

// Font system state
let currentFontFamily = "pixel"; // "pixel", "small", "large"
let currentFontSize = 1; // 1x, 2x, 3x scaling

// Canvas settings state
let selectedCanvasPreset = 16;
let selectedPalettePreset = "default";

// Color palette presets
const palettePresets = {
  default: ['#22223b', '#f72585', '#b5179e', '#3a86ff', '#ffbe0b', '#fb5607', '#fff'],
  gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
  nes: ['#000000', '#fcfcfc', '#f83800', '#3cbcfc', '#00d800', '#ffff00', '#8b4513']
};

// DOM
const paletteElem = document.getElementById('palette');
const paletteAddBtn = document.getElementById('paletteAdd');
const gridElem = document.getElementById('grid');
const colorPicker = document.getElementById('colorPicker');
const brushControls = document.querySelectorAll('#brushControls');
const brushSizeInput = document.getElementById('brushSize');
const brushShapeSquare = document.getElementById('brushShapeSquare');
const brushShapeCircle = document.getElementById('brushShapeCircle');
const brushSizeVal = { textContent: brushSize }; // dummy object for legacy code
const gridSizeInput = document.getElementById('gridSizeApp'); // Updated to reference app bar control
const resizeGridBtn = document.getElementById('resizeGridApp'); // Updated to reference app bar control
const clearBtn = document.getElementById('clearBtn');
const undoBtn = document.getElementById('undoBtn');
const redoBtn = document.getElementById('redoBtn');
const prevFrameBtn = document.getElementById('prevFrame');
const nextFrameBtn = document.getElementById('nextFrame');
const addFrameBtn = document.getElementById('addFrame');
const deleteFrameBtn = document.getElementById('deleteFrame');
const playAnimBtn = document.getElementById('playAnim');
const frameLabel = document.getElementById('frameLabel');
const animModal = document.getElementById('animModal');
const animCanvas = document.getElementById('animCanvas');
const closeAnimBtn = document.getElementById('closeAnim');
const exportBtn = document.getElementById('exportBtn');
const toolDraw   = document.getElementById('toolDraw');
const toolBrush  = document.getElementById('toolBrush');
const toolEraser = document.getElementById('toolEraser');
const toolFill   = document.getElementById('toolFill');
const toolLine   = document.getElementById('toolLine');
const toolRect   = document.getElementById('toolRect');
const toolCircle = document.getElementById('toolCircle');
const toolEyedropper = document.getElementById('toolEyedropper');
const toolMove = document.getElementById('toolMove');
const toolText = document.getElementById('toolText');
const toolTransform = document.getElementById('toolTransform');
const allToolBtns = [toolDraw, toolBrush, toolEraser, toolFill, toolLine, toolRect, toolCircle, toolEyedropper, toolMove, toolText, toolTransform];
const paletteBar = document.getElementById('paletteBar');
const shapeControls = document.getElementById('shapeControls');
const shapeOutline = document.getElementById('shapeOutline');
const shapeFilled = document.getElementById('shapeFilled');

// Text tool elements
const textModal = document.getElementById('textModal');
const textInput = document.getElementById('textInput');
const addTextBtn = document.getElementById('addText');
const cancelTextBtn = document.getElementById('cancelText');

// Transform tool elements
const transformControls = document.getElementById('transformControls');
const transformRotateBtn = document.getElementById('transformRotate');
const transformScaleBtn = document.getElementById('transformScale');
const applyTransformBtn = document.getElementById('applyTransform');
const cancelTransformBtn = document.getElementById('cancelTransform');
const transformOverlay = document.getElementById('transformOverlay');
const transformBox = document.getElementById('transformBox');

// Application Bar elements
const fontControls = document.getElementById('fontControls');
const fontFamily = document.getElementById('fontFamily');
const fontSize = document.getElementById('fontSize');
const fontSizeLabel = document.getElementById('fontSizeLabel');
const gridSizeApp = document.getElementById('gridSizeApp');
const resizeGridApp = document.getElementById('resizeGridApp');
const gridSizeOld = document.getElementById('gridSize');  // Keep reference to old element
const resizeGridOld = document.getElementById('resizeGrid');  // Keep reference to old element

// Start Screen elements
const startScreen = document.getElementById('startScreen');
const startNewFileBtn = document.getElementById('startNewFile');
const startOpenFileBtn = document.getElementById('startOpenFile');
const startDemoBtn = document.getElementById('startDemo');
const startTutorialBtn = document.getElementById('startTutorial');
const skipStartBtn = document.getElementById('skipStart');
const recentFilesList = document.getElementById('recentFilesList');
const noRecentFiles = document.getElementById('noRecentFiles');
const clearRecentBtn = document.getElementById('clearRecent');

// Canvas Settings Modal elements
const canvasSettingsModal = document.getElementById('canvasSettingsModal');
const canvasWidth = document.getElementById('canvasWidth');
const canvasHeight = document.getElementById('canvasHeight');
const canvasBackground = document.getElementById('canvasBackground');
const canvasPreview = document.getElementById('canvasPreview');
const cancelCanvasSettings = document.getElementById('cancelCanvasSettings');
const createCanvasBtn = document.getElementById('createCanvas');

// Layers panel elements  
const layersPanel = document.getElementById('layersPanel');
const layersList = document.getElementById('layersList');
const addLayerBtn = document.getElementById('addLayer');
const deleteLayerBtn = document.getElementById('deleteLayer');
const duplicateLayerBtn = document.getElementById('duplicateLayer');
const moveLayerUpBtn = document.getElementById('moveLayerUp');
const moveLayerDownBtn = document.getElementById('moveLayerDown');
const closeLayersBtn = document.getElementById('closeLayers');

// Debug: Check if layer elements are found
if (!layersPanel) console.error('PixelPro: Layers panel element not found!');
else console.log('PixelPro: Layers panel element found successfully');

function createBlankFrame(size, fillColor = TRANSPARENT) { 
  return Array(size * size).fill(fillColor); 
}

function createLayer(name, size, fillColor = TRANSPARENT) {
  return {
    id: layerIdCounter++,
    name: name || `Layer ${layerIdCounter - 1}`,
    data: createBlankFrame(size, fillColor),
    visible: true,
    opacity: 100
  };
}

function createFrameWithLayers(size, fillColor = TRANSPARENT) {
  return [createLayer("Background", size, fillColor)];
}

function pushUndo() {
  // Deep copy the layers structure
  const layersCopy = layers.map(frameLayers => 
    frameLayers.map(layer => ({
      ...layer,
      data: [...layer.data]
    }))
  );
  undoStack.push({ 
    layers: layersCopy,
    frames: frames.map(frame => [...frame]), 
    currentFrame, 
    currentLayer,
    gridSize 
  });
  if (undoStack.length > 50) undoStack.shift();
  redoStack = [];
  updateUndoRedoButtons();
}
function updateUndoRedoButtons() {
  undoBtn.disabled = undoStack.length === 0;
  redoBtn.disabled = redoStack.length === 0;
  undoBtn.classList.toggle("opacity-50", undoBtn.disabled);
  redoBtn.classList.toggle("opacity-50", redoBtn.disabled);
  undoBtn.classList.toggle("cursor-not-allowed", undoBtn.disabled);
  redoBtn.classList.toggle("cursor-not-allowed", redoBtn.disabled);
}
function applyState(state) {
  if (state.layers) {
    layers = state.layers.map(frameLayers => 
      frameLayers.map(layer => ({
        ...layer,
        data: [...layer.data]
      }))
    );
  }
  if (state.frames) {
  frames = state.frames.map(frame => [...frame]);
  }
  currentFrame = state.currentFrame;
  currentLayer = state.currentLayer || 0;
  gridSize = state.gridSize;
  gridSizeInput.value = gridSize;
  renderGrid();
  updateFrameLabel();
  renderLayersList();
}
function compositePixel(pixelIndex) {
  // Composite all visible layers for this pixel
  let finalColor = null; // Start with transparent
  const frameLayers = layers[currentFrame] || [];
  
  for (let i = 0; i < frameLayers.length; i++) {
    const layer = frameLayers[i];
    if (!layer.visible) continue;
    
    const layerColor = layer.data[pixelIndex];
    if (layerColor === null || layerColor === TRANSPARENT) continue; // Skip transparent pixels
    
    if (layer.opacity >= 100) {
      finalColor = layerColor;
    } else {
      // Simple alpha blending (could be improved with proper color mixing)
      const alpha = layer.opacity / 100;
      if (alpha > 0.9) {
        finalColor = layerColor;
      } else {
        // For now, just use the layer color if opacity > 50%, otherwise keep background
        finalColor = alpha > 0.5 ? layerColor : finalColor;
      }
    }
  }
  
  // If final color is still null/transparent, show checkered background
  if (finalColor === null) {
    return getTransparentBackground(pixelIndex);
  }
  
  return finalColor;
}

function getTransparentBackground(pixelIndex) {
  // Create checkered pattern for transparent background
  const row = Math.floor(pixelIndex / gridSize);
  const col = pixelIndex % gridSize;
  const checkerSize = 4; // Size of each checker square
  
  const checkerRow = Math.floor(row / checkerSize);
  const checkerCol = Math.floor(col / checkerSize);
  
  // Alternate between light and dark squares
  const isLight = (checkerRow + checkerCol) % 2 === 0;
  return isLight ? '#f0f0f0' : '#e0e0e0';
}

function renderGrid() {
  gridElem.innerHTML = '';
  gridElem.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  gridElem.style.gridTemplateRows = `repeat(${gridSize}, 1fr)`;
  
  // Ensure we have layer data
  if (!layers[currentFrame]) {
    layers[currentFrame] = createFrameWithLayers(gridSize);
  }
  
  const totalPixels = gridSize * gridSize;
  for (let i = 0; i < totalPixels; i++) {
    const pixel = document.createElement('div');
    pixel.className = 'pixel';
    pixel.style.background = compositePixel(i);
    
    pixel.addEventListener('mousedown', e => {
      e.preventDefault();
      mouseDown = true;
      if (tool === "draw" || tool === "eraser") {
        if (!hasPushedUndoThisDrag) { pushUndo(); hasPushedUndoThisDrag = true; }
        paintPixel(i);
      } else if (tool === "fill") {
        pushUndo();
        fillAt(i);
      } else if (tool === "brush") {
        if (!hasPushedUndoThisDrag) { pushUndo(); hasPushedUndoThisDrag = true; }
        brushPaintAt(i);
      } else if (tool === "line" || tool === "rect" || tool === "circle") {
        startPixel = i;
        if (!hasPushedUndoThisDrag) { pushUndo(); hasPushedUndoThisDrag = true; }
      } else if (tool === "eyedropper") {
        eyedropAt(i);
      } else if (tool === "move") {
        startMove(i);
      } else if (tool === "text") {
        openTextModal(i);
      }
    });
    pixel.addEventListener('mouseover', e => {
      if (mouseDown) {
        if (tool === "draw" || tool === "eraser") paintPixel(i);
        else if (tool === "brush") brushPaintAt(i);
        else if ((tool === "line" || tool === "rect" || tool === "circle") && startPixel !== null) {
          previewShape(startPixel, i);
        } else if (tool === "move" && isMoving) {
          previewMove(i);
        }
      }
    });
    pixel.addEventListener('mouseup', () => {
      if (tool === "line" || tool === "rect" || tool === "circle") {
        if (startPixel !== null) {
          drawShape(startPixel, i);
          startPixel = null;
          clearPreview();
        }
      } else if (tool === "move" && isMoving) {
        finishMove(i);
      }
      mouseDown = false; hasPushedUndoThisDrag = false;
    });
    gridElem.appendChild(pixel);
  }
  
  // Update composite frame data for animation/export
  updateCompositeFrame();
}
document.body.addEventListener('mouseup', () => {
  if ((tool === "line" || tool === "rect" || tool === "circle") && startPixel !== null) {
    startPixel = null;
    clearPreview();
  }
  if (tool === "move" && isMoving) {
    cancelMove();
  }
  mouseDown = false; hasPushedUndoThisDrag = false;
});

function updateCompositeFrame() {
  // Update the frames array with composited data for compatibility
  if (!frames[currentFrame]) {
    frames[currentFrame] = createBlankFrame(gridSize);
  }
  
  for (let i = 0; i < gridSize * gridSize; i++) {
    frames[currentFrame][i] = compositePixel(i);
  }
}

function getCurrentLayer() {
  if (!layers[currentFrame]) {
    layers[currentFrame] = createFrameWithLayers(gridSize);
  }
  return layers[currentFrame][currentLayer] || layers[currentFrame][0];
}

function paintPixel(index) {
  const layer = getCurrentLayer();
  if (tool === "eraser") layer.data[index] = TRANSPARENT;
  else layer.data[index] = currentColor;
  renderGrid();
}
function brushPaintAt(index) {
  const layer = getCurrentLayer();
  const x0 = index % gridSize, y0 = Math.floor(index / gridSize), rad = Math.floor(brushSize / 2);
  for (let dy = -rad; dy <= rad; dy++) for (let dx = -rad; dx <= rad; dx++) {
    let x = x0 + dx, y = y0 + dy;
    if (x < 0 || x >= gridSize || y < 0 || y >= gridSize) continue;
    let idx = y * gridSize + x;
    if ((brushShape === "circle" && Math.sqrt(dx*dx + dy*dy) <= rad+0.01) || (brushShape === "square"))
      layer.data[idx] = currentColor;
  }
  renderGrid();
}
function fillAt(index) {
  const layer = getCurrentLayer();
  let targetColor = layer.data[index];
  let newColor = (tool === "eraser") ? TRANSPARENT : currentColor;
  if (targetColor === newColor) return;
  let toFill = [index], visited = new Set();
  while (toFill.length > 0) {
    let idx = toFill.pop();
    if (visited.has(idx)) continue;
    visited.add(idx);
    if (layer.data[idx] !== targetColor) continue;
    layer.data[idx] = newColor;
    let x = idx % gridSize, y = Math.floor(idx / gridSize);
    if (x > 0) toFill.push(idx - 1);
    if (x < gridSize - 1) toFill.push(idx + 1);
    if (y > 0) toFill.push(idx - gridSize);
    if (y < gridSize - 1) toFill.push(idx + gridSize);
  }
  renderGrid();
}

// New drawing functions for additional tools
function eyedropAt(index) {
  currentColor = compositePixel(index);
  colorPicker.value = currentColor;
  if (!palette.includes(currentColor)) {
    palette.push(currentColor);
  }
  setTool("draw");
  renderPalette();
}

function clearPreview() {
  previewPixels = [];
  renderGrid();
}

function previewShape(start, end) {
  clearPreview();
  if (tool === "line") {
    previewPixels = getLinePixels(start, end);
  } else if (tool === "rect") {
    previewPixels = getRectPixels(start, end);
  } else if (tool === "circle") {
    previewPixels = getCirclePixels(start, end);
  }
  renderGridWithPreview();
}

function drawShape(start, end) {
  const layer = getCurrentLayer();
  let pixels = [];
  if (tool === "line") {
    pixels = getLinePixels(start, end);
  } else if (tool === "rect") {
    pixels = getRectPixels(start, end);
  } else if (tool === "circle") {
    pixels = getCirclePixels(start, end);
  }
  
  pixels.forEach(idx => {
    if (idx >= 0 && idx < layer.data.length) {
      layer.data[idx] = currentColor;
    }
  });
  renderGrid();
}

function getLinePixels(start, end) {
  const x0 = start % gridSize, y0 = Math.floor(start / gridSize);
  const x1 = end % gridSize, y1 = Math.floor(end / gridSize);
  const pixels = [];
  
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = (x0 < x1) ? 1 : -1;
  const sy = (y0 < y1) ? 1 : -1;
  let err = dx - dy;
  
  let x = x0, y = y0;
  while (true) {
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      pixels.push(y * gridSize + x);
    }
    if (x === x1 && y === y1) break;
    const e2 = 2 * err;
    if (e2 > -dy) { err -= dy; x += sx; }
    if (e2 < dx) { err += dx; y += sy; }
  }
  return pixels;
}

function getRectPixels(start, end) {
  const x0 = Math.min(start % gridSize, end % gridSize);
  const y0 = Math.min(Math.floor(start / gridSize), Math.floor(end / gridSize));
  const x1 = Math.max(start % gridSize, end % gridSize);
  const y1 = Math.max(Math.floor(start / gridSize), Math.floor(end / gridSize));
  const pixels = [];
  
  if (shapeMode === "filled") {
    for (let y = y0; y <= y1; y++) {
      for (let x = x0; x <= x1; x++) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          pixels.push(y * gridSize + x);
        }
      }
    }
  } else {
    // Outline only
    for (let x = x0; x <= x1; x++) {
      if (x >= 0 && x < gridSize) {
        if (y0 >= 0 && y0 < gridSize) pixels.push(y0 * gridSize + x);
        if (y1 >= 0 && y1 < gridSize && y1 !== y0) pixels.push(y1 * gridSize + x);
      }
    }
    for (let y = y0; y <= y1; y++) {
      if (y >= 0 && y < gridSize) {
        if (x0 >= 0 && x0 < gridSize) pixels.push(y * gridSize + x0);
        if (x1 >= 0 && x1 < gridSize && x1 !== x0) pixels.push(y * gridSize + x1);
      }
    }
  }
  return pixels;
}

function getCirclePixels(start, end) {
  const centerX = start % gridSize, centerY = Math.floor(start / gridSize);
  const endX = end % gridSize, endY = Math.floor(end / gridSize);
  const radius = Math.round(Math.sqrt((endX - centerX) ** 2 + (endY - centerY) ** 2));
  const pixels = [];
  
  if (shapeMode === "filled") {
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          const px = centerX + x, py = centerY + y;
          if (px >= 0 && px < gridSize && py >= 0 && py < gridSize) {
            pixels.push(py * gridSize + px);
          }
        }
      }
    }
  } else {
    // Bresenham circle algorithm for outline
    let x = 0, y = radius;
    let d = 3 - 2 * radius;
    while (y >= x) {
      const points = [
        [centerX + x, centerY + y], [centerX - x, centerY + y],
        [centerX + x, centerY - y], [centerX - x, centerY - y],
        [centerX + y, centerY + x], [centerX - y, centerY + x],
        [centerX + y, centerY - x], [centerX - y, centerY - x]
      ];
      points.forEach(([px, py]) => {
        if (px >= 0 && px < gridSize && py >= 0 && py < gridSize) {
          pixels.push(py * gridSize + px);
        }
      });
      x++;
      if (d > 0) { y--; d = d + 4 * (x - y) + 10; }
      else d = d + 4 * x + 6;
    }
  }
  return pixels;
}

function renderGridWithPreview() {
  const pixels = document.querySelectorAll('.pixel');
  
  pixels.forEach((pixel, i) => {
    if (previewPixels.includes(i)) {
      pixel.style.background = currentColor;
      pixel.style.opacity = '0.7';
    } else if (tool === "move" && movePreviewData && i < movePreviewData.length) {
      pixel.style.background = movePreviewData[i];
      pixel.style.opacity = isMoving ? '0.8' : '1';
    } else {
      pixel.style.background = compositePixel(i);
      pixel.style.opacity = '1';
    }
  });
}

// ===== MOVE TOOL FUNCTIONS =====

function startMove(pixelIndex) {
  if (!hasPushedUndoThisDrag) { 
    pushUndo(); 
    hasPushedUndoThisDrag = true; 
  }
  
  moveStartPixel = pixelIndex;
  const layer = getCurrentLayer();
  moveOriginalData = [...layer.data];
  isMoving = true;
  
  console.log(`Move started at pixel ${pixelIndex}`);
}

function previewMove(currentPixel) {
  if (!isMoving || moveStartPixel === null) return;
  
  const deltaX = (currentPixel % gridSize) - (moveStartPixel % gridSize);
  const deltaY = Math.floor(currentPixel / gridSize) - Math.floor(moveStartPixel / gridSize);
  
  const layer = getCurrentLayer();
  movePreviewData = createBlankFrame(gridSize);
  
  // Move all non-transparent pixels
  for (let i = 0; i < moveOriginalData.length; i++) {
    if (moveOriginalData[i] !== '#fff') { // Only move non-transparent pixels
      const oldX = i % gridSize;
      const oldY = Math.floor(i / gridSize);
      const newX = oldX + deltaX;
      const newY = oldY + deltaY;
      
      // Check bounds
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        const newIndex = newY * gridSize + newX;
        movePreviewData[newIndex] = moveOriginalData[i];
      }
    }
  }
  
  renderGridWithPreview();
}

function finishMove(endPixel) {
  if (!isMoving || moveStartPixel === null) return;
  
  const deltaX = (endPixel % gridSize) - (moveStartPixel % gridSize);
  const deltaY = Math.floor(endPixel / gridSize) - Math.floor(moveStartPixel / gridSize);
  
  console.log(`Move finished: delta(${deltaX}, ${deltaY})`);
  
  const layer = getCurrentLayer();
  const newData = createBlankFrame(gridSize);
  
  // Move all non-transparent pixels
  for (let i = 0; i < moveOriginalData.length; i++) {
    if (moveOriginalData[i] !== '#fff') { // Only move non-transparent pixels
      const oldX = i % gridSize;
      const oldY = Math.floor(i / gridSize);
      const newX = oldX + deltaX;
      const newY = oldY + deltaY;
      
      // Check bounds
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        const newIndex = newY * gridSize + newX;
        newData[newIndex] = moveOriginalData[i];
      }
    }
  }
  
  // Update layer with moved data
  layer.data = newData;
  
  // Reset move state
  isMoving = false;
  moveStartPixel = null;
  moveOriginalData = null;
  movePreviewData = null;
  
  renderGrid();
}

function cancelMove() {
  if (!isMoving) return;
  
  console.log('Move cancelled');
  
  // Reset move state
  isMoving = false;
  moveStartPixel = null;
  moveOriginalData = null;
  movePreviewData = null;
  
  renderGrid();
}

// ===== TEXT TOOL FUNCTIONS =====

// Small 3x5 bitmap font for tiny text
const smallFont = {
  'A': ['111', '101', '111', '101', '101'],
  'B': ['111', '101', '110', '101', '111'],
  'C': ['111', '100', '100', '100', '111'],
  'D': ['110', '101', '101', '101', '110'],
  'E': ['111', '100', '111', '100', '111'],
  'F': ['111', '100', '111', '100', '100'],
  'G': ['111', '100', '101', '101', '111'],
  'H': ['101', '101', '111', '101', '101'],
  'I': ['111', '010', '010', '010', '111'],
  'J': ['111', '001', '001', '101', '111'],
  'K': ['101', '110', '100', '110', '101'],
  'L': ['100', '100', '100', '100', '111'],
  'M': ['101', '111', '111', '101', '101'],
  'N': ['101', '111', '111', '111', '101'],
  'O': ['111', '101', '101', '101', '111'],
  'P': ['111', '101', '111', '100', '100'],
  'Q': ['111', '101', '101', '111', '001'],
  'R': ['111', '101', '111', '110', '101'],
  'S': ['111', '100', '111', '001', '111'],
  'T': ['111', '010', '010', '010', '010'],
  'U': ['101', '101', '101', '101', '111'],
  'V': ['101', '101', '101', '111', '010'],
  'W': ['101', '101', '111', '111', '101'],
  'X': ['101', '111', '010', '111', '101'],
  'Y': ['101', '101', '111', '010', '010'],
  'Z': ['111', '001', '010', '100', '111'],
  '0': ['111', '101', '101', '101', '111'],
  '1': ['010', '110', '010', '010', '111'],
  '2': ['111', '001', '111', '100', '111'],
  '3': ['111', '001', '111', '001', '111'],
  '4': ['101', '101', '111', '001', '001'],
  '5': ['111', '100', '111', '001', '111'],
  '6': ['111', '100', '111', '101', '111'],
  '7': ['111', '001', '010', '100', '100'],
  '8': ['111', '101', '111', '101', '111'],
  '9': ['111', '101', '111', '001', '111'],
  ' ': ['000', '000', '000', '000', '000'],
  '.': ['000', '000', '000', '000', '010'],
  '!': ['010', '010', '010', '000', '010'],
  '?': ['111', '001', '010', '000', '010'],
  '-': ['000', '000', '111', '000', '000'],
  '+': ['000', '010', '111', '010', '000'],
};

// Standard 5x7 bitmap font for pixel art
const pixelFont = {
  'A': [
    '01110',
    '10001',
    '10001',
    '11111',
    '10001',
    '10001',
    '00000'
  ],
  'B': [
    '11110',
    '10001',
    '11110',
    '11110',
    '10001',
    '11110',
    '00000'
  ],
  'C': [
    '01111',
    '10000',
    '10000',
    '10000',
    '10000',
    '01111',
    '00000'
  ],
  'D': [
    '11110',
    '10001',
    '10001',
    '10001',
    '10001',
    '11110',
    '00000'
  ],
  'E': [
    '11111',
    '10000',
    '11110',
    '11110',
    '10000',
    '11111',
    '00000'
  ],
  'F': [
    '11111',
    '10000',
    '11110',
    '11110',
    '10000',
    '10000',
    '00000'
  ],
  'G': [
    '01111',
    '10000',
    '10011',
    '10001',
    '10001',
    '01111',
    '00000'
  ],
  'H': [
    '10001',
    '10001',
    '11111',
    '11111',
    '10001',
    '10001',
    '00000'
  ],
  'I': [
    '01110',
    '00100',
    '00100',
    '00100',
    '00100',
    '01110',
    '00000'
  ],
  'J': [
    '00111',
    '00001',
    '00001',
    '00001',
    '10001',
    '01110',
    '00000'
  ],
  'K': [
    '10001',
    '10010',
    '11100',
    '11100',
    '10010',
    '10001',
    '00000'
  ],
  'L': [
    '10000',
    '10000',
    '10000',
    '10000',
    '10000',
    '11111',
    '00000'
  ],
  'M': [
    '10001',
    '11011',
    '10101',
    '10001',
    '10001',
    '10001',
    '00000'
  ],
  'N': [
    '10001',
    '11001',
    '10101',
    '10011',
    '10001',
    '10001',
    '00000'
  ],
  'O': [
    '01110',
    '10001',
    '10001',
    '10001',
    '10001',
    '01110',
    '00000'
  ],
  'P': [
    '11110',
    '10001',
    '11110',
    '10000',
    '10000',
    '10000',
    '00000'
  ],
  'Q': [
    '01110',
    '10001',
    '10001',
    '10101',
    '10010',
    '01101',
    '00000'
  ],
  'R': [
    '11110',
    '10001',
    '11110',
    '10100',
    '10010',
    '10001',
    '00000'
  ],
  'S': [
    '01111',
    '10000',
    '01110',
    '00001',
    '00001',
    '11110',
    '00000'
  ],
  'T': [
    '11111',
    '00100',
    '00100',
    '00100',
    '00100',
    '00100',
    '00000'
  ],
  'U': [
    '10001',
    '10001',
    '10001',
    '10001',
    '10001',
    '01110',
    '00000'
  ],
  'V': [
    '10001',
    '10001',
    '10001',
    '01010',
    '01010',
    '00100',
    '00000'
  ],
  'W': [
    '10001',
    '10001',
    '10001',
    '10101',
    '11011',
    '10001',
    '00000'
  ],
  'X': [
    '10001',
    '01010',
    '00100',
    '00100',
    '01010',
    '10001',
    '00000'
  ],
  'Y': [
    '10001',
    '01010',
    '00100',
    '00100',
    '00100',
    '00100',
    '00000'
  ],
  'Z': [
    '11111',
    '00010',
    '00100',
    '01000',
    '10000',
    '11111',
    '00000'
  ],
  '0': [
    '01110',
    '10011',
    '10101',
    '11001',
    '10001',
    '01110',
    '00000'
  ],
  '1': [
    '00100',
    '01100',
    '00100',
    '00100',
    '00100',
    '01110',
    '00000'
  ],
  '2': [
    '01110',
    '10001',
    '00010',
    '00100',
    '01000',
    '11111',
    '00000'
  ],
  '3': [
    '01110',
    '10001',
    '00110',
    '00001',
    '10001',
    '01110',
    '00000'
  ],
  '4': [
    '00010',
    '00110',
    '01010',
    '10010',
    '11111',
    '00010',
    '00000'
  ],
  '5': [
    '11111',
    '10000',
    '11110',
    '00001',
    '10001',
    '01110',
    '00000'
  ],
  '6': [
    '00110',
    '01000',
    '11110',
    '10001',
    '10001',
    '01110',
    '00000'
  ],
  '7': [
    '11111',
    '00001',
    '00010',
    '00100',
    '01000',
    '10000',
    '00000'
  ],
  '8': [
    '01110',
    '10001',
    '01110',
    '01110',
    '10001',
    '01110',
    '00000'
  ],
  '9': [
    '01110',
    '10001',
    '10001',
    '01111',
    '00010',
    '01100',
    '00000'
  ],
  ' ': [
    '00000',
    '00000',
    '00000',
    '00000',
    '00000',
    '00000',
    '00000'
  ],
  '.': [
    '00000',
    '00000',
    '00000',
    '00000',
    '00000',
    '01100',
    '00000'
  ],
  ',': [
    '00000',
    '00000',
    '00000',
    '00000',
    '01100',
    '01000',
    '00000'
  ],
  '!': [
    '00100',
    '00100',
    '00100',
    '00100',
    '00000',
    '00100',
    '00000'
  ],
  '?': [
    '01110',
    '10001',
    '00010',
    '00100',
    '00000',
    '00100',
    '00000'
  ],
  ':': [
    '00000',
    '01100',
    '00000',
    '00000',
    '01100',
    '00000',
    '00000'
  ],
  ';': [
    '00000',
    '01100',
    '00000',
    '00000',
    '01100',
    '01000',
    '00000'
  ],
  '-': [
    '00000',
    '00000',
    '11111',
    '00000',
    '00000',
    '00000',
    '00000'
  ],
  '+': [
    '00000',
    '00100',
    '11111',
    '00100',
    '00000',
    '00000',
    '00000'
  ],
  '=': [
    '00000',
    '11111',
    '00000',
    '11111',
    '00000',
    '00000',
    '00000'
  ],
  '(': [
    '00010',
    '00100',
    '01000',
    '01000',
    '00100',
    '00010',
    '00000'
  ],
  ')': [
    '01000',
    '00100',
    '00010',
    '00010',
    '00100',
    '01000',
    '00000'
  ],
  '/': [
    '00001',
    '00010',
    '00100',
    '01000',
    '10000',
    '00000',
    '00000'
  ],
  '\\': [
    '10000',
    '01000',
    '00100',
    '00010',
    '00001',
    '00000',
    '00000'
  ]
};

// Large 7x9 bitmap font for big text
const largeFont = {
  'A': [
    '0111110',
    '1100011',
    '1100011',
    '1100011',
    '1111111',
    '1100011',
    '1100011',
    '1100011',
    '0000000'
  ],
  'B': [
    '1111110',
    '1100011',
    '1100011',
    '1111110',
    '1111110',
    '1100011',
    '1100011',
    '1111110',
    '0000000'
  ],
  'C': [
    '0111111',
    '1100000',
    '1100000',
    '1100000',
    '1100000',
    '1100000',
    '1100000',
    '0111111',
    '0000000'
  ],
  'D': [
    '1111110',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1111110',
    '0000000'
  ],
  'E': [
    '1111111',
    '1100000',
    '1100000',
    '1111110',
    '1111110',
    '1100000',
    '1100000',
    '1111111',
    '0000000'
  ],
  'F': [
    '1111111',
    '1100000',
    '1100000',
    '1111110',
    '1111110',
    '1100000',
    '1100000',
    '1100000',
    '0000000'
  ],
  'G': [
    '0111111',
    '1100000',
    '1100000',
    '1100111',
    '1100011',
    '1100011',
    '1100011',
    '0111111',
    '0000000'
  ],
  'H': [
    '1100011',
    '1100011',
    '1100011',
    '1111111',
    '1111111',
    '1100011',
    '1100011',
    '1100011',
    '0000000'
  ],
  'I': [
    '0111110',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0111110',
    '0000000'
  ],
  'J': [
    '0001111',
    '0000110',
    '0000110',
    '0000110',
    '0000110',
    '1100110',
    '1100110',
    '0111100',
    '0000000'
  ],
  'K': [
    '1100011',
    '1100110',
    '1101100',
    '1111000',
    '1111000',
    '1101100',
    '1100110',
    '1100011',
    '0000000'
  ],
  'L': [
    '1100000',
    '1100000',
    '1100000',
    '1100000',
    '1100000',
    '1100000',
    '1100000',
    '1111111',
    '0000000'
  ],
  'M': [
    '1100011',
    '1110111',
    '1111111',
    '1101011',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '0000000'
  ],
  'N': [
    '1100011',
    '1110011',
    '1111011',
    '1101111',
    '1100111',
    '1100011',
    '1100011',
    '1100011',
    '0000000'
  ],
  'O': [
    '0111110',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '0111110',
    '0000000'
  ],
  'P': [
    '1111110',
    '1100011',
    '1100011',
    '1111110',
    '1100000',
    '1100000',
    '1100000',
    '1100000',
    '0000000'
  ],
  'Q': [
    '0111110',
    '1100011',
    '1100011',
    '1100011',
    '1101011',
    '1100110',
    '0111110',
    '0000011',
    '0000000'
  ],
  'R': [
    '1111110',
    '1100011',
    '1100011',
    '1111110',
    '1101100',
    '1100110',
    '1100011',
    '1100011',
    '0000000'
  ],
  'S': [
    '0111111',
    '1100000',
    '1100000',
    '0111110',
    '0000011',
    '0000011',
    '0000011',
    '1111110',
    '0000000'
  ],
  'T': [
    '1111111',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0000000'
  ],
  'U': [
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '0111110',
    '0000000'
  ],
  'V': [
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '0110110',
    '0110110',
    '0111100',
    '0011000',
    '0000000'
  ],
  'W': [
    '1100011',
    '1100011',
    '1100011',
    '1100011',
    '1101011',
    '1111111',
    '1110111',
    '1100011',
    '0000000'
  ],
  'X': [
    '1100011',
    '0110110',
    '0111100',
    '0011000',
    '0011000',
    '0111100',
    '0110110',
    '1100011',
    '0000000'
  ],
  'Y': [
    '1100011',
    '1100011',
    '0110110',
    '0111100',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0000000'
  ],
  'Z': [
    '1111111',
    '0000110',
    '0001100',
    '0011000',
    '0110000',
    '1100000',
    '1100000',
    '1111111',
    '0000000'
  ],
  '0': [
    '0111110',
    '1100111',
    '1101011',
    '1101011',
    '1101011',
    '1110011',
    '1100011',
    '0111110',
    '0000000'
  ],
  '1': [
    '0011000',
    '0111000',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0111110',
    '0000000'
  ],
  '2': [
    '0111110',
    '1100011',
    '0000011',
    '0000110',
    '0001100',
    '0011000',
    '0110000',
    '1111111',
    '0000000'
  ],
  '3': [
    '0111110',
    '1100011',
    '0000011',
    '0001110',
    '0000011',
    '0000011',
    '1100011',
    '0111110',
    '0000000'
  ],
  '4': [
    '0000110',
    '0001110',
    '0011110',
    '0110110',
    '1100110',
    '1111111',
    '0000110',
    '0000110',
    '0000000'
  ],
  '5': [
    '1111111',
    '1100000',
    '1100000',
    '1111110',
    '0000011',
    '0000011',
    '1100011',
    '0111110',
    '0000000'
  ],
  '6': [
    '0001110',
    '0011000',
    '0110000',
    '1111110',
    '1100011',
    '1100011',
    '1100011',
    '0111110',
    '0000000'
  ],
  '7': [
    '1111111',
    '0000011',
    '0000110',
    '0001100',
    '0011000',
    '0110000',
    '1100000',
    '1100000',
    '0000000'
  ],
  '8': [
    '0111110',
    '1100011',
    '1100011',
    '0111110',
    '0111110',
    '1100011',
    '1100011',
    '0111110',
    '0000000'
  ],
  '9': [
    '0111110',
    '1100011',
    '1100011',
    '1100011',
    '0111111',
    '0000011',
    '0000110',
    '0111100',
    '0000000'
  ],
  ' ': [
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0000000'
  ],
  '.': [
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0011000',
    '0011000',
    '0000000'
  ],
  '!': [
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0011000',
    '0000000',
    '0011000',
    '0011000',
    '0000000'
  ],
  '?': [
    '0111110',
    '1100011',
    '0000011',
    '0000110',
    '0001100',
    '0000000',
    '0001100',
    '0001100',
    '0000000'
  ],
  '-': [
    '0000000',
    '0000000',
    '0000000',
    '1111111',
    '0000000',
    '0000000',
    '0000000',
    '0000000',
    '0000000'
  ],
  '+': [
    '0000000',
    '0011000',
    '0011000',
    '1111111',
    '0011000',
    '0011000',
    '0000000',
    '0000000',
    '0000000'
  ]
};

function getFontData(family) {
  switch (family) {
    case 'small': return smallFont;
    case 'large': return largeFont;
    case 'pixel':
    default: return pixelFont;
  }
}

function getFontDimensions(family) {
  switch (family) {
    case 'small': return { width: 3, height: 5, spacing: 1, lineHeight: 6 };
    case 'large': return { width: 7, height: 9, spacing: 1, lineHeight: 10 };
    case 'pixel':
    default: return { width: 5, height: 7, spacing: 1, lineHeight: 8 };
  }
}

function openTextModal(pixelIndex) {
  textClickPosition = pixelIndex;
  textModal.classList.remove('hidden');
  textInput.value = '';
  textInput.focus();
  console.log(`Text tool clicked at pixel ${pixelIndex}`);
}

function closeTextModal() {
  textModal.classList.add('hidden');
  textClickPosition = null;
}

function renderTextAt(text, startX, startY) {
  if (!text || textClickPosition === null) return;
  
  pushUndo();
  const layer = getCurrentLayer();
  const fontData = getFontData(currentFontFamily);
  const fontDims = getFontDimensions(currentFontFamily);
  const scale = currentFontSize;
  
  let currentX = startX;
  let currentY = startY;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    
    if (char === '\n') {
      currentX = startX;
      currentY += fontDims.lineHeight * scale; // Move to next line
      continue;
    }
    
    const charData = fontData[char];
    if (!charData) {
      // Unknown character, skip
      currentX += (fontDims.width + fontDims.spacing) * scale;
      continue;
    }
    
    // Render character with scaling
    for (let row = 0; row < charData.length; row++) {
      const rowData = charData[row];
      for (let col = 0; col < rowData.length; col++) {
        if (rowData[col] === '1') {
          // Render scaled pixel block
          for (let sy = 0; sy < scale; sy++) {
            for (let sx = 0; sx < scale; sx++) {
              const pixelX = currentX + (col * scale) + sx;
              const pixelY = currentY + (row * scale) + sy;
              
              // Check bounds
              if (pixelX >= 0 && pixelX < gridSize && pixelY >= 0 && pixelY < gridSize) {
                const pixelIndex = pixelY * gridSize + pixelX;
                layer.data[pixelIndex] = currentColor;
              }
            }
          }
        }
      }
    }
    
    currentX += (fontDims.width + fontDims.spacing) * scale; // Move to next character position
    
    // Wrap to next line if we exceed canvas width
    if (currentX >= gridSize - (fontDims.width * scale)) {
      currentX = startX;
      currentY += fontDims.lineHeight * scale;
    }
  }
  
  renderGrid();
  console.log(`Rendered text: "${text}" at position (${startX}, ${startY}) using ${currentFontFamily} font at ${scale}x scale`);
}

// ===== TRANSFORM TOOL FUNCTIONS =====

function startTransform() {
  if (isTransforming) return;
  
  const layer = getCurrentLayer();
  console.log('Transform tool: Current layer:', layer);
  if (!layer || !layer.data) {
    console.log('Transform tool: No layer or layer data found');
    return;
  }
  
  // Find the bounds of non-transparent pixels  
  console.log('Transform tool: Checking layer data for content...');
  console.log('Transform tool: Layer data sample:', layer.data.slice(0, 10));
  console.log('Transform tool: TRANSPARENT constant:', TRANSPARENT);
  
  transformBounds = getContentBounds(layer.data);
  console.log('Transform tool: Content bounds:', transformBounds);
  
  if (!transformBounds) {
    console.log('Transform tool: No content to transform - layer appears empty');
    return;
  }
  
  isTransforming = true;
  transformOriginalData = [...layer.data];
  transformPreviewData = [...layer.data];
  
  // Calculate center point
  transformCenter = {
    x: (transformBounds.left + transformBounds.right) / 2,
    y: (transformBounds.top + transformBounds.bottom) / 2
  };
  
  // Reset transform values
  transformCurrentAngle = 0;
  transformScale = 1.0;
  
  // Show transform overlay
  showTransformOverlay();
  
  console.log('Transform started', transformBounds, transformCenter);
}

function getContentBounds(data) {
  let minX = gridSize, maxX = -1, minY = gridSize, maxY = -1;
  let hasContent = false;
  let nonTransparentCount = 0;
  
  for (let y = 0; y < gridSize; y++) {
    for (let x = 0; x < gridSize; x++) {
      const index = y * gridSize + x;
      if (data[index] !== TRANSPARENT) {
        hasContent = true;
        nonTransparentCount++;
        minX = Math.min(minX, x);
        maxX = Math.max(maxX, x);
        minY = Math.min(minY, y);  
        maxY = Math.max(maxY, y);
      }
    }
  }
  
  console.log(`Transform tool: Found ${nonTransparentCount} non-transparent pixels out of ${data.length}`);
  console.log(`Transform tool: Has content: ${hasContent}`);
  
  return hasContent ? { left: minX, right: maxX, top: minY, bottom: maxY } : null;
}

function showTransformOverlay() {
  if (!transformBounds) return;
  
  transformOverlay.classList.remove('hidden');
  
  // Position the transform box based on content bounds
  const pixelSize = gridElem.clientWidth / gridSize;
  const left = transformBounds.left * pixelSize;
  const top = transformBounds.top * pixelSize;
  const width = (transformBounds.right - transformBounds.left + 1) * pixelSize;
  const height = (transformBounds.bottom - transformBounds.top + 1) * pixelSize;
  
  transformBox.style.left = left + 'px';
  transformBox.style.top = top + 'px';
  transformBox.style.width = width + 'px';
  transformBox.style.height = height + 'px';
}

function hideTransformOverlay() {
  transformOverlay.classList.add('hidden');
}

function rotatePoint(x, y, centerX, centerY, angle) {
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const dx = x - centerX;
  const dy = y - centerY;
  
  return {
    x: centerX + dx * cos - dy * sin,
    y: centerY + dx * sin + dy * cos
  };
}

function applyRotation(angle) {
  if (!transformOriginalData || !transformBounds) return;
  
  const layer = getCurrentLayer();
  const newData = new Array(gridSize * gridSize).fill(TRANSPARENT);
  
  // Apply rotation to each pixel
  for (let y = transformBounds.top; y <= transformBounds.bottom; y++) {
    for (let x = transformBounds.left; x <= transformBounds.right; x++) {
      const originalIndex = y * gridSize + x;
      const originalColor = transformOriginalData[originalIndex];
      
      if (originalColor === TRANSPARENT) continue;
      
      // Rotate pixel position around center
      const rotated = rotatePoint(x, y, transformCenter.x, transformCenter.y, angle);
      const newX = Math.round(rotated.x);
      const newY = Math.round(rotated.y);
      
      // Check bounds and set pixel
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        const newIndex = newY * gridSize + newX;
        newData[newIndex] = originalColor;
      }
    }
  }
  
  layer.data = newData;
  transformPreviewData = [...newData];
  renderGrid();
}

function applyScale(scale) {
  if (!transformOriginalData || !transformBounds) return;
  
  const layer = getCurrentLayer();
  const newData = new Array(gridSize * gridSize).fill(TRANSPARENT);
  
  const centerX = transformCenter.x;
  const centerY = transformCenter.y;
  
  // Apply scaling to each pixel
  for (let y = transformBounds.top; y <= transformBounds.bottom; y++) {
    for (let x = transformBounds.left; x <= transformBounds.right; x++) {
      const originalIndex = y * gridSize + x;
      const originalColor = transformOriginalData[originalIndex];
      
      if (originalColor === TRANSPARENT) continue;
      
      // Scale pixel position from center
      const dx = (x - centerX) * scale;
      const dy = (y - centerY) * scale;
      const newX = Math.round(centerX + dx);
      const newY = Math.round(centerY + dy);
      
      // Check bounds and set pixel
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        const newIndex = newY * gridSize + newX;
        newData[newIndex] = originalColor;
      }
    }
  }
  
  layer.data = newData;
  transformPreviewData = [...newData];
  renderGrid();
}

function finishTransform() {
  if (!isTransforming) return;
  
  pushUndo();
  isTransforming = false;
  transformOriginalData = null;
  transformPreviewData = null;
  transformBounds = null;
  hideTransformOverlay();
  
  console.log('Transform applied');
}

function cancelTransform() {
  if (!isTransforming) return;
  
  // Restore original data
  const layer = getCurrentLayer();
  if (transformOriginalData) {
    layer.data = [...transformOriginalData];
  }
  
  isTransforming = false;
  transformOriginalData = null;
  transformPreviewData = null;
  transformBounds = null;
  hideTransformOverlay();
  renderGrid();
  
  console.log('Transform cancelled');
}

// ===== START SCREEN & RECENT FILES FUNCTIONS =====

function getRecentFiles() {
  try {
    const recent = localStorage.getItem('pixelpro_recent_files');
    return recent ? JSON.parse(recent) : [];
  } catch (e) {
    console.error('Error loading recent files:', e);
    return [];
  }
}

function saveRecentFile(filename, projectData) {
  try {
    const recentFiles = getRecentFiles();
    const now = new Date().toISOString();
    
    // Remove existing entry if it exists
    const filtered = recentFiles.filter(file => file.name !== filename);
    
    // Add new entry at the beginning
    filtered.unshift({
      name: filename,
      data: projectData,
      timestamp: now,
      gridSize: projectData.gridSize || 16,
      frameCount: projectData.frames ? projectData.frames.length : 1,
      layerCount: projectData.layers ? projectData.layers[0]?.length || 1 : 1
    });
    
    // Keep only the last 10 files
    const limited = filtered.slice(0, 10);
    
    localStorage.setItem('pixelpro_recent_files', JSON.stringify(limited));
    renderRecentFiles();
  } catch (e) {
    console.error('Error saving recent file:', e);
  }
}

function removeRecentFile(filename) {
  try {
    const recentFiles = getRecentFiles();
    const filtered = recentFiles.filter(file => file.name !== filename);
    localStorage.setItem('pixelpro_recent_files', JSON.stringify(filtered));
    renderRecentFiles();
  } catch (e) {
    console.error('Error removing recent file:', e);
  }
}

function clearRecentFiles() {
  try {
    localStorage.removeItem('pixelpro_recent_files');
    renderRecentFiles();
  } catch (e) {
    console.error('Error clearing recent files:', e);
  }
}

function formatFileDate(timestamp) {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now - date;
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  } catch (e) {
    return 'Recently';
  }
}

function renderRecentFiles() {
  const recentFiles = getRecentFiles();
  
  if (recentFiles.length === 0) {
    recentFilesList.innerHTML = '';
    noRecentFiles.style.display = 'block';
    return;
  }
  
  noRecentFiles.style.display = 'none';
  
  recentFilesList.innerHTML = recentFiles.map(file => `
    <div class="recent-file-item" data-filename="${file.name}">
      <div class="recent-file-info">
        <div class="recent-file-name">${file.name}</div>
        <div class="recent-file-details">
          <span>${formatFileDate(file.timestamp)}</span>
          <span>•</span>
          <span>${file.gridSize}x${file.gridSize}</span>
          <span>•</span>
          <span>${file.frameCount} frame${file.frameCount !== 1 ? 's' : ''}</span>
          <span>•</span>
          <span>${file.layerCount} layer${file.layerCount !== 1 ? 's' : ''}</span>
        </div>
      </div>
      <div class="recent-file-preview">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" stroke-width="2" viewBox="0 0 24 24">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <path d="M9 9h6v6H9z"/>
        </svg>
      </div>
      <div class="recent-file-actions">
        <button class="recent-file-action delete" title="Remove from recent">×</button>
      </div>
    </div>
  `).join('');
  
  // Add event listeners to recent file items
  recentFilesList.querySelectorAll('.recent-file-item').forEach(item => {
    const filename = item.dataset.filename;
    
    // Click to open
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('recent-file-action')) return;
      loadRecentFile(filename);
    });
    
    // Delete button
    const deleteBtn = item.querySelector('.recent-file-action.delete');
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      removeRecentFile(filename);
    });
  });
}

function loadRecentFile(filename) {
  const recentFiles = getRecentFiles();
  const file = recentFiles.find(f => f.name === filename);
  
  if (!file) {
    showModal("<div class='text-red-700 font-semibold text-lg'>File Not Found</div><div class='text-sm mt-2'>This recent file is no longer available.</div>");
    removeRecentFile(filename);
    return;
  }
  
  try {
    // Load the project data
    const data = file.data;
    
    gridSize = data.gridSize || DEFAULT_GRID_SIZE;
    palette = data.palette || ['#22223b', '#f72585', '#b5179e', '#3a86ff', '#ffbe0b', '#fb5607', '#fff'];
    frames = data.frames || [createBlankFrame(gridSize)];
    
    if (data.layers) {
      layers = data.layers;
      layerIdCounter = data.layerIdCounter || 1;
    } else {
      layers = frames.map(frame => [createLayer("Background", gridSize)]);
      layers.forEach((frameLayers, frameIndex) => {
        frameLayers[0].data = [...frames[frameIndex]];
      });
    }
    
    currentFrame = data.currentFrame || 0;
    currentLayer = data.currentLayer || 0;
    currentColor = data.currentColor || palette[0] || "#000";
    tool = data.tool || "draw";
    brushSize = data.brushSize || 3;
    brushShape = data.brushShape || "square";
    shapeMode = data.shapeMode || "outline";
    currentFontFamily = data.currentFontFamily || "pixel";
    currentFontSize = data.currentFontSize || 1;
    
    hideStartScreen();
    init();
    
    showModal(`<div class='text-green-700 font-semibold text-lg'>Loaded!</div><div class='text-sm mt-2'>Opened "${filename}" from recent files.</div>`);
  } catch (e) {
    console.error('Error loading recent file:', e);
    showModal("<div class='text-red-700 font-semibold text-lg'>Load Error</div><div class='text-sm mt-2'>Failed to load this recent file.</div>");
    removeRecentFile(filename);
  }
}

function showStartScreen() {
  console.log('showStartScreen called');
  console.log('startScreen:', startScreen);
  
  if (startScreen) {
    startScreen.classList.remove('hidden');
    hideCanvasSettings(); // Hide canvas settings modal if open
    renderRecentFiles();
  } else {
    console.error('startScreen element not found');
  }
}

function hideStartScreen() {
  console.log('hideStartScreen called');
  console.log('startScreen:', startScreen);
  
  if (startScreen) {
    startScreen.classList.add('hidden');
  } else {
    console.error('startScreen element not found');
  }
}

function createNewProject() {
  console.log('createNewProject called');
  // Use default settings for quick start
  createNewProjectWithSettings(DEFAULT_GRID_SIZE, DEFAULT_GRID_SIZE, true, "default");
}

function startDemo() {
  // Create a demo project with some content
  createNewProjectWithSettings(16, 16, true, "default");
  
  // Add some demo content after a brief delay to ensure init is complete
  setTimeout(() => {
    const layer = layers[0][0];
    // Draw a simple smiley face
    const smileyPositions = [
      {x: 5, y: 4}, {x: 10, y: 4}, // eyes
      {x: 4, y: 9}, {x: 5, y: 10}, {x: 6, y: 10}, {x: 7, y: 10}, 
      {x: 8, y: 10}, {x: 9, y: 10}, {x: 10, y: 10}, {x: 11, y: 9} // smile
    ];
    
    smileyPositions.forEach(pos => {
      if (pos.x < gridSize && pos.y < gridSize) {
        layer.data[pos.y * gridSize + pos.x] = '#f72585';
      }
    });
    
    renderGrid();
    showModal(`<div class='text-blue-700 font-semibold text-lg'>Demo Loaded!</div><div class='text-sm mt-2'>Try editing this sample project to learn PixelPro!</div>`);
  }, 100);
}

function startTutorial() {
  createNewProjectWithSettings(16, 16, true, "default");
  
  // Show tutorial modal
  showModal(`
    <div class='text-xl font-semibold mb-4'>PixelPro Tutorial</div>
    <div class='text-sm space-y-3 text-left'>
      <p><strong>1. Tools:</strong> Select tools from the left sidebar (B=Brush, E=Eraser, etc.)</p>
      <p><strong>2. Colors:</strong> Pick colors from the palette below the canvas</p>
      <p><strong>3. Drawing:</strong> Click on the grid to place pixels</p>
      <p><strong>4. Layers:</strong> Use the layers panel to organize your artwork</p>
      <p><strong>5. Animation:</strong> Create frames using the top application bar</p>
      <p><strong>6. Text:</strong> Use the Text tool (T) with font options in the app bar</p>
      <p><strong>7. Save:</strong> Use File → Save to keep your work</p>
    </div>
  `);
}

// ===== CANVAS SETTINGS FUNCTIONS =====

function showCanvasSettings() {
  console.log('showCanvasSettings called');
  console.log('canvasSettingsModal:', canvasSettingsModal);
  
  if (canvasSettingsModal) {
    canvasSettingsModal.classList.remove('hidden');
    
    // Initialize canvas background input state
    const transparentRadio = document.querySelector('input[name="bgType"][value="transparent"]');
    const colorRadio = document.querySelector('input[name="bgType"][value="color"]');
    if (transparentRadio && transparentRadio.checked) {
      if (canvasBackground) {
        canvasBackground.disabled = true;
        canvasBackground.style.opacity = '0.5';
      }
    }
    
    updateCanvasPreview();
  } else {
    console.error('canvasSettingsModal not found');
  }
}

function hideCanvasSettings() {
  canvasSettingsModal.classList.add('hidden');
}

function updateCanvasPreview() {
  const width = parseInt(canvasWidth.value) || 16;
  const height = parseInt(canvasHeight.value) || 16;
  const totalPixels = width * height;
  
  canvasPreview.textContent = `${width}×${height} pixels (${totalPixels.toLocaleString()} total)`;
}

function selectCanvasPreset(size) {
  selectedCanvasPreset = size;
  canvasWidth.value = size;
  canvasHeight.value = size;
  
  // Update active state
  document.querySelectorAll('.canvas-preset-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-size="${size}"]`).classList.add('active');
  
  updateCanvasPreview();
}

function selectPalettePreset(presetName) {
  selectedPalettePreset = presetName;
  
  // Update active state
  document.querySelectorAll('.palette-preset-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  document.querySelector(`[data-palette="${presetName}"]`).classList.add('active');
}

function getBackgroundColor() {
  const bgType = document.querySelector('input[name="bgType"]:checked').value;
  if (bgType === 'transparent') {
    return TRANSPARENT;
  } else {
    return canvasBackground.value;
  }
}

function createNewProjectWithSettings(width, height, isTransparent, palettePreset) {
  console.log(`Creating new project: ${width}×${height}, transparent: ${isTransparent}, palette: ${palettePreset}`);
  
  // Reset everything to defaults
  // For now, PixelPro supports square canvases only, so use the larger dimension
  gridSize = Math.max(8, Math.min(256, Math.max(width, height)));
  currentColor = DEFAULT_COLOR;
  frames = [];
  layers = [];
  currentFrame = 0;
  currentLayer = 0;
  layerIdCounter = 1;
  currentFontFamily = "pixel";
  currentFontSize = 1;
  
  // Set the selected palette
  palette = [...palettePresets[palettePreset]];
  
  // Create initial frame and layer
  const backgroundColor = isTransparent ? TRANSPARENT : getBackgroundColor();
  console.log(`Background color: ${backgroundColor}, gridSize: ${gridSize}`);
  
  frames = [createBlankFrame(gridSize, backgroundColor)];
  layers = [createFrameWithLayers(gridSize, backgroundColor)];
  
  console.log(`Created frames: ${frames.length}, layers: ${layers.length}, frame data length: ${frames[0].length}`);
  
  // Reset undo/redo stacks
  undoStack = [];
  redoStack = [];
  
  hideStartScreen();
  hideCanvasSettings();
  init();
  
  console.log(`Project creation complete: ${gridSize}×${gridSize}, bg: ${backgroundColor}`);
}



function renderPalette() {
  paletteElem.innerHTML = '';
  palette.forEach((color, i) => {
    const cBtn = document.createElement('div');
    cBtn.className = 'palette-color' + (color === currentColor && (tool === "draw" || tool === "brush") ? ' selected' : '');
    cBtn.style.background = color;
    cBtn.title = color;
    cBtn.addEventListener('click', () => {
      currentColor = color; colorPicker.value = color;
      if (tool !== "draw" && tool !== "brush") setTool("draw");
      renderPalette();
    });
    paletteElem.appendChild(cBtn);
    if (i >= 7 && color !== '#fff') {
      const x = document.createElement('span');
      x.textContent = '×';
      x.style = 'position:relative;left:14px;top:-18px;font-size:14px;color:#888;cursor:pointer;';
      x.addEventListener('click', (e) => {
        e.stopPropagation();
        palette.splice(i, 1);
        renderPalette();
      });
      cBtn.appendChild(x);
    }
  });
}
paletteAddBtn.addEventListener('click', () => {
  if (palette.length >= 20) return alert("Palette is full!");
  if (!palette.includes(currentColor)) { palette.push(currentColor); renderPalette(); }
});

// ===== LAYER MANAGEMENT FUNCTIONS =====

function renderLayersList() {
  if (!layers[currentFrame]) {
    layers[currentFrame] = createFrameWithLayers(gridSize);
  }
  
  layersList.innerHTML = '';
  const frameLayers = layers[currentFrame];
  
  // Render layers in reverse order (top layer first in UI)
  for (let i = frameLayers.length - 1; i >= 0; i--) {
    const layer = frameLayers[i];
    
    // Add drop indicator
    const dropIndicator = document.createElement('div');
    dropIndicator.className = 'layer-drop-indicator';
    dropIndicator.dataset.dropIndex = i + 1;
    layersList.appendChild(dropIndicator);
    
    const layerItem = document.createElement('div');
    layerItem.className = `layer-item ${i === currentLayer ? 'active' : ''}`;
    layerItem.dataset.layerIndex = i;
    layerItem.draggable = true;
    
    layerItem.innerHTML = `
      <div class="flex items-center gap-2">
        <canvas class="layer-thumbnail" width="32" height="32"></canvas>
        <div class="flex-1">
          <div class="layer-name" contenteditable="true" spellcheck="false" title="Double-click to rename (tool shortcuts disabled while editing)">${layer.name}</div>
          <div class="layer-controls">
            <div class="layer-visibility ${layer.visible ? 'visible' : ''}" title="Toggle Visibility">
              ${layer.visible ? '👁' : ''}
            </div>
            <input type="range" class="layer-opacity" min="0" max="100" value="${layer.opacity}" title="Opacity: ${layer.opacity}%">
          </div>
        </div>
      </div>
    `;
    
    // Render layer thumbnail
    const canvas = layerItem.querySelector('.layer-thumbnail');
    const ctx = canvas.getContext('2d');
    const scale = 32 / gridSize;
    
    for (let j = 0; j < layer.data.length; j++) {
      const x = (j % gridSize) * scale;
      const y = Math.floor(j / gridSize) * scale;
      ctx.fillStyle = layer.data[j];
      ctx.fillRect(x, y, scale, scale);
    }
    
    // Click event listeners
    layerItem.addEventListener('click', (e) => {
      // Only activate layer if not editing name or clicking on controls
      if (!e.target.classList.contains('layer-name') && 
          !e.target.classList.contains('layer-opacity') && 
          !e.target.classList.contains('layer-visibility')) {
        setActiveLayer(i);
      }
    });
    
    const visibilityBtn = layerItem.querySelector('.layer-visibility');
    visibilityBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      toggleLayerVisibility(i);
    });
    
    const opacitySlider = layerItem.querySelector('.layer-opacity');
    opacitySlider.addEventListener('input', (e) => {
      e.stopPropagation();
      setLayerOpacity(i, parseInt(e.target.value));
    });
    
    // Enhanced layer name editing
    const nameDiv = layerItem.querySelector('.layer-name');
    let isLocalEditing = false;
    
    // Double-click to start editing
    nameDiv.addEventListener('dblclick', (e) => {
      e.stopPropagation();
      startEditingLayerName(nameDiv, i);
    });
    
    // Single click behavior
    nameDiv.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!isLocalEditing) {
        setActiveLayer(i);
      }
    });
    
    // Save on blur
    nameDiv.addEventListener('blur', (e) => {
      if (isLocalEditing) {
        finishEditingLayerName(nameDiv, i);
        isLocalEditing = false;
        isEditingLayerName = false; // Global flag
      }
    });
    
    // Save on Enter, Cancel on Escape
    nameDiv.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        finishEditingLayerName(nameDiv, i);
        nameDiv.blur();
        isLocalEditing = false;
        isEditingLayerName = false; // Global flag
      } else if (e.key === 'Escape') {
        e.preventDefault();
        cancelEditingLayerName(nameDiv, i);
        nameDiv.blur();
        isLocalEditing = false;
        isEditingLayerName = false; // Global flag
      }
      // Prevent tool shortcuts from triggering while editing
      e.stopPropagation();
    });
    
    // Focus event when editing starts
    nameDiv.addEventListener('focus', (e) => {
      if (!isLocalEditing) {
        isLocalEditing = true;
        isEditingLayerName = true; // Global flag
        nameDiv.setAttribute('data-original-name', nameDiv.textContent);
        nameDiv.style.background = '#1e40af22';
        nameDiv.style.outline = '1px solid #3b82f6';
        nameDiv.style.borderRadius = '3px';
        console.log('Layer name editing started - tool shortcuts disabled');
        // Select all text for easy editing
        setTimeout(() => {
          const range = document.createRange();
          range.selectNodeContents(nameDiv);
          const selection = window.getSelection();
          selection.removeAllRanges();
          selection.addRange(range);
        }, 1);
      }
    });
    
    // Drag and Drop Event Listeners
    layerItem.addEventListener('dragstart', (e) => {
      // Don't allow dragging if we're editing the name
      if (isLocalEditing || e.target.classList.contains('layer-name')) {
        e.preventDefault();
        return;
      }
      
      draggedLayerIndex = i;
      layerItem.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/html', layerItem.outerHTML);
    });
    
    layerItem.addEventListener('dragend', (e) => {
      layerItem.classList.remove('dragging');
      clearDropIndicators();
      draggedLayerIndex = null;
    });
    
    layerItem.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      
      if (draggedLayerIndex !== null && draggedLayerIndex !== i) {
        const rect = layerItem.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const dropIndex = e.clientY < midpoint ? i + 1 : i;
        
        clearDropIndicators();
        const indicator = layersList.querySelector(`[data-drop-index="${dropIndex}"]`);
        if (indicator) {
          indicator.classList.add('active');
        }
      }
    });
    
    layerItem.addEventListener('drop', (e) => {
      e.preventDefault();
      
      if (draggedLayerIndex !== null && draggedLayerIndex !== i) {
        const rect = layerItem.getBoundingClientRect();
        const midpoint = rect.top + rect.height / 2;
        const targetIndex = e.clientY < midpoint ? i + 1 : i;
        
        moveLayerToPosition(draggedLayerIndex, targetIndex);
      }
      
      clearDropIndicators();
    });
    
    // Add drop zone for indicators
    dropIndicator.addEventListener('dragover', (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      clearDropIndicators();
      dropIndicator.classList.add('active');
    });
    
    dropIndicator.addEventListener('drop', (e) => {
      e.preventDefault();
      const targetIndex = parseInt(dropIndicator.dataset.dropIndex);
      
      if (draggedLayerIndex !== null) {
        moveLayerToPosition(draggedLayerIndex, targetIndex);
      }
      
      clearDropIndicators();
    });
    
    layersList.appendChild(layerItem);
  }
  
  // Add final drop indicator at the bottom
  const finalDropIndicator = document.createElement('div');
  finalDropIndicator.className = 'layer-drop-indicator';
  finalDropIndicator.dataset.dropIndex = 0;
  
  finalDropIndicator.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    clearDropIndicators();
    finalDropIndicator.classList.add('active');
  });
  
  finalDropIndicator.addEventListener('drop', (e) => {
    e.preventDefault();
    if (draggedLayerIndex !== null) {
      moveLayerToPosition(draggedLayerIndex, 0);
    }
    clearDropIndicators();
  });
  
  layersList.appendChild(finalDropIndicator);
}

function clearDropIndicators() {
  const indicators = layersList.querySelectorAll('.layer-drop-indicator');
  indicators.forEach(indicator => indicator.classList.remove('active'));
}

function moveLayerToPosition(fromIndex, toIndex) {
  if (fromIndex === toIndex) return;
  
  pushUndo();
  
  // Remove layer from old position (preserves all properties including name)
  const layer = layers[currentFrame].splice(fromIndex, 1)[0];
  
  console.log(`Moving layer "${layer.name}" from position ${fromIndex} to ${toIndex}`);
  
  // Adjust target index if moving down
  let adjustedToIndex = toIndex;
  if (fromIndex < toIndex) {
    adjustedToIndex = toIndex - 1;
  }
  
  // Insert layer at new position (layer object contains name, opacity, visibility, data)
  layers[currentFrame].splice(adjustedToIndex, 0, layer);
  
  // Update current layer index
  if (currentLayer === fromIndex) {
    currentLayer = adjustedToIndex;
  } else if (currentLayer > fromIndex && currentLayer <= adjustedToIndex) {
    currentLayer--;
  } else if (currentLayer < fromIndex && currentLayer >= adjustedToIndex) {
    currentLayer++;
  }
  
  console.log(`Layer "${layer.name}" successfully moved to position ${adjustedToIndex}`);
  
  renderLayersList();
  renderGrid();
}

function setActiveLayer(layerIndex) {
  if (layerIndex >= 0 && layerIndex < layers[currentFrame].length) {
    currentLayer = layerIndex;
    renderLayersList();
  }
}

function addLayer() {
  pushUndo();
  if (!layers[currentFrame]) {
    layers[currentFrame] = createFrameWithLayers(gridSize);
  }
  
  // Create unique layer name
  const layerCount = layers[currentFrame].length + 1;
  const newLayer = createLayer(`Layer ${layerCount}`, gridSize);
  layers[currentFrame].push(newLayer);
  currentLayer = layers[currentFrame].length - 1;
  
  console.log(`Added new layer: "${newLayer.name}"`);
  
  renderLayersList();
  renderGrid();
}

function deleteLayer() {
  if (!layers[currentFrame] || layers[currentFrame].length <= 1) {
    alert("Cannot delete the last layer!");
    return;
  }
  
  pushUndo();
  layers[currentFrame].splice(currentLayer, 1);
  if (currentLayer >= layers[currentFrame].length) {
    currentLayer = layers[currentFrame].length - 1;
  }
  renderLayersList();
  renderGrid();
}

function duplicateLayer() {
  pushUndo();
  if (!layers[currentFrame]) return;
  
  const sourceLayer = layers[currentFrame][currentLayer];
  const newLayer = {
    ...sourceLayer,
    id: layerIdCounter++,
    name: sourceLayer.name + ' Copy',
    data: [...sourceLayer.data]
  };
  
  console.log(`Duplicated layer "${sourceLayer.name}" as "${newLayer.name}"`);
  
  layers[currentFrame].splice(currentLayer + 1, 0, newLayer);
  currentLayer = currentLayer + 1;
  renderLayersList();
  renderGrid();
}

function moveLayerUp() {
  if (currentLayer >= layers[currentFrame].length - 1) return;
  
  pushUndo();
  const layer = layers[currentFrame].splice(currentLayer, 1)[0];
  layers[currentFrame].splice(currentLayer + 1, 0, layer);
  currentLayer++;
  renderLayersList();
  renderGrid();
}

function moveLayerDown() {
  if (currentLayer <= 0) return;
  
  pushUndo();
  const layer = layers[currentFrame].splice(currentLayer, 1)[0];
  layers[currentFrame].splice(currentLayer - 1, 0, layer);
  currentLayer--;
  renderLayersList();
  renderGrid();
}

function toggleLayerVisibility(layerIndex) {
  pushUndo();
  layers[currentFrame][layerIndex].visible = !layers[currentFrame][layerIndex].visible;
  renderLayersList();
  renderGrid();
}

function setLayerOpacity(layerIndex, opacity) {
  layers[currentFrame][layerIndex].opacity = Math.max(0, Math.min(100, opacity));
  renderLayersList();
  renderGrid();
}

function renameLayer(layerIndex, newName) {
  if (newName && newName !== layers[currentFrame][layerIndex].name) {
    layers[currentFrame][layerIndex].name = newName;
    renderLayersList();
  }
}

// Enhanced layer name editing functions
function startEditingLayerName(nameDiv, layerIndex) {
  nameDiv.focus();
}

function finishEditingLayerName(nameDiv, layerIndex) {
  const newName = nameDiv.textContent.trim();
  
  // Reset visual styling
  nameDiv.style.background = '';
  nameDiv.style.outline = '';
  nameDiv.style.borderRadius = '';
  
  if (newName && newName !== '') {
    // Update the layer name
    layers[currentFrame][layerIndex].name = newName;
    console.log(`Layer ${layerIndex} renamed to: ${newName} - tool shortcuts re-enabled`);
  } else {
    // Restore original name if empty
    const originalName = nameDiv.getAttribute('data-original-name') || `Layer ${layerIndex + 1}`;
    layers[currentFrame][layerIndex].name = originalName;
    nameDiv.textContent = originalName;
  }
  
  nameDiv.removeAttribute('data-original-name');
  isEditingLayerName = false; // Ensure global flag is cleared
}

function cancelEditingLayerName(nameDiv, layerIndex) {
  // Reset visual styling
  nameDiv.style.background = '';
  nameDiv.style.outline = '';
  nameDiv.style.borderRadius = '';
  
  // Restore original name
  const originalName = nameDiv.getAttribute('data-original-name') || layers[currentFrame][layerIndex].name;
  nameDiv.textContent = originalName;
  nameDiv.removeAttribute('data-original-name');
  
  console.log(`Layer ${layerIndex} name editing cancelled - tool shortcuts re-enabled`);
  isEditingLayerName = false; // Ensure global flag is cleared
}
function setTool(newTool) {
  // Cancel any active operations when switching tools
  if (tool === "move" && isMoving) {
    cancelMove();
  }
  if (tool === "transform" && isTransforming) {
    cancelTransform();
  }
  
  tool = newTool;
  
  // Start transform mode when transform tool is selected
  if (tool === "transform") {
    console.log('Transform tool selected - calling startTransform()');
    startTransform();
  }
  allToolBtns.forEach(btn => btn.classList.remove('active'));
  if (tool === "draw") toolDraw.classList.add('active');
  if (tool === "brush") toolBrush.classList.add('active');
  if (tool === "eraser") toolEraser.classList.add('active');
  if (tool === "fill") toolFill.classList.add('active');
  if (tool === "line") toolLine.classList.add('active');
  if (tool === "rect") toolRect.classList.add('active');
  if (tool === "circle") toolCircle.classList.add('active');
  if (tool === "eyedropper") toolEyedropper.classList.add('active');
  if (tool === "move") toolMove.classList.add('active');
  if (tool === "text") toolText.classList.add('active');
  if (tool === "transform") toolTransform.classList.add('active');
  
  // Show/hide tool-specific controls
  brushControls.forEach(bc => bc.style.display = (tool === "brush") ? "flex" : "none");
  shapeControls.style.display = (tool === "rect" || tool === "circle") ? "flex" : "none";
  transformControls.style.display = (tool === "transform") ? "flex" : "none";
  
  // Show/hide font controls in app bar
  if (tool === "text") {
    fontControls.classList.remove('hidden');
  } else {
    fontControls.classList.add('hidden');
  }
  
  // Update cursor style for move tool
  if (tool === "move") {
    gridElem.classList.add('move-cursor');
  } else {
    gridElem.classList.remove('move-cursor');
  }
  
  renderPalette();
}
if (toolDraw) toolDraw.addEventListener('click', () => setTool("draw"));
if (toolBrush) toolBrush.addEventListener('click', () => setTool("brush"));
if (toolEraser) toolEraser.addEventListener('click', () => setTool("eraser"));
if (toolFill) toolFill.addEventListener('click', () => setTool("fill"));
if (toolLine) toolLine.addEventListener('click', () => setTool("line"));
if (toolRect) toolRect.addEventListener('click', () => setTool("rect"));
if (toolCircle) toolCircle.addEventListener('click', () => setTool("circle"));
if (toolEyedropper) toolEyedropper.addEventListener('click', () => setTool("eyedropper"));
if (toolMove) toolMove.addEventListener('click', () => setTool("move"));
if (toolText) toolText.addEventListener('click', () => setTool("text"));
if (toolTransform) {
  toolTransform.addEventListener('click', () => {
    console.log('Transform tool button clicked');
    setTool("transform");
  });
}

if (brushSizeInput) brushSizeInput.addEventListener('input', e => { brushSize = parseInt(e.target.value); });
if (brushShapeSquare) {
brushShapeSquare.addEventListener('click', () => {
  brushShape = "square"; brushShapeSquare.classList.add('active'); brushShapeCircle.classList.remove('active');
});
  brushShapeSquare.classList.add('active');
}
if (brushShapeCircle) {
brushShapeCircle.addEventListener('click', () => {
  brushShape = "circle"; brushShapeCircle.classList.add('active'); brushShapeSquare.classList.remove('active');
});
}

// Shape controls
if (shapeOutline) {
  shapeOutline.addEventListener('click', () => {
    shapeMode = "outline"; shapeOutline.classList.add('active'); shapeFilled.classList.remove('active');
  });
  shapeOutline.classList.add('active');
}
if (shapeFilled) {
  shapeFilled.addEventListener('click', () => {
    shapeMode = "filled"; shapeFilled.classList.add('active'); shapeOutline.classList.remove('active');
  });
}

// Transform controls
if (transformRotateBtn) {
  transformRotateBtn.addEventListener('click', () => {
    transformMode = "rotate";
    transformRotateBtn.classList.add('active');
    if (transformScaleBtn) transformScaleBtn.classList.remove('active');
  });
}

if (transformScaleBtn) {
  transformScaleBtn.addEventListener('click', () => {
    transformMode = "scale";
    transformScaleBtn.classList.add('active');
    if (transformRotateBtn) transformRotateBtn.classList.remove('active');
  });
}

if (applyTransformBtn) {
  applyTransformBtn.addEventListener('click', () => {
    finishTransform();
  });
}

if (cancelTransformBtn) {
  cancelTransformBtn.addEventListener('click', () => {
    cancelTransform();
  });
}

// ===== APPLICATION BAR EVENT LISTENERS =====

// Font controls
if (fontFamily) {
  fontFamily.addEventListener('change', (e) => {
    currentFontFamily = e.target.value;
    console.log(`Font family changed to: ${currentFontFamily}`);
  });
}

if (fontSize) {
  fontSize.addEventListener('input', (e) => {
    currentFontSize = parseInt(e.target.value);
    if (fontSizeLabel) fontSizeLabel.textContent = `${currentFontSize}x`;
    console.log(`Font size changed to: ${currentFontSize}x`);
  });
}

// Grid controls in app bar
if (gridSizeApp) {
  gridSizeApp.addEventListener('input', (e) => {
    // Keep both inputs in sync
    const newSize = parseInt(e.target.value);
    if (gridSizeOld) gridSizeOld.value = newSize;
  });
}

if (resizeGridApp) {
  resizeGridApp.addEventListener('click', () => {
    const newSize = parseInt(gridSizeApp.value);
    if (newSize < 8 || newSize > 40) {
      alert('Grid size must be between 8 and 40');
      return;
    }
  
  pushUndo();
  gridSize = newSize;
  
  // Update old input too if it exists
  if (gridSizeOld) gridSizeOld.value = newSize;
  
  // Recreate all frames and layers with new size
  frames = frames.map(() => createBlankFrame(gridSize));
  layers = layers.map(frameLayers => 
    frameLayers.map(layer => ({ 
      ...layer, 
      data: createBlankFrame(gridSize) 
    }))
  );
  renderGrid();
  renderLayersList();
  console.log(`Grid resized to ${gridSize}x${gridSize} from app bar`);
});

// Keep old grid controls working if they exist
if (gridSizeOld) {
  gridSizeOld.addEventListener('input', (e) => {
    const newSize = parseInt(e.target.value);
    if (gridSizeApp) gridSizeApp.value = newSize;
  });
}

if (resizeGridOld) {
  resizeGridOld.addEventListener('click', () => {
    // Trigger the app bar resize function
    if (resizeGridApp) resizeGridApp.click();
  });
}

// ===== START SCREEN EVENT LISTENERS =====

// Debug: Check if elements exist
console.log('Checking start screen elements:');
console.log('startNewFileBtn:', startNewFileBtn);
console.log('startOpenFileBtn:', startOpenFileBtn);
console.log('startDemoBtn:', startDemoBtn);
console.log('startTutorialBtn:', startTutorialBtn);
console.log('skipStartBtn:', skipStartBtn);
console.log('clearRecentBtn:', clearRecentBtn);

if (startNewFileBtn) {
  startNewFileBtn.addEventListener('click', () => {
    console.log('Start New File clicked');
    showCanvasSettings();
  });
} else {
  console.error('startNewFileBtn not found');
}

if (startOpenFileBtn) {
  startOpenFileBtn.addEventListener('click', () => {
    console.log('Start Open File clicked');
    hideStartScreen();
    document.getElementById('openFile').click();
  });
} else {
  console.error('startOpenFileBtn not found');
}

if (startDemoBtn) {
  startDemoBtn.addEventListener('click', () => {
    console.log('Start Demo clicked');
    hideStartScreen();
    startDemo();
  });
} else {
  console.error('startDemoBtn not found');
}

if (startTutorialBtn) {
  startTutorialBtn.addEventListener('click', () => {
    console.log('Start Tutorial clicked');
    hideStartScreen();
    startTutorial();
  });
} else {
  console.error('startTutorialBtn not found');
}

if (skipStartBtn) {
  skipStartBtn.addEventListener('click', () => {
    console.log('Skip Start clicked');
    hideStartScreen();
    createNewProject();
  });
} else {
  console.error('skipStartBtn not found');
}

if (clearRecentBtn) {
  clearRecentBtn.addEventListener('click', () => {
    console.log('Clear Recent clicked');
    if (confirm('Clear all recent files? This cannot be undone.')) {
      clearRecentFiles();
    }
  });
} else {
  console.error('clearRecentBtn not found');
}

// Add event listener for start screen menu item
const showStartScreenBtn = document.getElementById('showStartScreen');
if (showStartScreenBtn) {
  showStartScreenBtn.onclick = () => {
    showStartScreen();
  };
}

// ===== CANVAS SETTINGS EVENT LISTENERS =====

// Canvas size input changes - keep width and height in sync for square canvases
if (canvasWidth) {
  canvasWidth.addEventListener('input', () => {
    // Keep height in sync with width for square canvas
    if (canvasHeight) canvasHeight.value = canvasWidth.value;
    updateCanvasPreview();
  });
}

if (canvasHeight) {
  canvasHeight.addEventListener('input', () => {
    // Keep width in sync with height for square canvas
    if (canvasWidth) canvasWidth.value = canvasHeight.value;
    updateCanvasPreview();
  });
}

// Canvas preset buttons
document.querySelectorAll('.canvas-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const size = parseInt(btn.dataset.size);
    selectCanvasPreset(size);
  });
});

// Palette preset buttons
document.querySelectorAll('.palette-preset-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    const preset = btn.dataset.palette;
    selectPalettePreset(preset);
  });
});

// Background type radio change
document.querySelectorAll('input[name="bgType"]').forEach(radio => {
  radio.addEventListener('change', () => {
    const colorInput = canvasBackground;
    if (radio.value === 'color') {
      colorInput.disabled = false;
      colorInput.style.opacity = '1';
    } else {
      colorInput.disabled = true;
      colorInput.style.opacity = '0.5';
    }
  });
});

// Modal action buttons
if (cancelCanvasSettings) {
  cancelCanvasSettings.addEventListener('click', () => {
    hideCanvasSettings();
  });
}

if (createCanvasBtn) {
  createCanvasBtn.addEventListener('click', () => {
    const width = parseInt(canvasWidth ? canvasWidth.value : 16) || 16;
    const height = parseInt(canvasHeight ? canvasHeight.value : 16) || 16;
    const bgTypeRadio = document.querySelector('input[name="bgType"]:checked');
    const bgType = bgTypeRadio ? bgTypeRadio.value : 'transparent';
    const isTransparent = bgType === 'transparent';
    
    // Validate dimensions
    if (width < 8 || width > 256 || height < 8 || height > 256) {
      alert('Canvas dimensions must be between 8 and 256 pixels');
      return;
    }
    
    createNewProjectWithSettings(width, height, isTransparent, selectedPalettePreset);
  });
}

// Close canvas settings with Escape key
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && canvasSettingsModal && !canvasSettingsModal.classList.contains('hidden')) {
    e.preventDefault();
    hideCanvasSettings();
  }
});

// Transform handle interactions
document.addEventListener('mousedown', (e) => {
  if (!isTransforming || !e.target.classList.contains('transform-handle')) return;
  
  e.preventDefault();
  const handle = e.target.dataset.handle;
  
  if (handle === 'rotate') {
    // Rotation handle
    const startMousePos = { x: e.clientX, y: e.clientY };
    const boxRect = transformBox.getBoundingClientRect();
    const centerX = boxRect.left + boxRect.width / 2;
    const centerY = boxRect.top + boxRect.height / 2;
    
    const startAngle = Math.atan2(startMousePos.y - centerY, startMousePos.x - centerX);
    
    const onMouseMove = (moveE) => {
      const currentAngle = Math.atan2(moveE.clientY - centerY, moveE.clientX - centerX);
      const angleDiff = currentAngle - startAngle;
      
      transformCurrentAngle = angleDiff;
      applyRotation(transformCurrentAngle);
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
    
  } else if (handle.includes('e') || handle.includes('w') || handle.includes('n') || handle.includes('s')) {
    // Corner handles for scaling
    const startMousePos = { x: e.clientX, y: e.clientY };
    const boxRect = transformBox.getBoundingClientRect();
    const startDistance = Math.sqrt(
      Math.pow(startMousePos.x - (boxRect.left + boxRect.width / 2), 2) +
      Math.pow(startMousePos.y - (boxRect.top + boxRect.height / 2), 2)
    );
    
    const onMouseMove = (moveE) => {
      const currentDistance = Math.sqrt(
        Math.pow(moveE.clientX - (boxRect.left + boxRect.width / 2), 2) +
        Math.pow(moveE.clientY - (boxRect.top + boxRect.height / 2), 2)
      );
      
      const scale = Math.max(0.1, Math.min(3.0, currentDistance / startDistance));
      transformScale = scale;
      applyScale(transformScale);
    };
    
    const onMouseUp = () => {
      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };
    
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  }
});

if (colorPicker) {
colorPicker.addEventListener('input', e => {
  currentColor = e.target.value;
  if (tool !== "draw" && tool !== "brush") setTool("draw");
  renderPalette();
});
}
if (clearBtn) {
  clearBtn.addEventListener('click', () => { 
    pushUndo(); 
    const layer = getCurrentLayer();
    layer.data = createBlankFrame(gridSize);
    renderGrid(); 
  });
}
if (resizeGridBtn) {
resizeGridBtn.addEventListener('click', () => {
    let size = parseInt(gridSizeInput ? gridSizeInput.value : 16);
  if (isNaN(size) || size < 8) size = 8;
  if (size > 40) size = 40;
  if (size === gridSize) return;
  pushUndo();
  gridSize = size;
  frames = frames.map(() => createBlankFrame(gridSize));
    // Recreate layers with new size
    layers = layers.map(frameLayers => 
      frameLayers.map(layer => ({
        ...layer,
        data: createBlankFrame(gridSize)
      }))
    );
  renderGrid();
    renderLayersList();
});
}
if (undoBtn) {
undoBtn.addEventListener('click', () => {
  if (undoStack.length > 0) {
    const layersCopy = layers.map(frameLayers => 
      frameLayers.map(layer => ({
        ...layer,
        data: [...layer.data]
      }))
    );
    redoStack.push({
      layers: layersCopy,
      frames: frames.map(frame => [...frame]), 
      currentFrame, 
      currentLayer,
      gridSize
    });
    const prev = undoStack.pop();
    applyState(prev); updateUndoRedoButtons();
  }
});
}
if (redoBtn) {
redoBtn.addEventListener('click', () => {
  if (redoStack.length > 0) {
      const layersCopy = layers.map(frameLayers => 
        frameLayers.map(layer => ({
          ...layer,
          data: [...layer.data]
        }))
      );
      undoStack.push({
        layers: layersCopy,
        frames: frames.map(frame => [...frame]), 
        currentFrame, 
        currentLayer,
        gridSize
      });
    const next = redoStack.pop();
    applyState(next); updateUndoRedoButtons();
  }
});
}
function updateFrameLabel() { 
  if (frameLabel) frameLabel.textContent = `${currentFrame + 1} / ${frames.length}`; 
}
if (prevFrameBtn) {
  prevFrameBtn.addEventListener('click', () => { 
    if (currentFrame > 0) { 
      pushUndo(); 
      currentFrame--; 
      currentLayer = 0; // Reset layer when changing frames
      renderGrid(); 
      renderLayersList();
      updateFrameLabel(); 
    }
  });
}
if (nextFrameBtn) {
  nextFrameBtn.addEventListener('click', () => { 
    if (currentFrame < frames.length - 1) { 
      pushUndo(); 
      currentFrame++; 
      currentLayer = 0; // Reset layer when changing frames
      renderGrid(); 
      renderLayersList();
      updateFrameLabel(); 
    }
  });
}
if (addFrameBtn) {
  addFrameBtn.addEventListener('click', () => {
  pushUndo(); 
  const newFrame = [...frames[currentFrame]];
  frames.splice(currentFrame + 1, 0, newFrame);
  
  // Duplicate layers for new frame
  const newFrameLayers = layers[currentFrame].map(layer => ({
    ...layer,
    id: layerIdCounter++,
    data: [...layer.data]
  }));
  layers.splice(currentFrame + 1, 0, newFrameLayers);
  
  currentFrame++; 
  currentLayer = 0;
  renderGrid(); 
  renderLayersList();
  updateFrameLabel();
  });
}
deleteFrameBtn.addEventListener('click', () => {
  if (frames.length === 1) return;
  pushUndo();
  frames.splice(currentFrame, 1);
  layers.splice(currentFrame, 1);
  if (currentFrame >= frames.length) currentFrame = frames.length - 1;
  currentLayer = 0;
  renderGrid(); 
  renderLayersList();
  updateFrameLabel();
});
playAnimBtn.addEventListener('click', () => {
  const px = Math.min(400 / gridSize, 40);
  animCanvas.width = animCanvas.height = px * gridSize;
  animModal.classList.remove('hidden');
  let idx = 0, stop = false;
  function drawFrame() {
    if (stop) return;
    const ctx = animCanvas.getContext('2d');
    const data = frames[idx];
    for (let i = 0; i < data.length; i++) {
      const x = i % gridSize;
      const y = Math.floor(i / gridSize);
      ctx.fillStyle = data[i];
      ctx.fillRect(x * px, y * px, px, px);
    }
    idx = (idx + 1) % frames.length;
    setTimeout(drawFrame, 150);
  }
  drawFrame();
  closeAnimBtn.onclick = () => { stop = true; animModal.classList.add('hidden'); };
});
exportBtn.addEventListener('click', doExportPNG);
function doExportPNG() {
  const px = Math.floor(512 / gridSize);
  const cnv = document.createElement('canvas');
  cnv.width = cnv.height = gridSize * px;
  const ctx = cnv.getContext('2d');
  
  // Enable transparency
  ctx.clearRect(0, 0, cnv.width, cnv.height);
  
  // Use layer compositing for proper export
  const totalPixels = gridSize * gridSize;
  for (let i = 0; i < totalPixels; i++) {
    const x = i % gridSize;
    const y = Math.floor(i / gridSize);
    
    // Get the composited color (but don't use checkered background for export)
    let finalColor = null;
    const frameLayers = layers[currentFrame] || [];
    
    for (let layerIndex = 0; layerIndex < frameLayers.length; layerIndex++) {
      const layer = frameLayers[layerIndex];
      if (!layer.visible) continue;
      
      const layerColor = layer.data[i];
      if (layerColor === null || layerColor === TRANSPARENT) continue;
      
      if (layer.opacity >= 100) {
        finalColor = layerColor;
      } else {
        const alpha = layer.opacity / 100;
        if (alpha > 0.9) {
          finalColor = layerColor;
        } else {
          finalColor = alpha > 0.5 ? layerColor : finalColor;
        }
      }
    }
    
    // Only paint non-transparent pixels
    if (finalColor !== null) {
      ctx.fillStyle = finalColor;
    ctx.fillRect(x * px, y * px, px, px);
  }
    // Transparent pixels are left as transparent in the canvas
  }
  
  const a = document.createElement('a');
  a.href = cnv.toDataURL('image/png');
  a.download = 'pixelpro.png';
  a.click();
}
function init() {
  console.log(`PixelPro init: gridSize=${gridSize}, frames.length=${frames.length}, layers.length=${layers.length}`);
  
  gridSizeInput.value = gridSize;
  colorPicker.value = currentColor;
  if (!frames.length) frames = [createBlankFrame(gridSize)];
  if (currentFrame < 0 || currentFrame >= frames.length) currentFrame = 0;
  
  // Initialize layers
  if (!layers.length) {
    layers = [createFrameWithLayers(gridSize)];
  }
  currentLayer = 0;
  
  console.log(`PixelPro init: after setup - frames[0].length=${frames[0]?.length}, layers[0][0].data.length=${layers[0]?.[0]?.data?.length}`);
  
  undoStack = [];
  redoStack = [];
  setTool("draw");
  renderGrid();
  updateFrameLabel();
  updateUndoRedoButtons();
  renderPalette();
  renderLayersList();
  
  // Initialize application bar controls
  if (gridSizeApp) gridSizeApp.value = gridSize;
  if (fontFamily) fontFamily.value = currentFontFamily;
  if (fontSize) {
    fontSize.value = currentFontSize;
    fontSizeLabel.textContent = `${currentFontSize}x`;
  }
  
  // Ensure layers panel is visible and functional
  if (layersPanelShown) {
    layersPanel.classList.remove('hidden');
    layersPanel.classList.add('lg:block');
    console.log('PixelPro: Layers panel initialized and visible');
  }
}

// Check if this is the first load (no recent files and empty project)
function shouldShowStartScreen() {
  // Show start screen if there are recent files OR it's a fresh/empty start
  const recentFiles = getRecentFiles();
  const hasEmptyProject = !frames.length || (frames.length === 1 && frames[0].every(pixel => pixel === TRANSPARENT));
  
  console.log('shouldShowStartScreen() check:');
  console.log('- recentFiles.length:', recentFiles.length);
  console.log('- frames.length:', frames.length);
  console.log('- hasEmptyProject:', hasEmptyProject);
  console.log('- TRANSPARENT:', TRANSPARENT);
  
  const result = recentFiles.length > 0 || hasEmptyProject;
  console.log('- shouldShow result:', result);
  
  return result;
}

window.init = init;
window.doExportPNG = doExportPNG;

// Initialize the app
console.log('Initializing app...');
init();

// Show start screen on first load
console.log('Checking if should show start screen...');
if (shouldShowStartScreen()) {
  console.log('Showing start screen...');
  showStartScreen();
} else {
  console.log('Not showing start screen');
}

// TEMPORARY: Create a simple test screen if start screen doesn't exist
console.log('CREATING EMERGENCY TEST SCREEN...');
setTimeout(() => {
  console.log('Timeout triggered - checking for start screen');
  const startScreenElement = document.getElementById('startScreen');
  console.log('startScreen element:', startScreenElement);
  
  if (startScreenElement) {
    console.log('Start screen found - forcing visibility');
    // Remove any hidden class
    startScreenElement.classList.remove('hidden');
    // Force display and z-index
    startScreenElement.style.display = 'flex';
    startScreenElement.style.zIndex = '9999';
    startScreenElement.style.position = 'fixed';
    startScreenElement.style.top = '0';
    startScreenElement.style.left = '0';
    startScreenElement.style.right = '0';
    startScreenElement.style.bottom = '0';
    startScreenElement.style.backgroundColor = 'rgba(26, 29, 35, 0.95)';
    console.log('Start screen forced to be visible');
  } else {
    console.error('START SCREEN ELEMENT NOT FOUND! Creating emergency test screen...');
    
    // Create a simple test screen
    const testScreen = document.createElement('div');
    testScreen.innerHTML = `
      <div style="
        position: fixed; 
        top: 0; left: 0; right: 0; bottom: 0; 
        background: rgba(255, 0, 0, 0.9); 
        z-index: 99999; 
        display: flex; 
        align-items: center; 
        justify-content: center; 
        font-family: Arial; 
        color: white; 
        font-size: 24px;
        text-align: center;
      ">
        <div>
          <h1>EMERGENCY TEST SCREEN</h1>
          <p>Start screen element missing from HTML!</p>
          <button onclick="this.parentElement.parentElement.remove()" style="
            background: white; 
            color: black; 
            padding: 10px 20px; 
            border: none; 
            margin-top: 20px; 
            cursor: pointer;
          ">Close</button>
        </div>
      </div>
    `;
    document.body.appendChild(testScreen);
    console.log('Emergency test screen created');
  }
}, 1000);

// ---- Menu bar actions ----
document.getElementById('undoBtnMenu').onclick = () => undoBtn.click();
document.getElementById('redoBtnMenu').onclick = () => redoBtn.click();
document.getElementById('clearBtnMenu').onclick = () => clearBtn.click();
document.getElementById('resizeGridMenu').onclick = () => resizeGridBtn.click();
document.getElementById('nextFrameMenu').onclick = () => nextFrameBtn.click();
document.getElementById('prevFrameMenu').onclick = () => prevFrameBtn.click();
document.getElementById('addFrameMenu').onclick = () => addFrameBtn.click();
document.getElementById('deleteFrameMenu').onclick = () => deleteFrameBtn.click();
document.getElementById('playAnimMenu').onclick = () => playAnimBtn.click();
document.getElementById('exportBtnMenu').onclick = () => exportBtn.click();
document.getElementById('newFile').onclick = () => { 
  if (confirm("Clear current artwork and start new?")) { 
    showCanvasSettings();
  } 
};
document.getElementById('exitApp').onclick = () => window.close?.();

document.getElementById('saveFile').onclick = function() {
  const data = { 
    gridSize, 
    palette, 
    frames, 
    layers,
    currentFrame, 
    currentLayer,
    currentColor, 
    tool, 
    brushSize, 
    brushShape,
    shapeMode,
    layerIdCounter,
    currentFontFamily,
    currentFontSize
  };
  // Generate filename with timestamp
  const now = new Date();
  const timestamp = now.toISOString().slice(0, 19).replace(/[:]/g, '-');
  const filename = `pixelpro-${timestamp}.json`;
  
  const blob = new Blob([JSON.stringify(data, null, 2)], {type: 'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
  
  // Save to recent files
  saveRecentFile(filename, data);
  
  showModal("<div class='text-green-700 font-semibold text-lg'>Saved!</div><div class='text-sm mt-2'>Your artwork was saved as a JSON file and added to recent files.</div>");
};
document.getElementById('openFile').onclick = function() {
  document.getElementById('openFileInput').value = '';
  document.getElementById('openFileInput').click();
};
document.getElementById('openFileInput').addEventListener('change', function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = function(evt) {
    try {
      const data = JSON.parse(evt.target.result);
      if (data && data.frames && data.frames.length && data.gridSize) {
        gridSize = data.gridSize;
        palette = data.palette || ['#22223b', '#f72585', '#b5179e', '#3a86ff', '#ffbe0b', '#fb5607', '#fff'];
        frames = data.frames;
        
        // Load layers if available, otherwise create from frames
        if (data.layers) {
          layers = data.layers;
          layerIdCounter = data.layerIdCounter || 1;
        } else {
          // Convert old format to layers
          layers = frames.map(frame => [createLayer("Background", gridSize)]);
          layers.forEach((frameLayers, frameIndex) => {
            frameLayers[0].data = [...frames[frameIndex]];
          });
        }
        
        currentFrame = data.currentFrame || 0;
        currentLayer = data.currentLayer || 0;
        currentColor = data.currentColor || palette[0] || "#000";
        tool = data.tool || "draw";
        brushSize = data.brushSize || 3;
        brushShape = data.brushShape || "square";
        shapeMode = data.shapeMode || "outline";
        currentFontFamily = data.currentFontFamily || "pixel";
        currentFontSize = data.currentFontSize || 1;
        
        init();
        showModal("<div class='text-green-700 font-semibold text-lg'>Loaded!</div><div class='text-sm mt-2'>Your artwork was loaded.</div>");
      } else {
        showModal("<div class='text-red-700 font-semibold text-lg'>Invalid File</div>");
      }
    } catch {
      showModal("<div class='text-red-700 font-semibold text-lg'>Invalid File Format</div>");
    }
  };
  reader.readAsText(file);
});

// View menu
let sidebarShown = true, paletteBarShown = true;
document.getElementById('toggleSidebar').onclick = () => {
  sidebarShown = !sidebarShown;
  document.getElementById('sidebar').style.display = sidebarShown ? '' : 'none';
};
document.getElementById('togglePaletteBar').onclick = () => {
  paletteBarShown = !paletteBarShown;
  paletteBar.style.display = paletteBarShown ? '' : 'none';
};
document.getElementById('toggleLayers').onclick = () => {
  layersPanelShown = !layersPanelShown;
  
  if (layersPanelShown) {
    layersPanel.classList.remove('hidden');
    layersPanel.classList.add('lg:block');
    // For mobile, show as overlay
    if (window.innerWidth <= 1024) {
      layersPanel.classList.add('mobile-visible');
      // Add backdrop for mobile
      const backdrop = document.createElement('div');
      backdrop.className = 'layers-backdrop';
      backdrop.onclick = () => {
        layersPanelShown = false;
        layersPanel.classList.add('hidden');
        layersPanel.classList.remove('mobile-visible');
        backdrop.remove();
      };
      document.body.appendChild(backdrop);
    }
    renderLayersList();
  } else {
    layersPanel.classList.add('hidden');
    layersPanel.classList.remove('lg:block', 'mobile-visible');
    // Remove backdrop if it exists
    const backdrop = document.querySelector('.layers-backdrop');
    if (backdrop) backdrop.remove();
  }
};

// Handle responsive layout on window resize
window.addEventListener('resize', () => {
  const isLargeScreen = window.innerWidth > 1024;
  
  // Update layers panel visibility based on screen size
  if (isLargeScreen && layersPanelShown) {
    layersPanel.classList.remove('hidden', 'mobile-visible');
    layersPanel.classList.add('lg:block');
    // Remove backdrop if it exists
    const backdrop = document.querySelector('.layers-backdrop');
    if (backdrop) backdrop.remove();
  } else if (!isLargeScreen && layersPanelShown) {
    layersPanel.classList.remove('lg:block');
    // Don't show on small screens unless explicitly toggled
  }
  
  // Update transform overlay if it's visible
  if (isTransforming && transformBounds) {
    showTransformOverlay();
  }
});

// Safety check to reset editing state if focus is lost unexpectedly
document.addEventListener('click', (e) => {
  // If click is outside any layer name input and we think we're editing, reset the flag
  if (isEditingLayerName && !e.target.classList.contains('layer-name')) {
    const editingElements = document.querySelectorAll('.layer-name:focus');
    if (editingElements.length === 0) {
      console.log('Layer name editing state reset - no focused layer names found');
      isEditingLayerName = false;
    }
  }
});

// ===== LAYER PANEL EVENT LISTENERS =====
addLayerBtn.addEventListener('click', addLayer);
deleteLayerBtn.addEventListener('click', deleteLayer);
duplicateLayerBtn.addEventListener('click', duplicateLayer);
moveLayerUpBtn.addEventListener('click', moveLayerUp);
moveLayerDownBtn.addEventListener('click', moveLayerDown);
closeLayersBtn.addEventListener('click', () => {
  layersPanelShown = false;
  layersPanel.classList.add('hidden');
  layersPanel.classList.remove('lg:block', 'mobile-visible');
  // Remove backdrop if it exists
  const backdrop = document.querySelector('.layers-backdrop');
  if (backdrop) backdrop.remove();
});

// ===== TEXT MODAL EVENT LISTENERS =====
addTextBtn.addEventListener('click', () => {
  const text = textInput.value.trim();
  if (text && textClickPosition !== null) {
    const startX = textClickPosition % gridSize;
    const startY = Math.floor(textClickPosition / gridSize);
    renderTextAt(text, startX, startY);
  }
  closeTextModal();
});

cancelTextBtn.addEventListener('click', () => {
  closeTextModal();
});

textInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    addTextBtn.click();
  } else if (e.key === 'Escape') {
    e.preventDefault();
    cancelTextBtn.click();
  }
});

// Close text modal when clicking outside
textModal.addEventListener('click', (e) => {
  if (e.target === textModal) {
    closeTextModal();
  }
});

// About Dialog
document.getElementById('aboutMenu').onclick = function() {
  showModal(`
    <div class="text-2xl font-bold mb-1">PixelPro</div>
    <div class="mb-4 text-sm text-gray-400">Pixel Art Designer v1.0</div>
    <p>A modern, professional pixel art and animation editor.<br>
    <span class="text-blue-400 font-semibold">2025</span> – Created by <a href="mailto:support@example.com" class="underline">PixelPro Team</a></p>
    <div class="mt-6"><button onclick="closeModal()" class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1 rounded">OK</button></div>
  `);
};
// Keyboard Shortcuts Dialog
document.getElementById('shortcutsMenu').onclick = function() {
  showModal(`
    <div class="text-xl font-semibold mb-3">Keyboard Shortcuts</div>
    <table class="w-full text-base">
      <tr><td>New</td><td class="text-blue-400 text-right">Ctrl+N</td></tr>
      <tr><td>Open</td><td class="text-blue-400 text-right">Ctrl+O</td></tr>
      <tr><td>Save</td><td class="text-blue-400 text-right">Ctrl+S</td></tr>
      <tr><td>Undo</td><td class="text-blue-400 text-right">Ctrl+Z</td></tr>
      <tr><td>Redo</td><td class="text-blue-400 text-right">Ctrl+Y</td></tr>
      <tr><td>Next Frame</td><td class="text-blue-400 text-right">→</td></tr>
      <tr><td>Prev Frame</td><td class="text-blue-400 text-right">←</td></tr>
      <tr><td>Theme</td><td class="text-blue-400 text-right">Alt+T</td></tr>
    </table>
    <div style="margin-top: 20px;"><strong>Drawing Tools:</strong></div>
    <table class="w-full text-base">
      <tr><td>Pencil</td><td class="text-blue-400 text-right">B</td></tr>
      <tr><td>Eraser</td><td class="text-blue-400 text-right">E</td></tr>
      <tr><td>Fill</td><td class="text-blue-400 text-right">G</td></tr>
      <tr><td>Line</td><td class="text-blue-400 text-right">L</td></tr>
      <tr><td>Rectangle</td><td class="text-blue-400 text-right">R</td></tr>
      <tr><td>Circle</td><td class="text-blue-400 text-right">C</td></tr>
      <tr><td>Eyedropper</td><td class="text-blue-400 text-right">I</td></tr>
      <tr><td>Move</td><td class="text-blue-400 text-right">V</td></tr>
      <tr><td>Text</td><td class="text-blue-400 text-right">T</td></tr>
      <tr><td>Transform</td><td class="text-blue-400 text-right">Q</td></tr>
    </table>
    <div class="mt-6"><button onclick="closeModal()" class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1 rounded">OK</button></div>
  `);
};
// Help Docs Dialog
document.getElementById('helpMenu').onclick = function() {
  showModal(`
    <div class="text-xl font-semibold mb-2">Help</div>
    <p>Use the <span class="bg-blue-100 px-2 rounded text-blue-800">Menu Bar</span> to create, open, save, or export your pixel art.<br>
    Select tools from the toolbar.<br>
    Use the palette to pick colors.<br>
    <strong>Move Tool:</strong> Click and drag to move content around the canvas (V key).<br>
    <strong>Text Tool:</strong> Click on canvas to add pixel-perfect text (T key). Use the Application Bar to choose font family and size.<br>
    <strong>Transform Tool:</strong> Rotate and scale content with interactive handles (Q key).<br>
    <strong>Application Bar:</strong> Top bar contains frame controls, font settings, and grid size controls.<br>
    <strong>Layers:</strong> Double-click layer names to rename them. Tool shortcuts are disabled while editing layer names.<br>
    Undo/Redo, animation frames, and more are all available!</p>
    <div class="mt-6"><button onclick="closeModal()" class="bg-blue-700 hover:bg-blue-800 text-white px-4 py-1 rounded">OK</button></div>
  `);
};

// Theme shortcut (Alt+T) and other keyboard shortcuts
document.addEventListener('keydown', function(e) {
  if (e.altKey && (e.key === "t" || e.key === "T")) {
    e.preventDefault();
    document.getElementById('toggleDarkMode').click();
  }
  if (e.ctrlKey && e.key === 'z') { e.preventDefault(); undoBtn.click(); }
  if (e.ctrlKey && e.key === 'y') { e.preventDefault(); redoBtn.click(); }
  if (e.ctrlKey && e.key === 'n') { e.preventDefault(); document.getElementById('newFile').click(); }
  if (e.ctrlKey && e.key === 's') { e.preventDefault(); document.getElementById('saveFile').click(); }
  if (e.ctrlKey && e.key === 'o') { e.preventDefault(); document.getElementById('openFile').click(); }
  
  // Tool shortcuts (without Ctrl) - but only if not editing layer names AND text modal is closed
  const isTextModalOpen = !textModal.classList.contains('hidden');
  
  if (!e.ctrlKey && !e.altKey && !e.shiftKey && !isEditingLayerName && !isTextModalOpen) {
    if (e.key === 'b' || e.key === 'B') { e.preventDefault(); setTool("draw"); }
    if (e.key === 'e' || e.key === 'E') { e.preventDefault(); setTool("eraser"); }
    if (e.key === 'g' || e.key === 'G') { e.preventDefault(); setTool("fill"); }
    if (e.key === 'l' || e.key === 'L') { e.preventDefault(); setTool("line"); }
    if (e.key === 'r' || e.key === 'R') { e.preventDefault(); setTool("rect"); }
    if (e.key === 'c' || e.key === 'C') { e.preventDefault(); setTool("circle"); }
    if (e.key === 'i' || e.key === 'I') { e.preventDefault(); setTool("eyedropper"); }
    if (e.key === 'v' || e.key === 'V') { e.preventDefault(); setTool("move"); }
    if (e.key === 't' || e.key === 'T') { e.preventDefault(); setTool("text"); }
    if (e.key === 'q' || e.key === 'Q') { e.preventDefault(); setTool("transform"); }
  }
});
} catch (error) {
  console.error('🚨 CRITICAL ERROR IN SCRIPT.JS:', error);
  console.error('🚨 ERROR STACK:', error.stack);
  
  // Show error to user
  document.title = 'PixelPro - SCRIPT ERROR';
  document.body.style.border = '10px solid red';
  document.body.style.backgroundColor = '#ffeeee';
  
  // Create error display
  const errorDiv = document.createElement('div');
  errorDiv.innerHTML = `
    <div style="
      position: fixed; top: 20px; left: 20px; right: 20px; 
      background: red; color: white; padding: 20px; 
      font-family: Arial; z-index: 99999; border-radius: 8px;
    ">
      <h2>JavaScript Error in PixelPro</h2>
      <p><strong>Error:</strong> ${error.message}</p>
      <p><strong>Line:</strong> Check browser console for details</p>
      <button onclick="this.parentElement.remove()" style="
        background: white; color: red; padding: 8px 16px; 
        border: none; margin-top: 10px; cursor: pointer;
      ">Close</button>
    </div>
  `;
  document.body.appendChild(errorDiv);
}
