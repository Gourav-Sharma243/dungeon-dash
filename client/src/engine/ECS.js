let nextEntityId = 0;

export class Entity {
    constructor() {
                this.id = nextEntityId++;

                this.components = new Map();

                this.active = true;

                this.tags = new Set();
    }

        addComponent(component) {
        this.components.set(component.constructor.name, component);
        return this;
    }

        getComponent(ComponentClass) {
        return this.components.get(ComponentClass.name);
    }

        hasComponent(ComponentClass) {
        return this.components.has(ComponentClass.name);
    }

        removeComponent(ComponentClass) {
        this.components.delete(ComponentClass.name);
        return this;
    }

        addTag(tag) {
        this.tags.add(tag);
        return this;
    }

        hasTag(tag) {
        return this.tags.has(tag);
    }

        removeTag(tag) {
        this.tags.delete(tag);
        return this;
    }

        destroy() {
        this.active = false;
    }
}

export class System {
        constructor(requiredComponents = []) {
                this.requiredComponents = requiredComponents;

                this.world = null;

                this.enabled = true;
    }

        matchesEntity(entity) {
        return this.requiredComponents.every(C => entity.hasComponent(C));
    }

        getEntities() {
        if (!this.world) return [];
        return this.world.entities.filter(e => e.active && this.matchesEntity(e));
    }

        init() {}

        update(dt) {}

        render(ctx) {}
}

export class World {
    constructor() {
                this.entities = [];

                this.systems = [];

                this._removalQueue = [];

                this._addQueue = [];
    }

        addEntity(entity) {
        this._addQueue.push(entity);
        return entity;
    }

        removeEntity(entity) {
        entity.active = false;
        this._removalQueue.push(entity);
    }

        addSystem(system) {
        system.world = this;
        this.systems.push(system);
        system.init();
        return this;
    }

        getEntitiesByTag(tag) {
        return this.entities.filter(e => e.active && e.hasTag(tag));
    }

        getEntityByTag(tag) {
        return this.entities.find(e => e.active && e.hasTag(tag));
    }

        update(dt) {
        
        if (this._addQueue.length > 0) {
            this.entities.push(...this._addQueue);
            this._addQueue = [];
        }

        if (this._removalQueue.length > 0) {
            for (const entity of this._removalQueue) {
                const idx = this.entities.indexOf(entity);
                if (idx !== -1) this.entities.splice(idx, 1);
            }
            this._removalQueue = [];
        }

        for (const system of this.systems) {
            if (system.enabled) {
                system.update(dt);
            }
        }
    }

        render(ctx) {
        for (const system of this.systems) {
            if (system.enabled) {
                system.render(ctx);
            }
        }
    }

        clear() {
        this.entities = [];
        this._addQueue = [];
        this._removalQueue = [];
    }

        get entityCount() {
        return this.entities.filter(e => e.active).length;
    }
}
