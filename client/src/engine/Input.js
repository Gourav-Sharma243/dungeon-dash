export class Input {
        static JOYSTICK_DEAD_ZONE = 10;

        static JOYSTICK_MAX_DIST = 50;

        constructor(canvas) {
                this.canvas = canvas;

                this._held = new Set();

                this._pressed = new Set();

                this._released = new Set();

                this.joystick = {
            active: false,
            startX: 0, startY: 0,
            currentX: 0, currentY: 0,
            dx: 0, dy: 0,
            distance: 0,
            touchId: null
        };

                this.actionTouch = false;
        this._actionTouchId = null;

                this.pointer = { x: 0, y: 0 };

                this.pointerDown = false;

                this.pointerClicked = false;

                this.isTouchDevice = 'ontouchstart' in window;

        this._bindEvents();
    }

        isPressed(key) {
        return this._pressed.has(key);
    }

        isHeld(key) {
        return this._held.has(key);
    }

        isReleased(key) {
        return this._released.has(key);
    }

        getMovementVector() {
        let x = 0;
        let y = 0;

        if (this.isHeld('ArrowLeft') || this.isHeld('KeyA')) x -= 1;
        if (this.isHeld('ArrowRight') || this.isHeld('KeyD')) x += 1;
        if (this.isHeld('ArrowUp') || this.isHeld('KeyW')) y -= 1;
        if (this.isHeld('ArrowDown') || this.isHeld('KeyS')) y += 1;

        if (this.joystick.active && this.joystick.distance > 0.1) {
            x = this.joystick.dx;
            y = this.joystick.dy;
        }

        const len = Math.sqrt(x * x + y * y);
        if (len > 1) {
            x /= len;
            y /= len;
        }

        return { x, y };
    }

        isActionPressed() {
        return this.isPressed('Space') || this.isPressed('KeyJ') || this.actionTouch;
    }

        endFrame() {
        this._pressed.clear();
        this._released.clear();
        this.pointerClicked = false;
        this.actionTouch = false;
        
        const btn = document.getElementById('attackBtn');
        if (btn && this._actionTouchId === null) {
            btn.style.transform = 'scale(1)';
        }
    }

        _bindEvents() {
        
        window.addEventListener('keydown', (e) => {
            if (!this._held.has(e.code)) {
                this._pressed.add(e.code);
            }
            this._held.add(e.code);

            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(e.code)) {
                e.preventDefault();
            }
        });

        window.addEventListener('keyup', (e) => {
            this._held.delete(e.code);
            this._released.add(e.code);
        });

        this.canvas.addEventListener('mousedown', (e) => {
            this.pointerDown = true;
            this.pointerClicked = true;
            this._updatePointer(e);
        });

        this.canvas.addEventListener('mousemove', (e) => {
            this._updatePointer(e);
        });

        window.addEventListener('mouseup', () => {
            this.pointerDown = false;
        });

        window.addEventListener('touchstart', (e) => {
            if (e.target.tagName !== 'BUTTON') e.preventDefault();
            this._handleTouchStart(e);
        }, { passive: false });

        window.addEventListener('touchmove', (e) => {
            if (e.target.tagName !== 'BUTTON') e.preventDefault();
            this._handleTouchMove(e);
        }, { passive: false });

        window.addEventListener('touchend', (e) => {
            if (e.target.tagName !== 'BUTTON') e.preventDefault();
            this._handleTouchEnd(e);
        }, { passive: false });

        window.addEventListener('touchcancel', (e) => {
            this._handleTouchEnd(e);
        });

        window.addEventListener('contextmenu', (e) => e.preventDefault());
    }

        _updatePointer(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;
        this.pointer.x = (e.clientX - rect.left) * scaleX;
        this.pointer.y = (e.clientY - rect.top) * scaleY;
    }

        _handleTouchStart(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        for (const touch of e.changedTouches) {
            const x = (touch.clientX - rect.left) * scaleX;
            const y = (touch.clientY - rect.top) * scaleY;

            if (x < this.canvas.width * 0.5) {
                
                this.joystick.active = true;
                this.joystick.touchId = touch.identifier;
                this.joystick.startX = x;
                this.joystick.startY = y;
                this.joystick.currentX = x;
                this.joystick.currentY = y;
                this.joystick.dx = 0;
                this.joystick.dy = 0;
                this.joystick.distance = 0;
                
                const stick = document.getElementById('joystickStick');
                if (stick) stick.style.transform = `translate(0px, 0px)`;
            } else {
                
                this.actionTouch = true;
                this._actionTouchId = touch.identifier;
                
                const btn = document.getElementById('attackBtn');
                if (btn) btn.style.transform = 'scale(0.9)';
            }

            this.pointer.x = x;
            this.pointer.y = y;
            this.pointerDown = true;
            this.pointerClicked = true;
        }
    }

        _handleTouchMove(e) {
        const rect = this.canvas.getBoundingClientRect();
        const scaleX = this.canvas.width / rect.width;
        const scaleY = this.canvas.height / rect.height;

        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystick.touchId) {
                const x = (touch.clientX - rect.left) * scaleX;
                const y = (touch.clientY - rect.top) * scaleY;
                this.joystick.currentX = x;
                this.joystick.currentY = y;

                let dx = x - this.joystick.startX;
                let dy = y - this.joystick.startY;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist > Input.JOYSTICK_DEAD_ZONE) {
                    const clampedDist = Math.min(dist, Input.JOYSTICK_MAX_DIST);
                    this.joystick.dx = (dx / dist) * (clampedDist / Input.JOYSTICK_MAX_DIST);
                    this.joystick.dy = (dy / dist) * (clampedDist / Input.JOYSTICK_MAX_DIST);
                    this.joystick.distance = clampedDist / Input.JOYSTICK_MAX_DIST;
                } else {
                    this.joystick.dx = 0;
                    this.joystick.dy = 0;
                    this.joystick.distance = 0;
                }
                
                const stick = document.getElementById('joystickStick');
                if (stick) {
                    stick.style.transform = `translate(${this.joystick.dx * 30}px, ${this.joystick.dy * 30}px)`;
                }
            }

            this.pointer.x = (touch.clientX - rect.left) * scaleX;
            this.pointer.y = (touch.clientY - rect.top) * scaleY;
        }
    }

        _handleTouchEnd(e) {
        for (const touch of e.changedTouches) {
            if (touch.identifier === this.joystick.touchId) {
                this.joystick.active = false;
                this.joystick.dx = 0;
                this.joystick.dy = 0;
                this.joystick.distance = 0;
                this.joystick.touchId = null;
                
                const stick = document.getElementById('joystickStick');
                if (stick) stick.style.transform = `translate(0px, 0px)`;
            }
            if (touch.identifier === this._actionTouchId) {
                this._actionTouchId = null;
                const btn = document.getElementById('attackBtn');
                if (btn) btn.style.transform = 'scale(1)';
            }
        }

        if (e.touches.length === 0) {
            this.pointerDown = false;
        }
    }

        destroy() {
        console.log('[Input] Destroyed');
    }

    showControls() {
        const touchControls = document.getElementById('touchControls');
        if (this.isTouchDevice && touchControls) {
            touchControls.classList.remove('hidden');
        }
    }

    hideControls() {
        const touchControls = document.getElementById('touchControls');
        if (touchControls) {
            touchControls.classList.add('hidden');
        }
    }
}
