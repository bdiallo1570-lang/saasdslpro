import { z } from 'zod';

// L'entreprise ne travaille qu'en franc guinéen : toute saisie dans une autre devise est
// refusée à l'entrée, plutôt que de dépendre des conversions multi-devises du reste du code.
export const gnfOnly = z.literal('GNF', {
  errorMap: () => ({ message: 'Seul le franc guinéen (GNF) est accepté.' }),
});
