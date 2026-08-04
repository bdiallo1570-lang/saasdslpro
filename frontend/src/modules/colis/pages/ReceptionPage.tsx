import { AppShell } from '@/layout/AppShell';
import { PageHeader } from '@/ui';
import { NouveauColisForm } from '../components/NouveauColisForm';

export default function ReceptionPage() {
  return (
    <AppShell>
      <div className="max-w-md mx-auto">
        <PageHeader
          title="Réception — Chine"
          description="Enregistrer un nouveau colis reçu à l'entrepôt de Guangzhou"
        />
        <NouveauColisForm />
      </div>
    </AppShell>
  );
}
