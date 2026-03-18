use rusqlite::{Connection, Result};
use chrono::Utc;
use serde::Serialize;

pub struct BibliographyDB {
    pub conn: Connection,
}

pub fn init_db(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS bibliography (
            title TEXT PRIMARY KEY NOT NULL UNIQUE,
            full INTEGER NOT NULL DEFAULT 0
            style TEXT NO NULL,
            created_at DEFAULT CURRENT_TIMESTAMP,
            updated_at DEFAULT CURRENT_TIMESTAMP
        )",
        [],
    )?;
    Ok(conn)
}

#[derive(Serialize, Debug)]
pub struct BibliographyEntry {
    pub title: String,
    pub full: bool,
    pub style: String,
    pub created_at: String,
    pub updated_at: String,
}

pub fn add_entry(
    conn: &Connection,
    title: &str,
    full: &bool,
    style: &str,
) -> Result<bool> {

    let inserted = conn.execute(
        "INSERT OR IGNORE INTO bibliography (title, full, style) VALUES (?, ?, ?)",
        rusqlite::params![title, full, style],
    )?;

    Ok(inserted==1)
}

pub fn get_bibliography(conn: &Connection) -> Result<Vec<BibliographyEntry>> {
    let mut stmt = conn.prepare("
        SELECT title, full, style, created_at, updated_at FROM bibliography
        ORDER BY updated_at DESC
    ")?;
    let bibliography_iter = stmt.query_map([], |row| {
        Ok(BibliographyEntry {
            title: row.get(0)?,
            full: row.get(1)?,
            style: row.get(2)?,
            created_at: row.get(3)?,
            updated_at: row.get(4)?,
        })
    })?;
    let bibliography = bibliography_iter.collect::<Result<Vec<_>, _>>()?;
    Ok(bibliography)
}

pub fn delete_bibliography_entry(conn: &Connection, title: &str) -> Result<()> {
    conn.execute("DELETE FROM bibliography WHERE title = ?", [title])?;
    Ok(())
}

pub fn update_bibliography_entry(conn: &Connection, title: &str, full: &bool, style: &str) -> Result<()> {
    conn.execute("
        UPDATE bibliography
        SET title = ?, full = ?, style = ?, updated_at = CURRENT_TIMESTAMP
        WHERE title = ?
    ", rusqlite::params![title, full, style, title])?;
    Ok(())
}
