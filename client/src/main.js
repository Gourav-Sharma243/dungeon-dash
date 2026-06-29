import { Engine } from './engine/Engine.js';
import { SceneManager } from './engine/SceneManager.js';
import { Input } from './engine/Input.js';
import { Audio } from './engine/Audio.js';
import { MenuScene } from './game/scenes/MenuScene.js';

(function bootstrap() {
    console.log('╔══════════════════════════════════════╗');
    console.log('║        DUNGEON DASH v1.0.0           ║');
    console.log('║  Custom HTML5 Game Engine + ECS      ║');
    console.log('╚══════════════════════════════════════╝');

    const canvas = document.getElementById('game');
    const loadingScreen = document.getElementById('loading');
    const gameContainer = document.getElementById('gameContainer');
    const loadingBar = document.getElementById('loadingBar');
    const loadingText = document.getElementById('loadingText');

    if (!canvas) {
        console.error('[Main] Canvas element #game not found!');
        return;
    }

    updateLoading(30, 'Creating engine...');
    const engine = new Engine(canvas);

    updateLoading(50, 'Initializing input system...');
    const input = new Input(canvas);

    updateLoading(60, 'Initializing audio...');
    const audio = new Audio();

    updateLoading(70, 'Setting up scene manager...');
    const sceneManager = new SceneManager();

    const context = {
        engine,
        sceneManager,
        input,
        audio,
        
        _menuSceneModule: { MenuScene }
    };

    function resize() {
        const maxSize = 800;
        const padding = 20;
        const available = Math.min(
            window.innerWidth - padding,
            window.innerHeight - padding,
            maxSize
        );
        const size = Math.floor(available);

        engine.resize(size, size);

        canvas.style.width = size + 'px';
        canvas.style.height = size + 'px';
    }

    window.addEventListener('resize', resize);
    resize();

    const touchControls = document.getElementById('touchControls');
    if (input.isTouchDevice && touchControls) {
        touchControls.classList.remove('hidden');
    }

    const fullscreenBtn = document.getElementById('fullscreenBtn');
    if (fullscreenBtn) {
        fullscreenBtn.addEventListener('click', () => {
            if (!document.fullscreenElement) {
                document.documentElement.requestFullscreen().catch(() => {});
            } else {
                document.exitFullscreen().catch(() => {});
            }
        });
    }

    engine.onUpdate = (dt) => sceneManager.update(dt);
    engine.onRender = (ctx) => sceneManager.render(ctx);

    updateLoading(90, 'Loading complete!');

    setTimeout(() => {
        
        loadingScreen.classList.add('hidden');
        gameContainer.classList.remove('hidden');

        sceneManager.push(new MenuScene(context));

        // Add CI/CD test log
        console.log('[App] Initialized successfully via GitHub Actions pipeline');

        // Run first frame
        engine.start();

        console.log('[Main] Game started successfully');
    }, 500);

        function updateLoading(percent, text) {
        if (loadingBar) loadingBar.style.width = percent + '%';
        if (loadingText) loadingText.textContent = text;
    }

    if ('serviceWorker' in navigator) {
        window.addEventListener('load', () => {
            navigator.serviceWorker.register('./sw.js')
                .then(reg => console.log('[SW] Registered:', reg.scope))
                .catch(err => console.log('[SW] Registration failed (OK for dev):', err.message));
        });
    }
})();
