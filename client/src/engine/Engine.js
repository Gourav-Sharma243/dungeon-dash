export class Engine {
        static FIXED_TIMESTEP = 1000 / 60;

        static MAX_FRAME_SKIP = 5;

        constructor(canvas) {
                this.canvas = canvas;

                this.ctx = canvas.getContext('2d');

                this.running = false;

                this.paused = false;

                this.fps = 0;

                this.width = canvas.width;

                this.height = canvas.height;

                this.onUpdate = null;

                this.onRender = null;

        this._lastTime = 0;
        this._accumulator = 0;
        this._frameCount = 0;
        this._fpsTimer = 0;
        this._rafId = null;
        this._boundLoop = this._loop.bind(this);
    }

        start() {
        if (this.running) return;
        this.running = true;
        this._lastTime = performance.now();
        this._accumulator = 0;
        this._rafId = requestAnimationFrame(this._boundLoop);
        console.log('[Engine] Started — target: 60fps fixed timestep');
    }

        stop() {
        this.running = false;
        if (this._rafId) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
        console.log('[Engine] Stopped');
    }

        pause() {
        this.paused = true;
    }

        resume() {
        this.paused = false;
        this._lastTime = performance.now();
        this._accumulator = 0;
    }

        resize(width, height) {
        this.canvas.width = width;
        this.canvas.height = height;
        this.width = width;
        this.height = height;
        
        this.ctx.imageSmoothingEnabled = false;
    }

        _loop(currentTime) {
        if (!this.running) return;

        const elapsed = Math.min(currentTime - this._lastTime, 250);
        this._lastTime = currentTime;

        this._frameCount++;
        this._fpsTimer += elapsed;
        if (this._fpsTimer >= 1000) {
            this.fps = this._frameCount;
            this._frameCount = 0;
            this._fpsTimer -= 1000;
        }

        if (!this.paused) {
            this._accumulator += elapsed;
            let steps = 0;

            while (this._accumulator >= Engine.FIXED_TIMESTEP && steps < Engine.MAX_FRAME_SKIP) {
                if (this.onUpdate) {
                    this.onUpdate(Engine.FIXED_TIMESTEP / 1000); 
                }
                this._accumulator -= Engine.FIXED_TIMESTEP;
                steps++;
            }
        }

        if (this.onRender) {
            this.onRender(this.ctx);
        }

        this._rafId = requestAnimationFrame(this._boundLoop);
    }
}
