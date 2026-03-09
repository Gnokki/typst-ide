// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::sync::Mutex;
use serde::Serialize;
use tauri::Manager;
use typst_ide_core::compiler::{compile_to_preview_html, compile_to_pdf, DiagnosticInfo, PreviewResult};
use typst_ide_core::database::{
    notes_db::{self, Note},
    history_db::{self, HistoryEntry}
};

// ## Database state ############################################################

/// Tauri-managed state for the notes database
pub struct NotesDbState(pub Mutex<rusqlite::Connection>);
pub struct HistoryDbState(pub Mutex<rusqlite::Connection>);

/// Tauri-managed state for a second database (example)
// pub struct OtherDbState(pub Mutex<rusqlite::Connection>);

// ###########################################################################
// Preview
// ###########################################################################

/// Cursor position as reported by Monaco (1-based line and UTF-16 column).
/// Transmitted by the frontend to enable forward-search (editor → preview sync).
#[derive(serde::Deserialize)]
#[serde(rename_all = "camelCase")]
struct CursorPos {
    line_number: u32,
    column: u32,
}

/// Compiles Typst source code to a preview HTML document (pages rendered as inline SVGs)
/// Runs on a blocking thread pool to avoid freezing the UI during compilation
#[tauri::command]
async fn render_preview(source: String, root: Option<String>, cursor: Option<CursorPos>) -> Result<PreviewResult, Vec<DiagnosticInfo>> {
    tauri::async_runtime::spawn_blocking(move || {
        let cur = cursor.map(|c| (c.line_number, c.column));
        compile_to_preview_html(root.as_deref(), &source, cur)
    })
        .await
        .map_err(|e| vec![DiagnosticInfo {
            severity: "error".into(),
            message: e.to_string(),
            hints: vec![],
            line: None, column: None, end_line: None, end_column: None,
        }])?
}

// ###########################################################################
// File system / project management
// ###########################################################################

/// Opens a native folder picker dialog and returns the selected path, or `null` if cancelled
#[tauri::command]
async fn open_folder_dialog() -> Option<String> {
    tauri::async_runtime::spawn_blocking(|| {
        rfd::FileDialog::new()
            .set_title("Sélectionner un dossier")
            .pick_folder()
            .map(|p| p.to_string_lossy().into_owned())
    })
    .await
    .unwrap_or(None)
}

/// Creates a new project directory with an optional content in `main.typ` file inside
/// Add an entry to the history database for this project
/// Returns the full path of the created project folder
#[tauri::command]
async fn create_project(
    state: tauri::State<'_, HistoryDbState>,
    name: String, 
    base_path: String, 
    content: Option<String>
) -> Result<String, String> {
    let project_path = std::path::PathBuf::from(&base_path).join(&name);
    std::fs::create_dir_all(&project_path).map_err(|e| e.to_string())?;
    let typ_path = project_path.join("main.typ");
    if !typ_path.exists() {
        std::fs::write(&typ_path, content.as_deref().unwrap_or("")).map_err(|e| e.to_string())?;
    }
    // Add an entry to the history database
    {
        let conn = state.0.lock().map_err(|e| e.to_string())?;
        let inserted = history_db::add_entry(&conn, &name, &project_path.to_string_lossy()).map_err(|e| e.to_string())?;
    }
    
    Ok(project_path.to_string_lossy().into_owned())
}

#[derive(Serialize)]
pub struct ProjectInfo {
    name: String,
    path: String,
    typ_file: String,
    content: String,
}

/// Opens an existing project directory: finds the first `.typ` file and returns its content
#[tauri::command]
async fn open_project(dir_path: String) -> Result<ProjectInfo, String> {
    let dir = std::path::PathBuf::from(&dir_path);
    let entries = std::fs::read_dir(&dir).map_err(|e| e.to_string())?;
    let typ_path = entries
        .filter_map(|e| e.ok())
        .map(|e| e.path())
        .find(|p| p.extension().map_or(false, |ext| ext == "typ"))
        .ok_or_else(|| "Aucun fichier .typ trouvé dans ce dossier.".to_string())?;

    let content = std::fs::read_to_string(&typ_path).map_err(|e| e.to_string())?;
    let name = dir
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();
    let typ_file = typ_path
        .file_name()
        .unwrap_or_default()
        .to_string_lossy()
        .into_owned();

    Ok(ProjectInfo {
        name,
        path: dir_path,
        typ_file,
        content,
    })
}

#[tauri::command]
fn read_file(path: String) -> Result<String, String> {
    std::fs::read_to_string(path).map_err(|e| e.to_string())
}

/// Writes `content` to the file at `path`, creating intermediate directories if needed
#[tauri::command]
async fn save_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

// ###########################################################################
// Database
// ###########################################################################

/// ####################################################
/// Notes DB

/// Adds a note to the database
#[tauri::command]
fn add_note(
    state: tauri::State<'_, NotesDbState>,
    title: String,
    content: String,
    scope: String,
    project_id: Option<String>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    notes_db::add_note(&conn, &title, &content, &scope, project_id.as_deref())
        .map_err(|e| e.to_string())
}

/// Returns all notes
#[tauri::command]
fn get_all_notes(state: tauri::State<'_, NotesDbState>) -> Result<Vec<Note>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    notes_db::get_all_notes(&conn).map_err(|e| e.to_string())
}

/// Returns all global notes (not linked to a project)
#[tauri::command]
fn get_global_notes(state: tauri::State<'_, NotesDbState>) -> Result<Vec<Note>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    notes_db::get_global_notes(&conn).map_err(|e| e.to_string())
}

/// Returns all notes linked to a project path
#[tauri::command]
fn get_project_notes(state: tauri::State<'_, NotesDbState>, project_path: String) -> Result<Vec<Note>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let project_id = notes_db::project_id_from_path(&project_path);
    notes_db::get_project_notes(&conn, &project_id).map_err(|e| e.to_string())
}

/// Get the hash of a project path to use as a project ID in the database
#[tauri::command]
fn get_current_project_id(project_path: String) -> String {
    notes_db::project_id_from_path(&project_path)
}

/// Deletes a note by its ID
#[tauri::command]
fn delete_note(state: tauri::State<'_, NotesDbState>, note_id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    notes_db::delete_note(&conn, &note_id).map_err(|e| e.to_string())
}

/// Updates a note by its ID
#[tauri::command]
fn update_note(
    state: tauri::State<'_, NotesDbState>,
    note_id: String,
    title: String,
    content: String,
    scope: String,
    project_id: Option<String>,
) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    notes_db::update_note(&conn, &note_id, &title, &content, &scope, project_id.as_deref())
        .map_err(|e| e.to_string())
}

/// ####################################################
/// History DB

#[tauri::command]
fn add_history_entry(state: tauri::State<'_, HistoryDbState>, name: String, path: String) -> Result<bool, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    let inserted = history_db::add_entry(&conn, &name, &path).map_err(|e| e.to_string())?;
    Ok(inserted)
}

#[tauri::command]
fn get_history(state: tauri::State<'_, HistoryDbState>) -> Result<Vec<history_db::HistoryEntry>, String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    history_db::get_history(&conn).map_err(|e| e.to_string())
}

#[tauri::command]
fn delete_history_entry(state: tauri::State<'_, HistoryDbState>, id: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    history_db::delete_history_entry(&conn, &id).map_err(|e| e.to_string())
}

#[tauri::command]
fn update_history_entry(state: tauri::State<'_, HistoryDbState>, id: String, name: String, path: String) -> Result<(), String> {
    let conn = state.0.lock().map_err(|e| e.to_string())?;
    history_db::update_history_entry(&conn, &id, &name, &path).map_err(|e| e.to_string())
}

// ###########################################################################
// PDF export
// ###########################################################################

/// Opens a native "Enregistrer sous" dialog filtered to PDF files
/// Returns the chosen path as a string, or `null` if the user cancelled
#[tauri::command]
async fn pick_pdf_path() -> Option<String> {
    tauri::async_runtime::spawn_blocking(|| {
        rfd::FileDialog::new()
            .set_title("Enregistrer en PDF")
            .add_filter("PDF", &["pdf"])
            .save_file()
            .map(|p| p.to_string_lossy().into_owned())
    })
    .await
    .unwrap_or(None)
}

/// Compiles `source` to PDF and writes it to `path`
#[tauri::command]
async fn export_pdf(source: String, path: String, root: Option<String>) -> Result<(), String> {
    tauri::async_runtime::spawn_blocking(move || {
        let bytes = compile_to_pdf(root.as_deref(), &source)?;
        if let Some(parent) = std::path::Path::new(&path).parent() {
            std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
        }
        std::fs::write(&path, &bytes).map_err(|e| e.to_string())
    })
    .await
    .map_err(|e| e.to_string())?
}
// ###########################################################################
// Fonts
// ###########################################################################

/// Checks whether a font family name is available on the system
#[tauri::command]
fn font_exists(name: String) -> bool {
    use font_kit::family_name::FamilyName;
    use font_kit::properties::Properties;
    use font_kit::source::SystemSource;
    SystemSource::new()
        .select_best_match(&[FamilyName::Title(name)], &Properties::new())
        .is_ok()
}

// ###########################################################################
// Entry point
// ###########################################################################

fn main() {
    // On Linux, WebKitGTK may try to use DMABuf/GPU compositing and fail on some systems.
    // Disable as a secondary defense (the real fix is not bundling Wayland libs in the AppImage).
    #[cfg(target_os = "linux")]
    {
        if std::env::var("WEBKIT_DISABLE_DMABUF_RENDERER").is_err() {
            std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        }
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .setup(|app| {
            let data_dir = app.path().app_data_dir()?;
            std::fs::create_dir_all(&data_dir)?;
            
            let note_db_path = data_dir.join("notes.db");
            let note_conn = notes_db::init_db(note_db_path.to_str().unwrap())
                .expect("Failed to initialise notes DB");
            app.manage(NotesDbState(Mutex::new(note_conn)));

            let history_db_path = data_dir.join("history.db");
            let history_conn = history_db::init_db(history_db_path.to_str().unwrap())
                .expect("Failed to initialise history DB");
            app.manage(HistoryDbState(Mutex::new(history_conn)));
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            render_preview,
            open_folder_dialog,
            create_project,
            open_project,
            save_file,
            pick_pdf_path,
            export_pdf,
            font_exists,
            read_file,

            add_note,
            get_all_notes,
            delete_note,
            update_note,
            get_global_notes,
            get_project_notes,
            get_current_project_id,

            add_history_entry,
            get_history,
            delete_history_entry,
            update_history_entry,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
