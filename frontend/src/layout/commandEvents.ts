// Petits événements globaux entre composants éloignés de la coquille (sidebar, palette ⌘K,
// bouton « Nouveau colis ») sans contexte React dédié.
const OPEN_PALETTE = 'dsl:open-command-palette';
const OPEN_NEW_COLIS = 'dsl:open-new-colis';
const OPEN_CHANGE_PASSWORD = 'dsl:open-change-password';

export function openCommandPalette() {
  window.dispatchEvent(new Event(OPEN_PALETTE));
}

export function openNewColis() {
  window.dispatchEvent(new Event(OPEN_NEW_COLIS));
}

export function onCommandPaletteOpen(handler: () => void) {
  window.addEventListener(OPEN_PALETTE, handler);
  return () => window.removeEventListener(OPEN_PALETTE, handler);
}

export function onNewColisOpen(handler: () => void) {
  window.addEventListener(OPEN_NEW_COLIS, handler);
  return () => window.removeEventListener(OPEN_NEW_COLIS, handler);
}

export function openChangePassword() {
  window.dispatchEvent(new Event(OPEN_CHANGE_PASSWORD));
}

export function onChangePasswordOpen(handler: () => void) {
  window.addEventListener(OPEN_CHANGE_PASSWORD, handler);
  return () => window.removeEventListener(OPEN_CHANGE_PASSWORD, handler);
}

export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
