/**
 * Toast notification system.
 * Shows brief, non-blocking messages at the bottom-right of the screen.
 */

let _container = null;

function getContainer() {
    if (!_container) {
        _container = document.getElementById('toast-container');
    }
    return _container;
}

/**
 * Show a toast notification.
 * @param {'success'|'error'|'warning'|'info'} type
 * @param {string} message
 * @param {number} [duration=3500] ms before auto-dismiss
 */
export function showToast(type, message, duration = 3500) {
    const container = getContainer();
    if (!container) return;

    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.textContent = message;

    container.appendChild(toast);

    const remove = () => {
        toast.classList.add('removing');
        toast.addEventListener('animationend', () => toast.remove(), { once: true });
    };

    const timer = setTimeout(remove, duration);
    toast.addEventListener('click', () => { clearTimeout(timer); remove(); });
}
