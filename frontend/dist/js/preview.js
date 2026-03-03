/**
 * Preview panel — compiles Typst source and renders it in the iframe.
 *
 * Exports a single `initPreview()` function that wires up the editor textarea
 * to the preview iframe via the Tauri `render_preview` command.
 */

const { invoke } = window.__TAURI__.core;

/** @type {number} Incremented each time a new compilation is triggered. */
let currentGeneration = 0;

/** @type {ReturnType<typeof setTimeout>|undefined} */
let debounceTimer;

/**
 * Shows an error message in the preview panel.
 * @param {HTMLElement} preview
 * @param {HTMLIFrameElement} frame
 * @param {string} message
 */
function showError(preview, frame, message) {
    frame.style.display = 'none';
    preview.querySelector('.error')?.remove();
    const div = document.createElement('div');
    div.className = 'error';
    div.textContent = message;
    preview.appendChild(div);
}

/**
 * Clears any visible error and restores the iframe.
 * @param {HTMLElement} preview
 * @param {HTMLIFrameElement} frame
 */
function clearError(preview, frame) {
    preview.querySelector('.error')?.remove();
    frame.style.display = '';
}

/**
 * Compiles `source` and writes the result into `frame`.
 * Stale results (superseded by a newer call) are silently dropped.
 * @param {string} source
 * @param {HTMLElement} preview
 * @param {HTMLIFrameElement} frame
 */
async function compile(source, preview, frame) {
    const generation = ++currentGeneration;
    try {
        const html = await invoke('render_preview', { source });
        if (generation !== currentGeneration) return;
        clearError(preview, frame);
        frame.contentDocument.open();
        frame.contentDocument.write(html);
        frame.contentDocument.close();
    } catch (error) {
        if (generation !== currentGeneration) return;
        showError(preview, frame, String(error));
    }
}

/**
 * Initialises the preview panel.
 * Wires the editor to the iframe and triggers an initial compilation.
 *
 * @param {object} opts
 * @param {() => string}    opts.getSource   - Returns the current editor content.
 * @param {(cb: () => void) => void} opts.onChange - Calls `cb` whenever the content changes.
 * @param {HTMLElement}     opts.preview
 * @param {HTMLIFrameElement} opts.frame
 * @param {number}          [opts.debounceMs=100]
 */
export function initPreview({ getSource, onChange, preview, frame, debounceMs = 100 }) {
    const run = () => compile(getSource(), preview, frame);

    onChange(() => {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(run, debounceMs);
    });

    // Initial render
    run();
}
