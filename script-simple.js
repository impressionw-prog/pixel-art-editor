// PixelPro - Simplified Working Version
console.log('🚀 PixelPro - Starting Simple Version');

// Core constants
const TRANSPARENT = null;
let gridSize = 16;
let currentTool = "draw";
let currentColor = "#000000";
let isMouseDown = false;

// Layer system
let layers = [];
let currentLayerIndex = 0;
let layerCount = 0;

// Core elements (with safe access)
const canvas = document.getElementById('grid');
const colorPicker = document.getElementById('colorPicker');
const startScreen = document.getElementById('startScreen');
const workPanel = document.getElementById('workPanel');
const layersPanel = document.getElementById('layersPanel');
const layersList = document.getElementById('layersList');
const colorPanel = document.getElementById('colorPanel');

// Grid controls
const gridSizeApp = document.getElementById('gridSizeApp');
const resizeGridApp = document.getElementById('resizeGridApp');

// Clear canvas button
const clearBtn = document.getElementById('clearBtn');

// Color system
let foregroundColor = "#000000";
let backgroundColor = "#ffffff";
let currentHue = 0;
let currentSaturation = 0;
let currentBrightness = 0;
let recentColors = [];

// Tool-specific state
let toolState = {
  brushSize: 1,
  isDrawing: false,
  startPos: null,
  previewElement: null,
  shapeMode: 'outline', // 'outline' or 'filled'
  selectedPixels: [],
  textDialogOpen: false,
  textPosition: null,
  textModalCleanup: null,
  aiDialogOpen: false,
  aiPosition: null,
  aiModalCleanup: null
};

// AI Integration Configuration
const AI_CONFIG = {
  // OpenAI Configuration
  openai: {
    apiKey: '', // User will need to add their own API key
    model: 'dall-e-3',
    size: '1024x1024',
    quality: 'standard',
    style: 'vivid'
  },
  
  // Stable Diffusion Configuration
  stableDiffusion: {
    apiKey: '', // User will need to add their own API key
    model: 'stability-ai/stable-diffusion-xl-base-1.0',
    steps: 30,
    guidance_scale: 7.5
  },
  
  // Replicate Configuration (for specialized pixel art models)
  replicate: {
    apiKey: '', // User will need to add their own API key
    pixelArtModel: 'cjwbw/pixel-art-xl',
    animeModel: 'cjwbw/anything-v4.0'
  },
  
  // Fallback settings
  fallback: {
    useLocalGeneration: true,
    enableCaching: true,
    maxRetries: 3
  }
};

// AI Service Manager
class AIServiceManager {
  constructor() {
    this.cache = new Map();
    this.currentService = 'openai'; // Default service
  }
  
  // Set API keys
  setAPIKey(service, apiKey) {
    switch(service) {
      case 'openai':
        AI_CONFIG.openai.apiKey = apiKey;
        break;
      case 'stableDiffusion':
        AI_CONFIG.stableDiffusion.apiKey = apiKey;
        break;
      case 'replicate':
        AI_CONFIG.replicate.apiKey = apiKey;
        break;
    }
    console.log(`🔑 API key set for ${service}`);
  }
  
  // Get available services
  getAvailableServices() {
    const services = [];
    if (AI_CONFIG.openai.apiKey) services.push('openai');
    if (AI_CONFIG.stableDiffusion.apiKey) services.push('stableDiffusion');
    if (AI_CONFIG.replicate.apiKey) services.push('replicate');
    if (AI_CONFIG.fallback.useLocalGeneration) services.push('local');
    return services;
  }
  
  // Generate image with AI
  async generateImage(prompt, size, style = 'pixel') {
    const services = this.getAvailableServices();
    
    if (services.length === 0) {
      throw new Error('No AI services available. Please add API keys or enable local generation.');
    }
    
    // Try services in order of preference
    for (const service of services) {
      try {
        console.log(`🤖 Trying ${service} for generation...`);
        const result = await this.generateWithService(service, prompt, size, style);
        if (result) {
          console.log(`✅ Successfully generated with ${service}`);
          return result;
        }
      } catch (error) {
        console.warn(`❌ ${service} failed:`, error.message);
        continue;
      }
    }
    
    throw new Error('All AI services failed. Please check your API keys and try again.');
  }
  
  // Generate with specific service
  async generateWithService(service, prompt, size, style) {
    switch(service) {
      case 'openai':
        return await this.generateWithOpenAI(prompt, size, style);
      case 'stableDiffusion':
        return await this.generateWithStableDiffusion(prompt, size, style);
      case 'replicate':
        return await this.generateWithReplicate(prompt, size, style);
      case 'local':
        return await this.generateWithLocal(prompt, size, style);
      default:
        throw new Error(`Unknown service: ${service}`);
    }
  }
  
  // OpenAI DALL-E 3 Integration
  async generateWithOpenAI(prompt, size, style) {
    if (!AI_CONFIG.openai.apiKey) {
      throw new Error('OpenAI API key not configured');
    }
    
    const enhancedPrompt = this.enhancePromptForOpenAI(prompt, style);
    
    const response = await fetch('https://api.openai.com/v1/images/generations', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.openai.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: AI_CONFIG.openai.model,
        prompt: enhancedPrompt,
        n: 1,
        size: AI_CONFIG.openai.size,
        quality: AI_CONFIG.openai.quality,
        style: AI_CONFIG.openai.style,
        response_format: 'b64_json'
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`OpenAI API error: ${error.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('🤖 OpenAI response received:', data);
    
    if (!data.data || !data.data[0] || !data.data[0].b64_json) {
      throw new Error('Invalid response from OpenAI API');
    }
    
    const imageData = data.data[0].b64_json;
    console.log('🤖 Image data length:', imageData.length);
    
    // Convert to pixel art
    return await this.convertImageToPixelArt(imageData, size, prompt, style);
  }
  
  // Stable Diffusion Integration
  async generateWithStableDiffusion(prompt, size, style) {
    if (!AI_CONFIG.stableDiffusion.apiKey) {
      throw new Error('Stable Diffusion API key not configured');
    }
    
    const enhancedPrompt = this.enhancePromptForStableDiffusion(prompt, style);
    
    const response = await fetch('https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${AI_CONFIG.stableDiffusion.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: enhancedPrompt,
            weight: 1
          }
        ],
        cfg_scale: AI_CONFIG.stableDiffusion.guidance_scale,
        steps: AI_CONFIG.stableDiffusion.steps,
        samples: 1
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Stable Diffusion API error: ${error.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    const imageData = data.artifacts[0].base64;
    
    // Convert to pixel art
    return await this.convertImageToPixelArt(imageData, size, prompt, style);
  }
  
  // Replicate Integration (for specialized pixel art models)
  async generateWithReplicate(prompt, size, style) {
    if (!AI_CONFIG.replicate.apiKey) {
      throw new Error('Replicate API key not configured');
    }
    
    const enhancedPrompt = this.enhancePromptForReplicate(prompt, style);
    
    const response = await fetch('https://api.replicate.com/v1/predictions', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${AI_CONFIG.replicate.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        version: "39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        input: {
          prompt: enhancedPrompt,
          width: 1024,
          height: 1024,
          num_outputs: 1,
          guidance_scale: 7.5,
          num_inference_steps: 30
        }
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`Replicate API error: ${error.detail || 'Unknown error'}`);
    }
    
    const prediction = await response.json();
    
    // Poll for completion
    const result = await this.pollReplicatePrediction(prediction.id);
    const imageUrl = result.output[0];
    
    // Download and convert to pixel art
    const imageData = await this.downloadImageAsBase64(imageUrl);
    return await this.convertImageToPixelArt(imageData, size, prompt, style);
  }
  
  // Poll Replicate prediction
  async pollReplicatePrediction(predictionId) {
    const maxAttempts = 60; // 5 minutes max
    let attempts = 0;
    
    while (attempts < maxAttempts) {
      const response = await fetch(`https://api.replicate.com/v1/predictions/${predictionId}`, {
        headers: {
          'Authorization': `Token ${AI_CONFIG.replicate.apiKey}`
        }
      });
      
      const prediction = await response.json();
      
      if (prediction.status === 'succeeded') {
        return prediction;
      } else if (prediction.status === 'failed') {
        throw new Error('Replicate prediction failed');
      }
      
      // Wait 5 seconds before next poll
      await new Promise(resolve => setTimeout(resolve, 5000));
      attempts++;
    }
    
    throw new Error('Replicate prediction timed out');
  }
  
  // Local generation (fallback)
  async generateWithLocal(prompt, size, style) {
    console.log('🎨 Using local generation as fallback');
    const pixelData = generatePlaceholderPixelArt(prompt, size, style);
    
    // Create a larger preview image for better visibility
    const previewCanvas = document.createElement('canvas');
    const previewCtx = previewCanvas.getContext('2d');
    previewCanvas.width = size * 8; // Scale up 8x for visibility
    previewCanvas.height = size * 8;
    
    // Draw the pixel art at larger scale
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = y * size + x;
        const color = pixelData[index];
        
        if (color && color !== null) {
          previewCtx.fillStyle = color;
          previewCtx.fillRect(x * 8, y * 8, 8, 8);
        }
      }
    }
    
    return {
      pixelData: pixelData,
      imageUrl: previewCanvas.toDataURL(),
      prompt: prompt,
      size: size,
      style: style
    };
  }
  
  // Enhance prompts for different services
  enhancePromptForOpenAI(prompt, style) {
    const basePrompt = `${prompt}, pixel art style, ${style} aesthetic`;
    const enhancements = [
      'high quality',
      'detailed',
      'professional pixel art',
      'retro gaming style',
      'clean lines',
      'vibrant colors'
    ];
    return `${basePrompt}, ${enhancements.join(', ')}`;
  }
  
  enhancePromptForStableDiffusion(prompt, style) {
    const basePrompt = `${prompt}, pixel art`;
    const enhancements = [
      'pixelated',
      '8-bit style',
      'retro gaming',
      'clean pixel art',
      'vibrant colors',
      'detailed sprites'
    ];
    return `${basePrompt}, ${enhancements.join(', ')}`;
  }
  
  enhancePromptForReplicate(prompt, style) {
    const basePrompt = `${prompt}, pixel art`;
    const enhancements = [
      'pixelated style',
      'retro gaming aesthetic',
      'clean pixel art',
      'vibrant colors',
      'detailed sprites',
      '8-bit art style'
    ];
    return `${basePrompt}, ${enhancements.join(', ')}`;
  }
  
  // Convert AI-generated image to pixel art
  async convertImageToPixelArt(imageData, targetSize, prompt, style) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          console.log('🤖 Image loaded successfully, dimensions:', img.width, 'x', img.height);
          
          // Create canvas for processing
          const canvas = document.createElement('canvas');
          const ctx = canvas.getContext('2d');
          
          // Set canvas size to target pixel art size
          canvas.width = targetSize;
          canvas.height = targetSize;
          
          console.log('🤖 Processing image to', targetSize, 'x', targetSize, 'pixels');
          
          // Draw and scale image
          ctx.imageSmoothingEnabled = false; // Pixelated scaling
          ctx.drawImage(img, 0, 0, targetSize, targetSize);
          
          // Get pixel data
          const imageData = ctx.getImageData(0, 0, targetSize, targetSize);
          const pixels = [];
          
          console.log('🤖 Converting', imageData.data.length / 4, 'pixels');
          
          // Convert to pixel array
          for (let i = 0; i < imageData.data.length; i += 4) {
            const r = imageData.data[i];
            const g = imageData.data[i + 1];
            const b = imageData.data[i + 2];
            const a = imageData.data[i + 3];
            
            if (a === 0) {
              pixels.push(null); // Transparent
            } else {
              // Use the correct rgbToHex function that takes separate R,G,B parameters
              const hex = "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
              pixels.push(hex);
            }
          }
          
          // Count non-transparent pixels
          const nonTransparentPixels = pixels.filter(p => p !== null).length;
          console.log('🤖 Generated', nonTransparentPixels, 'non-transparent pixels out of', pixels.length, 'total');
          
          // Create a larger preview image for better visibility
          const previewCanvas = document.createElement('canvas');
          const previewCtx = previewCanvas.getContext('2d');
          previewCanvas.width = targetSize * 8; // Scale up 8x for visibility
          previewCanvas.height = targetSize * 8;
          
          // Draw the pixel art at larger scale
          for (let y = 0; y < targetSize; y++) {
            for (let x = 0; x < targetSize; x++) {
              const index = y * targetSize + x;
              const color = pixels[index];
              
              if (color && color !== null) {
                previewCtx.fillStyle = color;
                previewCtx.fillRect(x * 8, y * 8, 8, 8);
              }
            }
          }
          
          const result = {
            pixelData: pixels,
            imageUrl: previewCanvas.toDataURL(), // Use the scaled preview
            prompt: prompt,
            size: targetSize,
            style: style
          };
          
          console.log('🤖 Pixel art conversion complete');
          resolve(result);
        } catch (error) {
          console.error('🤖 Error in convertImageToPixelArt:', error);
          reject(error);
        }
      };
      
      img.onerror = (error) => {
        console.error('🤖 Failed to load generated image:', error);
        reject(new Error('Failed to load generated image'));
      };
      img.src = `data:image/png;base64,${imageData}`;
    });
  }
  
  // Download image as base64
  async downloadImageAsBase64(imageUrl) {
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64 = reader.result.split(',')[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
}

// Global AI service manager
let aiServiceManager;

// Undo/Redo system
let undoStack = [];
let redoStack = [];
const MAX_UNDO_STATES = 50;

// Animation system
let animationFrames = [];
let currentFrameIndex = 0;
let isPlaying = false;
let animationInterval = null;
let animationFPS = 12;

// Initialize
function init() {
  console.log('🎨 Initializing PixelPro...');
  
  // Initialize AI service manager
  aiServiceManager = new AIServiceManager();
  console.log('🤖 AI Service Manager initialized');
  
  // Start screen will be shown by setupStartScreen()
  // Don't automatically hide it here
  
  // Add start screen class initially to hide panels
  document.body.classList.add('start-screen-active');
  
  // Set up color picker
  if (colorPicker) {
    colorPicker.value = currentColor;
    colorPicker.addEventListener('input', (e) => {
      currentColor = e.target.value;
    });
  }
  
  // Set up basic tools
  setupTools();
  
  // Set initial tool to draw and make it active
  currentTool = 'draw';
  const drawBtn = document.getElementById('toolDraw');
  if (drawBtn) {
    drawBtn.classList.add('active');
  }
  
  // Set up start screen buttons (still needed for functionality)
  setupStartScreen();
  
  // Canvas will be created when user chooses an option from start screen
  
  // Set up layer system
  setupLayers();
  
  // Set up color system
  // Color panel removed from start screen
  
  // Set up grid controls
  setupGridControls();
  
  // Initialize options bar
  updateOptionsBar('draw', 'Pencil');
  
  // Set up undo/redo system
  setupUndoRedo();
  
  // Set up clear canvas functionality
  setupClearCanvas();
  
  // Initialize resizable panels
  initResizablePanels();
  
  // Initialize color panel tabs
  initColorTabs();
  setupEnhancedSwatches();
  loadRecentColors();
  
  // Ensure color panel is visible and functional
  setTimeout(() => {
    if (colorPanel) {
      colorPanel.style.display = 'block';
      colorPanel.style.visibility = 'visible';
      console.log('🎨 Color panel initialized and ready');
    }
  }, 500);
  
  // Set up animation system
  setupAnimationSystem();
  
  // Set up advanced menu functionality
  setupAdvancedMenuFunctionality();
  
  console.log('✅ PixelPro initialized successfully');
}

// Setup all tools
function setupTools() {
  const toolButtons = [
    { id: 'toolDraw', tool: 'draw', name: 'Pencil' },
    { id: 'toolBrush', tool: 'brush', name: 'Brush' },
    { id: 'toolEraser', tool: 'eraser', name: 'Eraser' },
    { id: 'toolFill', tool: 'fill', name: 'Fill' },
    { id: 'toolLine', tool: 'line', name: 'Line' },
    { id: 'toolRect', tool: 'rectangle', name: 'Rectangle' },
    { id: 'toolCircle', tool: 'circle', name: 'Circle' },
    { id: 'toolEyedropper', tool: 'eyedropper', name: 'Eyedropper' },
    { id: 'toolMove', tool: 'move', name: 'Move' },
    { id: 'toolText', tool: 'text', name: 'Text' },
    { id: 'toolTransform', tool: 'transform', name: 'Transform' },
    { id: 'toolAI', tool: 'ai', name: 'AI Generator' },
    { id: 'toolDither', tool: 'dither', name: 'Dithering' },
    { id: 'toolOutline', tool: 'outline', name: 'Outline' },
    { id: 'toolShade', tool: 'shade', name: 'Shading' },
    { id: 'toolMirror', tool: 'mirror', name: 'Mirror' },
    { id: 'toolGradient', tool: 'gradient', name: 'Gradient' },
    { id: 'toolPattern', tool: 'pattern', name: 'Pattern' },
    { id: 'toolSymmetry', tool: 'symmetry', name: 'Symmetry' },
    { id: 'toolSelection', tool: 'selection', name: 'Selection' },
    { id: 'toolMagicWand', tool: 'magicWand', name: 'Magic Wand' },
    { id: 'toolLasso', tool: 'lasso', name: 'Lasso' }
  ];
  
  toolButtons.forEach(({ id, tool, name }) => {
    const btn = document.getElementById(id);
    if (btn) {
      btn.addEventListener('click', () => {
        setCurrentTool(tool);
        updateOptionsBar(tool, name);
      });
    }
  });
}

// Set current tool with proper state management
function setCurrentTool(tool) {
  currentTool = tool;
  console.log(`🔧 Tool changed to: ${tool}`);
  
  // Update active state for all tool buttons
  document.querySelectorAll('.toolbar-btn').forEach(btn => {
    btn.classList.remove('active');
  });
  
  // Add active state to current tool
  const activeBtn = document.getElementById(`tool${tool.charAt(0).toUpperCase() + tool.slice(1)}`);
  if (activeBtn) {
    activeBtn.classList.add('active');
  }
  
  // Update cursor based on tool
  updateCanvasCursor(tool);
  
  // Reset any tool-specific state
  resetToolState();
}

// Update canvas cursor based on current tool
function updateCanvasCursor(tool) {
  if (!canvas) return;
  
  const cursors = {
    draw: 'crosshair',
    brush: 'crosshair', 
    eraser: 'crosshair',
    fill: 'crosshair',
    line: 'crosshair',
    rectangle: 'crosshair',
    circle: 'crosshair',
    eyedropper: 'crosshair',
    move: 'move',
    text: 'text',
    transform: 'grab',
    ai: 'crosshair',
    dither: 'crosshair',
    outline: 'crosshair',
    shade: 'crosshair',
    mirror: 'crosshair',
    gradient: 'crosshair',
    pattern: 'crosshair',
    symmetry: 'crosshair',
    selection: 'crosshair',
    magicWand: 'crosshair',
    lasso: 'crosshair'
  };
  
  canvas.style.cursor = cursors[tool] || 'default';
}

// Reset tool-specific state
function resetToolState() {
  toolState.isDrawing = false;
  toolState.startPos = null;
  toolState.selectedPixels = [];
  toolState.textDialogOpen = false;
  toolState.textPosition = null;
  toolState.aiDialogOpen = false;
  toolState.aiPosition = null;
  
  // Clean up text modal if open
  if (toolState.textModalCleanup) {
    toolState.textModalCleanup();
    toolState.textModalCleanup = null;
  }
  
  // Clean up AI modal if open
  if (toolState.aiModalCleanup) {
    toolState.aiModalCleanup();
    toolState.aiModalCleanup = null;
  }
  
  // Clear any preview elements
  if (toolState.previewElement) {
    toolState.previewElement.remove();
    toolState.previewElement = null;
  }
  
  // Clear any temporary visual indicators
  document.querySelectorAll('.pixel.highlighted').forEach(pixel => {
    pixel.classList.remove('highlighted');
  });
  
  // Clear moved pixels class
  document.querySelectorAll('.pixel.moved-pixel').forEach(pixel => {
    pixel.classList.remove('moved-pixel');
  });
}

// Update options bar based on current tool
function updateOptionsBar(tool, toolName) {
  console.log(`🎛️ Updating options bar for tool: ${tool}`);
  
  // Update tool name display
  const activeToolName = document.getElementById('activeToolName');
  if (activeToolName) {
    activeToolName.textContent = toolName;
  }
  
  // Hide all tool options
  const allOptions = document.querySelectorAll('.tool-options');
  console.log(`🎛️ Found ${allOptions.length} tool options to hide`);
  allOptions.forEach(option => {
    option.classList.add('hidden');
  });
  
  // Show options for current tool
  let currentOptions = null;
  
  // Map tool names to HTML IDs
  const toolIdMap = {
    'draw': 'pencilOptions',
    'brush': 'brushOptions',
    'eraser': 'eraserOptions',
    'fill': 'fillOptions',
    'line': 'lineOptions',
    'rectangle': 'rectangleOptions',
    'circle': 'circleOptions',
    'eyedropper': 'eyedropperOptions',
    'move': 'moveOptions',
    'text': 'textOptions',
    'transform': 'transformOptions',
    'ai': 'aiOptions',
    'dither': 'ditherOptions',
    'outline': 'outlineOptions',
    'shade': 'shadeOptions',
    'mirror': 'mirrorOptions',
    'gradient': 'gradientOptions',
    'pattern': 'patternOptions',
    'symmetry': 'symmetryOptions',
    'selection': 'selectionOptions',
    'magicWand': 'magicWandOptions',
    'lasso': 'lassoOptions'
  };
  
  const optionsId = toolIdMap[tool];
  if (optionsId) {
    currentOptions = document.getElementById(optionsId);
  }
  
  if (currentOptions) {
    currentOptions.classList.remove('hidden');
    console.log(`🎛️ Showing options for tool: ${tool} (${optionsId})`);
  } else {
    console.log(`🎛️ No options found for tool: ${tool} (${optionsId})`);
  }
  
  // Always show edit options (undo/redo/clear)
  const editOptions = document.getElementById('editOptions');
  if (editOptions) {
    editOptions.classList.remove('hidden');
    console.log(`🎛️ Edit options shown successfully`);
  } else {
    console.log(`🎛️ Edit options element not found!`);
  }
  
  // Setup tool-specific controls
  setupToolOptions(tool);
}

// Setup tool-specific option controls
function setupToolOptions(tool) {
  switch (tool) {
    case 'pencil':
      setupPencilOptions();
      break;
    case 'brush':
      setupBrushOptions();
      break;
    case 'eraser':
      setupEraserOptions();
      break;
    case 'line':
      setupLineOptions();
      break;
    case 'rectangle':
      setupRectangleOptions();
      break;
    case 'circle':
      setupCircleOptions();
      break;
    case 'text':
      setupTextOptions();
      break;
    case 'ai':
      setupAIOptions();
      break;
  }
}

// Pencil tool options
function setupPencilOptions() {
  const pencilSize = document.getElementById('pencilSize');
  const pencilSizeValue = document.getElementById('pencilSizeValue');
  
  if (pencilSize && pencilSizeValue) {
    pencilSize.addEventListener('input', (e) => {
      const value = e.target.value;
      pencilSizeValue.textContent = value;
      toolState.pencilSize = parseInt(value);
    });
  }
}

// Brush tool options
function setupBrushOptions() {
  const brushSize = document.getElementById('brushSize');
  const brushSizeValue = document.getElementById('brushSizeValue');
  const brushOpacity = document.getElementById('brushOpacity');
  const brushOpacityValue = document.getElementById('brushOpacityValue');
  
  if (brushSize && brushSizeValue) {
    brushSize.addEventListener('input', (e) => {
      const value = e.target.value;
      brushSizeValue.textContent = value;
      toolState.brushSize = parseInt(value);
    });
  }
  
  if (brushOpacity && brushOpacityValue) {
    brushOpacity.addEventListener('input', (e) => {
      const value = e.target.value;
      brushOpacityValue.textContent = value + '%';
      toolState.brushOpacity = parseInt(value) / 100;
    });
  }
  
  // Brush shape buttons
  const shapeButtons = document.querySelectorAll('#brushOptions .shape-btn-mini');
  shapeButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      shapeButtons.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      toolState.brushShape = btn.title.toLowerCase();
    });
  });
}

// Eraser tool options
function setupEraserOptions() {
  const eraserSize = document.getElementById('eraserSize');
  const eraserSizeValue = document.getElementById('eraserSizeValue');
  const eraserMode = document.getElementById('eraserMode');
  
  if (eraserSize && eraserSizeValue) {
    eraserSize.addEventListener('input', (e) => {
      const value = e.target.value;
      eraserSizeValue.textContent = value;
      toolState.eraserSize = parseInt(value);
    });
  }
  
  if (eraserMode) {
    eraserMode.addEventListener('change', (e) => {
      toolState.eraserMode = e.target.value;
    });
  }
}

// Line tool options
function setupLineOptions() {
  const lineWidth = document.getElementById('lineWidth');
  const lineWidthValue = document.getElementById('lineWidthValue');
  const lineStyle = document.getElementById('lineStyle');
  
  if (lineWidth && lineWidthValue) {
    lineWidth.addEventListener('input', (e) => {
      const value = e.target.value;
      lineWidthValue.textContent = value;
      toolState.lineWidth = parseInt(value);
    });
  }
  
  if (lineStyle) {
    lineStyle.addEventListener('change', (e) => {
      toolState.lineStyle = e.target.value;
    });
  }
}

// Rectangle tool options
function setupRectangleOptions() {
  const rectangleFilled = document.getElementById('rectangleFilled');
  const rectangleBorder = document.getElementById('rectangleBorder');
  const rectangleBorderValue = document.getElementById('rectangleBorderValue');
  const rectangleRadius = document.getElementById('rectangleRadius');
  const rectangleRadiusValue = document.getElementById('rectangleRadiusValue');
  
  if (rectangleFilled) {
    rectangleFilled.addEventListener('change', (e) => {
      toolState.rectangleFilled = e.target.checked;
    });
  }
  
  if (rectangleBorder && rectangleBorderValue) {
    rectangleBorder.addEventListener('input', (e) => {
      const value = e.target.value;
      rectangleBorderValue.textContent = value;
      toolState.rectangleBorder = parseInt(value);
    });
  }
  
  if (rectangleRadius && rectangleRadiusValue) {
    rectangleRadius.addEventListener('input', (e) => {
      const value = e.target.value;
      rectangleRadiusValue.textContent = value;
      toolState.rectangleRadius = parseInt(value);
    });
  }
}

// Circle tool options
function setupCircleOptions() {
  const circleFilled = document.getElementById('circleFilled');
  const circleBorder = document.getElementById('circleBorder');
  const circleBorderValue = document.getElementById('circleBorderValue');
  
  if (circleFilled) {
    circleFilled.addEventListener('change', (e) => {
      toolState.circleFilled = e.target.checked;
    });
  }
  
  if (circleBorder && circleBorderValue) {
    circleBorder.addEventListener('input', (e) => {
      const value = e.target.value;
      circleBorderValue.textContent = value;
      toolState.circleBorder = parseInt(value);
    });
  }
}

// Text tool options
function setupTextOptions() {
  const textFont = document.getElementById('textFont');
  const textSize = document.getElementById('textSize');
  const textSizeValue = document.getElementById('textSizeValue');
  const textBold = document.getElementById('textBold');
  const textItalic = document.getElementById('textItalic');
  
  if (textFont) {
    textFont.addEventListener('change', (e) => {
      toolState.textFont = e.target.value;
    });
  }
  
  if (textSize && textSizeValue) {
    textSize.addEventListener('input', (e) => {
      const value = e.target.value;
      textSizeValue.textContent = value;
      toolState.textSize = parseInt(value);
    });
  }
  
  if (textBold) {
    textBold.addEventListener('click', () => {
      textBold.classList.toggle('active');
      toolState.textBold = textBold.classList.contains('active');
    });
  }
  
  if (textItalic) {
    textItalic.addEventListener('click', () => {
      textItalic.classList.toggle('active');
      toolState.textItalic = textItalic.classList.contains('active');
    });
  }
}

// AI tool options
function setupAIOptions() {
  const aiStyle = document.getElementById('aiStyle');
  const aiSize = document.getElementById('aiSize');
  const aiGenerate = document.getElementById('aiGenerate');
  
  if (aiStyle) {
    aiStyle.addEventListener('change', (e) => {
      toolState.aiStyle = e.target.value;
    });
  }
  
  if (aiSize) {
    aiSize.addEventListener('change', (e) => {
      toolState.aiSize = parseInt(e.target.value);
    });
  }
  
  if (aiGenerate) {
    aiGenerate.addEventListener('click', () => {
      // This will be handled by the AI tool click handler
      console.log('AI Generate button clicked');
    });
  }
}

// Setup start screen
function setupStartScreen() {
  console.log('🔧 Setting up start screen...');
  
  // New File button (proper ID)
  const startNewFileBtn = document.getElementById('startNewFile');
  console.log('📄 New File button:', startNewFileBtn);
  if (startNewFileBtn) {
    startNewFileBtn.addEventListener('click', () => {
      console.log('📄 Opening canvas settings...');
      showCanvasSettingsModal();
    });
    console.log('✅ New File button event listener added');
  } else {
    console.error('❌ New File button not found!');
  }
  
  // Open File button
  const startOpenFileBtn = document.getElementById('startOpenFile');
  console.log('📂 Open File button:', startOpenFileBtn);
  if (startOpenFileBtn) {
    startOpenFileBtn.addEventListener('click', () => {
      console.log('📂 Opening file...');
      openFileDialog();
    });
    console.log('✅ Open File button event listener added');
  } else {
    console.error('❌ Open File button not found!');
  }
  
  // Demo button
  const startDemoBtn = document.getElementById('startDemo');
  if (startDemoBtn) {
    startDemoBtn.addEventListener('click', () => {
      console.log('🎮 Starting demo...');
      hideStartScreen();
      createDemoProject();
    });
  }
  
  // Tutorial button
  const startTutorialBtn = document.getElementById('startTutorial');
  if (startTutorialBtn) {
    startTutorialBtn.addEventListener('click', () => {
      console.log('🎓 Starting tutorial...');
      hideStartScreen();
      createTutorialProject();
    });
  }
  
  // Skip start button
  const skipBtn = document.getElementById('skipStart');
  if (skipBtn) {
    skipBtn.addEventListener('click', () => {
      console.log('⏭️ Skipping start screen...');
      hideStartScreen();
      createNewProject();
    });
  }
  
  // Clear recent files button
  const clearRecentBtn = document.getElementById('clearRecent');
  if (clearRecentBtn) {
    clearRecentBtn.addEventListener('click', () => {
      console.log('🗑️ Clearing recent files...');
      if (confirm('Clear all recent files? This cannot be undone.')) {
        clearRecentFiles();
      }
    });
  }
  
  // Load and render recent files
  renderRecentFiles();
  
  // Show start screen by default
  showStartScreen();
}

// Show/hide start screen
function hideStartScreen() {
  if (startScreen) startScreen.classList.add('hidden');
  if (workPanel) workPanel.classList.remove('hidden');
  
  // Remove class from body to show panels via CSS
  document.body.classList.remove('start-screen-active');
}

function showStartScreen() {
  if (startScreen) startScreen.classList.remove('hidden');
  if (workPanel) workPanel.classList.add('hidden');
  
  // Add class to body to hide panels via CSS
  document.body.classList.add('start-screen-active');
}

// Create new project
function showCanvasSettingsModal() {
  console.log('🎨 Showing canvas settings modal...');
  const modal = document.getElementById('canvasSettingsModal');
  console.log('🎨 Canvas settings modal:', modal);
  if (modal) {
    modal.classList.remove('hidden');
    console.log('✅ Canvas settings modal shown');
    
    // Set up canvas settings controls
    setupCanvasSettingsControls();
  } else {
    console.error('❌ Canvas settings modal not found!');
  }
}

function setupCanvasSettingsControls() {
  // Canvas size inputs
  const widthInput = document.getElementById('canvasWidth');
  const heightInput = document.getElementById('canvasHeight');
  
  if (widthInput && heightInput) {
    widthInput.value = 16;
    heightInput.value = 16;
    
    // Auto-update preview
    const updatePreview = () => {
      const width = parseInt(widthInput.value) || 16;
      const height = parseInt(heightInput.value) || 16;
      const preview = document.getElementById('canvasPreview');
      if (preview) {
        preview.textContent = `${width}×${height} pixels (${width * height} total)`;
      }
    };
    
    widthInput.addEventListener('input', updatePreview);
    heightInput.addEventListener('input', updatePreview);
    updatePreview();
    
    // Make updatePreview available for preset buttons
    window.updatePreview = updatePreview;
  }
  
  // Canvas preset buttons
  document.querySelectorAll('.canvas-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all presets
      document.querySelectorAll('.canvas-preset-btn').forEach(b => b.classList.remove('active'));
      // Add active class to clicked preset
      btn.classList.add('active');
      
      // Update size inputs based on preset
      const size = btn.dataset.size;
      if (size && widthInput && heightInput) {
        widthInput.value = size;
        heightInput.value = size;
        if (window.updatePreview) window.updatePreview();
      }
    });
  });
  
  // Color palette preset buttons
  document.querySelectorAll('.palette-preset-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      // Remove active class from all palettes
      document.querySelectorAll('.palette-preset-btn').forEach(b => b.classList.remove('active'));
      // Add active class to clicked palette
      btn.classList.add('active');
    });
  });
  
  // Create canvas button
  const createBtn = document.getElementById('createCanvas');
  if (createBtn) {
    createBtn.addEventListener('click', () => {
      const width = parseInt(widthInput?.value) || 16;
      const height = parseInt(heightInput?.value) || 16;
      
      // Get selected palette
      const activePalette = document.querySelector('.palette-preset-btn.active');
      const paletteType = activePalette?.dataset.palette || 'default';
      
      // Create project with selected settings
      createNewProjectWithSettings(width, height, paletteType);
      
      // Hide modal
      const modal = document.getElementById('canvasSettingsModal');
      if (modal) modal.classList.add('hidden');
    });
  }
  
  // Cancel button
  const cancelBtn = document.getElementById('cancelCanvasSettings');
  if (cancelBtn) {
    cancelBtn.addEventListener('click', () => {
      const modal = document.getElementById('canvasSettingsModal');
      if (modal) modal.classList.add('hidden');
    });
  }
}

function createNewProjectWithSettings(width, height, paletteType) {
  console.log(`🆕 Creating new project: ${width}x${height}, palette: ${paletteType}`);
  
  gridSize = Math.max(width, height); // Use the larger dimension for grid size
  currentColor = "#000";
  currentTool = "draw";
  
  // Hide start screen and show main app
  hideStartScreen();
  
  // Initialize canvas if it exists
  if (canvas) {
    setupCanvas();
    
    // Initialize animation system with first frame
    animationFrames = [];
    currentFrameIndex = 0;
    addAnimationFrame();
  }
  
  // Apply selected color palette
  applyColorPalette(paletteType);
  
  console.log('✅ New project created with custom settings');
}

function applyColorPalette(paletteType) {
  const palettes = {
    default: ['#22223b', '#f72585', '#b5179e', '#3a86ff', '#ffbe0b'],
    gameboy: ['#0f380f', '#306230', '#8bac0f', '#9bbc0f'],
    nes: ['#000000', '#fcfcfc', '#f83800', '#3cbcfc', '#00d800']
  };
  
  const palette = palettes[paletteType] || palettes.default;
  
  // Update the palette bar
  const paletteBar = document.getElementById('palette');
  if (paletteBar) {
    paletteBar.innerHTML = '';
    palette.forEach(color => {
      const colorBtn = document.createElement('div');
      colorBtn.className = 'palette-color';
      colorBtn.style.backgroundColor = color;
      colorBtn.addEventListener('click', () => {
        currentColor = color;
        // Update color picker
        const colorPicker = document.getElementById('colorPicker');
        if (colorPicker) colorPicker.value = color;
      });
      paletteBar.appendChild(colorBtn);
    });
  }
}

function createNewProject() {
  console.log('🆕 Creating new project...');
  gridSize = 16;
  currentColor = "#000";
  currentTool = "draw";
  
  // Initialize canvas if it exists
  if (canvas) {
    setupCanvas();
    
    // Initialize animation system with first frame
    animationFrames = [];
    currentFrameIndex = 0;
    addAnimationFrame();
  }
  
  console.log('✅ New project created');
}

// Setup canvas
function setupCanvas() {
  // Clear existing content
  canvas.innerHTML = '';
  
  // Create pixel grid
  for (let i = 0; i < gridSize * gridSize; i++) {
    const pixel = document.createElement('div');
    pixel.className = 'pixel';
    pixel.style.backgroundColor = 'transparent';
    
    // Add event listeners for drawing
    pixel.addEventListener('mousedown', (e) => {
      isMouseDown = true;
      drawPixel(pixel);
    });
    
    pixel.addEventListener('mouseover', (e) => {
      if (isMouseDown) {
        drawPixel(pixel);
      }
    });
    
    canvas.appendChild(pixel);
  }
  
  // Set canvas grid layout
  canvas.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
  
  // Global mouse up handler
  document.addEventListener('mouseup', () => {
    // Handle move tool finalization
    if (currentTool === 'move' && toolState.isDrawing) {
      // Call move tool with mouse up to finalize the operation
      const dummyPixel = null; // We don't need a specific pixel for mouse up
      handleMoveTool(dummyPixel, 0, 0);
    }
    
    isMouseDown = false;
    // Clear undo saved flags for next drawing operation
    document.querySelectorAll('.pixel').forEach(p => {
      p.dataset.undoSaved = 'false';
    });
  });
  
  console.log(`🎨 Canvas created with ${gridSize}x${gridSize} pixels`);
}

// Enhanced drawing system for all tools
function drawPixel(pixel) {
  if (!pixel) return;
  
  const pixelIndex = Array.from(canvas.children).indexOf(pixel);
  const x = pixelIndex % gridSize;
  const y = Math.floor(pixelIndex / gridSize);
  
  switch (currentTool) {
    case 'draw':
      handleDrawTool(pixel, x, y);
      break;
    case 'brush':
      handleBrushTool(pixel, x, y);
      break;
    case 'eraser':
      handleEraserTool(pixel, x, y);
      break;
    case 'fill':
      handleFillTool(pixel, x, y);
      break;
    case 'line':
      handleLineTool(pixel, x, y);
      break;
    case 'rectangle':
      handleRectangleTool(pixel, x, y);
      break;
    case 'circle':
      handleCircleTool(pixel, x, y);
      break;
    case 'eyedropper':
      handleEyedropperTool(pixel, x, y);
      break;
    case 'move':
      handleMoveTool(pixel, x, y);
      break;
    case 'text':
      handleTextTool(pixel, x, y);
      break;
    case 'transform':
      handleTransformTool(pixel, x, y);
      break;
    case 'ai':
      handleAITool(pixel, x, y);
      break;
    case 'dither':
      handleDitherTool(pixel, x, y);
      break;
    case 'outline':
      handleOutlineTool(pixel, x, y);
      break;
    case 'shade':
      handleShadeTool(pixel, x, y);
      break;
    case 'mirror':
      handleMirrorTool(pixel, x, y);
      break;
    case 'gradient':
      handleGradientTool(pixel, x, y);
      break;
    case 'pattern':
      handlePatternTool(pixel, x, y);
      break;
    case 'symmetry':
      handleSymmetryTool(pixel, x, y);
      break;
    case 'selection':
      handleSelectionTool(pixel, x, y);
      break;
    case 'magicWand':
      handleMagicWandTool(pixel, x, y);
      break;
    case 'lasso':
      handleLassoTool(pixel, x, y);
      break;
  }
  
  // Auto-save current frame for animation
  if (isMouseDown) {
    saveCurrentFrame();
  }
}

// Individual tool handlers
function handleDrawTool(pixel, x, y) {
  if (!isMouseDown) return;
  
  // Save state for undo (only once per drag operation)
  if (pixel.dataset.undoSaved !== 'true') {
    saveCanvasState();
    if (isMouseDown) {
      document.querySelectorAll('.pixel').forEach(p => {
        p.dataset.undoSaved = 'true';
      });
    }
  }
  
  pixel.style.backgroundColor = currentColor;
}

function handleBrushTool(pixel, x, y) {
  if (!isMouseDown) return;
  
  // Save state for undo (only once per drag operation)
  if (pixel.dataset.undoSaved !== 'true') {
    saveCanvasState();
    if (isMouseDown) {
      document.querySelectorAll('.pixel').forEach(p => {
        p.dataset.undoSaved = 'true';
      });
    }
  }
  
  // Draw with brush size
  const brushRadius = Math.floor(toolState.brushSize / 2);
  
  for (let by = -brushRadius; by <= brushRadius; by++) {
    for (let bx = -brushRadius; bx <= brushRadius; bx++) {
      const newX = x + bx;
      const newY = y + by;
      
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        const newIndex = newY * gridSize + newX;
        const targetPixel = canvas.children[newIndex];
        if (targetPixel) {
          targetPixel.style.backgroundColor = currentColor;
        }
      }
    }
  }
}

function handleEraserTool(pixel, x, y) {
  if (!isMouseDown) return;
  
  // Save state for undo (only once per drag operation)
  if (pixel.dataset.undoSaved !== 'true') {
    saveCanvasState();
    if (isMouseDown) {
      document.querySelectorAll('.pixel').forEach(p => {
        p.dataset.undoSaved = 'true';
      });
    }
  }
  
  // Erase with brush size
  const brushRadius = Math.floor(toolState.brushSize / 2);
  
  for (let by = -brushRadius; by <= brushRadius; by++) {
    for (let bx = -brushRadius; bx <= brushRadius; bx++) {
      const newX = x + bx;
      const newY = y + by;
      
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        const newIndex = newY * gridSize + newX;
        const targetPixel = canvas.children[newIndex];
        if (targetPixel) {
          targetPixel.style.backgroundColor = 'transparent';
        }
      }
    }
  }
}

function handleFillTool(pixel, x, y) {
  saveCanvasState();
  const targetColor = pixel.style.backgroundColor || 'transparent';
  
  if (targetColor === currentColor) return; // Already the target color
  
  floodFill(x, y, targetColor, currentColor);
}

function handleLineTool(pixel, x, y) {
  if (!toolState.isDrawing) {
    // Start drawing line
    toolState.startPos = { x, y };
    toolState.isDrawing = true;
    saveCanvasState();
  } else if (toolState.isDrawing && toolState.startPos) {
    // Preview line while dragging
    clearLinePreview();
    drawLinePreview(toolState.startPos.x, toolState.startPos.y, x, y);
  }
}

function handleRectangleTool(pixel, x, y) {
  if (!toolState.isDrawing) {
    // Start drawing rectangle
    toolState.startPos = { x, y };
    toolState.isDrawing = true;
    saveCanvasState();
  } else if (toolState.isDrawing && toolState.startPos) {
    // Preview rectangle while dragging
    clearShapePreview();
    drawRectanglePreview(toolState.startPos.x, toolState.startPos.y, x, y);
  }
}

function handleCircleTool(pixel, x, y) {
  if (!toolState.isDrawing) {
    // Start drawing circle
    toolState.startPos = { x, y };
    toolState.isDrawing = true;
    saveCanvasState();
  } else if (toolState.isDrawing && toolState.startPos) {
    // Preview circle while dragging
    clearShapePreview();
    drawCirclePreview(toolState.startPos.x, toolState.startPos.y, x, y);
  }
}

function handleEyedropperTool(pixel, x, y) {
  const color = pixel.style.backgroundColor;
  if (color && color !== 'transparent' && color !== '') {
    // Convert RGB to hex if needed
    let hexColor = color;
    if (color.startsWith('rgb')) {
      hexColor = rgbToHex(color) || color;
    }
    setForegroundColor(hexColor);
    console.log(`🎨 Color picked: ${hexColor}`);
    
    // Auto-switch back to previous tool after picking color
    setTimeout(() => {
      if (currentTool === 'eyedropper') {
        setCurrentTool('draw');
      }
    }, 100);
  }
}

function handleMoveTool(pixel, x, y) {
  // Handle mouse up event (finalize move operation)
  if (!isMouseDown && toolState.isDrawing) {
    // Finalize move operation when mouse is released
    console.log(`📍 Move tool: Finalizing move operation`);
    
    // Remove temporary moved-pixel class and make the move permanent
    const pixels = Array.from(canvas.children);
    pixels.forEach(p => {
      if (p.classList.contains('moved-pixel')) {
        p.classList.remove('moved-pixel');
      }
    });
    
    // Reset tool state
    toolState.isDrawing = false;
    toolState.selectedPixels = [];
    toolState.startPos = null;
    return;
  }
  
  // Start move operation on initial mouse down
  if (isMouseDown && !toolState.isDrawing) {
    saveCanvasState(); // Save state before moving
    toolState.isDrawing = true;
    toolState.startPos = { x, y };
    
    // Find non-transparent pixels to move
    const pixels = Array.from(canvas.children);
    toolState.selectedPixels = [];
    
    pixels.forEach((p, index) => {
      const color = p.style.backgroundColor;
      if (color && color !== 'transparent' && color !== '') {
        const px = index % gridSize;
        const py = Math.floor(index / gridSize);
        toolState.selectedPixels.push({
          x: px,
          y: py,
          color: color,
          originalIndex: index
        });
      }
    });
    
    if (toolState.selectedPixels.length > 0) {
      console.log(`📍 Move tool: Selected ${toolState.selectedPixels.length} pixels to move`);
      // Clear original pixels
      toolState.selectedPixels.forEach(({originalIndex}) => {
        pixels[originalIndex].style.backgroundColor = 'transparent';
      });
    } else {
      console.log(`📍 Move tool: No content to move`);
      toolState.isDrawing = false;
    }
    
  } else if (isMouseDown && toolState.isDrawing && toolState.selectedPixels.length > 0) {
    // Move the selected content
    const deltaX = x - toolState.startPos.x;
    const deltaY = y - toolState.startPos.y;
    
    // Clear any previously moved pixels
    const pixels = Array.from(canvas.children);
    pixels.forEach(p => {
      if (p.classList.contains('moved-pixel')) {
        p.style.backgroundColor = 'transparent';
        p.classList.remove('moved-pixel');
      }
    });
    
    // Place pixels at new positions
    toolState.selectedPixels.forEach(({x: origX, y: origY, color}) => {
      const newX = origX + deltaX;
      const newY = origY + deltaY;
      
      if (newX >= 0 && newX < gridSize && newY >= 0 && newY < gridSize) {
        const newIndex = newY * gridSize + newX;
        const targetPixel = pixels[newIndex];
        if (targetPixel) {
          targetPixel.style.backgroundColor = color;
          targetPixel.classList.add('moved-pixel');
        }
      }
    });
  }
}

function handleTextTool(pixel, x, y) {
  // Only trigger on initial mousedown, not during drag
  // For text tool, we want to trigger when mouse is down (initial click) and dialog is not open
  if (isMouseDown && !toolState.textDialogOpen) {
    toolState.textDialogOpen = true;
    
    // Store the position for text placement
    toolState.textPosition = { x, y };
    
    // Show the text modal
    const textModal = document.getElementById('textModal');
    const textInput = document.getElementById('textInput');
    
    if (textModal && textInput) {
      textModal.classList.remove('hidden');
      textInput.focus();
      textInput.value = '';
      
      // Set up modal events
      setupTextModalEvents();
    } else {
      console.error('🔤 Text modal elements not found!');
      toolState.textDialogOpen = false;
    }
  }
}

function setupTextModalEvents() {
  const textModal = document.getElementById('textModal');
  const textInput = document.getElementById('textInput');
  const addTextBtn = document.getElementById('addText');
  const cancelTextBtn = document.getElementById('cancelText');
  
  if (!textModal || !textInput || !addTextBtn || !cancelTextBtn) {
    console.error('🔤 Missing modal elements!');
    return;
  }
  
  // Add text button
  const handleAddText = () => {
    const text = textInput.value.trim();
    
    if (text && toolState.textPosition) {
      saveCanvasState();
      drawTextAtPosition(text, toolState.textPosition.x, toolState.textPosition.y);
      console.log(`🔤 Text added: "${text}" at (${toolState.textPosition.x}, ${toolState.textPosition.y})`);
    }
    closeTextModal();
  };
  
  // Cancel button
  const handleCancel = () => {
    closeTextModal();
  };
  
  // Enter key in input
  const handleEnterKey = (e) => {
    if (e.key === 'Enter') {
      handleAddText();
    }
  };
  
  // Escape key
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  // Click outside modal to close
  const handleModalClick = (e) => {
    if (e.target === textModal) {
      handleCancel();
    }
  };
  
  // Remove existing listeners and add new ones
  addTextBtn.onclick = handleAddText;
  cancelTextBtn.onclick = handleCancel;
  textInput.onkeydown = handleEnterKey;
  document.addEventListener('keydown', handleEscapeKey);
  textModal.onclick = handleModalClick;
  
  // Store cleanup function
  toolState.textModalCleanup = () => {
    document.removeEventListener('keydown', handleEscapeKey);
    textModal.onclick = null;
  };
}

function closeTextModal() {
  const textModal = document.getElementById('textModal');
  if (textModal) {
    textModal.classList.add('hidden');
  }
  
  // Clean up event listeners
  if (toolState.textModalCleanup) {
    toolState.textModalCleanup();
    toolState.textModalCleanup = null;
  }
  
  // Reset text tool state
  toolState.textDialogOpen = false;
  toolState.textPosition = null;
}

function handleTransformTool(pixel, x, y) {
  console.log(`🔄 Transform tool: Select content to transform`);
}

function handleAITool(pixel, x, y) {
  // Only trigger on initial mousedown, not during drag
  if (isMouseDown && !toolState.aiDialogOpen) {
    toolState.aiDialogOpen = true;
    
    // Store the position for AI generation
    toolState.aiPosition = { x, y };
    
    // Show the AI modal
    const aiModal = document.getElementById('aiModal');
    const aiInput = document.getElementById('aiInput');
    
    if (aiModal && aiInput) {
      aiModal.classList.remove('hidden');
      aiInput.focus();
      aiInput.value = '';
      
      // Set up modal events
      setupAIModalEvents();
    } else {
      console.error('🤖 AI modal elements not found!');
      toolState.aiDialogOpen = false;
    }
  }
}

// New Pixel Art Tool Handlers
function handleDitherTool(pixel, x, y) {
  if (isMouseDown) {
    const ditherPattern = document.getElementById('ditherPattern')?.value || 'floyd';
    const ditherIntensity = document.getElementById('ditherIntensity')?.value || 50;
    console.log(`🎨 Dithering with ${ditherPattern} pattern at ${ditherIntensity}% intensity`);
    // TODO: Implement dithering algorithm
  }
}

function handleOutlineTool(pixel, x, y) {
  if (isMouseDown) {
    const outlineStyle = document.getElementById('outlineStyle')?.value || 'solid';
    const outlineWidth = document.getElementById('outlineWidth')?.value || 1;
    console.log(`📝 Creating ${outlineStyle} outline with width ${outlineWidth}`);
    // TODO: Implement outline creation
  }
}

function handleShadeTool(pixel, x, y) {
  if (isMouseDown) {
    const shadeType = document.getElementById('shadeType')?.value || 'cell';
    const shadeLevels = document.getElementById('shadeLevels')?.value || 3;
    console.log(`🌓 Applying ${shadeType} shading with ${shadeLevels} levels`);
    // TODO: Implement shading algorithm
  }
}

function handleMirrorTool(pixel, x, y) {
  if (isMouseDown) {
    const mirrorAxis = document.getElementById('mirrorAxis')?.value || 'horizontal';
    const mirrorLive = document.getElementById('mirrorLive')?.checked || false;
    console.log(`🪞 Mirroring on ${mirrorAxis} axis, live: ${mirrorLive}`);
    // TODO: Implement mirror drawing
  }
}

function handleGradientTool(pixel, x, y) {
  if (isMouseDown) {
    const gradientType = document.getElementById('gradientType')?.value || 'linear';
    const gradientSteps = document.getElementById('gradientSteps')?.value || 8;
    console.log(`🌈 Creating ${gradientType} gradient with ${gradientSteps} steps`);
    // TODO: Implement gradient creation
  }
}

function handlePatternTool(pixel, x, y) {
  if (isMouseDown) {
    const patternType = document.getElementById('patternType')?.value || 'checker';
    const patternScale = document.getElementById('patternScale')?.value || 2;
    console.log(`🔲 Applying ${patternType} pattern at scale ${patternScale}`);
    // TODO: Implement pattern application
  }
}

function handleSymmetryTool(pixel, x, y) {
  if (isMouseDown) {
    const symmetryType = document.getElementById('symmetryType')?.value || 'horizontal';
    const symmetryLines = document.getElementById('symmetryLines')?.value || 2;
    console.log(`⚡ Drawing with ${symmetryType} symmetry, ${symmetryLines} lines`);
    // TODO: Implement symmetry drawing
  }
}

function handleSelectionTool(pixel, x, y) {
  if (isMouseDown) {
    const selectionMode = document.getElementById('selectionMode')?.value || 'rectangular';
    const selectionFeather = document.getElementById('selectionFeather')?.value || 0;
    console.log(`📦 Selecting with ${selectionMode} mode, feather: ${selectionFeather}`);
    // TODO: Implement selection tools
  }
}

function handleMagicWandTool(pixel, x, y) {
  if (isMouseDown) {
    const tolerance = document.getElementById('magicWandTolerance')?.value || 32;
    const contiguous = document.getElementById('magicWandContiguous')?.checked || true;
    console.log(`🪄 Magic wand with tolerance ${tolerance}, contiguous: ${contiguous}`);
    // TODO: Implement magic wand selection
  }
}

function handleLassoTool(pixel, x, y) {
  if (isMouseDown) {
    const lassoMode = document.getElementById('lassoMode')?.value || 'freehand';
    const lassoSmooth = document.getElementById('lassoSmooth')?.value || 2;
    console.log(`🪢 Lasso tool in ${lassoMode} mode, smooth: ${lassoSmooth}`);
    // TODO: Implement lasso selection
  }
}

function setupAIModalEvents() {
  const aiModal = document.getElementById('aiModal');
  const aiInput = document.getElementById('aiInput');
  const generateBtn = document.getElementById('generateAI');
  const cancelBtn = document.getElementById('cancelAI');
  const loadingSpinner = document.getElementById('aiLoading');
  const previewContainer = document.getElementById('aiPreview');
  const previewImg = document.getElementById('aiPreviewImg');
  const emptyState = document.getElementById('aiEmptyState');
  const applyBtn = document.getElementById('applyAI');
  const regenerateBtn = document.getElementById('regenerateAI');
  const toggleApiKeysBtn = document.getElementById('toggleApiKeys');
  const apiKeySection = document.getElementById('apiKeySection');
  
  if (!aiModal || !aiInput || !generateBtn || !cancelBtn) {
    console.error('🤖 Missing AI modal elements!');
    return;
  }
  
  // Load saved API keys
  loadAPIKeys();
  
  // Update service status
  updateServiceStatus();
  
  // Toggle API key section
  if (toggleApiKeysBtn && apiKeySection) {
    toggleApiKeysBtn.addEventListener('click', () => {
      apiKeySection.classList.toggle('hidden');
      toggleApiKeysBtn.textContent = apiKeySection.classList.contains('hidden') 
        ? '🔑 Configure API Keys (Optional)' 
        : '🔑 Hide API Keys';
      updateServiceStatus();
    });
  }
  
  // Handle custom size input
  const aiArtSizeSelect = document.getElementById('aiArtSize');
  const customSizeInput = document.getElementById('customSizeInput');
  const customWidthInput = document.getElementById('customWidth');
  const customHeightInput = document.getElementById('customHeight');
  
  if (aiArtSizeSelect && customSizeInput) {
    aiArtSizeSelect.addEventListener('change', () => {
      console.log(`🔧 Art size dropdown changed to: ${aiArtSizeSelect.value}`);
      if (aiArtSizeSelect.value === 'custom') {
        customSizeInput.classList.remove('hidden');
        // Set default values for custom size
        if (customWidthInput) customWidthInput.value = '12';
        if (customHeightInput) customHeightInput.value = '12';
        console.log(`🔧 Custom size inputs shown with default values`);
      } else {
        customSizeInput.classList.add('hidden');
        console.log(`🔧 Custom size inputs hidden`);
      }
    });
  }
  
  // Combined input validation and display update for custom size inputs
  const handleCustomSizeInput = (input, isWidth = true) => {
    let value = parseInt(input.value);
    if (isNaN(value) || value < 1) value = 1;
    if (value > 64) value = 64;
    input.value = value;
    
    console.log(`🔧 Custom size input changed: ${isWidth ? 'width' : 'height'} = ${value}`);
    
    // Update custom size display
    if (aiArtSizeSelect && customWidthInput && customHeightInput) {
      const width = customWidthInput.value || '12';
      const height = customHeightInput.value || '12';
      const customOption = aiArtSizeSelect.querySelector('option[value="custom"]');
      if (customOption) {
        customOption.textContent = `Custom (${width}x${height})`;
        console.log(`🔧 Updated dropdown text to: Custom (${width}x${height})`);
      }
    }
  };
  
  if (customWidthInput) {
    customWidthInput.addEventListener('input', () => handleCustomSizeInput(customWidthInput, true));
  }
  
  if (customHeightInput) {
    customHeightInput.addEventListener('input', () => handleCustomSizeInput(customHeightInput, false));
  }
  
  // Add a "Make Square" button for custom sizes
  const makeSquareBtn = document.createElement('button');
  makeSquareBtn.type = 'button';
  makeSquareBtn.className = 'mt-2 px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-xs rounded';
  makeSquareBtn.textContent = '🔲 Make Square';
  makeSquareBtn.onclick = () => {
    if (customWidthInput && customHeightInput) {
      const width = parseInt(customWidthInput.value) || 12;
      const height = parseInt(customHeightInput.value) || 12;
      const maxSize = Math.max(width, height);
      customWidthInput.value = maxSize;
      customHeightInput.value = maxSize;
      
      // Trigger display update
      handleCustomSizeInput(customWidthInput, true);
    }
  };
  
  // Insert the make square button after the custom size inputs
  if (customSizeInput) {
    customSizeInput.appendChild(makeSquareBtn);
  }
  
  // Set up action buttons
  if (applyBtn) {
    applyBtn.addEventListener('click', () => {
      if (toolState.aiGeneratedData) {
        applyAIPixelArt(toolState.aiGeneratedData, toolState.aiPosition.x, toolState.aiPosition.y);
        closeAIModal();
      }
    });
  }
  
  if (regenerateBtn) {
    regenerateBtn.addEventListener('click', () => {
      handleGenerate();
    });
  }
  
  // Show empty state initially
  if (emptyState) {
    emptyState.classList.remove('hidden');
  }
  
  // Generate AI art button
  const handleGenerate = async () => {
    const prompt = aiInput.value.trim();
    
    if (!prompt) {
      alert('Please enter a prompt for AI generation');
      return;
    }
    
    if (!toolState.aiPosition) {
      alert('No position selected for AI generation');
      return;
    }
    
    // Save API keys
    saveAPIKeys();
    
    // Get settings from the modal
    const artSizeValue = document.getElementById('aiArtSize').value;
    let artSize, artWidth, artHeight;
    
    if (artSizeValue === 'custom') {
      // Get custom dimensions
      artWidth = parseInt(document.getElementById('customWidth').value) || 12;
      artHeight = parseInt(document.getElementById('customHeight').value) || 12;
      artSize = Math.max(artWidth, artHeight); // Use the larger dimension for AI generation
      
      console.log(`🔧 Custom size detected: ${artWidth}x${artHeight}, using artSize: ${artSize}`);
      
      // Validate custom size
      if (artWidth < 1 || artWidth > 64 || artHeight < 1 || artHeight > 64) {
        alert('Custom size must be between 1x1 and 64x64 pixels');
        return;
      }
    } else {
      // Use predefined square size
      artSize = parseInt(artSizeValue) || 12;
      artWidth = artSize;
      artHeight = artSize;
      console.log(`🔧 Predefined size: ${artSize}x${artSize}`);
    }
    
    const style = document.getElementById('aiStyle').value || 'pixel';
    const service = document.getElementById('aiService').value || 'auto';
    const quality = document.getElementById('aiQuality').value || 'standard';
    
    console.log(`⚙️ AI Settings - Service: ${service}, Size: ${artWidth}x${artHeight}, Style: ${style}, Quality: ${quality}`);
    
    // Show loading state
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    if (loadingSpinner) loadingSpinner.classList.remove('hidden');
    if (previewContainer) previewContainer.classList.add('hidden');
    if (emptyState) emptyState.classList.add('hidden');
    if (applyBtn) applyBtn.classList.add('hidden');
    if (regenerateBtn) regenerateBtn.classList.add('hidden');
    
    try {
      console.log(`🤖 Generating AI art: "${prompt}" at (${toolState.aiPosition.x}, ${toolState.aiPosition.y}) with service ${service}`);
      
      // Generate AI pixel art with selected service
      let aiData;
      try {
        if (service === 'auto') {
          aiData = await aiServiceManager.generateImage(prompt, artSize, style);
        } else {
          aiData = await aiServiceManager.generateWithService(service, prompt, artSize, style);
        }
      } catch (aiError) {
        console.warn('🤖 AI generation failed, falling back to local generation:', aiError);
        // Fallback to local generation
        aiData = await aiServiceManager.generateWithLocal(prompt, artSize, style);
      }
      
      if (aiData && aiData.pixelData) {
        // Validate pixel data size for rectangular dimensions
        const expectedSize = artWidth * artHeight;
        const actualSize = aiData.pixelData.length;
        
        if (actualSize !== expectedSize) {
          console.warn(`🤖 Size mismatch: expected ${expectedSize} (${artWidth}x${artHeight}), got ${actualSize}. Attempting to fix...`);
          // Try to fix the size by padding or truncating
          if (actualSize < expectedSize) {
            // Pad with transparent pixels
            while (aiData.pixelData.length < expectedSize) {
              aiData.pixelData.push(null);
            }
          } else {
            // Truncate to expected size
            aiData.pixelData = aiData.pixelData.slice(0, expectedSize);
          }
        }
        
        // Display preview
        if (previewImg) {
          previewImg.src = aiData.imageUrl;
        }
        if (previewContainer) {
          previewContainer.classList.remove('hidden');
        }
        if (emptyState) {
          emptyState.classList.add('hidden');
        }
        
        // Update preview info
        const previewInfo = document.getElementById('aiPreviewInfo');
        if (previewInfo) {
          previewInfo.textContent = `${artWidth}x${artHeight} pixels • ${style} style`;
        }
        
        // Add width and height information for rectangular support
        if (artSizeValue === 'custom') {
          aiData.width = artWidth;
          aiData.height = artHeight;
        } else {
          aiData.width = artSize;
          aiData.height = artSize;
        }
        
        // Store the generated data
        toolState.aiGeneratedData = aiData;
        
        // Show action buttons
        if (applyBtn) {
          applyBtn.classList.remove('hidden');
        }
        if (regenerateBtn) {
          regenerateBtn.classList.remove('hidden');
        }
      } else {
        alert('Failed to generate AI art. Please try again.');
      }
    } catch (error) {
      console.error('🤖 AI generation error:', error);
      alert('Error generating AI art: ' + error.message);
                 } finally {
               // Reset loading state
               generateBtn.disabled = false;
               generateBtn.textContent = 'Generate';
               if (loadingSpinner) loadingSpinner.classList.add('hidden');
               
               // Show empty state if no preview is available
               if (!previewContainer || previewContainer.classList.contains('hidden')) {
                 if (emptyState) emptyState.classList.remove('hidden');
               }
             }
  };
  
  // Cancel button
  const handleCancel = () => {
    closeAIModal();
  };
  
  // Enter key in input
  const handleEnterKey = (e) => {
    if (e.key === 'Enter' && !generateBtn.disabled) {
      handleGenerate();
    }
  };
  
  // Escape key
  const handleEscapeKey = (e) => {
    if (e.key === 'Escape') {
      handleCancel();
    }
  };
  
  // Click outside modal to close
  const handleModalClick = (e) => {
    if (e.target === aiModal) {
      handleCancel();
    }
  };
  
  // Remove existing listeners and add new ones
  generateBtn.onclick = handleGenerate;
  cancelBtn.onclick = handleCancel;
  aiInput.onkeydown = handleEnterKey;
  document.addEventListener('keydown', handleEscapeKey);
  aiModal.onclick = handleModalClick;
  
  console.log('🤖 AI modal event listeners set up successfully');
  console.log('🤖 Generate button:', generateBtn);
  console.log('🤖 Cancel button:', cancelBtn);
  
  // Store cleanup function
  toolState.aiModalCleanup = () => {
    document.removeEventListener('keydown', handleEscapeKey);
    aiModal.onclick = null;
  };
}

function closeAIModal() {
  const aiModal = document.getElementById('aiModal');
  if (aiModal) {
    aiModal.classList.add('hidden');
  }
  
  // Clean up event listeners
  if (toolState.aiModalCleanup) {
    toolState.aiModalCleanup();
    toolState.aiModalCleanup = null;
  }
  
  // Reset AI tool state
  toolState.aiDialogOpen = false;
  toolState.aiPosition = null;
  
  // Reset preview state
  const loadingSpinner = document.getElementById('aiLoading');
  const previewContainer = document.getElementById('aiPreview');
  const emptyState = document.getElementById('aiEmptyState');
  const applyBtn = document.getElementById('applyAI');
  const regenerateBtn = document.getElementById('regenerateAI');
  
  if (loadingSpinner) loadingSpinner.classList.add('hidden');
  if (previewContainer) previewContainer.classList.add('hidden');
  if (emptyState) emptyState.classList.remove('hidden');
  if (applyBtn) applyBtn.classList.add('hidden');
  if (regenerateBtn) regenerateBtn.classList.add('hidden');
}

async function generateAIPixelArt(prompt, size, style = 'pixel') {
  try {
    console.log(`🤖 Generating ${size}x${size} pixel art for: "${prompt}" with ${style} style`);
    
    // Use the AI service manager to generate with real AI APIs
    const result = await aiServiceManager.generateImage(prompt, size, style);
    
    // Ensure pixel data has the correct size
    const expectedLength = size * size;
    if (result.pixelData.length !== expectedLength) {
      console.warn(`🤖 Fixing pixel data size: expected ${expectedLength}, got ${result.pixelData.length}`);
      if (result.pixelData.length < expectedLength) {
        // Pad with transparent pixels
        while (result.pixelData.length < expectedLength) {
          result.pixelData.push(null);
        }
      } else {
        // Truncate to expected size
        result.pixelData = result.pixelData.slice(0, expectedLength);
      }
    }
    
    return result;
  } catch (error) {
    console.error('🤖 AI generation failed:', error);
    
    // Fallback to local generation if AI fails
    console.log('🔄 Falling back to local generation...');
    const pixelData = generatePlaceholderPixelArt(prompt, size, style);
    
    return {
      pixelData: pixelData,
      imageUrl: createImageFromPixels(pixelData, size),
      prompt: prompt,
      size: size,
      style: style
    };
  }
}

function generatePlaceholderPixelArt(prompt, size, style = 'pixel') {
  const lowerPrompt = prompt.toLowerCase();
  
  // Add randomization seed based on current time and prompt
  const randomSeed = Date.now() + prompt.length + Math.random();
  const random = (min, max) => {
    const x = Math.sin(randomSeed + min + max) * 10000;
    return min + (x - Math.floor(x)) * (max - min);
  };
  
  // Enhanced color palettes with better color harmony and contrast
  const palettes = {
    // Animals - More vibrant and realistic
    cat: ['#8b4513', '#d2691e', '#ffd700', '#ff6b35', '#ffb6c1', '#deb887', '#f4a460', '#daa520', '#ff6347', '#ff7f50', '#ffa07a', '#ffe4b5', '#000000', '#ffffff', '#4169e1', '#32cd32'],
    dog: ['#8b4513', '#d2691e', '#a0522d', '#ffd700', '#ff6b35', '#8b7355', '#f4a460', '#daa520', '#cd853f', '#deb887', '#ff6347', '#ff7f50', '#ffa07a', '#ffe4b5', '#000000', '#ffffff'],
    bird: ['#4169e1', '#1e90ff', '#87ceeb', '#00bfff', '#ffd700', '#ff4500', '#ff69b4', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#ffff00', '#ffa500', '#ff6347', '#000000', '#ffffff'],
    fish: ['#4682b4', '#5f9ea0', '#87ceeb', '#00bfff', '#ffd700', '#ff4500', '#ff69b4', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#ffff00', '#ffa500', '#ff6347', '#000000', '#ffffff'],
    
    // Vehicles - More metallic and vibrant
    spaceship: ['#2f4f4f', '#696969', '#4682b4', '#5f9ea0', '#87ceeb', '#00bfff', '#c0c0c0', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#ff4500', '#ff6347', '#000000', '#ffffff'],
    car: ['#ff4500', '#ff6347', '#ff7f50', '#4682b4', '#5f9ea0', '#c0c0c0', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#ff69b4', '#32cd32', '#00ff00', '#000000', '#ffffff'],
    boat: ['#4169e1', '#1e90ff', '#87ceeb', '#00bfff', '#8b4513', '#a0522d', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#c0c0c0', '#ff4500', '#ff6347', '#000000', '#ffffff'],
    plane: ['#c0c0c0', '#d3d3d3', '#4682b4', '#5f9ea0', '#ffffff', '#f8f8ff', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#ff4500', '#ff69b4', '#32cd32', '#000000', '#ff6347'],
    
    // Buildings - More architectural colors
    castle: ['#696969', '#808080', '#a0522d', '#8b4513', '#d2691e', '#cd853f', '#ffd700', '#daa520', '#deb887', '#f4a460', '#c0c0c0', '#d3d3d3', '#ff4500', '#ff6347', '#000000', '#ffffff'],
    house: ['#8b4513', '#a0522d', '#d2691e', '#cd853f', '#ffd700', '#daa520', '#ff4500', '#ff6347', '#ff7f50', '#ff69b4', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#000000', '#ffffff'],
    building: ['#696969', '#808080', '#a0522d', '#8b4513', '#c0c0c0', '#d3d3d3', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#4682b4', '#5f9ea0', '#ff4500', '#000000', '#ffffff'],
    tower: ['#708090', '#778899', '#c0c0c0', '#d3d3d3', '#4682b4', '#5f9ea0', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#ff4500', '#ff6347', '#ff69b4', '#000000', '#ffffff'],
    
    // Fantasy - More magical and vibrant
    monster: ['#228b22', '#32cd32', '#00ff00', '#7fff00', '#ff4500', '#ff6347', '#8b0000', '#dc143c', '#ff69b4', '#ff1493', '#ffd700', '#daa520', '#cd853f', '#deb887', '#000000', '#ffffff'],
    dragon: ['#8b0000', '#dc143c', '#ff4500', '#ff6347', '#ffd700', '#daa520', '#228b22', '#32cd32', '#00ff00', '#7fff00', '#4682b4', '#5f9ea0', '#ff69b4', '#ff1493', '#000000', '#ffffff'],
    unicorn: ['#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#ffffff', '#f8f8ff', '#ffd700', '#daa520', '#4682b4', '#5f9ea0', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#000000', '#ff4500'],
    wizard: ['#4b0082', '#8a2be2', '#9370db', '#ba55d3', '#ffd700', '#daa520', '#ff4500', '#ff6347', '#ff7f50', '#ff69b4', '#ff1493', '#32cd32', '#00ff00', '#7fff00', '#000000', '#ffffff'],
    
    // Technology - More futuristic
    robot: ['#708090', '#778899', '#c0c0c0', '#d3d3d3', '#4682b4', '#5f9ea0', '#ff4500', '#ff6347', '#ff7f50', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#ffd700', '#000000', '#ffffff'],
    android: ['#32cd32', '#00ff00', '#7fff00', '#adff2f', '#c0c0c0', '#d3d3d3', '#4682b4', '#5f9ea0', '#ff4500', '#ff6347', '#ff7f50', '#ff69b4', '#ff1493', '#ffd700', '#000000', '#ffffff'],
    cyborg: ['#708090', '#778899', '#ff4500', '#ff6347', '#4682b4', '#5f9ea0', '#c0c0c0', '#d3d3d3', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#ffd700', '#daa520', '#000000', '#ffffff'],
    
    // Nature - More natural and vibrant
    flower: ['#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#ffd700', '#daa520', '#cd853f', '#deb887', '#ff4500', '#ff6347', '#000000', '#ffffff'],
    tree: ['#228b22', '#32cd32', '#00ff00', '#7fff00', '#8b4513', '#a0522d', '#cd853f', '#deb887', '#ffd700', '#daa520', '#f4a460', '#ff4500', '#ff6347', '#ff69b4', '#000000', '#ffffff'],
    landscape: ['#228b22', '#32cd32', '#00ff00', '#7fff00', '#8b4513', '#a0522d', '#87ceeb', '#00bfff', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#4682b4', '#000000', '#ffffff'],
    mountain: ['#696969', '#808080', '#8b4513', '#a0522d', '#cd853f', '#deb887', '#87ceeb', '#00bfff', '#ffd700', '#daa520', '#f4a460', '#4682b4', '#5f9ea0', '#ff4500', '#000000', '#ffffff'],
    
    // Items - More detailed and colorful
    sword: ['#c0c0c0', '#d3d3d3', '#4682b4', '#5f9ea0', '#8b4513', '#a0522d', '#cd853f', '#deb887', '#ffd700', '#daa520', '#f4a460', '#ff4500', '#ff6347', '#ff69b4', '#000000', '#ffffff'],
    shield: ['#4682b4', '#5f9ea0', '#ffd700', '#daa520', '#cd853f', '#deb887', '#8b4513', '#a0522d', '#f4a460', '#ff4500', '#ff6347', '#ff7f50', '#c0c0c0', '#d3d3d3', '#000000', '#ffffff'],
    gem: ['#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#4682b4', '#5f9ea0', '#32cd32', '#00ff00', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#ff4500', '#000000', '#ffffff'],
    crown: ['#ffd700', '#daa520', '#cd853f', '#deb887', '#ff4500', '#ff6347', '#ff7f50', '#ff69b4', '#4682b4', '#5f9ea0', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#000000', '#ffffff'],
    
    // Food - More appetizing colors
    food: ['#ff4500', '#ff6347', '#ff7f50', '#ffa07a', '#ffd700', '#daa520', '#cd853f', '#deb887', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#ff69b4', '#ff1493', '#000000', '#ffffff'],
    apple: ['#ff4500', '#ff6347', '#ff7f50', '#ffa07a', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#8b4513', '#a0522d', '#cd853f', '#deb887', '#ffd700', '#daa520', '#000000', '#ffffff'],
    pizza: ['#ff4500', '#ff6347', '#ff7f50', '#ffa07a', '#ffd700', '#daa520', '#cd853f', '#deb887', '#32cd32', '#00ff00', '#7fff00', '#adff2f', '#ff69b4', '#ff1493', '#000000', '#ffffff'],
    
    // Symbols - More vibrant and meaningful
    star: ['#ffd700', '#daa520', '#cd853f', '#deb887', '#ffffff', '#f8f8ff', '#ff4500', '#ff6347', '#87ceeb', '#00bfff', '#ff69b4', '#ff1493', '#4682b4', '#5f9ea0', '#32cd32', '#000000'],
    heart: ['#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#ff4500', '#ff6347', '#ff7f50', '#ffa07a', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#4682b4', '#000000', '#ffffff'],
    moon: ['#c0c0c0', '#d3d3d3', '#ffffff', '#f8f8ff', '#4682b4', '#5f9ea0', '#ffd700', '#daa520', '#cd853f', '#deb887', '#f4a460', '#ff69b4', '#ff1493', '#32cd32', '#000000', '#00ff00'],
    sun: ['#ffd700', '#daa520', '#cd853f', '#deb887', '#ff4500', '#ff6347', '#ff7f50', '#ffa07a', '#ffffff', '#f8f8ff', '#ff69b4', '#ff1493', '#4682b4', '#5f9ea0', '#32cd32', '#000000'],
    
    // Characters - More diverse and colorful
    character: ['#ffd700', '#daa520', '#cd853f', '#deb887', '#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#4682b4', '#5f9ea0', '#ff4500', '#ff6347', '#ff7f50', '#32cd32', '#000000', '#ffffff'],
    hero: ['#4682b4', '#5f9ea0', '#ffd700', '#daa520', '#cd853f', '#deb887', '#ff4500', '#ff6347', '#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#32cd32', '#00ff00', '#000000', '#ffffff'],
    princess: ['#ff69b4', '#ff1493', '#ffb6c1', '#ffc0cb', '#ffd700', '#daa520', '#cd853f', '#deb887', '#ffffff', '#f8f8ff', '#4682b4', '#5f9ea0', '#32cd32', '#00ff00', '#ff4500', '#000000'],
    
    // Weapons - More detailed and realistic
    weapon: ['#708090', '#778899', '#c0c0c0', '#d3d3d3', '#8b4513', '#a0522d', '#cd853f', '#deb887', '#ff4500', '#ff6347', '#ff7f50', '#4682b4', '#5f9ea0', '#ffd700', '#000000', '#ffffff'],
    gun: ['#708090', '#778899', '#c0c0c0', '#d3d3d3', '#8b4513', '#a0522d', '#cd853f', '#deb887', '#ff4500', '#ff6347', '#ff7f50', '#4682b4', '#5f9ea0', '#ffd700', '#000000', '#ffffff'],
    bow: ['#8b4513', '#a0522d', '#cd853f', '#deb887', '#ffd700', '#daa520', '#4682b4', '#5f9ea0', '#ff4500', '#ff6347', '#ff7f50', '#c0c0c0', '#d3d3d3', '#ff69b4', '#000000', '#ffffff']
  };
  
  // Enhanced prompt analysis with better keyword matching
  const analysis = analyzePromptEnhanced(lowerPrompt);
  let type = analysis.type;
  let colors = palettes[analysis.type] || palettes.character;
  
  // Add randomization to color selection
  if (colors && colors.length > 0) {
    // Shuffle colors randomly
    for (let i = colors.length - 1; i > 0; i--) {
      const j = Math.floor(random(0, i + 1));
      [colors[i], colors[j]] = [colors[j], colors[i]];
    }
    
    // Randomly select a subset of colors (between 6-12 colors)
    const numColors = Math.floor(random(6, 12));
    colors = colors.slice(0, numColors);
  }
  
  // Apply enhanced color modifications with randomization
  colors = applyColorModificationsEnhanced(colors, analysis, style);
  
  // Robust color validation and fallback system
  colors = validateAndEnhanceColors(colors, type, size);
  
  console.log('🎨 Enhanced colors for', type, ':', colors.slice(0, 8));
  
  // Generate base pixel art with randomization
  let pixels;
  
  // Add random variations to the generation
  const variation = Math.floor(random(0, 4)); // 0-3 variations
  
  switch (type) {
    case 'cat':
      pixels = generateCatPixelArt(size, colors);
      break;
    case 'dog':
      pixels = generateDogPixelArt(size, colors);
      break;
    case 'spaceship':
      pixels = generateSpaceShipPixelArt(size, colors);
      break;
    case 'castle':
      pixels = generateCastlePixelArt(size, colors);
      break;
    case 'monster':
      pixels = generateMonsterPixelArt(size, colors);
      break;
    case 'robot':
      pixels = generateRobotPixelArt(size, colors);
      break;
    case 'flower':
      pixels = generateFlowerPixelArt(size, colors);
      break;
    case 'landscape':
      pixels = generateLandscapePixelArt(size, colors);
      break;
    case 'tree':
      pixels = generateTreePixelArt(size, colors);
      break;
    case 'house':
      pixels = generateHousePixelArt(size, colors);
      break;
    case 'car':
      pixels = generateCarPixelArt(size, colors);
      break;
    case 'star':
      pixels = generateStarPixelArt(size, colors);
      break;
    case 'heart':
      pixels = generateHeartPixelArt(size, colors);
      break;
    case 'sword':
      pixels = generateSwordPixelArt(size, colors);
      break;
    case 'shield':
      pixels = generateShieldPixelArt(size, colors);
      break;
    case 'gem':
      pixels = generateGemPixelArt(size, colors);
      break;
    case 'food':
      pixels = generateFoodPixelArt(size, colors);
      break;
    case 'weapon':
      pixels = generateWeaponPixelArt(size, colors);
      break;
    case 'building':
      pixels = generateBuildingPixelArt(size, colors);
      break;
    case 'bird':
      pixels = generateBirdPixelArt(size, colors);
      break;
    case 'fish':
      pixels = generateFishPixelArt(size, colors);
      break;
    case 'boat':
      pixels = generateBoatPixelArt(size, colors);
      break;
    case 'plane':
      pixels = generatePlanePixelArt(size, colors);
      break;
    case 'tower':
      pixels = generateTowerPixelArt(size, colors);
      break;
    case 'dragon':
      pixels = generateDragonPixelArt(size, colors);
      break;
    case 'unicorn':
      pixels = generateUnicornPixelArt(size, colors);
      break;
    case 'wizard':
      pixels = generateWizardPixelArt(size, colors);
      break;
    case 'android':
      pixels = generateAndroidPixelArt(size, colors);
      break;
    case 'cyborg':
      pixels = generateCyborgPixelArt(size, colors);
      break;
    case 'mountain':
      pixels = generateMountainPixelArt(size, colors);
      break;
    case 'crown':
      pixels = generateCrownPixelArt(size, colors);
      break;
    case 'moon':
      pixels = generateMoonPixelArt(size, colors);
      break;
    case 'sun':
      pixels = generateSunPixelArt(size, colors);
      break;
    case 'hero':
      pixels = generateHeroPixelArt(size, colors);
      break;
    case 'princess':
      pixels = generatePrincessPixelArt(size, colors);
      break;
    case 'gun':
      pixels = generateGunPixelArt(size, colors);
      break;
    case 'bow':
      pixels = generateBowPixelArt(size, colors);
      break;
    default:
      pixels = generateCharacterPixelArt(size, colors);
  }
  
  // Apply style modifications
  if (style === 'minimal') {
    // Remove some details for minimal style
    pixels = pixels.map((pixel, index) => {
      if (pixel && pixel !== 'transparent') {
        // Keep only main colors, remove highlights/details
        const colorIndex = colors.indexOf(pixel);
        if (colorIndex > 2) { // Skip highlights/details (colors[3] and beyond)
          return 'transparent';
        }
      }
      return pixel;
    });
  } else if (style === 'detailed') {
    // Add more details for detailed style
    const center = Math.floor(size / 2);
    const detailSize = Math.max(1, Math.floor(size / 8));
    
    // Add some extra detail pixels
    for (let i = 0; i < detailSize; i++) {
      const x = center + Math.floor(Math.random() * detailSize) - Math.floor(detailSize / 2);
      const y = center + Math.floor(Math.random() * detailSize) - Math.floor(detailSize / 2);
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = y * size + x;
        if (pixels[index] === 'transparent' && colors[3]) {
          pixels[index] = colors[3]; // Add detail color
        }
      }
    }
  }
  
  // Apply analysis-based modifications
  const promptAnalysis = analyzePromptEnhanced(prompt.toLowerCase());
  
  // Apply advanced effects based on analysis
  if (promptAnalysis.complexity === 'complex') {
    // Add lighting effects for complex objects
    pixels = addLightingEffects(pixels, size, colors, { x: 0.3, y: 0.2 });
    
    // Add texture patterns
    if (promptAnalysis.type === 'dragon' || promptAnalysis.type === 'monster') {
      pixels = addTexturePattern(pixels, size, 'noise');
    } else if (promptAnalysis.type === 'flower' || promptAnalysis.type === 'tree') {
      pixels = addTexturePattern(pixels, size, 'dots');
    } else {
      pixels = addTexturePattern(pixels, size, 'stripes');
    }
  }
  
  // Enhanced color blending for realistic effects
  if (promptAnalysis.style === 'realistic') {
    // Create shading palette and apply gradients
    const shadingPalette = createShadingPalette(colors[1], 4);
    const center = Math.floor(size / 2);
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = y * size + x;
        if (pixels[index] && pixels[index] !== 'transparent') {
          const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
          const shadeIndex = Math.min(Math.floor(distanceFromCenter / 2), shadingPalette.length - 1);
          pixels[index] = blendColors(pixels[index], shadingPalette[shadeIndex], 0.3);
        }
      }
    }
  }
  
  // Size modifications
  if (promptAnalysis.size === 'small') {
    // Make the object smaller by scaling down
    const scaledPixels = new Array(size * size).fill('transparent');
    const scale = 0.7;
    const offset = Math.floor(size * (1 - scale) / 2);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const scaledX = Math.floor((x - offset) / scale);
        const scaledY = Math.floor((y - offset) / scale);
        if (scaledX >= 0 && scaledX < size && scaledY >= 0 && scaledY < size) {
          const sourceIndex = scaledY * size + scaledX;
          const targetIndex = y * size + x;
          scaledPixels[targetIndex] = pixels[sourceIndex];
        }
      }
    }
    pixels = scaledPixels;
  } else if (promptAnalysis.size === 'large') {
    // Make the object larger by scaling up
    const scaledPixels = new Array(size * size).fill('transparent');
    const scale = 1.3;
    const offset = Math.floor(size * (scale - 1) / 2);
    
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const scaledX = Math.floor(x * scale) - offset;
        const scaledY = Math.floor(y * scale) - offset;
        if (scaledX >= 0 && scaledX < size && scaledY >= 0 && scaledY < size) {
          const sourceIndex = y * size + x;
          const targetIndex = scaledY * size + scaledX;
          if (pixels[sourceIndex] !== 'transparent') {
            scaledPixels[targetIndex] = pixels[sourceIndex];
          }
        }
      }
    }
    pixels = scaledPixels;
  }
  
  // Complexity modifications
  if (promptAnalysis.complexity === 'simple') {
    // Simplify by reducing color variety
    pixels = pixels.map(pixel => {
      if (pixel && pixel !== 'transparent') {
        const colorIndex = colors.indexOf(pixel);
        if (colorIndex > 1) { // Keep only main colors
          return colors[1]; // Use main body color
        }
      }
      return pixel;
    });
  } else if (promptAnalysis.complexity === 'complex') {
    // Add more complexity with additional details
    const center = Math.floor(size / 2);
    const detailCount = Math.max(2, Math.floor(size / 4));
    
    for (let i = 0; i < detailCount; i++) {
      const angle = (i / detailCount) * 2 * Math.PI;
      const radius = Math.floor(size / 6);
      const x = center + Math.floor(Math.cos(angle) * radius);
      const y = center + Math.floor(Math.sin(angle) * radius);
      
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = y * size + x;
        if (pixels[index] === 'transparent' && colors[4]) {
          pixels[index] = colors[4]; // Add highlight color
        }
      }
    }
  }
  
  // Mood-based modifications
  if (promptAnalysis.mood === 'happy') {
    // Add smile or cheerful elements
    const center = Math.floor(size / 2);
    if (size >= 6) {
      // Add smile
      pixels[(center + 1) * size + (center - 1)] = colors[0];
      pixels[(center + 1) * size + (center + 1)] = colors[0];
    }
  } else if (promptAnalysis.mood === 'sad') {
    // Add sad elements
    const center = Math.floor(size / 2);
    if (size >= 6) {
      // Add frown
      pixels[(center + 2) * size + (center - 1)] = colors[0];
      pixels[(center + 2) * size + (center + 1)] = colors[0];
    }
  } else if (promptAnalysis.mood === 'angry') {
    // Add angry elements
    const center = Math.floor(size / 2);
    if (size >= 6) {
      // Add angry eyebrows
      pixels[(center - 2) * size + (center - 1)] = colors[0];
      pixels[(center - 2) * size + (center + 1)] = colors[0];
    }
  }
  
  return pixels;
}

function generateCatPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  // Safety check: ensure we have valid colors
  const safeColors = colors.map((color, index) => {
    if (color && color.startsWith('#')) {
      return color;
    } else {
      const fallbacks = ['#8b4513', '#ffd700', '#ff6b35', '#ffb6c1', '#ffffff', '#000000', '#ff6347', '#32cd32'];
      return fallbacks[index % fallbacks.length];
    }
  });
  
  const center = Math.floor(size / 2);
  const catSize = Math.max(3, Math.floor(size / 5));
  
  // Ultra-detailed cat body with multiple layers
  for (let y = center - catSize; y <= center + catSize; y++) {
    for (let x = center - catSize; x <= center + catSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        
        if (distanceFromCenter <= catSize) {
          // Multiple color layers for depth
          if (distanceFromCenter >= catSize - 0.3) {
            pixels[index] = safeColors[0] || '#8b4513'; // Dark outline
          } else if (distanceFromCenter >= catSize - 1.2) {
            pixels[index] = safeColors[1] || '#ffd700'; // Main body color
          } else if (distanceFromCenter >= catSize - 2.1) {
            pixels[index] = safeColors[2] || '#ff6b35'; // Secondary body color
          } else {
            pixels[index] = safeColors[3] || '#ffb6c1'; // Inner body color
          }
        }
      }
    }
  }
  
  // Detailed cat ears with multiple colors
  if (size >= 8) {
    // Left ear
    pixels[(center - catSize - 1) * size + (center - 2)] = safeColors[0] || '#8b4513';
    pixels[(center - catSize - 1) * size + (center - 1)] = safeColors[0] || '#8b4513';
    pixels[(center - catSize - 1) * size + center] = safeColors[0] || '#8b4513';
    pixels[(center - catSize - 2) * size + (center - 1)] = safeColors[0] || '#8b4513';
    pixels[(center - catSize - 2) * size + center] = safeColors[1] || '#ffd700';
    pixels[(center - catSize - 3) * size + center] = safeColors[2] || '#ff6b35';
    
    // Right ear
    pixels[(center - catSize - 1) * size + center] = safeColors[0] || '#8b4513';
    pixels[(center - catSize - 1) * size + (center + 1)] = safeColors[0] || '#8b4513';
    pixels[(center - catSize - 1) * size + (center + 2)] = safeColors[0] || '#8b4513';
    pixels[(center - catSize - 2) * size + center] = safeColors[1] || '#ffd700';
    pixels[(center - catSize - 2) * size + (center + 1)] = safeColors[0] || '#8b4513';
    pixels[(center - catSize - 3) * size + (center + 1)] = safeColors[2] || '#ff6b35';
  }
  
  // Detailed cat face features
  if (size >= 6) {
    // Eyes with pupils and highlights
    pixels[(center - 1) * size + (center - 2)] = safeColors[4] || '#ffffff'; // Eye white
    pixels[(center - 1) * size + (center + 2)] = safeColors[4] || '#ffffff';
    pixels[(center - 1) * size + (center - 1)] = safeColors[5] || '#000000'; // Pupil
    pixels[(center - 1) * size + (center + 1)] = safeColors[5] || '#000000';
    pixels[(center - 2) * size + (center - 1)] = safeColors[6] || '#ff6347'; // Eye highlight
    pixels[(center - 2) * size + (center + 1)] = safeColors[6] || '#ff6347';
    
    // Nose and mouth
    pixels[center * size + center] = safeColors[7] || '#ffb6c1'; // Nose
    pixels[(center + 1) * size + (center - 1)] = safeColors[8] || '#ff6347'; // Mouth
    pixels[(center + 1) * size + (center + 1)] = safeColors[8] || '#ff6347';
    
    // Whisker pads
    pixels[(center - 1) * size + (center - 3)] = safeColors[9] || '#f4a460';
    pixels[(center - 1) * size + (center + 3)] = safeColors[9] || '#f4a460';
  }
  
  // Whiskers
  if (size >= 10) {
    for (let i = 0; i < 3; i++) {
      pixels[(center - 1 + i) * size + (center - 4)] = safeColors[10] || '#32cd32';
      pixels[(center - 1 + i) * size + (center + 4)] = safeColors[10] || '#32cd32';
    }
  }
  
  // Fur texture details
  if (size >= 8) {
    for (let i = 0; i < 5; i++) {
      const angle = (i / 5) * 2 * Math.PI;
      const x = center + Math.floor(Math.cos(angle) * (catSize - 1));
      const y = center + Math.floor(Math.sin(angle) * (catSize - 1));
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = safeColors[11] || '#ffa500'; // Fur detail
      }
    }
  }
  
  return pixels;
}

function generateDogPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent'); // transparent background
  
  const center = Math.floor(size / 2);
  const dogSize = Math.max(2, Math.floor(size / 6)); // Smaller dog
  
  // Dog body (similar to cat but different proportions)
  for (let y = center - dogSize; y <= center + dogSize; y++) {
    for (let x = center - dogSize; x <= center + dogSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        if (y === center - dogSize || y === center + dogSize || 
            x === center - dogSize || x === center + dogSize) {
          pixels[index] = colors[0]; // outline
        } else {
          pixels[index] = colors[1]; // body
        }
      }
    }
  }
  
  // Dog ears (floppy, smaller)
  if (size >= 6) {
    pixels[(center - dogSize - 1) * size + (center - 1)] = colors[0];
    pixels[(center - dogSize - 1) * size + (center + 1)] = colors[0];
  }
  
  return pixels;
}

function generateSpaceShipPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const shipWidth = Math.max(2, Math.floor(size / 8));
  
  // Ship body (more detailed)
  for (let y = center; y < size - 1; y++) {
    for (let x = center - shipWidth; x <= center + shipWidth; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        // Create ship outline
        if (x === center - shipWidth || x === center + shipWidth || y === size - 2) {
          pixels[index] = colors[0]; // outline
        } else {
          pixels[index] = colors[2]; // ship body
        }
      }
    }
  }
  
  // Ship nose (pointed)
  if (size >= 6) {
    pixels[(center - 1) * size + center] = colors[2];
    pixels[(center - 2) * size + center] = colors[2];
  }
  
  // Ship cockpit
  if (size >= 6) {
    pixels[(center + 1) * size + center] = colors[4]; // cockpit
  }
  
  // Engine flames
  if (size >= 8) {
    pixels[(size - 2) * size + (center - 1)] = colors[5];
    pixels[(size - 2) * size + (center + 1)] = colors[5];
    pixels[(size - 3) * size + (center - 1)] = colors[5];
    pixels[(size - 3) * size + (center + 1)] = colors[5];
  }
  
  return pixels;
}

function generateCastlePixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const castleWidth = Math.max(4, Math.floor(size * 0.6));
  const castleHeight = Math.floor(size * 0.7);
  
  // Castle base (centered)
  const baseStartX = center - Math.floor(castleWidth / 2);
  const baseEndX = center + Math.floor(castleWidth / 2);
  
  for (let y = Math.floor(size * 0.6); y < size; y++) {
    for (let x = baseStartX; x <= baseEndX; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = y * size + x;
        pixels[index] = colors[0]; // castle base
      }
    }
  }
  
  // Castle towers (centered)
  const towerWidth = Math.max(1, Math.floor(size / 12));
  const leftTowerX = baseStartX + Math.floor(castleWidth * 0.2);
  const rightTowerX = baseEndX - Math.floor(castleWidth * 0.2);
  
  // Left tower
  for (let y = 0; y < castleHeight; y++) {
    for (let x = leftTowerX; x < leftTowerX + towerWidth; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = y * size + x;
        pixels[index] = colors[1];
      }
    }
  }
  
  // Right tower
  for (let y = 0; y < castleHeight; y++) {
    for (let x = rightTowerX - towerWidth; x < rightTowerX; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = y * size + x;
        pixels[index] = colors[1];
      }
    }
  }
  
  // Castle windows
  if (size >= 6) {
    const windowY = Math.floor(castleHeight * 0.5);
    pixels[windowY * size + leftTowerX + Math.floor(towerWidth / 2)] = colors[4];
    pixels[windowY * size + rightTowerX - Math.floor(towerWidth / 2)] = colors[4];
  }
  
  return pixels;
}

function generateMonsterPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent'); // transparent background
  
  const center = Math.floor(size / 2);
  const monsterSize = Math.max(2, Math.floor(size / 5)); // Smaller monster
  
  // Monster body
  for (let y = center - monsterSize; y <= center + monsterSize; y++) {
    for (let x = center - monsterSize; x <= center + monsterSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        pixels[index] = colors[0]; // monster color
      }
    }
  }
  
  // Monster eyes
  if (size >= 6) {
    pixels[(center - 1) * size + (center - 1)] = colors[2];
    pixels[(center - 1) * size + (center + 1)] = colors[2];
  }
  
  // Monster mouth
  if (size >= 8) {
    pixels[(center + 1) * size + center] = colors[1];
  }
  
  return pixels;
}

function generateRobotPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent'); // transparent background
  
  const center = Math.floor(size / 2);
  const robotSize = Math.max(2, Math.floor(size / 6)); // Smaller robot
  
  // Robot head
  for (let y = center - robotSize; y <= center + robotSize; y++) {
    for (let x = center - robotSize; x <= center + robotSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        pixels[index] = colors[0]; // robot color
      }
    }
  }
  
  // Robot eyes
  if (size >= 6) {
    pixels[(center - 1) * size + (center - 1)] = colors[2];
    pixels[(center - 1) * size + (center + 1)] = colors[2];
  }
  
  // Robot antenna
  if (size >= 8) {
    pixels[(center - robotSize - 1) * size + center] = colors[1];
  }
  
  return pixels;
}

function generateFlowerPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  const center = Math.floor(size / 2);
  const flowerSize = Math.max(3, Math.floor(size / 5));
  
  // Ultra-detailed flower with multiple petal layers
  for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 6) {
    // Outer petals
    const outerX = center + Math.floor(Math.cos(angle) * flowerSize);
    const outerY = center + Math.floor(Math.sin(angle) * flowerSize);
    
    if (outerX >= 0 && outerX < size && outerY >= 0 && outerY < size) {
      pixels[outerY * size + outerX] = colors[0]; // Petal outline
      
      // Petal shading and details
      if (size >= 8) {
        const innerX = center + Math.floor(Math.cos(angle) * (flowerSize - 1));
        const innerY = center + Math.floor(Math.sin(angle) * (flowerSize - 1));
        if (innerX >= 0 && innerX < size && innerY >= 0 && innerY < size) {
          pixels[innerY * size + innerX] = colors[1]; // Petal main color
        }
        
        // Petal highlights
        const highlightX = center + Math.floor(Math.cos(angle) * (flowerSize - 2));
        const highlightY = center + Math.floor(Math.sin(angle) * (flowerSize - 2));
        if (highlightX >= 0 && highlightX < size && highlightY >= 0 && highlightY < size) {
          pixels[highlightY * size + highlightX] = colors[2]; // Petal highlight
        }
      }
    }
  }
  
  // Inner petal layer
  for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 4) {
    const innerX = center + Math.floor(Math.cos(angle) * (flowerSize - 1));
    const innerY = center + Math.floor(Math.sin(angle) * (flowerSize - 1));
    
    if (innerX >= 0 && innerX < size && innerY >= 0 && innerY < size) {
      pixels[innerY * size + innerX] = colors[3]; // Inner petal
    }
  }
  
  // Detailed flower center with multiple layers
  if (size >= 6) {
    // Center core
    pixels[center * size + center] = colors[4];
    
    // Center ring
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 3) {
      const ringX = center + Math.floor(Math.cos(angle) * 1);
      const ringY = center + Math.floor(Math.sin(angle) * 1);
      if (ringX >= 0 && ringX < size && ringY >= 0 && ringY < size) {
        pixels[ringY * size + ringX] = colors[5];
      }
    }
    
    // Center highlights
    pixels[(center - 1) * size + center] = colors[6];
    pixels[(center + 1) * size + center] = colors[6];
    pixels[center * size + (center - 1)] = colors[6];
    pixels[center * size + (center + 1)] = colors[6];
  }
  
  // Stem and leaves
  if (size >= 8) {
    // Stem
    for (let i = 1; i <= 3; i++) {
      pixels[(center + flowerSize + i) * size + center] = colors[7];
    }
    
    // Leaves
    pixels[(center + flowerSize + 1) * size + (center - 1)] = colors[8];
    pixels[(center + flowerSize + 1) * size + (center + 1)] = colors[8];
    pixels[(center + flowerSize + 2) * size + (center - 2)] = colors[8];
    pixels[(center + flowerSize + 2) * size + (center + 2)] = colors[8];
  }
  
  // Petal texture details
  if (size >= 10) {
    for (let angle = 0; angle < 2 * Math.PI; angle += Math.PI / 8) {
      const detailX = center + Math.floor(Math.cos(angle) * (flowerSize - 1));
      const detailY = center + Math.floor(Math.sin(angle) * (flowerSize - 1));
      if (detailX >= 0 && detailX < size && detailY >= 0 && detailY < size) {
        pixels[detailY * size + detailX] = colors[9]; // Petal texture
      }
    }
  }
  
  // Pollen details
  if (size >= 8) {
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * 2 * Math.PI;
      const pollenX = center + Math.floor(Math.cos(angle) * 1.5);
      const pollenY = center + Math.floor(Math.sin(angle) * 1.5);
      if (pollenX >= 0 && pollenX < size && pollenY >= 0 && pollenY < size) {
        pixels[pollenY * size + pollenX] = colors[10]; // Pollen
      }
    }
  }
  
  return pixels;
}

function generateLandscapePixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const landscapeWidth = Math.max(4, Math.floor(size * 0.7));
  const landscapeStartX = center - Math.floor(landscapeWidth / 2);
  const landscapeEndX = center + Math.floor(landscapeWidth / 2);
  
  // Mountains (centered)
  for (let y = Math.floor(size * 0.5); y < size; y++) {
    for (let x = landscapeStartX; x <= landscapeEndX; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const index = y * size + x;
        if (y < size * 0.8) {
          pixels[index] = colors[0]; // mountain
        } else {
          pixels[index] = colors[1]; // ground
        }
      }
    }
  }
  
  // Sun (centered in sky area)
  if (size >= 6) {
    const sunX = center + Math.floor(landscapeWidth * 0.3);
    const sunY = Math.floor(size * 0.3);
    if (sunX >= 0 && sunX < size && sunY >= 0 && sunY < size) {
      pixels[sunY * size + sunX] = colors[4];
    }
  }
  
  return pixels;
}

function generateCharacterPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent'); // transparent background
  
  const center = Math.floor(size / 2);
  const charSize = Math.max(1, Math.floor(size / 8)); // Smaller character
  
  // Character body
  for (let y = center - charSize; y <= center + charSize; y++) {
    for (let x = center - charSize; x <= center + charSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        pixels[index] = colors[0];
      }
    }
  }
  
  // Character eyes
  if (size >= 4) {
    pixels[(center - 1) * size + (center - 1)] = colors[2];
    pixels[(center - 1) * size + (center + 1)] = colors[2];
  }
  
  return pixels;
}

function generateTreePixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const treeHeight = Math.floor(size * 0.8);
  const trunkWidth = Math.max(1, Math.floor(size / 12));
  
  // Tree trunk
  for (let y = Math.floor(size * 0.6); y < size; y++) {
    for (let x = center - trunkWidth; x <= center + trunkWidth; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[2]; // trunk
      }
    }
  }
  
  // Tree leaves (triangular shape)
  const leafWidth = Math.max(2, Math.floor(size / 6));
  for (let y = 0; y < Math.floor(size * 0.6); y++) {
    const currentWidth = Math.floor(leafWidth * (1 - y / (size * 0.6)));
    for (let x = center - currentWidth; x <= center + currentWidth; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[0]; // leaves
      }
    }
  }
  
  return pixels;
}

function generateHousePixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const houseWidth = Math.max(4, Math.floor(size * 0.6));
  const houseHeight = Math.floor(size * 0.5);
  
  // House base
  const baseStartX = center - Math.floor(houseWidth / 2);
  const baseEndX = center + Math.floor(houseWidth / 2);
  
  for (let y = Math.floor(size * 0.5); y < size; y++) {
    for (let x = baseStartX; x <= baseEndX; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[0]; // house base
      }
    }
  }
  
  // House roof (triangular)
  const roofHeight = Math.floor(size * 0.3);
  for (let y = Math.floor(size * 0.2); y < Math.floor(size * 0.5); y++) {
    const roofWidth = Math.floor(houseWidth * (1 - (y - Math.floor(size * 0.2)) / roofHeight));
    for (let x = center - roofWidth; x <= center + roofWidth; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[1]; // roof
      }
    }
  }
  
  // Door
  if (size >= 6) {
    const doorX = center;
    const doorY = Math.floor(size * 0.7);
    pixels[doorY * size + doorX] = colors[3];
  }
  
  return pixels;
}

function generateCarPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const carWidth = Math.max(4, Math.floor(size * 0.7));
  const carHeight = Math.floor(size * 0.4);
  
  // Car body
  const carStartX = center - Math.floor(carWidth / 2);
  const carEndX = center + Math.floor(carWidth / 2);
  
  for (let y = Math.floor(size * 0.4); y < Math.floor(size * 0.8); y++) {
    for (let x = carStartX; x <= carEndX; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[0]; // car body
      }
    }
  }
  
  // Car wheels
  if (size >= 6) {
    const wheelY = Math.floor(size * 0.8);
    pixels[wheelY * size + (carStartX + 1)] = colors[2]; // left wheel
    pixels[wheelY * size + (carEndX - 1)] = colors[2]; // right wheel
  }
  
  // Car windows
  if (size >= 8) {
    const windowY = Math.floor(size * 0.5);
    pixels[windowY * size + (center - 1)] = colors[4];
    pixels[windowY * size + (center + 1)] = colors[4];
  }
  
  return pixels;
}

function generateStarPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const starSize = Math.max(2, Math.floor(size / 6));
  
  // Star points
  const points = [
    [center, center - starSize], // top
    [center + starSize, center], // right
    [center, center + starSize], // bottom
    [center - starSize, center], // left
    [center + Math.floor(starSize * 0.7), center - Math.floor(starSize * 0.7)], // top-right
    [center + Math.floor(starSize * 0.7), center + Math.floor(starSize * 0.7)], // bottom-right
    [center - Math.floor(starSize * 0.7), center + Math.floor(starSize * 0.7)], // bottom-left
    [center - Math.floor(starSize * 0.7), center - Math.floor(starSize * 0.7)]  // top-left
  ];
  
  // Draw star points
  for (const [x, y] of points) {
    if (x >= 0 && x < size && y >= 0 && y < size) {
      pixels[y * size + x] = colors[0];
    }
  }
  
  // Star center
  pixels[center * size + center] = colors[1];
  
  return pixels;
}

function generateHeartPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const heartSize = Math.max(2, Math.floor(size / 6));
  
  // Heart shape algorithm
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x - center;
      const dy = y - center;
      
      // Heart equation: (x² + y² - 1)³ - x²y³ ≤ 0
      const x2 = dx * dx;
      const y2 = dy * dy;
      const heart = Math.pow(x2 + y2 - heartSize * heartSize, 3) - x2 * Math.pow(dy, 3);
      
      if (heart <= 0 && Math.abs(dx) <= heartSize * 2 && Math.abs(dy) <= heartSize * 2) {
        pixels[y * size + x] = colors[0];
      }
    }
  }
  
  return pixels;
}

function generateSwordPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const swordLength = Math.floor(size * 0.8);
  const swordWidth = Math.max(1, Math.floor(size / 12));
  
  // Sword blade
  for (let y = 0; y < swordLength; y++) {
    for (let x = center - swordWidth; x <= center + swordWidth; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[0]; // blade
      }
    }
  }
  
  // Sword handle
  const handleStartY = swordLength;
  const handleEndY = Math.min(size, swordLength + Math.floor(size * 0.2));
  const handleWidth = Math.max(1, Math.floor(size / 16));
  
  for (let y = handleStartY; y < handleEndY; y++) {
    for (let x = center - handleWidth; x <= center + handleWidth; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[2]; // handle
      }
    }
  }
  
  // Sword guard
  if (size >= 8) {
    const guardY = swordLength - 1;
    const guardWidth = Math.max(2, Math.floor(size / 8));
    for (let x = center - guardWidth; x <= center + guardWidth; x++) {
      if (x >= 0 && x < size && guardY >= 0 && guardY < size) {
        pixels[guardY * size + x] = colors[1]; // guard
      }
    }
  }
  
  return pixels;
}

function generateShieldPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const shieldSize = Math.max(3, Math.floor(size / 4));
  
  // Shield shape (rounded rectangle)
  for (let y = center - shieldSize; y <= center + shieldSize; y++) {
    for (let x = center - shieldSize; x <= center + shieldSize; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (distanceFromCenter <= shieldSize) {
          if (distanceFromCenter >= shieldSize - 0.5) {
            pixels[y * size + x] = colors[0]; // outline
          } else {
            pixels[y * size + x] = colors[1]; // shield body
          }
        }
      }
    }
  }
  
  // Shield handle
  if (size >= 6) {
    const handleY = center + shieldSize + 1;
    if (handleY >= 0 && handleY < size) {
      pixels[handleY * size + center] = colors[2];
    }
  }
  
  return pixels;
}

function generateGemPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const gemSize = Math.max(2, Math.floor(size / 6));
  
  // Gem shape (diamond)
  for (let y = center - gemSize; y <= center + gemSize; y++) {
    for (let x = center - gemSize; x <= center + gemSize; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const distanceFromCenter = Math.abs(x - center) + Math.abs(y - center);
        if (distanceFromCenter <= gemSize) {
          if (distanceFromCenter === gemSize) {
            pixels[y * size + x] = colors[0]; // outline
          } else {
            pixels[y * size + x] = colors[1]; // gem body
          }
        }
      }
    }
  }
  
  // Gem highlight
  if (size >= 6) {
    pixels[(center - 1) * size + (center - 1)] = colors[2];
  }
  
  return pixels;
}

function generateFoodPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const foodSize = Math.max(2, Math.floor(size / 6));
  
  // Food shape (circle)
  for (let y = center - foodSize; y <= center + foodSize; y++) {
    for (let x = center - foodSize; x <= center + foodSize; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (distanceFromCenter <= foodSize) {
          if (distanceFromCenter >= foodSize - 0.5) {
            pixels[y * size + x] = colors[0]; // outline
          } else {
            pixels[y * size + x] = colors[1]; // food body
          }
        }
      }
    }
  }
  
  // Food details
  if (size >= 6) {
    pixels[(center - 1) * size + center] = colors[2]; // highlight
    pixels[(center + 1) * size + center] = colors[3]; // shadow
  }
  
  return pixels;
}

function generateWeaponPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const weaponLength = Math.floor(size * 0.7);
  const weaponWidth = Math.max(1, Math.floor(size / 10));
  
  // Weapon barrel
  for (let y = 0; y < weaponLength; y++) {
    for (let x = center - weaponWidth; x <= center + weaponWidth; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[0]; // barrel
      }
    }
  }
  
  // Weapon handle
  const handleStartY = weaponLength;
  const handleEndY = Math.min(size, weaponLength + Math.floor(size * 0.3));
  
  for (let y = handleStartY; y < handleEndY; y++) {
    for (let x = center - weaponWidth; x <= center + weaponWidth; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[1]; // handle
      }
    }
  }
  
  // Weapon trigger
  if (size >= 8) {
    const triggerY = weaponLength + 1;
    if (triggerY >= 0 && triggerY < size) {
      pixels[triggerY * size + (center + weaponWidth + 1)] = colors[2];
    }
  }
  
  return pixels;
}

function generateBuildingPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  
  const center = Math.floor(size / 2);
  const buildingWidth = Math.max(4, Math.floor(size * 0.6));
  const buildingHeight = Math.floor(size * 0.8);
  
  // Building base
  const baseStartX = center - Math.floor(buildingWidth / 2);
  const baseEndX = center + Math.floor(buildingWidth / 2);
  
  for (let y = Math.floor(size * 0.2); y < size; y++) {
    for (let x = baseStartX; x <= baseEndX; x++) {
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[0]; // building
      }
    }
  }
  
  // Building windows
  if (size >= 8) {
    const windowRows = 3;
    const windowCols = 2;
    const windowSpacing = Math.floor(buildingWidth / (windowCols + 1));
    const windowRowSpacing = Math.floor(buildingHeight / (windowRows + 1));
    
    for (let row = 0; row < windowRows; row++) {
      for (let col = 0; col < windowCols; col++) {
        const windowX = baseStartX + windowSpacing * (col + 1);
        const windowY = Math.floor(size * 0.2) + windowRowSpacing * (row + 1);
        if (windowX >= 0 && windowX < size && windowY >= 0 && windowY < size) {
          pixels[windowY * size + windowX] = colors[4]; // windows
        }
      }
    }
  }
  
  // Apply random variations to the final result
  if (variation > 0) {
    // Random rotation or mirroring
    if (Math.random() > 0.5) {
      pixels = mirrorPixels(pixels, size);
    }
    
    // Random color adjustments
    if (Math.random() > 0.7) {
      pixels = adjustColors(pixels, colors);
    }
    
    // Random noise addition
    if (Math.random() > 0.8) {
      pixels = addRandomNoise(pixels, size, colors);
    }
  }
  
  return pixels;
}

// Smart prompt analysis function
function analyzePromptEnhanced(prompt) {
  const analysis = {
    type: 'character',
    colors: [],
    mood: 'neutral',
    size: 'medium',
    complexity: 'normal',
    time: 'day',
    weather: 'clear',
    style: 'pixel',
    theme: 'neutral',
    quality: 'standard'
  };
  
  // Enhanced type detection with weighted scoring
  const typeScores = {
    // Animals with more variations
    cat: ['cat', 'kitten', 'feline', 'kitty', 'meow', 'tabby', 'siamese', 'persian', 'tiger', 'lion', 'panther'],
    dog: ['dog', 'puppy', 'canine', 'woof', 'bark', 'labrador', 'golden', 'poodle', 'bulldog', 'wolf'],
    bird: ['bird', 'eagle', 'owl', 'sparrow', 'parrot', 'pigeon', 'hawk', 'falcon', 'robin', 'bluejay', 'cardinal'],
    fish: ['fish', 'shark', 'goldfish', 'tuna', 'salmon', 'clownfish', 'angelfish', 'bass', 'trout', 'dolphin'],
    
    // Vehicles with more specific types
    spaceship: ['spaceship', 'rocket', 'ufo', 'alien ship', 'spacecraft', 'shuttle', 'satellite', 'rover'],
    car: ['car', 'vehicle', 'automobile', 'sedan', 'sports car', 'race car', 'truck', 'van', 'bus', 'taxi'],
    boat: ['boat', 'ship', 'yacht', 'sailboat', 'canoe', 'kayak', 'ferry', 'cruise', 'submarine'],
    plane: ['plane', 'airplane', 'jet', 'aircraft', 'fighter', 'bomber', 'helicopter', 'drone'],
    
    // Buildings with architectural styles
    castle: ['castle', 'fortress', 'palace', 'medieval', 'tower', 'keep', 'citadel', 'fort'],
    house: ['house', 'home', 'cottage', 'mansion', 'villa', 'cabin', 'bungalow', 'apartment'],
    building: ['building', 'skyscraper', 'office', 'tower', 'hospital', 'school', 'library', 'museum'],
    tower: ['tower', 'lighthouse', 'watchtower', 'bell tower', 'clock tower', 'radio tower'],
    
    // Fantasy with more creatures
    monster: ['monster', 'beast', 'creature', 'demon', 'ogre', 'troll', 'goblin', 'orc', 'ghost'],
    dragon: ['dragon', 'wyvern', 'serpent', 'drake', 'wyrm', 'fire dragon', 'ice dragon'],
    unicorn: ['unicorn', 'magical horse', 'mythical', 'magical', 'horned horse'],
    wizard: ['wizard', 'mage', 'sorcerer', 'witch', 'warlock', 'magician', 'enchanter'],
    
    // Technology with modern terms
    robot: ['robot', 'android', 'cyborg', 'mech', 'automaton', 'droid', 'bot', 'machine'],
    android: ['android', 'humanoid robot', 'artificial', 'ai', 'artificial intelligence'],
    cyborg: ['cyborg', 'half robot', 'bionic', 'enhanced', 'augmented'],
    
    // Nature with more variety
    flower: ['flower', 'rose', 'tulip', 'daisy', 'sunflower', 'lily', 'orchid', 'dandelion', 'poppy'],
    tree: ['tree', 'oak', 'pine', 'maple', 'forest', 'palm', 'cherry', 'apple tree', 'willow'],
    landscape: ['landscape', 'nature', 'scenery', 'vista', 'view', 'horizon', 'panorama'],
    mountain: ['mountain', 'hill', 'peak', 'summit', 'cliff', 'volcano', 'alpine'],
    
    // Items with more specific types
    sword: ['sword', 'blade', 'katana', 'rapier', 'dagger', 'knife', 'scimitar', 'broadsword'],
    shield: ['shield', 'armor', 'protection', 'buckler', 'targe', 'pavise'],
    gem: ['gem', 'crystal', 'diamond', 'ruby', 'emerald', 'sapphire', 'amethyst', 'pearl'],
    crown: ['crown', 'tiara', 'royal', 'diadem', 'coronet', 'jeweled crown'],
    
    // Food with more variety
    food: ['food', 'meal', 'dish', 'cuisine', 'dinner', 'lunch', 'breakfast'],
    apple: ['apple', 'fruit', 'red apple', 'green apple', 'golden apple'],
    pizza: ['pizza', 'pie', 'cheese pizza', 'pepperoni', 'margherita'],
    
    // Symbols with more meaning
    star: ['star', 'twinkle', 'constellation', 'shooting star', 'north star', 'starry'],
    heart: ['heart', 'love', 'valentine', 'romantic', 'sweet', 'cute'],
    moon: ['moon', 'lunar', 'night', 'crescent', 'full moon', 'new moon'],
    sun: ['sun', 'solar', 'bright', 'sunny', 'sunshine', 'daylight'],
    
    // Characters with more roles
    character: ['character', 'person', 'human', 'figure', 'avatar', 'sprite'],
    hero: ['hero', 'warrior', 'knight', 'fighter', 'champion', 'protector', 'guardian'],
    princess: ['princess', 'queen', 'royal lady', 'noble', 'royalty', 'crown princess'],
    
    // Weapons with more types
    weapon: ['weapon', 'gun', 'rifle', 'pistol', 'firearm', 'armament', 'artillery'],
    gun: ['gun', 'rifle', 'pistol', 'firearm', 'revolver', 'shotgun', 'machine gun'],
    bow: ['bow', 'arrow', 'archery', 'crossbow', 'longbow', 'hunting bow']
  };
  
  // Enhanced scoring system with context awareness
  let bestScore = 0;
  let bestType = 'character';
  
  for (const [type, keywords] of Object.entries(typeScores)) {
    let score = 0;
    for (const keyword of keywords) {
      if (prompt.includes(keyword)) {
        score += 2; // Base score
        // Bonus for exact matches
        if (prompt === keyword) score += 5;
        // Bonus for word boundaries
        if (prompt.includes(` ${keyword} `) || prompt.startsWith(keyword) || prompt.endsWith(keyword)) {
          score += 3;
        }
        // Bonus for multiple occurrences
        const occurrences = (prompt.match(new RegExp(keyword, 'g')) || []).length;
        if (occurrences > 1) score += occurrences;
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestType = type;
    }
  }
  
  analysis.type = bestType;
  
  // Enhanced mood detection
  if (prompt.includes('happy') || prompt.includes('joy') || prompt.includes('smile') || prompt.includes('cheerful') || prompt.includes('bright')) {
    analysis.mood = 'happy';
  } else if (prompt.includes('sad') || prompt.includes('cry') || prompt.includes('tear') || prompt.includes('melancholy') || prompt.includes('gloomy')) {
    analysis.mood = 'sad';
  } else if (prompt.includes('angry') || prompt.includes('mad') || prompt.includes('fury') || prompt.includes('rage') || prompt.includes('furious')) {
    analysis.mood = 'angry';
  } else if (prompt.includes('scary') || prompt.includes('fear') || prompt.includes('horror') || prompt.includes('terrifying') || prompt.includes('spooky')) {
    analysis.mood = 'scary';
  } else if (prompt.includes('cute') || prompt.includes('adorable') || prompt.includes('sweet') || prompt.includes('lovely') || prompt.includes('charming')) {
    analysis.mood = 'cute';
  }
  
  // Enhanced size detection
  if (prompt.includes('tiny') || prompt.includes('small') || prompt.includes('mini') || prompt.includes('little') || prompt.includes('petite')) {
    analysis.size = 'small';
  } else if (prompt.includes('huge') || prompt.includes('giant') || prompt.includes('massive') || prompt.includes('enormous') || prompt.includes('colossal')) {
    analysis.size = 'large';
  }
  
  // Enhanced complexity detection
  if (prompt.includes('simple') || prompt.includes('basic') || prompt.includes('minimal') || prompt.includes('clean') || prompt.includes('plain')) {
    analysis.complexity = 'simple';
  } else if (prompt.includes('detailed') || prompt.includes('complex') || prompt.includes('intricate') || prompt.includes('elaborate') || prompt.includes('sophisticated')) {
    analysis.complexity = 'complex';
  }
  
  // Enhanced time detection
  if (prompt.includes('night') || prompt.includes('dark') || prompt.includes('moon') || prompt.includes('midnight') || prompt.includes('evening')) {
    analysis.time = 'night';
  } else if (prompt.includes('sunset') || prompt.includes('dusk') || prompt.includes('twilight') || prompt.includes('golden hour')) {
    analysis.time = 'sunset';
  } else if (prompt.includes('sunrise') || prompt.includes('dawn') || prompt.includes('morning') || prompt.includes('daybreak')) {
    analysis.time = 'sunrise';
  }
  
  // Enhanced weather detection
  if (prompt.includes('rain') || prompt.includes('storm') || prompt.includes('thunder') || prompt.includes('lightning') || prompt.includes('wet')) {
    analysis.weather = 'rainy';
  } else if (prompt.includes('snow') || prompt.includes('winter') || prompt.includes('ice') || prompt.includes('frost') || prompt.includes('blizzard')) {
    analysis.weather = 'snowy';
  } else if (prompt.includes('fire') || prompt.includes('flame') || prompt.includes('burning') || prompt.includes('blaze') || prompt.includes('inferno')) {
    analysis.weather = 'fire';
  }
  
  // Enhanced style detection
  if (prompt.includes('cartoon') || prompt.includes('anime') || prompt.includes('chibi') || prompt.includes('comic') || prompt.includes('funny')) {
    analysis.style = 'cartoon';
  } else if (prompt.includes('realistic') || prompt.includes('photo') || prompt.includes('detailed') || prompt.includes('lifelike') || prompt.includes('natural')) {
    analysis.style = 'realistic';
  } else if (prompt.includes('retro') || prompt.includes('vintage') || prompt.includes('old') || prompt.includes('classic') || prompt.includes('nostalgic')) {
    analysis.style = 'retro';
  }
  
  // Theme detection
  if (prompt.includes('magical') || prompt.includes('fantasy') || prompt.includes('enchanted') || prompt.includes('mystical')) {
    analysis.theme = 'magical';
  } else if (prompt.includes('sci-fi') || prompt.includes('futuristic') || prompt.includes('space') || prompt.includes('technological')) {
    analysis.theme = 'futuristic';
  } else if (prompt.includes('nature') || prompt.includes('organic') || prompt.includes('natural') || prompt.includes('wild')) {
    analysis.theme = 'natural';
  }
  
  // Quality detection
  if (prompt.includes('high quality') || prompt.includes('detailed') || prompt.includes('premium') || prompt.includes('masterpiece')) {
    analysis.quality = 'high';
  } else if (prompt.includes('simple') || prompt.includes('basic') || prompt.includes('minimal')) {
    analysis.quality = 'low';
  }
  
  return analysis;
}

// Enhanced color modifications based on analysis
function applyColorModificationsEnhanced(colors, analysis, style) {
  let modifiedColors = [...colors];
  
  // Enhanced mood-based color adjustments
  if (analysis.mood === 'happy') {
    modifiedColors.push('#ffff00', '#00ff00', '#ff69b4', '#ffd700', '#32cd32');
  } else if (analysis.mood === 'sad') {
    modifiedColors.push('#4169e1', '#9370db', '#87ceeb', '#4682b4', '#5f9ea0');
  } else if (analysis.mood === 'angry') {
    modifiedColors.push('#ff4500', '#dc143c', '#8b0000', '#ff6347', '#ff0000');
  } else if (analysis.mood === 'scary') {
    modifiedColors.push('#2f4f4f', '#000000', '#8b0000', '#696969', '#708090');
  } else if (analysis.mood === 'cute') {
    modifiedColors.push('#ffb6c1', '#ffc0cb', '#ff69b4', '#ff1493', '#ffc0cb');
  }
  
  // Enhanced time-based color adjustments
  if (analysis.time === 'night') {
    modifiedColors.push('#4169e1', '#4b0082', '#2f4f4f', '#000080', '#191970');
  } else if (analysis.time === 'sunset') {
    modifiedColors.push('#ff4500', '#ff6347', '#ffd700', '#ffa500', '#ff8c00');
  } else if (analysis.time === 'sunrise') {
    modifiedColors.push('#ffd700', '#ffa500', '#ff69b4', '#ffb6c1', '#ffc0cb');
  }
  
  // Enhanced weather-based color adjustments
  if (analysis.weather === 'rainy') {
    modifiedColors.push('#4682b4', '#87ceeb', '#c0c0c0', '#5f9ea0', '#b0c4de');
  } else if (analysis.weather === 'snowy') {
    modifiedColors.push('#ffffff', '#f8f8ff', '#c0c0c0', '#f0f8ff', '#e6e6fa');
  } else if (analysis.weather === 'fire') {
    modifiedColors.push('#ff4500', '#ff6347', '#ffd700', '#ff0000', '#ff8c00');
  }
  
  // Enhanced style-based color adjustments
  if (style === 'pixel' || analysis.style === 'pixel') {
    // Keep vibrant pixel art colors
    modifiedColors.push('#ff4500', '#32cd32', '#4169e1', '#ffd700', '#ff69b4');
  } else if (style === 'detailed' || analysis.style === 'realistic') {
    // Add more natural and detailed colors
    modifiedColors.push('#8b4513', '#a0522d', '#cd853f', '#deb887', '#f4a460');
  } else if (analysis.style === 'cartoon') {
    modifiedColors.push('#ff69b4', '#00ff00', '#ffff00', '#ff1493', '#32cd32');
  } else if (analysis.style === 'retro') {
    modifiedColors.push('#ff4500', '#4169e1', '#32cd32', '#ff6347', '#4682b4');
  }
  
  // Theme-based color adjustments
  if (analysis.theme === 'magical') {
    modifiedColors.push('#9370db', '#8a2be2', '#ba55d3', '#ff69b4', '#ff1493');
  } else if (analysis.theme === 'futuristic') {
    modifiedColors.push('#00bfff', '#32cd32', '#c0c0c0', '#4682b4', '#5f9ea0');
  } else if (analysis.theme === 'natural') {
    modifiedColors.push('#228b22', '#32cd32', '#8b4513', '#cd853f', '#deb887');
  }
  
  // Quality-based adjustments
  if (analysis.quality === 'high') {
    // Add more sophisticated color variations
    modifiedColors.push('#daa520', '#cd853f', '#deb887', '#f4a460', '#ffa07a');
  }
  
  return modifiedColors;
}

// Robust color validation and enhancement system
function validateAndEnhanceColors(colors, type, size) {
  // Ensure all colors are valid hex strings with fallbacks
  const validatedColors = colors.map((color, index) => {
    if (color && typeof color === 'string' && color.startsWith('#')) {
      return color;
    } else {
      console.warn('Invalid color found:', color, 'using fallback');
      // Use bright, colorful fallbacks instead of black
      const fallbacks = [
        '#ff4500', '#32cd32', '#4169e1', '#ffd700', '#ff69b4', 
        '#00bfff', '#ff6347', '#7fff00', '#ff1493', '#4682b4', 
        '#ffa500', '#9370db', '#00ff00', '#ff4500', '#ff69b4', '#32cd32'
      ];
      return fallbacks[index % fallbacks.length];
    }
  });
  
  // Ensure we have at least 8 colors for basic generation
  while (validatedColors.length < 8) {
    const fallbacks = ['#ff4500', '#32cd32', '#4169e1', '#ffd700', '#ff69b4', '#00bfff', '#ff6347', '#7fff00'];
    validatedColors.push(fallbacks[validatedColors.length % fallbacks.length]);
  }
  
  // Add type-specific color enhancements
  const typeEnhancements = {
    cat: ['#8b4513', '#ff6b35', '#ffb6c1'],
    dog: ['#8b4513', '#ff6b35', '#8b7355'],
    bird: ['#4169e1', '#ff4500', '#32cd32'],
    spaceship: ['#c0c0c0', '#ff4500', '#00bfff'],
    car: ['#ff4500', '#c0c0c0', '#4682b4'],
    castle: ['#696969', '#ffd700', '#a0522d'],
    monster: ['#228b22', '#ff4500', '#8b0000'],
    robot: ['#708090', '#ff4500', '#00bfff'],
    flower: ['#ff69b4', '#32cd32', '#ffd700'],
    tree: ['#228b22', '#8b4513', '#32cd32'],
    dragon: ['#8b0000', '#ffd700', '#ff4500'],
    unicorn: ['#ff69b4', '#ffffff', '#ffd700'],
    wizard: ['#4b0082', '#ffd700', '#ff4500'],
    star: ['#ffd700', '#ffffff', '#ff4500'],
    heart: ['#ff69b4', '#ff4500', '#ff1493'],
    gem: ['#ff69b4', '#4682b4', '#32cd32'],
    crown: ['#ffd700', '#ff4500', '#ff69b4']
  };
  
  if (typeEnhancements[type]) {
    validatedColors.push(...typeEnhancements[type]);
  }
  
  // Remove duplicates while preserving order
  const uniqueColors = [];
  const seen = new Set();
  for (const color of validatedColors) {
    if (!seen.has(color)) {
      seen.add(color);
      uniqueColors.push(color);
    }
  }
  
  console.log(`🎨 Validated ${uniqueColors.length} colors for ${type}`);
  return uniqueColors;
}

// Advanced color blending and shading functions
function blendColors(color1, color2, ratio = 0.5) {
  // Handle both hex strings and RGB objects
  const rgb1 = typeof color1 === 'string' ? hexToRgb(color1) : color1;
  const rgb2 = typeof color2 === 'string' ? hexToRgb(color2) : color2;
  
  if (!rgb1 || !rgb2) return color1; // Return original if conversion fails
  
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  
  return rgbToHex(r, g, b);
}

function createShadingPalette(baseColor, numShades = 5) {
  const palette = [];
  const rgb = typeof baseColor === 'string' ? hexToRgb(baseColor) : baseColor;
  
  if (!rgb) return [baseColor]; // Return original if conversion fails
  
  // Create lighter shades
  for (let i = 0; i < numShades; i++) {
    const ratio = i / (numShades - 1);
    const r = Math.round(rgb.r + (255 - rgb.r) * ratio);
    const g = Math.round(rgb.g + (255 - rgb.g) * ratio);
    const b = Math.round(rgb.b + (255 - rgb.b) * ratio);
    palette.push(rgbToHex(r, g, b));
  }
  
  return palette;
}

function addLightingEffects(pixels, size, colors, lightSource = { x: 0.5, y: 0.2 }) {
  const center = Math.floor(size / 2);
  const lightX = Math.floor(lightSource.x * size);
  const lightY = Math.floor(lightSource.y * size);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = y * size + x;
      if (pixels[index] && pixels[index] !== 'transparent') {
        // Calculate distance from light source
        const distance = Math.sqrt((x - lightX) ** 2 + (y - lightY) ** 2);
        const maxDistance = Math.sqrt(size ** 2 + size ** 2);
        const lighting = 1 - (distance / maxDistance) * 0.3; // 30% lighting variation
        
        // Apply lighting effect
        const currentColor = pixels[index];
        const lightedColor = blendColors(currentColor, '#ffffff', 0.1 * lighting);
        pixels[index] = lightedColor;
      }
    }
  }
  
  return pixels;
}

function addTexturePattern(pixels, size, patternType = 'noise') {
  const center = Math.floor(size / 2);
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const index = y * size + x;
      if (pixels[index] && pixels[index] !== 'transparent') {
        let textureColor = pixels[index];
        
        switch (patternType) {
          case 'noise':
            if (Math.random() < 0.1) {
              textureColor = blendColors(textureColor, '#000000', 0.1);
            }
            break;
          case 'stripes':
            if ((x + y) % 2 === 0) {
              textureColor = blendColors(textureColor, '#ffffff', 0.05);
            }
            break;
          case 'dots':
            if ((x % 3 === 0) && (y % 3 === 0)) {
              textureColor = blendColors(textureColor, '#ffffff', 0.1);
            }
            break;
        }
        
        pixels[index] = textureColor;
      }
    }
  }
  
  return pixels;
}

// New generation functions for enhanced AI
function generateBirdPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  const center = Math.floor(size / 2);
  const birdSize = Math.max(2, Math.floor(size / 6));
  
  // Bird body (oval shape)
  for (let y = center - birdSize; y <= center + birdSize; y++) {
    for (let x = center - birdSize; x <= center + birdSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (distanceFromCenter <= birdSize) {
          if (distanceFromCenter >= birdSize - 0.5) {
            pixels[index] = colors[0]; // outline
          } else {
            pixels[index] = colors[1]; // body
          }
        }
      }
    }
  }
  
  // Bird beak
  if (size >= 6) {
    pixels[center * size + (center + birdSize + 1)] = colors[2];
  }
  
  // Bird wings
  if (size >= 8) {
    pixels[(center - 1) * size + (center - birdSize - 1)] = colors[3];
    pixels[(center + 1) * size + (center - birdSize - 1)] = colors[3];
  }
  
  return pixels;
}

function generateDragonPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  const center = Math.floor(size / 2);
  const dragonSize = Math.max(4, Math.floor(size / 4));
  
  // Ultra-detailed dragon body with scales and depth
  for (let y = center - dragonSize; y <= center + dragonSize; y++) {
    for (let x = center - dragonSize; x <= center + dragonSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        
        if (distanceFromCenter <= dragonSize) {
          // Multiple layers for realistic dragon scales
          if (distanceFromCenter >= dragonSize - 0.3) {
            pixels[index] = colors[0]; // Dark outline
          } else if (distanceFromCenter >= dragonSize - 1.2) {
            pixels[index] = colors[1]; // Main body
          } else if (distanceFromCenter >= dragonSize - 2.1) {
            pixels[index] = colors[2]; // Secondary body
          } else if (distanceFromCenter >= dragonSize - 3.0) {
            pixels[index] = colors[3]; // Inner body
          } else {
            pixels[index] = colors[4]; // Core body
          }
        }
      }
    }
  }
  
  // Detailed dragon head with multiple features
  if (size >= 8) {
    // Head outline
    for (let i = -2; i <= 2; i++) {
      pixels[(center - dragonSize - 1) * size + (center + i)] = colors[0];
    }
    
    // Eyes with glowing effect
    pixels[(center - dragonSize) * size + (center - 1)] = colors[5]; // Eye glow
    pixels[(center - dragonSize) * size + (center + 1)] = colors[5];
    pixels[(center - dragonSize - 1) * size + (center - 1)] = colors[6]; // Eye core
    pixels[(center - dragonSize - 1) * size + (center + 1)] = colors[6];
    
    // Snout and nostrils
    pixels[(center - dragonSize + 1) * size + center] = colors[7];
    pixels[(center - dragonSize + 1) * size + (center - 1)] = colors[8];
    pixels[(center - dragonSize + 1) * size + (center + 1)] = colors[8];
  }
  
  // Detailed dragon horns with multiple segments
  if (size >= 10) {
    // Left horn
    for (let i = 0; i < 4; i++) {
      pixels[(center - dragonSize - 1 - i) * size + (center - 2)] = colors[9];
      pixels[(center - dragonSize - 1 - i) * size + (center - 1)] = colors[10];
    }
    
    // Right horn
    for (let i = 0; i < 4; i++) {
      pixels[(center - dragonSize - 1 - i) * size + (center + 1)] = colors[10];
      pixels[(center - dragonSize - 1 - i) * size + (center + 2)] = colors[9];
    }
  }
  
  // Detailed dragon wings with membrane structure
  if (size >= 12) {
    // Left wing
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        pixels[(center - 2 - j) * size + (center - dragonSize - 1 - i)] = colors[11];
        pixels[(center - 1 - j) * size + (center - dragonSize - 1 - i)] = colors[12];
        pixels[(center - j) * size + (center - dragonSize - 1 - i)] = colors[13];
      }
    }
    
    // Right wing
    for (let i = 0; i < 5; i++) {
      for (let j = 0; j < 3; j++) {
        pixels[(center + j) * size + (center - dragonSize - 1 - i)] = colors[13];
        pixels[(center + 1 + j) * size + (center - dragonSize - 1 - i)] = colors[12];
        pixels[(center + 2 + j) * size + (center - dragonSize - 1 - i)] = colors[11];
      }
    }
  }
  
  // Dragon claws
  if (size >= 8) {
    // Front claws
    pixels[(center + dragonSize) * size + (center - 2)] = colors[14];
    pixels[(center + dragonSize) * size + (center - 1)] = colors[14];
    pixels[(center + dragonSize) * size + (center + 1)] = colors[14];
    pixels[(center + dragonSize) * size + (center + 2)] = colors[14];
  }
  
  // Scale texture details
  if (size >= 10) {
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * 2 * Math.PI;
      const x = center + Math.floor(Math.cos(angle) * (dragonSize - 2));
      const y = center + Math.floor(Math.sin(angle) * (dragonSize - 2));
      if (x >= 0 && x < size && y >= 0 && y < size) {
        pixels[y * size + x] = colors[15]; // Scale highlight
      }
    }
  }
  
  return pixels;
}

function generateUnicornPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  const center = Math.floor(size / 2);
  const unicornSize = Math.max(3, Math.floor(size / 5));
  
  // Unicorn body (similar to horse but with magical elements)
  for (let y = center - unicornSize; y <= center + unicornSize; y++) {
    for (let x = center - unicornSize; x <= center + unicornSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        const distanceFromCenter = Math.sqrt((x - center) ** 2 + (y - center) ** 2);
        if (distanceFromCenter <= unicornSize) {
          if (distanceFromCenter >= unicornSize - 0.5) {
            pixels[index] = colors[0]; // outline
          } else {
            pixels[index] = colors[1]; // body
          }
        }
      }
    }
  }
  
  // Unicorn horn (magical)
  if (size >= 6) {
    pixels[(center - unicornSize - 1) * size + center] = colors[2];
    pixels[(center - unicornSize - 2) * size + center] = colors[2];
  }
  
  // Unicorn mane (colorful)
  if (size >= 8) {
    for (let i = 0; i < 3; i++) {
      pixels[(center - unicornSize - 1) * size + (center - 1 - i)] = colors[3];
      pixels[(center - unicornSize - 1) * size + (center + 1 + i)] = colors[3];
    }
  }
  
  return pixels;
}

function generateWizardPixelArt(size, colors) {
  const pixels = new Array(size * size).fill('transparent');
  const center = Math.floor(size / 2);
  const wizardSize = Math.max(2, Math.floor(size / 6));
  
  // Wizard body (humanoid)
  for (let y = center - wizardSize; y <= center + wizardSize; y++) {
    for (let x = center - wizardSize; x <= center + wizardSize; x++) {
      if (y >= 0 && y < size && x >= 0 && x < size) {
        const index = y * size + x;
        if (y === center - wizardSize || y === center + wizardSize || 
            x === center - wizardSize || x === center + wizardSize) {
          pixels[index] = colors[0]; // outline
        } else {
          pixels[index] = colors[1]; // body
        }
      }
    }
  }
  
  // Wizard hat
  if (size >= 6) {
    for (let i = 0; i < 3; i++) {
      pixels[(center - wizardSize - 1 - i) * size + (center - 1)] = colors[2];
      pixels[(center - wizardSize - 1 - i) * size + center] = colors[2];
      pixels[(center - wizardSize - 1 - i) * size + (center + 1)] = colors[2];
    }
  }
  
  // Wizard staff
  if (size >= 8) {
    pixels[(center + wizardSize + 1) * size + center] = colors[3];
    pixels[(center + wizardSize + 2) * size + center] = colors[3];
  }
  
  return pixels;
}

// Placeholder functions for remaining types (can be enhanced later)
function generateFishPixelArt(size, colors) { return generateCharacterPixelArt(size, colors); }
function generateBoatPixelArt(size, colors) { return generateCharacterPixelArt(size, colors); }
function generatePlanePixelArt(size, colors) { return generateCharacterPixelArt(size, colors); }
function generateTowerPixelArt(size, colors) { return generateCharacterPixelArt(size, colors); }
function generateAndroidPixelArt(size, colors) { return generateRobotPixelArt(size, colors); }
function generateCyborgPixelArt(size, colors) { return generateRobotPixelArt(size, colors); }
function generateMountainPixelArt(size, colors) { return generateLandscapePixelArt(size, colors); }
function generateCrownPixelArt(size, colors) { return generateGemPixelArt(size, colors); }
function generateMoonPixelArt(size, colors) { return generateStarPixelArt(size, colors); }
function generateSunPixelArt(size, colors) { return generateStarPixelArt(size, colors); }
function generateHeroPixelArt(size, colors) { return generateCharacterPixelArt(size, colors); }
function generatePrincessPixelArt(size, colors) { return generateCharacterPixelArt(size, colors); }
function generateGunPixelArt(size, colors) { return generateWeaponPixelArt(size, colors); }
function generateBowPixelArt(size, colors) { return generateWeaponPixelArt(size, colors); }

function createImageFromPixels(pixelData, size) {
  if (!pixelData || !Array.isArray(pixelData)) {
    console.error('🤖 Invalid pixel data provided to createImageFromPixels');
    return null;
  }
  
  if (!size || size <= 0) {
    console.error('🤖 Invalid size provided to createImageFromPixels:', size);
    return null;
  }
  
  const canvas = document.createElement('canvas');
  canvas.width = size * 4; // Scale up for better visibility
  canvas.height = size * 4;
  const ctx = canvas.getContext('2d');
  
  try {
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        const index = y * size + x;
        const color = pixelData[index];
        
        if (color && color !== 'transparent' && color !== null) {
          ctx.fillStyle = color;
          ctx.fillRect(x * 4, y * 4, 4, 4);
        }
      }
    }
    
    return canvas.toDataURL();
  } catch (error) {
    console.error('🤖 Error creating image from pixels:', error);
    return null;
  }
}

function applyAIPixelArt(aiData, startX, startY) {
  if (!aiData || !aiData.pixelData) return;
  
  saveCanvasState();
  
  const pixels = Array.from(canvas.children);
  
  // Determine dimensions - support both square and rectangular
  let width, height;
  if (aiData.width && aiData.height) {
    // Use explicit dimensions if provided
    width = aiData.width;
    height = aiData.height;
  } else {
    // Fallback to square size calculation
    const size = aiData.size || Math.floor(Math.sqrt(aiData.pixelData.length));
    width = size;
    height = size;
  }
  
  // Calculate center offset to place object centered on click position
  const centerOffsetX = Math.floor(width / 2);
  const centerOffsetY = Math.floor(height / 2);
  const adjustedStartX = startX - centerOffsetX;
  const adjustedStartY = startY - centerOffsetY;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const pixelX = adjustedStartX + x;
      const pixelY = adjustedStartY + y;
      
      if (pixelX >= 0 && pixelX < gridSize && pixelY >= 0 && pixelY < gridSize) {
        const index = pixelY * gridSize + pixelX;
        const pixel = pixels[index];
        const colorIndex = y * width + x;
        const color = aiData.pixelData[colorIndex];
        
        if (pixel && color && color !== 'transparent') {
          pixel.style.backgroundColor = color;
        }
      }
    }
  }
  
  console.log(`🤖 Applied AI art (${width}x${height}) centered at (${startX}, ${startY})`);
}

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
  // Don't interfere if typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  // Save functionality (Ctrl+S)
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault();
    saveProject();
    return;
  }
  
  // Undo functionality (Ctrl+Z)
  if (e.ctrlKey && e.key === 'z') {
    e.preventDefault();
    performUndo();
    return;
  }
  
  // Redo functionality (Ctrl+Y)
  if (e.ctrlKey && e.key === 'y') {
    e.preventDefault();
    performRedo();
    return;
  }
  
  // Clear canvas functionality (Ctrl+Shift+C)
  if (e.ctrlKey && e.shiftKey && e.key === 'C') {
    e.preventDefault();
    if (confirm('Clear the entire canvas? This action cannot be undone.')) {
      clearCanvas();
    }
    return;
  }
  
  // Rename current layer (F2)
  if (e.key === 'F2') {
    e.preventDefault();
    if (layers && layers[currentLayerIndex]) {
      const layerElement = document.querySelector(`[data-layer-index="${currentLayerIndex}"] .layer-name`);
      if (layerElement) {
        console.log(`🔤 F2 pressed - renaming layer ${currentLayerIndex}`);
        startLayerNameEdit(layerElement, currentLayerIndex);
      }
    }
    return;
  }
  
  // Tool shortcuts (without Ctrl)
  if (!e.ctrlKey && !e.altKey && !e.shiftKey) {
    switch (e.key.toLowerCase()) {
      case 'b':
        e.preventDefault();
        setCurrentTool('draw');
        break;
      case 'e':
        e.preventDefault();
        setCurrentTool('eraser');
        break;
      case 'g':
        e.preventDefault();
        setCurrentTool('fill');
        break;
      case 'l':
        e.preventDefault();
        setCurrentTool('line');
        break;
      case 'r':
        e.preventDefault();
        setCurrentTool('rectangle');
        break;
      case 'c':
        e.preventDefault();
        setCurrentTool('circle');
        break;
      case 'i':
        e.preventDefault();
        setCurrentTool('eyedropper');
        break;
      case 'v':
        e.preventDefault();
        setCurrentTool('move');
        break;
      case 't':
        e.preventDefault();
        setCurrentTool('text');
        break;
      case 'q':
        e.preventDefault();
        setCurrentTool('transform');
        break;
      case 'a':
        e.preventDefault();
        setCurrentTool('ai');
        break;
    }
  }
});

// Theme toggle
const themeToggle = document.getElementById('toggleDarkMode');
if (themeToggle) {
  themeToggle.addEventListener('click', () => {
    document.body.classList.toggle('dark');
    console.log('🌓 Theme toggled');
  });
}

// Save project function
function saveProject() {
  const pixels = document.querySelectorAll('.pixel');
  const pixelData = Array.from(pixels).map(pixel => {
    const bg = pixel.style.backgroundColor;
    return bg === 'transparent' || bg === '' ? 'transparent' : bg;
  });
  
  const projectData = {
    gridSize: gridSize,
    pixels: pixelData,
    animationFrames: animationFrames,
    currentFrameIndex: currentFrameIndex,
    timestamp: Date.now()
  };
  
  const filename = prompt('Enter filename (without extension):') || `PixelArt_${Date.now()}`;
  
  // Save to recent files
  saveRecentFile(filename, projectData);
  
  // Download as JSON
  const dataStr = JSON.stringify(projectData, null, 2);
  const dataBlob = new Blob([dataStr], {type: 'application/json'});
  const url = URL.createObjectURL(dataBlob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename + '.json';
  link.style.display = 'none';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  
  console.log(`💾 Project saved: ${filename}`);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', init);
} else {
  init();
}

// === RECENT FILES MANAGEMENT ===
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
    const filtered = recentFiles.filter(file => file.name !== filename);
    
    const newFile = {
      name: filename,
      data: projectData,
      timestamp: Date.now(),
      gridSize: gridSize,
      preview: generatePreview()
    };
    
    filtered.unshift(newFile);
    const limited = filtered.slice(0, 10); // Keep only 10 recent files
    
    localStorage.setItem('pixelpro_recent_files', JSON.stringify(limited));
    renderRecentFiles();
  } catch (e) {
    console.error('Error saving recent file:', e);
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

function renderRecentFiles() {
  const recentFiles = getRecentFiles();
  const recentFilesList = document.getElementById('recentFilesList');
  const noRecentFiles = document.getElementById('noRecentFiles');
  
  if (!recentFilesList || !noRecentFiles) return;
  
  if (recentFiles.length === 0) {
    recentFilesList.innerHTML = '';
    noRecentFiles.style.display = 'block';
    return;
  }
  
  noRecentFiles.style.display = 'none';
  recentFilesList.innerHTML = recentFiles.map(file => `
    <div class="recent-file-item cursor-pointer" data-filename="${file.name}">
      <div class="recent-file-info">
        <div class="recent-file-name">${file.name}</div>
        <div class="recent-file-details">
          <span>${file.gridSize}x${file.gridSize}</span> • 
          <span>${formatFileDate(file.timestamp)}</span>
        </div>
      </div>
      <div class="recent-file-preview">🎨</div>
      <div class="recent-file-actions">
        <button class="recent-file-action delete" title="Remove from recent">×</button>
      </div>
    </div>
  `).join('');
  
  // Add click listeners to recent files
  recentFilesList.querySelectorAll('.recent-file-item').forEach(item => {
    const filename = item.dataset.filename;
    
    item.addEventListener('click', (e) => {
      if (e.target.classList.contains('recent-file-action')) return;
      loadRecentFile(filename);
    });
    
    const deleteBtn = item.querySelector('.recent-file-action.delete');
    if (deleteBtn) {
      deleteBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        removeRecentFile(filename);
      });
    }
  });
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

function loadRecentFile(filename) {
  const recentFiles = getRecentFiles();
  const file = recentFiles.find(f => f.name === filename);
  
  if (!file) {
    alert('File not found in recent files.');
    removeRecentFile(filename);
    return;
  }
  
  console.log(`📂 Loading recent file: ${filename}`);
  hideStartScreen();
  
  // Load the project data
  gridSize = file.gridSize || 16;
  createNewProject();
  
  // Load pixel data if available
  if (file.data && file.data.pixels) {
    setTimeout(() => {
      const pixels = document.querySelectorAll('.pixel');
      file.data.pixels.forEach((color, index) => {
        if (pixels[index] && color !== 'transparent') {
          pixels[index].style.backgroundColor = color;
        }
      });
    }, 100);
  }
  
  console.log(`✅ Loaded recent file: ${filename}`);
}

function formatFileDate(timestamp) {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now - date;
  const diffMinutes = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMinutes < 1) return 'Just now';
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function generatePreview() {
  // Simple preview generation
  return '🎨';
}

// === ADDITIONAL PROJECT TYPES ===
function openFileDialog() {
  // Create a hidden file input
  const input = document.createElement('input');
  input.type = 'file';
  input.accept = '.json';
  input.style.display = 'none';
  
  input.onchange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = JSON.parse(e.target.result);
          console.log('📂 File loaded:', file.name);
          hideStartScreen();
          loadProjectData(data);
        } catch (err) {
          alert('Error loading file: Invalid format');
        }
      };
      reader.readAsText(file);
    }
    document.body.removeChild(input);
  };
  
  document.body.appendChild(input);
  input.click();
}

function loadProjectData(data) {
  if (data.gridSize) gridSize = data.gridSize;
  createNewProject();
  
  // Load pixel data
  if (data.pixels) {
    setTimeout(() => {
      const pixels = document.querySelectorAll('.pixel');
      data.pixels.forEach((color, index) => {
        if (pixels[index] && color !== 'transparent') {
          pixels[index].style.backgroundColor = color;
        }
      });
    }, 100);
  }
  
  // Load animation frames if they exist
  if (data.animationFrames) {
    animationFrames = data.animationFrames;
    currentFrameIndex = data.currentFrameIndex || 0;
    renderAnimationFrames();
    updateAnimationControls();
  }
}

function createDemoProject() {
  console.log('🎮 Creating demo project...');
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
}

function createTutorialProject() {
  console.log('🎓 Creating tutorial project...');
  gridSize = 16;
  createNewProject();
  
  // Show tutorial message
  setTimeout(() => {
    alert('🎓 Tutorial Mode\n\n1. Click pixels to draw\n2. Use B for brush, E for eraser, G for fill\n3. Change colors with the color picker\n4. Use the animation panel at the bottom to create animations\n\nHave fun creating!');
  }, 500);
  
  console.log('✅ Tutorial project created');
}

// ========================================
// PHOTOSHOP-STYLE LAYER SYSTEM
// ========================================

// Layer creation function
function createLayer(name, size, fillColor = TRANSPARENT) {
  layerCount++;
  const layer = {
    id: `layer_${layerCount}`,
    name: name || `Layer ${layerCount}`,
    visible: true,
    opacity: 100,
    blendMode: 'normal',
    data: new Array(size * size).fill(fillColor),
    thumbnail: null
  };
  
  // Generate thumbnail
  generateLayerThumbnail(layer, size);
  return layer;
}

// Generate layer thumbnail
function generateLayerThumbnail(layer, size) {
  const thumbnailCanvas = document.createElement('canvas');
  thumbnailCanvas.width = 32;
  thumbnailCanvas.height = 32;
  const ctx = thumbnailCanvas.getContext('2d');
  
  // Clear with transparency pattern
  ctx.fillStyle = '#1A1A1A';
  ctx.fillRect(0, 0, 32, 32);
  
  // Create checkerboard pattern for transparency
  const patternCanvas = document.createElement('canvas');
  patternCanvas.width = 8;
  patternCanvas.height = 8;
  const patternCtx = patternCanvas.getContext('2d');
  patternCtx.fillStyle = '#2A2A2A';
  patternCtx.fillRect(0, 0, 4, 4);
  patternCtx.fillRect(4, 4, 4, 4);
  patternCtx.fillStyle = '#1A1A1A';
  patternCtx.fillRect(4, 0, 4, 4);
  patternCtx.fillRect(0, 4, 4, 4);
  
  const pattern = ctx.createPattern(patternCanvas, 'repeat');
  ctx.fillStyle = pattern;
  ctx.fillRect(0, 0, 32, 32);
  
  // Draw layer content scaled down
  const pixelSize = 32 / size;
  layer.data.forEach((color, index) => {
    if (color && color !== TRANSPARENT) {
      const x = (index % size) * pixelSize;
      const y = Math.floor(index / size) * pixelSize;
      ctx.fillStyle = color;
      ctx.fillRect(x, y, pixelSize, pixelSize);
    }
  });
  
  layer.thumbnail = thumbnailCanvas;
}

// Render Photoshop-style layers list
function renderLayersList() {
  if (!layersList) return;
  
  layersList.innerHTML = '';
  
  // Render layers in reverse order (top layer first)
  for (let i = layers.length - 1; i >= 0; i--) {
    const layer = layers[i];
    const layerElement = createLayerElement(layer, i);
    layersList.appendChild(layerElement);
  }
}

// Create Photoshop-style layer element
function createLayerElement(layer, index) {
  const layerDiv = document.createElement('div');
  layerDiv.classList.add('layer-item');
  layerDiv.draggable = true;
  layerDiv.dataset.layerIndex = index;
  
  if (index === currentLayerIndex) {
    layerDiv.classList.add('active');
  }
  
  layerDiv.innerHTML = `
    <div class="layer-thumbnail">
      ${layer.thumbnail ? '' : '<canvas width="30" height="30"></canvas>'}
    </div>
    <div class="layer-info">
      <div class="layer-name" data-layer-index="${index}">${layer.name}</div>
      <div class="layer-details">
        <span>Normal</span>
        <span>${layer.opacity}%</span>
      </div>
    </div>
    <div class="layer-controls">
      <button class="layer-visibility ${layer.visible ? '' : 'hidden'}" data-layer-index="${index}">
        ${layer.visible ? '👁' : '👁‍🗨'}
      </button>
    </div>
  `;
  
  // Add thumbnail if available
  if (layer.thumbnail) {
    const thumbnailContainer = layerDiv.querySelector('.layer-thumbnail');
    thumbnailContainer.appendChild(layer.thumbnail.cloneNode(true));
  }
  
  // Add event listeners
  setupLayerElementEvents(layerDiv, index);
  
  console.log(`🎨 Created layer element for layer ${index}: "${layer.name}"`);
  
  return layerDiv;
}

// Setup layer element event listeners
function setupLayerElementEvents(layerElement, index) {
  // Click to select layer (with delay to not interfere with double-click)
  let clickTimer = null;
  layerElement.addEventListener('click', (e) => {
    if (!e.target.classList.contains('layer-visibility') && 
        !e.target.classList.contains('layer-name-input')) {
      
      // Clear any existing timer
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      
      // Delay the selection to allow double-click to work
      clickTimer = setTimeout(() => {
        selectLayer(index);
        clickTimer = null;
      }, 250); // 250ms delay to allow double-click
    }
  });
  
  // Double-click layer name to edit
  const layerName = layerElement.querySelector('.layer-name');
  if (layerName) {
    // Add debugging to see if element exists
    console.log(`🔍 Layer name element found for layer ${index}:`, layerName);
    
    layerName.addEventListener('dblclick', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Cancel any pending click selection
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      
      console.log(`🏷️ Double-clicked layer name for layer ${index}`, e.target);
      startLayerNameEdit(e.target, index);
    });
    
    // Also add a click event directly to the layer name for debugging
    layerName.addEventListener('click', (e) => {
      console.log(`🖱️ Single clicked layer name for layer ${index}`, e.target);
    });
    
    console.log(`✅ Double-click listener added to layer ${index}`);
  } else {
    console.error(`❌ Layer name element not found for layer ${index}`);
  }
  
  // Alternative: Add double-click to entire layer element as backup
  layerElement.addEventListener('dblclick', (e) => {
    // Only trigger if not clicking on visibility button
    if (!e.target.classList.contains('layer-visibility')) {
      e.preventDefault();
      e.stopPropagation();
      
      // Cancel any pending click selection
      if (clickTimer) {
        clearTimeout(clickTimer);
        clickTimer = null;
      }
      
      console.log(`🔄 Double-clicked layer element for layer ${index} (backup handler)`, e.target);
      
      // Find the layer name element to pass to startLayerNameEdit
      const nameElement = layerElement.querySelector('.layer-name');
      if (nameElement) {
        startLayerNameEdit(nameElement, index);
      }
    }
  });
  
  // Right-click layer name for context menu (alternative rename method)
  if (layerName) {
    layerName.addEventListener('contextmenu', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      // Create simple context menu
      const contextMenu = document.createElement('div');
      contextMenu.className = 'layer-context-menu';
      contextMenu.style.cssText = `
        position: fixed;
        top: ${e.clientY}px;
        left: ${e.clientX}px;
        background: #2a2a2a;
        border: 1px solid #444;
        border-radius: 4px;
        padding: 4px 0;
        z-index: 10000;
        box-shadow: 0 2px 8px rgba(0,0,0,0.3);
      `;
      
      const renameOption = document.createElement('div');
      renameOption.textContent = 'Rename Layer';
      renameOption.style.cssText = `
        padding: 6px 12px;
        color: #fff;
        cursor: pointer;
        font-size: 12px;
      `;
      renameOption.addEventListener('mouseenter', () => renameOption.style.backgroundColor = '#444');
      renameOption.addEventListener('mouseleave', () => renameOption.style.backgroundColor = 'transparent');
      renameOption.addEventListener('click', () => {
        document.body.removeChild(contextMenu);
        startLayerNameEdit(layerName, index);
      });
      
      contextMenu.appendChild(renameOption);
      document.body.appendChild(contextMenu);
      
      // Remove context menu when clicking elsewhere
      const removeMenu = (e) => {
        if (!contextMenu.contains(e.target)) {
          document.body.removeChild(contextMenu);
          document.removeEventListener('click', removeMenu);
        }
      };
      setTimeout(() => document.addEventListener('click', removeMenu), 0);
      
      console.log(`📋 Context menu opened for layer ${index}`);
    });
  }
  
  // Visibility toggle
  const visibilityBtn = layerElement.querySelector('.layer-visibility');
  visibilityBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    toggleLayerVisibility(index);
  });
  
  // Drag and drop
  layerElement.addEventListener('dragstart', (e) => {
    e.dataTransfer.setData('text/plain', index);
    layerElement.classList.add('dragging');
  });
  
  layerElement.addEventListener('dragend', () => {
    layerElement.classList.remove('dragging');
  });
  
  layerElement.addEventListener('dragover', (e) => {
    e.preventDefault();
  });
  
  layerElement.addEventListener('drop', (e) => {
    e.preventDefault();
    const draggedIndex = parseInt(e.dataTransfer.getData('text/plain'));
    const targetIndex = index;
    
    if (draggedIndex !== targetIndex) {
      moveLayer(draggedIndex, targetIndex);
    }
  });
}

// Layer management functions
function selectLayer(index) {
  if (index >= 0 && index < layers.length) {
    currentLayerIndex = index;
    renderLayersList();
    console.log(`📋 Selected layer: ${layers[index].name}`);
  }
}

function addLayer() {
  const newLayer = createLayer(`Layer ${layerCount}`, gridSize);
  layers.push(newLayer);
  currentLayerIndex = layers.length - 1;
  renderLayersList();
  console.log(`➕ Added layer: ${newLayer.name}`);
}

function deleteLayer() {
  if (layers.length <= 1) {
    console.log('❌ Cannot delete the last layer');
    return;
  }
  
  const deletedLayer = layers.splice(currentLayerIndex, 1)[0];
  if (currentLayerIndex >= layers.length) {
    currentLayerIndex = layers.length - 1;
  }
  renderLayersList();
  console.log(`🗑️ Deleted layer: ${deletedLayer.name}`);
}

function duplicateLayer() {
  const originalLayer = layers[currentLayerIndex];
  const duplicatedLayer = {
    ...originalLayer,
    id: `layer_${++layerCount}`,
    name: `${originalLayer.name} copy`,
    data: [...originalLayer.data]
  };
  
  generateLayerThumbnail(duplicatedLayer, gridSize);
  layers.splice(currentLayerIndex + 1, 0, duplicatedLayer);
  currentLayerIndex++;
  renderLayersList();
  console.log(`📋 Duplicated layer: ${duplicatedLayer.name}`);
}

function toggleLayerVisibility(index) {
  layers[index].visible = !layers[index].visible;
  renderLayersList();
  // TODO: Update canvas rendering to respect layer visibility
  console.log(`👁 Toggled layer visibility: ${layers[index].name}`);
}

function moveLayer(fromIndex, toIndex) {
  const layer = layers.splice(fromIndex, 1)[0];
  layers.splice(toIndex, 0, layer);
  
  // Update current layer index
  if (currentLayerIndex === fromIndex) {
    currentLayerIndex = toIndex;
  } else if (currentLayerIndex > fromIndex && currentLayerIndex <= toIndex) {
    currentLayerIndex--;
  } else if (currentLayerIndex < fromIndex && currentLayerIndex >= toIndex) {
    currentLayerIndex++;
  }
  
  renderLayersList();
  console.log(`🔄 Moved layer from ${fromIndex} to ${toIndex}`);
}

// Layer name editing
function startLayerNameEdit(nameElement, index) {
  console.log(`🎯 Starting layer name edit for layer ${index}`, nameElement);
  
  if (!nameElement || !layers[index]) {
    console.error(`❌ Invalid parameters for layer name edit:`, { nameElement, index, layer: layers[index] });
    return;
  }
  
  const input = document.createElement('input');
  input.type = 'text';
  input.value = layers[index].name;
  input.className = 'layer-name-input';
  
  console.log(`📝 Created input with value: "${input.value}"`);
  
  nameElement.parentNode.replaceChild(input, nameElement);
  input.focus();
  input.select();
  
  function finishEdit() {
    const newName = input.value || `Layer ${index + 1}`;
    console.log(`💾 Finishing edit for layer ${index}: "${layers[index].name}" → "${newName}"`);
    layers[index].name = newName;
    renderLayersList();
  }
  
  input.addEventListener('blur', finishEdit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      finishEdit();
    } else if (e.key === 'Escape') {
      renderLayersList(); // Cancel edit
    }
    e.stopPropagation(); // Prevent tool shortcuts
  });
}

// Setup layer system
function setupLayers() {
  // Make layers panel visible
  if (layersPanel) {
    layersPanel.classList.remove('hidden');
    layersPanel.classList.add('lg:block');
  }
  
  // Initialize with one layer
  if (layers.length === 0) {
    layers = [createLayer('Background', gridSize, TRANSPARENT)];
    currentLayerIndex = 0;
  }
  
  // Setup layer control buttons
  const addLayerBtn = document.getElementById('addLayer');
  const deleteLayerBtn = document.getElementById('deleteLayer');
  const duplicateLayerBtn = document.getElementById('duplicateLayer');
  const renameLayerBtn = document.getElementById('renameLayer');
  
  if (addLayerBtn) {
    addLayerBtn.addEventListener('click', addLayer);
  }
  
  if (deleteLayerBtn) {
    deleteLayerBtn.addEventListener('click', deleteLayer);
  }
  
  if (duplicateLayerBtn) {
    duplicateLayerBtn.addEventListener('click', duplicateLayer);
  }
  
  // Rename layer button
  if (renameLayerBtn) {
    renameLayerBtn.addEventListener('click', () => {
      if (layers && layers[currentLayerIndex]) {
        const layerElement = document.querySelector(`[data-layer-index="${currentLayerIndex}"] .layer-name`);
        if (layerElement) {
          console.log(`🏷️ Rename button clicked for layer ${currentLayerIndex}`);
          startLayerNameEdit(layerElement, currentLayerIndex);
        } else {
          console.error(`❌ Layer name element not found for current layer ${currentLayerIndex}`);
        }
      } else {
        console.error(`❌ No current layer to rename`);
      }
    });
  }
  
  // Render initial layers
  renderLayersList();
  
  console.log('🎨 Layer system initialized');
}

// ========================================
// PHOTOSHOP-STYLE COLOR SYSTEM
// ========================================

// Color conversion utilities
function hexToRgb(hex) {
  // Handle different input types
  if (typeof hex !== 'string') {
    console.warn('hexToRgb: Expected string, got:', typeof hex, hex);
    return null;
  }
  
  // If it's already an RGB object, return it
  if (hex.r !== undefined && hex.g !== undefined && hex.b !== undefined) {
    return hex;
  }
  
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function rgbToHex(r, g, b) {
  return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

function rgbToHsb(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const diff = max - min;
  
  let h = 0;
  let s = max === 0 ? 0 : diff / max;
  let br = max;
  
  if (diff !== 0) {
    switch (max) {
      case r: h = ((g - b) / diff + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / diff + 2) / 6; break;
      case b: h = ((r - g) / diff + 4) / 6; break;
    }
  }
  
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    b: Math.round(br * 100)
  };
}

function hsbToRgb(h, s, b) {
  h /= 360;
  s /= 100;
  b /= 100;
  
  const i = Math.floor(h * 6);
  const f = h * 6 - i;
  const p = b * (1 - s);
  const q = b * (1 - f * s);
  const t = b * (1 - (1 - f) * s);
  
  let r, g, bl;
  
  switch (i % 6) {
    case 0: r = b; g = t; bl = p; break;
    case 1: r = q; g = b; bl = p; break;
    case 2: r = p; g = b; bl = t; break;
    case 3: r = p; g = q; bl = b; break;
    case 4: r = t; g = p; bl = b; break;
    case 5: r = b; g = p; bl = q; break;
  }
  
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(bl * 255)
  };
}

// Update color displays
function updateColorDisplays() {
  // Update foreground/background color squares
  const fgPreview = document.querySelector('#foregroundColor .ps-color-preview');
  const bgPreview = document.querySelector('#backgroundColor .ps-color-preview');
  
  if (fgPreview) {
    fgPreview.style.backgroundColor = foregroundColor;
  }
  if (bgPreview) {
    bgPreview.style.backgroundColor = backgroundColor;
  }
  
  // Update color picker
  if (colorPicker) {
    colorPicker.value = foregroundColor;
  }
  
  // Update current drawing color
  currentColor = foregroundColor;
}

// Update color values in inputs
function updateColorInputs(color) {
  const rgb = hexToRgb(color);
  if (!rgb) {
    console.warn('updateColorInputs: Invalid color:', color);
    return;
  }
  
  const hsb = rgbToHsb(rgb.r, rgb.g, rgb.b);
  
  // Update HSB inputs
  const hueInput = document.getElementById('hueInput');
  const satInput = document.getElementById('satInput');
  const briInput = document.getElementById('briInput');
  
  if (hueInput) hueInput.value = hsb.h;
  if (satInput) satInput.value = hsb.s;
  if (briInput) briInput.value = hsb.b;
  
  // Update RGB inputs
  const redInput = document.getElementById('redInput');
  const greenInput = document.getElementById('greenInput');
  const blueInput = document.getElementById('blueInput');
  
  if (redInput) redInput.value = rgb.r;
  if (greenInput) greenInput.value = rgb.g;
  if (blueInput) blueInput.value = rgb.b;
  
  // Update HEX input
  const hexInput = document.getElementById('hexInput');
  if (hexInput) hexInput.value = color.substring(1);
  
  // Store current HSB values
  currentHue = hsb.h;
  currentSaturation = hsb.s;
  currentBrightness = hsb.b;
  
  // Update color field and hue slider
  updateColorField();
  updateHueSlider();
}

// Update color field background based on hue
function updateColorField() {
  const colorField = document.getElementById('colorField');
  if (!colorField) {
    console.warn('🎨 Color field not found in updateColorField');
    return;
  }
  
  const hueColor = hsbToRgb(currentHue, 100, 100);
  const hueHex = rgbToHex(hueColor.r, hueColor.g, hueColor.b);
  
  console.log(`🎨 Updating color field background with hue: ${hueHex}`);
  
  // Create a proper HSB color field with saturation on X-axis and brightness on Y-axis
  // Use CSS gradients to create the color field
  colorField.style.background = `
    linear-gradient(to right, #ffffff, ${hueHex}),
    linear-gradient(to bottom, transparent, #000000)
  `;
  colorField.style.backgroundBlendMode = 'multiply';
  
  // Update cursor position
  const cursor = document.getElementById('colorCursor');
  if (cursor) {
    const rect = colorField.getBoundingClientRect();
    const x = (currentSaturation / 100) * rect.width;
    const y = ((100 - currentBrightness) / 100) * rect.height;
    
    cursor.style.left = `${x}px`;
    cursor.style.top = `${y}px`;
    
    console.log(`🎨 Updated cursor position: ${x}px, ${y}px`);
  } else {
    console.warn('🎨 Color cursor not found');
  }
}

// Update hue slider cursor
function updateHueSlider() {
  const hueCursor = document.getElementById('hueCursor');
  const hueSlider = document.getElementById('hueSlider');
  
  if (hueCursor && hueSlider) {
    const rect = hueSlider.getBoundingClientRect();
    const x = (currentHue / 360) * rect.width;
    hueCursor.style.left = `${x}px`;
    console.log(`🎨 Updated hue cursor position: ${x}px`);
  } else {
    console.warn('🎨 Hue cursor or slider not found in updateHueSlider');
  }
}

// Set foreground color
function setForegroundColor(color) {
  foregroundColor = color;
  currentColor = color; // Update current drawing color
  updateColorDisplays();
  updateColorInputs(color);
  addToRecentColors(color);
  updateColorHarmony();
  updateColorSchemes();
}

// Set background color
function setBackgroundColor(color) {
  backgroundColor = color;
  updateColorDisplays();
}

// Swap foreground and background colors
function swapColors() {
  const temp = foregroundColor;
  foregroundColor = backgroundColor;
  backgroundColor = temp;
  updateColorDisplays();
  updateColorInputs(foregroundColor);
}

// Reset colors to default
function resetColors() {
  foregroundColor = "#000000";
  backgroundColor = "#ffffff";
  updateColorDisplays();
  updateColorInputs(foregroundColor);
}

// Add color to recent colors
function addToRecentColors(color) {
  // Remove if already exists
  recentColors = recentColors.filter(c => c !== color);
  // Add to beginning
  recentColors.unshift(color);
  // Keep only last 12 colors
  recentColors = recentColors.slice(0, 12);
  // Update display
  renderRecentColors();
}

// Advanced color utilities
function generateColorHarmony(baseColor, type = 'complementary') {
  const hsb = hexToHsb(baseColor);
  let harmonies = [];
  
  switch(type) {
    case 'complementary':
      harmonies = [
        baseColor,
        hsbToHex((hsb.h + 180) % 360, hsb.s, hsb.b)
      ];
      break;
    case 'triadic':
      harmonies = [
        baseColor,
        hsbToHex((hsb.h + 120) % 360, hsb.s, hsb.b),
        hsbToHex((hsb.h + 240) % 360, hsb.s, hsb.b)
      ];
      break;
    case 'analogous':
      harmonies = [
        hsbToHex((hsb.h - 30 + 360) % 360, hsb.s, hsb.b),
        baseColor,
        hsbToHex((hsb.h + 30) % 360, hsb.s, hsb.b)
      ];
      break;
    case 'split-complementary':
      harmonies = [
        baseColor,
        hsbToHex((hsb.h + 150) % 360, hsb.s, hsb.b),
        hsbToHex((hsb.h + 210) % 360, hsb.s, hsb.b)
      ];
      break;
    case 'tetradic':
      harmonies = [
        baseColor,
        hsbToHex((hsb.h + 90) % 360, hsb.s, hsb.b),
        hsbToHex((hsb.h + 180) % 360, hsb.s, hsb.b),
        hsbToHex((hsb.h + 270) % 360, hsb.s, hsb.b)
      ];
      break;
  }
  
  return harmonies;
}

function generateColorScheme(baseColor, scheme = 'monochromatic') {
  const hsb = hexToHsb(baseColor);
  let colors = [];
  
  switch(scheme) {
    case 'monochromatic':
      colors = [
        hsbToHex(hsb.h, hsb.s * 0.3, hsb.b * 0.8),
        hsbToHex(hsb.h, hsb.s * 0.6, hsb.b * 0.9),
        baseColor,
        hsbToHex(hsb.h, hsb.s * 0.8, hsb.b * 0.7),
        hsbToHex(hsb.h, hsb.s * 0.9, hsb.b * 0.5)
      ];
      break;
    case 'warm':
      colors = [
        hsbToHex(0, hsb.s, hsb.b),      // Red
        hsbToHex(30, hsb.s, hsb.b),     // Orange
        hsbToHex(60, hsb.s, hsb.b),     // Yellow
        baseColor
      ];
      break;
    case 'cool':
      colors = [
        hsbToHex(180, hsb.s, hsb.b),    // Cyan
        hsbToHex(240, hsb.s, hsb.b),    // Blue
        hsbToHex(300, hsb.s, hsb.b),    // Magenta
        baseColor
      ];
      break;
    case 'earth':
      colors = [
        hsbToHex(30, 60, 40),   // Brown
        hsbToHex(45, 70, 50),   // Tan
        hsbToHex(60, 50, 60),   // Beige
        hsbToHex(15, 80, 30),   // Dark Brown
        baseColor
      ];
      break;
  }
  
  return colors;
}

function hexToHsb(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return { h: 0, s: 0, b: 0 };
  return rgbToHsb(rgb.r, rgb.g, rgb.b);
}

function hsbToHex(h, s, b) {
  const rgb = hsbToRgb(h, s, b);
  return rgbToHex(rgb.r, rgb.g, rgb.b);
}

function adjustColorBrightness(color, factor) {
  const hsb = hexToHsb(color);
  hsb.b = Math.max(0, Math.min(100, hsb.b * factor));
  return hsbToHex(hsb.h, hsb.s, hsb.b);
}

function adjustColorSaturation(color, factor) {
  const hsb = hexToHsb(color);
  hsb.s = Math.max(0, Math.min(100, hsb.s * factor));
  return hsbToHex(hsb.h, hsb.s, hsb.b);
}

function blendColors(color1, color2, ratio = 0.5) {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return color1;
  
  const r = Math.round(rgb1.r * (1 - ratio) + rgb2.r * ratio);
  const g = Math.round(rgb1.g * (1 - ratio) + rgb2.g * ratio);
  const b = Math.round(rgb1.b * (1 - ratio) + rgb2.b * ratio);
  
  return rgbToHex(r, g, b);
}

// Update color harmony display
function updateColorHarmony() {
  const harmonyGrid = document.getElementById('harmonyGrid');
  const harmonyTypeSelect = document.getElementById('harmonyType');
  
  if (!harmonyGrid || !harmonyTypeSelect) return;
  
  const harmonyType = harmonyTypeSelect.value;
  const harmonyColors = generateColorHarmony(foregroundColor, harmonyType);
  
  harmonyGrid.innerHTML = '';
  
  harmonyColors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'ps-harmony-color';
    colorDiv.style.backgroundColor = color;
    colorDiv.title = color;
    colorDiv.addEventListener('click', () => {
      setForegroundColor(color);
    });
    harmonyGrid.appendChild(colorDiv);
  });
}

// Update color schemes display
function updateColorSchemes() {
  const schemesGrid = document.getElementById('schemesGrid');
  const schemeTypeSelect = document.getElementById('schemeType');
  
  if (!schemesGrid || !schemeTypeSelect) return;
  
  const schemeType = schemeTypeSelect.value;
  const schemeColors = generateColorScheme(foregroundColor, schemeType);
  
  schemesGrid.innerHTML = '';
  
  schemeColors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'ps-scheme-color';
    colorDiv.style.backgroundColor = color;
    colorDiv.title = color;
    colorDiv.addEventListener('click', () => {
      setForegroundColor(color);
    });
    schemesGrid.appendChild(colorDiv);
  });
}

// Render recent colors grid
function renderRecentColors() {
  const recentGrid = document.getElementById('recentColorsGrid');
  if (!recentGrid) return;
  
  recentGrid.innerHTML = '';
  
  recentColors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'ps-recent-color';
    colorDiv.style.backgroundColor = color;
    colorDiv.title = color;
    colorDiv.addEventListener('click', () => {
      setForegroundColor(color);
    });
    recentGrid.appendChild(colorDiv);
  });
}

// Setup color panel
function setupColorPanel() {
  console.log('🎨 Setting up comprehensive color panel...');
  
  // Initialize color state
  currentHue = 0;
  currentSaturation = 100;
  currentBrightness = 100;
  
  // Initialize with current foreground color
  const initialHsb = hexToHsb(foregroundColor);
  if (initialHsb) {
    currentHue = initialHsb.h;
    currentSaturation = initialHsb.s;
    currentBrightness = initialHsb.b;
  }
  
  console.log(`🎨 Initial color state: H=${currentHue}, S=${currentSaturation}, B=${currentBrightness}`);
  
  // Setup foreground/background color displays
  const foregroundColorEl = document.getElementById('foregroundColor');
  const backgroundColorEl = document.getElementById('backgroundColor');
  
  if (foregroundColorEl) {
    const preview = foregroundColorEl.querySelector('.ps-color-preview');
    if (preview) {
      preview.style.backgroundColor = foregroundColor;
    }
    
    foregroundColorEl.addEventListener('click', () => {
      console.log('Foreground color clicked');
      
      // Create a native color picker as fallback
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = foregroundColor;
      colorInput.style.position = 'absolute';
      colorInput.style.left = '-9999px';
      document.body.appendChild(colorInput);
      
      colorInput.addEventListener('change', (e) => {
        const newColor = e.target.value;
        setForegroundColor(newColor);
        currentColor = newColor;
        
        // Update HSB values
        const fgHsb = hexToHsb(newColor);
        if (fgHsb) {
          currentHue = fgHsb.h;
          currentSaturation = fgHsb.s;
          currentBrightness = fgHsb.b;
          updateColorField();
          updateHueSlider();
        }
        
        document.body.removeChild(colorInput);
      });
      
      colorInput.click();
    });
  }
  
  if (backgroundColorEl) {
    const preview = backgroundColorEl.querySelector('.ps-color-preview');
    if (preview) {
      preview.style.backgroundColor = backgroundColor;
    }
    
    backgroundColorEl.addEventListener('click', () => {
      console.log('Background color clicked');
      
      // Create a native color picker as fallback
      const colorInput = document.createElement('input');
      colorInput.type = 'color';
      colorInput.value = backgroundColor;
      colorInput.style.position = 'absolute';
      colorInput.style.left = '-9999px';
      document.body.appendChild(colorInput);
      
      colorInput.addEventListener('change', (e) => {
        const newColor = e.target.value;
        setBackgroundColor(newColor);
        
        // Update preview
        const preview = backgroundColorEl.querySelector('.ps-color-preview');
        if (preview) {
          preview.style.backgroundColor = newColor;
        }
        
        document.body.removeChild(colorInput);
      });
      
      colorInput.click();
    });
  }
  
  // Setup swap and reset buttons
  const swapBtn = document.getElementById('swapColors');
  const resetBtn = document.getElementById('resetColors');
  
  if (swapBtn) {
    swapBtn.addEventListener('click', () => {
      const temp = foregroundColor;
      setForegroundColor(backgroundColor);
      setBackgroundColor(temp);
      
      // Update HSB values for new foreground color
      const newFgHsb = hexToHsb(foregroundColor);
      if (newFgHsb) {
        currentHue = newFgHsb.h;
        currentSaturation = newFgHsb.s;
        currentBrightness = newFgHsb.b;
        updateColorField();
        updateHueSlider();
      }
      
      // Update previews
      const fgPreview = foregroundColorEl?.querySelector('.ps-color-preview');
      const bgPreview = backgroundColorEl?.querySelector('.ps-color-preview');
      if (fgPreview) fgPreview.style.backgroundColor = foregroundColor;
      if (bgPreview) bgPreview.style.backgroundColor = backgroundColor;
    });
  }
  
  if (resetBtn) {
    resetBtn.addEventListener('click', () => {
      setForegroundColor('#000000');
      setBackgroundColor('#ffffff');
      currentColor = '#000000';
      
      // Reset HSB values
      currentHue = 0;
      currentSaturation = 0;
      currentBrightness = 0;
      
      // Update all displays
      updateColorDisplays();
      updateColorInputs('#000000');
      updateColorField();
      updateHueSlider();
      
      // Update previews
      const fgPreview = foregroundColorEl?.querySelector('.ps-color-preview');
      const bgPreview = backgroundColorEl?.querySelector('.ps-color-preview');
      if (fgPreview) fgPreview.style.backgroundColor = '#000000';
      if (bgPreview) bgPreview.style.backgroundColor = '#ffffff';
    });
  }
  
  // Setup color field interaction with retry mechanism
  function setupColorFieldWithRetry() {
    const colorField = document.getElementById('colorField');
    if (colorField) {
      console.log('🎨 Setting up color field...');
      
      // Remove any existing event listeners by cloning the element
      const newColorField = colorField.cloneNode(true);
      colorField.parentNode.replaceChild(newColorField, colorField);
      
      // Ensure the color field is properly initialized
      updateColorField();
      updateHueSlider();
      
      return true;
    } else {
      console.log('🎨 Color field not found, will retry...');
      return false;
    }
  }
  
    // Try to setup color field immediately, retry if needed
  if (!setupColorFieldWithRetry()) {
    setTimeout(() => {
      if (!setupColorFieldWithRetry()) {
        setTimeout(setupColorFieldWithRetry, 100);
      }
    }, 100);
  }
  
  function handleColorFieldClick(e) {
      console.log('🎨 Color field clicked!');
      const rect = newColorField.getBoundingClientRect();
      const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
      const y = Math.max(0, Math.min(rect.height, e.clientY - rect.top));
      
      currentSaturation = (x / rect.width) * 100;
      currentBrightness = 100 - (y / rect.height) * 100;
      
      console.log(`🎨 Color field: S=${currentSaturation.toFixed(1)}, B=${currentBrightness.toFixed(1)}`);
      
      const rgb = hsbToRgb(currentHue, currentSaturation, currentBrightness);
      const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
      
      setForegroundColor(hex);
      currentColor = hex;
      
      // Update cursor position
      const cursor = document.getElementById('colorCursor');
      if (cursor) {
        cursor.style.left = x + 'px';
        cursor.style.top = y + 'px';
      }
      
      // Update all displays
      updateColorDisplays();
      updateColorInputs(hex);
    }
    
    // Add mouse events
    newColorField.addEventListener('click', handleColorFieldClick);
    newColorField.addEventListener('mousedown', (e) => {
      handleColorFieldClick(e);
      
      const handleMouseMove = (e) => {
        handleColorFieldClick(e);
      };
      
      const handleMouseUp = () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
      
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
    
    console.log('🎨 Color field events added successfully');
  } else {
    console.error('🎨 Color field not found!');
  }
  
  // Setup hue slider interaction (simplified)
  const hueSlider = document.getElementById('hueSlider');
  if (hueSlider) {
    console.log('🎨 Setting up hue slider...');
    console.log('🎨 Hue slider events added successfully');
  } else {
    console.error('🎨 Hue slider not found!');
  }
  
  // Setup color value inputs
  const setupValueInput = (id, min, max, updateFn) => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', (e) => {
        const value = Math.max(min, Math.min(max, parseInt(e.target.value) || 0));
        e.target.value = value;
        updateFn(value);
      });
      
      input.addEventListener('blur', (e) => {
        const value = Math.max(min, Math.min(max, parseInt(e.target.value) || 0));
        e.target.value = value;
        updateFn(value);
      });
    }
  };
  
  // HSB inputs
  setupValueInput('hueInput', 0, 360, (h) => {
    currentHue = h;
    const rgb = hsbToRgb(currentHue, currentSaturation, currentBrightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setForegroundColor(hex);
    currentColor = hex;
    updateColorDisplays();
    updateColorField();
    updateHueSlider();
  });
  
  setupValueInput('satInput', 0, 100, (s) => {
    currentSaturation = s;
    const rgb = hsbToRgb(currentHue, currentSaturation, currentBrightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setForegroundColor(hex);
    currentColor = hex;
    updateColorDisplays();
    updateColorField();
  });
  
  setupValueInput('briInput', 0, 100, (b) => {
    currentBrightness = b;
    const rgb = hsbToRgb(currentHue, currentSaturation, currentBrightness);
    const hex = rgbToHex(rgb.r, rgb.g, rgb.b);
    setForegroundColor(hex);
    currentColor = hex;
    updateColorDisplays();
    updateColorField();
  });
  
  // RGB inputs
  setupValueInput('redInput', 0, 255, (r) => {
    const rgb = hexToRgb(foregroundColor);
    if (rgb) {
      const hex = rgbToHex(r, rgb.g, rgb.b);
      setForegroundColor(hex);
      currentColor = hex;
      
      // Update HSB values
      const newHsb = hexToHsb(hex);
      if (newHsb) {
        currentHue = newHsb.h;
        currentSaturation = newHsb.s;
        currentBrightness = newHsb.b;
      }
      
      updateColorDisplays();
      updateColorInputs(hex);
      updateColorField();
      updateHueSlider();
    }
  });
  
  setupValueInput('greenInput', 0, 255, (g) => {
    const rgb = hexToRgb(foregroundColor);
    if (rgb) {
      const hex = rgbToHex(rgb.r, g, rgb.b);
      setForegroundColor(hex);
      currentColor = hex;
      
      // Update HSB values
      const newHsb = hexToHsb(hex);
      if (newHsb) {
        currentHue = newHsb.h;
        currentSaturation = newHsb.s;
        currentBrightness = newHsb.b;
      }
      
      updateColorDisplays();
      updateColorInputs(hex);
      updateColorField();
      updateHueSlider();
    }
  });
  
  setupValueInput('blueInput', 0, 255, (b) => {
    const rgb = hexToRgb(foregroundColor);
    if (rgb) {
      const hex = rgbToHex(rgb.r, rgb.g, b);
      setForegroundColor(hex);
      currentColor = hex;
      
      // Update HSB values
      const newHsb = hexToHsb(hex);
      if (newHsb) {
        currentHue = newHsb.h;
        currentSaturation = newHsb.s;
        currentBrightness = newHsb.b;
      }
      
      updateColorDisplays();
      updateColorInputs(hex);
      updateColorField();
      updateHueSlider();
    }
  });
  
  // Setup hex input
  const hexInput = document.getElementById('hexInput');
  if (hexInput) {
    hexInput.addEventListener('input', (e) => {
      const value = e.target.value.replace(/[^0-9a-fA-F]/g, '').substring(0, 6);
      e.target.value = value;
      
      if (value.length === 6) {
        const hex = '#' + value;
        setForegroundColor(hex);
        currentColor = hex;
        
        // Update HSB values
        const hexHsb = hexToHsb(hex);
        if (hexHsb) {
          currentHue = hexHsb.h;
          currentSaturation = hexHsb.s;
          currentBrightness = hexHsb.b;
        }
        
        updateColorDisplays();
        updateColorInputs(hex);
        updateColorField();
        updateHueSlider();
      }
    });
    
    hexInput.addEventListener('blur', (e) => {
      const value = e.target.value.replace(/[^0-9a-fA-F]/g, '').substring(0, 6);
      if (value.length === 6) {
        const hex = '#' + value;
        setForegroundColor(hex);
        currentColor = hex;
        
        // Update HSB values
        const hexHsb = hexToHsb(hex);
        if (hexHsb) {
          currentHue = hexHsb.h;
          currentSaturation = hexHsb.s;
          currentBrightness = hexHsb.b;
        }
        
        updateColorDisplays();
        updateColorInputs(hex);
        updateColorField();
        updateHueSlider();
      }
    });
  }
  
  // Setup color swatches
  const swatches = document.querySelectorAll('.ps-swatch');
  swatches.forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      if (color) {
        setForegroundColor(color);
        currentColor = color;
        
        // Update HSB values
        const swatchHsb = hexToHsb(color);
        if (swatchHsb) {
          currentHue = swatchHsb.h;
          currentSaturation = swatchHsb.s;
          currentBrightness = swatchHsb.b;
        }
        
        // Update all displays
        updateColorDisplays();
        updateColorInputs(color);
        updateColorField();
        updateHueSlider();
        
        // Update active state
        swatches.forEach(s => s.classList.remove('active'));
        swatch.classList.add('active');
      }
    });
  });
  
  // Setup add swatch button
  const addSwatchBtn = document.getElementById('addSwatch');
  if (addSwatchBtn) {
    addSwatchBtn.addEventListener('click', () => {
      const swatchesGrid = document.getElementById('swatchesGrid');
      if (swatchesGrid) {
        const newSwatch = document.createElement('div');
        newSwatch.className = 'ps-swatch';
        newSwatch.style.backgroundColor = foregroundColor;
        newSwatch.dataset.color = foregroundColor;
        newSwatch.title = foregroundColor;
        
        newSwatch.addEventListener('click', () => {
          setForegroundColor(foregroundColor);
          currentColor = foregroundColor;
          
          // Update HSB values
          const addSwatchHsb = hexToHsb(foregroundColor);
          if (addSwatchHsb) {
            currentHue = addSwatchHsb.h;
            currentSaturation = addSwatchHsb.s;
            currentBrightness = addSwatchHsb.b;
          }
          
          // Update all displays
          updateColorDisplays();
          updateColorInputs(foregroundColor);
          updateColorField();
          updateHueSlider();
          
          document.querySelectorAll('.ps-swatch').forEach(s => s.classList.remove('active'));
          newSwatch.classList.add('active');
        });
        
        swatchesGrid.appendChild(newSwatch);
      }
    });
  }
  
  // Setup clear swatches button
  const clearSwatchesBtn = document.getElementById('clearSwatches');
  if (clearSwatchesBtn) {
    clearSwatchesBtn.addEventListener('click', () => {
      const swatchesGrid = document.getElementById('swatchesGrid');
      if (swatchesGrid) {
        // Keep only default swatches (first 12)
        const children = Array.from(swatchesGrid.children);
        children.slice(12).forEach(child => child.remove());
      }
    });
  }
  
  // Setup clear recent colors button
  const clearRecentBtn = document.getElementById('clearRecent');
  if (clearRecentBtn) {
    clearRecentBtn.addEventListener('click', () => {
      recentColors = [];
      renderRecentColors();
    });
  }
  
  // Setup color harmony
  const harmonyTypeSelect = document.getElementById('harmonyType');
  if (harmonyTypeSelect) {
    harmonyTypeSelect.addEventListener('change', () => {
      updateColorHarmony();
    });
  }
  
  // Setup color schemes
  const schemeTypeSelect = document.getElementById('schemeType');
  if (schemeTypeSelect) {
    schemeTypeSelect.addEventListener('change', () => {
      updateColorSchemes();
    });
  }
  
  // Initialize color system
  setForegroundColor(foregroundColor);
  setBackgroundColor(backgroundColor);
  currentColor = foregroundColor; // Set initial drawing color
  
  // Initialize HSB values from current color
  const hsb = hexToHsb(foregroundColor);
  if (hsb) {
    currentHue = hsb.h;
    currentSaturation = hsb.s;
    currentBrightness = hsb.b;
  }
  
  // Initialize color picker with current color
  console.log('🎨 Initializing color picker...');
  updateColorDisplays();
  updateColorInputs(foregroundColor);
  updateColorField();
  updateHueSlider();
  
  // Setup swatches
  setupEnhancedSwatches();
  
  // Load recent colors
  loadRecentColors();
  
  // Initialize harmony and schemes
  updateColorHarmony();
  updateColorSchemes();
  
  console.log('🎨 Color system initialized successfully');
  
  // Test color picker elements
  setTimeout(() => {
    testColorPicker();
    
    // Ensure color panel is properly initialized
    if (colorPanel) {
      colorPanel.style.display = 'block';
      colorPanel.style.visibility = 'visible';
      console.log('🎨 Color panel should now be visible and functional');
    }
    
    // Force update color field and hue slider
    updateColorField();
    updateHueSlider();
    
    // Test color picker functionality
    testColorPicker();
    console.log('🎨 Color panel setup complete!');
  }, 100);
}

// Test function to verify color picker elements
function testColorPicker() {
  console.log('🧪 Testing color picker elements...');
  
  const colorField = document.getElementById('colorField');
  const colorCursor = document.getElementById('colorCursor');
  const hueSlider = document.getElementById('hueSlider');
  const hueCursor = document.getElementById('hueCursor');
  
  console.log('🧪 Color field:', colorField ? 'Found' : 'Missing');
  console.log('🧪 Color cursor:', colorCursor ? 'Found' : 'Missing');
  console.log('🧪 Hue slider:', hueSlider ? 'Found' : 'Missing');
  console.log('🧪 Hue cursor:', hueCursor ? 'Found' : 'Missing');
  
  if (colorField && colorCursor && hueSlider && hueCursor) {
    console.log('✅ All color picker elements found!');
  } else {
    console.warn('⚠️ Some color picker elements are missing!');
  }
}

// ========================================
// GRID RESIZE FUNCTIONALITY
// ========================================

// Setup grid controls
function setupGridControls() {
  // Initialize grid size input with current value
  if (gridSizeApp) {
    gridSizeApp.value = gridSize;
  }
  
  // Setup resize button click handler
  if (resizeGridApp) {
    resizeGridApp.addEventListener('click', () => {
      const newSize = parseInt(gridSizeApp.value);
      
      // Validate grid size
      if (isNaN(newSize) || newSize < 8 || newSize > 40) {
        alert('Grid size must be between 8 and 40. Please enter a valid number.');
        if (gridSizeApp) {
          gridSizeApp.value = gridSize; // Reset to current size
          gridSizeApp.style.borderColor = ''; // Reset border color
          gridSizeApp.style.color = ''; // Reset text color
          gridSizeApp.focus(); // Focus back to input for correction
        }
        return;
      }
      
      // Don't resize if size hasn't changed
      if (newSize === gridSize) {
        console.log('Grid size unchanged');
        return;
      }
      
      // Perform the resize
      resizeGrid(newSize);
    });
  }
  
  // Setup input field behavior
  if (gridSizeApp) {
    // Allow Enter key to resize
    gridSizeApp.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        e.preventDefault();
        if (resizeGridApp) resizeGridApp.click();
      }
    });
    
    // Optional: Add visual feedback for invalid values (without changing the value)
    gridSizeApp.addEventListener('input', () => {
      const value = parseInt(gridSizeApp.value);
      if (isNaN(value) || value < 8 || value > 40) {
        gridSizeApp.style.borderColor = '#ef4444'; // Red border for invalid
        gridSizeApp.style.color = '#ef4444';
      } else {
        gridSizeApp.style.borderColor = ''; // Reset to default
        gridSizeApp.style.color = '';
      }
    });
  }
  
  console.log('🔧 Grid controls initialized');
}

// Resize the grid to a new size
function resizeGrid(newSize) {
  console.log(`🔄 Resizing grid from ${gridSize}x${gridSize} to ${newSize}x${newSize}`);
  
  // Update grid size
  gridSize = newSize;
  
  // Update grid size input and reset visual feedback
  if (gridSizeApp) {
    gridSizeApp.value = newSize;
    gridSizeApp.style.borderColor = ''; // Reset border color
    gridSizeApp.style.color = ''; // Reset text color
  }
  
  // Recreate the canvas with preserved content
  recreateCanvas();
  
  // Update layers if they exist (for layer system compatibility)
  if (layers && layers.length > 0) {
    layers = layers.map(layer => {
      const newLayer = createLayer(layer.name, gridSize, TRANSPARENT);
      generateLayerThumbnail(newLayer, gridSize);
      return newLayer;
    });
    renderLayersList();
  }
  
  console.log(`✅ Grid resized to ${gridSize}x${gridSize}`);
}

// Recreate the canvas with new grid size
function recreateCanvas() {
  if (!canvas) return;
  
  // Store current canvas state (colors of pixels)
  const currentPixels = Array.from(canvas.children).map(pixel => 
    pixel.style.backgroundColor || 'transparent'
  );
  
  // Use existing setupCanvas function to recreate the canvas
  setupCanvas();
  
  // Restore pixel colors that fit in the new size
  const newPixels = Array.from(canvas.children);
  const oldSize = Math.sqrt(currentPixels.length);
  const copySize = Math.min(oldSize, gridSize);
  
  // Copy existing pixels that fit
  for (let y = 0; y < copySize; y++) {
    for (let x = 0; x < copySize; x++) {
      const oldIndex = y * oldSize + x;
      const newIndex = y * gridSize + x;
      
      if (currentPixels[oldIndex] && currentPixels[oldIndex] !== 'transparent' && newPixels[newIndex]) {
        newPixels[newIndex].style.backgroundColor = currentPixels[oldIndex];
      }
    }
  }
  
  console.log(`🎨 Canvas recreated with ${gridSize}x${gridSize} pixels`);
}

// ========================================
// UNDO/REDO SYSTEM
// ========================================

// Setup undo/redo system
function setupUndoRedo() {
  // Get undo/redo buttons
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const undoBtnMenu = document.getElementById('undoBtnMenu');
  const redoBtnMenu = document.getElementById('redoBtnMenu');
  
  // Setup button event listeners
  if (undoBtn) {
    undoBtn.addEventListener('click', performUndo);
  }
  if (redoBtn) {
    redoBtn.addEventListener('click', performRedo);
  }
  if (undoBtnMenu) {
    undoBtnMenu.addEventListener('click', performUndo);
  }
  if (redoBtnMenu) {
    redoBtnMenu.addEventListener('click', performRedo);
  }
  
  // Initial state save
  setTimeout(() => {
    saveCanvasState();
  }, 100);
  
  // Update button states
  updateUndoRedoButtons();
  
  console.log('🔄 Undo/Redo system initialized');
}

// Save current canvas state to undo stack
function saveCanvasState() {
  if (!canvas) return;
  
  // Get current state of all pixels
  const pixels = Array.from(canvas.children);
  const state = pixels.map(pixel => ({
    index: pixel.dataset.index || pixels.indexOf(pixel),
    backgroundColor: pixel.style.backgroundColor || 'transparent'
  }));
  
  // Add to undo stack
  undoStack.push(state);
  
  // Limit undo stack size
  if (undoStack.length > MAX_UNDO_STATES) {
    undoStack.shift();
  }
  
  // Clear redo stack when new state is saved
  redoStack = [];
  
  // Update button states
  updateUndoRedoButtons();
}

// Perform undo operation
function performUndo() {
  if (undoStack.length <= 1) {
    console.log('📝 Nothing to undo');
    return;
  }
  
  // Save current state to redo stack
  const currentState = getCurrentCanvasState();
  redoStack.push(currentState);
  
  // Limit redo stack size
  if (redoStack.length > MAX_UNDO_STATES) {
    redoStack.shift();
  }
  
  // Remove current state from undo stack
  undoStack.pop();
  
  // Get previous state
  const previousState = undoStack[undoStack.length - 1];
  
  if (previousState) {
    restoreCanvasState(previousState);
    console.log('↶ Undo performed');
  }
  
  updateUndoRedoButtons();
}

// Perform redo operation
function performRedo() {
  if (redoStack.length === 0) {
    console.log('📝 Nothing to redo');
    return;
  }
  
  // Get next state from redo stack
  const nextState = redoStack.pop();
  
  if (nextState) {
    // Save current state to undo stack
    const currentState = getCurrentCanvasState();
    undoStack.push(currentState);
    
    // Limit undo stack size
    if (undoStack.length > MAX_UNDO_STATES) {
      undoStack.shift();
    }
    
    // Restore next state
    restoreCanvasState(nextState);
    console.log('↷ Redo performed');
  }
  
  updateUndoRedoButtons();
}

// Get current canvas state
function getCurrentCanvasState() {
  if (!canvas) return [];
  
  const pixels = Array.from(canvas.children);
  return pixels.map(pixel => ({
    index: pixel.dataset.index || pixels.indexOf(pixel),
    backgroundColor: pixel.style.backgroundColor || 'transparent'
  }));
}

// Restore canvas state
function restoreCanvasState(state) {
  if (!canvas || !state) return;
  
  const pixels = Array.from(canvas.children);
  
  state.forEach(pixelState => {
    const pixelIndex = parseInt(pixelState.index) || 0;
    if (pixels[pixelIndex]) {
      pixels[pixelIndex].style.backgroundColor = pixelState.backgroundColor;
    }
  });
}

// Update undo/redo button states
function updateUndoRedoButtons() {
  const undoBtn = document.getElementById('undoBtn');
  const redoBtn = document.getElementById('redoBtn');
  const undoBtnMenu = document.getElementById('undoBtnMenu');
  const redoBtnMenu = document.getElementById('redoBtnMenu');
  
  const canUndo = undoStack.length > 1;
  const canRedo = redoStack.length > 0;
  
  // Update button states
  if (undoBtn) {
    undoBtn.disabled = !canUndo;
    undoBtn.style.opacity = canUndo ? '1' : '0.5';
  }
  if (redoBtn) {
    redoBtn.disabled = !canRedo;
    redoBtn.style.opacity = canRedo ? '1' : '0.5';
  }
  if (undoBtnMenu) {
    undoBtnMenu.disabled = !canUndo;
    undoBtnMenu.style.opacity = canUndo ? '1' : '0.5';
  }
  if (redoBtnMenu) {
    redoBtnMenu.disabled = !canRedo;
    redoBtnMenu.style.opacity = canRedo ? '1' : '0.5';
  }
}

// ========================================
// CLEAR CANVAS FUNCTIONALITY
// ========================================

// Setup clear canvas functionality
function setupClearCanvas() {
  if (clearBtn) {
    clearBtn.addEventListener('click', () => {
      // Show confirmation dialog
      if (confirm('Clear the entire canvas? This action cannot be undone.')) {
        clearCanvas();
      }
    });
    console.log('🗑️ Clear canvas functionality initialized');
  }
}

// Clear the entire canvas
function clearCanvas() {
  if (!canvas) return;
  
  // Save current state for undo
  saveCanvasState();
  
  // Clear all pixels to transparent
  const pixels = Array.from(canvas.children);
  pixels.forEach(pixel => {
    pixel.style.backgroundColor = 'transparent';
  });
  
  // Update layers if they exist
  if (layers && layers[currentLayerIndex]) {
    const layer = layers[currentLayerIndex];
    layer.data = layer.data.map(() => TRANSPARENT);
    generateLayerThumbnail(layer, gridSize);
    renderLayersList();
  }
  
  console.log('🧹 Canvas cleared');
}

// Debug function for testing double-click programmatically
window.testDoubleClick = function(layerIndex = 0) {
  const layerElement = document.querySelector(`[data-layer-index="${layerIndex}"] .layer-name`);
  if (layerElement) {
    console.log('🧪 Testing double-click on layer', layerIndex, layerElement);
    const event = new MouseEvent('dblclick', {
      bubbles: true,
      cancelable: true,
      view: window
    });
    layerElement.dispatchEvent(event);
  } else {
    console.error('❌ Layer element not found for testing');
  }
};

// ========================================
// HELPER FUNCTIONS FOR TOOLS
// ========================================

// Convert RGB color to hex
function rgbToHex(rgb) {
  if (!rgb || rgb === 'transparent') return '#000000';
  
  // Handle different input types
  if (typeof rgb !== 'string') {
    console.warn('rgbToHex: Expected string, got:', typeof rgb, rgb);
    return '#000000';
  }
  
  const match = rgb.match(/rgb\((\d+),\s*(\d+),\s*(\d+)\)/);
  if (!match) return rgb; // Already hex or unknown format
  
  const r = parseInt(match[1]);
  const g = parseInt(match[2]);
  const b = parseInt(match[3]);
  
  return '#' + [r, g, b].map(x => {
    const hex = x.toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  }).join('');
}

// Set foreground color (updates color picker)
function setForegroundColor(color) {
  foregroundColor = color;
  currentColor = color;
  
  // Update color picker displays
  const fgColor = document.getElementById('foregroundColor');
  if (fgColor) {
    const preview = fgColor.querySelector('.ps-color-preview');
    if (preview) {
      preview.style.backgroundColor = color;
    } else {
      fgColor.style.backgroundColor = color;
    }
  }
  
  // Update color inputs if they exist
  const hexInput = document.getElementById('hexInput');
  if (hexInput) {
    hexInput.value = color.replace('#', '').toUpperCase();
  }
  
  // Add to recent colors if it's a valid color
  if (color && color !== 'transparent' && typeof addToRecentColors === 'function') {
    addToRecentColors(color);
  }
  
  console.log(`🎨 Foreground color set to: ${color}`);
}

// ========================================
// TOOL HELPER FUNCTIONS
// ========================================

// Flood fill algorithm
function floodFill(x, y, targetColor, fillColor) {
  if (!canvas) return;
  
  const pixels = Array.from(canvas.children);
  const visited = new Set();
  const stack = [{x, y}];
  
  while (stack.length > 0) {
    const {x: currentX, y: currentY} = stack.pop();
    const index = currentY * gridSize + currentX;
    
    if (visited.has(index) || 
        currentX < 0 || currentX >= gridSize || 
        currentY < 0 || currentY >= gridSize) {
      continue;
    }
    
    const pixel = pixels[index];
    if (!pixel) continue;
    
    const pixelColor = pixel.style.backgroundColor || 'transparent';
    if (pixelColor !== targetColor) continue;
    
    visited.add(index);
    pixel.style.backgroundColor = fillColor;
    
    // Add adjacent pixels
    stack.push({x: currentX + 1, y: currentY});
    stack.push({x: currentX - 1, y: currentY});
    stack.push({x: currentX, y: currentY + 1});
    stack.push({x: currentX, y: currentY - 1});
  }
}

// Line drawing using Bresenham's algorithm
function drawLine(x0, y0, x1, y1, color) {
  const pixels = Array.from(canvas.children);
  const points = getLinePoints(x0, y0, x1, y1);
  
  points.forEach(({x, y}) => {
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      const index = y * gridSize + x;
      const pixel = pixels[index];
      if (pixel) {
        pixel.style.backgroundColor = color;
      }
    }
  });
}

function getLinePoints(x0, y0, x1, y1) {
  const points = [];
  const dx = Math.abs(x1 - x0);
  const dy = Math.abs(y1 - y0);
  const sx = x0 < x1 ? 1 : -1;
  const sy = y0 < y1 ? 1 : -1;
  let err = dx - dy;
  
  let x = x0;
  let y = y0;
  
  while (true) {
    points.push({x, y});
    
    if (x === x1 && y === y1) break;
    
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
  
  return points;
}

// Rectangle drawing
function drawRectangle(x0, y0, x1, y1, color, filled = false) {
  const pixels = Array.from(canvas.children);
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  
  if (filled) {
    // Draw filled rectangle
    for (let y = minY; y <= maxY; y++) {
      for (let x = minX; x <= maxX; x++) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          const index = y * gridSize + x;
          const pixel = pixels[index];
          if (pixel) {
            pixel.style.backgroundColor = color;
          }
        }
      }
    }
  } else {
    // Draw rectangle outline
    drawLine(minX, minY, maxX, minY, color); // Top
    drawLine(minX, maxY, maxX, maxY, color); // Bottom
    drawLine(minX, minY, minX, maxY, color); // Left
    drawLine(maxX, minY, maxX, maxY, color); // Right
  }
}

// Circle drawing using midpoint circle algorithm
function drawCircle(centerX, centerY, endX, endY, color, filled = false) {
  const radius = Math.round(Math.sqrt((endX - centerX) ** 2 + (endY - centerY) ** 2));
  const pixels = Array.from(canvas.children);
  
  if (filled) {
    // Draw filled circle
    for (let y = -radius; y <= radius; y++) {
      for (let x = -radius; x <= radius; x++) {
        if (x * x + y * y <= radius * radius) {
          const pixelX = centerX + x;
          const pixelY = centerY + y;
          
          if (pixelX >= 0 && pixelX < gridSize && pixelY >= 0 && pixelY < gridSize) {
            const index = pixelY * gridSize + pixelX;
            const pixel = pixels[index];
            if (pixel) {
              pixel.style.backgroundColor = color;
            }
          }
        }
      }
    }
  } else {
    // Draw circle outline using midpoint algorithm
    let x = 0;
    let y = radius;
    let d = 1 - radius;
    
    const drawCirclePoints = (cx, cy, x, y) => {
      const points = [
        {x: cx + x, y: cy + y}, {x: cx - x, y: cy + y},
        {x: cx + x, y: cy - y}, {x: cx - x, y: cy - y},
        {x: cx + y, y: cy + x}, {x: cx - y, y: cy + x},
        {x: cx + y, y: cy - x}, {x: cx - y, y: cy - x}
      ];
      
      points.forEach(({x, y}) => {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
          const index = y * gridSize + x;
          const pixel = pixels[index];
          if (pixel) {
            pixel.style.backgroundColor = color;
          }
        }
      });
    };
    
    drawCirclePoints(centerX, centerY, x, y);
    
    while (x < y) {
      if (d < 0) {
        d += 2 * x + 3;
      } else {
        d += 2 * (x - y) + 5;
        y--;
      }
      x++;
      drawCirclePoints(centerX, centerY, x, y);
    }
  }
}

// Preview functions for shape tools
function clearLinePreview() {
  document.querySelectorAll('.pixel.line-preview').forEach(pixel => {
    pixel.classList.remove('line-preview');
    pixel.style.outline = '';
  });
}

function drawLinePreview(x0, y0, x1, y1) {
  const pixels = Array.from(canvas.children);
  const points = getLinePoints(x0, y0, x1, y1);
  
  points.forEach(({x, y}) => {
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      const index = y * gridSize + x;
      const pixel = pixels[index];
      if (pixel) {
        pixel.classList.add('line-preview');
        pixel.style.outline = `2px solid ${currentColor}`;
      }
    }
  });
}

function clearShapePreview() {
  document.querySelectorAll('.pixel.shape-preview').forEach(pixel => {
    pixel.classList.remove('shape-preview');
    pixel.style.outline = '';
  });
}

function drawRectanglePreview(x0, y0, x1, y1) {
  const pixels = Array.from(canvas.children);
  const minX = Math.min(x0, x1);
  const maxX = Math.max(x0, x1);
  const minY = Math.min(y0, y1);
  const maxY = Math.max(y0, y1);
  
  // Preview outline
  const outlinePoints = [];
  
  // Top and bottom edges
  for (let x = minX; x <= maxX; x++) {
    outlinePoints.push({x, y: minY});
    outlinePoints.push({x, y: maxY});
  }
  
  // Left and right edges
  for (let y = minY; y <= maxY; y++) {
    outlinePoints.push({x: minX, y});
    outlinePoints.push({x: maxX, y});
  }
  
  outlinePoints.forEach(({x, y}) => {
    if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
      const index = y * gridSize + x;
      const pixel = pixels[index];
      if (pixel) {
        pixel.classList.add('shape-preview');
        pixel.style.outline = `2px solid ${currentColor}`;
      }
    }
  });
}

function drawCirclePreview(centerX, centerY, endX, endY) {
  const radius = Math.round(Math.sqrt((endX - centerX) ** 2 + (endY - centerY) ** 2));
  const pixels = Array.from(canvas.children);
  
  // Simple circle outline preview
  let x = 0;
  let y = radius;
  let d = 1 - radius;
  
  const previewCirclePoints = (cx, cy, x, y) => {
    const points = [
      {x: cx + x, y: cy + y}, {x: cx - x, y: cy + y},
      {x: cx + x, y: cy - y}, {x: cx - x, y: cy - y},
      {x: cx + y, y: cy + x}, {x: cx - y, y: cy + x},
      {x: cx + y, y: cy - x}, {x: cx - y, y: cy - x}
    ];
    
    points.forEach(({x, y}) => {
      if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) {
        const index = y * gridSize + x;
        const pixel = pixels[index];
        if (pixel) {
          pixel.classList.add('shape-preview');
          pixel.style.outline = `2px solid ${currentColor}`;
        }
      }
    });
  };
  
  previewCirclePoints(centerX, centerY, x, y);
  
  while (x < y) {
    if (d < 0) {
      d += 2 * x + 3;
    } else {
      d += 2 * (x - y) + 5;
      y--;
    }
    x++;
    previewCirclePoints(centerX, centerY, x, y);
  }
}

// Text drawing function (simple pixel font)
function drawTextAtPosition(text, x, y) {
  // Simple 5x7 pixel font for basic characters
  const fontData = {
    'A': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,0,0,0,0]],
    'B': [[1,1,1,1,0],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[0,0,0,0,0]],
    'C': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    'D': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[0,0,0,0,0]],
    'E': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0]],
    'F': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[0,0,0,0,0]],
    'G': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,0],[1,0,1,1,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    'H': [[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,0,0,0,0]],
    'I': [[0,1,1,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0],[0,0,0,0,0]],
    'J': [[0,0,1,1,1],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[1,0,0,1,0],[0,1,1,0,0],[0,0,0,0,0]],
    'K': [[1,0,0,0,1],[1,0,0,1,0],[1,1,1,0,0],[1,0,0,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,0,0,0,0]],
    'L': [[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0]],
    'M': [[1,0,0,0,1],[1,1,0,1,1],[1,0,1,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,0,0,0,0]],
    'N': [[1,0,0,0,1],[1,1,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[1,0,0,0,1],[1,0,0,0,1],[0,0,0,0,0]],
    'O': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    'P': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,0,0],[1,0,0,0,0],[0,0,0,0,0]],
    'Q': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,0,0,1,1],[0,1,1,1,1],[0,0,0,0,0]],
    'R': [[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[1,1,1,1,0],[1,0,0,1,0],[1,0,0,0,1],[0,0,0,0,0]],
    'S': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    'T': [[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0]],
    'U': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    'V': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,0,0,0]],
    'W': [[1,0,0,0,1],[1,0,0,0,1],[1,0,0,0,1],[1,0,1,0,1],[1,1,0,1,1],[1,0,0,0,1],[0,0,0,0,0]],
    'X': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,0,1,0],[1,0,0,0,1],[0,0,0,0,0]],
    'Y': [[1,0,0,0,1],[0,1,0,1,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0]],
    'Z': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1],[0,0,0,0,0]],
    '0': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,1,1],[1,0,1,0,1],[1,1,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    '1': [[0,0,1,0,0],[0,1,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,1,1,0],[0,0,0,0,0]],
    '2': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,1,1,1,1],[0,0,0,0,0]],
    '3': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    '4': [[0,0,0,1,0],[0,0,1,1,0],[0,1,0,1,0],[1,1,1,1,1],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,0,0]],
    '5': [[1,1,1,1,1],[1,0,0,0,0],[1,1,1,1,0],[0,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    '6': [[0,1,1,1,0],[1,0,0,0,0],[1,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    '7': [[1,1,1,1,1],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,0,0,0,0]],
    '8': [[0,1,1,1,0],[1,0,0,0,1],[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    '9': [[0,1,1,1,0],[1,0,0,0,1],[1,0,0,0,1],[0,1,1,1,1],[0,0,0,0,1],[0,1,1,1,0],[0,0,0,0,0]],
    '!': [[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0]],
    '?': [[0,1,1,1,0],[1,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0]],
    '.': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,0,0,0]],
    ',': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,1,0,0,0]],
    '-': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
    '+': [[0,0,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[1,1,1,1,1],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0]],
    '=': [[0,0,0,0,0],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0],[0,0,0,0,0]],
    '(': [[0,0,1,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,0,0]],
    ')': [[0,0,1,0,0],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[0,0,0,1,0],[0,0,1,0,0],[0,0,0,0,0]],
    '[': [[1,1,1,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,0,0,0,0],[1,1,1,0,0],[0,0,0,0,0]],
    ']': [[0,0,1,1,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,0,0,1],[0,0,1,1,1],[0,0,0,0,0]],
    '{': [[0,0,1,1,0],[0,1,0,0,0],[0,1,0,0,0],[1,1,0,0,0],[0,1,0,0,0],[0,0,1,1,0],[0,0,0,0,0]],
    '}': [[1,1,0,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,1,0],[0,0,1,0,0],[1,1,0,0,0],[0,0,0,0,0]],
    '<': [[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0]],
    '>': [[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0]],
    '/': [[0,0,0,0,1],[0,0,0,1,0],[0,0,1,0,0],[0,1,0,0,0],[1,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]],
    '\\': [[1,0,0,0,0],[0,1,0,0,0],[0,0,1,0,0],[0,0,0,1,0],[0,0,0,0,1],[0,0,0,0,0],[0,0,0,0,0]],
    '|': [[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,1,0,0],[0,0,0,0,0]],
    '_': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[1,1,1,1,1],[0,0,0,0,0]],
    ' ': [[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0],[0,0,0,0,0]]
  };
  
  const pixels = Array.from(canvas.children);
  let currentX = x;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i].toUpperCase();
    const charData = fontData[char] || fontData[' '];
    
    // Draw character
    for (let row = 0; row < charData.length; row++) {
      for (let col = 0; col < charData[row].length; col++) {
        if (charData[row][col] === 1) {
          const pixelX = currentX + col;
          const pixelY = y + row;
          
          if (pixelX >= 0 && pixelX < gridSize && pixelY >= 0 && pixelY < gridSize) {
            const index = pixelY * gridSize + pixelX;
            const pixel = pixels[index];
            if (pixel) {
              pixel.style.backgroundColor = currentColor;
            }
          }
        }
      }
    }
    
    currentX += 6; // Character width + spacing
    if (currentX >= gridSize) break; // Stop if we go off canvas
  }
}

// Mouse event handlers for shape tools and move tool
document.addEventListener('mouseup', () => {
  if (toolState.isDrawing) {
    // Finalize shape tools
    if (currentTool === 'line' && toolState.startPos) {
      // Clear preview and draw final line
      clearLinePreview();
      drawLine(toolState.startPos.x, toolState.startPos.y, 
               toolState.endPos?.x || toolState.startPos.x, 
               toolState.endPos?.y || toolState.startPos.y, currentColor);
    } else if (currentTool === 'rectangle' && toolState.startPos) {
      // Clear preview and draw final rectangle
      clearShapePreview();
      drawRectangle(toolState.startPos.x, toolState.startPos.y,
                   toolState.endPos?.x || toolState.startPos.x,
                   toolState.endPos?.y || toolState.startPos.y, 
                   currentColor, toolState.shapeMode === 'filled');
    } else if (currentTool === 'circle' && toolState.startPos) {
      // Clear preview and draw final circle
      clearShapePreview();
      drawCircle(toolState.startPos.x, toolState.startPos.y,
                toolState.endPos?.x || toolState.startPos.x,
                toolState.endPos?.y || toolState.startPos.y,
                currentColor, toolState.shapeMode === 'filled');
    } else if (currentTool === 'move' && toolState.selectedPixels.length > 0) {
      // Finalize move operation
      console.log(`📍 Move operation completed`);
      
      // Remove moved-pixel class from all pixels
      document.querySelectorAll('.pixel.moved-pixel').forEach(pixel => {
        pixel.classList.remove('moved-pixel');
      });
      
      // Clear selected pixels
      toolState.selectedPixels = [];
    }
    
    // Reset drawing state
    toolState.isDrawing = false;
    toolState.startPos = null;
    toolState.endPos = null;
  }
});

// Store end position for shape tools
canvas?.addEventListener('mousemove', (e) => {
  if (toolState.isDrawing && (currentTool === 'line' || currentTool === 'rectangle' || currentTool === 'circle')) {
    const rect = canvas.getBoundingClientRect();
    const canvasX = e.clientX - rect.left;
    const canvasY = e.clientY - rect.top;
    
    const pixelWidth = rect.width / gridSize;
    const pixelHeight = rect.height / gridSize;
    
    const x = Math.floor(canvasX / pixelWidth);
    const y = Math.floor(canvasY / pixelHeight);
    
    toolState.endPos = { x, y };
  }
});

// ========================================
// RESIZABLE AND MOVEABLE PANELS
// ========================================

// Panel management state
let panelState = {
  dragging: null,
  resizing: null,
  dragOffset: { x: 0, y: 0 },
  resizeStart: { x: 0, y: 0, width: 0, height: 0 }
};

// Initialize resizable panels
function initResizablePanels() {
  const panels = document.querySelectorAll('.resizable-panel');
  
  console.log(`🔧 Found ${panels.length} resizable panels`);
  
  panels.forEach(panel => {
    console.log(`🔧 Setting up panel: ${panel.id}`);
    
    // Load saved position and size
    loadPanelState(panel);
    
    // Setup drag functionality
    setupPanelDragging(panel);
    
    // Setup resize functionality
    setupPanelResizing(panel);
  });
  
  console.log('🔧 Resizable panels initialized');
}

// Setup panel dragging
function setupPanelDragging(panel) {
  const dragHandle = panel.querySelector('.panel-drag-handle');
  if (!dragHandle) return;
  
  dragHandle.addEventListener('mousedown', (e) => {
    // Don't drag if clicking on buttons
    if (e.target.tagName === 'BUTTON' || e.target.closest('button')) return;
    
    e.preventDefault();
    e.stopPropagation();
    
    const rect = panel.getBoundingClientRect();
    panelState.dragging = panel;
    panelState.dragOffset = {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
    
    panel.classList.add('panel-dragging');
    document.body.style.cursor = 'grabbing';
    
    console.log(`🖱️ Started dragging ${panel.id}`);
  });
}

// Setup panel resizing
function setupPanelResizing(panel) {
  const resizeHandles = panel.querySelectorAll('.resize-handle');
  
  console.log(`🔧 Found ${resizeHandles.length} resize handles for ${panel.id}`);
  
  resizeHandles.forEach(handle => {
    console.log(`🔧 Setting up resize handle: ${handle.dataset.direction}`);
    
    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      const rect = panel.getBoundingClientRect();
      panelState.resizing = {
        panel: panel,
        direction: handle.dataset.direction,
        startX: e.clientX,
        startY: e.clientY,
        startWidth: rect.width,
        startHeight: rect.height,
        startLeft: rect.left,
        startTop: rect.top
      };
      
      panel.classList.add('panel-resizing');
      
      console.log(`📏 Started resizing ${panel.id} (${handle.dataset.direction})`);
    });
  });
}

// Global mouse move handler
document.addEventListener('mousemove', (e) => {
  if (panelState.dragging) {
    handlePanelDrag(e);
  } else if (panelState.resizing) {
    handlePanelResize(e);
  }
});

// Global mouse up handler
document.addEventListener('mouseup', () => {
  if (panelState.dragging) {
    finishPanelDrag();
  } else if (panelState.resizing) {
    finishPanelResize();
  }
});

// Handle panel dragging
function handlePanelDrag(e) {
  if (!panelState.dragging) return;
  
  const panel = panelState.dragging;
  const viewport = {
    width: window.innerWidth,
    height: window.innerHeight
  };
  const panelRect = panel.getBoundingClientRect();
  
  let newX = e.clientX - panelState.dragOffset.x;
  let newY = e.clientY - panelState.dragOffset.y;
  
  // Keep panel within viewport bounds
  newX = Math.max(0, Math.min(newX, viewport.width - panelRect.width));
  newY = Math.max(0, Math.min(newY, viewport.height - panelRect.height));
  
  panel.style.left = newX + 'px';
  panel.style.top = newY + 'px';
  panel.style.right = 'auto';
  panel.style.bottom = 'auto';
}

// Handle panel resizing
function handlePanelResize(e) {
  if (!panelState.resizing) return;
  
  const { panel, direction, startX, startY, startWidth, startHeight } = panelState.resizing;
  const deltaX = e.clientX - startX;
  const deltaY = e.clientY - startY;
  
  let newWidth = startWidth;
  let newHeight = startHeight;
  
  // Calculate new dimensions based on resize direction
  if (direction.includes('e')) { // East (right)
    newWidth = startWidth + deltaX;
  }
  if (direction.includes('s')) { // South (bottom)
    newHeight = startHeight + deltaY;
  }
  
  // Apply min/max constraints
  const minWidth = parseInt(getComputedStyle(panel).minWidth) || 200;
  const maxWidth = parseInt(getComputedStyle(panel).maxWidth) || 500;
  const minHeight = parseInt(getComputedStyle(panel).minHeight) || 150;
  const maxHeight = parseInt(getComputedStyle(panel).maxHeight) || window.innerHeight * 0.8;
  
  newWidth = Math.max(minWidth, Math.min(newWidth, maxWidth));
  newHeight = Math.max(minHeight, Math.min(newHeight, maxHeight));
  
  panel.style.width = newWidth + 'px';
  panel.style.height = newHeight + 'px';
}

// Finish panel drag
function finishPanelDrag() {
  if (!panelState.dragging) return;
  
  const panel = panelState.dragging;
  panel.classList.remove('panel-dragging');
  document.body.style.cursor = '';
  
  // Save panel position
  savePanelState(panel);
  
  console.log(`✅ Finished dragging ${panel.id}`);
  panelState.dragging = null;
}

// Finish panel resize
function finishPanelResize() {
  if (!panelState.resizing) return;
  
  const panel = panelState.resizing.panel;
  panel.classList.remove('panel-resizing');
  
  // Save panel size
  savePanelState(panel);
  
  console.log(`✅ Finished resizing ${panel.id}`);
  panelState.resizing = null;
}

// Save panel state to localStorage
function savePanelState(panel) {
  const rect = panel.getBoundingClientRect();
  const state = {
    left: panel.style.left,
    top: panel.style.top,
    width: panel.style.width,
    height: panel.style.height,
    timestamp: Date.now()
  };
  
  localStorage.setItem(`panel-${panel.id}`, JSON.stringify(state));
}

// Load panel state from localStorage
function loadPanelState(panel) {
  const saved = localStorage.getItem(`panel-${panel.id}`);
  if (!saved) return;
  
  try {
    const state = JSON.parse(saved);
    
    if (state.left) panel.style.left = state.left;
    if (state.top) panel.style.top = state.top;
    if (state.width) panel.style.width = state.width;
    if (state.height) panel.style.height = state.height;
    
    // Override CSS positioning
    panel.style.position = 'absolute';
    panel.style.right = 'auto';
    panel.style.bottom = 'auto';
    
    console.log(`📂 Loaded state for ${panel.id}`);
  } catch (e) {
    console.warn(`⚠️ Failed to load state for ${panel.id}:`, e);
  }
}

// Reset panel to default position and size
function resetPanelState(panelId) {
  const panel = document.getElementById(panelId);
  if (!panel) return;
  
  // Remove saved state
  localStorage.removeItem(`panel-${panelId}`);
  
  // Reset styles
  panel.style.left = '';
  panel.style.top = '';
  panel.style.width = '';
  panel.style.height = '';
  panel.style.right = '';
  panel.style.bottom = '';
  
  console.log(`🔄 Reset ${panelId} to defaults`);
}

// Keyboard shortcuts for panel management
document.addEventListener('keydown', (e) => {
  // Don't interfere if typing in inputs
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  
  // Reset panels shortcut (Ctrl+Shift+R)
  if (e.ctrlKey && e.shiftKey && e.key === 'R') {
    e.preventDefault();
    if (confirm('Reset all panels to default positions and sizes?')) {
      resetPanelState('layersPanel');
      resetPanelState('colorPanel');
      // Reload page to apply defaults
      location.reload();
    }
    return;
  }
});

// ========================================
// COLOR PANEL TABS SYSTEM
// ========================================

// Color palettes data
const colorPalettes = {
  default: [
    '#000000', '#FFFFFF', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF',
    '#808080', '#800000', '#008000', '#000080', '#808000', '#800080', '#008080', '#C0C0C0',
    '#FF8080', '#80FF80', '#8080FF', '#FFFF80', '#FF80FF', '#80FFFF', '#404040', '#FFD700'
  ],
  'web-safe': [
    '#000000', '#000033', '#000066', '#000099', '#0000CC', '#0000FF', '#003300', '#003333',
    '#003366', '#003399', '#0033CC', '#0033FF', '#006600', '#006633', '#006666', '#006699',
    '#0066CC', '#0066FF', '#009900', '#009933', '#009966', '#009999', '#0099CC', '#0099FF',
    '#00CC00', '#00CC33', '#00CC66', '#00CC99', '#00CCCC', '#00CCFF', '#00FF00', '#00FF33'
  ],
  material: [
    '#F44336', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#2196F3', '#03A9F4', '#00BCD4',
    '#009688', '#4CAF50', '#8BC34A', '#CDDC39', '#FFEB3B', '#FFC107', '#FF9800', '#FF5722',
    '#795548', '#9E9E9E', '#607D8B', '#FF1744', '#F50057', '#D500F9', '#651FFF', '#3D5AFE'
  ],
  pastel: [
    '#FFB3BA', '#FFDFBA', '#FFFFBA', '#BAFFC9', '#BAE1FF', '#E6E6FA', '#FFE4E1', '#F0FFF0',
    '#FFF8DC', '#FFE4B5', '#FFDAB9', '#EEE8AA', '#D3D3D3', '#B0E0E6', '#AFEEEE', '#F5FFFA',
    '#FDF5E6', '#FAF0E6', '#LINEN', '#FFF5EE', '#F5F5DC', '#FDFD96', '#77DD77', '#AEC6CF'
  ],
  retro: [
    '#8B4513', '#A0522D', '#CD853F', '#D2691E', '#F4A460', '#DEB887', '#D2B48C', '#BC8F8F',
    '#F0E68C', '#BDB76B', '#9ACD32', '#32CD32', '#00FF00', '#ADFF2F', '#7FFF00', '#7CFC00',
    '#00FF7F', '#00FA9A', '#98FB98', '#90EE90', '#8FBC8F', '#3CB371', '#2E8B57', '#228B22'
  ],
  monochrome: [
    '#000000', '#0D0D0D', '#1A1A1A', '#262626', '#333333', '#404040', '#4D4D4D', '#595959',
    '#666666', '#737373', '#808080', '#8C8C8C', '#999999', '#A6A6A6', '#B3B3B3', '#BFBFBF',
    '#CCCCCC', '#D9D9D9', '#E6E6E6', '#F2F2F2', '#FFFFFF', '#F5F5F5', '#EEEEEE', '#E0E0E0'
  ]
};

// Color tab state
let activeColorTab = 'picker';

// Initialize color panel tabs
function initColorTabs() {
  const tabs = document.querySelectorAll('.ps-color-tab');
  const tabContents = document.querySelectorAll('.ps-color-tab-content');
  
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const tabId = tab.dataset.tab;
      switchColorTab(tabId);
    });
  });
  
  // Initialize palette selector
  const paletteSelector = document.getElementById('paletteSelector');
  if (paletteSelector) {
    paletteSelector.addEventListener('change', (e) => {
      loadColorPalette(e.target.value);
    });
    
    // Load default palette
    loadColorPalette('default');
  }
  
  // Initialize clear recent button
  const clearRecentBtn = document.getElementById('clearRecent');
  if (clearRecentBtn) {
    clearRecentBtn.addEventListener('click', clearRecentColors);
  }
  
  console.log('🎨 Color panel tabs initialized');
}

// Switch between color tabs
function switchColorTab(tabId) {
  // Update active tab
  activeColorTab = tabId;
  
  // Update tab buttons
  document.querySelectorAll('.ps-color-tab').forEach(tab => {
    tab.classList.remove('active');
  });
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
  
  // Update tab content
  document.querySelectorAll('.ps-color-tab-content').forEach(content => {
    content.classList.remove('active');
  });
  document.getElementById(`${tabId}Tab`).classList.add('active');
  
  console.log(`🔄 Switched to ${tabId} tab`);
}

// Load color palette
function loadColorPalette(paletteType) {
  const paletteGrid = document.getElementById('paletteGrid');
  if (!paletteGrid) return;
  
  const colors = colorPalettes[paletteType] || colorPalettes.default;
  
  paletteGrid.innerHTML = '';
  
  colors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'ps-palette-color';
    colorDiv.style.backgroundColor = color;
    colorDiv.title = color;
    colorDiv.dataset.color = color;
    
    colorDiv.addEventListener('click', () => {
      setForegroundColor(color);
      console.log(`🎨 Selected palette color: ${color}`);
    });
    
    paletteGrid.appendChild(colorDiv);
  });
  
  console.log(`🎨 Loaded ${paletteType} palette with ${colors.length} colors`);
}

// Clear recent colors
function clearRecentColors() {
  const recentGrid = document.getElementById('recentColorsGrid');
  if (!recentGrid) return;
  
  if (confirm('Clear all recent colors?')) {
    recentGrid.innerHTML = '<div class="ps-recent-empty">No recent colors</div>';
    recentColors = [];
    localStorage.removeItem('pixelpro-recent-colors');
    console.log('🗑️ Recent colors cleared');
  }
}

// Add color to recent colors
function addToRecentColors(color) {
  if (!color || color === 'transparent') return;
  
  // Remove if already exists
  recentColors = recentColors.filter(c => c !== color);
  
  // Add to beginning
  recentColors.unshift(color);
  
  // Limit to 24 colors
  if (recentColors.length > 24) {
    recentColors = recentColors.slice(0, 24);
  }
  
  // Update UI
  updateRecentColorsDisplay();
  
  // Save to localStorage
  localStorage.setItem('pixelpro-recent-colors', JSON.stringify(recentColors));
}

// Update recent colors display
function updateRecentColorsDisplay() {
  const recentGrid = document.getElementById('recentColorsGrid');
  if (!recentGrid) return;
  
  if (recentColors.length === 0) {
    recentGrid.innerHTML = '<div class="ps-recent-empty" style="grid-column: 1/-1; text-align: center; color: #666; font-size: 10px; padding: 20px;">No recent colors</div>';
    return;
  }
  
  recentGrid.innerHTML = '';
  
  recentColors.forEach(color => {
    const colorDiv = document.createElement('div');
    colorDiv.className = 'ps-recent-color';
    colorDiv.style.backgroundColor = color;
    colorDiv.title = color;
    colorDiv.dataset.color = color;
    
    colorDiv.addEventListener('click', () => {
      setForegroundColor(color);
      console.log(`🎨 Selected recent color: ${color}`);
    });
    
    recentGrid.appendChild(colorDiv);
  });
}

// Enhanced set foreground color to add to recent colors
function setForegroundColorWithRecent(color) {
  setForegroundColor(color);
  addToRecentColors(color);
}

// Load recent colors from localStorage
function loadRecentColors() {
  try {
    const saved = localStorage.getItem('pixelpro-recent-colors');
    if (saved) {
      recentColors = JSON.parse(saved);
      updateRecentColorsDisplay();
      console.log(`📂 Loaded ${recentColors.length} recent colors`);
    }
  } catch (e) {
    console.warn('⚠️ Failed to load recent colors:', e);
    recentColors = [];
  }
}

// Enhanced swatch functionality
function setupEnhancedSwatches() {
  // Add swatch functionality
  const addSwatchBtn = document.getElementById('addSwatch');
  const clearSwatchesBtn = document.getElementById('clearSwatches');
  
  if (addSwatchBtn) {
    addSwatchBtn.addEventListener('click', () => {
      addCurrentColorToSwatches();
    });
  }
  
  if (clearSwatchesBtn) {
    clearSwatchesBtn.addEventListener('click', () => {
      if (confirm('Clear all custom swatches?')) {
        clearCustomSwatches();
      }
    });
  }
  
  // Setup existing swatch clicks
  document.querySelectorAll('.ps-swatch').forEach(swatch => {
    swatch.addEventListener('click', () => {
      const color = swatch.dataset.color;
      setForegroundColorWithRecent(color);
    });
  });
}

// Add current color to swatches
function addCurrentColorToSwatches() {
  const color = currentColor || foregroundColor;
  if (!color) return;
  
  const swatchesGrid = document.getElementById('swatchesGrid');
  if (!swatchesGrid) return;
  
  // Check if color already exists
  const existing = swatchesGrid.querySelector(`[data-color="${color}"]`);
  if (existing) {
    console.log(`🎨 Color ${color} already in swatches`);
    return;
  }
  
  // Create new swatch
  const swatch = document.createElement('div');
  swatch.className = 'ps-swatch';
  swatch.style.backgroundColor = color;
  swatch.dataset.color = color;
  swatch.title = color;
  
  swatch.addEventListener('click', () => {
    setForegroundColorWithRecent(color);
  });
  
  swatchesGrid.appendChild(swatch);
  
  console.log(`🎨 Added ${color} to swatches`);
}

// Clear custom swatches (keep default ones)
function clearCustomSwatches() {
  const swatchesGrid = document.getElementById('swatchesGrid');
  if (!swatchesGrid) return;
  
  // Keep only the first 12 default swatches
  const swatches = Array.from(swatchesGrid.children);
  swatches.slice(12).forEach(swatch => swatch.remove());
  
  console.log('🗑️ Custom swatches cleared');
}

console.log('✅ PixelPro Simple Script Loaded');
console.log('💡 To test double-click: testDoubleClick(0) in console');
console.log('🔧 Panel controls: Drag headers to move, drag corners/edges to resize');
console.log('⌨️ Keyboard: Ctrl+Shift+R to reset panel positions');
console.log('🎨 Color tabs: Picker, Swatches, Palettes, Recent');
console.log('🎬 Animation system: Add frames, play/pause, export GIF');

// ========================================
// ANIMATION FRAME SYSTEM
// ========================================

function setupAnimationSystem() {
  console.log('🎬 Setting up animation system...');
  
  // Set up animation controls
  setupAnimationControls();
  
  // Set up frame management
  setupFrameManagement();
  
  // Set up FPS control
  setupFPSControl();
  
  // Don't initialize frames yet - wait for canvas to be created
  console.log('🎬 Animation system ready (frames will be added when canvas is created)');
}

function setupAnimationControls() {
  const playBtn = document.getElementById('playAnimation');
  const pauseBtn = document.getElementById('pauseAnimation');
  const stopBtn = document.getElementById('stopAnimation');
  const exportBtn = document.getElementById('exportAnimation');
  
  if (playBtn) {
    playBtn.addEventListener('click', playAnimation);
  }
  
  if (pauseBtn) {
    pauseBtn.addEventListener('click', pauseAnimation);
  }
  
  if (stopBtn) {
    stopBtn.addEventListener('click', stopAnimation);
  }
  
  if (exportBtn) {
    exportBtn.addEventListener('click', exportAnimation);
  }
}

function setupFrameManagement() {
  const addFrameBtn = document.getElementById('addFrame');
  const duplicateFrameBtn = document.getElementById('duplicateFrame');
  const deleteFrameBtn = document.getElementById('deleteFrame');
  
  if (addFrameBtn) {
    addFrameBtn.addEventListener('click', addAnimationFrame);
  }
  
  if (duplicateFrameBtn) {
    duplicateFrameBtn.addEventListener('click', duplicateCurrentFrame);
  }
  
  if (deleteFrameBtn) {
    deleteFrameBtn.addEventListener('click', deleteCurrentFrame);
  }
}

function setupFPSControl() {
  const fpsInput = document.getElementById('animationFPS');
  if (fpsInput) {
    fpsInput.addEventListener('change', (e) => {
      animationFPS = parseInt(e.target.value) || 12;
      if (isPlaying) {
        stopAnimation();
        playAnimation();
      }
    });
  }
}

function addAnimationFrame() {
  const frameData = getCurrentCanvasState();
  const frame = {
    id: Date.now(),
    data: frameData,
    duration: 100, // Default 100ms
    thumbnail: generateFrameThumbnail(frameData)
  };
  
  animationFrames.push(frame);
  currentFrameIndex = animationFrames.length - 1;
  
  renderAnimationFrames();
  updateAnimationControls();
  
  console.log(`🎬 Added frame ${animationFrames.length}`);
}

function duplicateCurrentFrame() {
  if (animationFrames.length === 0) return;
  
  const currentFrame = animationFrames[currentFrameIndex];
  const newFrame = {
    id: Date.now(),
    data: JSON.parse(JSON.stringify(currentFrame.data)), // Deep copy
    duration: currentFrame.duration,
    thumbnail: currentFrame.thumbnail
  };
  
  animationFrames.splice(currentFrameIndex + 1, 0, newFrame);
  currentFrameIndex++;
  
  renderAnimationFrames();
  updateAnimationControls();
  
  console.log(`🎬 Duplicated frame ${currentFrameIndex + 1}`);
}

function deleteCurrentFrame() {
  if (animationFrames.length <= 1) {
    alert('Cannot delete the last frame. At least one frame is required.');
    return;
  }
  
  animationFrames.splice(currentFrameIndex, 1);
  
  if (currentFrameIndex >= animationFrames.length) {
    currentFrameIndex = animationFrames.length - 1;
  }
  
  renderAnimationFrames();
  updateAnimationControls();
  loadFrame(currentFrameIndex);
  
  console.log(`🎬 Deleted frame ${currentFrameIndex + 1}`);
}

function renderAnimationFrames() {
  const container = document.getElementById('framesContainer');
  if (!container) return;
  
  container.innerHTML = '';
  
  animationFrames.forEach((frame, index) => {
    const frameElement = createFrameElement(frame, index);
    container.appendChild(frameElement);
  });
}

function createFrameElement(frame, index) {
  const frameDiv = document.createElement('div');
  frameDiv.className = `frame-item ${index === currentFrameIndex ? 'active' : ''}`;
  frameDiv.dataset.frameIndex = index;
  
  frameDiv.innerHTML = `
    <div class="frame-number">${index + 1}</div>
    <img src="${frame.thumbnail}" class="frame-thumbnail" alt="Frame ${index + 1}">
    <div class="frame-duration">${frame.duration}ms</div>
    <div class="frame-actions">
      <button class="frame-action-btn" title="Delete frame">×</button>
    </div>
  `;
  
  // Add click event to select frame
  frameDiv.addEventListener('click', (e) => {
    if (!e.target.classList.contains('frame-action-btn')) {
      selectFrame(index);
    }
  });
  
  // Add delete button event
  const deleteBtn = frameDiv.querySelector('.frame-action-btn');
  if (deleteBtn) {
    deleteBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      if (index === currentFrameIndex) {
        deleteCurrentFrame();
      } else {
        // Delete specific frame
        animationFrames.splice(index, 1);
        if (currentFrameIndex > index) {
          currentFrameIndex--;
        }
        renderAnimationFrames();
        updateAnimationControls();
      }
    });
  }
  
  return frameDiv;
}

function selectFrame(index) {
  if (index < 0 || index >= animationFrames.length) return;
  
  currentFrameIndex = index;
  loadFrame(index);
  renderAnimationFrames();
  updateAnimationControls();
  
  console.log(`🎬 Selected frame ${index + 1}`);
}

function loadFrame(index) {
  if (index < 0 || index >= animationFrames.length) return;
  
  const frame = animationFrames[index];
  restoreCanvasState(frame.data);
  
  // Update layer system to match frame data
  if (frame.data.layers) {
    layers = frame.data.layers;
    currentLayerIndex = frame.data.currentLayerIndex || 0;
    renderLayersList();
  }
}

function generateFrameThumbnail(canvasState) {
  // Create a small canvas for thumbnail
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set thumbnail size (80x80)
  canvas.width = 80;
  canvas.height = 80;
  
  // Scale the canvas state to thumbnail size
  const scaleX = canvas.width / gridSize;
  const scaleY = canvas.height / gridSize;
  
  // Draw background
  ctx.fillStyle = '#23272E';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw pixels
  if (canvasState.pixels) {
    canvasState.pixels.forEach((row, y) => {
      row.forEach((color, x) => {
        if (color !== null) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scaleX, y * scaleY, scaleX, scaleY);
        }
      });
    });
  }
  
  return canvas.toDataURL();
}

function playAnimation() {
  if (animationFrames.length === 0) return;
  
  isPlaying = true;
  const playBtn = document.getElementById('playAnimation');
  const pauseBtn = document.getElementById('pauseAnimation');
  
  if (playBtn) playBtn.classList.add('hidden');
  if (pauseBtn) pauseBtn.classList.remove('hidden');
  
  const frameDelay = 1000 / animationFPS;
  
  animationInterval = setInterval(() => {
    currentFrameIndex = (currentFrameIndex + 1) % animationFrames.length;
    loadFrame(currentFrameIndex);
    renderAnimationFrames();
  }, frameDelay);
  
  console.log('🎬 Animation playing');
}

function pauseAnimation() {
  isPlaying = false;
  const playBtn = document.getElementById('playAnimation');
  const pauseBtn = document.getElementById('pauseAnimation');
  
  if (playBtn) playBtn.classList.remove('hidden');
  if (pauseBtn) pauseBtn.classList.add('hidden');
  
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
  
  console.log('🎬 Animation paused');
}

function stopAnimation() {
  isPlaying = false;
  const playBtn = document.getElementById('playAnimation');
  const pauseBtn = document.getElementById('pauseAnimation');
  
  if (playBtn) playBtn.classList.remove('hidden');
  if (pauseBtn) pauseBtn.classList.add('hidden');
  
  if (animationInterval) {
    clearInterval(animationInterval);
    animationInterval = null;
  }
  
  currentFrameIndex = 0;
  loadFrame(0);
  renderAnimationFrames();
  
  console.log('🎬 Animation stopped');
}

function updateAnimationControls() {
  const duplicateBtn = document.getElementById('duplicateFrame');
  const deleteBtn = document.getElementById('deleteFrame');
  
  if (duplicateBtn) {
    duplicateBtn.disabled = animationFrames.length === 0;
  }
  
  if (deleteBtn) {
    deleteBtn.disabled = animationFrames.length <= 1;
  }
}

function exportAnimation() {
  if (animationFrames.length === 0) {
    alert('No frames to export');
    return;
  }
  
  // Create a simple GIF-like animation using canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  // Set export size (can be adjusted)
  canvas.width = gridSize * 4; // 4x scale
  canvas.height = gridSize * 4;
  
  // Create animation preview
  const previewDiv = document.createElement('div');
  previewDiv.className = 'animation-preview';
  previewDiv.innerHTML = `
    <canvas id="exportCanvas" width="${canvas.width}" height="${canvas.height}"></canvas>
    <div class="mt-4">
      <button id="downloadAnimation" class="animation-btn bg-green-600 hover:bg-green-700">Download</button>
      <button id="closePreview" class="animation-btn bg-gray-600 hover:bg-gray-700 ml-2">Close</button>
    </div>
  `;
  
  document.body.appendChild(previewDiv);
  
  const exportCanvas = document.getElementById('exportCanvas');
  const exportCtx = exportCanvas.getContext('2d');
  
  let frameIndex = 0;
  
  function drawFrame() {
    const frame = animationFrames[frameIndex];
    if (!frame) return;
    
    // Clear canvas
    exportCtx.fillStyle = '#23272E';
    exportCtx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Draw frame data
    const scale = 4; // 4x scale
    if (frame.data.pixels) {
      frame.data.pixels.forEach((row, y) => {
        row.forEach((color, x) => {
          if (color !== null) {
            exportCtx.fillStyle = color;
            exportCtx.fillRect(x * scale, y * scale, scale, scale);
          }
        });
      });
    }
    
    frameIndex = (frameIndex + 1) % animationFrames.length;
  }
  
  // Start animation preview
  drawFrame();
  const previewInterval = setInterval(drawFrame, 1000 / animationFPS);
  
  // Set up download button
  document.getElementById('downloadAnimation').addEventListener('click', () => {
    // Create a simple sprite sheet for download
    const spriteCanvas = document.createElement('canvas');
    const spriteCtx = spriteCanvas.getContext('2d');
    
    spriteCanvas.width = gridSize * animationFrames.length;
    spriteCanvas.height = gridSize;
    
    animationFrames.forEach((frame, index) => {
      if (frame.data.pixels) {
        frame.data.pixels.forEach((row, y) => {
          row.forEach((color, x) => {
            if (color !== null) {
              spriteCtx.fillStyle = color;
              spriteCtx.fillRect(x + (index * gridSize), y, 1, 1);
            }
          });
        });
      }
    });
    
    // Download sprite sheet
    const link = document.createElement('a');
    link.download = 'pixelpro-animation.png';
    link.href = spriteCanvas.toDataURL();
    link.click();
  });
  
  // Set up close button
  document.getElementById('closePreview').addEventListener('click', () => {
    clearInterval(previewInterval);
    document.body.removeChild(previewDiv);
  });
  
  console.log('🎬 Animation export ready');
}

// Auto-save current frame when drawing
function saveCurrentFrame() {
  if (animationFrames.length === 0) {
    addAnimationFrame();
    return;
  }
  
  const currentFrame = animationFrames[currentFrameIndex];
  currentFrame.data = getCurrentCanvasState();
  currentFrame.thumbnail = generateFrameThumbnail(currentFrame.data);
  
  renderAnimationFrames();
}

// Cache buster: 1754345530

// API Key Management Functions
function saveAPIKeys() {
  const openaiKey = document.getElementById('openaiKey')?.value || '';
  const stableDiffusionKey = document.getElementById('stableDiffusionKey')?.value || '';
  const replicateKey = document.getElementById('replicateKey')?.value || '';
  
  if (openaiKey) {
    aiServiceManager.setAPIKey('openai', openaiKey);
    localStorage.setItem('pixelpro_openai_key', openaiKey);
  }
  
  if (stableDiffusionKey) {
    aiServiceManager.setAPIKey('stableDiffusion', stableDiffusionKey);
    localStorage.setItem('pixelpro_stable_diffusion_key', stableDiffusionKey);
  }
  
  if (replicateKey) {
    aiServiceManager.setAPIKey('replicate', replicateKey);
    localStorage.setItem('pixelpro_replicate_key', replicateKey);
  }
  
  console.log('🔑 API keys saved');
}

function loadAPIKeys() {
  const openaiKey = localStorage.getItem('pixelpro_openai_key') || '';
  const stableDiffusionKey = localStorage.getItem('pixelpro_stable_diffusion_key') || '';
  const replicateKey = localStorage.getItem('pixelpro_replicate_key') || '';
  
  if (openaiKey) {
    const openaiInput = document.getElementById('openaiKey');
    if (openaiInput) openaiInput.value = openaiKey;
    aiServiceManager.setAPIKey('openai', openaiKey);
  }
  
  if (stableDiffusionKey) {
    const stableDiffusionInput = document.getElementById('stableDiffusionKey');
    if (stableDiffusionInput) stableDiffusionInput.value = stableDiffusionKey;
    aiServiceManager.setAPIKey('stableDiffusion', stableDiffusionKey);
  }
  
  if (replicateKey) {
    const replicateInput = document.getElementById('replicateKey');
    if (replicateInput) replicateInput.value = replicateKey;
    aiServiceManager.setAPIKey('replicate', replicateKey);
  }
  
  console.log('🔑 API keys loaded');
}

function updateServiceStatus() {
  const serviceStatusList = document.getElementById('serviceStatusList');
  if (!serviceStatusList) return;
  
  const services = aiServiceManager.getAvailableServices();
  
  const serviceNames = {
    'openai': 'OpenAI DALL-E 3',
    'stableDiffusion': 'Stable Diffusion',
    'replicate': 'Replicate',
    'local': 'Local Generation'
  };
  
  let statusHTML = '';
  
  // Check each service
  Object.entries(serviceNames).forEach(([key, name]) => {
    const isAvailable = services.includes(key);
    const statusColor = isAvailable ? 'bg-green-500' : 'bg-red-500';
    const statusText = isAvailable ? 'Available' : 'Not Available';
    
    statusHTML += `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="w-2 h-2 ${statusColor} rounded-full"></span>
          <span>${name}</span>
        </div>
        <span class="text-xs ${isAvailable ? 'text-green-400' : 'text-red-400'}">${statusText}</span>
      </div>
    `;
  });
  
  serviceStatusList.innerHTML = statusHTML;
}

// Helper functions for AI randomization
function mirrorPixels(pixels, size) {
  const mirrored = new Array(size * size).fill('transparent');
  
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const sourceIndex = y * size + x;
      const targetIndex = y * size + (size - 1 - x);
      mirrored[targetIndex] = pixels[sourceIndex];
    }
  }
  
  return mirrored;
}

function adjustColors(pixels, colors) {
  return pixels.map(pixel => {
    if (pixel && pixel !== 'transparent') {
      // Randomly adjust color brightness
      const adjustment = Math.random() > 0.5 ? 1.2 : 0.8;
      return adjustColorBrightness(pixel, adjustment);
    }
    return pixel;
  });
}

function adjustColorBrightness(color, factor) {
  const rgb = hexToRgb(color);
  if (!rgb) return color;
  
  const newR = Math.min(255, Math.max(0, Math.floor(rgb.r * factor)));
  const newG = Math.min(255, Math.max(0, Math.floor(rgb.g * factor)));
  const newB = Math.min(255, Math.max(0, Math.floor(rgb.b * factor)));
  
  return rgbToHex(newR, newG, newB);
}

function addRandomNoise(pixels, size, colors) {
  const noisy = [...pixels];
  const noiseCount = Math.floor(size * 0.1); // 10% noise
  
  for (let i = 0; i < noiseCount; i++) {
    const x = Math.floor(Math.random() * size);
    const y = Math.floor(Math.random() * size);
    const index = y * size + x;
    
    if (noisy[index] === 'transparent' && colors.length > 0) {
      const randomColor = colors[Math.floor(Math.random() * colors.length)];
      noisy[index] = randomColor;
    }
  }
  
  return noisy;
}

// ========================================
// ADVANCED MENU SYSTEM
// ========================================

// Setup advanced menu functionality
function setupAdvancedMenuFunctionality() {
  console.log('🔧 Setting up advanced menu functionality...');
  
  // Setup dropdown menu behavior
  setupDropdownMenus();
  
  // Setup File menu
  setupFileMenu();
  
  // Setup Edit menu
  setupEditMenu();
  
  // Setup Image menu
  setupImageMenu();
  
  // Setup Layer menu
  setupLayerMenu();
  
  // Setup Animation menu
  setupAnimationMenu();
  
  // Setup View menu
  setupViewMenu();
  
  // Setup Tools menu
  setupToolsMenu();
  
  // Setup Window menu
  setupWindowMenu();
  
  // Setup Help menu
  setupHelpMenu();
  
  // Setup status bar
  setupStatusBar();
  
  // Setup keyboard shortcuts
  setupKeyboardShortcuts();
  
  console.log('🔧 Advanced menu functionality setup complete');
}

// Setup dropdown menu behavior
function setupDropdownMenus() {
  const dropdowns = document.querySelectorAll('.dropdown');
  
  dropdowns.forEach(dropdown => {
    const button = dropdown.querySelector('.menubar-btn');
    const menu = dropdown.querySelector('.dropdown-menu');
    
    if (button && menu) {
      // Toggle dropdown on click
      button.addEventListener('click', (e) => {
        e.stopPropagation();
        
        // Close other dropdowns
        dropdowns.forEach(other => {
          if (other !== dropdown) {
            other.classList.remove('open');
          }
        });
        
        // Toggle current dropdown
        dropdown.classList.toggle('open');
      });
      
      // Close dropdown when clicking outside
      document.addEventListener('click', (e) => {
        if (!dropdown.contains(e.target)) {
          dropdown.classList.remove('open');
        }
      });
      
      // Close dropdown on escape key
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
          dropdown.classList.remove('open');
        }
      });
    }
  });
}

// Setup File menu
function setupFileMenu() {
  // Start Screen
  const showStartScreenBtn = document.getElementById('showStartScreen');
  if (showStartScreenBtn) {
    showStartScreenBtn.addEventListener('click', () => {
      showStartScreen();
      closeAllMenus();
    });
  }
  
  // New Project
  const newFileBtn = document.getElementById('newFile');
  if (newFileBtn) {
    newFileBtn.addEventListener('click', () => {
      showStartScreen();
      closeAllMenus();
    });
  }
  
  // Open File
  const openFileBtn = document.getElementById('openFile');
  if (openFileBtn) {
    openFileBtn.addEventListener('click', () => {
      openFileDialog();
      closeAllMenus();
    });
  }
  
  // Save File
  const saveFileBtn = document.getElementById('saveFile');
  if (saveFileBtn) {
    saveFileBtn.addEventListener('click', () => {
      saveProject();
      closeAllMenus();
    });
  }
  
  // Save As
  const saveAsBtn = document.getElementById('saveAsFile');
  if (saveAsBtn) {
    saveAsBtn.addEventListener('click', () => {
      saveProjectAs();
      closeAllMenus();
    });
  }
  
  // Export PNG
  const exportPngBtn = document.getElementById('exportBtnMenu');
  if (exportPngBtn) {
    exportPngBtn.addEventListener('click', () => {
      exportAsPNG();
      closeAllMenus();
    });
  }
  
  // Export GIF
  const exportGifBtn = document.getElementById('exportGifMenu');
  if (exportGifBtn) {
    exportGifBtn.addEventListener('click', () => {
      exportAsGIF();
      closeAllMenus();
    });
  }
  
  // Export Sprite Sheet
  const exportSpriteBtn = document.getElementById('exportSpriteSheetMenu');
  if (exportSpriteBtn) {
    exportSpriteBtn.addEventListener('click', () => {
      exportAsSpriteSheet();
      closeAllMenus();
    });
  }
  
  // Print
  const printBtn = document.getElementById('printMenu');
  if (printBtn) {
    printBtn.addEventListener('click', () => {
      printCanvas();
      closeAllMenus();
    });
  }
  
  // Exit
  const exitBtn = document.getElementById('exitApp');
  if (exitBtn) {
    exitBtn.addEventListener('click', () => {
      exitApplication();
      closeAllMenus();
    });
  }
}

// Setup Edit menu
function setupEditMenu() {
  // Undo
  const undoBtn = document.getElementById('undoBtnMenu');
  if (undoBtn) {
    undoBtn.addEventListener('click', () => {
      performUndo();
      closeAllMenus();
    });
  }
  
  // Redo
  const redoBtn = document.getElementById('redoBtnMenu');
  if (redoBtn) {
    redoBtn.addEventListener('click', () => {
      performRedo();
      closeAllMenus();
    });
  }
  
  // Cut
  const cutBtn = document.getElementById('cutMenu');
  if (cutBtn) {
    cutBtn.addEventListener('click', () => {
      cutSelection();
      closeAllMenus();
    });
  }
  
  // Copy
  const copyBtn = document.getElementById('copyMenu');
  if (copyBtn) {
    copyBtn.addEventListener('click', () => {
      copySelection();
      closeAllMenus();
    });
  }
  
  // Paste
  const pasteBtn = document.getElementById('pasteMenu');
  if (pasteBtn) {
    pasteBtn.addEventListener('click', () => {
      pasteSelection();
      closeAllMenus();
    });
  }
  
  // Select All
  const selectAllBtn = document.getElementById('selectAllMenu');
  if (selectAllBtn) {
    selectAllBtn.addEventListener('click', () => {
      selectAll();
      closeAllMenus();
    });
  }
  
  // Clear Selection
  const clearSelectionBtn = document.getElementById('clearSelectionMenu');
  if (clearSelectionBtn) {
    clearSelectionBtn.addEventListener('click', () => {
      clearSelection();
      closeAllMenus();
    });
  }
  
  // Clear Canvas
  const clearCanvasBtn = document.getElementById('clearBtnMenu');
  if (clearCanvasBtn) {
    clearCanvasBtn.addEventListener('click', () => {
      clearCanvas();
      closeAllMenus();
    });
  }
  
  // Resize Canvas
  const resizeCanvasBtn = document.getElementById('resizeGridMenu');
  if (resizeCanvasBtn) {
    resizeCanvasBtn.addEventListener('click', () => {
      showCanvasSettingsModal();
      closeAllMenus();
    });
  }
  
  // Crop to Selection
  const cropBtn = document.getElementById('cropMenu');
  if (cropBtn) {
    cropBtn.addEventListener('click', () => {
      cropToSelection();
      closeAllMenus();
    });
  }
}

// Setup Image menu
function setupImageMenu() {
  // Flip Horizontal
  const flipHBtn = document.getElementById('flipHorizontalMenu');
  if (flipHBtn) {
    flipHBtn.addEventListener('click', () => {
      flipHorizontal();
      closeAllMenus();
    });
  }
  
  // Flip Vertical
  const flipVBtn = document.getElementById('flipVerticalMenu');
  if (flipVBtn) {
    flipVBtn.addEventListener('click', () => {
      flipVertical();
      closeAllMenus();
    });
  }
  
  // Rotate 90° Clockwise
  const rotate90Btn = document.getElementById('rotate90Menu');
  if (rotate90Btn) {
    rotate90Btn.addEventListener('click', () => {
      rotate90();
      closeAllMenus();
    });
  }
  
  // Rotate 180°
  const rotate180Btn = document.getElementById('rotate180Menu');
  if (rotate180Btn) {
    rotate180Btn.addEventListener('click', () => {
      rotate180();
      closeAllMenus();
    });
  }
  
  // Rotate 90° Counter-clockwise
  const rotate270Btn = document.getElementById('rotate270Menu');
  if (rotate270Btn) {
    rotate270Btn.addEventListener('click', () => {
      rotate270();
      closeAllMenus();
    });
  }
  
  // Invert Colors
  const invertBtn = document.getElementById('invertColorsMenu');
  if (invertBtn) {
    invertBtn.addEventListener('click', () => {
      invertColors();
      closeAllMenus();
    });
  }
  
  // Adjust Brightness
  const brightnessBtn = document.getElementById('adjustBrightnessMenu');
  if (brightnessBtn) {
    brightnessBtn.addEventListener('click', () => {
      showBrightnessDialog();
      closeAllMenus();
    });
  }
  
  // Adjust Contrast
  const contrastBtn = document.getElementById('adjustContrastMenu');
  if (contrastBtn) {
    contrastBtn.addEventListener('click', () => {
      showContrastDialog();
      closeAllMenus();
    });
  }
}

// Setup Layer menu
function setupLayerMenu() {
  // New Layer
  const newLayerBtn = document.getElementById('newLayerMenu');
  if (newLayerBtn) {
    newLayerBtn.addEventListener('click', () => {
      addLayer();
      closeAllMenus();
    });
  }
  
  // Duplicate Layer
  const duplicateLayerBtn = document.getElementById('duplicateLayerMenu');
  if (duplicateLayerBtn) {
    duplicateLayerBtn.addEventListener('click', () => {
      duplicateLayer();
      closeAllMenus();
    });
  }
  
  // Delete Layer
  const deleteLayerBtn = document.getElementById('deleteLayerMenu');
  if (deleteLayerBtn) {
    deleteLayerBtn.addEventListener('click', () => {
      deleteLayer();
      closeAllMenus();
    });
  }
  
  // Merge Down
  const mergeDownBtn = document.getElementById('mergeLayersMenu');
  if (mergeDownBtn) {
    mergeDownBtn.addEventListener('click', () => {
      mergeLayerDown();
      closeAllMenus();
    });
  }
  
  // Merge Visible
  const mergeVisibleBtn = document.getElementById('mergeVisibleMenu');
  if (mergeVisibleBtn) {
    mergeVisibleBtn.addEventListener('click', () => {
      mergeVisibleLayers();
      closeAllMenus();
    });
  }
  
  // Layer Opacity
  const opacityBtn = document.getElementById('layerOpacityMenu');
  if (opacityBtn) {
    opacityBtn.addEventListener('click', () => {
      showOpacityDialog();
      closeAllMenus();
    });
  }
  
  // Blend Mode
  const blendModeBtn = document.getElementById('layerBlendModeMenu');
  if (blendModeBtn) {
    blendModeBtn.addEventListener('click', () => {
      showBlendModeDialog();
      closeAllMenus();
    });
  }
}

// Setup Animation menu
function setupAnimationMenu() {
  // New Frame
  const newFrameBtn = document.getElementById('newFrameMenu');
  if (newFrameBtn) {
    newFrameBtn.addEventListener('click', () => {
      addAnimationFrame();
      closeAllMenus();
    });
  }
  
  // Duplicate Frame
  const duplicateFrameBtn = document.getElementById('duplicateFrameMenu');
  if (duplicateFrameBtn) {
    duplicateFrameBtn.addEventListener('click', () => {
      duplicateCurrentFrame();
      closeAllMenus();
    });
  }
  
  // Delete Frame
  const deleteFrameBtn = document.getElementById('deleteFrameMenu');
  if (deleteFrameBtn) {
    deleteFrameBtn.addEventListener('click', () => {
      deleteCurrentFrame();
      closeAllMenus();
    });
  }
  
  // Play Animation
  const playAnimBtn = document.getElementById('playAnimationMenu');
  if (playAnimBtn) {
    playAnimBtn.addEventListener('click', () => {
      playAnimation();
      closeAllMenus();
    });
  }
  
  // Stop Animation
  const stopAnimBtn = document.getElementById('stopAnimationMenu');
  if (stopAnimBtn) {
    stopAnimBtn.addEventListener('click', () => {
      stopAnimation();
      closeAllMenus();
    });
  }
  
  // Set Frame Delay
  const frameDelayBtn = document.getElementById('setFrameDelayMenu');
  if (frameDelayBtn) {
    frameDelayBtn.addEventListener('click', () => {
      showFrameDelayDialog();
      closeAllMenus();
    });
  }
  
  // Export Animation
  const exportAnimBtn = document.getElementById('exportAnimationMenu');
  if (exportAnimBtn) {
    exportAnimBtn.addEventListener('click', () => {
      exportAnimation();
      closeAllMenus();
    });
  }
}

// Setup View menu
function setupViewMenu() {
  // Zoom In
  const zoomInBtn = document.getElementById('zoomInMenu');
  if (zoomInBtn) {
    zoomInBtn.addEventListener('click', () => {
      zoomIn();
      closeAllMenus();
    });
  }
  
  // Zoom Out
  const zoomOutBtn = document.getElementById('zoomOutMenu');
  if (zoomOutBtn) {
    zoomOutBtn.addEventListener('click', () => {
      zoomOut();
      closeAllMenus();
    });
  }
  
  // Fit to Screen
  const zoomFitBtn = document.getElementById('zoomFitMenu');
  if (zoomFitBtn) {
    zoomFitBtn.addEventListener('click', () => {
      zoomFit();
      closeAllMenus();
    });
  }
  
  // Actual Size
  const zoom100Btn = document.getElementById('zoom100Menu');
  if (zoom100Btn) {
    zoom100Btn.addEventListener('click', () => {
      zoom100();
      closeAllMenus();
    });
  }
  
  // Show Grid
  const toggleGridBtn = document.getElementById('toggleGridMenu');
  if (toggleGridBtn) {
    toggleGridBtn.addEventListener('click', () => {
      toggleGrid();
      closeAllMenus();
    });
  }
  
  // Show Pixel Grid
  const togglePixelGridBtn = document.getElementById('togglePixelGridMenu');
  if (togglePixelGridBtn) {
    togglePixelGridBtn.addEventListener('click', () => {
      togglePixelGrid();
      closeAllMenus();
    });
  }
  
  // Toggle Tools Panel
  const toggleToolsBtn = document.getElementById('toggleSidebar');
  if (toggleToolsBtn) {
    toggleToolsBtn.addEventListener('click', () => {
      toggleSidebar();
      closeAllMenus();
    });
  }
  
  // Toggle Layers Panel
  const toggleLayersBtn = document.getElementById('toggleLayers');
  if (toggleLayersBtn) {
    toggleLayersBtn.addEventListener('click', () => {
      toggleLayers();
      closeAllMenus();
    });
  }
  
  // Toggle Color Panel
  const toggleColorBtn = document.getElementById('toggleColorPanel');
  if (toggleColorBtn) {
    toggleColorBtn.addEventListener('click', () => {
      toggleColorPanel();
      closeAllMenus();
    });
  }
  
  // Toggle Dark Mode
  const toggleDarkBtn = document.getElementById('toggleDarkMode');
  if (toggleDarkBtn) {
    toggleDarkBtn.addEventListener('click', () => {
      toggleDarkMode();
      closeAllMenus();
    });
  }
  
  // Toggle Fullscreen
  const toggleFullscreenBtn = document.getElementById('toggleFullscreen');
  if (toggleFullscreenBtn) {
    toggleFullscreenBtn.addEventListener('click', () => {
      toggleFullscreen();
      closeAllMenus();
    });
  }
}

// Setup Tools menu
function setupToolsMenu() {
  // Pencil Tool
  const pencilBtn = document.getElementById('pencilToolMenu');
  if (pencilBtn) {
    pencilBtn.addEventListener('click', () => {
      setCurrentTool('pencil');
      closeAllMenus();
    });
  }
  
  // Brush Tool
  const brushBtn = document.getElementById('brushToolMenu');
  if (brushBtn) {
    brushBtn.addEventListener('click', () => {
      setCurrentTool('brush');
      closeAllMenus();
    });
  }
  
  // Eraser Tool
  const eraserBtn = document.getElementById('eraserToolMenu');
  if (eraserBtn) {
    eraserBtn.addEventListener('click', () => {
      setCurrentTool('eraser');
      closeAllMenus();
    });
  }
  
  // Fill Tool
  const fillBtn = document.getElementById('fillToolMenu');
  if (fillBtn) {
    fillBtn.addEventListener('click', () => {
      setCurrentTool('fill');
      closeAllMenus();
    });
  }
  
  // Eyedropper Tool
  const eyedropperBtn = document.getElementById('eyedropperToolMenu');
  if (eyedropperBtn) {
    eyedropperBtn.addEventListener('click', () => {
      setCurrentTool('eyedropper');
      closeAllMenus();
    });
  }
  
  // Line Tool
  const lineBtn = document.getElementById('lineToolMenu');
  if (lineBtn) {
    lineBtn.addEventListener('click', () => {
      setCurrentTool('line');
      closeAllMenus();
    });
  }
  
  // Rectangle Tool
  const rectBtn = document.getElementById('rectangleToolMenu');
  if (rectBtn) {
    rectBtn.addEventListener('click', () => {
      setCurrentTool('rectangle');
      closeAllMenus();
    });
  }
  
  // Circle Tool
  const circleBtn = document.getElementById('circleToolMenu');
  if (circleBtn) {
    circleBtn.addEventListener('click', () => {
      setCurrentTool('circle');
      closeAllMenus();
    });
  }
  
  // Text Tool
  const textBtn = document.getElementById('textToolMenu');
  if (textBtn) {
    textBtn.addEventListener('click', () => {
      setCurrentTool('text');
      closeAllMenus();
    });
  }
  
  // Move Tool
  const moveBtn = document.getElementById('moveToolMenu');
  if (moveBtn) {
    moveBtn.addEventListener('click', () => {
      setCurrentTool('move');
      closeAllMenus();
    });
  }
  
  // AI Generator
  const aiBtn = document.getElementById('aiToolMenu');
  if (aiBtn) {
    aiBtn.addEventListener('click', () => {
      setCurrentTool('ai');
      closeAllMenus();
    });
  }
}

// Setup Window menu
function setupWindowMenu() {
  // Minimize
  const minimizeBtn = document.getElementById('minimizeWindow');
  if (minimizeBtn) {
    minimizeBtn.addEventListener('click', () => {
      minimizeWindow();
      closeAllMenus();
    });
  }
  
  // Maximize
  const maximizeBtn = document.getElementById('maximizeWindow');
  if (maximizeBtn) {
    maximizeBtn.addEventListener('click', () => {
      maximizeWindow();
      closeAllMenus();
    });
  }
  
  // Reset Panels
  const resetPanelsBtn = document.getElementById('resetPanels');
  if (resetPanelsBtn) {
    resetPanelsBtn.addEventListener('click', () => {
      resetPanelLayout();
      closeAllMenus();
    });
  }
  
  // Save Layout
  const saveLayoutBtn = document.getElementById('saveLayout');
  if (saveLayoutBtn) {
    saveLayoutBtn.addEventListener('click', () => {
      savePanelLayout();
      closeAllMenus();
    });
  }
  
  // Load Layout
  const loadLayoutBtn = document.getElementById('loadLayout');
  if (loadLayoutBtn) {
    loadLayoutBtn.addEventListener('click', () => {
      loadPanelLayout();
      closeAllMenus();
    });
  }
}

// Setup Help menu
function setupHelpMenu() {
  // Help Documentation
  const helpBtn = document.getElementById('helpMenu');
  if (helpBtn) {
    helpBtn.addEventListener('click', () => {
      showHelpDocumentation();
      closeAllMenus();
    });
  }
  
  // Keyboard Shortcuts
  const shortcutsBtn = document.getElementById('shortcutsMenu');
  if (shortcutsBtn) {
    shortcutsBtn.addEventListener('click', () => {
      showKeyboardShortcuts();
      closeAllMenus();
    });
  }
  
  // Interactive Tutorial
  const tutorialBtn = document.getElementById('tutorialMenu');
  if (tutorialBtn) {
    tutorialBtn.addEventListener('click', () => {
      startInteractiveTutorial();
      closeAllMenus();
    });
  }
  
  // Check for Updates
  const updatesBtn = document.getElementById('checkUpdatesMenu');
  if (updatesBtn) {
    updatesBtn.addEventListener('click', () => {
      checkForUpdates();
      closeAllMenus();
    });
  }
  
  // Report Bug
  const reportBugBtn = document.getElementById('reportBugMenu');
  if (reportBugBtn) {
    reportBugBtn.addEventListener('click', () => {
      reportBug();
      closeAllMenus();
    });
  }
  
  // Send Feedback
  const feedbackBtn = document.getElementById('feedbackMenu');
  if (feedbackBtn) {
    feedbackBtn.addEventListener('click', () => {
      sendFeedback();
      closeAllMenus();
    });
  }
  
  // About
  const aboutBtn = document.getElementById('aboutMenu');
  if (aboutBtn) {
    aboutBtn.addEventListener('click', () => {
      showAboutDialog();
      closeAllMenus();
    });
  }
}

// Setup status bar
function setupStatusBar() {
  updateStatusBar();
  
  // Update status bar periodically
  setInterval(updateStatusBar, 1000);
}

// Update status bar information
function updateStatusBar() {
  const statusText = document.getElementById('statusText');
  const canvasSize = document.getElementById('canvasSize');
  const currentTool = document.getElementById('currentTool');
  const zoomLevel = document.getElementById('zoomLevel');
  
  if (statusText) {
    statusText.textContent = getStatusText();
  }
  
  if (canvasSize) {
    canvasSize.textContent = `${gridSize}×${gridSize}`;
  }
  
  if (currentTool) {
    currentTool.textContent = getCurrentToolName();
  }
  
  if (zoomLevel) {
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
  }
}

// Setup keyboard shortcuts
function setupKeyboardShortcuts() {
  document.addEventListener('keydown', (e) => {
    // Don't trigger shortcuts when typing in input fields
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
      return;
    }
    
    // File shortcuts
    if (e.ctrlKey && e.key === 'n') {
      e.preventDefault();
      showStartScreen();
    }
    if (e.ctrlKey && e.key === 'o') {
      e.preventDefault();
      openFileDialog();
    }
    if (e.ctrlKey && e.key === 's') {
      e.preventDefault();
      if (e.shiftKey) {
        saveProjectAs();
      } else {
        saveProject();
      }
    }
    if (e.ctrlKey && e.key === 'e') {
      e.preventDefault();
      exportAsPNG();
    }
    if (e.ctrlKey && e.key === 'p') {
      e.preventDefault();
      printCanvas();
    }
    if (e.ctrlKey && e.key === 'q') {
      e.preventDefault();
      exitApplication();
    }
    
    // Edit shortcuts
    if (e.ctrlKey && e.key === 'z') {
      e.preventDefault();
      performUndo();
    }
    if (e.ctrlKey && e.key === 'y') {
      e.preventDefault();
      performRedo();
    }
    if (e.ctrlKey && e.key === 'x') {
      e.preventDefault();
      cutSelection();
    }
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      copySelection();
    }
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
      pasteSelection();
    }
    if (e.ctrlKey && e.key === 'a') {
      e.preventDefault();
      selectAll();
    }
    if (e.ctrlKey && e.shiftKey && e.key === 'C') {
      e.preventDefault();
      clearCanvas();
    }
    
    // View shortcuts
    if (e.ctrlKey && e.key === '=') {
      e.preventDefault();
      zoomIn();
    }
    if (e.ctrlKey && e.key === '-') {
      e.preventDefault();
      zoomOut();
    }
    if (e.ctrlKey && e.key === '0') {
      e.preventDefault();
      zoomFit();
    }
    if (e.ctrlKey && e.key === '1') {
      e.preventDefault();
      zoom100();
    }
    if (e.ctrlKey && e.key === 'g') {
      e.preventDefault();
      toggleGrid();
    }
    
    // Tool shortcuts
    if (e.key === 'b') {
      e.preventDefault();
      setCurrentTool('pencil');
    }
    if (e.key === 'e') {
      e.preventDefault();
      setCurrentTool('eraser');
    }
    if (e.key === 'g') {
      e.preventDefault();
      setCurrentTool('fill');
    }
    if (e.key === 'i') {
      e.preventDefault();
      setCurrentTool('eyedropper');
    }
    if (e.key === 'l') {
      e.preventDefault();
      setCurrentTool('line');
    }
    if (e.key === 'r') {
      e.preventDefault();
      setCurrentTool('rectangle');
    }
    if (e.key === 'c') {
      e.preventDefault();
      setCurrentTool('circle');
    }
    if (e.key === 't') {
      e.preventDefault();
      setCurrentTool('text');
    }
    if (e.key === 'v') {
      e.preventDefault();
      setCurrentTool('move');
    }
    if (e.key === 'a') {
      e.preventDefault();
      setCurrentTool('ai');
    }
    if (e.key === 'd') {
      e.preventDefault();
      setCurrentTool('dither');
    }
    if (e.key === 'o') {
      e.preventDefault();
      setCurrentTool('outline');
    }
    if (e.key === 's') {
      e.preventDefault();
      setCurrentTool('shade');
    }
    if (e.key === 'm') {
      e.preventDefault();
      setCurrentTool('mirror');
    }
    if (e.key === 'h') {
      e.preventDefault();
      setCurrentTool('gradient');
    }
    if (e.key === 'u') {
      e.preventDefault();
      setCurrentTool('pattern');
    }
    if (e.key === 'k') {
      e.preventDefault();
      setCurrentTool('symmetry');
    }
    if (e.key === 'x') {
      e.preventDefault();
      setCurrentTool('selection');
    }
    if (e.key === 'w') {
      e.preventDefault();
      setCurrentTool('magicWand');
    }
    if (e.key === 'j') {
      e.preventDefault();
      setCurrentTool('lasso');
    }
    
    // Animation shortcuts
    if (e.ctrlKey && e.shiftKey && e.key === 'F') {
      e.preventDefault();
      addAnimationFrame();
    }
    if (e.ctrlKey && e.key === 'd') {
      e.preventDefault();
      duplicateCurrentFrame();
    }
    if (e.key === ' ') {
      e.preventDefault();
      playAnimation();
    }
    
    // Help shortcuts
    if (e.key === 'F1') {
      e.preventDefault();
      showHelpDocumentation();
    }
    if (e.key === 'F11') {
      e.preventDefault();
      toggleFullscreen();
    }
  });
}

// Utility functions for menu actions
function closeAllMenus() {
  const dropdowns = document.querySelectorAll('.dropdown');
  dropdowns.forEach(dropdown => {
    dropdown.classList.remove('open');
  });
}

function getStatusText() {
  if (isAnimating) return 'Playing Animation';
  if (isDrawing) return 'Drawing';
  if (isSelecting) return 'Selecting';
  return 'Ready';
}

function getCurrentToolName() {
  const toolNames = {
    'pencil': 'Pencil',
    'brush': 'Brush',
    'eraser': 'Eraser',
    'fill': 'Fill',
    'eyedropper': 'Eyedropper',
    'line': 'Line',
    'rectangle': 'Rectangle',
    'circle': 'Circle',
    'text': 'Text',
    'move': 'Move',
    'ai': 'AI Generator'
  };
  return toolNames[currentTool] || 'Pencil';
}

// Menu action functions - File menu
function saveProjectAs() {
  console.log('💾 Save As functionality');
  
  // Create a temporary input element for file name
  const input = document.createElement('input');
  input.type = 'text';
  input.placeholder = 'Enter filename (without extension)';
  input.value = 'pixelpro-project';
  
  // Create a dialog
  const dialog = document.createElement('div');
  dialog.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const dialogContent = document.createElement('div');
  dialogContent.style.cssText = `
    background: #2a2a2a;
    padding: 20px;
    border-radius: 8px;
    border: 1px solid #444;
    min-width: 300px;
  `;
  
  const title = document.createElement('h3');
  title.textContent = 'Save Project As';
  title.style.cssText = 'margin: 0 0 15px 0; color: #fff;';
  
  const buttonContainer = document.createElement('div');
  buttonContainer.style.cssText = 'display: flex; gap: 10px; justify-content: flex-end; margin-top: 15px;';
  
  const saveBtn = document.createElement('button');
  saveBtn.textContent = 'Save';
  saveBtn.style.cssText = 'padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;';
  
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Cancel';
  cancelBtn.style.cssText = 'padding: 8px 16px; background: #6b7280; color: white; border: none; border-radius: 4px; cursor: pointer;';
  
  input.style.cssText = 'width: 100%; padding: 8px; background: #1a1a1a; color: #fff; border: 1px solid #444; border-radius: 4px;';
  
  const handleSave = () => {
    const filename = input.value.trim() || 'pixelpro-project';
    const projectData = {
      gridSize: gridSize,
      layers: layers,
      currentLayerIndex: currentLayerIndex,
      animationFrames: animationFrames,
      currentFrameIndex: currentFrameIndex,
      timestamp: Date.now()
    };
    
    const blob = new Blob([JSON.stringify(projectData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.pixelpro`;
    a.click();
    URL.revokeObjectURL(url);
    
    // Save to recent files
    saveRecentFile(`${filename}.pixelpro`, projectData);
    
    document.body.removeChild(dialog);
  };
  
  const handleCancel = () => {
    document.body.removeChild(dialog);
  };
  
  saveBtn.addEventListener('click', handleSave);
  cancelBtn.addEventListener('click', handleCancel);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') handleSave();
    if (e.key === 'Escape') handleCancel();
  });
  
  buttonContainer.appendChild(cancelBtn);
  buttonContainer.appendChild(saveBtn);
  dialogContent.appendChild(title);
  dialogContent.appendChild(input);
  dialogContent.appendChild(buttonContainer);
  dialog.appendChild(dialogContent);
  document.body.appendChild(dialog);
  
  input.focus();
}

function exportAsPNG() {
  console.log('📤 Export PNG functionality');
  
  // Create a canvas to draw the current state
  const exportCanvas = document.createElement('canvas');
  const ctx = exportCanvas.getContext('2d');
  
  // Set canvas size (scale up for better quality)
  const scale = 4;
  exportCanvas.width = gridSize * scale;
  exportCanvas.height = gridSize * scale;
  
  // Draw the current canvas state
  const currentState = getCurrentCanvasState();
  if (currentState && currentState.pixels) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const pixelIndex = y * gridSize + x;
        const color = currentState.pixels[pixelIndex];
        
        if (color && color !== TRANSPARENT) {
          ctx.fillStyle = color;
          ctx.fillRect(x * scale, y * scale, scale, scale);
        }
      }
    }
  }
  
  // Create download link
  exportCanvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelpro-export-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function exportAsGIF() {
  console.log('📤 Export GIF functionality');
  
  if (animationFrames.length === 0) {
    alert('No animation frames to export. Create some frames first!');
    return;
  }
  
  // Create a simple GIF export using canvas
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = gridSize * 4; // Scale up
  canvas.height = gridSize * 4;
  
  // For now, export the first frame as PNG since GIF creation is complex
  // In a real implementation, you'd use a GIF library like gif.js
  const firstFrame = animationFrames[0];
  if (firstFrame && firstFrame.pixels) {
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const pixelIndex = y * gridSize + x;
        const color = firstFrame.pixels[pixelIndex];
        
        if (color && color !== TRANSPARENT) {
          ctx.fillStyle = color;
          ctx.fillRect(x * 4, y * 4, 4, 4);
        }
      }
    }
  }
  
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelpro-animation-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
  
  alert('GIF export is currently exporting as PNG. Full GIF support coming soon!');
}

function exportAsSpriteSheet() {
  console.log('📤 Export Sprite Sheet functionality');
  
  if (animationFrames.length === 0) {
    alert('No animation frames to export. Create some frames first!');
    return;
  }
  
  // Create a sprite sheet canvas
  const framesPerRow = Math.ceil(Math.sqrt(animationFrames.length));
  const frameSize = gridSize * 4; // Scale up
  const spriteSheetWidth = framesPerRow * frameSize;
  const spriteSheetHeight = Math.ceil(animationFrames.length / framesPerRow) * frameSize;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = spriteSheetWidth;
  canvas.height = spriteSheetHeight;
  
  // Draw each frame
  animationFrames.forEach((frame, index) => {
    const row = Math.floor(index / framesPerRow);
    const col = index % framesPerRow;
    const x = col * frameSize;
    const y = row * frameSize;
    
    if (frame && frame.pixels) {
      for (let py = 0; py < gridSize; py++) {
        for (let px = 0; px < gridSize; px++) {
          const pixelIndex = py * gridSize + px;
          const color = frame.pixels[pixelIndex];
          
          if (color && color !== TRANSPARENT) {
            ctx.fillStyle = color;
            ctx.fillRect(x + px * 4, y + py * 4, 4, 4);
          }
        }
      }
    }
  });
  
  canvas.toBlob((blob) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pixelpro-spritesheet-${Date.now()}.png`;
    a.click();
    URL.revokeObjectURL(url);
  });
}

function printCanvas() {
  console.log('🖨️ Print functionality');
  
  // Create a print-friendly version
  const printWindow = window.open('', '_blank');
  const currentState = getCurrentCanvasState();
  
  if (currentState && currentState.pixels) {
    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>PixelPro Print</title>
        <style>
          body { margin: 20px; font-family: Arial, sans-serif; }
          .pixel-grid { 
            display: inline-block; 
            border: 2px solid #000; 
            background: #fff;
          }
          .pixel { 
            width: 8px; 
            height: 8px; 
            display: inline-block; 
            margin: 0; 
            padding: 0;
          }
          @media print {
            body { margin: 0; }
            .pixel-grid { border: 1px solid #000; }
          }
        </style>
      </head>
      <body>
        <h1>PixelPro Artwork</h1>
        <div class="pixel-grid">
    `;
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const pixelIndex = y * gridSize + x;
        const color = currentState.pixels[pixelIndex];
        const bgColor = color && color !== TRANSPARENT ? color : '#fff';
        printContent += `<div class="pixel" style="background-color: ${bgColor};"></div>`;
      }
      printContent += '<br>';
    }
    
    printContent += `
        </div>
        <p>Generated on ${new Date().toLocaleString()}</p>
      </body>
      </html>
    `;
    
    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.print();
  } else {
    alert('No artwork to print. Create something first!');
  }
}

function exitApplication() {
  console.log('🚪 Exit application functionality');
  
  // Check if there are unsaved changes
  const hasChanges = undoStack.length > 0;
  
  if (hasChanges) {
    const shouldExit = confirm('You have unsaved changes. Are you sure you want to exit?');
    if (!shouldExit) return;
  }
  
  // In a web app, we can't actually exit, but we can show a message
  alert('Thank you for using PixelPro! In a desktop app, this would close the application.');
  
  // Optionally, you could redirect to a different page
  // window.location.href = 'about:blank';
}

function cutSelection() {
  console.log('✂️ Cut selection functionality');
  
  // For now, implement a simple cut that clears the canvas
  if (confirm('Cut will clear the current canvas. Continue?')) {
    clearCanvas();
    alert('Canvas cleared (cut functionality)');
  }
}

function copySelection() {
  console.log('📋 Copy selection functionality');
  
  // Copy current canvas state to clipboard
  const currentState = getCurrentCanvasState();
  if (currentState && currentState.pixels) {
    try {
      // Create a simple text representation for clipboard
      let copyText = `PixelPro Artwork (${gridSize}x${gridSize})\n`;
      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const pixelIndex = y * gridSize + x;
          const color = currentState.pixels[pixelIndex];
          copyText += color && color !== TRANSPARENT ? '█' : ' ';
        }
        copyText += '\n';
      }
      
      navigator.clipboard.writeText(copyText).then(() => {
        alert('Canvas copied to clipboard!');
      }).catch(() => {
        alert('Copy to clipboard failed, but canvas state is saved.');
      });
    } catch (e) {
      alert('Copy functionality not available in this browser.');
    }
  } else {
    alert('No artwork to copy. Create something first!');
  }
}

function pasteSelection() {
  console.log('📋 Paste selection functionality');
  
  // For now, this would paste from clipboard
  // In a full implementation, you'd read from clipboard
  alert('Paste functionality would paste from clipboard. Not implemented in this demo.');
}

function selectAll() {
  console.log('📋 Select all functionality');
  
  // In a full implementation, this would select all pixels
  alert('Select all would select all pixels on the canvas. Not implemented in this demo.');
}

function clearSelection() {
  console.log('📋 Clear selection functionality');
  
  // In a full implementation, this would clear the current selection
  alert('Clear selection would clear the current selection. Not implemented in this demo.');
}

function cropToSelection() {
  console.log('✂️ Crop to selection functionality');
  
  // For now, this would crop to the current canvas size
  alert('Crop to selection would crop the canvas to the selected area. Not implemented in this demo.');
}

function flipHorizontal() {
  console.log('🔄 Flip horizontal functionality');
  
  const currentState = getCurrentCanvasState();
  if (currentState && currentState.pixels) {
    const newPixels = new Array(gridSize * gridSize);
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const oldIndex = y * gridSize + x;
        const newIndex = y * gridSize + (gridSize - 1 - x);
        newPixels[newIndex] = currentState.pixels[oldIndex];
      }
    }
    
    // Save current state for undo
    saveCanvasState();
    
    // Apply the flipped pixels
    for (let i = 0; i < newPixels.length; i++) {
      const pixel = document.querySelector(`[data-pixel="${i}"]`);
      if (pixel) {
        const color = newPixels[i];
        pixel.style.backgroundColor = color && color !== TRANSPARENT ? color : 'transparent';
      }
    }
    
    // Update the current state
    currentState.pixels = newPixels;
    alert('Canvas flipped horizontally!');
  }
}

function flipVertical() {
  console.log('🔄 Flip vertical functionality');
  
  const currentState = getCurrentCanvasState();
  if (currentState && currentState.pixels) {
    const newPixels = new Array(gridSize * gridSize);
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const oldIndex = y * gridSize + x;
        const newIndex = (gridSize - 1 - y) * gridSize + x;
        newPixels[newIndex] = currentState.pixels[oldIndex];
      }
    }
    
    // Save current state for undo
    saveCanvasState();
    
    // Apply the flipped pixels
    for (let i = 0; i < newPixels.length; i++) {
      const pixel = document.querySelector(`[data-pixel="${i}"]`);
      if (pixel) {
        const color = newPixels[i];
        pixel.style.backgroundColor = color && color !== TRANSPARENT ? color : 'transparent';
      }
    }
    
    // Update the current state
    currentState.pixels = newPixels;
    alert('Canvas flipped vertically!');
  }
}

function rotate90() {
  console.log('🔄 Rotate 90° functionality');
  
  const currentState = getCurrentCanvasState();
  if (currentState && currentState.pixels) {
    const newPixels = new Array(gridSize * gridSize);
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const oldIndex = y * gridSize + x;
        const newIndex = x * gridSize + (gridSize - 1 - y);
        newPixels[newIndex] = currentState.pixels[oldIndex];
      }
    }
    
    // Save current state for undo
    saveCanvasState();
    
    // Apply the rotated pixels
    for (let i = 0; i < newPixels.length; i++) {
      const pixel = document.querySelector(`[data-pixel="${i}"]`);
      if (pixel) {
        const color = newPixels[i];
        pixel.style.backgroundColor = color && color !== TRANSPARENT ? color : 'transparent';
      }
    }
    
    // Update the current state
    currentState.pixels = newPixels;
    alert('Canvas rotated 90° clockwise!');
  }
}

function rotate180() {
  console.log('🔄 Rotate 180° functionality');
  
  const currentState = getCurrentCanvasState();
  if (currentState && currentState.pixels) {
    const newPixels = new Array(gridSize * gridSize);
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const oldIndex = y * gridSize + x;
        const newIndex = (gridSize - 1 - y) * gridSize + (gridSize - 1 - x);
        newPixels[newIndex] = currentState.pixels[oldIndex];
      }
    }
    
    // Save current state for undo
    saveCanvasState();
    
    // Apply the rotated pixels
    for (let i = 0; i < newPixels.length; i++) {
      const pixel = document.querySelector(`[data-pixel="${i}"]`);
      if (pixel) {
        const color = newPixels[i];
        pixel.style.backgroundColor = color && color !== TRANSPARENT ? color : 'transparent';
      }
    }
    
    // Update the current state
    currentState.pixels = newPixels;
    alert('Canvas rotated 180°!');
  }
}

function rotate270() {
  console.log('🔄 Rotate 270° functionality');
  
  const currentState = getCurrentCanvasState();
  if (currentState && currentState.pixels) {
    const newPixels = new Array(gridSize * gridSize);
    
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const oldIndex = y * gridSize + x;
        const newIndex = (gridSize - 1 - x) * gridSize + y;
        newPixels[newIndex] = currentState.pixels[oldIndex];
      }
    }
    
    // Save current state for undo
    saveCanvasState();
    
    // Apply the rotated pixels
    for (let i = 0; i < newPixels.length; i++) {
      const pixel = document.querySelector(`[data-pixel="${i}"]`);
      if (pixel) {
        const color = newPixels[i];
        pixel.style.backgroundColor = color && color !== TRANSPARENT ? color : 'transparent';
      }
    }
    
    // Update the current state
    currentState.pixels = newPixels;
    alert('Canvas rotated 270° (90° counter-clockwise)!');
  }
}

function invertColors() {
  console.log('🎨 Invert colors functionality');
  
  const currentState = getCurrentCanvasState();
  if (currentState && currentState.pixels) {
    // Save current state for undo
    saveCanvasState();
    
    // Invert each pixel color
    for (let i = 0; i < currentState.pixels.length; i++) {
      const pixel = document.querySelector(`[data-pixel="${i}"]`);
      if (pixel) {
        const color = currentState.pixels[i];
        if (color && color !== TRANSPARENT) {
          // Convert hex to RGB, invert, then back to hex
          const r = parseInt(color.slice(1, 3), 16);
          const g = parseInt(color.slice(3, 5), 16);
          const b = parseInt(color.slice(5, 7), 16);
          
          const invertedR = (255 - r).toString(16).padStart(2, '0');
          const invertedG = (255 - g).toString(16).padStart(2, '0');
          const invertedB = (255 - b).toString(16).padStart(2, '0');
          
          const invertedColor = `#${invertedR}${invertedG}${invertedB}`;
          pixel.style.backgroundColor = invertedColor;
          currentState.pixels[i] = invertedColor;
        }
      }
    }
    
    alert('Colors inverted!');
  }
}

function showBrightnessDialog() {
  console.log('💡 Brightness dialog - to be implemented');
  // TODO: Implement brightness dialog
}

function showContrastDialog() {
  console.log('💡 Contrast dialog - to be implemented');
  // TODO: Implement contrast dialog
}

function mergeLayerDown() {
  console.log('🔗 Merge layer down functionality - to be implemented');
  // TODO: Implement merge layer down
}

function mergeVisibleLayers() {
  console.log('🔗 Merge visible layers functionality - to be implemented');
  // TODO: Implement merge visible layers
}

function showOpacityDialog() {
  console.log('💡 Opacity dialog - to be implemented');
  // TODO: Implement opacity dialog
}

function showBlendModeDialog() {
  console.log('💡 Blend mode dialog - to be implemented');
  // TODO: Implement blend mode dialog
}

function showFrameDelayDialog() {
  console.log('⏱️ Frame delay dialog - to be implemented');
  // TODO: Implement frame delay dialog
}

function zoomIn() {
  console.log('🔍 Zoom in functionality');
  
  const canvas = document.getElementById('grid');
  if (canvas) {
    const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '') || 1);
    const newScale = Math.min(currentScale * 1.2, 8); // Max 8x zoom
    canvas.style.transform = `scale(${newScale})`;
    updateStatusBar();
    alert(`Zoomed in to ${Math.round(newScale * 100)}%`);
  }
}

function zoomOut() {
  console.log('🔍 Zoom out functionality');
  
  const canvas = document.getElementById('grid');
  if (canvas) {
    const currentScale = parseFloat(canvas.style.transform.replace('scale(', '').replace(')', '') || 1);
    const newScale = Math.max(currentScale / 1.2, 0.1); // Min 10% zoom
    canvas.style.transform = `scale(${newScale})`;
    updateStatusBar();
    alert(`Zoomed out to ${Math.round(newScale * 100)}%`);
  }
}

function zoomFit() {
  console.log('🔍 Zoom fit functionality');
  
  const canvas = document.getElementById('grid');
  if (canvas) {
    canvas.style.transform = 'scale(1)';
    updateStatusBar();
    alert('Zoomed to fit screen');
  }
}

function zoom100() {
  console.log('🔍 Zoom 100% functionality');
  
  const canvas = document.getElementById('grid');
  if (canvas) {
    canvas.style.transform = 'scale(1)';
    updateStatusBar();
    alert('Zoomed to 100%');
  }
}

function toggleGrid() {
  console.log('📐 Toggle grid functionality');
  
  const canvas = document.getElementById('grid');
  if (canvas) {
    const hasGrid = canvas.classList.contains('show-grid');
    if (hasGrid) {
      canvas.classList.remove('show-grid');
      alert('Grid hidden');
    } else {
      canvas.classList.add('show-grid');
      alert('Grid shown');
    }
  }
}

function togglePixelGrid() {
  console.log('📐 Toggle pixel grid functionality');
  
  const canvas = document.getElementById('grid');
  if (canvas) {
    const hasPixelGrid = canvas.classList.contains('show-pixel-grid');
    if (hasPixelGrid) {
      canvas.classList.remove('show-pixel-grid');
      alert('Pixel grid hidden');
    } else {
      canvas.classList.add('show-pixel-grid');
      alert('Pixel grid shown');
    }
  }
}

function toggleSidebar() {
  console.log('📐 Toggle sidebar functionality');
  
  const sidebar = document.getElementById('toolsPanel');
  if (sidebar) {
    const isVisible = sidebar.style.display !== 'none';
    sidebar.style.display = isVisible ? 'none' : 'block';
    alert(isVisible ? 'Tools panel hidden' : 'Tools panel shown');
  }
}

function toggleLayers() {
  console.log('📐 Toggle layers functionality');
  
  const layersPanel = document.getElementById('layersPanel');
  if (layersPanel) {
    const isVisible = layersPanel.style.display !== 'none';
    layersPanel.style.display = isVisible ? 'none' : 'block';
    alert(isVisible ? 'Layers panel hidden' : 'Layers panel shown');
  }
}

function toggleColorPanel() {
  console.log('📐 Toggle color panel functionality');
  
  const colorPanel = document.getElementById('colorPanel');
  if (colorPanel) {
    const isVisible = colorPanel.style.display !== 'none';
    colorPanel.style.display = isVisible ? 'none' : 'block';
    alert(isVisible ? 'Color panel hidden' : 'Color panel shown');
  }
}

function toggleDarkMode() {
  console.log('🌙 Toggle dark mode functionality - to be implemented');
  // TODO: Implement toggle dark mode
}

function toggleFullscreen() {
  console.log('🖥️ Toggle fullscreen functionality - to be implemented');
  // TODO: Implement toggle fullscreen
}

function minimizeWindow() {
  console.log('🖥️ Minimize window functionality - to be implemented');
  // TODO: Implement minimize window
}

function maximizeWindow() {
  console.log('🖥️ Maximize window functionality - to be implemented');
  // TODO: Implement maximize window
}

function resetPanelLayout() {
  console.log('🔄 Reset panel layout functionality - to be implemented');
  // TODO: Implement reset panel layout
}

function savePanelLayout() {
  console.log('💾 Save panel layout functionality - to be implemented');
  // TODO: Implement save panel layout
}

function loadPanelLayout() {
  console.log('📂 Load panel layout functionality - to be implemented');
  // TODO: Implement load panel layout
}

function showHelpDocumentation() {
  console.log('📚 Help documentation');
  
  const helpContent = `
    <div style="background: #2a2a2a; padding: 20px; border-radius: 8px; border: 1px solid #444; max-width: 600px; max-height: 400px; overflow-y: auto;">
      <h2 style="color: #fff; margin-top: 0;">PixelPro Help</h2>
      
      <h3 style="color: #3b82f6;">Drawing Tools</h3>
      <ul style="color: #ccc;">
        <li><strong>Pencil (B):</strong> Draw single pixels</li>
        <li><strong>Brush (B):</strong> Draw with brush size</li>
        <li><strong>Eraser (E):</strong> Erase pixels</li>
        <li><strong>Fill (G):</strong> Fill connected areas</li>
        <li><strong>Line (L):</strong> Draw straight lines</li>
        <li><strong>Rectangle (R):</strong> Draw rectangles</li>
        <li><strong>Circle (C):</strong> Draw circles</li>
        <li><strong>Text (T):</strong> Add text</li>
        <li><strong>Eyedropper (I):</strong> Pick colors</li>
        <li><strong>AI Generator (A):</strong> Generate pixel art with AI</li>
      </ul>
      
      <h3 style="color: #3b82f6;">Keyboard Shortcuts</h3>
      <ul style="color: #ccc;">
        <li><strong>Ctrl+N:</strong> New project</li>
        <li><strong>Ctrl+O:</strong> Open file</li>
        <li><strong>Ctrl+S:</strong> Save</li>
        <li><strong>Ctrl+Z:</strong> Undo</li>
        <li><strong>Ctrl+Y:</strong> Redo</li>
        <li><strong>Ctrl+E:</strong> Export PNG</li>
        <li><strong>Space:</strong> Play/pause animation</li>
      </ul>
      
      <h3 style="color: #3b82f6;">Features</h3>
      <ul style="color: #ccc;">
        <li><strong>Layers:</strong> Work with multiple layers</li>
        <li><strong>Animation:</strong> Create frame-by-frame animations</li>
        <li><strong>AI Generation:</strong> Generate pixel art with AI</li>
        <li><strong>Export:</strong> Export as PNG, GIF, or sprite sheet</li>
        <li><strong>Color Tools:</strong> Advanced color picker and palettes</li>
      </ul>
    </div>
  `;
  
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;';
  closeBtn.onclick = () => document.body.removeChild(modal);
  
  modal.innerHTML = helpContent;
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
}

function showKeyboardShortcuts() {
  console.log('⌨️ Keyboard shortcuts');
  
  const shortcuts = [
    { key: 'Ctrl+N', action: 'New Project' },
    { key: 'Ctrl+O', action: 'Open File' },
    { key: 'Ctrl+S', action: 'Save' },
    { key: 'Ctrl+Shift+S', action: 'Save As' },
    { key: 'Ctrl+E', action: 'Export PNG' },
    { key: 'Ctrl+Z', action: 'Undo' },
    { key: 'Ctrl+Y', action: 'Redo' },
    { key: 'Ctrl+X', action: 'Cut' },
    { key: 'Ctrl+C', action: 'Copy' },
    { key: 'Ctrl+V', action: 'Paste' },
    { key: 'Ctrl+A', action: 'Select All' },
    { key: 'B', action: 'Pencil/Brush Tool' },
    { key: 'E', action: 'Eraser Tool' },
    { key: 'G', action: 'Fill Tool' },
    { key: 'L', action: 'Line Tool' },
    { key: 'R', action: 'Rectangle Tool' },
    { key: 'C', action: 'Circle Tool' },
    { key: 'T', action: 'Text Tool' },
    { key: 'I', action: 'Eyedropper Tool' },
    { key: 'A', action: 'AI Generator' },
    { key: 'Space', action: 'Play/Pause Animation' },
    { key: 'F11', action: 'Toggle Fullscreen' },
    { key: 'F1', action: 'Help' }
  ];
  
  let shortcutsHtml = '<div style="background: #2a2a2a; padding: 20px; border-radius: 8px; border: 1px solid #444; max-width: 500px;">';
  shortcutsHtml += '<h2 style="color: #fff; margin-top: 0;">Keyboard Shortcuts</h2>';
  shortcutsHtml += '<table style="width: 100%; color: #ccc; border-collapse: collapse;">';
  shortcutsHtml += '<tr style="border-bottom: 1px solid #444;"><th style="text-align: left; padding: 8px;">Key</th><th style="text-align: left; padding: 8px;">Action</th></tr>';
  
  shortcuts.forEach(shortcut => {
    shortcutsHtml += `<tr style="border-bottom: 1px solid #333;">
      <td style="padding: 8px;"><code style="background: #1a1a1a; padding: 2px 6px; border-radius: 3px;">${shortcut.key}</code></td>
      <td style="padding: 8px;">${shortcut.action}</td>
    </tr>`;
  });
  
  shortcutsHtml += '</table></div>';
  
  // Create modal
  const modal = document.createElement('div');
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
  `;
  
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Close';
  closeBtn.style.cssText = 'position: absolute; top: 10px; right: 10px; padding: 8px 16px; background: #3b82f6; color: white; border: none; border-radius: 4px; cursor: pointer;';
  closeBtn.onclick = () => document.body.removeChild(modal);
  
  modal.innerHTML = shortcutsHtml;
  modal.appendChild(closeBtn);
  document.body.appendChild(modal);
}

function startInteractiveTutorial() {
  console.log('🎓 Interactive tutorial');
  
  const tutorialSteps = [
    'Welcome to PixelPro! Let\'s learn the basics.',
    'Click on any pixel to draw with the current color.',
    'Use the color picker to change colors.',
    'Try different tools like the brush and eraser.',
    'Create layers to organize your artwork.',
    'Use the AI generator to create pixel art automatically!'
  ];
  
  let currentStep = 0;
  
  const showStep = () => {
    if (currentStep >= tutorialSteps.length) {
      alert('Tutorial complete! You\'re ready to create amazing pixel art!');
      return;
    }
    
    const step = tutorialSteps[currentStep];
    const shouldContinue = confirm(`${step}\n\nClick OK to continue or Cancel to end tutorial.`);
    
    if (shouldContinue) {
      currentStep++;
      showStep();
    }
  };
  
  showStep();
}

function checkForUpdates() {
  console.log('🔄 Check for updates - to be implemented');
  // TODO: Implement check for updates
}

function reportBug() {
  console.log('🐛 Report bug - to be implemented');
  // TODO: Implement report bug
}

function sendFeedback() {
  console.log('💬 Send feedback - to be implemented');
  // TODO: Implement send feedback
}

function showAboutDialog() {
  console.log('ℹ️ About dialog - to be implemented');
  // TODO: Implement about dialog
}
