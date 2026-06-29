export class Position {
        constructor(x = 0, y = 0) {
        this.x = x;
        this.y = y;
    }
}

export class Velocity {
        constructor(vx = 0, vy = 0) {
        this.vx = vx;
        this.vy = vy;
    }
}

export class Sprite {
        constructor(width, height, color, options = {}) {
        this.width = width;
        this.height = height;
        this.color = color;
        this.borderColor = options.borderColor || null;
        this.eyeColor = options.eyeColor || '#fff';
        this.hasEyes = options.hasEyes || false;
        this.layer = options.layer || 0;

                this.animTimer = 0;

                this.flashing = false;

                this.flashTimer = 0;

                this.facing = 1;

                this.alpha = 1;

                this.shadow = options.shadow || false;
    }
}

export class Health {
        constructor(max = 100) {
                this.current = max;

                this.max = max;

                this.invincibleTimer = 0;

                this.showBar = true;
    }

        get alive() {
        return this.current > 0;
    }

        get ratio() {
        return this.current / this.max;
    }
}

export class Collider {
        constructor(width, height, offsetX = 0, offsetY = 0) {
        this.width = width;
        this.height = height;
        this.offsetX = offsetX;
        this.offsetY = offsetY;

                this.solid = true;

                this.trigger = false;
    }
}

export class PlayerController {
        constructor(speed = 150) {
                this.speed = speed;

                this.attackCooldown = 0;

                this.attackRate = 0.35;

                this.attackDamage = 25;

                this.attackRange = 40;

                this.gold = 0;

                this.kills = 0;

                this.level = 1;

                this.score = 0;

                this.stepTimer = 0;

                this.attacking = false;

                this.attackAnimTimer = 0;

                this.lastDir = { x: 0, y: 1 };
    }
}

export class EnemyAI {
        constructor(config = {}) {
                this.speed = config.speed || 60;

                this.damage = config.damage || 10;

                this.detectRange = config.detectRange || 150;

                this.attackRange = config.attackRange || 30;

                this.scoreValue = config.scoreValue || 10;

                this.behavior = config.behavior || 'chase';

                this.state = 'idle'; 

                this.stateTimer = 0;

                this.attackCooldown = 0;

                this.attackRate = config.attackRate || 1.0;

                this.patrolDir = 1;

                this.patrolTimer = 0;

                this.knockbackVx = 0;

                this.knockbackVy = 0;

                this.knockbackTimer = 0;
    }
}

export class Pickup {
        constructor(type = 'gold', value = 1) {
                this.type = type;

                this.value = value;

                this.bobOffset = Math.random() * Math.PI * 2;

                this.collected = false;
    }
}

export class Weapon {
        constructor(config = {}) {
        this.name = config.name || 'Sword';
        this.damage = config.damage || 25;
        this.range = config.range || 40;
        this.knockback = config.knockback || 100;
        this.color = config.color || '#ccc';

                this.swingProgress = 0;

                this.swinging = false;
    }
}

export class MinimapMarker {
        constructor(color, size = 2) {
        this.color = color;
        this.size = size;
    }
}
