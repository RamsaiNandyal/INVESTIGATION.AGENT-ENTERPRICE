// ============================================================
//  INVESTIGATE.AGENT — Database Module
//  Tries PostgreSQL first; auto-falls back to SQLite if not available.
// ============================================================
import dotenv from 'dotenv';
import geoip from 'geoip-lite';
import path from 'path';
import { fileURLToPath } from 'url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// ── Choose adapter ──────────────────────────────────────────
// If DATABASE_URL or any PG* env var is set → try PostgreSQL.
// Otherwise fall straight to SQLite.
const wantsPostgres = !!(
  process.env.DATABASE_URL ||
  process.env.PGHOST ||
  process.env.PGUSER ||
  process.env.PGPASSWORD ||
  process.env.PGDATABASE
);

let db;          // the active adapter instance
let usePostgres = false;

// ── PostgreSQL adapter ──────────────────────────────────────
async function tryPostgres() {
  const { default: pg } = await import('pg');

  const pgConfig = process.env.DATABASE_URL
    ? { connectionString: process.env.DATABASE_URL }
    : {
        host:     process.env.PGHOST     || 'localhost',
        user:     process.env.PGUSER     || 'postgres',
        password: process.env.PGPASSWORD || 'postgres',
        database: process.env.PGDATABASE || 'investigate_agent',
        port:     parseInt(process.env.PGPORT || '5432'),
        connectionTimeoutMillis: 3000,   // fail fast
      };

  const pool = new pg.Pool(pgConfig);

  // Probe — will throw if the server is unreachable
  const client = await pool.connect();
  client.release();

  // Wrap pool into our common adapter interface
  return {
    run: (sql, params = []) => pool.query(toPg(sql), params),
    get: async (sql, params = []) => {
      const r = await pool.query(toPg(sql), params);
      return r.rows[0] || null;
    },
    all: async (sql, params = []) => {
      const r = await pool.query(toPg(sql), params);
      return r.rows || [];
    },
    pool,
  };
}

// Convert SQLite-style SQL (? placeholders) to PostgreSQL ($1, $2…)
function toPg(sql) {
  // Keyword translations
  let s = sql
    .replace(/INTEGER PRIMARY KEY AUTOINCREMENT/gi, 'SERIAL PRIMARY KEY')
    .replace(/\bREAL\b/gi, 'DOUBLE PRECISION')
    .replace(/\bDATETIME\b/gi, 'TIMESTAMP')
    .replace(/BOOLEAN DEFAULT 1\b/gi, 'BOOLEAN DEFAULT TRUE')
    .replace(/BOOLEAN DEFAULT 0\b/gi, 'BOOLEAN DEFAULT FALSE')
    .replace(/INSERT OR IGNORE INTO/gi, 'INSERT INTO');

  // ON CONFLICT for known unique columns
  if (/INSERT INTO users\b/i.test(s) && !/ON CONFLICT/i.test(s)) {
    s += ' ON CONFLICT (username) DO NOTHING';
  } else if (/INSERT INTO page_sessions\b/i.test(s) && !/ON CONFLICT/i.test(s)) {
    s += ' ON CONFLICT (session_id) DO NOTHING';
  }

  // Replace ? with $1, $2, …
  let i = 1;
  s = s.replace(/\?/g, () => `$${i++}`);
  return s;
}

// ── SQLite adapter ──────────────────────────────────────────
async function openSQLite() {
  const { default: sqlite3 } = await import('sqlite3');
  const dbPath = path.join(__dirname, 'investigate-agent.db');
  const raw    = new sqlite3.Database(dbPath);

  return {
    run: (sql, params = []) =>
      new Promise((res, rej) =>
        raw.run(sql, params, function (err) {
          if (err) rej(err); else res({ id: this.lastID, changes: this.changes });
        })
      ),
    get: (sql, params = []) =>
      new Promise((res, rej) =>
        raw.get(sql, params, (err, row) => {
          if (err) rej(err); else res(row || null);
        })
      ),
    all: (sql, params = []) =>
      new Promise((res, rej) =>
        raw.all(sql, params, (err, rows) => {
          if (err) rej(err); else res(rows || []);
        })
      ),
    raw,
  };
}

// ── Bootstrap ────────────────────────────────────────────────
// We initialise asynchronously so the server can import this
// module synchronously — every exported function awaits `ready`.
let resolveReady;
const ready = new Promise(r => { resolveReady = r; });

(async () => {
  if (wantsPostgres) {
    try {
      db = await tryPostgres();
      usePostgres = true;
      console.log('✅ Connected to PostgreSQL database');
    } catch (err) {
      console.warn(`⚠️  PostgreSQL unavailable (${err.message}) — falling back to SQLite`);
    }
  }

  if (!usePostgres) {
    db = await openSQLite();
    console.log('✅ Using SQLite database (investigate-agent.db)');
  }

  await initializeDatabase();
  resolveReady();
})();

// ── Schema initialisation ────────────────────────────────────
async function initializeDatabase() {
  // We write the CREATE TABLE in PostgreSQL syntax when using PG,
  // and SQLite-native syntax when using SQLite.
  if (usePostgres) {
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        signup_ip VARCHAR(100),
        signup_location VARCHAR(255),
        signup_country VARCHAR(100),
        signup_city VARCHAR(100),
        signup_latitude DOUBLE PRECISION,
        signup_longitude DOUBLE PRECISION,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS login_history (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        email VARCHAR(255),
        login_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        login_ip VARCHAR(100),
        login_location VARCHAR(255),
        login_country VARCHAR(100),
        login_city VARCHAR(100),
        login_latitude DOUBLE PRECISION,
        login_longitude DOUBLE PRECISION,
        login_status VARCHAR(100) DEFAULT 'success'
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS page_sessions (
        id SERIAL PRIMARY KEY,
        session_id VARCHAR(255) UNIQUE NOT NULL,
        username VARCHAR(255) DEFAULT 'anonymous',
        visit_start TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        visit_end TIMESTAMP,
        duration_seconds INTEGER DEFAULT 0,
        visit_ip VARCHAR(100),
        visit_location VARCHAR(255),
        visit_country VARCHAR(100),
        visit_city VARCHAR(100),
        visit_latitude DOUBLE PRECISION,
        visit_longitude DOUBLE PRECISION,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT TRUE
      )
    `);
  } else {
    // SQLite schemas
    await db.run(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        email TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        signup_ip TEXT,
        signup_location TEXT,
        signup_country TEXT,
        signup_city TEXT,
        signup_latitude REAL,
        signup_longitude REAL,
        is_active BOOLEAN DEFAULT 1
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS login_history (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT NOT NULL,
        email TEXT,
        login_time DATETIME DEFAULT CURRENT_TIMESTAMP,
        login_ip TEXT,
        login_location TEXT,
        login_country TEXT,
        login_city TEXT,
        login_latitude REAL,
        login_longitude REAL,
        login_status TEXT DEFAULT 'success'
      )
    `);
    await db.run(`
      CREATE TABLE IF NOT EXISTS page_sessions (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        session_id TEXT UNIQUE NOT NULL,
        username TEXT DEFAULT 'anonymous',
        visit_start DATETIME DEFAULT CURRENT_TIMESTAMP,
        visit_end DATETIME,
        duration_seconds INTEGER DEFAULT 0,
        visit_ip TEXT,
        visit_location TEXT,
        visit_country TEXT,
        visit_city TEXT,
        visit_latitude REAL,
        visit_longitude REAL,
        user_agent TEXT,
        is_active BOOLEAN DEFAULT 1
      )
    `);
  }

  // Indexes (same syntax for both engines)
  const indexes = [
    'CREATE INDEX IF NOT EXISTS idx_username        ON users(username)',
    'CREATE INDEX IF NOT EXISTS idx_email           ON users(email)',
    'CREATE INDEX IF NOT EXISTS idx_login_username  ON login_history(username)',
    'CREATE INDEX IF NOT EXISTS idx_login_time      ON login_history(login_time)',
    'CREATE INDEX IF NOT EXISTS idx_session_id      ON page_sessions(session_id)',
    'CREATE INDEX IF NOT EXISTS idx_session_user    ON page_sessions(username)',
    'CREATE INDEX IF NOT EXISTS idx_session_start   ON page_sessions(visit_start)',
  ];
  for (const sql of indexes) {
    try { await db.run(sql); } catch (_) { /* ignore duplicate index */ }
  }

  // Seed demo user
  try {
    if (usePostgres) {
      await db.run(
        `INSERT INTO users (username, email, password_hash, signup_ip, signup_location, signup_country, signup_city)
         VALUES ($1,$2,$3,$4,$5,$6,$7) ON CONFLICT (username) DO NOTHING`,
        ['demo', 'demo@investigate.agent', 'demo123', '127.0.0.1', 'Local Network', 'Local', 'Local']
      );
    } else {
      await db.run(
        `INSERT OR IGNORE INTO users (username, email, password_hash, signup_ip, signup_location, signup_country, signup_city)
         VALUES (?,?,?,?,?,?,?)`,
        ['demo', 'demo@investigate.agent', 'demo123', '127.0.0.1', 'Local Network', 'Local', 'Local']
      );
    }
  } catch (_) {}

  console.log(`✅ Database tables ready (${usePostgres ? 'PostgreSQL' : 'SQLite'})`);
}

// ── Geo helper ────────────────────────────────────────────────
function getLocationFromIP(ip) {
  try {
    if (!ip || ip === '127.0.0.1' || ip === 'localhost' || ip === '::1' || ip.startsWith('192.168') || ip.startsWith('10.')) {
      return { location: 'Local/Private Network', country: 'Local', city: 'Local', latitude: null, longitude: null };
    }
    const geo = geoip.lookup(ip);
    if (geo) {
      return {
        location:  `${geo.city || 'Unknown'}, ${geo.country || 'Unknown'}`,
        country:   geo.country || 'Unknown',
        city:      geo.city    || 'Unknown',
        latitude:  geo.ll ? geo.ll[0] : null,
        longitude: geo.ll ? geo.ll[1] : null,
      };
    }
  } catch (e) { /* ignore */ }
  return { location: 'Unknown', country: 'Unknown', city: 'Unknown', latitude: null, longitude: null };
}

// ── Exported functions (all await `ready` before touching DB) ─

export async function registerUser(username, email, passwordHash, ip) {
  await ready;
  const geo = getLocationFromIP(ip);
  if (usePostgres) {
    await db.run(
      `INSERT INTO users (username,email,password_hash,signup_ip,signup_location,signup_country,signup_city,signup_latitude,signup_longitude)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) ON CONFLICT (username) DO NOTHING`,
      [username, email, passwordHash, ip, geo.location, geo.country, geo.city, geo.latitude, geo.longitude]
    );
  } else {
    await db.run(
      `INSERT OR IGNORE INTO users (username,email,password_hash,signup_ip,signup_location,signup_country,signup_city,signup_latitude,signup_longitude)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [username, email, passwordHash, ip, geo.location, geo.country, geo.city, geo.latitude, geo.longitude]
    );
  }
  console.log(`✅ User registered: ${username} from ${geo.location}`);
  return { success: true, location: geo.location };
}

export async function logLogin(username, email, ip, loginStatus = 'success') {
  await ready;
  const geo = getLocationFromIP(ip);
  if (usePostgres) {
    await db.run(
      `INSERT INTO login_history (username,email,login_ip,login_location,login_country,login_city,login_latitude,login_longitude,login_status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)`,
      [username, email, ip, geo.location, geo.country, geo.city, geo.latitude, geo.longitude, loginStatus]
    );
  } else {
    await db.run(
      `INSERT INTO login_history (username,email,login_ip,login_location,login_country,login_city,login_latitude,login_longitude,login_status)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [username, email, ip, geo.location, geo.country, geo.city, geo.latitude, geo.longitude, loginStatus]
    );
  }
  console.log(`✅ Login logged: ${username} from ${geo.location}`);
  return { success: true, location: geo.location };
}

export async function getUserByUsername(username) {
  await ready;
  return usePostgres
    ? db.get(`SELECT * FROM users WHERE username = $1`, [username])
    : db.get(`SELECT * FROM users WHERE username = ?`,  [username]);
}

export async function getAllUsers() {
  await ready;
  return db.all(`SELECT id,username,email,created_at,signup_location,signup_country,signup_city FROM users ORDER BY created_at DESC`);
}

export async function getUserLoginHistory(username) {
  await ready;
  return usePostgres
    ? db.all(`SELECT * FROM login_history WHERE username=$1 ORDER BY login_time DESC LIMIT 50`, [username])
    : db.all(`SELECT * FROM login_history WHERE username=?  ORDER BY login_time DESC LIMIT 50`, [username]);
}

export async function getAllLoginHistory(limit = 100) {
  await ready;
  return usePostgres
    ? db.all(`SELECT * FROM login_history ORDER BY login_time DESC LIMIT $1`, [limit])
    : db.all(`SELECT * FROM login_history ORDER BY login_time DESC LIMIT ?`,  [limit]);
}

export async function getUserCount() {
  await ready;
  const r = await db.get(`SELECT COUNT(*) as count FROM users`);
  return r ? r.count : 0;
}

export async function getSignupStatsByCountry() {
  await ready;
  return db.all(`SELECT signup_country, COUNT(*) as count FROM users GROUP BY signup_country ORDER BY count DESC`);
}

export async function getLoginStatsByCountry() {
  await ready;
  return db.all(`SELECT login_country, COUNT(*) as count FROM login_history GROUP BY login_country ORDER BY count DESC`);
}

export async function cleanupOldLogins() {
  await ready;
  try {
    if (usePostgres) {
      await db.run(`DELETE FROM login_history WHERE id NOT IN (SELECT id FROM login_history ORDER BY login_time DESC LIMIT 1000)`);
    } else {
      await db.run(`DELETE FROM login_history WHERE id NOT IN (SELECT id FROM (SELECT id FROM login_history ORDER BY login_time DESC LIMIT 1000))`);
    }
    console.log('✅ Cleaned up old login records');
  } catch (e) { console.error('Cleanup error:', e.message); }
}

// ── Session tracking ─────────────────────────────────────────

export async function startSession(sessionId, ip, userAgent, username = 'anonymous') {
  await ready;
  const geo = getLocationFromIP(ip);
  if (usePostgres) {
    await db.run(
      `INSERT INTO page_sessions (session_id,username,visit_ip,visit_location,visit_country,visit_city,visit_latitude,visit_longitude,user_agent,is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,TRUE) ON CONFLICT (session_id) DO NOTHING`,
      [sessionId, username, ip, geo.location, geo.country, geo.city, geo.latitude, geo.longitude, userAgent]
    );
  } else {
    await db.run(
      `INSERT OR IGNORE INTO page_sessions (session_id,username,visit_ip,visit_location,visit_country,visit_city,visit_latitude,visit_longitude,user_agent,is_active)
       VALUES (?,?,?,?,?,?,?,?,?,1)`,
      [sessionId, username, ip, geo.location, geo.country, geo.city, geo.latitude, geo.longitude, userAgent]
    );
  }
  console.log(`✅ Session started: ${sessionId} from ${geo.location}`);
  return { success: true, location: geo.location };
}

export async function endSession(sessionId, durationSeconds, username = null) {
  await ready;
  if (usePostgres) {
    if (username) {
      await db.run(
        `UPDATE page_sessions SET visit_end=CURRENT_TIMESTAMP, duration_seconds=$1, is_active=FALSE, username=$2 WHERE session_id=$3`,
        [durationSeconds, username, sessionId]
      );
    } else {
      await db.run(
        `UPDATE page_sessions SET visit_end=CURRENT_TIMESTAMP, duration_seconds=$1, is_active=FALSE WHERE session_id=$2`,
        [durationSeconds, sessionId]
      );
    }
  } else {
    if (username) {
      await db.run(
        `UPDATE page_sessions SET visit_end=CURRENT_TIMESTAMP, duration_seconds=?, is_active=0, username=? WHERE session_id=?`,
        [durationSeconds, username, sessionId]
      );
    } else {
      await db.run(
        `UPDATE page_sessions SET visit_end=CURRENT_TIMESTAMP, duration_seconds=?, is_active=0 WHERE session_id=?`,
        [durationSeconds, sessionId]
      );
    }
  }
  console.log(`✅ Session ended: ${sessionId} (${durationSeconds}s)`);
  return { success: true };
}

export async function updateSessionUser(sessionId, username) {
  await ready;
  if (usePostgres) {
    await db.run(`UPDATE page_sessions SET username=$1 WHERE session_id=$2`, [username, sessionId]);
  } else {
    await db.run(`UPDATE page_sessions SET username=?  WHERE session_id=?`,  [username, sessionId]);
  }
  return { success: true };
}

export async function getAllSessions(limit = 100) {
  await ready;
  return usePostgres
    ? db.all(`SELECT * FROM page_sessions ORDER BY visit_start DESC LIMIT $1`, [limit])
    : db.all(`SELECT * FROM page_sessions ORDER BY visit_start DESC LIMIT ?`,  [limit]);
}

export async function getUserSessions(username) {
  await ready;
  return usePostgres
    ? db.all(`SELECT * FROM page_sessions WHERE username=$1 ORDER BY visit_start DESC LIMIT 50`, [username])
    : db.all(`SELECT * FROM page_sessions WHERE username=?  ORDER BY visit_start DESC LIMIT 50`, [username]);
}

export async function getSessionStats() {
  await ready;
  const isActive = usePostgres ? 'TRUE' : '1';
  const [total, active, avg, totalTime, byCountry, byUser] = await Promise.all([
    db.get(`SELECT COUNT(*) as count FROM page_sessions`),
    db.get(`SELECT COUNT(*) as count FROM page_sessions WHERE is_active = ${isActive}`),
    db.get(`SELECT AVG(duration_seconds) as avg FROM page_sessions WHERE is_active != ${isActive}`),
    db.get(`SELECT SUM(duration_seconds) as total FROM page_sessions`),
    db.all(`SELECT visit_country, COUNT(*) as count FROM page_sessions GROUP BY visit_country ORDER BY count DESC LIMIT 10`),
    db.all(`SELECT username, COUNT(*) as visits, SUM(duration_seconds) as total_seconds FROM page_sessions GROUP BY username ORDER BY visits DESC LIMIT 20`),
  ]);
  return {
    totalSessions:      total?.count || 0,
    activeSessions:     active?.count || 0,
    avgDurationSecs:    Math.round(avg?.avg || 0),
    totalTimeSpentSecs: totalTime?.total || 0,
    byCountry,
    byUser,
  };
}

export default {
  registerUser, logLogin, getUserByUsername,
  getAllUsers, getUserLoginHistory, getAllLoginHistory,
  getUserCount, getSignupStatsByCountry, getLoginStatsByCountry, cleanupOldLogins,
  startSession, endSession, updateSessionUser,
  getAllSessions, getUserSessions, getSessionStats,
};
