const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
 
const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
}
 
const DB_PATH = path.join(dataDir, 'crm.db');
const db = new Database(DB_PATH);
 
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
 
db.exec(`
    CREATE TABLE IF NOT EXISTS leads (
        id            INTEGER PRIMARY KEY AUTOINCREMENT,
        phone         TEXT UNIQUE NOT NULL,
        name          TEXT DEFAULT '',
        email         TEXT DEFAULT '',
        age           TEXT DEFAULT '',
        program_interest TEXT DEFAULT '',
        schedule_pref TEXT DEFAULT '',
        stage         TEXT DEFAULT 'NUEVO',
        classification TEXT DEFAULT 'FRIO',
        source        TEXT DEFAULT 'WHATSAPP',
        notes         TEXT DEFAULT '',
        total_interactions INTEGER DEFAULT 0,
        created_at    TEXT DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime')),
        last_contact  TEXT DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime'))
    );
 
    CREATE TABLE IF NOT EXISTS interactions (
        id         INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_phone TEXT NOT NULL,
        direction  TEXT NOT NULL,
        message    TEXT DEFAULT '',
        created_at TEXT DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime')),
        FOREIGN KEY (lead_phone) REFERENCES leads(phone)
    );
 
    CREATE TABLE IF NOT EXISTS appointments (
        id           INTEGER PRIMARY KEY AUTOINCREMENT,
        lead_phone   TEXT NOT NULL,
        name         TEXT DEFAULT '',
        email        TEXT DEFAULT '',
        age          TEXT DEFAULT '',
        program      TEXT DEFAULT '',
        schedule     TEXT DEFAULT '',
        observations TEXT DEFAULT '',
        status       TEXT DEFAULT 'PENDIENTE',
        created_at   TEXT DEFAULT (strftime('%d/%m/%Y %H:%M', 'now', 'localtime')),
        FOREIGN KEY (lead_phone) REFERENCES leads(phone)
    );
`);
 
console.log('✅ Base de datos CRM inicializada:', DB_PATH);
 
module.exports = db;