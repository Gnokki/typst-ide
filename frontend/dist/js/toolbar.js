/**
 * Navbar / toolbar module
 *
 * - Wires up dropdown open/close behaviour
 * - Wires each menu item to its action
 * - Theme toggle (light ↔ dark)
 * - Output console toggle
 * - Resizable split panel
 */

import { showToast } from './toast.js';
import { setBtnIcon } from './structures.js';

// ## Dropdown behaviour ############################################

export function initToolbar() {
    initDropdowns();
    initConsoleToggle();
    initResizeHandle();
}

function initDropdowns() {
    const items = document.querySelectorAll('.menu-item');

    items.forEach(item => {
        const trigger = item.querySelector('.menu-trigger');
        if (!trigger) return;

        trigger.addEventListener('click', (e) => {
            e.stopPropagation();
            const isOpen = item.classList.contains('open');
            closeAll();
          if (!isOpen) {
            item.classList.add('open');
            if (item.id === "structures-menu") setBtnIcon(true);
          };
        });

        // If the mouse moves to another menu item while one is open, switch immediately
        trigger.addEventListener('mouseenter', () => {
            const anyOpen = [...items].some(i => i.classList.contains('open'));
            if (anyOpen && !item.classList.contains('open')) {
                closeAll();
                item.classList.add('open');
            }
        });
    });

    // Close on outside click or Escape
    document.addEventListener('click', closeAll);
    document.addEventListener('keydown', e => { if (e.key === 'Escape') closeAll(); });
}

function closeAll() {
  document.querySelectorAll('.menu-item.open').forEach(i => {
    i.classList.remove('open')
      if (i.id === "structures-menu") setBtnIcon(false);
  });
}

/** Close all dropdowns and optionally re-focus the editor */
export function closeDropdowns() { closeAll(); }

// ## Theme #########################################################

/**
 * Register the theme toggle and return a getter for the current theme
 * @param {(theme: 'dark'|'light') => void} onThemeChange
 */
export function initTheme(onThemeChange) {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    const saved = localStorage.getItem('theme') ?? 'light';
    applyTheme(saved, toggle, onThemeChange);

    toggle.addEventListener('change', () => {
        const theme = toggle.checked ? 'light' : 'dark';
        localStorage.setItem('theme', theme);
        applyTheme(theme, toggle, onThemeChange);
    });
}

function applyTheme(theme, toggle, cb) {
    document.documentElement.setAttribute('data-theme', theme);
    toggle.checked = theme === 'light';
    cb?.(theme);
}

// ## Output console ################################################

export function initConsoleToggle() {
    const btn   = document.getElementById('close-console');
    const panel = document.getElementById('output-console');
    btn?.addEventListener('click', () => hideConsole());

    // Menu item
    document.getElementById('toggle-console')?.addEventListener('click', () => {
        closeAll();
        toggleConsole();
    });
}

export function toggleConsole() {
    const panel = document.getElementById('output-console');
    panel?.classList.toggle('hidden');
}

export function showConsole() {
    document.getElementById('output-console')?.classList.remove('hidden');
}

export function hideConsole() {
    document.getElementById('output-console')?.classList.add('hidden');
}

/**
 * Write a message to the output console
 * @param {'success'|'error'|'info'} type
 * @param {string} text
 */
const MAX_LOG_ENTRIES = 200;
export function writeToConsole(type, text) {
    const el = document.getElementById('console-content');
    if (!el) return;

    while (el.children.length > MAX_LOG_ENTRIES){
        el.removeChild(el.firstChild);
    }

    const line = document.createElement('div');
    line.className = `log-${type}`;
    line.textContent = `[${new Date().toLocaleTimeString()}] ${text}`;
    el.appendChild(line);
    el.scrollTop = el.scrollHeight;
}

// ## Resizable split panel #########################################

function initResizeHandle() {
    const handle      = document.getElementById('resize-handle');
    const editorPane  = document.getElementById('editor-pane');
    const previewPane = document.getElementById('preview-pane');
    const container   = document.getElementById('main-split');
    if (!handle || !editorPane || !previewPane || !container) return;

    let dragging = false;
    let startX   = 0;
    let startEditorWidth = 0;

    handle.addEventListener('mousedown', (e) => {
        dragging = true;
        startX = e.clientX;
        startEditorWidth = editorPane.getBoundingClientRect().width;
        handle.classList.add('dragging');
        document.body.style.cursor = 'col-resize';
        document.body.style.userSelect = 'none';
        e.preventDefault();
    });

    document.addEventListener('mousemove', (e) => {
        if (!dragging) return;
        const totalW = container.getBoundingClientRect().width;
        const delta  = e.clientX - startX;
        const newEditorW = Math.min(Math.max(startEditorWidth + delta, 200), totalW - 200);
        const pct = (newEditorW / totalW) * 100;
        editorPane.style.flex  = `0 0 ${pct}%`;
        previewPane.style.flex = `0 0 ${100 - pct}%`;
    });

    document.addEventListener('mouseup', () => {
        if (!dragging) return;
        dragging = false;
        handle.classList.remove('dragging');
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
    });
}
