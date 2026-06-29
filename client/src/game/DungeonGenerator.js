class BSPNode {
        constructor(x, y, w, h) {
        this.x = x;
        this.y = y;
        this.w = w;
        this.h = h;
                this.left = null;
                this.right = null;
                this.room = null;
    }

        get isLeaf() {
        return !this.left && !this.right;
    }
}

class SeededRandom {
        constructor(seed) {
        this.seed = seed;
    }

        next() {
        this.seed = (this.seed * 1664525 + 1013904223) & 0xffffffff;
        return (this.seed >>> 0) / 0xffffffff;
    }

        nextInt(min, max) {
        return Math.floor(this.next() * (max - min + 1)) + min;
    }

        nextBool(chance = 0.5) {
        return this.next() < chance;
    }
}

export class DungeonGenerator {
        static MIN_ROOM_SIZE = 4;

        static MIN_LEAF_SIZE = 8;

        static generate(config = {}) {
        const {
            width = 50,
            height = 40,
            level = 1,
            seed = Date.now()
        } = config;

        const rng = new SeededRandom(seed);

        const tileMap = [];
        for (let y = 0; y < height; y++) {
            tileMap[y] = new Array(width).fill(1);
        }

        const root = new BSPNode(1, 1, width - 2, height - 2);
        DungeonGenerator._splitNode(root, rng);

        const rooms = [];
        DungeonGenerator._createRooms(root, tileMap, rooms, rng);

        DungeonGenerator._connectRooms(root, tileMap, rng);

        const playerSpawn = {
            x: rooms[0].centerX,
            y: rooms[0].centerY
        };

        const lastRoom = rooms[rooms.length - 1];
        const exitPos = {
            x: lastRoom.centerX,
            y: lastRoom.centerY
        };

        const enemies = DungeonGenerator._placeEnemies(rooms, playerSpawn, level, rng);

        const pickups = DungeonGenerator._placePickups(rooms, playerSpawn, exitPos, level, rng);

        return {
            tileMap,
            rooms,
            playerSpawn,
            exitPos,
            enemies,
            pickups,
            width,
            height
        };
    }

        static _splitNode(node, rng) {
        if (node.w < DungeonGenerator.MIN_LEAF_SIZE * 2 &&
            node.h < DungeonGenerator.MIN_LEAF_SIZE * 2) {
            return; 
        }

        let splitH;
        if (node.w > node.h * 1.25) {
            splitH = false; 
        } else if (node.h > node.w * 1.25) {
            splitH = true;  
        } else {
            splitH = rng.nextBool(); 
        }

        if (splitH) {
            if (node.h < DungeonGenerator.MIN_LEAF_SIZE * 2) return;
            const split = rng.nextInt(
                DungeonGenerator.MIN_LEAF_SIZE,
                node.h - DungeonGenerator.MIN_LEAF_SIZE
            );
            node.left = new BSPNode(node.x, node.y, node.w, split);
            node.right = new BSPNode(node.x, node.y + split, node.w, node.h - split);
        } else {
            if (node.w < DungeonGenerator.MIN_LEAF_SIZE * 2) return;
            const split = rng.nextInt(
                DungeonGenerator.MIN_LEAF_SIZE,
                node.w - DungeonGenerator.MIN_LEAF_SIZE
            );
            node.left = new BSPNode(node.x, node.y, split, node.h);
            node.right = new BSPNode(node.x + split, node.y, node.w - split, node.h);
        }

        DungeonGenerator._splitNode(node.left, rng);
        DungeonGenerator._splitNode(node.right, rng);
    }

        static _createRooms(node, tileMap, rooms, rng) {
        if (node.isLeaf) {
            
            const roomW = rng.nextInt(
                DungeonGenerator.MIN_ROOM_SIZE,
                Math.max(DungeonGenerator.MIN_ROOM_SIZE, node.w - 2)
            );
            const roomH = rng.nextInt(
                DungeonGenerator.MIN_ROOM_SIZE,
                Math.max(DungeonGenerator.MIN_ROOM_SIZE, node.h - 2)
            );
            const roomX = node.x + rng.nextInt(1, Math.max(1, node.w - roomW - 1));
            const roomY = node.y + rng.nextInt(1, Math.max(1, node.h - roomH - 1));

            const room = {
                x: roomX,
                y: roomY,
                width: roomW,
                height: roomH,
                centerX: Math.floor(roomX + roomW / 2),
                centerY: Math.floor(roomY + roomH / 2)
            };

            for (let y = roomY; y < roomY + roomH; y++) {
                for (let x = roomX; x < roomX + roomW; x++) {
                    if (y >= 0 && y < tileMap.length && x >= 0 && x < tileMap[0].length) {
                        tileMap[y][x] = 0; 
                    }
                }
            }

            node.room = room;
            rooms.push(room);
        } else {
            if (node.left) DungeonGenerator._createRooms(node.left, tileMap, rooms, rng);
            if (node.right) DungeonGenerator._createRooms(node.right, tileMap, rooms, rng);
        }
    }

        static _connectRooms(node, tileMap, rng) {
        if (!node.left || !node.right) return;

        DungeonGenerator._connectRooms(node.left, tileMap, rng);
        DungeonGenerator._connectRooms(node.right, tileMap, rng);

        const leftRoom = DungeonGenerator._getRandomRoom(node.left, rng);
        const rightRoom = DungeonGenerator._getRandomRoom(node.right, rng);

        if (leftRoom && rightRoom) {
            DungeonGenerator._carveCorridor(
                leftRoom.centerX, leftRoom.centerY,
                rightRoom.centerX, rightRoom.centerY,
                tileMap, rng
            );
        }
    }

        static _getRandomRoom(node, rng) {
        if (node.room) return node.room;
        if (node.left && node.right) {
            return rng.nextBool()
                ? DungeonGenerator._getRandomRoom(node.left, rng)
                : DungeonGenerator._getRandomRoom(node.right, rng);
        }
        if (node.left) return DungeonGenerator._getRandomRoom(node.left, rng);
        if (node.right) return DungeonGenerator._getRandomRoom(node.right, rng);
        return null;
    }

        static _carveCorridor(x1, y1, x2, y2, tileMap, rng) {
        
        if (rng.nextBool()) {
            DungeonGenerator._carveHorizontal(x1, x2, y1, tileMap);
            DungeonGenerator._carveVertical(y1, y2, x2, tileMap);
        } else {
            DungeonGenerator._carveVertical(y1, y2, x1, tileMap);
            DungeonGenerator._carveHorizontal(x1, x2, y2, tileMap);
        }
    }

        static _carveHorizontal(x1, x2, y, tileMap) {
        const start = Math.min(x1, x2);
        const end = Math.max(x1, x2);
        for (let x = start; x <= end; x++) {
            if (y >= 0 && y < tileMap.length && x >= 0 && x < tileMap[0].length) {
                tileMap[y][x] = 0;
                
                if (y + 1 < tileMap.length) tileMap[y + 1][x] = 0;
            }
        }
    }

        static _carveVertical(y1, y2, x, tileMap) {
        const start = Math.min(y1, y2);
        const end = Math.max(y1, y2);
        for (let y = start; y <= end; y++) {
            if (y >= 0 && y < tileMap.length && x >= 0 && x < tileMap[0].length) {
                tileMap[y][x] = 0;
                
                if (x + 1 < tileMap[0].length) tileMap[y][x + 1] = 0;
            }
        }
    }

        static _placeEnemies(rooms, playerSpawn, level, rng) {
        const enemies = [];
        const enemyTypes = [
            { type: 'slime', minLevel: 1 },
            { type: 'skeleton', minLevel: 1 },
            { type: 'bat', minLevel: 2 },
            { type: 'goblin', minLevel: 3 },
            { type: 'demon', minLevel: 4 },
        ];

        const available = enemyTypes.filter(e => e.minLevel <= level);

        for (let i = 1; i < rooms.length; i++) { 
            const room = rooms[i];
            const enemyCount = rng.nextInt(1, Math.min(2 + level, 5));

            for (let j = 0; j < enemyCount; j++) {
                const type = available[rng.nextInt(0, available.length - 1)].type;
                const ex = rng.nextInt(room.x + 1, room.x + room.width - 2);
                const ey = rng.nextInt(room.y + 1, room.y + room.height - 2);

                const dx = ex - playerSpawn.x;
                const dy = ey - playerSpawn.y;
                if (Math.sqrt(dx * dx + dy * dy) > 5) {
                    enemies.push({ x: ex, y: ey, type });
                }
            }
        }

        return enemies;
    }

        static _placePickups(rooms, playerSpawn, exitPos, level, rng) {
        const pickups = [];

        for (let i = 1; i < rooms.length; i++) {
            const room = rooms[i];

            const goldCount = rng.nextInt(0, 3);
            for (let j = 0; j < goldCount; j++) {
                pickups.push({
                    x: rng.nextInt(room.x + 1, room.x + room.width - 2),
                    y: rng.nextInt(room.y + 1, room.y + room.height - 2),
                    type: 'gold',
                    value: rng.nextInt(1, 5) * level
                });
            }

            if (rng.nextBool(0.3)) {
                pickups.push({
                    x: rng.nextInt(room.x + 1, room.x + room.width - 2),
                    y: rng.nextInt(room.y + 1, room.y + room.height - 2),
                    type: 'health',
                    value: 20 + level * 5
                });
            }
        }

        return pickups;
    }
}
