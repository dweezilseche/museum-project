import { createClient } from "@libsql/client";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";

// Data layer backed by libSQL (SQLite). One code path for both environments:
// locally it opens a file (`file:data/museum.db`); in production it talks to a
// hosted Turso database over the network. Configure with env vars:
//   DATABASE_URL         libsql://<db>.turso.io   (or file:… locally)
//   DATABASE_AUTH_TOKEN  the Turso auth token     (unset locally)
// This module is server-only: never import it from a Client Component.

const DATABASE_URL = process.env.DATABASE_URL || "file:data/museum.db";
const DATABASE_AUTH_TOKEN = process.env.DATABASE_AUTH_TOKEN;

function createDb() {
  // For a local file URL, make sure the directory exists first.
  if (DATABASE_URL.startsWith("file:")) {
    const path = DATABASE_URL.slice("file:".length);
    mkdirSync(dirname(path), { recursive: true });
  }
  return createClient({ url: DATABASE_URL, authToken: DATABASE_AUTH_TOKEN });
}

// Reuse a single client across dev HMR reloads and serverless invocations.
const globalForDb = globalThis;
const db = globalForDb.__museumDb ?? (globalForDb.__museumDb = createDb());

const SCHEMA_SQL = `
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
`;

// Create the schema once per process. Every query awaits this first, so the
// tables exist before the first read/write. A failed run is not cached.
let schemaReady;
function ensureReady() {
  if (!schemaReady) {
    schemaReady = db.executeMultiple(SCHEMA_SQL).catch((error) => {
      schemaReady = null;
      throw error;
    });
  }
  return schemaReady;
}

// libSQL returns array-like rows; turn a result into plain keyed objects.
function toRows(result) {
  return result.rows.map((row) =>
    Object.fromEntries(result.columns.map((col, i) => [col, row[i]])),
  );
}
function toRow(result) {
  return toRows(result)[0];
}

async function query(sql, args = []) {
  await ensureReady();
  return db.execute({ sql, args });
}

const normalizeEmail = (email) => String(email ?? "").toLowerCase().trim();

/* ----------------------------- Users ----------------------------- */

export async function getUserByEmail(email) {
  const result = await query("SELECT * FROM users WHERE email = ?", [
    normalizeEmail(email),
  ]);
  return toRow(result);
}

export async function getUserById(id) {
  const result = await query(
    "SELECT id, email, name FROM users WHERE id = ?",
    [Number(id)],
  );
  return toRow(result);
}

export async function createUser({ email, name = "", passwordHash }) {
  const result = await query(
    "INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)",
    [normalizeEmail(email), String(name), String(passwordHash)],
  );
  return getUserById(Number(result.lastInsertRowid));
}

/* --------------------------- Favorites --------------------------- */

export async function listFavorites(userId) {
  const result = await query(
    "SELECT work_id FROM favorites WHERE user_id = ? ORDER BY created_at DESC",
    [Number(userId)],
  );
  return toRows(result).map((row) => row.work_id);
}

export async function addFavorite(userId, workId) {
  await query(
    "INSERT OR IGNORE INTO favorites (user_id, work_id) VALUES (?, ?)",
    [Number(userId), String(workId)],
  );
}

export async function removeFavorite(userId, workId) {
  await query("DELETE FROM favorites WHERE user_id = ? AND work_id = ?", [
    Number(userId),
    String(workId),
  ]);
}

/* ---------------------------- Ticket orders ---------------------------- */

export async function getOrderByStripeSession(sessionId) {
  const result = await query(
    "SELECT * FROM orders WHERE stripe_session_id = ?",
    [String(sessionId)],
  );
  return toRow(result);
}

async function ticketsForOrder(orderId) {
  const result = await query(
    "SELECT * FROM tickets WHERE order_id = ? ORDER BY id",
    [Number(orderId)],
  );
  return toRows(result);
}

// Create a paid order and its per-person tickets in one transaction. Returns
// the order with its tickets attached.
export async function createPaidOrder({
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
  await ensureReady();
  const tx = await db.transaction("write");
  try {
    const info = await tx.execute({
      sql: `INSERT INTO orders
              (reference, stripe_session_id, user_id, email, visit_date, amount_total, currency, status, email_preview_url)
            VALUES (?, ?, ?, ?, ?, ?, ?, 'paid', ?)`,
      args: [
        String(reference),
        stripeSessionId,
        userId != null ? Number(userId) : null,
        String(email),
        String(visitDate),
        Number(amountTotal),
        String(currency),
        emailPreviewUrl,
      ],
    });
    const orderId = Number(info.lastInsertRowid);

    for (const ticket of tickets) {
      await tx.execute({
        sql: "INSERT INTO tickets (order_id, reference, category) VALUES (?, ?, ?)",
        args: [orderId, String(ticket.reference), String(ticket.category)],
      });
    }

    await tx.commit();
    return getOrderWithTickets(orderId);
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function getOrderWithTickets(orderId) {
  const result = await query("SELECT * FROM orders WHERE id = ?", [
    Number(orderId),
  ]);
  const order = toRow(result);
  if (!order) return null;
  return { ...order, tickets: await ticketsForOrder(order.id) };
}

export async function setOrderEmailPreview(orderId, url) {
  await query("UPDATE orders SET email_preview_url = ? WHERE id = ?", [
    url ? String(url) : null,
    Number(orderId),
  ]);
}

export async function listOrdersByUser(userId) {
  const result = await query(
    "SELECT * FROM orders WHERE user_id = ? ORDER BY created_at DESC",
    [Number(userId)],
  );
  const orders = toRows(result);
  return Promise.all(
    orders.map(async (order) => ({
      ...order,
      tickets: await ticketsForOrder(order.id),
    })),
  );
}
