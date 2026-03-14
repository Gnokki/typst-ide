/**
 * Monaco Editor wrapper
 *
 * Provides:
 * - `createEditor(container)` -> initialises Monaco and returns the editor instance
 * - `setEditorTheme(theme)`   -> switches between 'dark' and 'light' Monaco themes
 * - `zoomIn()` / `zoomOut()` / `zoomReset()` -> font-size zoom
 */

const MONACO_CDN = 'vendor/vs';

const DEFAULT_FONT_SIZE = 14;
const MIN_FONT_SIZE     = 8;
const MAX_FONT_SIZE     = 32;
const ZOOM_STEP         = 2;

let _editor      = null;
let _currentSize = parseInt(localStorage.getItem('editor-font-size') ?? DEFAULT_FONT_SIZE, 10);
if (isNaN(_currentSize) || _currentSize < MIN_FONT_SIZE || _currentSize > MAX_FONT_SIZE) {
    _currentSize = DEFAULT_FONT_SIZE;
}

// ## Public API ####################################################

/**
 * Initialises Monaco inside `container` and returns the editor instance
 * @param {HTMLElement} container
 * @returns {Promise<import('monaco-editor').editor.IStandaloneCodeEditor>}
 */
export function createEditor(container) {
    return new Promise((resolve) => {
        window.require.config({ paths: { vs: MONACO_CDN } });

        window.require(['vs/editor/editor.main'], () => {
            registerTypstLanguage();

            const savedTheme = localStorage.getItem('theme') ?? 'light';
            _editor = monaco.editor.create(container, {
                value: '',
                language: 'typst',
                theme: savedTheme === 'light' ? 'vs' : 'vs-dark',
                fontSize: _currentSize,
                fontFamily: "'Fira Code', 'Cascadia Code', 'Courier New', monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                automaticLayout: true,
                lineNumbersMinChars: 4,
                contextmenu: true,
                copyWithSyntaxHighlighting: false,
            });

            // Suppress clipboard access errors from Monaco
            if (navigator.clipboard) {
                const originalReadText = navigator.clipboard.readText;
                navigator.clipboard.readText = function() {
                    return originalReadText.apply(this, arguments).catch(() => {
                        // Silently ignore clipboard read errors
                        return '';
                    });
                };
            }

            resolve(_editor);
        });
    });
}

export function handleImagePaste(event) {
    if (event.defaultPrevented) return false;

    console.debug("[paste-image] paste event captured");

  const items = event.clipboardData?.items;
    if (items && items.length > 0) {
        for (const item of items) {
            if (item.type.startsWith("image/")) {
                event.preventDefault();

                const blob = item.getAsFile();
                if (!blob) return false;

                const reader = new FileReader();
                reader.onload = (e) => {
                    try {
                        const dataUrl = e.target.result;
                        insertImageAtCursor(dataUrl);
                        console.info("[paste-image] image inserted from clipboard item");
                    } catch (error) {
                        console.error("Error inserting image:", error);
                    }
                };

                reader.readAsDataURL(blob);
                return true;
            }
        }
    }

    const files = event.clipboardData?.files;
    if (!files || files.length === 0) {
        // Some environments/apps put image payload as text/html or data URL text.
        const text = event.clipboardData?.getData("text/plain") ?? "";
        const html = event.clipboardData?.getData("text/html") ?? "";

        if (text.startsWith("data:image/")) {
            console.info("[paste-image] image payload detected as text data URL");
            return true;
        }

        if (html.includes("src=\"data:image/") || html.includes("src='data:image/")) {
            console.info("[paste-image] image payload detected in HTML clipboard content");
            return true;
        }

        console.debug("[paste-image] no binary image found in ClipboardEvent; default paste kept");
        return false;
    }

    for (const file of files) {
        if (file.type.startsWith("image/")) {
      event.preventDefault();

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const dataUrl = e.target.result;
          insertImageAtCursor(dataUrl);
                    console.info("[paste-image] image inserted from clipboard file");
        } catch (error) {
          console.error("Error inserting image:", error);
        }
      };

            reader.readAsDataURL(file);
                        return true;
    }
  }

        console.debug("[paste-image] clipboard has files, but none are images");
        return false;
}

export function insertImageAtCursor(dataUrl) {
  if (!_editor) return;

  const selection = _editor.getSelection();
  const position = selection ? selection.getStartPosition() : _editor.getModel()?.getFullModelRange().getEndPosition();

  if (!position) return;

  const typstSyntax = `#image("${dataUrl}", width: 100%)`;

  _editor.executeEdits('paste-image', [
    {
      range: new monaco.Range(position.lineNumber, position.column, position.lineNumber, position.column),
      text: typstSyntax,
    }
  ]);
}

/**
 * Switch Monaco between dark and light themes
 * @param {'dark'|'light'} theme
 */
export function setEditorTheme(theme) {
    if (!_editor) return;
    monaco.editor.setTheme(theme === 'light' ? 'vs' : 'vs-dark');
}

export function getEditor() {
    return _editor;
}

// ## Font family change #############################################
export function getCurrentFontFamily() {
    return _editor?.getOption(monaco.editor.EditorOption.fontFamily) ?? '';
}

export function setEditorFontFamily(fontFamily) {
    if (!_editor) return;
    _editor.updateOptions({ fontFamily });
    localStorage.setItem('editor-font-family', fontFamily);
}

// ## Zoom controls ##################################################
export function editorZoomIn() {
    if (_currentSize >= MAX_FONT_SIZE) return;
    _currentSize += ZOOM_STEP;
    _applySize();
}

export function editorZoomOut() {
    if (_currentSize <= MIN_FONT_SIZE) return;
    _currentSize -= ZOOM_STEP;
    _applySize();
}

export function editorZoomReset() {
    _currentSize = DEFAULT_FONT_SIZE;
    _applySize();
}

export function getCurrentZoomPct() {
    return Math.round((_currentSize / DEFAULT_FONT_SIZE) * 100);
}

// ## Internal ######################################################

function _applySize() {
    _editor?.updateOptions({ fontSize: _currentSize });
    localStorage.setItem('editor-font-size', String(_currentSize));
    const el = document.getElementById('status-zoom');
    if (el) el.textContent = `${getCurrentZoomPct()}%`;
}

// ## Typst language registration ####################################

function registerTypstLanguage() {
    if (monaco.languages.getLanguages().some((l) => l.id === 'typst')) return;

    monaco.languages.register({ id: 'typst' });

    // Comment configuration (enables Ctrl+/ to toggle //)
    monaco.languages.setLanguageConfiguration('typst', {
        comments: { lineComment: '//' },
        brackets: [['(', ')'], ['[', ']'], ['{', '}']],
        autoClosingPairs: [
            { open: '(', close: ')' },
            { open: '[', close: ']' },
            { open: '{', close: '}' },
            { open: '"', close: '"', notIn: ['string'] },
            { open: '$', close: '$', notIn: ['string'] },
        ],
    });

    monaco.languages.setMonarchTokensProvider('typst', {
        tokenizer: {
            root: [
                [/^=+\s.*$/,    'keyword'],       // Headings
                [/\*[^*\n]+\*/, 'strong'],         // Bold
                [/_[^_\n]+_/,   'emphasis'],       // Italic
                [/\$[^$\n]*\$/, 'number'],         // Inline math
                [/`[^`\n]*`/,   'string'],         // Raw/code
                [/\/\/.*$/,     'comment'],        // Line comment
                [/#[a-zA-Z_]\w*/, 'type.identifier'], // Functions
                [/@[a-zA-Z_]\w*/, 'variable'],    // References
            ],
        },
    });
}
