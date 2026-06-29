import express from 'express';
import { createServer } from 'http';
import { Server as SocketIO } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

import { initDatabase } from './db/database.js';
import { createLeaderboardRouter } from './routes/leaderboard.js';
import { createPlayersRouter } from './routes/players.js';
import { createDailyRouter } from './routes/daily.js';
import { setupRealtimeEvents } from './socket/realtime.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = process.env.PORT || 3000;
const CLIENT_PATH = path.join(__dirname, '..', '..', 'client');

const db = initDatabase();
console.log('[Server] Database initialized');

const app = express();
const httpServer = createServer(app);

app.use(cors());
app.use(express.json());

app.use((req, res, next) => {
    if (req.path.startsWith('/api/')) {
        console.log(`[API] ${req.method} ${req.path}`);
    }
    next();
});

app.use('/api', createLeaderboardRouter(db));
app.use('/api', createPlayersRouter(db));
app.use('/api', createDailyRouter(db));

app.get('/api/health', (req, res) => {
    res.json({
        status: 'ok',
        uptime: process.uptime(),
        timestamp: new Date().toISOString()
    });
});

app.use(express.static(CLIENT_PATH));

app.get('*', (req, res) => {
    res.sendFile(path.join(CLIENT_PATH, 'index.html'));
});

const io = new SocketIO(httpServer, {
    cors: { origin: '*', methods: ['GET', 'POST'] }
});
setupRealtimeEvents(io, db);

httpServer.listen(PORT, () => {
    console.log('╔══════════════════════════════════════╗');
    console.log(`║  Dungeon Dash Server running         ║`);
    console.log(`║  http://localhost:${PORT}              ║`);
    console.log('╚══════════════════════════════════════╝');
});

process.on('SIGINT', () => {
    console.log('\n[Server] Shutting down...');
    db.close();
    httpServer.close();
    process.exit(0);
});
