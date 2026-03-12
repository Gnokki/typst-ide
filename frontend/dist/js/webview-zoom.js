/**
 * WebView zoom module
 *
 * Zooms the entire Tauri WebView (not just the Monaco editor font size).
 * Factor 1.0 = 100%, 1.5 = 150%, etc.
 * The last zoom level is persisted in localStorage.
 */

const ZOOM_STEP    = 0.1;
const ZOOM_MIN     = 0.5;
const ZOOM_MAX     = 3.0;
const ZOOM_DEFAULT = 1.0;
const STORAGE_KEY  = 'webview-zoom';

let _factor = parseFloat(localStorage.getItem(STORAGE_KEY) ?? ZOOM_DEFAULT);
if (isNaN(_factor) || _factor < ZOOM_MIN || _factor > ZOOM_MAX) {
    _factor = ZOOM_DEFAULT;
}

async function _apply() {
    const { invoke } = window.__TAURI__.core;
    await invoke('set_webview_zoom', { factor: _factor });
    localStorage.setItem(STORAGE_KEY, String(_factor));
}

/** Apply the persisted zoom level on startup */
export async function initWebviewZoom() {
    await _apply();
}

export async function webviewZoomIn() {
    _factor = Math.min(parseFloat((_factor + ZOOM_STEP).toFixed(2)), ZOOM_MAX);
    await _apply();
}

export async function webviewZoomOut() {
    _factor = Math.max(parseFloat((_factor - ZOOM_STEP).toFixed(2)), ZOOM_MIN);
    await _apply();
}

export async function webviewZoomReset() {
    _factor = ZOOM_DEFAULT;
    await _apply();
}

export function getWebviewZoomPct() {
    return Math.round(_factor * 100);
}
