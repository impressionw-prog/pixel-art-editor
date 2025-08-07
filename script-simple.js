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
    pixel.className = 'pixel transparent';
    pixel.style.backgroundColor = 'transparent';
    pixel.style.setProperty('--pixel-color', 'transparent');
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
  if (currentColor === 'transparent' || currentColor === null) {
    pixel.style.backgroundColor = 'transparent';
    pixel.classList.add('transparent');
    pixel.style.setProperty('--pixel-color', 'transparent');
  } else {
    pixel.style.backgroundColor = currentColor;
    pixel.classList.remove('transparent');
    pixel.style.setProperty('--pixel-color', currentColor);
  }
  console.log(`✅ Drew pixel ${pixel.dataset.index} with color ${currentColor}`);
}

function erasePixel(pixel) {
  pixel.style.backgroundColor = 'transparent';
  pixel.classList.add('transparent');
  pixel.style.setProperty('--pixel-color', 'transparent');
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
    
    if (fillColor === 'transparent' || fillColor === null) {
      currentPixel.style.backgroundColor = 'transparent';
      currentPixel.classList.add('transparent');
      currentPixel.style.setProperty('--pixel-color', 'transparent');
    } else {
      currentPixel.style.backgroundColor = fillColor;
      currentPixel.classList.remove('transparent');
      currentPixel.style.setProperty('--pixel-color', fillColor);
    }
    
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
      if (currentColor === 'transparent' || currentColor === null) {
        linePixel.style.backgroundColor = 'transparent';
        linePixel.classList.add('transparent');
        linePixel.style.setProperty('--pixel-color', 'transparent');
      } else {
        linePixel.style.backgroundColor = currentColor;
        linePixel.classList.remove('transparent');
        linePixel.style.setProperty('--pixel-color', currentColor);
      }
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
      if (currentColor === 'transparent' || currentColor === null) {
        rectPixel.style.backgroundColor = 'transparent';
        rectPixel.classList.add('transparent');
        rectPixel.style.setProperty('--pixel-color', 'transparent');
      } else {
        rectPixel.style.backgroundColor = currentColor;
        rectPixel.classList.remove('transparent');
        rectPixel.style.setProperty('--pixel-color', currentColor);
      }
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
      if (currentColor === 'transparent' || currentColor === null) {
        circlePixel.style.backgroundColor = 'transparent';
        circlePixel.classList.add('transparent');
        circlePixel.style.setProperty('--pixel-color', 'transparent');
      } else {
        circlePixel.style.backgroundColor = currentColor;
        circlePixel.classList.remove('transparent');
        circlePixel.style.setProperty('--pixel-color', currentColor);
      }
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
  
  // Setup menu functionality
  setupMenuBar();
  
  // Setup color picker
  setupColorPicker();
  
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

// ========================================
// MENU BAR FUNCTIONALITY
// ========================================

function setupMenuBar() {
  console.log('🍽️ Setting up menu bar...');
  
  // Setup dropdown menus
  setupDropdownMenus();
  
  // Setup menu item handlers
  setupMenuItemHandlers();
  
  console.log('✅ Menu bar setup complete');
}

function setupDropdownMenus() {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.menubar-btn');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    if (button && menu) {
      // Show menu on click
      button.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        
        // Close other dropdowns
        dropdowns.forEach(d => {
          if (d !== dropdown) {
            d.classList.remove('open');
          }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('open');
      });
      
      // Close menu when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
    }
  });
}

function setupMenuItemHandlers() {
  // File Menu
  setupFileMenu();
  
  // Edit Menu
  setupEditMenu();
  
  // Image Menu
  setupImageMenu();
  
  // Layer Menu
  setupLayerMenu();
  
  // Animation Menu
  setupAnimationMenu();
  
  // View Menu
  setupViewMenu();
  
  // Help Menu
  setupHelpMenu();
}

function setupFileMenu() {
  // Start Screen
  const showStartScreen = document.getElementById('showStartScreen');
  if (showStartScreen) {
    showStartScreen.addEventListener('click', () => {
      console.log('🏠 Show Start Screen clicked');
      if (startScreen) startScreen.classList.remove('hidden');
      if (workPanel) workPanel.classList.add('hidden');
      document.body.classList.add('start-screen-active');
    });
  }
  
  // New File
  const newFile = document.getElementById('newFile');
  if (newFile) {
    newFile.addEventListener('click', () => {
      console.log('📄 New File clicked');
      handleNewFile();
    });
  }
  
  // Open File
  const openFile = document.getElementById('openFile');
  if (openFile) {
    openFile.addEventListener('click', () => {
      console.log('📂 Open File clicked');
      handleOpenFile();
    });
  }
  
  // Save File
  const saveFile = document.getElementById('saveFile');
  if (saveFile) {
    saveFile.addEventListener('click', () => {
      console.log('💾 Save File clicked');
      saveProject();
    });
  }
  
  // Save As File
  const saveAsFile = document.getElementById('saveAsFile');
  if (saveAsFile) {
    saveAsFile.addEventListener('click', () => {
      console.log('💾 Save As clicked');
      saveProjectAs();
    });
  }
  
  // Export PNG
  const exportBtnMenu = document.getElementById('exportBtnMenu');
  if (exportBtnMenu) {
    exportBtnMenu.addEventListener('click', () => {
      console.log('📤 Export PNG clicked');
      exportAsPNG();
    });
  }
  
  // Export GIF
  const exportGifMenu = document.getElementById('exportGifMenu');
  if (exportGifMenu) {
    exportGifMenu.addEventListener('click', () => {
      console.log('📤 Export GIF clicked');
      exportAsGIF();
    });
  }
  
  // Export Sprite Sheet
  const exportSpriteSheetMenu = document.getElementById('exportSpriteSheetMenu');
  if (exportSpriteSheetMenu) {
    exportSpriteSheetMenu.addEventListener('click', () => {
      console.log('📤 Export Sprite Sheet clicked');
      exportAsSpriteSheet();
    });
  }
  
  // Print
  const printMenu = document.getElementById('printMenu');
  if (printMenu) {
    printMenu.addEventListener('click', () => {
      console.log('🖨️ Print clicked');
      printCanvas();
    });
  }
  
  // Exit
  const exitApp = document.getElementById('exitApp');
  if (exitApp) {
    exitApp.addEventListener('click', () => {
      console.log('🚪 Exit clicked');
      if (confirm('Are you sure you want to exit?')) {
        window.close();
      }
    });
  }
}

function setupEditMenu() {
  // Undo
  const undoBtnMenu = document.getElementById('undoBtnMenu');
  if (undoBtnMenu) {
    undoBtnMenu.addEventListener('click', () => {
      console.log('↶ Undo clicked');
      undo();
    });
  }
  
  // Redo
  const redoBtnMenu = document.getElementById('redoBtnMenu');
  if (redoBtnMenu) {
    redoBtnMenu.addEventListener('click', () => {
      console.log('↷ Redo clicked');
      redo();
    });
  }
  
  // Cut
  const cutMenu = document.getElementById('cutMenu');
  if (cutMenu) {
    cutMenu.addEventListener('click', () => {
      console.log('✂️ Cut clicked');
      cutSelection();
    });
  }
  
  // Copy
  const copyMenu = document.getElementById('copyMenu');
  if (copyMenu) {
    copyMenu.addEventListener('click', () => {
      console.log('📋 Copy clicked');
      copySelection();
    });
  }
  
  // Paste
  const pasteMenu = document.getElementById('pasteMenu');
  if (pasteMenu) {
    pasteMenu.addEventListener('click', () => {
      console.log('📋 Paste clicked');
      pasteSelection();
    });
  }
  
  // Select All
  const selectAllMenu = document.getElementById('selectAllMenu');
  if (selectAllMenu) {
    selectAllMenu.addEventListener('click', () => {
      console.log('🔲 Select All clicked');
      selectAll();
    });
  }
  
  // Clear Selection
  const clearSelectionMenu = document.getElementById('clearSelectionMenu');
  if (clearSelectionMenu) {
    clearSelectionMenu.addEventListener('click', () => {
      console.log('❌ Clear Selection clicked');
      clearSelection();
    });
  }
  
  // Clear Canvas
  const clearBtnMenu = document.getElementById('clearBtnMenu');
  if (clearBtnMenu) {
    clearBtnMenu.addEventListener('click', () => {
      console.log('🗑️ Clear Canvas clicked');
      clearCanvas();
    });
  }
  
  // Resize Grid
  const resizeGridMenu = document.getElementById('resizeGridMenu');
  if (resizeGridMenu) {
    resizeGridMenu.addEventListener('click', () => {
      console.log('📏 Resize Grid clicked');
      resizeCanvas();
    });
  }
  
  // Crop
  const cropMenu = document.getElementById('cropMenu');
  if (cropMenu) {
    cropMenu.addEventListener('click', () => {
      console.log('✂️ Crop clicked');
      cropToSelection();
    });
  }
}

function setupImageMenu() {
  // Flip Horizontal
  const flipHorizontalMenu = document.getElementById('flipHorizontalMenu');
  if (flipHorizontalMenu) {
    flipHorizontalMenu.addEventListener('click', () => {
      console.log('🔄 Flip Horizontal clicked');
      flipHorizontal();
    });
  }
  
  // Flip Vertical
  const flipVerticalMenu = document.getElementById('flipVerticalMenu');
  if (flipVerticalMenu) {
    flipVerticalMenu.addEventListener('click', () => {
      console.log('🔄 Flip Vertical clicked');
      flipVertical();
    });
  }
  
  // Rotate 90° Clockwise
  const rotate90Menu = document.getElementById('rotate90Menu');
  if (rotate90Menu) {
    rotate90Menu.addEventListener('click', () => {
      console.log('🔄 Rotate 90° Clockwise clicked');
      rotate90();
    });
  }
  
  // Rotate 180°
  const rotate180Menu = document.getElementById('rotate180Menu');
  if (rotate180Menu) {
    rotate180Menu.addEventListener('click', () => {
      console.log('🔄 Rotate 180° clicked');
      rotate180();
    });
  }
  
  // Rotate 90° Counter-clockwise
  const rotate270Menu = document.getElementById('rotate270Menu');
  if (rotate270Menu) {
    rotate270Menu.addEventListener('click', () => {
      console.log('🔄 Rotate 90° Counter-clockwise clicked');
      rotate270();
    });
  }
  
  // Invert Colors
  const invertColorsMenu = document.getElementById('invertColorsMenu');
  if (invertColorsMenu) {
    invertColorsMenu.addEventListener('click', () => {
      console.log('🎨 Invert Colors clicked');
      invertColors();
    });
  }
  
  // Adjust Brightness
  const adjustBrightnessMenu = document.getElementById('adjustBrightnessMenu');
  if (adjustBrightnessMenu) {
    adjustBrightnessMenu.addEventListener('click', () => {
      console.log('💡 Adjust Brightness clicked');
      adjustBrightness();
    });
  }
  
  // Adjust Contrast
  const adjustContrastMenu = document.getElementById('adjustContrastMenu');
  if (adjustContrastMenu) {
    adjustContrastMenu.addEventListener('click', () => {
      console.log('🌓 Adjust Contrast clicked');
      adjustContrast();
    });
  }
}

function setupLayerMenu() {
  // New Layer
  const newLayerMenu = document.getElementById('newLayerMenu');
  if (newLayerMenu) {
    newLayerMenu.addEventListener('click', () => {
      console.log('📄 New Layer clicked');
      newLayer();
    });
  }
  
  // Duplicate Layer
  const duplicateLayerMenu = document.getElementById('duplicateLayerMenu');
  if (duplicateLayerMenu) {
    duplicateLayerMenu.addEventListener('click', () => {
      console.log('📋 Duplicate Layer clicked');
      duplicateLayer();
    });
  }
  
  // Delete Layer
  const deleteLayerMenu = document.getElementById('deleteLayerMenu');
  if (deleteLayerMenu) {
    deleteLayerMenu.addEventListener('click', () => {
      console.log('🗑️ Delete Layer clicked');
      deleteLayer();
    });
  }
  
  // Merge Down
  const mergeLayersMenu = document.getElementById('mergeLayersMenu');
  if (mergeLayersMenu) {
    mergeLayersMenu.addEventListener('click', () => {
      console.log('🔗 Merge Down clicked');
      mergeDown();
    });
  }
  
  // Merge Visible
  const mergeVisibleMenu = document.getElementById('mergeVisibleMenu');
  if (mergeVisibleMenu) {
    mergeVisibleMenu.addEventListener('click', () => {
      console.log('🔗 Merge Visible clicked');
      mergeVisible();
    });
  }
  
  // Layer Opacity
  const layerOpacityMenu = document.getElementById('layerOpacityMenu');
  if (layerOpacityMenu) {
    layerOpacityMenu.addEventListener('click', () => {
      console.log('👁️ Layer Opacity clicked');
      layerOpacity();
    });
  }
  
  // Blend Mode
  const layerBlendModeMenu = document.getElementById('layerBlendModeMenu');
  if (layerBlendModeMenu) {
    layerBlendModeMenu.addEventListener('click', () => {
      console.log('🎨 Blend Mode clicked');
      blendMode();
    });
  }
}

function setupAnimationMenu() {
  // New Frame
  const newFrameMenu = document.getElementById('newFrameMenu');
  if (newFrameMenu) {
    newFrameMenu.addEventListener('click', () => {
      console.log('📄 New Frame clicked');
      newFrame();
    });
  }
  
  // Duplicate Frame
  const duplicateFrameMenu = document.getElementById('duplicateFrameMenu');
  if (duplicateFrameMenu) {
    duplicateFrameMenu.addEventListener('click', () => {
      console.log('📋 Duplicate Frame clicked');
      duplicateFrame();
    });
  }
  
  // Delete Frame
  const deleteFrameMenu = document.getElementById('deleteFrameMenu');
  if (deleteFrameMenu) {
    deleteFrameMenu.addEventListener('click', () => {
      console.log('🗑️ Delete Frame clicked');
      deleteFrame();
    });
  }
  
  // Play Animation
  const playAnimationMenu = document.getElementById('playAnimationMenu');
  if (playAnimationMenu) {
    playAnimationMenu.addEventListener('click', () => {
      console.log('▶️ Play Animation clicked');
      playAnimation();
    });
  }
  
  // Stop Animation
  const stopAnimationMenu = document.getElementById('stopAnimationMenu');
  if (stopAnimationMenu) {
    stopAnimationMenu.addEventListener('click', () => {
      console.log('⏹️ Stop Animation clicked');
      stopAnimation();
    });
  }
  
  // Set Frame Delay
  const setFrameDelayMenu = document.getElementById('setFrameDelayMenu');
  if (setFrameDelayMenu) {
    setFrameDelayMenu.addEventListener('click', () => {
      console.log('⏱️ Set Frame Delay clicked');
      setFrameDelay();
    });
  }
  
  // Export Animation
  const exportAnimationMenu = document.getElementById('exportAnimationMenu');
  if (exportAnimationMenu) {
    exportAnimationMenu.addEventListener('click', () => {
      console.log('📤 Export Animation clicked');
      exportAnimation();
    });
  }
}

function setupViewMenu() {
  // Zoom In
  const zoomInMenu = document.getElementById('zoomInMenu');
  if (zoomInMenu) {
    zoomInMenu.addEventListener('click', () => {
      console.log('🔍 Zoom In clicked');
      zoomIn();
    });
  }
  
  // Zoom Out
  const zoomOutMenu = document.getElementById('zoomOutMenu');
  if (zoomOutMenu) {
    zoomOutMenu.addEventListener('click', () => {
      console.log('🔍 Zoom Out clicked');
      zoomOut();
    });
  }
}

function setupHelpMenu() {
  // About
  const aboutMenu = document.getElementById('aboutMenu');
  if (aboutMenu) {
    aboutMenu.addEventListener('click', () => {
      console.log('ℹ️ About clicked');
      showAbout();
    });
  }
  
  // Help
  const helpMenu = document.getElementById('helpMenu');
  if (helpMenu) {
    helpMenu.addEventListener('click', () => {
      console.log('❓ Help clicked');
      showHelp();
    });
  }
}

// ========================================
// MENU ACTION FUNCTIONS
// ========================================

// File Actions
function saveProject() {
  console.log('💾 Saving project...');
  const projectData = {
    gridSize: gridSize,
    pixels: Array.from(document.querySelectorAll('.pixel')).map(p => p.style.backgroundColor),
    timestamp: Date.now()
  };
  
  const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pixelpro-project.json';
  a.click();
  URL.revokeObjectURL(url);
  
  console.log('✅ Project saved');
}

function saveProjectAs() {
  console.log('💾 Save As...');
  const filename = prompt('Enter filename:', 'pixelpro-project');
  if (filename) {
    const projectData = {
      gridSize: gridSize,
      pixels: Array.from(document.querySelectorAll('.pixel')).map(p => p.style.backgroundColor),
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(projectData)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    console.log(`✅ Project saved as ${filename}.json`);
  }
}

function exportAsPNG() {
  console.log('📤 Exporting as PNG...');
  // Create canvas for export
  const exportCanvas = document.createElement('canvas');
  const ctx = exportCanvas.getContext('2d');
  const pixels = document.querySelectorAll('.pixel');
  
  exportCanvas.width = gridSize * 10; // Scale up for better quality
  exportCanvas.height = gridSize * 10;
  
  // Draw pixels
  pixels.forEach((pixel, index) => {
    const row = Math.floor(index / gridSize);
    const col = index % gridSize;
    const color = pixel.style.backgroundColor;
    
    if (color && color !== 'transparent') {
      ctx.fillStyle = color;
      ctx.fillRect(col * 10, row * 10, 10, 10);
    }
  });
  
  // Download
  const url = exportCanvas.toDataURL('image/png');
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pixelpro-export.png';
  a.click();
  
  console.log('✅ PNG exported');
}

function exportAsGIF() {
  console.log('📤 Exporting as GIF...');
  alert('GIF export functionality coming soon!');
}

function exportAsSpriteSheet() {
  console.log('📤 Exporting as Sprite Sheet...');
  alert('Sprite Sheet export functionality coming soon!');
}

function printCanvas() {
  console.log('🖨️ Printing canvas...');
  window.print();
}

// Edit Actions
function undo() {
  console.log('↶ Undo');
  alert('Undo functionality coming soon!');
}

function redo() {
  console.log('↷ Redo');
  alert('Redo functionality coming soon!');
}

function cutSelection() {
  console.log('✂️ Cut selection');
  if (toolState.selection) {
    copySelection();
    clearSelection();
  }
}

function copySelection() {
  console.log('📋 Copy selection');
  if (toolState.selection) {
    const selectionData = toolState.selection.map(index => {
      const pixel = document.querySelector(`[data-index="${index}"]`);
      return pixel ? pixel.style.backgroundColor : 'transparent';
    });
    localStorage.setItem('pixelpro_clipboard', JSON.stringify(selectionData));
    console.log('✅ Selection copied to clipboard');
  }
}

function pasteSelection() {
  console.log('📋 Paste selection');
  const clipboardData = localStorage.getItem('pixelpro_clipboard');
  if (clipboardData) {
    const colors = JSON.parse(clipboardData);
    // TODO: Implement paste at cursor position
    console.log('✅ Selection pasted');
  }
}

function selectAll() {
  console.log('🔲 Select all');
  const pixels = document.querySelectorAll('.pixel');
  toolState.selection = Array.from(pixels).map((_, index) => index);
  
  pixels.forEach(pixel => {
    pixel.style.border = '1px solid #00ff00';
  });
  
  console.log('✅ All pixels selected');
}

function clearCanvas() {
  console.log('🗑️ Clear canvas');
  if (confirm('Are you sure you want to clear the canvas?')) {
    const pixels = document.querySelectorAll('.pixel');
    pixels.forEach(pixel => {
      pixel.style.backgroundColor = 'transparent';
      pixel.classList.add('transparent');
      pixel.style.setProperty('--pixel-color', 'transparent');
      pixel.style.border = 'none';
    });
    console.log('✅ Canvas cleared');
  }
}

function resizeCanvas() {
  console.log('📏 Resize canvas');
  const newSize = prompt('Enter new canvas size (8-256):', gridSize);
  if (newSize && !isNaN(newSize)) {
    const size = parseInt(newSize);
    if (size >= 8 && size <= 256) {
      gridSize = size;
      createNewProject();
      console.log(`✅ Canvas resized to ${size}x${size}`);
    } else {
      alert('Size must be between 8 and 256');
    }
  }
}

function cropToSelection() {
  console.log('✂️ Crop to selection');
  if (toolState.selection) {
    alert('Crop functionality coming soon!');
  } else {
    alert('No selection to crop');
  }
}

// Image Actions
function flipHorizontal() {
  console.log('🔄 Flip horizontal');
  const pixels = document.querySelectorAll('.pixel');
  const colors = Array.from(pixels).map(p => p.style.backgroundColor);
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < Math.floor(gridSize / 2); col++) {
      const leftIndex = row * gridSize + col;
      const rightIndex = row * gridSize + (gridSize - 1 - col);
      
      const leftColor = colors[leftIndex];
      const rightColor = colors[rightIndex];
      
      pixels[leftIndex].style.backgroundColor = rightColor;
      pixels[rightIndex].style.backgroundColor = leftColor;
    }
  }
  
  console.log('✅ Image flipped horizontally');
}

function flipVertical() {
  console.log('🔄 Flip vertical');
  const pixels = document.querySelectorAll('.pixel');
  const colors = Array.from(pixels).map(p => p.style.backgroundColor);
  
  for (let col = 0; col < gridSize; col++) {
    for (let row = 0; row < Math.floor(gridSize / 2); row++) {
      const topIndex = row * gridSize + col;
      const bottomIndex = (gridSize - 1 - row) * gridSize + col;
      
      const topColor = colors[topIndex];
      const bottomColor = colors[bottomIndex];
      
      pixels[topIndex].style.backgroundColor = bottomColor;
      pixels[bottomIndex].style.backgroundColor = topColor;
    }
  }
  
  console.log('✅ Image flipped vertically');
}

function rotate90() {
  console.log('🔄 Rotate 90° clockwise');
  const pixels = document.querySelectorAll('.pixel');
  const colors = Array.from(pixels).map(p => p.style.backgroundColor);
  const newColors = new Array(gridSize * gridSize);
  
  for (let row = 0; row < gridSize; row++) {
    for (let col = 0; col < gridSize; col++) {
      const oldIndex = row * gridSize + col;
      const newIndex = col * gridSize + (gridSize - 1 - row);
      newColors[newIndex] = colors[oldIndex];
    }
  }
  
  pixels.forEach((pixel, index) => {
    pixel.style.backgroundColor = newColors[index] || 'transparent';
  });
  
  console.log('✅ Image rotated 90° clockwise');
}

function rotate180() {
  console.log('🔄 Rotate 180°');
  rotate90();
  rotate90();
}

function rotate270() {
  console.log('🔄 Rotate 90° counter-clockwise');
  rotate90();
  rotate90();
  rotate90();
}

function invertColors() {
  console.log('🎨 Invert colors');
  const pixels = document.querySelectorAll('.pixel');
  
  pixels.forEach(pixel => {
    const color = pixel.style.backgroundColor;
    if (color && color !== 'transparent') {
      // Simple inversion - convert to RGB and invert
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, 1, 1);
      const imageData = ctx.getImageData(0, 0, 1, 1);
      
      const r = 255 - imageData.data[0];
      const g = 255 - imageData.data[1];
      const b = 255 - imageData.data[2];
      
      pixel.style.backgroundColor = `rgb(${r}, ${g}, ${b})`;
    }
  });
  
  console.log('✅ Colors inverted');
}

function adjustBrightness() {
  console.log('💡 Adjust brightness');
  const value = prompt('Enter brightness adjustment (-100 to 100):', '0');
  if (value && !isNaN(value)) {
    const adjustment = parseInt(value);
    if (adjustment >= -100 && adjustment <= 100) {
      // TODO: Implement brightness adjustment
      console.log(`✅ Brightness adjusted by ${adjustment}`);
    } else {
      alert('Value must be between -100 and 100');
    }
  }
}

function adjustContrast() {
  console.log('🌓 Adjust contrast');
  const value = prompt('Enter contrast adjustment (-100 to 100):', '0');
  if (value && !isNaN(value)) {
    const adjustment = parseInt(value);
    if (adjustment >= -100 && adjustment <= 100) {
      // TODO: Implement contrast adjustment
      console.log(`✅ Contrast adjusted by ${adjustment}`);
    } else {
      alert('Value must be between -100 and 100');
    }
  }
}

// Layer Actions
function newLayer() {
  console.log('📄 New layer');
  alert('Layer functionality coming soon!');
}

function duplicateLayer() {
  console.log('📋 Duplicate layer');
  alert('Layer functionality coming soon!');
}

function deleteLayer() {
  console.log('🗑️ Delete layer');
  alert('Layer functionality coming soon!');
}

function mergeDown() {
  console.log('🔗 Merge down');
  alert('Layer functionality coming soon!');
}

function mergeVisible() {
  console.log('🔗 Merge visible');
  alert('Layer functionality coming soon!');
}

function layerOpacity() {
  console.log('👁️ Layer opacity');
  alert('Layer functionality coming soon!');
}

function blendMode() {
  console.log('🎨 Blend mode');
  alert('Layer functionality coming soon!');
}

// Animation Actions
function newFrame() {
  console.log('📄 New frame');
  alert('Animation functionality coming soon!');
}

function duplicateFrame() {
  console.log('📋 Duplicate frame');
  alert('Animation functionality coming soon!');
}

function deleteFrame() {
  console.log('🗑️ Delete frame');
  alert('Animation functionality coming soon!');
}

function playAnimation() {
  console.log('▶️ Play animation');
  alert('Animation functionality coming soon!');
}

function stopAnimation() {
  console.log('⏹️ Stop animation');
  alert('Animation functionality coming soon!');
}

function setFrameDelay() {
  console.log('⏱️ Set frame delay');
  alert('Animation functionality coming soon!');
}

function exportAnimation() {
  console.log('📤 Export animation');
  alert('Animation functionality coming soon!');
}

// View Actions
function zoomIn() {
  console.log('🔍 Zoom in');
  // TODO: Implement zoom functionality
  console.log('✅ Zoomed in');
}

function zoomOut() {
  console.log('🔍 Zoom out');
  // TODO: Implement zoom functionality
  console.log('✅ Zoomed out');
}

// Help Actions
function showAbout() {
  console.log('ℹ️ Show about');
  alert('PixelPro - Professional Pixel Art Editor\nVersion 1.0\n\nCreated with ❤️ for pixel artists everywhere!');
}

function showHelp() {
  console.log('❓ Show help');
  alert('Help documentation coming soon!\n\nFor now, try:\n- B: Brush tool\n- E: Eraser\n- G: Fill tool\n- I: Eyedropper\n- L: Line tool\n- R: Rectangle\n- C: Circle');
}

// ========================================
// COLOR PICKER FUNCTIONALITY
// ========================================

function setupColorPicker() {
  console.log('🎨 Setting up color picker...');
  
  if (colorPicker) {
    // Set initial color
    colorPicker.value = currentColor;
    
    // Listen for color changes
    colorPicker.addEventListener('input', (e) => {
      currentColor = e.target.value;
      console.log(`🎨 Color changed to: ${currentColor}`);
    });
    
    // Add transparent color option
    addTransparentColorOption();
    
    console.log('✅ Color picker setup complete');
  } else {
    console.error('❌ Color picker not found');
  }
}

function addTransparentColorOption() {
  // Create a transparent color button
  const transparentBtn = document.createElement('button');
  transparentBtn.innerHTML = '🫥';
  transparentBtn.title = 'Transparent Color';
  transparentBtn.className = 'transparent-color-btn';
  transparentBtn.style.cssText = `
    width: 28px;
    height: 28px;
    background: linear-gradient(45deg, #2a2a2a 25%, transparent 25%), 
                linear-gradient(-45deg, #2a2a2a 25%, transparent 25%), 
                linear-gradient(45deg, transparent 75%, #2a2a2a 75%), 
                linear-gradient(-45deg, transparent 75%, #2a2a2a 75%);
    background-size: 8px 8px;
    background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
    border: 1px solid #2A2A2A;
    border-radius: 0;
    cursor: pointer;
    margin-left: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
  `;
  
  transparentBtn.addEventListener('click', () => {
    currentColor = 'transparent';
    console.log('🎨 Transparent color selected');
  });
  
  // Insert after color picker
  if (colorPicker && colorPicker.parentNode) {
    colorPicker.parentNode.insertBefore(transparentBtn, colorPicker.nextSibling);
  }
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
} 