/**
 * structures.js
 *  helping structures module
 *
 * ## API
 */

import { getCurrentFontFamily, getEditor } from './editor'
import { openModal } from './modal';

export const STRUCT_ELEMENTS = [
  {
    id: 'table',
    content: '#table',
    classes: '',
    title: 'Tableau',
    openModal: () => {
      const body = document.createElement('div');
      body.innerHTML = `
<div>
  <p class="structures-input-label">Dimensions</p>
  <span class="flex items-center">
    <input
      id="structures-table-input-cols"
      type="number"
      placeholder="cols"
      min="1"
      style="width:20%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;"
    />
    <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
    <input
      id="structures-table-input-rows"
      type="number"
      placeholder="rows"
      min="1"
      style="width:20%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;"
    />
  </span>

  <p class="structures-input-label">Marge intérieure</p>
  <input
    id="structures-table-input-inset"
    type="number"
    placeholder="inset"
    min="0"
    style="width:20%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;"
  />

  <p class="structures-input-label">Alignement horizontal</p>
  <select
    id="structures-table-input-horizontal-align"
    style="width:20%;margin-bottom:0.5rem;padding:0.1rem;font-size:1rem;"
  >
    <option value="left">left</option>
    <option value="center">center</option>
    <option value="right">right</option>
  </select>

  <p class="structures-input-label">Alignement vertical</p>
  <select
    id="structures-table-input-vertical-align"
    style="width:20%;margin-bottom:0.5rem;padding:0.1rem;font-size:1rem;"
  >
    <option value="top">top</option>
    <option value="horizon">horizon</option>
    <option value="bottom">bottom</option>
  </select>

  <p
    onclick="window.__TAURI__.opener.openUrl('https://typst.app/docs/reference/model/table/')"
    style="cursor:pointer;color:var(--color-link);text-decoration: underline;display:flex;width:fit-content;"
  >More information...</p>
</div>
      `;
      openModal({
        title: 'Insérer un tableau',
        body: body,
        buttons: [
          {
            label: 'Insérer',
            primary: true,
            onClick: () => {
              // get all values from the form
              const cols = parseInt(document.getElementById('structures-table-input-cols').value);
              const rows = parseInt(document.getElementById('structures-table-input-rows').value);
              const inset = document.getElementById('structures-table-input-inset').value;
              const horizontalalign = document.getElementById('structures-table-input-horizontal-align').value;
              const verticalalign = document.getElementById('structures-table-input-vertical-align').value;

              // create the typst code
              const cols_code = cols ? `\tcolumns: ${cols},\n` : '';
              const rows_code = rows ? `\trows: ${rows},\n` : '';
              const inset_code = inset ? `\tinset: ${inset}pt,\n` : '';
              const align_code = horizontalalign || verticalalign ? `\talign: ${horizontalalign}+${verticalalign},\n` : '';


              let cells = "";
              for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                  if (j === 0 && i === 0) cells += `\n\t`;
                  cells += `[],`;
                }
                cells += `\n`;
                if (i !== cols - 1) cells += `\t`;
              }
              const typst_code = `#table(\n${cols_code}${rows_code}${inset_code}${align_code}${cells})\n`;
              const editor = getEditor();
              if (editor) {
                  const selection = editor.getSelection();
                  if (selection) {
                      editor.executeEdits(null, [
                          {
                              range: selection,
                              text: typst_code,
                              // forceMoveMarkers: true
                          }
                      ]);
                  }
              }
            },
          }
        ],
      });
    },
  },

  /*
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
  */
  {
    id: 'grid',
    content: '#grid',
    classes: '',
    title: 'Grille pour placer les éléments',
    openModal: () => {
      const body = document.createElement('div');
      body.innerHTML = `
<div>
  <p class="structures-input-label">Dimensions</p>
  <span class="flex items-center">
    <input
      id="structures-grid-input-cols"
      type="number"
      placeholder="cols"
      min="1"
      style="width:20%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;"
    />
    <span class="material-symbols-outlined" style="font-size:1rem;">close</span>
    <input
      id="structures-grid-input-rows"
      type="number"
      placeholder="rows"
      min="1"
      style="width:20%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;"
    />
  </span>

  <p class="structures-input-label">Marge intérieure</p>
  <input
    id="structures-grid-input-inset"
    type="number"
    placeholder="inset"
    min="0"
    style="width:20%;margin-bottom:0.5rem;padding:0.5rem;font-size:1rem;"
  />

  <p class="structures-input-label">Alignement horizontal</p>
  <select
    id="structures-grid-input-horizontal-align"
    style="width:20%;margin-bottom:0.5rem;padding:0.1rem;font-size:1rem;"
  >
    <option value="left">left</option>
    <option value="center">center</option>
    <option value="right">right</option>
  </select>

  <p class="structures-input-label">Alignement vertical</p>
  <select
    id="structures-grid-input-vertical-align"
    style="width:20%;margin-bottom:0.5rem;padding:0.1rem;font-size:1rem;"
  >
    <option value="top">top</option>
    <option value="horizon">horizon</option>
    <option value="bottom">bottom</option>
  </select>

  <p
    onclick="window.__TAURI__.opener.openUrl('https://typst.app/docs/reference/layout/grid/')"
    style="cursor:pointer;color:var(--color-link);text-decoration: underline;display:flex;width:fit-content;"
  >More information...</p>
</div>
      `;
      openModal({
        title: 'Insérer une grille',
        body: body,
        buttons: [
          {
            label: 'Insérer',
            primary: true,
            onClick: () => {
              // get all values from the form
              const cols = parseInt(document.getElementById('structures-grid-input-cols').value);
              const rows = parseInt(document.getElementById('structures-grid-input-rows').value);
              const inset = document.getElementById('structures-grid-input-inset').value;
              const horizontalalign = document.getElementById('structures-grid-input-horizontal-align').value;
              const verticalalign = document.getElementById('structures-grid-input-vertical-align').value;

              // create the typst code
              const cols_code = cols ? `\tcolumns: ${cols},\n` : '';
              const rows_code = rows ? `\trows: ${rows},\n` : '';
              const inset_code = inset ? `\tinset: ${inset}pt,\n` : '';
              const align_code = horizontalalign || verticalalign ? `\talign: ${horizontalalign}+${verticalalign},\n` : '';


              let cells = "";
              for (let i = 0; i < cols; i++) {
                for (let j = 0; j < rows; j++) {
                  if (j === 0 && i === 0) cells += `\n\t`;
                  cells += `[],`;
                }
                cells += `\n`;
                if (i !== cols - 1) cells += `\t`;
              }
              const typst_code = `#grid(\n${cols_code}${rows_code}${inset_code}${align_code}${cells})\n`;
              const editor = getEditor();
              if (editor) {
                  const selection = editor.getSelection();
                  if (selection) {
                      editor.executeEdits(null, [
                          {
                              range: selection,
                              text: typst_code,
                              // forceMoveMarkers: true
                          }
                      ]);
                  }
              }
            },
          }
        ],
      });
    },
  },
  {
    id: 'rect',
    content: '#rect',
    classes: '',
    title: 'Rectangle',
  },
  {
    id: 'figure',
    content: '#figure',
    classes: '',
    title: 'Image avec légende',
  },
];


// Since the button have the editor font....
export function updateBtn() {
  const btn = document.getElementById('structures-menu');
  btn.style.fontFamily = getCurrentFontFamily();

  const dropdown = document.getElementById("structures-dropdown");
  if (!dropdown) setBtnIcon(false);
}

export function toggleBtnIcon() {
  const icon = document.getElementById("structures-btn-icon");
  if (!icon) return;

  icon.classList.toggle("structures-btn-icon-rotate");
}

export function setBtnIcon(open) {
  const icon = document.getElementById("structures-btn-icon");
  if (!icon) return;

  icon.classList.toggle("structures-btn-icon-rotate", open);
}

export function populateStructureDropdown() {
  /*
  elements:
   - id: string
   - content: string
   - classes: string
   - title: string
  */
  const dropdown = document.getElementById("structures-dropdown");
  if (!dropdown) return;

  dropdown.innerHTML = '';
  STRUCT_ELEMENTS.forEach((item) => {
    const li = document.createElement('li');
    li.classList.add("structures-dropdown-item");
    const button = document.createElement('button');
    button.addEventListener('click', () => {
      item.openModal();
    });
    button.innerHTML = item.content;
    if (item.classes) button.classList.add(...item.classes.split(' '));
    button.title = item.title;
    if (item.id) button.id = item.id;
    li.appendChild(button);
    dropdown.appendChild(li);
  });
}
