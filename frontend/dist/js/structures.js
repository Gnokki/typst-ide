/**
 * structures.js
 *  helping structures module
 *
 * ## API
 */

import { getCurrentFontFamily } from './editor'

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

  icon.classList.toggle("structure-btn-icon-rotate");
}

export function setBtnIcon(open) {
  const icon = document.getElementById("structures-btn-icon");
  if (!icon) return;

  icon.classList.toggle("structure-btn-icon-rotate", open);
}
