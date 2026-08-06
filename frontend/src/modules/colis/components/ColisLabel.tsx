import { QRCodeSVG } from 'qrcode.react';
import { Colis } from '../colis.api';

interface ColisLabelProps {
  colis: Colis;
}

// Étiquette imprimable au format standard fret 100x150mm (voir @media print ci-dessous).
// IMPORTANT : le contenu de `.colis-label` doit rester blanc/print-safe en toutes circonstances
// (pas de classes dark:) — c'est une étiquette physique, pas un panneau themé. Le conteneur
// englobant ci-dessous n'est qu'une présentation à l'écran (ombre/cadre) et n'affecte pas l'impression.
export function ColisLabel({ colis }: ColisLabelProps) {
  return (
    <div className="print:shadow-none print:rounded-none print:p-0 rounded-2xl shadow-card dark:shadow-card-dark p-3 bg-slate-100 dark:bg-night-700 flex justify-center">
      <div className="colis-label bg-white border-2 border-black p-4 w-[100mm] h-[150mm] flex flex-col justify-between mx-auto">
        <div className="text-center border-b-2 border-black pb-2">
          <p className="font-bold text-lg tracking-wide">DSL AIR CARGO</p>
          <p className="text-xs">Guangzhou → Conakry</p>
        </div>

        <div className="flex justify-center py-3">
          <QRCodeSVG value={colis.trackingId} size={140} />
        </div>

        <div className="text-center">
          <p className="text-xl font-bold tracking-widest">{colis.trackingId}</p>
        </div>

        <div className="text-sm space-y-1 border-t-2 border-black pt-2">
          <p>
            <span className="font-semibold">Client :</span> {colis.client.fullName}
          </p>
          {(colis.client.phoneWhatsapp || colis.client.phoneGn) && (
            <p>
              <span className="font-semibold">Téléphone :</span>{' '}
              {colis.client.phoneWhatsapp || colis.client.phoneGn}
            </p>
          )}
          <p>
            <span className="font-semibold">Code :</span> {colis.client.clientCode}
          </p>
          <p>
            <span className="font-semibold">Poids réel :</span> {colis.poidsReelKg} kg
          </p>
          <p>
            <span className="font-semibold">Catégorie :</span>{' '}
            {colis.categorieTarif === 'STANDARD'
              ? 'Standard'
              : colis.categorieTarif === 'RISQUE'
                ? 'À risque'
                : 'Personnalisé'}
          </p>
          <p className="truncate">
            <span className="font-semibold">Description :</span> {colis.description}
          </p>
        </div>
      </div>
    </div>
  );
}
