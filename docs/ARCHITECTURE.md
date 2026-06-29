# Architecture Design Document

## Overview

Dungeon Dash is built with a **custom HTML5 game engine** using an **Entity-Component-System (ECS)** architecture. This document covers the key technical design decisions.

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        CLIENT                                │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   ENGINE LAYER                        │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │  Engine   │  │  Input   │  │  Scene Manager   │   │   │
│  │  │ (60fps   │  │ (KB+Touch│  │  (Stack+Fade     │   │   │
│  │  │  loop)   │  │  unified)│  │   transitions)   │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐   │   │
│  │  │ Renderer │  │  Audio   │  │  ECS Framework   │   │   │
│  │  │ (Canvas  │  │ (WebAudio│  │  (Entity+System  │   │   │
│  │  │  2D+Cam) │  │  synth)  │  │   +World)        │   │   │
│  │  └──────────┘  └──────────┘  └──────────────────┘   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   GAME LAYER                          │   │
│  │  Components: Position, Velocity, Sprite, Health,      │   │
│  │              Collider, PlayerController, EnemyAI,     │   │
│  │              Pickup, Weapon, MinimapMarker             │   │
│  │                                                        │   │
│  │  Systems: Movement, PlayerControl, EnemyAI,           │   │
│  │           Combat, Pickup, Render                       │   │
│  │                                                        │   │
│  │  Scenes: Menu → Gameplay → GameOver                   │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                   PWA LAYER                           │   │
│  │  Service Worker (offline caching)                     │   │
│  │  Web App Manifest (installable)                       │   │
│  │  Touch Controls (virtual joystick)                    │   │
│  └──────────────────────────────────────────────────────┘   │
└──────────────────────────────────┬──────────────────────────┘
                                   │ REST API + WebSocket
┌──────────────────────────────────┴──────────────────────────┐
│                        SERVER                                │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────────────┐  │
│  │ Express  │  │ Socket.io│  │  SQLite (better-sqlite3)  │  │
│  │ REST API │  │ Real-time│  │  - players, scores,       │  │
│  │          │  │ events   │  │    daily_challenges        │  │
│  └──────────┘  └──────────┘  └──────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

## 1. Game Engine — Fixed Timestep Loop

The engine uses a **fixed-timestep accumulator** pattern:

```javascript
// Pseudocode
while (accumulator >= FIXED_TIMESTEP) {
    update(dt);              // Physics at exact 60fps
    accumulator -= FIXED_TIMESTEP;
}
render(ctx);                 // Render at display refresh rate
```

**Why fixed timestep?**
- Physics simulation is deterministic (same result on every device)
- Required for daily challenge mode (same seed = same dungeon)
- Prevents physics glitches on slow devices

## 2. Entity-Component-System (ECS)

Inspired by Unity's architecture, separated into:

| Concept | Role | Example |
|---------|------|---------|
| **Entity** | Unique ID + component bag | Player, Enemy, Pickup |
| **Component** | Pure data (no logic) | Position {x, y}, Health {current, max} |
| **System** | Logic processor | MovementSystem updates Position using Velocity |
| **World** | Container for entities + systems | Manages lifecycle and execution order |

**Why ECS over OOP inheritance?**
- Composition over inheritance — avoids deep class hierarchies
- Systems can process entities in bulk (cache-friendly)
- Easy to add new entity types by mixing components
- Same pattern used in Unity, Unreal, and professional game engines

## 3. Procedural Dungeon Generation — BSP Tree

Uses **Binary Space Partitioning** to generate dungeon layouts:

1. Start with a rectangular space
2. Recursively split into left/right children
3. Place rooms in leaf nodes (randomly sized within the partition)
4. Connect sibling rooms with L-shaped corridors
5. Place enemies, items, and exit using room positions

**Advantages of BSP:**
- Guaranteed connectivity (every room reachable)
- No overlapping rooms
- Natural room distribution
- Deterministic with seeded RNG (for daily challenges)

## 4. Camera and Rendering

- **Camera** smoothly follows the player using lerp interpolation
- **Screen shake** on combat hits for game feel
- **Viewport culling** skips rendering off-screen tiles/entities
- **Y-sort rendering** draws entities from top to bottom for correct overlap
- **Particle system** for damage numbers, explosions, and ambient effects

## 5. Input Abstraction

Unified input system that works across platforms:

| Source | Mechanism |
|--------|-----------|
| Keyboard | WASD/Arrows for movement, Space for attack |
| Touch | Left half = virtual joystick, Right half = action |
| Mouse | Click for menu navigation |

All sources feed into `getMovementVector()` and `isActionPressed()`.

## 6. Audio Synthesis

All sounds are generated procedurally using the **Web Audio API** — no external audio files needed. This keeps the project self-contained and enables instant loading.

Techniques used:
- Oscillator nodes (sine, square, sawtooth, triangle)
- Frequency sweeps for hit/death sounds
- Note sequences for pickup/levelup chimes
- Gain envelopes for attack/decay shaping

## 7. Backend Architecture

### REST API Endpoints

| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/api/leaderboard` | Top 50 global scores |
| GET | `/api/leaderboard/daily` | Today's daily leaderboard |
| POST | `/api/scores` | Submit a new score |
| GET | `/api/players/:id/stats` | Player statistics |
| GET | `/api/daily` | Get daily challenge seed |
| GET | `/api/health` | Server health check |

### Database Schema

**scores** — Indexed by score DESC for fast leaderboard queries  
**players** — Tracks lifetime statistics  
**daily_challenges** — Maps dates to deterministic seeds  

### Real-time Events (Socket.io)

- `newScore` — Broadcast when any player submits a score
- `newHighScore` — Broadcast when a global record is broken
- `playerCount` — Updated on connect/disconnect
