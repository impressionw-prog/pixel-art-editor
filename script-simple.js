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
    pixel.addEventListener('mousedown', () => drawPixel(pixel));
    pixel.addEventListener('mouseenter', () => {
      if (isMouseDown) drawPixel(pixel);
    });
    canvas.appendChild(pixel);
  }
  
  console.log(`✅ Canvas setup complete: ${gridSize}x${gridSize}`);
}

function drawPixel(pixel) {
  if (currentTool === 'eraser') {
    pixel.style.backgroundColor = 'transparent';
  } else {
    pixel.style.backgroundColor = currentColor;
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
  
  console.log('✅ PixelPro initialized successfully');
}

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
} 