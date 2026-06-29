export function setupRealtimeEvents(io, db) {
        let playerCount = 0;

    io.on('connection', (socket) => {
        playerCount++;
        console.log(`[Socket] Player connected (${playerCount} online)`);

        io.emit('playerCount', playerCount);

        socket.on('submitScore', (data) => {
            try {
                const { name, score, level, kills, gold, isDaily } = data;
                const playerName = (name || 'Player').slice(0, 20);
                const dailyDate = isDaily ? new Date().toISOString().split('T')[0] : null;

                const stmt = db.prepare(`
                    INSERT INTO scores (name, score, level, kills, gold, is_daily, daily_date)
                    VALUES (?, ?, ?, ?, ?, ?, ?)
                `);
                stmt.run(playerName, Math.floor(score), level || 1, kills || 0, gold || 0, isDaily ? 1 : 0, dailyDate);

                io.emit('newScore', {
                    name: playerName,
                    score: Math.floor(score),
                    level: level || 1,
                    timestamp: new Date().toISOString()
                });

                console.log(`[Socket] Score broadcast: ${playerName} — ${score}`);

                const topStmt = db.prepare('SELECT MAX(score) as top FROM scores WHERE is_daily = 0');
                const { top } = topStmt.get();
                if (Math.floor(score) >= top) {
                    io.emit('newHighScore', {
                        name: playerName,
                        score: Math.floor(score)
                    });
                }
            } catch (err) {
                console.error('[Socket] submitScore error:', err.message);
                socket.emit('error', { message: 'Failed to submit score' });
            }
        });

        socket.on('requestLeaderboard', (data) => {
            try {
                const limit = Math.min(data?.limit || 10, 50);
                const stmt = db.prepare('SELECT name, score, level, created_at FROM scores WHERE is_daily = 0 ORDER BY score DESC LIMIT ?');
                const scores = stmt.all(limit);
                socket.emit('leaderboard', scores);
            } catch (err) {
                console.error('[Socket] requestLeaderboard error:', err.message);
            }
        });

        socket.on('disconnect', () => {
            playerCount--;
            console.log(`[Socket] Player disconnected (${playerCount} online)`);
            io.emit('playerCount', playerCount);
        });
    });

    console.log('[Socket] Real-time events configured');
}
