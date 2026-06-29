export class Scene {
        constructor(context) {
                this.context = context;

                this.ready = false;
    }

        enter() {
        this.ready = true;
    }

        exit() {}

        pause() {}

        resume() {}

        update(dt) {}

        render(ctx) {}
}

export class SceneManager {
    constructor() {
                this._stack = [];

                this._nextScene = null;

                this._transitionState = 'none'; 

                this._transitionAlpha = 0;

                this._transitionSpeed = 3;

                this._transitionMode = 'switch';
    }

        get current() {
        return this._stack.length > 0 ? this._stack[this._stack.length - 1] : null;
    }

        push(scene, transition = false) {
        if (transition) {
            this._nextScene = scene;
            this._transitionState = 'fade-out';
            this._transitionAlpha = 0;
            this._transitionMode = 'push';
        } else {
            if (this.current) this.current.pause();
            this._stack.push(scene);
            scene.enter();
        }
    }

        pop(transition = false) {
        if (transition) {
            this._nextScene = null;
            this._transitionState = 'fade-out';
            this._transitionAlpha = 0;
            this._transitionMode = 'pop';
        } else {
            const old = this._stack.pop();
            if (old) old.exit();
            if (this.current) this.current.resume();
        }
    }

        switchTo(scene, transition = true) {
        if (transition) {
            this._nextScene = scene;
            this._transitionState = 'fade-out';
            this._transitionAlpha = 0;
            this._transitionMode = 'switch';
        } else {
            const old = this._stack.pop();
            if (old) old.exit();
            this._stack.push(scene);
            scene.enter();
        }
    }

        clear() {
        while (this._stack.length > 0) {
            const scene = this._stack.pop();
            scene.exit();
        }
    }

        update(dt) {
        
        if (this._transitionState === 'fade-out') {
            this._transitionAlpha += this._transitionSpeed * dt;
            if (this._transitionAlpha >= 1) {
                this._transitionAlpha = 1;
                this._executeTransition();
                this._transitionState = 'fade-in';
            }
            return; 
        }

        if (this._transitionState === 'fade-in') {
            this._transitionAlpha -= this._transitionSpeed * dt;
            if (this._transitionAlpha <= 0) {
                this._transitionAlpha = 0;
                this._transitionState = 'none';
            }
        }

        if (this.current) {
            this.current.update(dt);
        }
    }

        render(ctx) {
        
        if (this.current) {
            this.current.render(ctx);
        }

        if (this._transitionState !== 'none') {
            ctx.fillStyle = `rgba(0, 0, 0, ${this._transitionAlpha})`;
            ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
        }
    }

        _executeTransition() {
        switch (this._transitionMode) {
            case 'switch': {
                const old = this._stack.pop();
                if (old) old.exit();
                if (this._nextScene) {
                    this._stack.push(this._nextScene);
                    this._nextScene.enter();
                }
                break;
            }
            case 'push': {
                if (this.current) this.current.pause();
                if (this._nextScene) {
                    this._stack.push(this._nextScene);
                    this._nextScene.enter();
                }
                break;
            }
            case 'pop': {
                const old = this._stack.pop();
                if (old) old.exit();
                if (this.current) this.current.resume();
                break;
            }
        }
        this._nextScene = null;
    }
}
