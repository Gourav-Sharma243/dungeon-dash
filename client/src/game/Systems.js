import { System } from '../engine/ECS.js';
import {
    Position, Velocity, Sprite, Health, Collider,
    PlayerController, EnemyAI, Pickup, Weapon, MinimapMarker
} from './Components.js';

const TILE = 32;

export class MovementSystem extends System {
        constructor(tileMap) {
        super([Position, Velocity, Collider]);
                this.tileMap = tileMap;
    }

        update(dt) {
        for (const entity of this.getEntities()) {
            const pos = entity.getComponent(Position);
            const vel = entity.getComponent(Velocity);
            const col = entity.getComponent(Collider);

            if (vel.vx === 0 && vel.vy === 0) continue;

            const newX = pos.x + vel.vx * dt;
            if (!this._collidesWithWall(newX + col.offsetX, pos.y + col.offsetY, col.width, col.height)) {
                pos.x = newX;
            } else {
                vel.vx = 0;
            }

            const newY = pos.y + vel.vy * dt;
            if (!this._collidesWithWall(pos.x + col.offsetX, newY + col.offsetY, col.width, col.height)) {
                pos.y = newY;
            } else {
                vel.vy = 0;
            }
        }
    }

        _collidesWithWall(x, y, w, h) {
        if (!this.tileMap) return false;

        const startCol = Math.floor(x / TILE);
        const endCol = Math.floor((x + w - 1) / TILE);
        const startRow = Math.floor(y / TILE);
        const endRow = Math.floor((y + h - 1) / TILE);

        for (let row = startRow; row <= endRow; row++) {
            for (let col = startCol; col <= endCol; col++) {
                if (row < 0 || row >= this.tileMap.length ||
                    col < 0 || col >= this.tileMap[0].length) {
                    return true; 
                }
                if (this.tileMap[row][col] === 1) {
                    return true; 
                }
            }
        }
        return false;
    }
}

export class PlayerControlSystem extends System {
        constructor(input, audio) {
        super([Position, Velocity, PlayerController, Sprite]);
                this.input = input;
                this.audio = audio;
    }

        update(dt) {
        for (const entity of this.getEntities()) {
            const vel = entity.getComponent(Velocity);
            const pc = entity.getComponent(PlayerController);
            const sprite = entity.getComponent(Sprite);
            const health = entity.getComponent(Health);

            if (health && !health.alive) continue;

            const move = this.input.getMovementVector();

            vel.vx = move.x * pc.speed;
            vel.vy = move.y * pc.speed;

            if (move.x !== 0 || move.y !== 0) {
                pc.lastDir = { x: move.x, y: move.y };
                sprite.facing = move.x >= 0 ? 1 : -1;

                pc.stepTimer -= dt;
                if (pc.stepTimer <= 0) {
                    this.audio.play('step');
                    pc.stepTimer = 0.3;
                }
            } else {
                pc.stepTimer = 0;
            }

            pc.attackCooldown -= dt;
            if (pc.attackCooldown < 0) pc.attackCooldown = 0;

            if (this.input.isActionPressed() && pc.attackCooldown <= 0) {
                pc.attacking = true;
                pc.attackAnimTimer = 0.2;
                pc.attackCooldown = pc.attackRate;
                this.audio.play('swing');

                const weapon = entity.getComponent(Weapon);
                if (weapon) {
                    weapon.swinging = true;
                    weapon.swingProgress = 0;
                }
            }

            if (pc.attackAnimTimer > 0) {
                pc.attackAnimTimer -= dt;
                if (pc.attackAnimTimer <= 0) {
                    pc.attacking = false;
                }
            }

            const weapon = entity.getComponent(Weapon);
            if (weapon && weapon.swinging) {
                weapon.swingProgress += dt * 5;
                if (weapon.swingProgress >= 1) {
                    weapon.swinging = false;
                    weapon.swingProgress = 0;
                }
            }

            pc.score = pc.gold + (pc.kills * 10) + ((pc.level - 1) * 100);
        }
    }
}

export class EnemyAISystem extends System {
    constructor() {
        super([Position, Velocity, EnemyAI, Sprite]);
    }

        update(dt) {
        
        const player = this.world.getEntityByTag('player');
        if (!player) return;

        const playerPos = player.getComponent(Position);
        const playerHealth = player.getComponent(Health);
        if (!playerHealth || !playerHealth.alive) return;

        for (const entity of this.getEntities()) {
            const pos = entity.getComponent(Position);
            const vel = entity.getComponent(Velocity);
            const ai = entity.getComponent(EnemyAI);
            const sprite = entity.getComponent(Sprite);
            const health = entity.getComponent(Health);

            if (health && !health.alive) {
                vel.vx = 0;
                vel.vy = 0;
                continue;
            }

            if (ai.knockbackTimer > 0) {
                ai.knockbackTimer -= dt;
                vel.vx = ai.knockbackVx;
                vel.vy = ai.knockbackVy;
                
                ai.knockbackVx *= 0.9;
                ai.knockbackVy *= 0.9;
                continue;
            }

            const dx = playerPos.x - pos.x;
            const dy = playerPos.y - pos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            ai.attackCooldown -= dt;
            if (ai.attackCooldown < 0) ai.attackCooldown = 0;

            switch (ai.behavior) {
                case 'chase':
                    this._behaviorChase(ai, vel, sprite, dx, dy, dist);
                    break;
                case 'patrol':
                    this._behaviorPatrol(ai, vel, sprite, dx, dy, dist, dt);
                    break;
                default:
                    this._behaviorChase(ai, vel, sprite, dx, dy, dist);
            }
        }
    }

        _behaviorChase(ai, vel, sprite, dx, dy, dist) {
        if (dist < ai.detectRange) {
            ai.state = 'chase';
            const nx = dx / dist;
            const ny = dy / dist;
            vel.vx = nx * ai.speed;
            vel.vy = ny * ai.speed;
            sprite.facing = dx >= 0 ? 1 : -1;
        } else {
            ai.state = 'idle';
            vel.vx = 0;
            vel.vy = 0;
        }
    }

        _behaviorPatrol(ai, vel, sprite, dx, dy, dist, dt) {
        if (dist < ai.detectRange) {
            
            ai.state = 'chase';
            const nx = dx / dist;
            const ny = dy / dist;
            vel.vx = nx * ai.speed;
            vel.vy = ny * ai.speed;
            sprite.facing = dx >= 0 ? 1 : -1;
        } else {
            
            ai.state = 'patrol';
            ai.patrolTimer -= dt;
            if (ai.patrolTimer <= 0) {
                ai.patrolDir *= -1;
                ai.patrolTimer = 2 + Math.random() * 2;
            }
            vel.vx = ai.patrolDir * ai.speed * 0.5;
            vel.vy = 0;
            sprite.facing = ai.patrolDir;
        }
    }
}

export class CombatSystem extends System {
        constructor(audio, particles, camera) {
        super([]);
        this.audio = audio;
        this.particles = particles;
        this.camera = camera;
    }

        update(dt) {
        const player = this.world.getEntityByTag('player');
        if (!player) return;

        const playerPos = player.getComponent(Position);
        const playerHealth = player.getComponent(Health);
        const pc = player.getComponent(PlayerController);
        const playerSprite = player.getComponent(Sprite);

        if (!playerHealth.alive) return;

        if (playerHealth.invincibleTimer > 0) {
            playerHealth.invincibleTimer -= dt;
            playerSprite.flashing = true;
            playerSprite.flashTimer += dt;
        } else {
            playerSprite.flashing = false;
            playerSprite.flashTimer = 0;
        }

        const enemies = this.world.getEntitiesByTag('enemy');

        for (const enemy of enemies) {
            const enemyPos = enemy.getComponent(Position);
            const enemyHealth = enemy.getComponent(Health);
            const ai = enemy.getComponent(EnemyAI);
            const enemySprite = enemy.getComponent(Sprite);

            if (!enemyHealth || !enemyHealth.alive) continue;

            if (enemyHealth.invincibleTimer > 0) {
                enemyHealth.invincibleTimer -= dt;
                enemySprite.flashing = true;
                enemySprite.flashTimer += dt;
            } else {
                enemySprite.flashing = false;
                enemySprite.flashTimer = 0;
            }

            const dx = enemyPos.x - playerPos.x;
            const dy = enemyPos.y - playerPos.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (pc.attacking && pc.attackAnimTimer > 0.15) {
                
                const weapon = player.getComponent(Weapon);
                const range = weapon ? weapon.range : pc.attackRange;
                const damage = weapon ? weapon.damage : pc.attackDamage;

                if (dist < range && enemyHealth.invincibleTimer <= 0) {
                    
                    const attackDirX = pc.lastDir.x;
                    const attackDirY = pc.lastDir.y;
                    const dotProduct = (dx / (dist || 1)) * attackDirX + (dy / (dist || 1)) * attackDirY;

                    if (dotProduct > -0.3) { 
                        enemyHealth.current -= damage;
                        enemyHealth.invincibleTimer = 0.3;

                        const knockbackForce = weapon ? weapon.knockback : 100;
                        ai.knockbackVx = (dx / (dist || 1)) * knockbackForce;
                        ai.knockbackVy = (dy / (dist || 1)) * knockbackForce;
                        ai.knockbackTimer = 0.15;

                        this.audio.play('hit');
                        this.camera.shake(4, 0.1);
                        this.particles.emit(enemyPos.x + 12, enemyPos.y + 12, {
                            count: 6,
                            color: '#ff4444',
                            speed: 80,
                            life: 0.3,
                            size: 3
                        });
                        this.particles.emitText(
                            enemyPos.x + 12, enemyPos.y - 5,
                            `-${damage}`, '#ff4444'
                        );

                        if (!enemyHealth.alive) {
                            this._killEnemy(enemy, pc);
                        }
                    }
                }
            }

            if (dist < ai.attackRange && ai.attackCooldown <= 0 && playerHealth.invincibleTimer <= 0) {
                playerHealth.current -= ai.damage;
                playerHealth.invincibleTimer = 0.8;
                ai.attackCooldown = ai.attackRate;

                const playerVel = player.getComponent(Velocity);
                if (dist > 0) {
                    playerVel.vx = (-dx / dist) * 120;
                    playerVel.vy = (-dy / dist) * 120;
                }

                this.audio.play('hit');
                this.camera.shake(6, 0.15);
                this.particles.emit(playerPos.x + 12, playerPos.y + 12, {
                    count: 8,
                    color: '#ff0000',
                    speed: 100,
                    life: 0.4,
                    size: 3
                });
                this.particles.emitText(
                    playerPos.x + 12, playerPos.y - 5,
                    `-${ai.damage}`, '#ff0000'
                );

                if (!playerHealth.alive) {
                    this.audio.play('death');
                    this.particles.emit(playerPos.x + 12, playerPos.y + 12, {
                        count: 20,
                        color: '#ff4400',
                        speed: 150,
                        life: 0.8,
                        size: 4,
                        gravity: 200
                    });
                }
            }
        }
    }

        _killEnemy(enemy, pc) {
        const pos = enemy.getComponent(Position);
        const ai = enemy.getComponent(EnemyAI);

        pc.kills++;
        pc.score += ai.scoreValue;

        this.audio.play('explosion');
        this.particles.emit(pos.x + 12, pos.y + 12, {
            count: 15,
            color: '#ffaa00',
            speed: 120,
            life: 0.5,
            size: 4,
            gravity: 150
        });
        this.particles.emitText(
            pos.x + 12, pos.y - 10,
            `+${ai.scoreValue}`, '#ffdd00'
        );

        enemy.getComponent(Sprite).alpha = 0.5;
        setTimeout(() => {
            this.world.removeEntity(enemy);
        }, 200);
    }
}

export class PickupSystem extends System {
        constructor(audio, particles, onLevelComplete) {
        super([Position, Pickup]);
        this.audio = audio;
        this.particles = particles;
        this.onLevelComplete = onLevelComplete;
    }

        update(dt) {
        const player = this.world.getEntityByTag('player');
        if (!player) return;

        const playerPos = player.getComponent(Position);
        const pc = player.getComponent(PlayerController);
        const playerHealth = player.getComponent(Health);

        if (!playerHealth.alive) return;

        for (const entity of this.getEntities()) {
            const pos = entity.getComponent(Position);
            const pickup = entity.getComponent(Pickup);
            const sprite = entity.getComponent(Sprite);

            if (pickup.collected) continue;

            pickup.bobOffset += dt * 3;
            if (sprite) {
                sprite.animTimer = pickup.bobOffset;
            }

            const dx = (pos.x + 12) - (playerPos.x + 12);
            const dy = (pos.y + 12) - (playerPos.y + 12);
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 24) {
                pickup.collected = true;

                switch (pickup.type) {
                    case 'gold':
                        pc.gold += pickup.value;
                        this.audio.play('pickup');
                        this.particles.emitText(pos.x, pos.y - 8, `+${pickup.value}g`, '#ffdd00');
                        this.particles.emit(pos.x + 8, pos.y + 8, {
                            count: 5, color: '#ffdd00', speed: 60, life: 0.3, size: 2
                        });
                        break;

                    case 'health':
                        const healAmount = Math.min(pickup.value, playerHealth.max - playerHealth.current);
                        playerHealth.current += healAmount;
                        this.audio.play('heal');
                        this.particles.emitText(pos.x, pos.y - 8, `+${healAmount}hp`, '#44ff44');
                        this.particles.emit(pos.x + 8, pos.y + 8, {
                            count: 8, color: '#44ff44', speed: 50, life: 0.4, size: 2
                        });
                        break;

                    case 'exit':
                        this.audio.play('levelup');
                        this.particles.emit(pos.x + 16, pos.y + 16, {
                            count: 20, color: '#44ddff', speed: 100, life: 0.6, size: 3
                        });
                        if (this.onLevelComplete) {
                            this.onLevelComplete();
                        }
                        return;
                }

                this.world.removeEntity(entity);
            }
        }
    }
}

export class RenderSystem extends System {
        constructor(camera, tileMap, tileColors) {
        super([Position, Sprite]);
        this.camera = camera;
        this.tileMap = tileMap;
        this.tileColors = tileColors || {
            0: '#1a1a2e', 
            1: '#2d2d44', 
            2: '#16213e', 
        };
    }

        render(ctx) {
        
        this._renderTileMap(ctx);

        const entities = this.getEntities()
            .sort((a, b) => {
                const sa = a.getComponent(Sprite);
                const sb = b.getComponent(Sprite);
                const pa = a.getComponent(Position);
                const pb = b.getComponent(Position);
                if (sa.layer !== sb.layer) return sa.layer - sb.layer;
                return pa.y - pb.y;
            });

        for (const entity of entities) {
            const pos = entity.getComponent(Position);
            const sprite = entity.getComponent(Sprite);

            if (!this.camera.isVisible(pos.x, pos.y, sprite.width, sprite.height)) {
                continue;
            }

            const screen = this.camera.worldToScreen(pos.x, pos.y);

            ctx.globalAlpha = sprite.alpha;

            if (sprite.flashing && Math.floor(sprite.flashTimer * 10) % 2 === 0) {
                ctx.globalAlpha = 0.3;
            }

            const pickup = entity.getComponent(Pickup);
            let bobY = 0;
            if (pickup) {
                bobY = Math.sin(sprite.animTimer) * 3;
            }

            if (sprite.shadow) {
                ctx.fillStyle = 'rgba(0,0,0,0.3)';
                ctx.beginPath();
                ctx.ellipse(
                    screen.x + sprite.width / 2,
                    screen.y + sprite.height + 2 + bobY,
                    sprite.width / 2.5, 3, 0, 0, Math.PI * 2
                );
                ctx.fill();
            }

            ctx.fillStyle = sprite.color;
            ctx.fillRect(screen.x, screen.y + bobY, sprite.width, sprite.height);

            if (sprite.borderColor) {
                ctx.strokeStyle = sprite.borderColor;
                ctx.lineWidth = 1;
                ctx.strokeRect(screen.x, screen.y + bobY, sprite.width, sprite.height);
            }

            if (sprite.hasEyes) {
                const eyeY = screen.y + sprite.height * 0.3 + bobY;
                const eyeSize = Math.max(2, sprite.width * 0.12);
                const eyeSpacing = sprite.width * 0.15;
                const eyeCenterX = screen.x + sprite.width / 2;
                const eyeOffsetX = sprite.facing > 0 ? 2 : -2;

                ctx.fillStyle = sprite.eyeColor;
                ctx.fillRect(eyeCenterX - eyeSpacing + eyeOffsetX - eyeSize / 2, eyeY, eyeSize, eyeSize);
                ctx.fillRect(eyeCenterX + eyeSpacing + eyeOffsetX - eyeSize / 2, eyeY, eyeSize, eyeSize);

                ctx.fillStyle = '#111';
                const pupilSize = Math.max(1, eyeSize * 0.6);
                const pupilOffset = sprite.facing > 0 ? 1 : -1;
                ctx.fillRect(eyeCenterX - eyeSpacing + eyeOffsetX - pupilSize / 2 + pupilOffset, eyeY + 1, pupilSize, pupilSize);
                ctx.fillRect(eyeCenterX + eyeSpacing + eyeOffsetX - pupilSize / 2 + pupilOffset, eyeY + 1, pupilSize, pupilSize);
            }

            const weapon = entity.getComponent(Weapon);
            const pc = entity.getComponent(PlayerController);
            if (weapon && weapon.swinging && pc) {
                this._renderWeaponSwing(ctx, screen, sprite, weapon, pc);
            }

            const health = entity.getComponent(Health);
            if (health && health.showBar && health.current < health.max) {
                const barWidth = sprite.width + 4;
                const barX = screen.x - 2;
                const barY = screen.y - 8 + bobY;
                const ratio = health.ratio;

                let barColor;
                if (ratio > 0.6) barColor = '#44ff44';
                else if (ratio > 0.3) barColor = '#ffdd00';
                else barColor = '#ff4444';

                ctx.fillStyle = '#1a1a1a';
                ctx.fillRect(barX, barY, barWidth, 4);
                ctx.fillStyle = barColor;
                ctx.fillRect(barX, barY, barWidth * ratio, 4);
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 0.5;
                ctx.strokeRect(barX, barY, barWidth, 4);
            }

            ctx.globalAlpha = 1;
        }
    }

        _renderWeaponSwing(ctx, screen, sprite, weapon, pc) {
        const centerX = screen.x + sprite.width / 2;
        const centerY = screen.y + sprite.height / 2;
        const angle = Math.atan2(pc.lastDir.y, pc.lastDir.x);
        const swingAngle = (weapon.swingProgress - 0.5) * Math.PI;

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + swingAngle);

        ctx.fillStyle = weapon.color;
        ctx.fillRect(8, -2, weapon.range * 0.6, 4);

        ctx.globalAlpha = 0.3 * (1 - weapon.swingProgress);
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(0, 0, weapon.range * 0.6, -0.5, 0.5);
        ctx.lineTo(0, 0);
        ctx.fill();

        ctx.restore();
        ctx.globalAlpha = 1;
    }

        _renderTileMap(ctx) {
        if (!this.tileMap) return;

        const cam = this.camera;
        const startCol = Math.max(0, Math.floor(cam.x / TILE) - 1);
        const endCol = Math.min(this.tileMap[0].length, Math.ceil((cam.x + cam.viewWidth) / TILE) + 1);
        const startRow = Math.max(0, Math.floor(cam.y / TILE) - 1);
        const endRow = Math.min(this.tileMap.length, Math.ceil((cam.y + cam.viewHeight) / TILE) + 1);

        for (let row = startRow; row < endRow; row++) {
            for (let col = startCol; col < endCol; col++) {
                const tile = this.tileMap[row][col];
                const screen = cam.worldToScreen(col * TILE, row * TILE);

                if (tile === 1) {
                    
                    ctx.fillStyle = '#2d2d44';
                    ctx.fillRect(screen.x, screen.y, TILE, TILE);
                    
                    ctx.fillStyle = '#3a3a55';
                    ctx.fillRect(screen.x, screen.y, TILE, 2);
                    
                    ctx.fillStyle = '#1e1e33';
                    ctx.fillRect(screen.x, screen.y + TILE - 3, TILE, 3);
                } else {
                    
                    ctx.fillStyle = this.tileColors[tile] || '#1a1a2e';
                    ctx.fillRect(screen.x, screen.y, TILE, TILE);

                    ctx.strokeStyle = 'rgba(255,255,255,0.03)';
                    ctx.lineWidth = 0.5;
                    ctx.strokeRect(screen.x, screen.y, TILE, TILE);

                    if ((row * 7 + col * 13) % 17 === 0) {
                        ctx.fillStyle = 'rgba(255,255,255,0.02)';
                        ctx.fillRect(screen.x + 8, screen.y + 8, 4, 4);
                    }
                }
            }
        }
    }
}
