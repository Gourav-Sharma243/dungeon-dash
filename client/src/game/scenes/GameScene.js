import { Scene } from '../../engine/SceneManager.js';
import { Renderer, Camera, ParticleSystem } from '../../engine/Renderer.js';
import { Entity, World } from '../../engine/ECS.js';
import {
    Position, Velocity, Sprite, Health, Collider,
    PlayerController, EnemyAI, Pickup, Weapon, MinimapMarker
} from '../Components.js';
import {
    MovementSystem, PlayerControlSystem, EnemyAISystem,
    CombatSystem, PickupSystem, RenderSystem
} from '../Systems.js';
import { DungeonGenerator } from '../DungeonGenerator.js';
import { GameOverScene } from './GameOverScene.js';

const TILE = 32;

const ENEMY_CONFIGS = {
    slime: {
        color: '#44cc44', borderColor: '#22aa22',
        width: 20, height: 16,
        speed: 40, damage: 8, health: 30,
        detectRange: 120, attackRange: 24,
        scoreValue: 10, behavior: 'patrol',
        attackRate: 1.5, hasEyes: true, eyeColor: '#fff'
    },
    skeleton: {
        color: '#ccccaa', borderColor: '#aaa888',
        width: 22, height: 26,
        speed: 55, damage: 12, health: 50,
        detectRange: 160, attackRange: 28,
        scoreValue: 20, behavior: 'chase',
        attackRate: 1.0, hasEyes: true, eyeColor: '#ff4444'
    },
    bat: {
        color: '#8844aa', borderColor: '#6633888',
        width: 18, height: 14,
        speed: 90, damage: 6, health: 20,
        detectRange: 200, attackRange: 20,
        scoreValue: 15, behavior: 'chase',
        attackRate: 0.8, hasEyes: true, eyeColor: '#ffdd00'
    },
    goblin: {
        color: '#669933', borderColor: '#447722',
        width: 20, height: 22,
        speed: 65, damage: 15, health: 60,
        detectRange: 140, attackRange: 30,
        scoreValue: 30, behavior: 'patrol',
        attackRate: 0.9, hasEyes: true, eyeColor: '#ff8800'
    },
    demon: {
        color: '#cc3333', borderColor: '#aa1111',
        width: 28, height: 28,
        speed: 50, damage: 20, health: 100,
        detectRange: 180, attackRange: 35,
        scoreValue: 50, behavior: 'chase',
        attackRate: 1.2, hasEyes: true, eyeColor: '#ffff00'
    }
};

export class GameScene extends Scene {
        constructor(context, options = {}) {
        super(context);
        this.options = options;
    }

        enter() {
        super.enter();
        this.context.input.showControls();

        const { engine, input, audio } = this.context;
        const level = this.options.startLevel || 1;

        const seed = this.options.seed || (Date.now() + level * 9999);
        this.dungeon = DungeonGenerator.generate({
            width: 50,
            height: 40,
            level,
            seed
        });

        this.camera = new Camera(engine.width, engine.height);
        this.particles = new ParticleSystem();
        this.world = new World();

        const spawnX = this.dungeon.playerSpawn.x * TILE + 4;
        const spawnY = this.dungeon.playerSpawn.y * TILE + 4;

        this.player = new Entity()
            .addComponent(new Position(spawnX, spawnY))
            .addComponent(new Velocity(0, 0))
            .addComponent(new Sprite(24, 24, '#44aaff', {
                borderColor: '#2288dd',
                hasEyes: true,
                eyeColor: '#ffffff',
                layer: 10,
                shadow: true
            }))
            .addComponent(new Health(100))
            .addComponent(new Collider(20, 20, 2, 4))
            .addComponent(new PlayerController(150))
            .addComponent(new Weapon({
                name: 'Short Sword',
                damage: 25,
                range: 40,
                knockback: 120,
                color: '#ccccdd'
            }))
            .addComponent(new MinimapMarker('#44aaff', 3))
            .addTag('player');

        if (this.options.playerState) {
            const pc = this.player.getComponent(PlayerController);
            const hp = this.player.getComponent(Health);
            pc.gold = this.options.playerState.gold;
            pc.kills = this.options.playerState.kills;
            pc.level = level;
            pc.score = this.options.playerState.score;
            hp.current = Math.min(this.options.playerState.health, hp.max);
        } else {
            this.player.getComponent(PlayerController).level = level;
        }

        this.world.addEntity(this.player);

        for (const enemyData of this.dungeon.enemies) {
            this._spawnEnemy(enemyData, level);
        }

        for (const pickupData of this.dungeon.pickups) {
            this._spawnPickup(pickupData);
        }

        this._spawnExit(this.dungeon.exitPos);

        const onLevelComplete = () => this._nextLevel();

        this.world
            .addSystem(new PlayerControlSystem(input, audio))
            .addSystem(new EnemyAISystem())
            .addSystem(new MovementSystem(this.dungeon.tileMap))
            .addSystem(new CombatSystem(audio, this.particles, this.camera))
            .addSystem(new PickupSystem(audio, this.particles, onLevelComplete))
            .addSystem(new RenderSystem(this.camera, this.dungeon.tileMap));

        this.camera.centerOn(spawnX, spawnY);

        this.gameOver = false;
        this.gameOverTimer = 0;
        this.levelTransitioning = false;
        this.showMinimap = true;
        this.pauseMenuOpen = false;

        console.log(`[GameScene] Level ${level} — ${this.dungeon.rooms.length} rooms, ${this.dungeon.enemies.length} enemies`);
    }

        update(dt) {
        const { input } = this.context;

        if (input.isPressed('KeyM')) {
            this.showMinimap = !this.showMinimap;
        }

        if (input.isPressed('Escape') || input.isPressed('KeyP')) {
            if (this.pauseMenuOpen) {
                this.pauseMenuOpen = false;
                this.context.engine.resume();
            } else {
                this.pauseMenuOpen = true;
                
            }
        }

        if (this.pauseMenuOpen) {
            
            if (input.isPressed('Enter') || input.isPressed('Space') || input.pointerClicked) {
                this.pauseMenuOpen = false;
            }
            if (input.isPressed('KeyQ')) {
                
                const { MenuScene } = this.context._menuSceneModule;
                this.context.sceneManager.switchTo(new MenuScene(this.context), true);
            }
            input.endFrame();
            return;
        }

        const playerHealth = this.player.getComponent(Health);
        if (!playerHealth.alive && !this.gameOver) {
            this.gameOver = true;
            this.gameOverTimer = 0;
        }

        if (this.gameOver) {
            this.gameOverTimer += dt;
            if (this.gameOverTimer > 2) {
                const pc = this.player.getComponent(PlayerController);
                this.context.sceneManager.switchTo(
                    new GameOverScene(this.context, {
                        score: pc.score,
                        gold: pc.gold,
                        kills: pc.kills,
                        level: pc.level,
                        isDaily: this.options.isDaily || false
                    }),
                    true
                );
                return;
            }
        }

        if (!this.levelTransitioning) {
            
            this.world.update(dt);

            const playerPos = this.player.getComponent(Position);
            this.camera.follow(playerPos.x + 12, playerPos.y + 12, dt);
            this.camera.update(dt);

            this.particles.update(dt);
        }

        input.endFrame();
    }

        render(ctx) {
        const { width, height } = this.context.engine;

        Renderer.clear(ctx, width, height, '#0a0a1a');

        this.world.render(ctx);

        this.particles.render(ctx, this.camera);

        this._renderHUD(ctx, width, height);

        if (this.showMinimap) {
            this._renderMinimap(ctx, width, height);
        }

        if (this.gameOver) {
            this._renderGameOverOverlay(ctx, width, height);
        }

        if (this.pauseMenuOpen) {
            this._renderPauseOverlay(ctx, width, height);
        }
    }

        _spawnEnemy(data, level) {
        const config = ENEMY_CONFIGS[data.type] || ENEMY_CONFIGS.slime;
        const levelScale = 1 + (level - 1) * 0.15;

        const enemy = new Entity()
            .addComponent(new Position(data.x * TILE + 4, data.y * TILE + 4))
            .addComponent(new Velocity(0, 0))
            .addComponent(new Sprite(config.width, config.height, config.color, {
                borderColor: config.borderColor,
                hasEyes: config.hasEyes,
                eyeColor: config.eyeColor,
                layer: 5,
                shadow: true
            }))
            .addComponent(new Health(Math.floor(config.health * levelScale)))
            .addComponent(new Collider(config.width - 4, config.height - 4, 2, 2))
            .addComponent(new EnemyAI({
                speed: config.speed * (1 + (level - 1) * 0.05),
                damage: Math.floor(config.damage * levelScale),
                detectRange: config.detectRange,
                attackRange: config.attackRange,
                scoreValue: Math.floor(config.scoreValue * levelScale),
                behavior: config.behavior,
                attackRate: config.attackRate
            }))
            .addComponent(new MinimapMarker('#ff4444', 2))
            .addTag('enemy');

        this.world.addEntity(enemy);
    }

        _spawnPickup(data) {
        const colors = {
            gold: '#ffdd00',
            health: '#44ff44',
        };
        const borderColors = {
            gold: '#cc9900',
            health: '#22cc22',
        };

        const pickup = new Entity()
            .addComponent(new Position(data.x * TILE + 8, data.y * TILE + 8))
            .addComponent(new Sprite(16, 16, colors[data.type] || '#fff', {
                borderColor: borderColors[data.type] || '#aaa',
                layer: 2
            }))
            .addComponent(new Pickup(data.type, data.value))
            .addComponent(new MinimapMarker(colors[data.type] || '#fff', 1))
            .addTag('pickup');

        this.world.addEntity(pickup);
    }

        _spawnExit(exitPos) {
        const exit = new Entity()
            .addComponent(new Position(exitPos.x * TILE, exitPos.y * TILE))
            .addComponent(new Sprite(TILE, TILE, '#44ddff', {
                borderColor: '#22bbdd',
                layer: 1
            }))
            .addComponent(new Pickup('exit', 0))
            .addComponent(new MinimapMarker('#44ddff', 4))
            .addTag('exit');

        this.world.addEntity(exit);
    }

        _nextLevel() {
        if (this.levelTransitioning) return;
        this.levelTransitioning = true;

        const pc = this.player.getComponent(PlayerController);
        const hp = this.player.getComponent(Health);

        hp.current = Math.min(hp.current + 20, hp.max);

        setTimeout(() => {
            this.context.sceneManager.switchTo(
                new GameScene(this.context, {
                    seed: this.options.seed ? this.options.seed + pc.level : undefined,
                    isDaily: this.options.isDaily,
                    startLevel: pc.level + 1,
                    playerState: {
                        gold: pc.gold,
                        kills: pc.kills,
                        score: pc.score,
                        health: hp.current
                    }
                }),
                true
            );
        }, 500);
    }

        _renderHUD(ctx, width, height) {
        const pc = this.player.getComponent(PlayerController);
        const hp = this.player.getComponent(Health);

        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(0, 0, width, 44);

        const hpBarWidth = 150;
        Renderer.drawBar(ctx, 10, 10, hpBarWidth, 14, hp.ratio,
            hp.ratio > 0.3 ? '#44ff44' : '#ff4444', '#1a1a1a');
        Renderer.drawText(ctx, `${hp.current}/${hp.max}`, 15, 11, {
            color: '#fff', font: '10px monospace'
        });

        Renderer.drawText(ctx, 'HP', hpBarWidth + 16, 11, {
            color: '#888', font: '10px monospace'
        });

        Renderer.drawText(ctx, `Score: ${pc.score}`, width - 10, 8, {
            color: '#ffdd44', font: 'bold 14px monospace', align: 'right'
        });

        Renderer.drawText(ctx, `💰 ${pc.gold}`, 10, 28, {
            color: '#ffdd00', font: '12px monospace'
        });

        Renderer.drawText(ctx, `💀 ${pc.kills}`, 90, 28, {
            color: '#ff6644', font: '12px monospace'
        });

        Renderer.drawText(ctx, `Floor ${pc.level}`, width / 2, 28, {
            color: '#aaaacc', font: '12px monospace', align: 'center'
        });

        Renderer.drawText(ctx, `${this.context.engine.fps}fps`, width - 10, 28, {
            color: '#555', font: '10px monospace', align: 'right'
        });

        if (this.options.isDaily) {
            Renderer.drawText(ctx, '📅 DAILY', width / 2, 8, {
                color: '#ff8844', font: 'bold 12px monospace', align: 'center'
            });
        }
    }

        _renderMinimap(ctx, width, height) {
        const mapW = this.dungeon.width;
        const mapH = this.dungeon.height;
        const scale = 3;
        const miniW = mapW * scale;
        const miniH = mapH * scale;
        const mx = width - miniW - 10;
        const my = height - miniH - 10;

        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(mx - 2, my - 2, miniW + 4, miniH + 4);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(mx - 2, my - 2, miniW + 4, miniH + 4);

        for (let row = 0; row < mapH; row++) {
            for (let col = 0; col < mapW; col++) {
                const tile = this.dungeon.tileMap[row][col];
                if (tile === 0) {
                    ctx.fillStyle = '#2a2a3a';
                    ctx.fillRect(mx + col * scale, my + row * scale, scale, scale);
                }
            }
        }

        const markers = this.world.entities.filter(e =>
            e.active && e.hasComponent(MinimapMarker) && e.hasComponent(Position)
        );

        for (const entity of markers) {
            const pos = entity.getComponent(Position);
            const marker = entity.getComponent(MinimapMarker);
            const tileX = Math.floor(pos.x / TILE);
            const tileY = Math.floor(pos.y / TILE);

            ctx.fillStyle = marker.color;
            ctx.fillRect(
                mx + tileX * scale - marker.size / 2,
                my + tileY * scale - marker.size / 2,
                marker.size + 1,
                marker.size + 1
            );
        }
    }

        _renderGameOverOverlay(ctx, width, height) {
        const alpha = Math.min(this.gameOverTimer / 1.5, 0.7);
        ctx.fillStyle = `rgba(80, 0, 0, ${alpha})`;
        ctx.fillRect(0, 0, width, height);

        if (this.gameOverTimer > 0.5) {
            const textAlpha = Math.min((this.gameOverTimer - 0.5) / 0.5, 1);
            ctx.globalAlpha = textAlpha;
            ctx.fillStyle = '#ff4444';
            ctx.font = 'bold 48px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('YOU DIED', width / 2, height / 2);
            ctx.globalAlpha = 1;
        }
    }

        _renderPauseOverlay(ctx, width, height) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, width, height);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 36px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('PAUSED', width / 2, height / 2 - 30);

        ctx.fillStyle = '#aaaacc';
        ctx.font = '16px Outfit, sans-serif';
        ctx.fillText('Press ESC or tap to resume', width / 2, height / 2 + 20);
        ctx.fillText('Press Q to quit', width / 2, height / 2 + 50);
    }
}
