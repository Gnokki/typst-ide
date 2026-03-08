

const { invoke } = window.__TAURI__.core;
const { join } = window.__TAURI__.path;


import { openModal, showConfirm } from './modal.js';
import { getCurrentFontFamily } from './editor.js';
import { showToast } from './toast.js';
import { openProjectFromPath } from './project.js';


async function createHistoryEntry() {
    const body = document.createElement('div');
    body.innerHTML = `
<div class="history-entry-form>
    <p id="history-entry-name">Veuillez choisir le chemin du projet</p>
    <button id="history-entry-path-btn" class="ide-button tool-btn">Choisir un dossier</button>
    <div><sub class="history-entry-path"><input id="history-entry-path-input" type="text" placeholder="Aucun chemin sélectionné" style="width:100%;"/></sub></div>
</div>
    `;
    let path;
    body.querySelector('#history-entry-path-btn').addEventListener('click', async () => {
        path = await invoke('open_folder_dialog');
        if (path) {
            body.querySelector('#history-entry-path-input').value = path;
        }
    });

    openModal({
        title: "Ajouter un projet",
        body: body,
        width: '50%',
        buttons: [
            { label: 'Annuler',    primary: false, onClick: (c) => c() },
            { label: 'Ajouter', primary: true,  onClick: async (c) => {
                if (!path) return;
                
                const name = path.split(/[/\\]/).pop();
                console.log('Adding history entry:', { name, path });
                if (!name || !path) {
                    showToast("error", "Veuillez fournir un nom et un chemin valides.");
                    return;
                }

                try {
                    const inserted = await invoke('add_history_entry', { name, path });
                    if (inserted) {
                        showToast("success", "Projet ajouté à l'historique !");
                        c();
                    } else {
                        showToast("error", "Ce projet existe déjà dans l'historique.");
                    }
                } catch (err) {
                    showToast("error", "Erreur lors de l'ajout à l'historique : " + err);
                }
            }}
        ],
    });
}

async function deleteHistoryEntry(entryId) {
    const confirmed = await showConfirm({
        title: "Supprimer l'entrée",
        message: "Êtes-vous sûr de vouloir supprimer cette entrée de l'historique ? Cette action est irréversible.",
    });
    if (confirmed) {
        await invoke('delete_history_entry', { id: entryId });
        closeHistory();
        showToast("success", "Entrée supprimée de l'historique.");
        openHistory();
    };
}

async function editHistoryEntry(entry) {
    const body = document.createElement('div');
    body.innerHTML = `
<div class="history-entry-form>
    <p id="history-entry-name">Veuillez choisir le chemin du projet</p>
    <button id="history-entry-path-btn" class="ide-button tool-btn">Choisir un dossier</button>
    <div><sub class="history-entry-path"><input id="history-entry-path-input" type="text" value="${entry.path}" placeholder="Aucun chemin sélectionné" style="width:100%;"/></sub></div>
</div>
    `;
    let newPath;
    body.querySelector('#history-entry-path-btn').addEventListener('click', async () => {
        newPath = await invoke('open_folder_dialog');
        if (newPath) {
            body.querySelector('#history-entry-path-input').value = newPath;
        }
    });

    openModal({
        title: "Modifier l'entrée",
        body: body,
        width: '50%',
        buttons: [
            { label: 'Annuler',    primary: false, onClick: (c) => c() },
            { label: 'Enregistrer', primary: true,  onClick: async (c) => {
                const newName = body.querySelector('#history-entry-name').value.trim();
                if (!newName || !newPath) {
                    showToast("error", "Le nom et le chemin ne peuvent pas être vides.");
                    return;
                }
                try {
                    await invoke('update_history_entry', { id: entry.id, name: newName, path: newPath });
                    showToast("success", "Entrée de l'historique mise à jour !");
                    c();
                    openHistory();
                } catch (err) {
                    showToast("error", "Erreur lors de la mise à jour de l'entrée : " + err);
                }
            }}
        ],
    });
}

async function viewHistoryEntry(entry) {
    const createdAt = new Date(entry.created_at);
    const createdAtDate = createdAt.toLocaleDateString("fr-FR", {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const createdAtTime = createdAt.toLocaleTimeString("fr-FR", {
        hour: '2-digit',
        minute: '2-digit',
    });
    const updatedAt = new Date(entry.updated_at);
    const updatedAtDate = updatedAt.toLocaleDateString("fr-FR", {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const updatedAtTime = updatedAt.toLocaleTimeString("fr-FR", {
        hour: '2-digit',
        minute: '2-digit',
    });

    const typ_path = await join(entry.path, 'main.typ');
    const content = await invoke('read_file', { path: typ_path });

    const body = document.createElement('div');
    body.innerHTML = `
<div id="note-preview-metadata">
    <p>Chemin : ${entry.path}</p>
    <p>Nom : ${entry.name}</p>
    <p>Crée le ${createdAtDate} à ${createdAtTime}</p>
    <p>Dernière modification le ${updatedAtDate} à ${updatedAtTime}</p>
</div>
<div id="note-preview-content" style="font-family:${getCurrentFontFamily()};">${content}</div>
    `;
    openModal({
        title: "Aperçu du projet",
        body: body,
        width: '75%',
        buttons: [],
    });
}

async function openProject(entry) {
    await openProjectFromPath(entry.path, (content) => {
        // setEditorContent is provided by main.js at init — forward via project module
        const editor = window.__typstEditor;
        if (editor) editor.setValue(content);
    });
    closeHistory();
}

function attachHistoryEntryListeners(entryEl, entry) {
    const entryHistoryBtn = entryEl.querySelector(`#history-${entry.id}`);
    entryHistoryBtn?.addEventListener('click', async () => await openProject(entry));
    
    const deleteBtn = entryEl.querySelector('.delete-history-entry-btn');
    deleteBtn?.addEventListener('click', () => deleteHistoryEntry(entry.id));

    const editBtn = entryEl.querySelector('.edit-history-entry-btn');
    editBtn?.addEventListener('click', () => editHistoryEntry(entry));

    const viewBtn = entryEl.querySelector('.view-history-entry-btn');
    viewBtn?.addEventListener('click', () => viewHistoryEntry(entry));
}

async function createHistoryList() {
    const entries = await invoke('get_history');
    const container = document.createElement('div');
    entries.forEach(entry => {
        const entryEl = document.createElement('div');
        entryEl.className = 'history-entry';
        entryEl.innerHTML = `
<span class="flex gap-2">
    <button class="history-entry-btn" id="history-${entry.id}">
        <div class="history-entry-btn-title">${entry.name}</div>
        <div class="history-entry-btn-content" style="font-family: ${getCurrentFontFamily()};">${entry.path}</div>
    </button>
    <div class="flex items-center gap-1">
        <button class="delete-history-entry-btn" id="delete-${entry.id}">
            <span class="material-symbols-outlined delete-history-entry-icon">delete</span>
        </button>
        <button class="edit-history-entry-btn" id="edit-${entry.id}">
            <span class="material-symbols-outlined edit-history-entry-icon">edit</span>
        </button>
        <button class="view-history-entry-btn" id="view-${entry.id}">
            <span class="material-symbols-outlined view-history-entry-icon">visibility</span>
        </button>
    </div>
</span>
        `;

        attachHistoryEntryListeners(entryEl, entry);
        container.appendChild(entryEl);
    });
    return container;
}

export async function openHistory() {
    const body = document.createElement('div');
    body.appendChild(await createHistoryList());

    openModal({
        title: "Historique des projets",
        body: body,
        width: window.innerWidth < 1000 ? '75%' : '50%',
        buttons: [
            { label: 'Fermer', primary: true, onClick: (c) => c() },
            { label: 'Ajouter un projet', primary: false, onClick: async (c) => {
                await createHistoryEntry();
                c();
            }},
        ],
    });
}

function closeHistory() {
    const overlay = document.querySelector('.ide-modal-overlay');
    if (overlay) overlay.remove();
}