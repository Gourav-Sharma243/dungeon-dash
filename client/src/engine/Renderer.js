export class Camera {
        constructor(viewWidth, viewHeight) {
                this.x = 0;

                this.y = 0;

                this.viewWidth = viewWidth;

                this.viewHeight = viewHeight;

                this.lerpSpeed = 0.1;

        this._shakeIntensity = 0;
        this._shakeDuration = 0;
        this._shakeTimer = 0;
        this._shakeOffsetX = 0;
        this._shakeOffsetY = 0;
    }

        follow(targetX, targetY, dt) {
        
        const destX = targetX - this.viewWidth / 2;
        const destY = targetY - this.viewHeight / 2;

        const t = 1 - Math.pow(1 - this.lerpSpeed, dt * 60);
        this.x += (destX - this.x) * t;
        this.y += (destY - this.y) * t;
    }

        centerOn(x, y) {
        this.x = x - this.viewWidth / 2;
        this.y = y - this.viewHeight / 2;
    }

        shake(intensity, duration) {
        this._shakeIntensity = intensity;
        this._shakeDuration = duration;
        this._shakeTimer = duration;
    }

        update(dt) {
        if (this._shakeTimer > 0) {
            this._shakeTimer -= dt;
            const progress = this._shakeTimer / this._shakeDuration;
            const currentIntensity = this._shakeIntensity * progress;
            this._shakeOffsetX = (Math.random() * 2 - 1) * currentIntensity;
            this._shakeOffsetY = (Math.random() * 2 - 1) * currentIntensity;
        } else {
            this._shakeOffsetX = 0;
            this._shakeOffsetY = 0;
        }
    }

        worldToScreen(worldX, worldY) {
        return {
            x: worldX - this.x + this._shakeOffsetX,
            y: worldY - this.y + this._shakeOffsetY
        };
    }

        isVisible(x, y, w, h) {
        return (
            x + w > this.x - 32 &&
            x < this.x + this.viewWidth + 32 &&
            y + h > this.y - 32 &&
            y < this.y + this.viewHeight + 32
        );
    }
}

export class ParticleSystem {
    constructor() {
                this.particles = [];
    }

        emit(x, y, options = {}) {
        const {
            count = 10,
            color = '#ff0',
            speed = 100,
            life = 0.5,
            size = 3,
            gravity = 0,
            spread = Math.PI * 2,
            angle = 0
        } = options;

        for (let i = 0; i < count; i++) {
            const a = angle + (Math.random() - 0.5) * spread;
            const s = Math.random() * speed;
            this.particles.push({
                x,
                y,
                vx: Math.cos(a) * s,
                vy: Math.sin(a) * s,
                life: life + Math.random() * life * 0.5,
                maxLife: life,
                size: size + Math.random() * size * 0.5,
                color,
                gravity
            });
        }
    }

        emitText(x, y, text, color = '#fff') {
        this.particles.push({
            x,
            y,
            vx: (Math.random() - 0.5) * 20,
            vy: -60,
            life: 1.0,
            maxLife: 1.0,
            size: 14,
            color,
            gravity: 0,
            text
        });
    }

        update(dt) {
        for (let i = this.particles.length - 1; i >= 0; i--) {
            const p = this.particles[i];
            p.life -= dt;

            if (p.life <= 0) {
                this.particles.splice(i, 1);
                continue;
            }

            p.vy += p.gravity * dt;
            p.x += p.vx * dt;
            p.y += p.vy * dt;
        }
    }

        render(ctx, camera) {
        for (const p of this.particles) {
            const alpha = Math.max(0, p.life / p.maxLife);
            const screen = camera.worldToScreen(p.x, p.y);

            ctx.globalAlpha = alpha;

            if (p.text) {
                
                ctx.fillStyle = p.color;
                ctx.font = `bold ${p.size}px monospace`;
                ctx.textAlign = 'center';
                ctx.fillText(p.text, screen.x, screen.y);
            } else {
                
                ctx.fillStyle = p.color;
                const size = p.size * alpha;
                ctx.fillRect(
                    screen.x - size / 2,
                    screen.y - size / 2,
                    size,
                    size
                );
            }
        }

        ctx.globalAlpha = 1;
    }

        clear() {
        this.particles = [];
    }
}

export class Renderer {
        static clear(ctx, width, height, color = '#0a0a1a') {
        ctx.fillStyle = color;
        ctx.fillRect(0, 0, width, height);
    }

        static drawRect(ctx, x, y, w, h, fillColor, strokeColor, lineWidth = 1) {
        ctx.fillStyle = fillColor;
        ctx.fillRect(x, y, w, h);
        if (strokeColor) {
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = lineWidth;
            ctx.strokeRect(x, y, w, h);
        }
    }

        static drawBar(ctx, x, y, width, height, ratio, fgColor, bgColor) {
        
        ctx.fillStyle = bgColor;
        ctx.fillRect(x, y, width, height);
        
        ctx.fillStyle = fgColor;
        ctx.fillRect(x, y, width * Math.max(0, Math.min(1, ratio)), height);
        
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 1;
        ctx.strokeRect(x, y, width, height);
    }

        static drawText(ctx, text, x, y, options = {}) {
        const {
            color = '#fff',
            font = '16px monospace',
            align = 'left',
            shadow = '#000'
        } = options;

        ctx.font = font;
        ctx.textAlign = align;
        ctx.textBaseline = 'top';

        if (shadow) {
            ctx.fillStyle = shadow;
            ctx.fillText(text, x + 1, y + 1);
        }

        ctx.fillStyle = color;
        ctx.fillText(text, x, y);
    }
}
