/**
 * Project management module.
 *
 * Handles creating and opening Typst projects via Tauri commands,
 * saving to disk, and exposing the current project state to the app.
 */

import { showToast } from './toast.js';

const { invoke } = window.__TAURI__.core;

// ── Current project state ────────────────────────────────────────

/** @type {{ name: string, path: string, typFile: string } | null} */
let currentProject = null;

/** @type {Array<{ name: string, path: string, lastOpened: string }>} */
let projectHistory = JSON.parse(localStorage.getItem('project-history') ?? '[]');

/** Listeners called when a project is loaded/changed. */
const onChangeListeners = [];

export function onProjectChange(fn) {
    onChangeListeners.push(fn);
}

function notifyChange() {
    onChangeListeners.forEach(fn => fn(currentProject));
}

export function getCurrentProject() {
    return currentProject;
}

// ── History ───────────────────────────────────────────────────────

function addToHistory(project) {
    projectHistory = projectHistory.filter(p => p.path !== project.path);
    projectHistory.unshift({ name: project.name, path: project.path, lastOpened: new Date().toISOString() });
    if (projectHistory.length > 20) projectHistory.length = 20;
    localStorage.setItem('project-history', JSON.stringify(projectHistory));
}

export function getProjectHistory() {
    return projectHistory;
}

// ── Save ──────────────────────────────────────────────────────────

let saveTimer = null;
let pendingSave = false;

/**
 * Schedule an autosave (debounced, 800 ms).
 * @param {string} content - Current editor content.
 */
export function scheduleAutosave(content) {
    if (!currentProject) return;
    pendingSave = true;
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => flushSave(content), 800);
}

async function flushSave(content) {
    if (!currentProject || !pendingSave) return;
    const filePath = `${currentProject.path}/${currentProject.typFile}`;
    try {
        await invoke('save_file', { path: filePath, content });
        pendingSave = false;
        notifySaveIndicator(false);
    } catch (err) {
        showToast('error', `Erreur de sauvegarde : ${err}`);
    }
}

// ── Save-indicator ────────────────────────────────────────────────

let _indicator = null;

function getSaveIndicator() {
    if (!_indicator) _indicator = document.getElementById('save-indicator');
    return _indicator;
}

export function notifySaveIndicator(unsaved) {
    const el = getSaveIndicator();
    if (!el) return;
    if (unsaved) {
        el.textContent = '●';
        el.classList.add('unsaved');
        el.title = 'Non sauvegardé';
    } else {
        el.textContent = '✓';
        el.classList.remove('unsaved');
        el.title = 'Sauvegardé';
    }
}

// ── Internal: load a project into the app ────────────────────────

/**
 * @param {{ name, path, typ_file, content }} info
 * @param {(content: string) => void} setEditorContent
 */
function loadProject(info, setEditorContent) {
    currentProject = { name: info.name, path: info.path, typFile: info.typ_file };
    addToHistory(currentProject);

    // Update UI
    const nameEl = document.getElementById('project-name');
    if (nameEl) nameEl.textContent = info.name;
    const pathEl = document.getElementById('status-project-path');
    if (pathEl) pathEl.textContent = `${info.path}/${info.typ_file}`;
    notifySaveIndicator(false);

    setEditorContent(info.content);
    notifyChange();
}

// ── Modal helper ──────────────────────────────────────────────────

/**
 * Show a simple prompt modal. Returns the entered string, or null if cancelled.
 * @param {{ title: string, label: string, placeholder: string, validate?: (v:string) => string|true }} opts
 * @returns {Promise<string|null>}
 */
function showPrompt({ title, label, placeholder, validate }) {
    return new Promise((resolve) => {
        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        overlay.innerHTML = `
            <div class="modal" role="dialog" aria-modal="true">
                <h2>${title}</h2>
                <label>
                    ${label}
                    <input type="text" id="modal-input" placeholder="${placeholder}" maxlength="80" autocomplete="off" />
                </label>
                <div class="modal-error" id="modal-error"></div>
                <div class="modal-actions">
                    <button class="btn btn-secondary" id="modal-cancel">Annuler</button>
                    <button class="btn btn-primary"   id="modal-confirm">Confirmer</button>
                </div>
            </div>`;

        document.body.appendChild(overlay);
        const input   = overlay.querySelector('#modal-input');
        const errorEl = overlay.querySelector('#modal-error');
        input.focus();

        const confirm = () => {
            const value = input.value.trim();
            if (!value) { errorEl.textContent = 'Ce champ est requis.'; return; }
            if (validate) {
                const result = validate(value);
                if (result !== true) { errorEl.textContent = result; return; }
            }
            overlay.remove();
            resolve(value);
        };

        const cancel = () => { overlay.remove(); resolve(null); };

        overlay.querySelector('#modal-confirm').addEventListener('click', confirm);
        overlay.querySelector('#modal-cancel').addEventListener('click', cancel);
        overlay.addEventListener('click', e => { if (e.target === overlay) cancel(); });
        input.addEventListener('keydown', e => {
            if (e.key === 'Enter') confirm();
            if (e.key === 'Escape') cancel();
        });
    });
}

// ── Public API ────────────────────────────────────────────────────

const INVALID_NAME = /[<>:"/\\|?*]/;
function validateName(v) {
    return INVALID_NAME.test(v)
        ? 'Le nom ne peut pas contenir : < > : " / \\ | ? *'
        : true;
}

/**
 * Create a new project: ask for a name, pick a folder, create dir + main.typ.
 * @param {(content: string) => void} setEditorContent
 */
export async function createNewProject(setEditorContent) {
    const name = await showPrompt({
        title: 'Nouveau projet',
        label: 'Nom du projet',
        placeholder: 'Mon projet',
        validate: validateName,
    });
    if (!name) return;

    const basePath = await invoke('open_folder_dialog');
    if (!basePath) return;

    try {
        const projectPath = await invoke('create_project', { name, basePath });
        await loadProject(
            { name, path: projectPath, typ_file: 'main.typ', content: '' },
            setEditorContent,
        );
        showToast('success', `Projet "${name}" créé.`);
    } catch (err) {
        showToast('error', `Impossible de créer le projet : ${err}`);
    }
}

/**
 * Open an existing project by picking a folder.
 * @param {(content: string) => void} setEditorContent
 */
export async function openProject(setEditorContent) {
    const dirPath = await invoke('open_folder_dialog');
    if (!dirPath) return;

    try {
        const info = await invoke('open_project', { dirPath });
        loadProject(info, setEditorContent);
        showToast('success', `Projet "${info.name}" ouvert.`);
    } catch (err) {
        showToast('error', String(err));
    }
}
