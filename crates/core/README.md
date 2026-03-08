# crates/core (logic library)

This crate contains all the application's business logic. It's a pure Rust library with **no Tauri dependency**, it can be used standalone, tested independently, and is consumed by [`crates/app`](../app) (desktop).

## Role

- Wraps the `typst` compiler and exposes high-level compilation functions
- Provides the SQLite notes database layer
- Exposes file system utilities
- Defines shared types serialized across the Tauri IPC boundary (e.g. `DiagnosticInfo`)

## Module Overview

```
crates/core/src/
├── lib.rs              # Re-exports all modules
├── compiler/
│   ├── compile.rs      # Typst compilation: preview HTML, PDF, diagnostics
│   ├── export.rs       # (reserved for additional export targets)
│   └── mod.rs          # Public re-exports
├── database/
│   ├── notes_db.rs     # SQLite notes CRUD + schema initialization
│   └── mod.rs          
├── features/           # features logic WIP
│   └── mod.rs          
│   
└── fs/
    ├── files.rs        # Low-level file system utilities
    └── mod.rs          # Public re-exports
```

## `compiler` (Typst compilation)

### Public API

| Function | Signature | Description |
|---|---|---|
| `compile_to_preview_html` | `(&str) -> Result<String, Vec<DiagnosticInfo>>` | Compiles source to an HTML document with one SVG per page. Returns structured diagnostics on failure. |
| `compile_to_pdf` | `(&str) -> Result<Vec<u8>, String>` | Compiles source to raw PDF bytes. |
| `create_default_world` | `(&str) -> TypstWrapperWorld` | World with paged output target and current dir as root. |
| `create_html_world` | `(&str) -> TypstWrapperWorld` | World with HTML output target enabled. |
| `create_world_with_root` | `(&str, &str) -> TypstWrapperWorld` | World with a custom root path. |

### `DiagnosticInfo`

Serializable struct sent to the frontend to power Monaco's `setModelMarkers` API (squiggly underlines):

```rust
pub struct DiagnosticInfo {
    pub severity:   String,       // "error" | "warning"
    pub message:    String,
    pub hints:      Vec<String>,
    pub line:       Option<u32>,  // 1-based
    pub column:     Option<u32>,  // 1-based
    pub end_line:   Option<u32>,
    pub end_column: Option<u32>,
}
```

Positions are resolved from Typst's internal `Span` system via `world.source(id)` + `source.range(span)`.

## Notes (SQLite)

Schema managed by `init_db()` (creates the table if it doesn't exist):

```sql
CREATE TABLE IF NOT EXISTS notes (
    id         TEXT PRIMARY KEY,  -- UUID v4
    title      TEXT NOT NULL,
    content    TEXT NOT NULL,
    scope      TEXT NOT NULL,     -- "global" | "project"
    project_id TEXT,              -- SHA-256 hash of the project path
    created_at TEXT NOT NULL,     -- RFC 3339
    updated_at TEXT NOT NULL
);
```

| Function | Description |
|---|---|
| `init_db(path)` | Opens (or creates) the SQLite file and runs migrations |
| `project_id_from_path(path)` | Returns a stable SHA-256 hex identifier for a project path |
| `add_note(...)` | Inserts a note with a fresh UUID and current timestamp |
| `get_all_notes(conn)` | Returns all notes |
| `get_global_notes(conn)` | Returns notes with no `project_id` |
| `get_project_notes(conn, id)` | Returns notes for a given project ID |
| `delete_note(conn, id)` | Deletes a note by ID |
| `update_note(...)` | Updates title, content, scope, project_id and `updated_at` |

## `fs` (filesystem utilities)

Thin wrappers over `std::fs` for reading, writing, creating, deleting, checking existence, and copying files. Used internally; not exposed over Tauri IPC (the app layer handles its own I/O directly).

## Other dependencies

| Crate | Purpose |
|---|---|
| `typst` | Compiler core |
| `typst-as-library` | `TypstWrapperWorld` implementation (local crate) |
| `typst-pdf` | PDF rendering |
| `typst-svg` | SVG rendering (used for preview) |
| `rusqlite` (bundled) | Embedded SQLite |
| `uuid` | Note ID generation |
| `chrono` | RFC 3339 timestamps |
| `sha2` | Project path = stable ID |
| `serde` | Serialization of `DiagnosticInfo`, `Note`, `ProjectInfo` |
