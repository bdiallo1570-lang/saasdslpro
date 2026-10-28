import { copyToClipboard } from '@/lib/clipboard';
import { useState, useEffect } from 'react';
import { listWarehouses, WarehouseLocation } from './warehouses.api';
import { Modal, Card, Button, Badge, notify } from '@/ui';

interface WarehouseAddressModalProps {
  open: boolean;
  onClose: () => void;
}

export function WarehouseAddressModal({ open, onClose }: WarehouseAddressModalProps) {
  const [warehouses, setWarehouses] = useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setLoading(true);
    listWarehouses()
      .then(setWarehouses)
      .finally(() => setLoading(false));
  }, [open]);

  const chinaWarehouses = warehouses.filter((w) => w.location === 'CHINE');

  async function handleCopy(warehouse: WarehouseLocation) {
    const text = [warehouse.name, warehouse.addressZh, warehouse.addressFr]
      .filter(Boolean)
      .join('\n');
    if (!(await copyToClipboard(text))) {
      notify.error('Impossible de copier — sélectionnez le texte manuellement.');
      return;
    }
    setCopiedId(warehouse.id);
    notify.success('Adresse copiée dans le presse-papiers.');
    setTimeout(() => setCopiedId(null), 2000);
  }

  return (
    <Modal open={open} onClose={onClose} title="Adresse de l'entrepôt en Chine">
      <div className="space-y-4">
        {loading && <p className="text-sm text-slate-400">Chargement…</p>}

        {!loading &&
          chinaWarehouses.map((warehouse) => (
            <Card key={warehouse.id} glow="none" className="p-4">
              <p className="font-medium text-night-800 dark:text-slate-100 mb-2">{warehouse.name}</p>

              {warehouse.addressZh && (
                <div className="mb-2">
                  <p className="text-xs text-slate-400 mb-0.5">Adresse (中文)</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{warehouse.addressZh}</p>
                </div>
              )}

              {warehouse.addressFr && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-0.5">Adresse (français)</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{warehouse.addressFr}</p>
                </div>
              )}

              {warehouse.contactNumbersJson && Object.keys(warehouse.contactNumbersJson).length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-slate-400 mb-1">Contacts d'urgence</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(warehouse.contactNumbersJson).map(([name, phone]) => (
                      <Badge key={name} tone="sky">
                        {name}
                        {phone ? ` — ${phone}` : ''}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <Button variant="cargo" fullWidth onClick={() => handleCopy(warehouse)}>
                {copiedId === warehouse.id ? 'Adresse copiée ✓' : "Copier l'adresse"}
              </Button>
            </Card>
          ))}
      </div>
    </Modal>
  );
}
