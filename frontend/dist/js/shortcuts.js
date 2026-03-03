/**
 * Keyboard shortcuts module.
 *
 * Registers global shortcuts that complement Monaco's built-in ones.
 * Monaco handles: Ctrl+Z/Y, Ctrl+F, Ctrl+H, Ctrl+G, Ctrl+/ (comment)
 *
 * We handle:
 *   Ctrl+B          → Bold (*text*)
 *   Ctrl+I          → Italic (_text_)
 *   Ctrl+U          → Underline (#underline[text])
 *   Ctrl+R          → Trigger compilation
 *   Ctrl+E          → Toggle console
 *   Ctrl+Shift+N    → New project
 *   Ctrl+Shift+O    → Open project
 *   Ctrl+Shift++    → Zoom in
 *   Ctrl+Shift+-    → Zoom out
 *   Ctrl+0          → Zoom reset
 */

import { toggleConsole } from './toolbar.js';

/**
 * @param {object} opts
 * @param {import('monaco-editor').editor.IStandaloneCodeEditor} opts.editor
 * @param {() => Promise<void>} opts.onCompile
 * @param {() => void} opts.onZoomIn
 * @param {() => void} opts.onZoomOut
 * @param {() => void} opts.onZoomReset
 * @param {() => void} opts.onNewProject
 * @param {() => void} opts.onOpenProject
 */
export function registerShortcuts({ editor, onCompile, onZoomIn, onZoomOut, onZoomReset, onNewProject, onOpenProject }) {
    // ── Monaco custom actions ────────────────────────────────────────
    const KM = monaco.KeyMod;
    const KC = monaco.KeyCode;

    editor.addAction({
        id: 'typst-bold',
        label: 'Gras',
        keybindings: [KM.CtrlCmd | KC.KeyB],
        run: (ed) => wrapSelection(ed, '*', '*'),
    });

    editor.addAction({
        id: 'typst-italic',
        label: 'Italique',
        keybindings: [KM.CtrlCmd | KC.KeyI],
        run: (ed) => wrapSelection(ed, '_', '_'),
    });

    editor.addAction({
        id: 'typst-underline',
        label: 'Souligné',
        keybindings: [KM.CtrlCmd | KC.KeyU],
        run: (ed) => wrapSelection(ed, '#underline[', ']'),
    });

    editor.addAction({
        id: 'typst-compile',
        label: 'Compiler',
        keybindings: [KM.CtrlCmd | KC.KeyR],
        run: () => onCompile(),
    });

    editor.addAction({
        id: 'toggle-console',
        label: 'Basculer la console',
        keybindings: [KM.CtrlCmd | KC.KeyE],
        run: () => toggleConsole(),
    });

    editor.addAction({
        id: 'zoom-in',
        label: 'Agrandir',
        keybindings: [KM.CtrlCmd | KM.Shift | KC.Equal],
        run: () => onZoomIn(),
    });

    editor.addAction({
        id: 'zoom-out',
        label: 'Rétrécir',
        keybindings: [KM.CtrlCmd | KM.Shift | KC.Minus],
        run: () => onZoomOut(),
    });

    editor.addAction({
        id: 'zoom-reset',
        label: 'Taille normale',
        keybindings: [KM.CtrlCmd | KC.Digit0],
        run: () => onZoomReset(),
    });

    // ── Global shortcuts (not captured by Monaco) ────────────────────
    document.addEventListener('keydown', (e) => {
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyN') {
            e.preventDefault();
            onNewProject();
        }
        if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'KeyO') {
            e.preventDefault();
            onOpenProject();
        }
    }, true);
}

// ── Helpers ───────────────────────────────────────────────────────

/**
 * Wrap the current selection (or insert empty markers at cursor) with prefix/suffix.
 * @param {import('monaco-editor').editor.IStandaloneCodeEditor} ed
 * @param {string} prefix
 * @param {string} suffix
 */
function wrapSelection(ed, prefix, suffix) {
    const model     = ed.getModel();
    const selection = ed.getSelection();
    if (!model || !selection) return;

    const selectedText = model.getValueInRange(selection);
    const replacement  = selectedText
        ? `${prefix}${selectedText}${suffix}`
        : `${prefix}${suffix}`;

    ed.executeEdits('wrap', [{
        range: selection,
        text: replacement,
        forceMoveMarkers: true,
    }]);

    // If no selection, place cursor between prefix and suffix
    if (!selectedText) {
        const pos = ed.getPosition();
        if (pos) {
            ed.setPosition({ lineNumber: pos.lineNumber, column: pos.column - suffix.length });
        }
    }

    ed.focus();
}
