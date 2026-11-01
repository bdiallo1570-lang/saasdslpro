// Petits événements globaux entre composants éloignés de la coquille (sidebar, palette ⌘K,
// bouton « Nouveau colis ») sans contexte React dédié.
const OPEN_PALETTE = 'dsl:open-command-palette';
const OPEN_NEW_COLIS = 'dsl:open-new-colis';

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

export const IS_MAC = typeof navigator !== 'undefined' && /Mac|iPhone|iPad/.test(navigator.platform);
