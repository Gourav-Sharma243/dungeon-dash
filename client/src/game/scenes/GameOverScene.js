import { Scene } from '../../engine/SceneManager.js';
import { Renderer } from '../../engine/Renderer.js';
import { GameScene } from './GameScene.js';
import { MenuScene } from './MenuScene.js';
import { db } from '../../firebase-config.js';
import { collection, addDoc, getDocs, query, orderBy, limit, where } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

export class GameOverScene extends Scene {
        constructor(context, stats) {
        super(context);
        this.stats = stats;
    }

        enter() {
        super.enter();
        this.context.input.hideControls();

        this.timer = 0;

                this.displayScore = 0;

                this.selectedIndex = 0;

                this.menuItems = [
            { icon: '🔄', label: 'PLAY AGAIN', action: 'retry' },
            { icon: '🏠', label: 'MAIN MENU', action: 'menu' },
        ];

                this.scoreSubmitted = false;

                this.leaderboard = null;

                this.submitStatus = '';

        // Background particles (falling embers)
        this.embers = [];
        for (let i = 0; i < 40; i++) {
            this.embers.push({
                x: Math.random() * 800,
                y: Math.random() * 800,
                size: 1 + Math.random() * 2,
                speed: 15 + Math.random() * 30,
                alpha: 0.2 + Math.random() * 0.4,
                wobble: Math.random() * Math.PI * 2,
                wobbleSpeed: 1 + Math.random() * 2,
            });
        }

        // Try to submit score to server
        this._submitScore();

        console.log(`[GameOverScene] Score: ${this.stats.score}, Level: ${this.stats.level}`);
    }

    /** @override */
    update(dt) {
        this.timer += dt;
        const { input } = this.context;

        // Animate score counter
        if (this.displayScore < this.stats.score) {
            const speed = Math.max(1, (this.stats.score - this.displayScore) * 3);
            this.displayScore = Math.min(this.stats.score, this.displayScore + speed * dt);
        }

        // Menu navigation
        if (input.isPressed('ArrowRight') || input.isPressed('KeyD')) {
            this.selectedIndex = (this.selectedIndex + 1) % this.menuItems.length;
            this.context.audio.play('select');
        }
        if (input.isPressed('ArrowLeft') || input.isPressed('KeyA')) {
            this.selectedIndex = (this.selectedIndex - 1 + this.menuItems.length) % this.menuItems.length;
            this.context.audio.play('select');
        }

        if (input.isPressed('Enter') || input.isPressed('Space')) {
            this._executeAction(this.menuItems[this.selectedIndex].action);
        }

        if (input.pointerClicked) {
            const clicked = this._getMenuItemAt(input.pointer.x, input.pointer.y);
            if (clicked >= 0) {
                this.selectedIndex = clicked;
                this._executeAction(this.menuItems[clicked].action);
            }
        }

        for (const e of this.embers) {
            e.y += e.speed * dt;
            e.wobble += e.wobbleSpeed * dt;
            e.x += Math.sin(e.wobble) * 0.5;
            if (e.y > this.context.engine.height + 10) {
                e.y = -10;
                e.x = Math.random() * this.context.engine.width;
            }
        }

        input.endFrame();
    }

        render(ctx) {
        const { width, height } = this.context.engine;

        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, '#1a0a0a');
        grad.addColorStop(0.4, '#2a1010');
        grad.addColorStop(0.6, '#2a1010');
        grad.addColorStop(1, '#0a0a0a');
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);

        for (const e of this.embers) {
            ctx.globalAlpha = e.alpha * (0.5 + Math.sin(this.timer * 3 + e.wobble) * 0.5);
            ctx.fillStyle = '#ff6633';
            ctx.fillRect(e.x, e.y, e.size, e.size);
        }
        ctx.globalAlpha = 1;

        ctx.textBaseline = 'alphabetic';

        const fadeIn = Math.min(this.timer / 0.5, 1);
        ctx.globalAlpha = fadeIn;

        ctx.fillStyle = '#000';
        ctx.font = 'bold 48px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('GAME OVER', width / 2 + 3, 80 + 3);

        const titleGrad = ctx.createLinearGradient(0, 50, 0, 100);
        titleGrad.addColorStop(0, '#ff4444');
        titleGrad.addColorStop(1, '#cc2222');
        ctx.fillStyle = titleGrad;
        ctx.fillText('GAME OVER', width / 2, 80);

        ctx.globalAlpha = 1;

        const scoreY = 150;
        if (this.timer > 0.3) {
            ctx.fillStyle = '#888';
            ctx.font = '14px Outfit, sans-serif';
            ctx.fillText('FINAL SCORE', width / 2, scoreY);

            ctx.fillStyle = '#ffdd44';
            ctx.font = 'bold 42px Outfit, sans-serif';
            ctx.fillText(Math.floor(this.displayScore).toLocaleString(), width / 2, scoreY + 50);
        }

        if (this.timer > 0.8) {
            const statsY = scoreY + 90;
            const alpha = Math.min((this.timer - 0.8) / 0.5, 1);
            ctx.globalAlpha = alpha;

            const statsData = [
                { label: 'Floors Cleared', value: this.stats.level, color: '#44ddff', icon: '🏰' },
                { label: 'Enemies Slain', value: this.stats.kills, color: '#ff6644', icon: '💀' },
                { label: 'Gold Collected', value: this.stats.gold, color: '#ffdd00', icon: '💰' },
            ];

            ctx.fillStyle = 'rgba(0, 0, 0, 0.4)';
            ctx.fillRect(width / 2 - 160, statsY - 15, 320, statsData.length * 35 + 15);
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.strokeRect(width / 2 - 160, statsY - 15, 320, statsData.length * 35 + 15);

            for (let i = 0; i < statsData.length; i++) {
                const stat = statsData[i];
                const y = statsY + i * 35 + 10;

                ctx.fillStyle = '#777';
                ctx.font = '14px Outfit, sans-serif';
                ctx.textAlign = 'left';
                ctx.fillText(`${stat.icon}  ${stat.label}`, width / 2 - 140, y);

                ctx.fillStyle = stat.color;
                ctx.font = 'bold 16px Outfit, sans-serif';
                ctx.textAlign = 'right';
                ctx.fillText(stat.value.toLocaleString(), width / 2 + 140, y);
            }

            ctx.globalAlpha = 1;
        }

        if (this.stats.isDaily && this.timer > 1.2) {
            ctx.fillStyle = '#ff8844';
            ctx.font = 'bold 14px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('📅 DAILY CHALLENGE', width / 2, 380);
        }

        if (this.leaderboard && this.timer > 1.5) {
            this._renderLeaderboard(ctx, width, 400);
        }

        if (this.submitStatus) {
            ctx.fillStyle = '#666';
            ctx.font = '11px Outfit, sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText(this.submitStatus, width / 2, height - 115);
        }

        if (this.timer > 1.5) {
            const isMobile = height < 500;
            const menuY = isMobile ? height - 120 : height - 80;
            const alpha = Math.min((this.timer - 1.5) / 0.5, 1);
            ctx.globalAlpha = alpha;

            for (let i = 0; i < this.menuItems.length; i++) {
                const item = this.menuItems[i];
                let x, y;
                if (isMobile) {
                    x = width / 2;
                    y = menuY + i * 40;
                } else {
                    x = width / 2 + (i - 0.5) * 220;
                    y = menuY;
                }
                const isSelected = i === this.selectedIndex;

                if (isSelected) {
                    ctx.fillStyle = 'rgba(255, 170, 50, 0.15)';
                    ctx.fillRect(x - 90, y - 15, 180, 30);
                    ctx.strokeStyle = 'rgba(255, 170, 50, 0.4)';
                    ctx.lineWidth = 1;
                    ctx.strokeRect(x - 90, y - 15, 180, 30);
                }

                ctx.fillStyle = isSelected ? '#ffdd66' : '#888';
                ctx.font = isSelected ? 'bold 15px Outfit, sans-serif' : '13px Outfit, sans-serif';

                const labelText = item.label;
                const iconText = item.icon;

                ctx.textAlign = 'center';
                ctx.fillText(iconText, x - 50, y + 5);
                ctx.fillText(labelText, x + 15, y + 5);
            }

            ctx.globalAlpha = 1;
        }
    }

        _renderLeaderboard(ctx, width, startY) {
        ctx.fillStyle = '#888';
        ctx.font = 'bold 14px Outfit, sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🏆 TOP SCORES', width / 2, startY);

        for (let i = 0; i < Math.min(5, this.leaderboard.length); i++) {
            const entry = this.leaderboard[i];
            const y = startY + 25 + i * 22;
            const rank = i + 1;
            const medal = rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : `${rank}.`;

            ctx.fillStyle = '#666';
            ctx.font = '13px Outfit, sans-serif';
            ctx.textAlign = 'left';
            ctx.fillText(`${medal} ${entry.name || 'Anonymous'}`, width / 2 - 120, y);

            ctx.fillStyle = '#ffdd44';
            ctx.textAlign = 'right';
            ctx.fillText(entry.score.toLocaleString(), width / 2 + 120, y);
        }
    }

        _getMenuItemAt(px, py) {
        const { width, height } = this.context.engine;
        const isMobile = height < 500;
        const menuY = isMobile ? height - 120 : height - 80;

        for (let i = 0; i < this.menuItems.length; i++) {
            let x, y;
            if (isMobile) {
                x = width / 2;
                y = menuY + i * 40;
            } else {
                x = width / 2 + (i - 0.5) * 220;
                y = menuY;
            }
            if (px >= x - 90 && px <= x + 90 && py >= y - 15 && py <= y + 15) {
                return i;
            }
        }
        return -1;
    }

        _executeAction(action) {
        this.context.audio.play('select');

        switch (action) {
            case 'retry':
                this.context.sceneManager.switchTo(
                    new GameScene(this.context),
                    true
                );
                break;
            case 'menu':
                this.context.sceneManager.switchTo(
                    new MenuScene(this.context),
                    true
                );
                break;
        }
    }

        async _submitScore() {
        try {
            this.submitStatus = 'Submitting score...';

            if (db) {
                await addDoc(collection(db, "scores"), {
                    name: 'Player',
                    score: this.stats.score,
                    level: this.stats.level,
                    kills: this.stats.kills,
                    gold: this.stats.gold,
                    isDaily: this.stats.isDaily || false,
                    timestamp: new Date().getTime()
                });
                this.submitStatus = 'Score submitted!';
                await this._fetchLeaderboard();
                return;
            }

            // Local backend fallback
            const response = await fetch('/api/scores', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: 'Player',
                    score: this.stats.score,
                    level: this.stats.level,
                    kills: this.stats.kills,
                    gold: this.stats.gold,
                    isDaily: this.stats.isDaily
                })
            });

            if (response.ok) {
                this.submitStatus = 'Score submitted!';
                await this._fetchLeaderboard();
            } else {
                this.submitStatus = 'Server unavailable — score saved locally';
                this._saveLocalScore();
            }
        } catch (err) {
            this.submitStatus = 'Offline — score saved locally';
            this._saveLocalScore();
            this._loadLocalLeaderboard();
        }
    }

        async _fetchLeaderboard() {
        try {
            if (db) {
                const scoresRef = collection(db, "scores");
                const isDaily = this.stats.isDaily || false;
                const q = query(
                    scoresRef, 
                    where("isDaily", "==", isDaily), 
                    orderBy("score", "desc"), 
                    limit(5)
                );
                
                const querySnapshot = await getDocs(q);
                const results = [];
                querySnapshot.forEach((doc) => {
                    results.push(doc.data());
                });
                
                this.leaderboard = results;
                return;
            }

            // Local backend fallback
            const endpoint = this.stats.isDaily ? '/api/leaderboard/daily' : '/api/leaderboard';
            const response = await fetch(endpoint);
            if (response.ok) {
                this.leaderboard = await response.json();
            }
        } catch (err) {
            console.error('Leaderboard fetch error:', err);
            this._loadLocalLeaderboard();
        }
    }

        _saveLocalScore() {
        try {
            const scores = JSON.parse(localStorage.getItem('dungeon-dash-scores') || '[]');
            scores.push({
                name: 'Player',
                score: this.stats.score,
                level: this.stats.level,
                kills: this.stats.kills,
                gold: this.stats.gold,
                date: new Date().toISOString()
            });
            scores.sort((a, b) => b.score - a.score);
            localStorage.setItem('dungeon-dash-scores', JSON.stringify(scores.slice(0, 50)));
        } catch {  }
    }

        _loadLocalLeaderboard() {
        try {
            const scores = JSON.parse(localStorage.getItem('dungeon-dash-scores') || '[]');
            this.leaderboard = scores.slice(0, 10);
        } catch {
            this.leaderboard = [];
        }
    }
}
