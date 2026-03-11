/**
 * Preview panel 
 *  compiles Typst source and renders it in the iframe
 *
 * Exports a single `initPreview()` function that wires up the editor textarea
 * to the preview iframe via the Tauri `render_preview` 
 * 
 * ## API
 * initPreview(opts)
 *  * opts.getSource() -> string: returns the current editor content
 *  * opts.onChange(cb) -> void: registers `cb` to be called whenever the source changes
 *  * opts.preview: HTMLElement container for the preview (used to show error messages)
 *  * opts.frame: HTMLIFrameElement where the compiled HTML should be written
 *  * opts.debounceMs: number of milliseconds to wait after a change before recompiling (default: 100)
 * 
 * showError(preview, frame, message) -> void
 *  * Displays the given error message in the preview panel, hiding the iframe
 * 
 * clearError(preview, frame) -> void
 *  * Clears any visible error and restores the iframe
 * 
 * compile(source, preview, frame) -> Promise<void>
 *  * Compiles the given source and writes the result into `frame`
 *  * Shows an error message on failure. Stale results (superseded by a newer call) are silently dropped.
 * 
 * zoomPreviewIn/Out/Reset() -> void: 
 *  * Adjust the zoom level of the preview iframe
 * 
 * getPreviewZoom() -> number: 
 *  * Returns the current zoom level as a percentage (e.g. 100)
 * 
 * setPreviewZoom(value) -> void: 
 *  * Sets the zoom level, clamped between 20 and 400
 */

const { invoke } = window.__TAURI__.core;
import { getCurrentProject } from './project.js';

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
export function initPreview({ getSource, onChange, preview, frame, debounceMs = 100, onDiagnostics, getCursor, autoFit = true, onZoomChange }) {
    let firstRender = true;

    const run = async () => {
        await compile(getSource(), preview, frame, onDiagnostics, getCursor);
        if (firstRender && autoFit) {
            firstRender = false;
            fitPreviewToWidth(preview, frame);
            onZoomChange?.();
        }
    };

    onChange(() => {
        const autoCompile = document.getElementById('auto-compile');
        if (autoCompile && !autoCompile.checked) return;
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(run, debounceMs);

    });

    // Initial render
    run();
}

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
let _lastJumpPos = null;

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

/**
 * Scrolls `previewContainer` so that the rendered preview position `jumpPos`
 * (returned by the Rust `jump_from_cursor` call) is visible near the top third.
 *
 * @param {HTMLIFrameElement} frame
 * @param {HTMLElement} previewContainer  The scrollable .preview-content div
 * @param {{ page: number, x: number, y: number }} jumpPos  Typst coordinates (pt, 1-based page)
 */
export function scrollToJumpPos(frame, previewContainer, jumpPos) {
    if (!jumpPos || !frame.contentDocument) return;
    const { page, y } = jumpPos;
    const pages = frame.contentDocument.querySelectorAll('.page');
    if (!pages || page < 1 || page > pages.length) return;
    const pageEl = pages[page - 1];
    // Standard CSS pt → px: 1pt = 96/72 CSS px. The zoom scale is applied on top.
    const PX_PER_PT = 96 / 72;
    const scale = previewZoom / 100;
    const yPx = y * PX_PER_PT * scale;
    const scrollTarget = pageEl.offsetTop + yPx - previewContainer.clientHeight * 0.3;
    previewContainer.scrollTop = Math.max(0, scrollTarget);
}

async function compile(source, preview, frame, onDiagnostics, getCursor) {
    const generation = ++currentGeneration;
    const cursor = getCursor?.() ?? null;
    try {
        const result = await invoke('render_preview', {
            source,
            root:   getCurrentProject()?.path ?? null,
            cursor,
        });
        if (generation !== currentGeneration) return;
        const { html, jump_pos: jumpPos } = result;
        _lastHtml = html;
        _lastJumpPos = jumpPos ?? null;
        const savedScroll = preview.scrollTop;
        clearError(preview, frame);
        writeHtml(frame, html);
        // Restore saved scroll synchronously to prevent flash to top,
        // then override with jump position if available.
        preview.scrollTop = savedScroll;
        if (jumpPos) scrollToJumpPos(frame, preview, jumpPos);
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


export function zoomPreviewIn()    { setPreviewZoom(previewZoom + 10); }
export function zoomPreviewOut()   { setPreviewZoom(previewZoom - 10); }
export function zoomPreviewReset() { setPreviewZoom(100); }
export function getPreviewZoom() { return previewZoom; }

/**
 * Fits the preview zoom so the page fills the available pane width.
 * Safe to call any time after the first render.
 */
export function fitPreviewToWidth(previewEl, frameEl) {
    const preview = previewEl ?? document.getElementById('preview');
    const frame   = frameEl   ?? document.getElementById('preview-frame');
    if (!frame || !preview || !_lastHtml) return;

    // frame.offsetWidth is the content width at the current previewZoom.
    // Dividing back gives the natural (zoom=100) width in CSS px.
    const contentWidth = frame.offsetWidth;
    if (contentWidth === 0) return;

    const naturalWidth = contentWidth / (previewZoom / 100);
    // Leave a small margin so the page doesn't clip against the scrollbar
    const available = preview.clientWidth - 16;
    if (available <= 0) return;

    setPreviewZoom(Math.floor((available / naturalWidth) * 100));
}

export function setPreviewZoom(value) {
    previewZoom = Math.min(400, Math.max(20, value));
    const frame = document.getElementById('preview-frame');
    const preview = document.getElementById('preview');
    if (frame && preview && _lastHtml) {
        const savedScroll = preview.scrollTop;
        clearError(preview, frame);
        writeHtml(frame, _lastHtml);
        preview.scrollTop = savedScroll;
        if (_lastJumpPos) scrollToJumpPos(frame, preview, _lastJumpPos);
    }
}