import { Scene } from '../../engine/SceneManager.js';
import { Renderer } from '../../engine/Renderer.js';
import { GameScene } from './GameScene.js';

export class MenuScene extends Scene {
        enter() {
        super.enter();

                this.timer = 0;

                this.selectedIndex = 0;

                this.menuItems = [
            { icon: '⚔️', label: 'START GAME', action: 'play' },
            { icon: '📅', label: 'DAILY CHALLENGE', action: 'daily' },
            { icon: '🏆', label: 'LEADERBOARD', action: 'leaderboard' },
            { icon: '🔊', label: 'SOUND: ON', action: 'sound' },
        ];

                this.bgParticles = [];
        for (let i = 0; i < 30; i++) {
            this.bgParticles.push({
                x: Math.random() * 800,
                y: Math.random() * 800,
                size: 1 + Math.random() * 3,
                speed: 5 + Math.random() * 15,
                alpha: 0.1 + Math.random() * 0.3,
                color: ['#4a4a8a', '#6a4a8a', '#4a6a8a', '#8a6a4a'][Math.floor(Math.random() * 4)]
            });
        }

                this.torches = [
            { x: 80, y: 200, flicker: 0 },
            { x: 720, y: 200, flicker: Math.PI },
            { x: 80, y: 500, flicker: Math.PI / 2 },
            { x: 720, y: 500, flicker: Math.PI * 1.5 },
        ];

        this._audioInitialized = false;

        console.log('[MenuScene] Entered');
    }

        update(dt) {
        this.timer += dt;
        const { input } = this.context;

        if (input.isPressed('ArrowUp') || input.isPressed('KeyW')) {
            this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
            this.context.audio.play('select');
        }
        if (input.isPressed('ArrowDown') || input.isPressed('KeyS')) {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
            this.context.audio.play('select');
        }

        if (input.isPressed('Enter') || input.isPressed('Space')) {
            this._initAudio();
            this._executeMenuAction(this.menuItems[this.selectedIndex].action);
        }

        if (input.pointerClicked) {
            this._initAudio();
            const clickedIndex = this._getMenuItemAtPosition(input.pointer.x, input.pointer.y);
            if (clickedIndex >= 0) {
                this.selectedIndex = clickedIndex;
                this._executeMenuAction(this.menuItems[clickedIndex].action);
            }
        }

        for (const p of this.bgParticles) {
            p.y -= p.speed * dt;
            if (p.y < -10) {
                p.y = this.context.engine.height + 10;
                p.x = Math.random() * this.context.engine.width;
            }
        }

        input.endFrame();
    }

        render(ctx) {
        const { width, height } = this.context.engine;

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#0a0a1a');
        grad.addColorStop(0.5, '#12122a');
        grad.addColorStop(1, '#0a0a1a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        for (const p of this.bgParticles) {
            ctx.globalAlpha = p.alpha;
            ctx.fillStyle = p.color;
            ctx.fillRect(p.x, p.y, p.size, p.size);
        }
        ctx.globalAlpha = 1;

        for (const torch of this.torches) {
            const flicker = 0.4 + Math.sin(this.timer * 5 + torch.flicker) * 0.15;
            const radius = 40 + Math.sin(this.timer * 8 + torch.flicker) * 5;
            const glow = ctx.createRadialGradient(torch.x, torch.y, 0, torch.x, torch.y, radius);
            glow.addColorStop(0, `rgba(255, 140, 50, ${flicker})`);
            glow.addColorStop(0.5, `rgba(255, 100, 20, ${flicker * 0.3})`);
            glow.addColorStop(1, 'rgba(255, 80, 10, 0)');
            ctx.fillStyle = glow;
            ctx.fillRect(torch.x - radius, torch.y - radius, radius * 2, radius * 2);

            ctx.fillStyle = '#8B4513';
            ctx.fillRect(torch.x - 3, torch.y - 5, 6, 15);
            ctx.fillStyle = '#ff6600';
            ctx.fillRect(torch.x - 2, torch.y - 8, 4, 5);
        }

        const titleY = height * 0.15;

        ctx.fillStyle = '#000';
        ctx.font = 'bold 52px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('DUNGEON', width / 2 + 3, titleY + 3);
        ctx.fillText('DASH', width / 2 + 3, titleY + 60 + 3);

        const titleGrad = ctx.createLinearGradient(0, titleY - 30, 0, titleY + 80);
        titleGrad.addColorStop(0, '#ffdd44');
        titleGrad.addColorStop(0.5, '#ff8800');
        titleGrad.addColorStop(1, '#ff4400');
        ctx.fillStyle = titleGrad;
        ctx.font = 'bold 52px Outfit, sans-serif';
        ctx.fillText('DUNGEON', width / 2, titleY);
        ctx.fillText('DASH', width / 2, titleY + 60);

        const subtitleAlpha = 0.5 + Math.sin(this.timer * 2) * 0.3;
        ctx.globalAlpha = subtitleAlpha;
        ctx.fillStyle = '#aaaacc';
        ctx.font = '14px Outfit, sans-serif';
        ctx.fillText('A Roguelike Dungeon Crawler', width / 2, titleY + 95);
        ctx.globalAlpha = 1;

        this._drawHeroPreview(ctx, width / 2, titleY + 155);

        const menuStartY = height * 0.52;
        const menuSpacing = 50;

        for (let i = 0; i < this.menuItems.length; i++) {
            const item = this.menuItems[i];
            const y = menuStartY + i * menuSpacing;
            const isSelected = i === this.selectedIndex;

            if (isSelected) {
                
                const pulse = 0.8 + Math.sin(this.timer * 4) * 0.2;
                ctx.fillStyle = `rgba(255, 170, 50, ${0.15 * pulse})`;
                const boxWidth = 280;
                ctx.fillRect(width / 2 - boxWidth / 2, y - 18, boxWidth, 36);
                ctx.strokeStyle = `rgba(255, 170, 50, ${0.5 * pulse})`;
                ctx.lineWidth = 1;
                ctx.strokeRect(width / 2 - boxWidth / 2, y - 18, boxWidth, 36);

                const arrowBob = Math.sin(this.timer * 6) * 3;
                ctx.fillStyle = '#ffaa33';
                ctx.font = '16px "Press Start 2P", monospace';
                ctx.textAlign = 'right';
                ctx.fillText('▶', width / 2 - 130 + arrowBob, y + 6);
            }

            ctx.fillStyle = isSelected ? '#ffdd66' : '#8888aa';
            ctx.font = isSelected ? 'bold 18px Outfit, sans-serif' : '16px Outfit, sans-serif';
            
            const labelText = item.label;
            const iconText = item.icon;

            ctx.textAlign = 'center';

            ctx.fillText(iconText, width / 2 - 75, y + 6);

            ctx.fillText(labelText, width / 2 + 15, y + 6);
        }

        const hintY = height - 60;
        ctx.fillStyle = '#555577';
        ctx.font = '12px Outfit, sans-serif';
        ctx.textAlign = 'center';

        if (this.context.input.isTouchDevice) {
            ctx.fillText('Tap to select • Left side = Move • Right side = Attack', width / 2, hintY);
        } else {
            ctx.fillText('↑↓ Navigate • Enter/Space Select • WASD Move • Space Attack', width / 2, hintY);
        }

        ctx.fillStyle = '#333355';
        ctx.font = '10px Outfit, sans-serif';
        ctx.fillText('v1.0.0 • Built with Custom HTML5 Engine', width / 2, height - 20);
    }

        _drawHeroPreview(ctx, cx, cy) {
        const bob = Math.sin(this.timer * 3) * 3;
        const size = 28;

        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.beginPath();
        ctx.ellipse(cx, cy + size + 5, 14, 4, 0, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = '#44aaff';
        ctx.fillRect(cx - size / 2, cy - size / 2 + bob, size, size);
        ctx.strokeStyle = '#2288dd';
        ctx.lineWidth = 2;
        ctx.strokeRect(cx - size / 2, cy - size / 2 + bob, size, size);

        ctx.fillStyle = '#fff';
        ctx.fillRect(cx - 5, cy - 4 + bob, 4, 5);
        ctx.fillRect(cx + 2, cy - 4 + bob, 4, 5);
        ctx.fillStyle = '#111';
        ctx.fillRect(cx - 4, cy - 3 + bob, 2, 3);
        ctx.fillRect(cx + 3, cy - 3 + bob, 2, 3);

        const swordAngle = Math.sin(this.timer * 2) * 0.3;
        ctx.save();
        ctx.translate(cx + size / 2 + 2, cy + bob);
        ctx.rotate(-0.5 + swordAngle);
        ctx.fillStyle = '#ccc';
        ctx.fillRect(0, -2, 22, 4);
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(-2, -3, 6, 6);
        ctx.restore();
    }

        _getMenuItemAtPosition(px, py) {
        const { height } = this.context.engine;
        const menuStartY = height * 0.52;
        const menuSpacing = 50;

        for (let i = 0; i < this.menuItems.length; i++) {
            const y = menuStartY + i * menuSpacing;
            if (py >= y - 20 && py <= y + 20) {
                return i;
            }
        }
        return -1;
    }

        _initAudio() {
        if (!this._audioInitialized) {
            this.context.audio.init();
            this._audioInitialized = true;
        }
    }

        _executeMenuAction(action) {
        switch (action) {
            case 'play':
                this.context.audio.play('select');
                this.context.sceneManager.switchTo(
                    new GameScene(this.context),
                    true
                );
                break;

            case 'daily': {
                this.context.audio.play('select');
                
                const today = new Date();
                const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
                this.context.sceneManager.switchTo(
                    new GameScene(this.context, { seed, isDaily: true }),
                    true
                );
                break;
            }

            case 'leaderboard':
                this.context.audio.play('select');
                
                break;

            case 'sound':
                const muted = this.context.audio.toggleMute();
                this.menuItems[3].icon = muted ? '🔇' : '🔊';
                this.menuItems[3].label = muted ? 'SOUND: OFF' : 'SOUND: ON';
                break;
        }
    }
}
