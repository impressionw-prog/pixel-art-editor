# PixelPro - Professional Pixel Art Editor

A powerful, web-based pixel art editor with AI integration, professional tools, and a modern interface.

## 🌟 Features

- **Professional Pixel Art Tools**: Pencil, brush, eraser, fill, line, rectangle, circle, and more
- **AI-Powered Generation**: Create pixel art using AI with OpenAI, Stable Diffusion, and Replicate
- **Layer System**: Full layer support with opacity, blend modes, and visibility controls
- **Animation Support**: Create animated pixel art with frame-by-frame editing
- **Advanced Color Panel**: HSB color picker, color harmony, schemes, and swatches
- **Export Options**: PNG, GIF, and sprite sheet export
- **Modern UI**: Photoshop-style interface with resizable panels
- **Keyboard Shortcuts**: Professional workflow with keyboard shortcuts
- **Responsive Design**: Works on desktop and tablet devices

## 🚀 Live Demo

**Coming Soon!** The application will be deployed to a live URL.

## 🛠️ Local Development

### Prerequisites
- Modern web browser (Chrome, Firefox, Safari, Edge)
- Python 3.x (for local development server)

### Quick Start

1. **Clone or download** the project files
2. **Navigate** to the project directory:
   ```bash
   cd PixelPro
   ```
3. **Start the local server**:
   ```bash
   python3 -m http.server 8000
   ```
4. **Open your browser** and go to:
   ```
   http://localhost:8000
   ```

### Alternative Local Server Options

**Using Node.js (if you have it installed):**
```bash
npx serve .
```

**Using PHP (if you have it installed):**
```bash
php -S localhost:8000
```

## 🎨 How to Use

### Getting Started
1. **Launch the application** - You'll see the start screen
2. **Create a new project** - Choose canvas size and color palette
3. **Select tools** - Use the toolbar on the left
4. **Choose colors** - Use the color panel on the right
5. **Start creating** - Click and drag on the canvas to draw

### Key Features

#### Color Panel
- **Color Field**: Click and drag to select saturation and brightness
- **Hue Slider**: Click and drag to change hue
- **Input Fields**: Type exact HSB, RGB, or Hex values
- **Swatches**: Click predefined colors or add your own
- **Color Harmony**: Generate complementary colors
- **Color Schemes**: Choose from monochromatic, warm, cool, and earth schemes

#### Tools
- **Pencil Tool (B)**: Basic pixel drawing
- **Brush Tool**: Variable size brush with different shapes
- **Eraser Tool (E)**: Remove pixels
- **Fill Tool (G)**: Flood fill areas
- **Line Tool (L)**: Draw straight lines
- **Rectangle Tool (R)**: Draw rectangles (filled or outline)
- **Circle Tool (C)**: Draw circles (filled or outline)
- **Eyedropper Tool (I)**: Pick colors from canvas
- **Move Tool (V)**: Move selections
- **Text Tool (T)**: Add text to your art
- **AI Generator (A)**: Generate pixel art with AI

#### Layers
- **Add Layers**: Create new layers for complex artwork
- **Layer Visibility**: Toggle layer visibility
- **Layer Opacity**: Adjust layer transparency
- **Blend Modes**: Choose how layers blend together
- **Layer Management**: Duplicate, delete, and reorder layers

#### Animation
- **Add Frames**: Create animation frames
- **Frame Management**: Duplicate and delete frames
- **Play Animation**: Preview your animation
- **Export GIF**: Save as animated GIF

## 🔧 Configuration

### AI Integration
To use AI features, you'll need API keys:

1. **OpenAI**: Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
2. **Stability AI**: Get your API key from [Stability AI](https://platform.stability.ai/account/keys)
3. **Replicate**: Get your API key from [Replicate](https://replicate.com/account/api-tokens)

**Note**: API keys are stored locally and never sent to our servers.

## 📁 Project Structure

```
PixelPro/
├── index.html          # Main application file
├── script-simple.js    # Core application logic
├── style.css          # Application styling
├── manifest.json      # PWA manifest
├── favicon.ico        # Application icon
├── netlify.toml       # Deployment configuration
└── README.md          # This file
```

## 🌐 Deployment

### Netlify (Recommended)
1. **Push to GitHub**: Upload your project to a GitHub repository
2. **Connect to Netlify**: 
   - Go to [netlify.com](https://netlify.com)
   - Click "New site from Git"
   - Connect your GitHub repository
   - Deploy automatically

### Alternative Hosting
- **GitHub Pages**: Free hosting for static sites
- **Vercel**: Great for static sites and PWAs
- **Firebase Hosting**: Google's hosting solution
- **Any static hosting service**

## 🎯 Browser Support

- ✅ Chrome 80+
- ✅ Firefox 75+
- ✅ Safari 13+
- ✅ Edge 80+

## 🤝 Contributing

This is a personal project, but suggestions and feedback are welcome!

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- **Tailwind CSS** for the styling framework
- **OpenAI, Stability AI, Replicate** for AI integration
- **The pixel art community** for inspiration

---

**PixelPro** - Create amazing pixel art with professional tools and AI assistance! 🎨✨ 