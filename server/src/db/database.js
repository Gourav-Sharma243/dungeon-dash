import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function initDatabase(dbPath) {
    const defaultPath = path.join(__dirname, '..', '..', 'data', 'dungeon-dash.db');
    const db = new Database(dbPath || defaultPath);

    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    migrate(db);

    return db;
}

function migrate(db) {
    db.exec(`
        -- Players table
        CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL DEFAULT 'Anonymous',
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            games_played INTEGER DEFAULT 0,
            best_score INTEGER DEFAULT 0,
            best_level INTEGER DEFAULT 0,
            total_kills INTEGER DEFAULT 0,
            total_gold INTEGER DEFAULT 0
        );

        -- Scores table (leaderboard)
        CREATE TABLE IF NOT EXISTS scores (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            player_id INTEGER,
            name TEXT NOT NULL DEFAULT 'Player',
            score INTEGER NOT NULL,
            level INTEGER DEFAULT 1,
            kills INTEGER DEFAULT 0,
            gold INTEGER DEFAULT 0,
            is_daily BOOLEAN DEFAULT 0,
            daily_date TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (player_id) REFERENCES players(id)
        );

        -- Indexes for fast leaderboard queries
        CREATE INDEX IF NOT EXISTS idx_scores_score ON scores(score DESC);
        CREATE INDEX IF NOT EXISTS idx_scores_daily ON scores(is_daily, daily_date, score DESC);
        CREATE INDEX IF NOT EXISTS idx_scores_created ON scores(created_at DESC);

        -- Daily challenges table
        CREATE TABLE IF NOT EXISTS daily_challenges (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            date TEXT UNIQUE NOT NULL,
            seed INTEGER NOT NULL,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        );
    `);

    console.log('[DB] Schema migrations complete');
}
