use rusqlite::{Connection, Result, Error};
use uuid::Uuid;
use sha2::{Sha256, Digest};
use chrono::Utc;
use serde::Serialize;


pub fn project_id_from_path(path: &str) -> String {
    let mut hasher = Sha256::new();
    hasher.update(path.as_bytes());
    format!("{:x}", hasher.finalize())
}

pub struct NotesDB {
    pub conn: Connection,
}

pub fn init_db(path: &str) -> Result<Connection> {
    let conn = Connection::open(path)?;
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            scope TEXT NOT NULL,
            project_id TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    )?;
    Ok(conn)
}

#[derive(Serialize, Debug)]
pub struct Note {
    pub id: String,
    pub title: String,
    pub content: String,
    pub scope: String,
    pub project_id: Option<String>,
    pub created_at: String,
    pub updated_at: String,
}

pub fn add_note(
    conn: &Connection,
    title: &str,
    content: &str,
    scope: &str,
    project_id: Option<&str>,
) -> Result<()> {
    let id = Uuid::new_v4().to_string();
    let now = Utc::now().to_rfc3339();

    conn.execute(
        "INSERT INTO notes (id, title, content, scope, project_id, created_at, updated_at)
        VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)",
        (&id, &title, &content, &scope, &project_id, &now, &now),
    )?;
    Ok(())
}

pub fn get_all_notes(conn: &Connection) -> Result<Vec<Note>, Error> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, scope, project_id, created_at, updated_at FROM notes"
    )?;

    let notes = stmt.query_map([], |row| {
        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            scope: row.get(3)?,
            project_id: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;
    Ok(notes.filter_map(Result::ok).collect())
}

pub fn get_global_notes(conn: &Connection) -> Result<Vec<Note>, Error> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, scope, project_id, created_at, updated_at FROM notes WHERE scope = 'global'"
    )?;

    let notes = stmt.query_map([], |row| {
        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            scope: "global".to_string(),
            project_id: None,
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;
    Ok(notes.filter_map(Result::ok).collect())
}

pub fn get_project_notes(conn: &Connection, project_id: &str) -> Result<Vec<Note>, Error> {
    let mut stmt = conn.prepare(
        "SELECT id, title, content, scope, project_id, created_at, updated_at FROM notes WHERE scope = 'project' AND project_id = ?1"
    )?;

    let notes = stmt.query_map([project_id], |row| {
        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            scope: "project".to_string(),
            project_id: Some(project_id.to_string()),
            created_at: row.get(5)?,
            updated_at: row.get(6)?,
        })
    })?;
    Ok(notes.filter_map(Result::ok).collect())
}

pub fn delete_note(conn: &Connection, note_id: &str) -> Result<()> {
    let mut stmt = conn.prepare("DELETE FROM notes WHERE id = ?1")?;
    stmt.execute([note_id])?;
    Ok(())
}

pub fn update_note(conn: &Connection, note_id: &str, title: &str, content: &str, scope: &str, project_id: Option<&str>) -> Result<()> {
    let now = Utc::now().to_rfc3339();
    let mut stmt = conn.prepare(
        "UPDATE notes SET title = ?1, content = ?2, scope = ?3, project_id = ?4, updated_at = ?5 WHERE id = ?6"
    )?;
    stmt.execute((&title, &content, &scope, &project_id, &now, &note_id))?;
    Ok(())
}
