import { DatabaseSync } from "node:sqlite";
import { mkdirSync } from "node:fs";
import { join } from "node:path";

// A tiny SQLite layer backed by Node's built-in driver (node:sqlite) — no
// native build step, no extra dependency, automatically externalised by the
// bundler. The file lives in /data (git-ignored). This module is server-only:
// never import it from a Client Component.

const DATA_DIR = join(process.cwd(), "data");
const DB_PATH = join(DATA_DIR, "museum.db");

function createDb() {
  mkdirSync(DATA_DIR, { recursive: true });
  const db = new DatabaseSync(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL;");
  db.exec("PRAGMA foreign_keys = ON;");
  ensureSchema(db);
  return db;
}

// Idempotent — runs on every module load so a connection cached from before a
// table was added (across HMR) still gets the new tables.
function ensureSchema(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      email         TEXT NOT NULL UNIQUE,
      name          TEXT NOT NULL DEFAULT '',
      password_hash TEXT NOT NULL,
      created_at    TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS favorites (
      user_id    INTEGER NOT NULL,
      work_id    TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      PRIMARY KEY (user_id, work_id),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );
    CREATE TABLE IF NOT EXISTS orders (
      id                 INTEGER PRIMARY KEY AUTOINCREMENT,
      reference          TEXT NOT NULL UNIQUE,
      stripe_session_id  TEXT UNIQUE,
      user_id            INTEGER,
      email              TEXT NOT NULL,
      visit_date         TEXT NOT NULL,
      amount_total       INTEGER NOT NULL,
      currency           TEXT NOT NULL DEFAULT 'eur',
      status             TEXT NOT NULL DEFAULT 'paid',
      email_preview_url  TEXT,
      created_at         TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
    );
    CREATE TABLE IF NOT EXISTS tickets (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id   INTEGER NOT NULL,
      reference  TEXT NOT NULL UNIQUE,
      category   TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);
}

// Reuse a single connection across dev HMR reloads (a new module evaluation
// would otherwise reopen the file on every save).
const globalForDb = globalThis;
const db = globalForDb.__museumDb ?? (globalForDb.__museumDb = createDb());
ensureSchema(db);

const normalizeEmail = (email) => String(email ?? "").toLowerCase().trim();

/* ----------------------------- Users ----------------------------- */

export function getUserByEmail(email) {
  return db
    .prepare("SELECT * FROM users WHERE email = ?")
    .get(normalizeEmail(email));
}

export function getUserById(id) {
  return db
    .prepare("SELECT id, email, name FROM users WHERE id = ?")
    .get(Number(id));
}

export function createUser({ email, name = "", passwordHash }) {
  const info = db
    .prepare("INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)")
    .run(normalizeEmail(email), String(name), String(passwordHash));
  return getUserById(Number(info.lastInsertRowid));
}

/* --------------------------- Favorites --------------------------- */

export function listFavorites(userId) {
  return db
    .prepare(
      "SELECT work_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
    )
    .all(Number(userId))
    .map((row) => row.work_id);
}

export function addFavorite(userId, workId) {
  db.prepare(
    "INSERT OR IGNORE INTO favorites (user_id, work_id) VALUES (?, ?)",
  ).run(Number(userId), String(workId));
}

export function removeFavorite(userId, workId) {
  db.prepare(
    "DELETE FROM favorites WHERE user_id = ? AND work_id = ?",
  ).run(Number(userId), String(workId));
}

/* ---------------------------- Ticket orders ---------------------------- */

export function getOrderByStripeSession(sessionId) {
  return db
    .prepare("SELECT * FROM orders WHERE stripe_session_id = ?")
    .get(String(sessionId));
}

function ticketsForOrder(orderId) {
  return db
    .prepare("SELECT * FROM tickets WHERE order_id = ? ORDER BY id")
    .all(Number(orderId));
}

// Create a paid order and its per-person tickets in one transaction. Returns
// the order with its tickets attached.
export function createPaidOrder({
  reference,
  stripeSessionId = null,
  userId = null,
  email,
  visitDate,
  amountTotal,
  currency = "eur",
  emailPreviewUrl = null,
  tickets = [],
}) {
  db.exec("BEGIN");
  try {
    const info = db
      .prepare(
        `INSERT INTO orders
          (reference, stripe_session_id, user_id, email, visit_date, amount_total, currency, status, email_preview_url)
         VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?)`,
      )
      .run(
        String(reference),
        stripeSessionId,
        userId != null ? Number(userId) : null,
        String(email),
        String(visitDate),
        Number(amountTotal),
        String(currency),
        emailPreviewUrl,
      );
    const orderId = Number(info.lastInsertRowid);

    const insertTicket = db.prepare(
      "INSERT INTO tickets (order_id, reference, category) VALUES (?, ?, ?)",
    );
    for (const ticket of tickets) {
      insertTicket.run(orderId, String(ticket.reference), String(ticket.category));
    }

    db.exec("COMMIT");
    return getOrderWithTickets(orderId);
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }
}

export function getOrderWithTickets(orderId) {
  const order = db
    .prepare("SELECT * FROM orders WHERE id = ?")
    .get(Number(orderId));
  if (!order) return null;
  return { ...order, tickets: ticketsForOrder(order.id) };
}

export function setOrderEmailPreview(orderId, url) {
  db.prepare("UPDATE orders SET email_preview_url = ? WHERE id = ?").run(
    url ? String(url) : null,
    Number(orderId),
  );
}

export function listOrdersByUser(userId) {
  const orders = db
    .prepare("SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC")
    .all(Number(userId));
  return orders.map((order) => ({ ...order, tickets: ticketsForOrder(order.id) }));
}
