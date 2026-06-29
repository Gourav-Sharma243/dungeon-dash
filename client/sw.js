const CACHE_NAME = 'dungeon-dash-v1';
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles/main.css',
    '/src/main.js',
    '/src/engine/Engine.js',
    '/src/engine/ECS.js',
    '/src/engine/Renderer.js',
    '/src/engine/Input.js',
    '/src/engine/Audio.js',
    '/src/engine/SceneManager.js',
    '/src/game/Components.js',
    '/src/game/Systems.js',
    '/src/game/DungeonGenerator.js',
    '/src/game/scenes/MenuScene.js',
    '/src/game/scenes/GameScene.js',
    '/src/game/scenes/GameOverScene.js',
    '/manifest.json'
];

self.addEventListener('install', (event) => {
    console.log('[SW] Installing...');
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then(cache => {
                console.log('[SW] Caching static assets');
                return cache.addAll(STATIC_ASSETS);
            })
            .then(() => self.skipWaiting())
    );
});

self.addEventListener('activate', (event) => {
    console.log('[SW] Activating...');
    event.waitUntil(
        caches.keys()
            .then(keys => Promise.all(
                keys
                    .filter(key => key !== CACHE_NAME)
                    .map(key => {
                        console.log('[SW] Deleting old cache:', key);
                        return caches.delete(key);
                    })
            ))
            .then(() => self.clients.claim())
    );
});

self.addEventListener('fetch', (event) => {
    const url = new URL(event.request.url);

    if (url.pathname.startsWith('/api/')) {
        event.respondWith(
            fetch(event.request)
                .then(response => {
                    
                    const clone = response.clone();
                    caches.open(CACHE_NAME).then(cache => {
                        cache.put(event.request, clone);
                    });
                    return response;
                })
                .catch(() => caches.match(event.request))
        );
        return;
    }

    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) return cached;

                return fetch(event.request)
                    .then(response => {
                        
                        if (response.status === 200) {
                            const clone = response.clone();
                            caches.open(CACHE_NAME).then(cache => {
                                cache.put(event.request, clone);
                            });
                        }
                        return response;
                    });
            })
    );
});
