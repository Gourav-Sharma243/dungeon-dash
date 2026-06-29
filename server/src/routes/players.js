import { Router } from 'express';

export function createPlayersRouter(db) {
    const router = Router();

    const stmts = {
        createPlayer: db.prepare(`
            INSERT INTO players (name) VALUES (?)
        `),

        getPlayer: db.prepare(`
            SELECT * FROM players WHERE id = ?
        `),

        getPlayerStats: db.prepare(`
            SELECT
                p.*,
                COUNT(s.id) as total_games,
                MAX(s.score) as high_score,
                MAX(s.level) as max_level,
                SUM(s.kills) as lifetime_kills,
                SUM(s.gold) as lifetime_gold
            FROM players p
            LEFT JOIN scores s ON s.player_id = p.id
            WHERE p.id = ?
            GROUP BY p.id
        `),

        updatePlayerStats: db.prepare(`
            UPDATE players
            SET games_played = games_played + 1,
                best_score = MAX(best_score, ?),
                best_level = MAX(best_level, ?),
                total_kills = total_kills + ?,
                total_gold = total_gold + ?
            WHERE id = ?
        `)
    };

        router.post('/players', (req, res) => {
        try {
            const { name } = req.body;
            const playerName = (name || 'Anonymous').slice(0, 20);

            const result = stmts.createPlayer.run(playerName);

            res.status(201).json({
                id: result.lastInsertRowid,
                name: playerName,
                message: 'Player created'
            });
        } catch (err) {
            console.error('[Players] POST error:', err.message);
            res.status(500).json({ error: 'Failed to create player' });
        }
    });

        router.get('/players/:id/stats', (req, res) => {
        try {
            const { id } = req.params;
            const stats = stmts.getPlayerStats.get(parseInt(id));

            if (!stats) {
                return res.status(404).json({ error: 'Player not found' });
            }

            res.json(stats);
        } catch (err) {
            console.error('[Players] GET stats error:', err.message);
            res.status(500).json({ error: 'Failed to fetch player stats' });
        }
    });

    return router;
}
