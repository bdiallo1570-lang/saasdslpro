import { randomInt } from 'node:crypto';
import { prisma } from '@/lib/prisma';
import { AppError } from '@/lib/errors';
import { hashPassword } from '@/lib/password';
import { ROLE_NAMES } from '@/config/roles';

export class EspaceClientError extends AppError {}

// Sans 0/O, 1/l/I : le mot de passe est lu à voix haute ou recopié depuis WhatsApp
const ALPHABET = 'abcdefghjkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function motDePasseTemporaire(longueur = 8): string {
  return Array.from({ length: longueur }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

export async function getEspaceClient(clientId: string) {
  const user = await prisma.user.findUnique({ where: { clientId } });
  return { actif: !!user && user.isActive && !user.deletedAt, identifiant: user?.phoneNumber ?? null };
}

// Active l'espace client (création du compte relié à la fiche) ou, s'il existe déjà, génère de
// nouveaux accès. Le mot de passe n'est renvoyé qu'ici, une seule fois, pour être transmis au
// client ; il n'est stocké que haché.
export async function activerEspaceClient(clientId: string) {
  const client = await prisma.client.findFirst({ where: { id: clientId, deletedAt: null } });
  if (!client) throw new EspaceClientError('Client introuvable.', 404);

  const telephone = client.phoneWhatsapp || client.phoneGn;
  if (!telephone) {
    throw new EspaceClientError(
      "Ajoutez d'abord un numéro WhatsApp ou de téléphone à ce client : il lui sert d'identifiant.",
    );
  }

  const motDePasse = motDePasseTemporaire();
  const passwordHash = await hashPassword(motDePasse);
  const existant = await prisma.user.findUnique({ where: { clientId } });

  if (existant) {
    await prisma.$transaction([
      prisma.user.update({
        where: { id: existant.id },
        data: { passwordHash, isActive: true, deletedAt: null, phoneNumber: telephone, fullName: client.fullName },
      }),
      // Nouveaux accès : les anciennes sessions sont fermées
      prisma.refreshToken.deleteMany({ where: { userId: existant.id } }),
    ]);
    return { identifiant: telephone, motDePasse, dejaActif: true };
  }

  const pris = await prisma.user.findUnique({ where: { phoneNumber: telephone } });
  if (pris) {
    throw new EspaceClientError(
      `Le numéro ${telephone} est déjà utilisé par un autre compte. Modifiez le numéro du client ou contactez l'administrateur.`,
      409,
    );
  }

  const role = await prisma.role.findUniqueOrThrow({ where: { roleName: ROLE_NAMES.CLIENT } });
  await prisma.user.create({
    data: {
      fullName: client.fullName,
      phoneNumber: telephone,
      passwordHash,
      roleId: role.id,
      clientId: client.id,
      isActive: true,
    },
  });
  return { identifiant: telephone, motDePasse, dejaActif: false };
}
