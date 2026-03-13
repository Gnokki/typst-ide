use rusqlite::{Connection, Result};
use uuid::Uuid;
use serde::Serialize;


pub struct HistoryDB {
    pub conn: Connection,
}

pub fn init_db(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS history (
            id TEXT PRIMARY KEY NOT NULL,
            name TEXT NOT NULL,
            path TEXT NOT NULL UNIQUE,
            created_at DEFAULT CURRENT_TIMESTAMP,
            updated_at DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    Ok(conn)
}

#[derive(Serialize, Debug)]
pub struct HistoryEntry {
    pub id: String,
    pub name: String,
    pub path: String,
    pub created_at: String,
    pub updated_at: String,
}

pub fn add_entry(
    conn: &Connection,
    name: &str,
    path: &str
) -> Result<bool> {
    let id = Uuid::new_v4().to_string();

    let inserted = conn.execute(
        "INSERT OR IGNORE INTO history (id, name, path) VALUES (?, ?, ?)",
        [id, name.to_string(), path.to_string()],
    )?;

    Ok(inserted==1)
}

pub fn get_history(conn: &Connection) -> Result<Vec<HistoryEntry>> {
    let mut stmt = conn.prepare("SELECT id, name, path, created_at, updated_at FROM history ORDER BY updated_at DESC")?;
    let history_iter = stmt.query_map([], |row| {
        Ok(HistoryEntry {
            id: row.get(0)?,
            name: row.get(1)?,
            path: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;
    let history = history_iter.collect::<Result<Vec<_>, _>>()?;
    Ok(history)
}

pub fn delete_history_entry(conn: &Connection, id: &str) -> Result<()> {
    conn.execute("DELETE FROM history WHERE id = ?", [id])?;
    Ok(())
}

pub fn update_history_entry(conn: &Connection, id: &str, name: &str, path: &str) -> Result<()> {
    conn.execute("
        UPDATE history SET name = ?, path = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?
    ",[&name, &path, &id])?;
    Ok(())
}
