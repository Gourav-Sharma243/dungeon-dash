import { Router } from 'express';

export function createLeaderboardRouter(db) {
    const router = Router();

    const stmts = {
        getTopScores: db.prepare(`
            SELECT name, score, level, kills, gold, created_at
            FROM scores
            WHERE is_daily = 0
            ORDER BY score DESC
            LIMIT ?
        `),

        getDailyScores: db.prepare(`
            SELECT name, score, level, kills, gold, created_at
            FROM scores
            WHERE is_daily = 1 AND daily_date = ?
            ORDER BY score DESC
            LIMIT ?
        `),

        insertScore: db.prepare(`
            INSERT INTO scores (name, score, level, kills, gold, is_daily, daily_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        `)
    };

        router.get('/leaderboard', (req, res) => {
        try {
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);
            const scores = stmts.getTopScores.all(limit);
            res.json(scores);
        } catch (err) {
            console.error('[Leaderboard] GET error:', err.message);
            res.status(500).json({ error: 'Failed to fetch leaderboard' });
        }
    });

        router.get('/leaderboard/daily', (req, res) => {
        try {
            const date = req.query.date || new Date().toISOString().split('T')[0];
            const limit = Math.min(parseInt(req.query.limit) || 50, 100);
            const scores = stmts.getDailyScores.all(date, limit);
            res.json(scores);
        } catch (err) {
            console.error('[Leaderboard] GET daily error:', err.message);
            res.status(500).json({ error: 'Failed to fetch daily leaderboard' });
        }
    });

        router.post('/scores', (req, res) => {
        try {
            const { name, score, level, kills, gold, isDaily } = req.body;

            if (typeof score !== 'number' || score < 0) {
                return res.status(400).json({ error: 'Invalid score' });
            }

            const playerName = (name || 'Player').slice(0, 20); 
            const dailyDate = isDaily ? new Date().toISOString().split('T')[0] : null;

            const result = stmts.insertScore.run(
                playerName,
                Math.floor(score),
                level || 1,
                kills || 0,
                gold || 0,
                isDaily ? 1 : 0,
                dailyDate
            );

            console.log(`[Leaderboard] New score: ${playerName} — ${score} (Level ${level})`);

            res.status(201).json({
                id: result.lastInsertRowid,
                message: 'Score submitted successfully'
            });
        } catch (err) {
            console.error('[Leaderboard] POST error:', err.message);
            res.status(500).json({ error: 'Failed to submit score' });
        }
    });

    return router;
}
