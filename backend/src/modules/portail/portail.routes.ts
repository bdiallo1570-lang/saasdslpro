import { Router, Request, Response } from 'express';
import { prisma } from '@/lib/prisma';
import { asyncHandler } from '@/lib/asyncHandler';
import { requireAuth, requirePermission } from '@/middleware/auth';
import { signDocumentToken } from '@/lib/documentLinks';

export const portailRouter = Router();

portailRouter.use(requireAuth);

// Espace client : ses propres factures et reçus, et rien d'autre. Le client est déterminé par
// son compte (jamais par un paramètre de la requête). Chaque document porte un lien signé : le
// téléchargement passe par la même route publique que les liens envoyés sur WhatsApp.
portailRouter.get(
  '/documents',
  requirePermission('factures:read_own'),
  asyncHandler(async (req: Request, res: Response) => {
    const user = await prisma.user.findUnique({
      where: { id: req.user!.sub },
      include: { client: true },
    });
    if (!user?.client) {
      return res.status(200).json({ success: true, data: { client: null, factures: [], recus: [] }, error: null });
    }

    const factures = await prisma.facture.findMany({
      where: { clientId: user.client.id, deletedAt: null },
      include: {
        paiements: { where: { deletedAt: null }, orderBy: { createdAt: 'asc' } },
        _count: { select: { colis: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const facturesData = factures.map((f) => {
      const paye = f.paiements.reduce((s, p) => s + Number(p.montant) * Number(p.tauxVersGnf), 0);
      return {
        id: f.id,
        numero: f.factureNumber,
        date: f.createdAt,
        montant: Number(f.montantTotal),
        devise: f.currency,
        paye,
        reste: Math.max(0, Number(f.montantTotal) - paye),
        colis: f._count.colis,
        token: signDocumentToken('facture', f.id),
      };
    });

    const recus = factures
      .flatMap((f) =>
        f.paiements.map((p) => ({
          id: p.id,
          numero: `R-${p.id.slice(0, 8).toUpperCase()}`,
          date: p.datePaiement ?? p.createdAt,
          montant: Number(p.montant),
          devise: p.currency,
          factureNumero: f.factureNumber,
          token: signDocumentToken('recu', p.id),
        })),
      )
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.status(200).json({
      success: true,
      data: {
        client: { nom: user.client.fullName, code: user.client.clientCode },
        factures: facturesData,
        recus,
      },
      error: null,
    });
  }),
);
