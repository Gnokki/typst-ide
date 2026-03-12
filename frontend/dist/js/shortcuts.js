/**
 * Keyboard shortcuts module
 *
 * Registers global shortcuts that complement Monaco's built-in ones
 * Monaco handles: Ctrl+Z/Y, Ctrl+F, Ctrl+H, Ctrl+G, Ctrl+/ (comment)
 *
 * We handle:
 *   Ctrl+B          : Bold (*text*)
 *   Ctrl+I          : Italic (_text_)
 *   Ctrl+U          : Underline (#underline[text])
 *   Ctrl+R          : Trigger compilation
 *   Ctrl+E          : Toggle console
 *   Ctrl+Shift+N    : New project
 *   Ctrl+Shift+O    : Open project
 *   Ctrl+Shift++    : Zoom in
 *   Ctrl+Shift+-    : Zoom out
 *   Ctrl+0          : Zoom reset
 */

import { toggleConsole } from "./toolbar.js";
import {
  webviewZoomIn,
  webviewZoomOut,
  webviewZoomReset,
} from "./webview-zoom.js";

/**
 * @param {object} opts
 * @param {import('monaco-editor').editor.IStandaloneCodeEditor} opts.editor
 * @param {() => Promise<void>} opts.onCompile
 * @param {() => void} opts.onEditorZoomIn
 * @param {() => void} opts.onEditorZoomOut
 * @param {() => void} opts.onEditorZoomReset
 * @param {() => void} opts.onNewProject
 * @param {() => void} opts.onOpenProject
 */
export function registerShortcuts({
  editor,
  onCompile,
  onEditorZoomIn,
  onEditorZoomOut,
  onEditorZoomReset,
  onNewProject,
  onOpenProject,
}) {
  // ## Monaco custom actions ########################################
  const KM = monaco.KeyMod;
  const KC = monaco.KeyCode;

  editor.addAction({
    id: "typst-bold",
    label: "Gras",
    keybindings: [KM.CtrlCmd | KC.KeyB],
    run: (ed) => wrapSelection(ed, "*", "*"),
  });

  editor.addAction({
    id: "typst-italic",
    label: "Italique",
    keybindings: [KM.CtrlCmd | KC.KeyI],
    run: (ed) => wrapSelection(ed, "_", "_"),
  });

  editor.addAction({
    id: "typst-underline",
    label: "Souligné",
    keybindings: [KM.CtrlCmd | KC.KeyU],
    run: (ed) => wrapSelection(ed, "#underline[", "]"),
  });

  editor.addAction({
    id: "editor-comment",
    label: "Commenter",
    keybindings: [KM.CtrlCmd | KM.Shift | KC.Slash, KM.CtrlCmd | KC.Slash],
    run: (ed) => ed.getAction("editor.action.commentLine")?.run(),
  });

  editor.addAction({
    id: "typst-compile",
    label: "Compiler",
    keybindings: [KM.CtrlCmd | KC.KeyR],
    run: () => onCompile(),
  });

  editor.addAction({
    id: "toggle-console",
    label: "Basculer la console",
    keybindings: [KM.CtrlCmd | KC.KeyE],
    run: () => toggleConsole(),
  });

  editor.addAction({
    id: "webview-zoom-in",
    label: "Agrandir",
    keybindings: [KM.CtrlCmd | KM.Shift | KC.Equal],
    run: () => webviewZoomIn(),
  });

  editor.addAction({
    id: "webview-zoom-out",
    label: "Rétrécir",
    keybindings: [KM.CtrlCmd | KM.Shift | KC.Minus, KM.CtrlCmd | KM.Shift | KC.Digit6],
    run: () => webviewZoomOut(),
  });

  editor.addAction({
    id: "webview-zoom-reset",
    label: "Taille normale",
    keybindings: [KM.CtrlCmd | KM.Shift | KC.Digit0],
    run: () => webviewZoomReset(),
  });

  editor.addAction({
    id: "editor-zoom-in",
    label: "Agrandir l'éditeur",
    keybindings: [KM.CtrlCmd | KM.Alt | KC.Equal],
    run: () => onEditorZoomIn(),
  });

  editor.addAction({
    id: "editor-zoom-out",
    label: "Rétrécir l'éditeur",
    keybindings: [KM.CtrlCmd | KM.Alt | KC.Minus, KM.CtrlCmd | KM.Alt | KC.Digit2],
    run: () => onEditorZoomOut(),
  });

  editor.addAction({
    id: "editor-zoom-reset",
    label: "Reset éditeur",
    keybindings: [KM.CtrlCmd | KM.Alt | KC.Digit0],
    run: () => onEditorZoomReset(),
  });

  // ## Global shortcuts (not captured by Monaco) ####################
  document.addEventListener(
    "keydown",
    (e) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyN") {
        e.preventDefault();
        onNewProject();
      }
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === "KeyO") {
        e.preventDefault();
        onOpenProject();
      }
      // Ctrl+/ : WebKitGTK swallows this before Monaco sees it, so we handle it here
      if (
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        (e.code === "Slash" || e.key === "/")
      ) {
        e.preventDefault();
        editor.getAction("editor.action.commentLine")?.run();
      }
    },
    true,
  );
}

// ## Helpers #######################################################

/**
 * Wrap the current selection (or insert empty markers at cursor) with prefix/suffix
 * @param {import('monaco-editor').editor.IStandaloneCodeEditor} ed
 * @param {string} prefix
 * @param {string} suffix
 */
function wrapSelection(ed, prefix, suffix) {
  const model = ed.getModel();
  const selection = ed.getSelection();
  if (!model || !selection) return;

  const selectedText = model.getValueInRange(selection);
  const replacement = selectedText
    ? `${prefix}${selectedText}${suffix}`
    : `${prefix}${suffix}`;

  ed.executeEdits("wrap", [
    {
      range: selection,
      text: replacement,
      forceMoveMarkers: true,
    },
  ]);

  // If no selection, place cursor between prefix and suffix
  if (!selectedText) {
    const pos = ed.getPosition();
    if (pos) {
      ed.setPosition({
        lineNumber: pos.lineNumber,
        column: pos.column - suffix.length,
      });
    }
  }

  ed.focus();
}
