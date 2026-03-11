/**
 * Application entry point 
 *  wires all modules together
 */

import { createEditor, setEditorTheme, zoomIn, zoomOut, zoomReset, getCurrentZoomPct, getCurrentFontFamily, setEditorFontFamily, getEditor } from './editor.js';
import { initPreview, zoomPreviewIn, zoomPreviewOut, zoomPreviewReset, getPreviewZoom, scrollToJumpPos, fitPreviewToWidth } from './preview.js';
import { initToolbar, initTheme, writeToConsole, showConsole } from './toolbar.js';
import { registerShortcuts } from './shortcuts.js';
import { unsavedBtnUpdate, openProjectBtnUpdate, createNewProject, openProject, exportPDF, scheduleAutosave, notifySaveIndicator, getCurrentProject } from './project.js';
import { openModal, showPrompt } from './modal.js';
import { openNotepad } from './notepad.js';
import { openHistory } from './history.js';

async function main() {
    if (!window.__TAURI__) {
        document.body.innerHTML = '<p style="color:red;padding:1rem">Tauri API non disponible.</p>';
        return;
    }

    // ## Bootstrap UI #############################################
    initToolbar();

    // ## Monaco editor #############################################
    const container = document.getElementById('typst-editor');
    const editor    = await createEditor(container);
    window.__typstEditor = editor;

    initTheme((theme) => setEditorTheme(theme));

    // Update status-bar zoom on load
    updateZoomPreview();

    // ## Preview ####################################################
    const preview = document.getElementById('preview');
    const frame   = document.getElementById('preview-frame');

    initPreview({
        getSource: () => editor.getValue(),
        onChange:  (cb) => editor.onDidChangeModelContent(cb),
        getCursor: () => editor.getPosition(),
        preview,
        frame,
        onDiagnostics: (diagnostics) => applyMonacoMarkers(editor, diagnostics),
        autoFit: true,
        onZoomChange: updateZoomPreview,
    });

    // ## Autosave ###################################################
    editor.onDidChangeModelContent(() => {
        notifySaveIndicator(true);
        scheduleAutosave(editor.getValue());
    });

    // ## Shortcuts ##################################################
    const compile = () => {
        // Trigger a manual compile by forcing the preview to re-run immediately
        const event = new Event('input', { bubbles: true });
        // We call preview's compile directly by dispatching through the editor wrapper
        frame.dispatchEvent(new CustomEvent('force-compile', { bubbles: true }));
    };

    registerShortcuts({
        editor,
        onCompile:    () => triggerCompile(editor, preview, frame),
        onZoomIn:     () => { zoomIn()},
        onZoomOut:    () => { zoomOut()},
        onZoomReset:  () => { zoomReset()},
        onNewProject: () => createNewProject((content) => editor.setValue(content)),
        onOpenProject:() => openProject((content) => editor.setValue(content)),
        onExportPDF:   () => exportPDF(editor.getValue()),
    });

    // ## Toolbar menu actions #######################################
    bindMenuAction('new-project',   () => createNewProject((content) => editor.setValue(content)));
    bindMenuAction('open-project',  () => openProject((content) => editor.setValue(content)));
    bindMenuAction('action-undo',   () => editor.trigger('', 'undo', null));
    bindMenuAction('action-redo',   () => editor.trigger('', 'redo', null));
    bindMenuAction('action-search', () => editor.getAction('actions.find')?.run());
    bindMenuAction('action-replace',() => editor.getAction('editor.action.startFindReplaceAction')?.run());
    bindMenuAction('action-goto',   () => editor.getAction('editor.action.gotoLine')?.run());
    bindMenuAction('action-comment',() => editor.getAction('editor.action.commentLine')?.run());

    // Zoom buttons in toolbar
    bindMenuAction('zoom-in',       () => { zoomIn()});
    bindMenuAction('zoom-out',      () => { zoomOut()});
    bindMenuAction('zoom-reset',    () => { zoomReset()});

    // Save project
    bindMenuAction('unsaved-btn',   () => createNewProject((content) => editor.setValue(content), editor.getValue()));

    // Open history modal
    bindMenuAction('open-project-btn',   () => openHistory());

    // Notepad buttons
    bindMenuAction('notepad-btn', () => { openNotepad(); });

    // Change style of text
    bindMenuAction('bold-btn', () => getEditor().getAction('typst-bold')?.run());
    bindMenuAction('italic-btn', () => getEditor().getAction('typst-italic')?.run());
    bindMenuAction('underline-btn', () => getEditor().getAction('typst-underline')?.run());

    // Zoom input fields
    bindMenuAction("zoom-preview-in-btn",   () => { zoomPreviewIn();                      updateZoomPreview(); });
    bindMenuAction("zoom-preview-out-btn",  () => { zoomPreviewOut();                     updateZoomPreview(); });
    bindMenuAction("zoom-preview-reset-btn",() => { fitPreviewToWidth(preview, frame);    updateZoomPreview(); });

    // Compile button
    document.getElementById('compile-btn')?.addEventListener('click', () => {
        triggerCompile(editor, preview, frame);
    });

    // Save PDF button
    document.getElementById('save-btn')?.addEventListener('click', () => {
        savePdf(editor);
    });

    // Auto-compile checkbox (persisted)
    const autoCompile = document.getElementById('auto-compile');
    if (autoCompile) {
        autoCompile.checked = localStorage.getItem('auto-compile') !== 'false';
        autoCompile.addEventListener('change', () => {
            localStorage.setItem('auto-compile', String(autoCompile.checked));
        });
    }

    // Change editor font family
    document.getElementById('editor-fontfamily-btn')?.addEventListener('click', async () => {
        const { invoke } = window.__TAURI__.core;
        const current = getCurrentFontFamily();
        const newFont = await showPrompt({
            title: 'Changer la police de l\'éditeur',
            label: 'Nom de la police (ex: "Fira Code", "JetBrains Mono", "Cascadia Mono")',
            placeholder: current || 'Fira Code',
            validate: async (v) => {
                const exists = await invoke('font_exists', { name: v });
                return exists || `Police "${v}" introuvable sur cette machine.`;
            },
        });
        if (newFont !== null) setEditorFontFamily(newFont);
    });

    unsavedBtnUpdate();
    openProjectBtnUpdate();

    // TO DELETE : ONLY TO TEST MODALS
    // link bold button to a modal example
    // document.getElementById('bold-btn').addEventListener('click', () => {
    //     import('./modal.js').then(({ openModal }) => {
    //         openModal({
    //             title: 'Example Modal',
    //             width: '600px',
    //             body: `
    //                 <p>This is an example modal. You can put any content here.</p>
    //                 <input class="w-full" placeholder="Type something..." />
    //             `,
    //             buttons: [
    //                 { label: 'OK', primary: true, onClick: (close) => { alert('OK clicked'); close(); } },
    //                 { label: 'Cancel', onClick: (close) => { alert('Cancel clicked'); close(); } },
    //             ],
    //         });
    //     });
    // });
}

// ## Helpers #######################################################

function bindMenuAction(id, fn) {
    document.getElementById(id)?.addEventListener('click', (e) => {
        e.preventDefault();
        fn();
    });
}

function updateZoomPreview() {
    const zoomEl = document.getElementById('zoom-preview-input');
    if (zoomEl) zoomEl.value = getPreviewZoom();
}

// Force an immediate preview compile by programmatically running the Tauri command
async function triggerCompile(editor, preview, frame) {
    const { invoke } = window.__TAURI__.core;
    try {
        const result = await invoke('render_preview', {
            source: editor.getValue(),
            root:   getCurrentProject()?.path ?? null,
            cursor: editor.getPosition(),
        });
        const { html, jump_pos: jumpPos } = result;
        applyMonacoMarkers(editor, []);
        preview.querySelector('.preview-error')?.remove();
        frame.style.display = '';
        const savedScroll = preview.scrollTop;
        frame.contentDocument.open();
        frame.contentDocument.write(html);
        frame.contentDocument.close();
        preview.scrollTop = savedScroll;
        if (jumpPos) scrollToJumpPos(frame, preview, jumpPos);
        writeToConsole('success', 'Compilation successful');
    } catch (err) {
        const diagnostics = Array.isArray(err) ? err : [];
        applyMonacoMarkers(editor, diagnostics);
        const msg = diagnostics.length > 0
            ? diagnostics.map(d => {
                const loc = d.line != null ? ` (line ${d.line}, col ${d.column})` : '';
                const hint = d.hints?.length ? `\n  > ${d.hints.join('\n  > ')}` : '';
                return `${d.severity === 'error' ? 'Error' : 'Warn'} ${d.message}${loc}${hint}`;
              }).join('\n')
            : String(err);
        writeToConsole('error', msg);
        showConsole();
        frame.style.display = 'none';
        preview.querySelector('.preview-error')?.remove();
        const div = document.createElement('div');
        div.className = 'preview-error';
        div.textContent = diagnostics.length > 0 ? diagnostics.map(d => d.message).join('\n') : String(err);
        preview.appendChild(div);
    }
}

// Sets Monaco editor markers (squiggly underlines) from Typst DiagnosticInfo[]
function applyMonacoMarkers(editor, diagnostics) {
    const model = editor.getModel();
    if (!model) return;
    const markers = diagnostics.map(d => ({
        severity: d.severity === 'error'
            ? monaco.MarkerSeverity.Error
            : monaco.MarkerSeverity.Warning,
        message: d.hints?.length
            ? `${d.message}\nHint: ${d.hints.join('\n')}`
            : d.message,
        startLineNumber: d.line     ?? 1,
        startColumn:     d.column   ?? 1,
        endLineNumber:   d.end_line ?? d.line   ?? 1,
        endColumn:       d.end_column ?? (d.column != null ? d.column + 1 : 2),
    }));
    monaco.editor.setModelMarkers(model, 'typst', markers);
}

// Export current source to PDF, asking for a path on first save
async function savePdf(editor) {
    const { invoke } = window.__TAURI__.core;
    try {
        let path = sessionStorage.getItem('pdf-export-path');
        if (!path) {
            path = await invoke('pick_pdf_path');
            if (!path) return; // user cancelled
            sessionStorage.setItem('pdf-export-path', path);
        }
        await invoke('export_pdf', { source: editor.getValue(), path, root: getCurrentProject()?.path ?? null });
        writeToConsole('success', `PDF exporté : ${path}`);
    } catch (err) {
        writeToConsole('error', String(err));
        showConsole();
    }
}

main();

// ## Debug helpers (dev only) ####################################
// window.__debug = { getCurrentProject };

