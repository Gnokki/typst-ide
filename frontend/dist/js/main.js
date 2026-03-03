/**
 * Application entry point — wires all modules together.
 */

import { createEditor, setEditorTheme, zoomIn, zoomOut, zoomReset, getCurrentZoomPct } from './editor.js';
import { initPreview }   from './preview.js';
import { initToolbar, initTheme, writeToConsole, showConsole } from './toolbar.js';
import { registerShortcuts } from './shortcuts.js';
import { createNewProject, openProject, scheduleAutosave, notifySaveIndicator } from './project.js';

async function main() {
    if (!window.__TAURI__) {
        document.body.innerHTML = '<p style="color:red;padding:1rem">Tauri API non disponible.</p>';
        return;
    }

    // ── Bootstrap UI ─────────────────────────────────────────────
    initToolbar();

    // ── Monaco editor ─────────────────────────────────────────────
    const container = document.getElementById('typst-editor');
    const editor    = await createEditor(container);

    initTheme((theme) => setEditorTheme(theme));

    // Update status-bar zoom on load
    const zoomEl = document.getElementById('status-zoom');
    if (zoomEl) zoomEl.textContent = `${getCurrentZoomPct()}%`;

    // ── Preview ────────────────────────────────────────────────────
    const preview = document.getElementById('preview');
    const frame   = document.getElementById('preview-frame');

    initPreview({
        getSource: () => editor.getValue(),
        onChange:  (cb) => editor.onDidChangeModelContent(cb),
        preview,
        frame,
    });

    // ── Autosave ───────────────────────────────────────────────────
    editor.onDidChangeModelContent(() => {
        notifySaveIndicator(true);
        scheduleAutosave(editor.getValue());
    });

    // ── Shortcuts ──────────────────────────────────────────────────
    const compile = () => {
        // Trigger a manual compile by forcing the preview to re-run immediately
        const event = new Event('input', { bubbles: true });
        // We call preview's compile directly by dispatching through the editor wrapper
        frame.dispatchEvent(new CustomEvent('force-compile', { bubbles: true }));
    };

    registerShortcuts({
        editor,
        onCompile:    () => triggerCompile(editor, preview, frame),
        onZoomIn:     () => { zoomIn();    if (zoomEl) zoomEl.textContent = `${getCurrentZoomPct()}%`; },
        onZoomOut:    () => { zoomOut();   if (zoomEl) zoomEl.textContent = `${getCurrentZoomPct()}%`; },
        onZoomReset:  () => { zoomReset(); if (zoomEl) zoomEl.textContent = `${getCurrentZoomPct()}%`; },
        onNewProject: () => createNewProject((content) => editor.setValue(content)),
        onOpenProject:() => openProject((content) => editor.setValue(content)),
    });

    // ── Toolbar menu actions ───────────────────────────────────────
    bindMenuAction('new-project',   () => createNewProject((content) => editor.setValue(content)));
    bindMenuAction('open-project',  () => openProject((content) => editor.setValue(content)));
    bindMenuAction('action-undo',   () => editor.trigger('', 'undo', null));
    bindMenuAction('action-redo',   () => editor.trigger('', 'redo', null));
    bindMenuAction('action-search', () => editor.getAction('actions.find')?.run());
    bindMenuAction('action-replace',() => editor.getAction('editor.action.startFindReplaceAction')?.run());
    bindMenuAction('action-goto',   () => editor.getAction('editor.action.gotoLine')?.run());
    bindMenuAction('action-comment',() => editor.getAction('editor.action.commentLine')?.run());
    bindMenuAction('zoom-in',       () => { zoomIn();    if (zoomEl) zoomEl.textContent = `${getCurrentZoomPct()}%`; });
    bindMenuAction('zoom-out',      () => { zoomOut();   if (zoomEl) zoomEl.textContent = `${getCurrentZoomPct()}%`; });
    bindMenuAction('zoom-reset',    () => { zoomReset(); if (zoomEl) zoomEl.textContent = `${getCurrentZoomPct()}%`; });

    // Compile button
    document.getElementById('compile-btn')?.addEventListener('click', () => {
        triggerCompile(editor, preview, frame);
    });

    // Auto-compile checkbox (persisted)
    const autoCompile = document.getElementById('auto-compile');
    if (autoCompile) {
        autoCompile.checked = localStorage.getItem('auto-compile') !== 'false';
        autoCompile.addEventListener('change', () => {
            localStorage.setItem('auto-compile', String(autoCompile.checked));
        });
    }
}

// ── Helpers ───────────────────────────────────────────────────────

function bindMenuAction(id, fn) {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        fn();
    });
}

/** Force an immediate preview compile by programmatically running the Tauri command. */
async function triggerCompile(editor, preview, frame) {
    const { invoke } = window.__TAURI__.core;
    try {
        const html = await invoke('render_preview', { source: editor.getValue() });
        // Clear any error
        preview.querySelector('.preview-error')?.remove();
        frame.style.display = '';
        frame.contentDocument.open();
        frame.contentDocument.write(html);
        frame.contentDocument.close();

        writeToConsole('success', 'Compilation réussie.');
    } catch (err) {
        writeToConsole('error', String(err));
        showConsole();
        frame.style.display = 'none';
        preview.querySelector('.preview-error')?.remove();
        const div = document.createElement('div');
        div.className = 'preview-error';
        div.textContent = String(err);
        preview.appendChild(div);
    }
}

main();

