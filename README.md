# 🎮 Minecraft Clone

A browser-based 3D voxel game inspired by Minecraft, built with modern web technologies.

![Minecraft Clone Demo](https://img.shields.io/badge/Status-Working-brightgreen) ![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue) ![Three.js](https://img.shields.io/badge/Three.js-WebGL-orange) ![License](https://img.shields.io/badge/License-MIT-yellow)

---

## 📋 Table of Contents

- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Architecture](#-architecture)
- [Getting Started](#-getting-started)
- [Controls](#-controls)
- [Project Structure](#-project-structure)
- [How It Works](#-how-it-works)
- [Performance](#-performance)
- [Future Enhancements](#-future-enhancements)
- [Contributors](#-contributors)
- [License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| 🌍 **Procedural Terrain** | Infinite world generation using Simplex noise algorithms |
| 🧊 **Voxel System** | 16×16×128 block chunks with efficient data structures |
| ⚡ **Web Workers** | Background terrain generation for smooth 60 FPS gameplay |
| 🎯 **Block Interaction** | Break and place blocks with raycasting |
| 🏃 **Player Physics** | Custom collision detection, gravity, and jumping |
| 🎨 **Multiple Block Types** | 9 different block types with distinct colors |
| 📊 **Debug HUD** | Real-time FPS, position, and chunk count display |

---

## 🛠 Tech Stack

| Technology | Purpose |
|------------|---------|
| **TypeScript** | Type-safe JavaScript for robust code |
| **Three.js** | WebGL-based 3D rendering engine |
| **Cannon-es** | Physics engine for player body |
| **Simplex Noise** | Procedural terrain generation |
| **Vite** | Fast build tool and dev server |
| **Web Workers** | Multi-threaded chunk generation |

---

## 🏗 Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Game Loop                            │
│  ┌─────────┐   ┌─────────┐   ┌─────────┐   ┌─────────┐    │
│  │ Physics │ → │ Player  │ → │  World  │ → │ Render  │    │
│  │ Update  │   │ Update  │   │ Update  │   │  Frame  │    │
│  └─────────┘   └─────────┘   └─────────┘   └─────────┘    │
└─────────────────────────────────────────────────────────────┘
                          ↑
┌─────────────────────────────────────────────────────────────┐
│                     Web Worker                              │
│  ┌─────────────────────────────────────────────────────┐   │
│  │  Terrain Generation (Simplex Noise + Block Placement) │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** (v9 or higher)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/minecraft-clone.git

# Navigate to project directory
cd minecraft-clone

# Install dependencies
npm install

# Start development server
npm run dev
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🎮 Controls

| Key | Action |
|-----|--------|
| `W` `A` `S` `D` | Move forward / left / backward / right |
| `Mouse` | Look around |
| `Space` | Jump |
| `Shift` | Sprint |
| `Left Click` | Break block |
| `Right Click` | Place block |
| `1` - `9` | Select block type |
| `Esc` | Release mouse cursor |

---

## 📁 Project Structure

```
minecraft-clone/
├── src/
│   ├── main.ts              # Application entry point
│   ├── Game.ts              # Game loop and scene management
│   ├── blocks/
│   │   └── BlockTypes.ts    # Block definitions and properties
│   ├── physics/
│   │   └── Physics.ts       # Cannon-es physics wrapper
│   ├── player/
│   │   └── Player.ts        # Player controller and collision
│   ├── world/
│   │   ├── World.ts         # Chunk management system
│   │   ├── Chunk.ts         # Block data structure
│   │   └── ChunkMesher.ts   # Geometry generation
│   └── workers/
│       └── terrain.worker.ts # Background terrain generation
├── index.html               # Main HTML with UI elements
├── vite.config.ts           # Vite build configuration
├── tsconfig.json            # TypeScript configuration
└── package.json             # Project dependencies
```

---

## 🔧 How It Works

### 1. Terrain Generation
The world is generated using **Simplex noise** to create natural-looking terrain with hills, valleys, and water bodies. Multiple octaves of noise are combined for realistic variation.

### 2. Chunk System
The world is divided into 16×16×128 block chunks. Only chunks within the render distance are loaded, optimizing memory usage.

### 3. Mesh Generation
Each chunk's visible block faces are converted to **Three.js BufferGeometry** with face culling - only faces adjacent to air blocks are rendered.

### 4. Collision Detection
Custom AABB (Axis-Aligned Bounding Box) collision checks the player's position against solid blocks in the world.

### 5. Web Workers
Terrain generation runs in a separate thread using Web Workers, preventing frame drops during chunk loading.

---

## 📈 Performance

| Metric | Value |
|--------|-------|
| **Frame Rate** | 50-60 FPS |
| **Render Distance** | 6 chunks (96 blocks) |
| **Chunk Size** | 16 × 16 × 128 blocks |
| **Active Chunks** | ~100-130 |

---

## 🔮 Future Enhancements

- [ ] Texture atlas for block textures
- [ ] Day/night cycle with dynamic lighting
- [ ] Inventory and crafting system
- [ ] Multiplayer support via WebSockets
- [ ] Save/load world functionality
- [ ] More biomes (desert, snow, forest)
- [ ] Mob entities (animals, monsters)

---

## 👥 Contributors

| Name | Role |
|------|------|
| adrian |Lead Developer|

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
  <b>Built with ❤️ using TypeScript and Three.js</b>
</div>
