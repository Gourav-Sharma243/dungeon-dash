import { Router } from 'express';

export function createDailyRouter(db) {
    const router = Router();

    const stmts = {
        getDaily: db.prepare(`
            SELECT * FROM daily_challenges WHERE date = ?
        `),

        createDaily: db.prepare(`
            INSERT OR IGNORE INTO daily_challenges (date, seed) VALUES (?, ?)
        `),

        getDailyScoreCount: db.prepare(`
            SELECT COUNT(*) as count FROM scores WHERE is_daily = 1 AND daily_date = ?
        `),

        getDailyTopScore: db.prepare(`
            SELECT MAX(score) as top_score FROM scores WHERE is_daily = 1 AND daily_date = ?
        `)
    };

        router.get('/daily', (req, res) => {
        try {
            const today = req.query.date || new Date().toISOString().split('T')[0];

            const seed = generateDailySeed(today);

            stmts.createDaily.run(today, seed);

            const { count } = stmts.getDailyScoreCount.get(today);
            const { top_score } = stmts.getDailyTopScore.get(today) || { top_score: 0 };

            res.json({
                date: today,
                seed,
                participants: count,
                topScore: top_score || 0,
                message: `Daily challenge for ${today}`
            });
        } catch (err) {
            console.error('[Daily] GET error:', err.message);
            res.status(500).json({ error: 'Failed to get daily challenge' });
        }
    });

    return router;
}

function generateDailySeed(dateStr) {
    const parts = dateStr.split('-');
    const year = parseInt(parts[0]);
    const month = parseInt(parts[1]);
    const day = parseInt(parts[2]);

    let seed = year * 10000 + month * 100 + day;
    seed = ((seed * 1664525) + 1013904223) & 0x7fffffff;

    return seed;
}
