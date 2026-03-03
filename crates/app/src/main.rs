// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use serde::Serialize;
use typst_ide_core::compiler::compile_to_preview_html;

// ---------------------------------------------------------------------------
// Preview
// ---------------------------------------------------------------------------

/// Compiles Typst source code to a preview HTML document (pages rendered as inline SVGs).
/// Runs on a blocking thread pool to avoid freezing the UI during compilation.
#[tauri::command]
async fn render_preview(source: String) -> Result<String, String> {
    tauri::async_runtime::spawn_blocking(move || compile_to_preview_html(&source))
        .await
        .map_err(|e| e.to_string())?
}

// ---------------------------------------------------------------------------
// File system / project management
// ---------------------------------------------------------------------------

/// Opens a native folder picker dialog and returns the selected path, or `null` if cancelled.
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

/// Creates a new project directory with an empty `main.typ` file inside.
/// Returns the full path of the created project folder.
#[tauri::command]
async fn create_project(name: String, base_path: String) -> Result<String, String> {
    let project_path = std::path::PathBuf::from(&base_path).join(&name);
    std::fs::create_dir_all(&project_path).map_err(|e| e.to_string())?;
    let typ_path = project_path.join("main.typ");
    if !typ_path.exists() {
        std::fs::write(&typ_path, "").map_err(|e| e.to_string())?;
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

/// Opens an existing project directory: finds the first `.typ` file and returns its content.
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

/// Writes `content` to the file at `path`, creating intermediate directories if needed.
#[tauri::command]
async fn save_file(path: String, content: String) -> Result<(), String> {
    if let Some(parent) = std::path::Path::new(&path).parent() {
        std::fs::create_dir_all(parent).map_err(|e| e.to_string())?;
    }
    std::fs::write(&path, &content).map_err(|e| e.to_string())
}

// ---------------------------------------------------------------------------
// Entry point
// ---------------------------------------------------------------------------

fn main() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            render_preview,
            open_folder_dialog,
            create_project,
            open_project,
            save_file,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
