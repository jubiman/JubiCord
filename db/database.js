require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();

class Database {
    constructor() {
        this.db = new sqlite3.Database('config.db'); // Create or open the database
        this.db.serialize(() => {
            this.db.run(`
                CREATE TABLE IF NOT EXISTS config
                (
                    guildId   TEXT PRIMARY KEY,
                    channelId TEXT
                )`);
            this.db.run(`
                CREATE TABLE IF NOT EXISTS identifiers
                (
                    id      TEXT PRIMARY KEY,
                    guildId TEXT,
                    FOREIGN KEY (guildId) REFERENCES config (guildId)
                )`);
            this.db.run(`
                CREATE TABLE IF NOT EXISTS superusers
                (
                    guildId TEXT NOT NULL,
                    userId  TEXT NOT NULL,
                    PRIMARY KEY (guildId, userId)
                )`);
        });
    }

    async getChannelId(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT channelId FROM config WHERE guildId = ?', [guildId], (err, row) => {
                if (err) reject(err);
                resolve(row ? row.channelId : null);
            });
        });
    }

    async setChannelId(guildId, channelId) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT OR REPLACE INTO config (guildId, channelId) VALUES (?, ?)', [guildId, channelId], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    async getIdentifier(guildId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT id FROM identifiers WHERE guildId = ?', [guildId], (err, row) => {
                if (err) reject(err);
                resolve(row ? row.id : null);
            });
        });
    }

    async addIdentifier(guildId, id) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT INTO identifiers (id, guildId) VALUES (?, ?)', [id, guildId], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    async removeIdentifier(guildId, id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM identifiers WHERE guildId = ? AND id = ?', [guildId, id], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    async isSuperuser(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT 1 FROM superusers WHERE guildId = ? AND userId = ?', [guildId, userId], (err, row) => {
                if (err) reject(err);
                resolve(!!row);
            });
        });
    }

    async addSuperuser(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run('INSERT OR REPLACE INTO superusers (guildId, userId) VALUES (?, ?)', [guildId, userId], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }

    async removeSuperuser(guildId, userId) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM superusers WHERE guildId = ? AND userId = ?', [guildId, userId], (err) => {
                if (err) reject(err);
                resolve();
            });
        });
    }
    
    async getSuperusers(guildId) {
        return new Promise((resolve, reject) => {
            this.db.all('SELECT userId FROM superusers WHERE guildId = ?', [guildId], (err, rows) => {
                if (err) reject(err);
                resolve(rows.map(row => row.userId));
            });
        });
    }

    close() {
        this.db.close();
    }

    run(sql, params, callback) {
        this.db.run(sql, params, callback);
    }

    get(sql, params, callback) {
        this.db.get(sql, params, callback);
    }
}

module.exports = Database;