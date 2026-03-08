/**
 * modal.js
 *  popup modal manager
 *
 * ## API
 *
 * openModal(opts) -> { close, overlay }
 *   opts.title      (string) : header text
 *   opts.body       (string|HTMLElement) : content (HTML string or DOM node)
 *   opts.buttons    (array, optional) : [{ label, primary?, onClick(close) }]
 *   opts.width      (string, optional) : CSS width, e.g. "600px" (default: "480px")
 *   opts.onClose    (function, optional) : called when the modal is dismissed
 *   opts.closable   (boolean, optional) : whether backdrop-click / Escape closes it (default: true)
 *
 * showConfirm(opts) -> Promise<boolean>
 *   opts.title, opts.message, opts.confirmLabel, opts.cancelLabel
 *
 * showPrompt(opts) -> Promise<string|null>
 *   opts.title, opts.label, opts.placeholder, opts.validate(v) = string|true
 */

// ## Core ####################################################################

/**
 * Open a modal with arbitrary content.
 * @param {{
 *   title: string,
 *   body: string | HTMLElement,
 *   buttons?: Array<{ label: string, primary?: boolean, onClick?: (close: () => void) => void }>,
 *   width?: string,
 *   onClose?: () => void,
 *   closable?: boolean,
 * }} opts
 * @returns {{ close: () => void, overlay: HTMLElement }}
 */
export function openModal({ title, body, buttons = [], width = '480px', height = 'auto', onClose, closable = true }) {
    const overlay = document.createElement('div');
    overlay.className = 'ide-modal-overlay';

    const modal = document.createElement('div');
    modal.className = 'ide-modal';
    modal.style.width = width;
    modal.style.height = height;
    modal.setAttribute('role', 'dialog');
    modal.setAttribute('aria-modal', 'true');

    // Header
    const header = document.createElement('div');
    header.className = 'ide-modal-header';
    header.innerHTML = `<h2>${title}</h2>`;
    if (closable) {
        const closeBtn = document.createElement('button');
        closeBtn.className = 'ide-modal-close-btn';
        closeBtn.innerHTML = '&times;';
        closeBtn.addEventListener('click', () => close());
        header.appendChild(closeBtn);
    }
    modal.appendChild(header);

    // Body
    const bodyEl = document.createElement('div');
    bodyEl.className = 'ide-modal-body';
    if (typeof body === 'string') {
        bodyEl.innerHTML = body;
    } else {
        bodyEl.appendChild(body);
    }
    modal.appendChild(bodyEl);

    // Footer (buttons)
    if (buttons.length > 0) {
        const footer = document.createElement('div');
        footer.className = 'ide-modal-actions';
        buttons.forEach(({ label, primary = false, onClick }) => {
            const btn = document.createElement('button');
            btn.className = primary ? 'btn' : 'btn';
            btn.textContent = label;
            btn.addEventListener('click', () => onClick?.(close));
            footer.appendChild(btn);
        });
        modal.appendChild(footer);
    }

    overlay.appendChild(modal);
    document.body.appendChild(overlay);

    // Double rAF ensures the element is painted before the transition starts
    requestAnimationFrame(() => requestAnimationFrame(() => overlay.classList.add('ide-modal-overlay--visible')));

    function close() {
        overlay.classList.remove('ide-modal-overlay--visible');
        overlay.addEventListener('transitionend', () => overlay.remove(), { once: true });
        onClose?.();
        document.removeEventListener('keydown', onKeyDown);
    }

    if (closable) {
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
        document.addEventListener('keydown', onKeyDown);
    }

    function onKeyDown(e) {
        if (e.key === 'Escape') close();
    }

    return { close, overlay };
}

// ## Helpers #################################################################

/**
 * Show a confirmation dialog.
 * @param {{ title: string, message: string, confirmLabel?: string, cancelLabel?: string }} opts
 * @returns {Promise<boolean>}
 */
export function showConfirm({ title, message, confirmLabel = 'Confirmer', cancelLabel = 'Annuler' }) {
    return new Promise((resolve) => {
        const { close } = openModal({
            title,
            body: `<p class="ide-modal-message">${message}</p>`,
            buttons: [
                { label: cancelLabel,  primary: false, onClick: (c) => { resolve(false); c(); } },
                { label: confirmLabel, primary: true,  onClick: (c) => { resolve(true);  c(); } },
            ],
            onClose: () => resolve(false),
        });
    });
}

/**
 * Show a text-input prompt modal.
 * @param {{ title: string, label: string, placeholder: string, validate?: (v: string) => string | true }} opts
 * @returns {Promise<string|null>}
 */
export function showPrompt({ title, label, placeholder, validate }) {
    return new Promise((resolve) => {
        const inputId = 'modal-prompt-input-' + Date.now();
        const errorId = 'modal-prompt-error-' + Date.now();

        const bodyHtml = `
            <label class="ide-modal-label">
                ${label}
                <input type="text" id="${inputId}" class="ide-modal-input" placeholder="${placeholder}" maxlength="80" autocomplete="off" />
            </label>
            <div class="ide-modal-error" id="${errorId}"></div>
        `;

        let resolved = false;
        function done(value) {
            if (!resolved) { resolved = true; close(); resolve(value); }
        }

        const { close, overlay } = openModal({
            title,
            body: bodyHtml,
            buttons: [
                { label: 'Annuler',    primary: false, onClick: () => done(null) },
                { label: 'Confirmer', primary: true,  onClick: () => tryConfirm() },
            ],
            onClose: () => done(null),
        });

        const input   = overlay.querySelector(`#${inputId}`);
        const errorEl = overlay.querySelector(`#${errorId}`);
        input?.focus();

        async function tryConfirm() {
            const value = input?.value.trim() ?? '';
            if (!value) { errorEl.textContent = 'Ce champ est requis.'; return; }
            if (validate) {
                const result = await validate(value);
                if (result !== true) { errorEl.textContent = result; return; }
            }
            done(value);
        }

        input?.addEventListener('keydown', e => {
            if (e.key === 'Enter')  tryConfirm();
            if (e.key === 'Escape') done(null);
        });
    });
}
