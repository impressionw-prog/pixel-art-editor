// PixelPro - Simplified Working Version
console.log('🚀 PixelPro - Starting Simple Version');

// ========================================
// SIMPLE START SCREEN HANDLERS
// ========================================

// Simple handler functions for start screen buttons
function handleNewFile() {
  console.log('📄 New File button clicked!');
  try {
    const modal = document.getElementById('canvasSettingsModal');
    if (modal) {
      modal.classList.remove('hidden');
      console.log('✅ Canvas settings modal opened');
    } else {
      console.error('❌ Canvas settings modal not found');
      alert('Canvas settings modal not found. Please refresh the page.');
    }
  } catch (error) {
    console.error('❌ Error opening canvas settings:', error);
    alert('Error opening canvas settings. Please try again.');
  }
}

function handleOpenFile() {
  console.log('📂 Open File button clicked!');
  try {
    const fileInput = document.getElementById('openFileInput');
    if (fileInput) {
      fileInput.click();
      console.log('✅ File dialog opened');
    } else {
      console.error('❌ File input not found');
      alert('File input not found. Please refresh the page.');
    }
  } catch (error) {
    console.error('❌ Error opening file dialog:', error);
    alert('Error opening file dialog. Please try again.');
  }
}

function handleDemo() {
  console.log('🎮 Demo button clicked!');
  try {
    // Hide start screen
    const startScreen = document.getElementById('startScreen');
    const workPanel = document.getElementById('workPanel');
    if (startScreen) startScreen.classList.add('hidden');
    if (workPanel) workPanel.classList.remove('hidden');
    document.body.classList.remove('start-screen-active');
    
    // Create demo project
    gridSize = 8;
    createNewProject();
    
    // Create a simple demo pattern
    setTimeout(() => {
      const pixels = document.querySelectorAll('.pixel');
      const demoPattern = [
        1,1,1,1,1,1,1,1,
        1,0,0,1,1,0,0,1,
        1,0,0,1,1,0,0,1,
        1,1,1,0,0,1,1,1,
        1,1,0,0,0,0,1,1,
        1,1,0,1,1,0,1,1,
        1,1,1,0,0,1,1,1,
        1,1,1,1,1,1,1,1
      ];
      
      demoPattern.forEach((color, index) => {
        if (pixels[index]) {
          pixels[index].style.backgroundColor = color ? '#ff6b6b' : 'transparent';
        }
      });
    }, 100);
    
    console.log('✅ Demo project created');
  } catch (error) {
    console.error('❌ Error creating demo:', error);
    alert('Error creating demo. Please try again.');
  }
}

function handleTutorial() {
  console.log('🎓 Tutorial button clicked!');
  try {
    // Hide start screen
    const startScreen = document.getElementById('startScreen');
    const workPanel = document.getElementById('workPanel');
    if (startScreen) startScreen.classList.add('hidden');
    if (workPanel) workPanel.classList.remove('hidden');
    document.body.classList.remove('start-screen-active');
    
    // Create tutorial project
    gridSize = 16;
    createNewProject();
    
    // Show tutorial message
    setTimeout(() => {
      alert('🎓 Tutorial Mode\n\n1. Click pixels to draw\n2. Use B for brush, E for eraser, G for fill\n3. Change colors with the color picker\n4. Use the animation panel at the bottom to create animations\n\nHave fun creating!');
    }, 500);
    
    console.log('✅ Tutorial project created');
  } catch (error) {
    console.error('❌ Error creating tutorial:', error);
    alert('Error creating tutorial. Please try again.');
  }
}

function handleClearRecent() {
  console.log('🗑️ Clear Recent button clicked!');
  try {
    if (confirm('Clear all recent files? This cannot be undone.')) {
      clearRecentFiles();
      console.log('✅ Recent files cleared');
    }
  } catch (error) {
    console.error('❌ Error clearing recent files:', error);
    alert('Error clearing recent files. Please try again.');
  }
}

// ========================================
// CORE VARIABLES
// ========================================

const TRANSPARENT = null;
let gridSize = 16;
let currentTool = "draw";
let currentColor = "#000000";
let isMouseDown = false;
let lastPixel = null;
let isDrawing = false;
let startPixel = null;
let endPixel = null;

// Tool states
let toolState = {
  brushSize: 1,
  lineWidth: 1,
  fillMode: 'flood',
  textContent: '',
  textSize: 12,
  textColor: '#000000',
  selection: null,
  transformMode: 'scale'
};

// Core elements
const canvas = document.getElementById('grid');
const colorPicker = document.getElementById('colorPicker');
const startScreen = document.getElementById('startScreen');
const workPanel = document.getElementById('workPanel');

// ========================================
// BASIC FUNCTIONS
// ========================================

function createNewProject() {
  console.log('🆕 Creating new project...');
  setupCanvas();
  console.log('✅ New project created');
}

function setupCanvas() {
  if (!canvas) {
    console.error('❌ Canvas element not found');
    return;
  }
  
  canvas.innerHTML = '';
  canvas.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  
  for (let i = 0; i < gridSize * gridSize; i++) {
    const pixel = document.createElement('div');
    pixel.className = 'pixel';
    pixel.style.backgroundColor = 'transparent';
    pixel.dataset.index = i;
    
    // Mouse event handlers
    pixel.addEventListener('mousedown', (e) => handlePixelMouseDown(e, pixel));
    pixel.addEventListener('mouseenter', (e) => handlePixelMouseEnter(e, pixel));
    pixel.addEventListener('mouseup', (e) => handlePixelMouseUp(e, pixel));
    
    canvas.appendChild(pixel);
  }
  
  // Global mouse events
  document.addEventListener('mouseup', handleGlobalMouseUp);
  
  console.log(`✅ Canvas setup complete: ${gridSize}x${gridSize}`);
}

// ========================================
// TOOL FUNCTIONALITY
// ========================================

function handlePixelMouseDown(e, pixel) {
  e.preventDefault();
  isMouseDown = true;
  isDrawing = true;
  startPixel = pixel;
  lastPixel = pixel;
  
  console.log(`🎨 Tool: ${currentTool} - Mouse down on pixel ${pixel.dataset.index}`);
  
  switch (currentTool) {
    case 'draw':
    case 'brush':
      drawPixel(pixel);
      break;
    case 'eraser':
      erasePixel(pixel);
      break;
    case 'fill':
      fillArea(pixel);
      break;
    case 'eyedropper':
      pickColor(pixel);
      break;
    case 'line':
      startLine(pixel);
      break;
    case 'rect':
      startRectangle(pixel);
      break;
    case 'circle':
      startCircle(pixel);
      break;
    case 'text':
      addText(pixel);
      break;
    case 'selection':
      startSelection(pixel);
      break;
    case 'move':
      startMove(pixel);
      break;
    default:
      drawPixel(pixel);
  }
}

function handlePixelMouseEnter(e, pixel) {
  if (!isMouseDown) return;
  
  if (lastPixel === pixel) return;
  lastPixel = pixel;
  
  switch (currentTool) {
    case 'draw':
    case 'brush':
      drawPixel(pixel);
      break;
    case 'eraser':
      erasePixel(pixel);
      break;
    case 'line':
      previewLine(pixel);
      break;
    case 'rect':
      previewRectangle(pixel);
      break;
    case 'circle':
      previewCircle(pixel);
      break;
  }
}

function handlePixelMouseUp(e, pixel) {
  if (!isMouseDown) return;
  
  endPixel = pixel;
  isMouseDown = false;
  isDrawing = false;
  
  switch (currentTool) {
    case 'line':
      finishLine(pixel);
      break;
    case 'rect':
      finishRectangle(pixel);
      break;
    case 'circle':
      finishCircle(pixel);
      break;
    case 'selection':
      finishSelection(pixel);
      break;
  }
  
  startPixel = null;
  endPixel = null;
}

function handleGlobalMouseUp() {
  isMouseDown = false;
  isDrawing = false;
}

// ========================================
// DRAWING TOOLS
// ========================================

function drawPixel(pixel) {
  pixel.style.backgroundColor = currentColor;
  console.log(`✅ Drew pixel ${pixel.dataset.index} with color ${currentColor}`);
}

function erasePixel(pixel) {
  pixel.style.backgroundColor = 'transparent';
  console.log(`✅ Erased pixel ${pixel.dataset.index}`);
}

function fillArea(pixel) {
  const targetColor = pixel.style.backgroundColor;
  const fillColor = currentColor;
  
  if (targetColor === fillColor) return;
  
  const pixels = document.querySelectorAll('.pixel');
  const visited = new Set();
  const queue = [parseInt(pixel.dataset.index)];
  
  while (queue.length > 0) {
    const index = queue.shift();
    if (visited.has(index)) continue;
    visited.add(index);
    
    const currentPixel = pixels[index];
    if (currentPixel.style.backgroundColor !== targetColor) continue;
    
    currentPixel.style.backgroundColor = fillColor;
    
    // Add neighbors
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    
    if (row > 0) queue.push(index - gridSize);
    if (row < gridSize - 1) queue.push(index + gridSize);
    if (col > 0) queue.push(index - 1);
    if (col < gridSize - 1) queue.push(index + 1);
  }
  
  console.log(`✅ Filled area with color ${fillColor}`);
}

function pickColor(pixel) {
  const color = pixel.style.backgroundColor;
  if (color && color !== 'transparent') {
    currentColor = color;
    if (colorPicker) colorPicker.value = color;
    console.log(`✅ Picked color: ${color}`);
  }
}

// ========================================
// SHAPE TOOLS
// ========================================

function startLine(pixel) {
  startPixel = pixel;
  console.log(`📏 Started line at pixel ${pixel.dataset.index}`);
}

function previewLine(pixel) {
  if (!startPixel) return;
  
  // Clear previous preview
  clearPreview();
  
  // Draw line preview
  const line = getLinePixels(startPixel, pixel);
  line.forEach(index => {
    const previewPixel = document.querySelector(`[data-index="${index}"]`);
    if (previewPixel) {
      previewPixel.style.opacity = '0.5';
      previewPixel.style.backgroundColor = currentColor;
    }
  });
}

function finishLine(pixel) {
  if (!startPixel) return;
  
  clearPreview();
  const line = getLinePixels(startPixel, pixel);
  line.forEach(index => {
    const linePixel = document.querySelector(`[data-index="${index}"]`);
    if (linePixel) {
      linePixel.style.backgroundColor = currentColor;
    }
  });
  
  console.log(`✅ Drew line from ${startPixel.dataset.index} to ${pixel.dataset.index}`);
}

function getLinePixels(start, end) {
  const startIndex = parseInt(start.dataset.index);
  const endIndex = parseInt(end.dataset.index);
  const startRow = Math.floor(startIndex / gridSize);
  const startCol = startIndex % gridSize;
  const endRow = Math.floor(endIndex / gridSize);
  const endCol = endIndex % gridSize;
  
  const pixels = [];
  const dx = Math.abs(endCol - startCol);
  const dy = Math.abs(endRow - startRow);
  const sx = startCol < endCol ? 1 : -1;
  const sy = startRow < endRow ? 1 : -1;
  let err = dx - dy;
  
  let x = startCol;
  let y = startRow;
  
  while (true) {
    pixels.push(y * gridSize + x);
    if (x === endCol && y === endRow) break;
    const e2 = 2 * err;
    if (e2 > -dy) {
      err -= dy;
      x += sx;
    }
    if (e2 < dx) {
      err += dx;
      y += sy;
    }
  }
  
  return pixels;
}

function startRectangle(pixel) {
  startPixel = pixel;
  console.log(`📦 Started rectangle at pixel ${pixel.dataset.index}`);
}

function previewRectangle(pixel) {
  if (!startPixel) return;
  
  clearPreview();
  const rect = getRectanglePixels(startPixel, pixel);
  rect.forEach(index => {
    const previewPixel = document.querySelector(`[data-index="${index}"]`);
    if (previewPixel) {
      previewPixel.style.opacity = '0.5';
      previewPixel.style.backgroundColor = currentColor;
    }
  });
}

function finishRectangle(pixel) {
  if (!startPixel) return;
  
  clearPreview();
  const rect = getRectanglePixels(startPixel, pixel);
  rect.forEach(index => {
    const rectPixel = document.querySelector(`[data-index="${index}"]`);
    if (rectPixel) {
      rectPixel.style.backgroundColor = currentColor;
    }
  });
  
  console.log(`✅ Drew rectangle from ${startPixel.dataset.index} to ${pixel.dataset.index}`);
}

function getRectanglePixels(start, end) {
  const startIndex = parseInt(start.dataset.index);
  const endIndex = parseInt(end.dataset.index);
  const startRow = Math.floor(startIndex / gridSize);
  const startCol = startIndex % gridSize;
  const endRow = Math.floor(endIndex / gridSize);
  const endCol = endIndex % gridSize;
  
  const minRow = Math.min(startRow, endRow);
  const maxRow = Math.max(startRow, endRow);
  const minCol = Math.min(startCol, endCol);
  const maxCol = Math.max(startCol, endCol);
  
  const pixels = [];
  for (let row = minRow; row <= maxRow; row++) {
    for (let col = minCol; col <= maxCol; col++) {
      pixels.push(row * gridSize + col);
    }
  }
  
  return pixels;
}

function startCircle(pixel) {
  startPixel = pixel;
  console.log(`⭕ Started circle at pixel ${pixel.dataset.index}`);
}

function previewCircle(pixel) {
  if (!startPixel) return;
  
  clearPreview();
  const circle = getCirclePixels(startPixel, pixel);
  circle.forEach(index => {
    const previewPixel = document.querySelector(`[data-index="${index}"]`);
    if (previewPixel) {
      previewPixel.style.opacity = '0.5';
      previewPixel.style.backgroundColor = currentColor;
    }
  });
}

function finishCircle(pixel) {
  if (!startPixel) return;
  
  clearPreview();
  const circle = getCirclePixels(startPixel, pixel);
  circle.forEach(index => {
    const circlePixel = document.querySelector(`[data-index="${index}"]`);
    if (circlePixel) {
      circlePixel.style.backgroundColor = currentColor;
    }
  });
  
  console.log(`✅ Drew circle from ${startPixel.dataset.index} to ${pixel.dataset.index}`);
}

function getCirclePixels(start, end) {
  const startIndex = parseInt(start.dataset.index);
  const endIndex = parseInt(end.dataset.index);
  const startRow = Math.floor(startIndex / gridSize);
  const startCol = startIndex % gridSize;
  const endRow = Math.floor(endIndex / gridSize);
  const endCol = endIndex % gridSize;
  
  const centerRow = Math.floor((startRow + endRow) / 2);
  const centerCol = Math.floor((startCol + endCol) / 2);
  const radius = Math.max(Math.abs(endRow - startRow), Math.abs(endCol - startCol)) / 2;
  
  const pixels = [];
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const distance = Math.sqrt((row - centerRow) ** 2 + (col - centerCol) ** 2);
      if (distance <= radius) {
        pixels.push(row * gridSize + col);
      }
    }
  }
  
  return pixels;
}

// ========================================
// UTILITY FUNCTIONS
// ========================================

function clearPreview() {
  const pixels = document.querySelectorAll('.pixel');
  pixels.forEach(pixel => {
    pixel.style.opacity = '1';
  });
}

function addText(pixel) {
  const text = prompt('Enter text:');
  if (text) {
    pixel.textContent = text;
    pixel.style.color = currentColor;
    pixel.style.fontSize = `${toolState.textSize}px`;
    console.log(`✅ Added text: "${text}"`);
  }
}

function startSelection(pixel) {
  startPixel = pixel;
  console.log(`🔲 Started selection at pixel ${pixel.dataset.index}`);
}

function finishSelection(pixel) {
  if (!startPixel) return;
  
  const selection = getRectanglePixels(startPixel, pixel);
  toolState.selection = selection;
  
  // Highlight selection
  selection.forEach(index => {
    const selectPixel = document.querySelector(`[data-index="${index}"]`);
    if (selectPixel) {
      selectPixel.style.border = '1px solid #00ff00';
    }
  });
  
  console.log(`✅ Selection created with ${selection.length} pixels`);
}

function startMove(pixel) {
  if (toolState.selection) {
    console.log(`🚚 Started moving selection`);
  } else {
    console.log(`🚚 No selection to move`);
  }
}

function clearRecentFiles() {
  try {
    localStorage.removeItem('pixelpro_recent_files');
    console.log('✅ Recent files cleared from localStorage');
  } catch (error) {
    console.error('❌ Error clearing recent files:', error);
  }
}

// ========================================
// INITIALIZATION
// ========================================

function init() {
  console.log('🎨 Initializing PixelPro...');
  
  // Show start screen by default
  if (startScreen) startScreen.classList.remove('hidden');
  if (workPanel) workPanel.classList.add('hidden');
  document.body.classList.add('start-screen-active');
  
  console.log('✅ PixelPro initialized successfully');
}

// ========================================
// CANVAS SETTINGS MODAL HANDLERS
// ========================================

function setupCanvasSettingsModal() {
  console.log('🎨 Setting up canvas settings modal...');
  
  // Create Project button
  const createCanvasBtn = document.getElementById('createCanvas');
  if (createCanvasBtn) {
    createCanvasBtn.addEventListener('click', () => {
      console.log('🎨 Create Project button clicked!');
      try {
        // Get canvas size from inputs
        const widthInput = document.getElementById('canvasWidth');
        const heightInput = document.getElementById('canvasHeight');
        
        if (widthInput && heightInput) {
          gridSize = parseInt(widthInput.value) || 16;
          console.log(`✅ Creating project with size: ${gridSize}x${gridSize}`);
          
          // Hide modal
          const modal = document.getElementById('canvasSettingsModal');
          if (modal) modal.classList.add('hidden');
          
          // Hide start screen and show work panel
          const startScreen = document.getElementById('startScreen');
          const workPanel = document.getElementById('workPanel');
          if (startScreen) startScreen.classList.add('hidden');
          if (workPanel) workPanel.classList.remove('hidden');
          document.body.classList.remove('start-screen-active');
          
          // Create the project
          createNewProject();
          
          console.log('✅ Project created successfully!');
        } else {
          console.error('❌ Canvas size inputs not found');
          alert('Canvas size inputs not found. Please refresh the page.');
        }
      } catch (error) {
        console.error('❌ Error creating project:', error);
        alert('Error creating project. Please try again.');
      }
    });
    console.log('✅ Create Project button handler added');
  } else {
    console.error('❌ Create Project button not found');
  }
  
  // Cancel button
  const cancelBtn = document.getElementById('cancelCanvasSettings');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      console.log('❌ Cancel button clicked!');
      const modal = document.getElementById('canvasSettingsModal');
      if (modal) modal.classList.add('hidden');
    });
    console.log('✅ Cancel button handler added');
  } else {
    console.error('❌ Cancel button not found');
  }
  
  // Canvas preset buttons
  const presetButtons = document.querySelectorAll('.canvas-preset-btn');
  console.log(`📏 Found ${presetButtons.length} canvas preset buttons`);
  
  if (presetButtons.length === 0) {
    console.error('❌ No canvas preset buttons found!');
    // Try alternative selector
    const altButtons = document.querySelectorAll('[data-size]');
    console.log(`📏 Found ${altButtons.length} buttons with data-size attribute`);
  }
  
  presetButtons.forEach((btn, index) => {
    console.log(`📏 Setting up preset button ${index + 1}:`, btn.dataset.size, btn.textContent);
    
    // Add both click and mousedown events for better responsiveness
    const handlePresetClick = (e) => {
      e.preventDefault();
      e.stopPropagation();
      console.log('📏 Canvas preset clicked:', btn.dataset.size);
      const size = parseInt(btn.dataset.size);
      if (size) {
        const widthInput = document.getElementById('canvasWidth');
        const heightInput = document.getElementById('canvasHeight');
        if (widthInput && heightInput) {
          widthInput.value = size;
          heightInput.value = size;
          console.log(`✅ Canvas size set to ${size}x${size}`);
          
          // Update visual feedback - remove active from all, add to clicked
          presetButtons.forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
          
          // Update preview text
          const preview = document.getElementById('canvasPreview');
          if (preview) {
            preview.textContent = `${size}×${size} pixels (${size * size} total)`;
          }
          
          // Add visual feedback
          btn.style.transform = 'scale(0.95)';
          setTimeout(() => {
            btn.style.transform = 'scale(1)';
          }, 150);
        } else {
          console.error('❌ Canvas size inputs not found');
        }
      } else {
        console.error('❌ Invalid size from preset button:', btn.dataset.size);
      }
    };
    
    btn.addEventListener('click', handlePresetClick);
    btn.addEventListener('mousedown', handlePresetClick);
    
    // Make sure button is clickable
    btn.style.cursor = 'pointer';
    btn.style.userSelect = 'none';
    
    console.log(`✅ Preset button ${index + 1} handler added`);
  });
  
  console.log('✅ Canvas settings modal setup complete');
}

// ========================================
// INITIALIZATION
// ========================================

function init() {
  console.log('🎨 Initializing PixelPro...');
  
  // Show start screen by default
  if (startScreen) startScreen.classList.remove('hidden');
  if (workPanel) workPanel.classList.add('hidden');
  document.body.classList.add('start-screen-active');
  
  // Setup canvas settings modal
  setupCanvasSettingsModal();
  
  // Setup tool switching
  setupToolSwitching();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  console.log('✅ PixelPro initialized successfully');
}

// ========================================
// TOOL SWITCHING
// ========================================

function setupToolSwitching() {
  console.log('🔧 Setting up tool switching...');
  
  const toolButtons = document.querySelectorAll('.toolbar-btn');
  toolButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      const toolId = btn.id.replace('tool', '').toLowerCase();
      switchTool(toolId);
    });
  });
  
  console.log('✅ Tool switching setup complete');
}

function switchTool(toolName) {
  // Remove active class from all tools
  const toolButtons = document.querySelectorAll('.toolbar-btn');
  toolButtons.forEach(btn => btn.classList.remove('active'));
  
  // Add active class to selected tool
  const activeButton = document.getElementById(`tool${toolName.charAt(0).toUpperCase() + toolName.slice(1)}`);
  if (activeButton) {
    activeButton.classList.add('active');
  }
  
  // Update current tool
  currentTool = toolName;
  
  console.log(`🎨 Switched to tool: ${toolName}`);
  
  // Update cursor based on tool
  updateCursor(toolName);
}

function updateCursor(toolName) {
  const cursorMap = {
    'draw': 'crosshair',
    'brush': 'crosshair',
    'eraser': 'crosshair',
    'fill': 'crosshair',
    'eyedropper': 'crosshair',
    'line': 'crosshair',
    'rect': 'crosshair',
    'circle': 'crosshair',
    'text': 'text',
    'selection': 'crosshair',
    'move': 'move',
    'transform': 'move',
    'ai': 'pointer',
    'dither': 'crosshair',
    'outline': 'crosshair',
    'shade': 'crosshair',
    'mirror': 'crosshair',
    'gradient': 'crosshair',
    'pattern': 'crosshair',
    'symmetry': 'crosshair',
    'magicwand': 'crosshair',
    'lasso': 'crosshair'
  };
  
  if (canvas) {
    canvas.style.cursor = cursorMap[toolName] || 'default';
  }
}

// ========================================
// KEYBOARD SHORTCUTS
// ========================================

function setupKeyboardShortcuts() {
  console.log('⌨️ Setting up keyboard shortcuts...');
  
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
    
    const key = e.key.toLowerCase();
    
    switch (key) {
      case 'b':
        switchTool('brush');
        break;
      case 'e':
        switchTool('eraser');
        break;
      case 'g':
        switchTool('fill');
        break;
      case 'i':
        switchTool('eyedropper');
        break;
      case 'l':
        switchTool('line');
        break;
      case 'r':
        switchTool('rect');
        break;
      case 'c':
        switchTool('circle');
        break;
      case 't':
        switchTool('text');
        break;
      case 'v':
        switchTool('selection');
        break;
      case 'm':
        switchTool('move');
        break;
      case 'q':
        switchTool('transform');
        break;
      case 'a':
        switchTool('ai');
        break;
      case 'd':
        switchTool('dither');
        break;
      case 'o':
        switchTool('outline');
        break;
      case 's':
        switchTool('shade');
        break;
      case 'y':
        switchTool('symmetry');
        break;
      case 'w':
        switchTool('magicwand');
        break;
      case 'z':
        if (e.ctrlKey) {
          e.preventDefault();
          console.log('↶ Undo');
          // TODO: Implement undo
        }
        break;
      case 'y':
        if (e.ctrlKey) {
          e.preventDefault();
          console.log('↷ Redo');
          // TODO: Implement redo
        }
        break;
      case 'delete':
      case 'backspace':
        if (toolState.selection) {
          clearSelection();
        }
        break;
    }
  });
  
  console.log('✅ Keyboard shortcuts setup complete');
}

function clearSelection() {
  if (!toolState.selection) return;
  
  toolState.selection.forEach(index => {
    const pixel = document.querySelector(`[data-index="${index}"]`);
    if (pixel) {
      pixel.style.backgroundColor = 'transparent';
      pixel.style.border = 'none';
    }
  });
  
  toolState.selection = null;
  console.log('✅ Selection cleared');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
} 