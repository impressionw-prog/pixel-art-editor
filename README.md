# PixelPro - Professional Pixel Art Editor with AI Integration

🎨 **PixelPro** is a powerful, web-based pixel art editor with real AI integration for generating stunning pixel art using cutting-edge AI models.

## ✨ Features

### 🎨 Professional Pixel Art Editor
- **Multiple Drawing Tools**: Pencil, Brush, Eraser, Fill, Line, Rectangle, Circle, Eyedropper, Move, Text, Transform
- **Layer System**: Full layer management with blend modes and effects
- **Animation System**: Frame-by-frame animation with timeline
- **Color Management**: HSB picker, swatches, palettes, and color theory tools
- **Undo/Redo**: Professional history management
- **Export Options**: PNG, GIF, and multiple formats

### 🤖 Real AI Integration
- **OpenAI DALL-E 3**: High-quality image generation
- **Stable Diffusion**: Custom style generation
- **Replicate**: Specialized pixel art models
- **Local Generation**: Fallback when APIs are unavailable
- **Smart Fallback**: Automatic service switching

## 🚀 Getting Started

### 1. Run the Application
```bash
# Navigate to the project directory
cd PixelPro

# Start the local server
python3 -m http.server 8000

# Open in your browser
# http://localhost:8000
```

### 2. Configure AI Services (Optional)

#### OpenAI DALL-E 3
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and get your API key
3. In PixelPro, click the AI tool (🤖)
4. Click "Configure API Keys"
5. Enter your OpenAI API key (starts with `sk-`)

#### Stable Diffusion
1. Visit [Stability AI](https://platform.stability.ai/account/keys)
2. Create an account and get your API key
3. Enter your Stability AI API key in PixelPro

#### Replicate (Specialized Pixel Art)
1. Visit [Replicate](https://replicate.com/account/api-tokens)
2. Create an account and get your API token
3. Enter your Replicate token (starts with `r8_`)

## 🎯 How to Use AI Generation

### 1. Select AI Tool
- Click the AI tool (🤖) in the toolbar
- Or press `A` on your keyboard

### 2. Configure Settings
- **Service**: Choose your preferred AI service or "Auto" for best available
- **Style**: Select from Pixel Art, Minimal, Detailed, Retro Gaming, Anime
- **Size**: Choose from 8x8 to 32x32 pixels
- **Quality**: Standard, HD, or Ultra HD

### 3. Enter Prompt
- Describe what you want to generate
- Examples:
  - "A cute cat sitting on a cushion"
  - "A futuristic robot with glowing eyes"
  - "A medieval castle on a hill"
  - "A pixel art landscape with mountains"

### 4. Generate
- Click "Generate" and wait for the AI to create your pixel art
- The system will automatically try different services if one fails
- Click "Apply to Canvas" to place the generated art

## 🔧 AI Service Comparison

| Service | Best For | Quality | Speed | Cost |
|---------|----------|---------|-------|------|
| **OpenAI DALL-E 3** | High-quality, detailed art | ⭐⭐⭐⭐⭐ | Fast | $0.04/image |
| **Stable Diffusion** | Custom styles, artistic | ⭐⭐⭐⭐ | Medium | $0.002/image |
| **Replicate** | Specialized pixel art | ⭐⭐⭐⭐ | Medium | $0.01/image |
| **Local** | Offline generation | ⭐⭐⭐ | Instant | Free |

## 🎨 Advanced Features

### Randomization
- **Different Results**: Each generation produces unique variations
- **Color Variations**: Random color palettes and adjustments
- **Pattern Variations**: Mirroring, noise, and style changes

### Smart Prompting
- **Style Enhancement**: Automatically enhances prompts for better results
- **Service Optimization**: Different prompts for different AI services
- **Fallback System**: Graceful degradation when services are unavailable

### Professional Workflow
- **Layer Integration**: Generated art goes directly to layers
- **Undo Support**: Full history management for AI generations
- **Export Ready**: Generated art is immediately exportable

## 🔒 Privacy & Security

- **Local Storage**: API keys are stored locally in your browser
- **No Server Storage**: Your keys never leave your device
- **Secure Transmission**: All API calls use HTTPS
- **Optional**: AI features work without API keys (local generation)

## 🛠️ Technical Details

### Supported AI Models
- **OpenAI**: DALL-E 3 (1024x1024)
- **Stability AI**: Stable Diffusion XL (1024x1024)
- **Replicate**: Pixel Art XL, Anything V4.0

### Image Processing
- **Automatic Conversion**: AI images are automatically converted to pixel art
- **Size Optimization**: Intelligent scaling and pixelation
- **Color Quantization**: Optimized color palettes for pixel art

### Browser Compatibility
- **Modern Browsers**: Chrome, Firefox, Safari, Edge
- **WebGL Support**: Required for optimal performance
- **Local Storage**: Required for API key persistence

## 🎮 Use Cases

### Game Development
- **Character Sprites**: Generate unique characters and NPCs
- **Environment Tiles**: Create landscapes, buildings, and objects
- **UI Elements**: Buttons, icons, and interface elements
- **Animation Frames**: Generate sprite sheets for animations

### Art & Design
- **Concept Art**: Quick pixel art concepts and sketches
- **Style Exploration**: Try different artistic styles
- **Color Palettes**: Discover new color combinations
- **Pattern Generation**: Create textures and patterns

### Education
- **Learning Pixel Art**: Study AI-generated examples
- **Style Analysis**: Understand different pixel art techniques
- **Color Theory**: Explore color relationships
- **Animation Principles**: Learn frame-by-frame animation

## 🚀 Future Enhancements

### Planned Features
- **Real-time Collaboration**: Multi-user editing
- **Advanced AI Models**: More specialized pixel art models
- **Batch Generation**: Generate multiple variations at once
- **Style Transfer**: Apply existing art styles to new content
- **3D Pixel Art**: Isometric and 3D-style generation

### Community Features
- **Asset Marketplace**: Share and sell pixel art
- **Style Library**: Community-created styles
- **Tutorial System**: Learn pixel art techniques
- **Challenge Mode**: Daily pixel art challenges

## 🤝 Contributing

We welcome contributions! Here are some ways to help:

- **Bug Reports**: Report issues and bugs
- **Feature Requests**: Suggest new features
- **Code Contributions**: Submit pull requests
- **Documentation**: Improve guides and tutorials
- **Testing**: Test new features and report issues

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **OpenAI** for DALL-E 3
- **Stability AI** for Stable Diffusion
- **Replicate** for specialized models
- **Tailwind CSS** for styling
- **Canvas API** for graphics processing

---

**Happy Pixel Art Creating! 🎨✨** 