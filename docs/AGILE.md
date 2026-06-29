# Agile Development Artifacts

This document captures the Agile methodology used in developing Dungeon Dash. The project followed a modified Scrum/Kanban hybrid with 1-week sprints.

---

## Sprint Planning

### Sprint 1 — Engine Foundation (Week 1)
**Goal:** Build the core game engine and get a basic game loop running.

| Story ID | User Story | Points | Status |
|----------|-----------|--------|--------|
| DD-001 | As a developer, I need a fixed-timestep game loop so physics are deterministic | 3 | ✅ Done |
| DD-002 | As a developer, I need an ECS framework so I can compose game objects flexibly | 5 | ✅ Done |
| DD-003 | As a developer, I need a canvas renderer with camera support | 3 | ✅ Done |
| DD-004 | As a developer, I need unified input handling for keyboard and touch | 3 | ✅ Done |
| DD-005 | As a developer, I need a scene manager with transitions | 2 | ✅ Done |
| DD-006 | As a developer, I need procedural audio so no external assets are needed | 3 | ✅ Done |

**Sprint Velocity:** 19 points

### Sprint 2 — Core Gameplay (Week 2)
**Goal:** Implement dungeon generation, combat, and the main gameplay loop.

| Story ID | User Story | Points | Status |
|----------|-----------|--------|--------|
| DD-007 | As a player, I want procedurally generated dungeons so each run is unique | 8 | ✅ Done |
| DD-008 | As a player, I want to move through the dungeon and fight enemies | 5 | ✅ Done |
| DD-009 | As a player, I want different enemy types with distinct behaviors | 5 | ✅ Done |
| DD-010 | As a player, I want to collect gold and health potions | 3 | ✅ Done |
| DD-011 | As a player, I want to progress to deeper floors via exit stairs | 3 | ✅ Done |
| DD-012 | As a player, I want visual feedback (particles, screen shake) for combat | 3 | ✅ Done |

**Sprint Velocity:** 27 points

### Sprint 3 — Backend & Mobile (Week 3)
**Goal:** Add server infrastructure and mobile PWA support.

| Story ID | User Story | Points | Status |
|----------|-----------|--------|--------|
| DD-013 | As a player, I want to submit my score to a global leaderboard | 5 | ✅ Done |
| DD-014 | As a player, I want to play a daily challenge with the same dungeon as everyone | 5 | ✅ Done |
| DD-015 | As a player, I want real-time leaderboard updates via WebSocket | 3 | ✅ Done |
| DD-016 | As a mobile user, I want to install the game as a PWA on my phone | 3 | ✅ Done |
| DD-017 | As a mobile user, I want virtual joystick controls | 3 | ✅ Done |
| DD-018 | As a player, I want to play offline after first visit | 3 | ✅ Done |

**Sprint Velocity:** 22 points

---

## User Stories — Detailed

### DD-007: Procedural Dungeon Generation
**As a** player  
**I want** each dungeon run to be unique  
**So that** the game has high replay value  

**Acceptance Criteria:**
- [ ] Dungeons are generated using BSP tree algorithm
- [ ] Each room is accessible (no unreachable areas)
- [ ] Rooms are connected by corridors
- [ ] Enemy count and type scales with floor level
- [ ] Items are distributed across rooms
- [ ] Seeded RNG produces identical dungeons for daily challenges

### DD-014: Daily Challenge Mode
**As a** competitive player  
**I want** a daily challenge with the same dungeon for everyone  
**So that** I can compete for the daily high score  

**Acceptance Criteria:**
- [ ] Daily seed is deterministic (based on date)
- [ ] All players get identical dungeon layout
- [ ] Separate leaderboard for daily challenges
- [ ] Server tracks daily participation count

---

## Definition of Done

A feature is considered "Done" when:
1. ✅ Code is written and passes manual testing
2. ✅ Code follows project style guide (JSDoc, ES modules)
3. ✅ Feature works on both desktop (Chrome) and mobile (touch)
4. ✅ No console errors or warnings
5. ✅ Performance maintains 60fps on target devices

---

## Retrospective Notes

### What Went Well
- ECS architecture made adding new entity types trivial
- Procedural audio eliminated asset management complexity
- BSP dungeon generation produced high-quality layouts
- PWA support was straightforward with service workers

### What Could Improve
- Need automated testing (unit tests for ECS, dungeon gen)
- Could add more enemy variety and boss fights
- Mobile touch controls could use haptic feedback
- Consider WebGL renderer for better mobile performance

### Action Items for Next Sprint
- [ ] Add unit tests for DungeonGenerator and ECS
- [ ] Implement boss enemy for every 5th floor
- [ ] Add player name input on Game Over screen
- [ ] Implement sound settings persistence (localStorage)

---

## Kanban Board

See [KANBAN.md](../.github/KANBAN.md) for the current board state.
