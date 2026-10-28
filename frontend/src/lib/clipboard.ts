// Copie un texte dans le presse-papiers. L'API moderne (navigator.clipboard) n'existe que sur
// HTTPS ou localhost : sur une adresse réseau en http (test depuis un téléphone) ou dans
// certains navigateurs intégrés, elle est absente et la copie échouait sans explication. On
// retombe alors sur l'ancienne méthode (zone de texte invisible + execCommand), qui fonctionne
// partout tant que l'appel vient d'un clic.
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch {
    /* refusé : on tente la méthode de secours */
  }

  const area = document.createElement('textarea');
  area.value = text;
  area.setAttribute('readonly', '');
  area.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none;font-size:16px;';
  document.body.appendChild(area);
  area.select();
  area.setSelectionRange(0, text.length);
  let ok: boolean;
  try {
    ok = document.execCommand('copy');
  } catch {
    ok = false;
  }
  document.body.removeChild(area);
  return ok;
}
