/**
 * notepad.js
 *  notepad functionalities
 *
 * ## API
 *
 * createNote(scope) -> void
 *  * scope: 'global' | 'project'
 *  * Opens the note creation modal
 *  * If `scope` is provided, it will be the default scope for the new note
 * 
 * insertNote(content) -> void
 *  * content: string of the note to insert
 *  * Inserts the given content at the current cursor position in the editor
 * 
 * deleteNote(noteId) -> void
 *  * noteId: string ID of the note to delete
 *  * Deletes the note with the given ID after user confirmation
 * 
 * editNote(note) -> void
 *  * note: { id, title, content, scope, created_at, updated_at }
 *  * Opens the note editing modal pre-filled with the note's current data
 * 
 * viewNote(note) -> void
 *  * note: { id, title, content, scope, created_at, updated_at }
 *  * Opens a read-only modal to view the note's content and metadata
 * 
 * openNotesList() -> HTMLElement
 *  * Returns a DOM element containing the list of all notes (both global and project-specific)
 * 
 * openNotepad() -> void
 *  * Opens a modal displaying all notes with options to add, edit, delete, and insert them
 */
const { invoke } = window.__TAURI__.core;

import { openModal, showPrompt, showConfirm } from './modal.js';
import { getCurrentFontFamily, getEditor } from './editor.js';
import { getCurrentProject } from './project.js';

/**
 * Open the note creation modal
 */
function createNote(scope='project') {
    const body = document.createElement('div');
    body.innerHTML = `
<input type="text" placeholder="Titre de la note" style="width:100%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;" />
<label for="scope">Portée de la note:</label>
<select name="scope" style="width:100%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;">
    <option value="global" ${scope === 'global' ? 'selected' : ''}>Globale (visible dans tous les projets)</option>
    <option value="project" ${scope === 'project' ? 'selected' : ''}>Projet actuel seulement</option>
</select>
<textarea placeholder="Contenu de la note" style="width:100%;height:150px;padding:0.5rem;font-size:1rem;"/>
    `;
    openModal({
        title: 'Ajouter une note',
        body: body,
        width: '75%',
        buttons: [
            { label: 'Ajouter', primary: true, onClick: async (close) => {
                const title = body.querySelector('input')?.value.trim();
                const text = body.querySelector('textarea')?.value.trim();
                const scope = body.querySelector('select')?.value;
                
                if (title && text) {
                    let project_id;
                    if (scope == 'project'){
                        project_id = await invoke('get_current_project_id', { projectPath: getCurrentProject()?.path });
                    } else {
                        project_id = null;
                    }
                    invoke('add_note', { title, content: text, scope, projectId: project_id });
                    close();
                }
            }}
        ]
    });
}

function insertNote(content) {
    const editor = getEditor();
    if (editor) {
        const selection = editor.getSelection();
        if (selection) {
            editor.executeEdits(null, [
                {
                    range: selection,
                    text: content,
                    forceMoveMarkers: true
                }
            ]);
        }
    }
    closeNotepad();
}

async function deleteNote(noteId) {
    const confirmed = await showConfirm({
        title: 'Supprimer la note',
        message: 'Êtes-vous sûr de vouloir supprimer cette note ? Cette action est irréversible.',
        confirmLabel: 'Supprimer',
        cancelLabel: 'Annuler'
    });
    
    if (confirmed) {
        await invoke('delete_note', { noteId });
        closeNotepad();
        openNotepad(); // Refresh the notepad
    }
}

async function editNote(note) {
    const body = document.createElement('div');
    body.style.display = 'flex';
    body.style.flexDirection = 'column';
    body.style.height = '100%';
    body.innerHTML = `
<input type="text" placeholder="Titre de la note" value="${note.title}" style="width:100%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;border:1px solid #cecece;border-radius:6px;" />
<label for="scope">Portée de la note:</label>
<select name="scope" style="width:100%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;">
    <option value="global" ${note.scope === 'global' ? 'selected' : ''}>Globale (visible dans tous les projets)</option>
    <option value="project" ${note.scope === 'project' ? 'selected' : ''}>Projet actuel seulement</option>
</select>
<textarea placeholder="Contenu de la note" style="flex:1;width:100%;padding:0.5rem;font-size:1rem;border:1px solid #cecece;border-radius:6px;">${note.content}</textarea>
    `;
    openModal({
        title: 'Modifier la note',
        body: body,
        width: '75%',
        height: '75%',
        buttons: [
            { label: 'Enregistrer', primary: true, onClick: async (close) => {
                const title = body.querySelector('input')?.value.trim();
                const text = body.querySelector('textarea')?.value.trim();
                const scope = body.querySelector('select')?.value;
                
                if (title && text) {
                    let project_id;
                    if (scope == 'project'){
                        project_id = await invoke('get_current_project_id', { projectPath: getCurrentProject()?.path });
                    } else {
                        project_id = null;
                    }
                    invoke('update_note', { 
                        noteId: note.id, 
                        title, 
                        content: text, 
                        scope, 
                        projectId: project_id 
                    });
                    close();
                    closeNotepad();
                    openNotepad(); // Refresh the notepad
                }
            }}
        ]
    });
}

function viewNote(note) {
    const createdAt = new Date(note.created_at)
    const createdAtDate = createdAt.toLocaleDateString("fr-FR", {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const createdAtTime = createdAt.toLocaleTimeString("fr-FR", {
        hour: '2-digit',
        minute: '2-digit',
    });
    const updatedAt = new Date(note.updated_at)
    const updatedAtDate = updatedAt.toLocaleDateString("fr-FR", {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
    const updatedAtTime = updatedAt.toLocaleTimeString("fr-FR", {
        hour: '2-digit',
        minute: '2-digit',
    });

    const body = document.createElement('div');
    body.innerHTML = `
<div id="note-preview-metadata">
    <p>Crée le ${createdAtDate} à ${createdAtTime}</p>
    <p>Dernière modification le ${updatedAtDate} à ${updatedAtTime}</p>
    <p>Portée ${note.scope === 'global' ? 'globale' : 'projet'}</p>
</div>
<div id="note-preview-content" style="font-family:${getCurrentFontFamily()};">${note.content}</div>
    `;
    openModal({
        title: note.title,
        body,
        width: '75%',
        buttons: [],
    });
}

function attachNoteListeners(noteEl, note) {
    const noteBtn = noteEl.querySelector(`#note-${note.id}`);
    noteBtn.addEventListener('click', () => insertNote(note.content));

    const deleteBtn = noteEl.querySelector(`#delete-${note.id}`);
    deleteBtn.addEventListener('click', () => deleteNote(note.id));

    const editBtn = noteEl.querySelector(`#edit-${note.id}`);
    editBtn.addEventListener('click', () => editNote(note));

    const viewBtn = noteEl.querySelector(`#view-${note.id}`);
    viewBtn.addEventListener('click', () => viewNote(note));
}

async function createNotesList() {
    // const notes = await invoke('get_all_notes');
    let globalNotes = await invoke('get_global_notes');
    let projectNotes = [];
    const currentProject = getCurrentProject();
    if (currentProject !== null) {
        projectNotes = await invoke('get_project_notes', { projectPath: currentProject.path });
    }
    const container = document.createElement('div');
    if (globalNotes.length + projectNotes.length === 0) {
        container.innerHTML = '<p>Aucune note pour le moment.</p>';
    } else {
        if (globalNotes.length > 0) {
            const globalTitle = document.createElement('h2');
            globalTitle.textContent = 'Notes globales';
            globalTitle.style.fontSize = '1rem';
            globalTitle.style.fontWeight = 'bold';
            container.appendChild(globalTitle);
            globalNotes.forEach(note => {
                const noteEl = document.createElement('div');
                noteEl.className = 'note-item';
                // noteEl.innerHTML = `
                //     <h3>${note.title}</h3>
                //     <p>${note.content}</p>
                //     <small>Portée: ${note.scope}</small>
                // `;
                noteEl.innerHTML = `
<span class="flex gap-2">
    <button class="note-btn" id="note-${note.id}">
        <div class="note-btn-title">${note.title}</div>
        <div class="note-btn-content" style="font-family: ${getCurrentFontFamily()};">${note.content}</div>
    </button>
    <div class="flex items-center gap-1">
        <button class="delete-note-btn" id="delete-${note.id}">
            <span class="material-symbols-outlined delete-note-icon">delete</span>
        </button>
        <button class="edit-note-btn" id="edit-${note.id}">
            <span class="material-symbols-outlined edit-note-icon">edit</span>
        </button>
        <button class="view-note-btn" id="view-${note.id}">
            <span class="material-symbols-outlined view-note-icon">visibility</span>
        </button>
    </div>
</span>
                `;
                // Attach event listeners
                attachNoteListeners(noteEl, note);
                container.appendChild(noteEl);
            });
        }

        if(currentProject !== null) {
            if (projectNotes.length > 0) {
                const projectTitle = document.createElement('h2');
                projectTitle.textContent = 'Notes du projet';
                projectTitle.style.fontSize = '1rem';
                projectTitle.style.fontWeight = 'bold';
                container.appendChild(projectTitle);
                projectNotes.forEach(note => {
                    const noteEl = document.createElement('div');
                    noteEl.className = 'note-item';
                    // noteEl.innerHTML = `
                    //     <h3>${note.title}</h3>
                    //     <p>${note.content}</p>
                    //     <small>Portée: ${note.scope}</small>
                    // `;
                    noteEl.innerHTML = `
<span class="flex gap-2">
    <button class="note-btn" id="note-${note.id}">
        <div class="note-btn-title">${note.title}</div>
        <div class="note-btn-content" style="font-family: ${getCurrentFontFamily()};">${note.content}</div>
    </button>
    <div class="flex items-center gap-1">
        <button class="delete-note-btn" id="delete-${note.id}">
            <span class="material-symbols-outlined delete-note-icon">delete</span>
        </button>
        <button class="edit-note-btn" id="edit-${note.id}">
            <span class="material-symbols-outlined edit-note-icon">edit</span>
        </button>
        <button class="view-note-btn" id="view-${note.id}">
            <span class="material-symbols-outlined view-note-icon">visibility</span>
        </button>
    </div>
</span>
                    `;
                    // Attach event listeners
                    attachNoteListeners(noteEl, note);
                    
                    container.appendChild(noteEl);
                });
            }
        }
    }
    return container;
}

/**
 * Open a modal to show all the notes
 */
export async function openNotepad() {
    const content = document.createElement('div');
    content.appendChild(await createNotesList());

    openModal({
        title: 'Bloc-notes',
        body: content,
        width: window.innerWidth < 1000 ? '75%' : '50%',
        buttons: [
            { label: 'Ajouter une note', primary: true, onClick: (close) => {
                close();
                createNote();
            }}
        ]
    });
}

function closeNotepad() {
    const overlay = document.querySelector('.ide-modal-overlay');
    if (overlay) overlay.remove();
}