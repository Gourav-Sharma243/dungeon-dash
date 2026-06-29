# 🎮 Dungeon Dash

> A mobile-ready roguelike dungeon crawler built with a **custom HTML5 game engine**, **Node.js backend**, and **PWA** support.

![JavaScript](https://img.shields.io/badge/JavaScript-ES2022-yellow?style=flat-square&logo=javascript)
![Node.js](https://img.shields.io/badge/Node.js-v20+-green?style=flat-square&logo=node.js)
![PWA](https://img.shields.io/badge/PWA-Installable-blue?style=flat-square&logo=pwa)
![License](https://img.shields.io/badge/License-MIT-purple?style=flat-square)

## 🎯 Overview

Dungeon Dash is a top-down roguelike dungeon crawler featuring:
- **Procedural Dungeon Generation** using BSP (Binary Space Partitioning) algorithm
- **Custom ECS Game Engine** (Entity-Component-System architecture)
- **Real-time Combat** with melee attacks, knockback, and particle effects
- **Daily Challenges** — same dungeon seed for all players, compete globally
- **Node.js Backend** with REST API, SQLite database, and Socket.io real-time updates
- **PWA Support** — installable on Android/iOS, playable offline

## 🏗️ Tech Stack

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Game Engine** | Vanilla JavaScript (ES Modules) | Custom 60fps game loop, ECS architecture |
| **Rendering** | HTML5 Canvas 2D | Pixel-art rendering, particles, camera |
| **Audio** | Web Audio API | Procedural chiptune sound synthesis |
| **Backend** | Node.js + Express | REST API, static serving |
| **Database** | SQLite (better-sqlite3) | Leaderboards, player profiles |
| **Real-time** | Socket.io | Live leaderboard updates |
| **Mobile** | PWA (Service Worker) | Offline play, installable |
| **Input** | Touch + Keyboard | Virtual joystick, gesture detection |

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed

### Setup & Run
```bash
# Clone the repository
git clone <repo-url>
cd dungeon-dash

# Install server dependencies
cd server
npm install

# Start the server (serves both API and game client)
npm run dev

# Open in browser
# → http://localhost:3000
```

### Controls
| Platform | Move | Attack |
|----------|------|--------|
| **Desktop** | WASD or Arrow Keys | Space |
| **Mobile** | Left side touch (virtual joystick) | Right side touch |

## 📁 Project Structure

```
dungeon-dash/
├── client/                    # Game client (HTML5 + Canvas)
│   ├── index.html             # Entry HTML with PWA support
│   ├── manifest.json          # PWA manifest
│   ├── sw.js                  # Service worker (offline)
│   ├── styles/
│   │   └── main.css           # Responsive mobile-first CSS
│   └── src/
│       ├── main.js            # App bootstrap
│       ├── engine/            # Custom game engine
│       │   ├── Engine.js      # Fixed-timestep game loop
│       │   ├── ECS.js         # Entity-Component-System
│       │   ├── Renderer.js    # Canvas 2D + Camera + Particles
│       │   ├── Input.js       # Keyboard + Touch input
│       │   ├── Audio.js       # Web Audio synthesis
│       │   └── SceneManager.js # Scene stack + transitions
│       └── game/              # Game implementation
│           ├── Components.js  # ECS data components
│           ├── Systems.js     # ECS logic systems
│           ├── DungeonGenerator.js # BSP procedural gen
│           └── scenes/        # Game scenes
│               ├── MenuScene.js
│               ├── GameScene.js
│               └── GameOverScene.js
├── server/                    # Node.js backend
│   ├── package.json
│   └── src/
│       ├── index.js           # Express + Socket.io server
│       ├── db/database.js     # SQLite setup
│       ├── routes/
│       │   ├── leaderboard.js # Score API
│       │   ├── players.js     # Player profiles
│       │   └── daily.js       # Daily challenge seed
│       └── socket/
│           └── realtime.js    # WebSocket events
└── docs/                      # Documentation
    ├── ARCHITECTURE.md        # Technical design
    └── AGILE.md               # Sprint artifacts
```

## 🎮 Features

### Game Engine
- **Fixed Timestep Loop** — Deterministic 60fps physics updates
- **ECS Architecture** — Entity-Component-System inspired by Unity
- **Camera System** — Smooth follow, screen shake, viewport culling
- **Particle System** — Damage numbers, explosions, ambient effects
- **Procedural Audio** — All sounds synthesized via Web Audio API

### Gameplay
- **BSP Dungeon Generation** — Unique layouts every run
- **5 Enemy Types** — Slime, Skeleton, Bat, Goblin, Demon
- **Combat** — Melee attacks with directional facing and knockback
- **Progression** — Multiple floors with increasing difficulty
- **Pickups** — Gold, health potions, exit stairs
- **Daily Challenge** — Same seed for all players each day

### Backend Services
- **REST API** — Score submission, leaderboard queries, player profiles
- **Real-time** — WebSocket-based live leaderboard updates
- **SQLite** — Persistent storage with indexed queries
- **Daily Seed** — Deterministic daily challenge generation

### Mobile
- **PWA** — Installable on Android/iOS home screens
- **Offline Play** — Service worker caches all game assets
- **Touch Controls** — Virtual joystick + action button
- **Responsive** — Adapts to any screen size

## 📖 Documentation

- [Architecture Design](docs/ARCHITECTURE.md) — Technical deep-dive
- [Agile Artifacts](docs/AGILE.md) — Sprint planning, user stories, Kanban

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.
