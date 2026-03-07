/**
 * Preview panel 
 *  compiles Typst source and renders it in the iframe
 *
 * Exports a single `initPreview()` function that wires up the editor textarea
 * to the preview iframe via the Tauri `render_preview` command
 */

const { invoke } = window.__TAURI__.core;

/** @type {number} Incremented each time a new compilation is triggered */
let currentGeneration = 0;

/** @type {ReturnType<typeof setTimeout>|undefined} */
let debounceTimer;

/**
 * Shows an error message in the preview panel
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
 * Clears any visible error and restores the iframe
 * @param {HTMLElement} preview
 * @param {HTMLIFrameElement} frame
 */
function clearError(preview, frame) {
    preview.querySelector('.error')?.remove();
    frame.style.display = '';
}

/**
 * Compiles `source` and writes the result into `frame`
 * Stale results (superseded by a newer call) are silently dropped
 * @param {string} source
 * @param {HTMLElement} preview
 * @param {HTMLIFrameElement} frame
 */
let previewZoom = 100;
let _lastHtml = '';

// Scale width/height attributes on all <svg> tags — affects real layout, scroll works
function scaleSvgs(html, scale) {
    if (scale === 1) return html;
    return html.replace(/<svg([^>]*)>/g, (_, attrs) => {
        const scaled = attrs
            .replace(/\bwidth="([\d.]+)(pt|px)?"/g,  (_, n, u = '') => `width="${parseFloat(n) * scale}${u}"`)
            .replace(/\bheight="([\d.]+)(pt|px)?"/g,  (_, n, u = '') => `height="${parseFloat(n) * scale}${u}"`);
        return `<svg${scaled}>`;
    });
}

function writeHtml(frame, html) {
    // Reset so scrollWidth/scrollHeight are accurate
    frame.style.width  = '100%';
    frame.style.height = '100%';
    frame.contentDocument.open();
    frame.contentDocument.write(scaleSvgs(html, previewZoom / 100));
    frame.contentDocument.close();
    // Expand iframe to fit actual content so parent can scroll
    const doc = frame.contentDocument;
    frame.style.width  = doc.documentElement.scrollWidth  + 'px';
    frame.style.height = doc.documentElement.scrollHeight + 'px';
    const zoomInput = document.getElementById('zoom-input');
    if (zoomInput) zoomInput.value = previewZoom;
}

async function compile(source, preview, frame, onDiagnostics) {
    const generation = ++currentGeneration;
    try {
        const html = await invoke('render_preview', { source });
        if (generation !== currentGeneration) return;
        _lastHtml = html;
        clearError(preview, frame);
        writeHtml(frame, html);
        onDiagnostics?.([]); // clear markers on success
    } catch (error) {
        if (generation !== currentGeneration) return;
        const diagnostics = Array.isArray(error) ? error : [];
        onDiagnostics?.(diagnostics);
        const msg = diagnostics.length > 0
            ? diagnostics.map(d => {
                // const loc = d.line != null ? ` (ligne ${d.line}, col ${d.column})` : '';
                return `${d.message}${loc}`;
              }).join('\n')
            : String(error);
        showError(preview, frame, msg);
    }
}

/**
 * Initialises the preview panel
 * Wires the editor to the iframe and triggers an initial compilation
 *
 * @param {object} opts
 * @param {() => string}    opts.getSource Returns the current editor content
 * @param {(cb: () => void) => void} opts.onChange Calls `cb` whenever the content changes
 * @param {HTMLElement}     opts.preview
 * @param {HTMLIFrameElement} opts.frame
 * @param {number}          [opts.debounceMs=100]
 */
export function initPreview({ getSource, onChange, preview, frame, debounceMs = 100, onDiagnostics }) {
    const run = () => compile(getSource(), preview, frame, onDiagnostics);

    onChange(() => {
        const autoCompile = document.getElementById('auto-compile');
        if (autoCompile && !autoCompile.checked) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(run, debounceMs);
    });

    // Initial render
    run();
}

export function zoomPreviewIn()    { setPreviewZoom(previewZoom + 10); }
export function zoomPreviewOut()   { setPreviewZoom(previewZoom - 10); }
export function zoomPreviewReset() { setPreviewZoom(100); }
export function getPreviewZoom() { return previewZoom; }

function setPreviewZoom(value) {
    previewZoom = Math.min(400, Math.max(20, value));
    const frame = document.getElementById('preview-frame');
    const preview = document.getElementById('preview');
    if (frame && preview && _lastHtml) {
        clearError(preview, frame);
        writeHtml(frame, _lastHtml);
    }
}