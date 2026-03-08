/**
 * Project management module
 *
 * Handles creating and opening Typst projects via Tauri commands,
 * saving to disk, and exposing the current project state to the app
 */

import { showToast } from './toast.js';
import { showPrompt } from './modal.js';

const { invoke } = window.__TAURI__.core;

// ## Current project state ########################################

/** @type {{ name: string, path: string, typFile: string } | null} */
let currentProject = null;

/** @type {Array<{ name: string, path: string, lastOpened: string }>} */
let projectHistory = JSON.parse(localStorage.getItem('project-history') ?? '[]');

/** Listeners called when a project is loaded/changed */
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

// ## History #######################################################

// function addToHistory(project) {
//     projectHistory = projectHistory.filter(p => p.path !== project.path);
//     projectHistory.unshift({ name: project.name, path: project.path, lastOpened: new Date().toISOString() });
//     if (projectHistory.length > 20) projectHistory.length = 20;
//     localStorage.setItem('project-history', JSON.stringify(projectHistory));
// }

// export function getProjectHistory() {
//     return projectHistory;
// }

// ## Save ##########################################################

let saveTimer = null;
let pendingSave = false;

/**
 * Schedule an autosave (debounced, 800 ms)
 * @param {string} content - Current editor content
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

// ## Save-indicator ################################################
export function unsavedBtnUpdate() {
    // Blink unsaved indicator if the project isn't saved yet
    if (getCurrentProject() === null){
        document.getElementById('unsaved-btn')?.classList.remove('_unsaved-btn-none');
    } else {
        document.getElementById('unsaved-btn')?.classList.add('_unsaved-btn-none');
    }
}


// ## Open indicator ################################################
export function openProjectBtnUpdate() {
    // Blink unsaved indicator if the project isn't saved yet
    if (getCurrentProject() === null){
        // document.getElementById('open-project-btn')?.classList.remove('_open-project-btn-none');
        document.getElementById('open-project-btn').classList.add("_open-project-blinking");
        document.getElementById('open-project-btn').classList.add("_open-project-blinking:hover");
    } else {
        // document.getElementById('open-project-btn')?.classList.add('_open-project-btn-none');
        document.getElementById('open-project-btn').classList.remove("_open-project-blinking");
        document.getElementById('open-project-btn').classList.remove("_open-project-blinking:hover");
    }
}



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

// ## Export PDF (save as PDF) #####################################

export async function exportPDF(content) {
    try {
        const pdfData = await invoke('export_pdf', { source: content });
        const blob = new Blob([pdfData], { type: 'application/pdf' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${currentProject ? currentProject.name : 'document'}.pdf`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    } catch (err) {
        showToast('error', `Erreur lors de l'export PDF : ${err}`);
    }
}

// ## Internal: load a project into the app ########################

/**
 * @param {{ name, path, typ_file, content }} info
 * @param {(content: string) => void} setEditorContent
 */
function loadProject(info, setEditorContent) {
    currentProject = { name: info.name, path: info.path, typFile: info.typ_file };
    // addToHistory(currentProject);

    // Update UI
    const nameEl = document.getElementById('project-name');
    if (nameEl) nameEl.textContent = info.name;
    const pathEl = document.getElementById('status-project-path');
    if (pathEl) pathEl.textContent = `${info.path}/${info.typ_file}`;
    notifySaveIndicator(false);

    setEditorContent(info.content);
    notifyChange();
    unsavedBtnUpdate();
    openProjectBtnUpdate();
}

// ## Public API ####################################################

const INVALID_NAME = /[<>:"/\\|?*]/;
function validateName(v) {
    return INVALID_NAME.test(v)
        ? 'Le nom ne peut pas contenir : < > : " / \\ | ? *'
        : true;
}

/**
 * Create a new project: ask for a name, pick a folder, create dir + main.typ
 * @param {(content: string) => void} setEditorContent
 * @param {string} content
 */
export async function createNewProject(setEditorContent, content = '') {
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
        const projectPath = await invoke('create_project', { name, basePath, content });
        await loadProject(
            { name, path: projectPath, typ_file: 'main.typ', content: content },
            setEditorContent,
        );
        showToast('success', `Projet "${name}" créé.`);
    } catch (err) {
        showToast('error', `Impossible de créer le projet : ${err}`);
    }
}

/**
 * Open an existing project by picking a folder
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

export async function openProjectFromPath(dirPath, setEditorContent) {
    try {
        const info = await invoke('open_project', { dirPath });
        loadProject(info, setEditorContent);
        showToast('success', `Projet "${info.name}" ouvert.`);
    } catch (err) {
        showToast('error', String(err));
    }
}
