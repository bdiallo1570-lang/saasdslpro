import { describe, it, expect, vi, beforeEach } from 'vitest';

// Base de données en mémoire : juste ce que createPaiement lit et écrit. Permet de tester la
// vraie logique de statut / solde / caisse sans PostgreSQL.
const db = vi.hoisted(() => ({
  facture: null as null | Record<string, unknown> & { paiements: Record<string, unknown>[] },
  client: { outstandingBalance: 0, totalSpent: 0 },
  cashTransactions: [] as Record<string, unknown>[],
  closure: null as null | { id: string; currency: string; status: string },
}));

vi.mock('@/lib/prisma', () => {
  const tx = {
    $queryRaw: async () => [],
    facture: {
      findFirst: async () => db.facture && { ...db.facture, paiements: [...db.facture.paiements] },
      update: async ({ data }: { data: { status: string } }) => {
        db.facture!.status = data.status;
        return db.facture;
      },
    },
    cashRegisterClosure: { findFirst: async () => (db.closure?.status === 'OUVERTE' ? db.closure : null) },
    cashTransaction: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `ct-${db.cashTransactions.length + 1}`, ...data };
        db.cashTransactions.push(row);
        return row;
      },
    },
    paiement: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        const row = { id: `p-${db.facture!.paiements.length + 1}`, ...data };
        db.facture!.paiements.push(row);
        return row;
      },
      findUniqueOrThrow: async ({ where }: { where: { id: string } }) =>
        db.facture!.paiements.find((p) => p.id === where.id),
    },
    auditLog: { create: async () => ({}) },
    client: {
      update: async ({ data }: { data: { totalSpent: { increment: number }; outstandingBalance: { decrement: number } } }) => {
        db.client.totalSpent += data.totalSpent.increment;
        db.client.outstandingBalance -= data.outstandingBalance.decrement;
        return db.client;
      },
    },
  };
  return { prisma: { $transaction: (fn: (t: typeof tx) => unknown) => fn(tx) } };
});
vi.mock('@/lib/whatsapp/notifications', () => ({ sendRelanceImpaye: vi.fn() }));
vi.mock('@/modules/factures/factures.service', () => ({ ensureFactureForColis: vi.fn() }));

import { createPaiement, PaiementError } from '@/modules/paiements/paiements.service';

const payer = (montant: number, extra: Record<string, unknown> = {}) =>
  createPaiement({ factureId: 'f-1', montant, currency: 'GNF', method: 'ESPECES', ...extra }, 'agent-1');

describe('createPaiement (GNF)', () => {
  beforeEach(() => {
    db.facture = {
      id: 'f-1',
      factureNumber: 'FAC-2026-00001',
      clientId: 'c-1',
      montantTotal: 100_000,
      currency: 'GNF',
      status: 'IMPAYE',
      colis: [{ lotId: null }],
      paiements: [],
    };
    db.client = { outstandingBalance: 100_000, totalSpent: 0 };
    db.cashTransactions = [];
    db.closure = { id: 'cl-1', currency: 'GNF', status: 'OUVERTE' };
  });

  it('passe la facture en PARTIEL puis PAYE et met le solde client à jour', async () => {
    await payer(40_000);
    expect(db.facture!.status).toBe('PARTIEL');
    expect(db.client.outstandingBalance).toBe(60_000);

    await payer(60_000);
    expect(db.facture!.status).toBe('PAYE');
    expect(db.client.outstandingBalance).toBe(0);
    expect(db.client.totalSpent).toBe(100_000);
  });

  it('refuse un nouveau paiement sur une facture déjà soldée', async () => {
    await payer(100_000);
    await expect(payer(100_000)).rejects.toMatchObject({ statusCode: 409 });
    expect(db.facture!.paiements).toHaveLength(1);
  });

  it('enregistre la référence, la date et le commentaire saisis par l\'agent', async () => {
    const datePaiement = new Date('2026-10-20');
    const p = await payer(10_000, { reference: 'OM-123456', datePaiement, commentaire: 'Payé par le frère' });
    expect(p).toMatchObject({ reference: 'OM-123456', datePaiement, commentaire: 'Payé par le frère' });
  });

  it('crée une entrée dans la caisse ouverte quand le paiement y est rattaché', async () => {
    await payer(25_000, { closureId: 'cl-1' });
    expect(db.cashTransactions).toHaveLength(1);
    expect(db.cashTransactions[0]).toMatchObject({ type: 'ENTREE', montant: 25_000, currency: 'GNF' });
  });

  it('refuse un paiement rattaché à une caisse déjà clôturée', async () => {
    db.closure!.status = 'CLOTUREE';
    await expect(payer(25_000, { closureId: 'cl-1' })).rejects.toBeInstanceOf(PaiementError);
    expect(db.facture!.paiements).toHaveLength(0);
  });
});
