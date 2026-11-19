// Champ piège anti-robots (« honeypot ») des formulaires publics : hors de l'écran, hors de la
// navigation clavier, ignoré par les lecteurs d'écran et le remplissage automatique. Un humain
// ne le voit jamais ; un robot qui remplit tous les champs le remplit, et le serveur refuse sa
// demande (backend middleware/antiSpam.ts, champ « site_web »).
export function ChampPiege({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <div aria-hidden="true" style={{ position: 'absolute', left: '-10000px', top: 'auto', width: 1, height: 1, overflow: 'hidden' }}>
      <label>
        Ne pas remplir ce champ
        <input
          type="text"
          name="site_web"
          tabIndex={-1}
          autoComplete="off"
          data-lpignore="true"
          data-1p-ignore="true"
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </label>
    </div>
  );
}
