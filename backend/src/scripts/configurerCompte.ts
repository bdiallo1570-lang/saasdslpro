// Configure un compte existant directement en base : numéro de téléphone, e-mail et/ou nouveau
// mot de passe. Sert surtout en production, quand l'admin ne peut plus se connecter ou que son
// compte porte encore les coordonnées de démonstration. Le mot de passe se tape sans s'afficher
// et ne quitte jamais l'ordinateur qui lance le script (il n'est stocké que haché).
//
//   DATABASE_URL="<adresse de la base, copiée depuis l'hébergeur>" npm run compte:configurer -- \
//     --identifiant admin@dslaircargo.com --telephone 620717150 --email vous@gmail.com --mot-de-passe
//
// --identifiant : e-mail ou téléphone actuel du compte (obligatoire)
// --telephone, --email : nouvelles coordonnées (facultatives)
// --mot-de-passe : demande un nouveau mot de passe (facultatif)

import readline from 'node:readline';
import bcrypt from 'bcrypt';
import { PrismaClient } from '@prisma/client';

const MOTS_DE_PASSE_INTERDITS = ['changemoi123!'];

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(`--${name}`);
  if (i < 0) return undefined;
  const v = process.argv[i + 1];
  return v && !v.startsWith('--') ? v : '';
}

// Même normalisation que la connexion (voir normalizePhone dans auth.service.ts)
function normaliserTelephone(raw: string): string {
  let n = raw.trim().replace(/[\s.\-()]/g, '');
  if (n.startsWith('00')) n = `+${n.slice(2)}`;
  if (/^6\d{8}$/.test(n)) n = `+224${n}`;
  return n;
}

// Un seul lecteur pour tout le script : fonctionne au clavier comme avec des réponses envoyées
// d'un coup (un lecteur par question avalerait les lignes suivantes).
const rl = readline.createInterface({ input: process.stdin, output: process.stdout, terminal: !!process.stdin.isTTY });
const lignes: string[] = [];
const enAttente: ((ligne: string) => void)[] = [];
let masquer = false;
rl.on('line', (ligne) => {
  const suivant = enAttente.shift();
  if (suivant) suivant(ligne);
  else lignes.push(ligne);
});
// Au clavier, les caractères d'un mot de passe ne s'affichent pas
(rl as unknown as { _writeToOutput: (s: string) => void })._writeToOutput = (s: string) => {
  if (!masquer || s === '\r\n' || s === '\n') process.stdout.write(s);
};

function demander(question: string, masque = false): Promise<string> {
  process.stdout.write(question);
  masquer = masque && !!process.stdin.isTTY;
  return new Promise((resolve) => {
    const repondre = (ligne: string) => {
      masquer = false;
      resolve(ligne.trim());
    };
    const deja = lignes.shift();
    if (deja !== undefined) repondre(deja);
    else enAttente.push(repondre);
  });
}

function erreurMotDePasse(v: string): string | null {
  if (v.length < 10) return '10 caractères minimum.';
  if (!/[A-Za-z]/.test(v)) return 'Au moins une lettre.';
  if (!/\d/.test(v)) return 'Au moins un chiffre.';
  if (MOTS_DE_PASSE_INTERDITS.includes(v.toLowerCase())) return 'Ce mot de passe est public.';
  return null;
}

async function main() {
  const identifiant = arg('identifiant');
  const telephone = arg('telephone');
  const email = arg('email');
  const changerMotDePasse = process.argv.includes('--mot-de-passe');

  if (!identifiant) throw new Error('Indiquez le compte : --identifiant <e-mail ou téléphone actuel>.');
  if (!telephone && !email && !changerMotDePasse) {
    throw new Error('Rien à modifier : --telephone, --email et/ou --mot-de-passe.');
  }
  if (!process.env.DATABASE_URL) throw new Error('DATABASE_URL manquante.');

  const base = new URL(process.env.DATABASE_URL);
  const prisma = new PrismaClient();
  try {
    const compte = await prisma.user.findFirst({
      where: identifiant.includes('@')
        ? { email: identifiant }
        : { phoneNumber: { in: [identifiant, normaliserTelephone(identifiant)] } },
      include: { role: true },
    });
    if (!compte) throw new Error(`Aucun compte trouvé pour « ${identifiant} ».`);

    const data: { phoneNumber?: string; email?: string; passwordHash?: string; isActive?: boolean } = {};
    if (telephone) {
      data.phoneNumber = normaliserTelephone(telephone);
      const pris = await prisma.user.findFirst({ where: { phoneNumber: data.phoneNumber, NOT: { id: compte.id } } });
      if (pris) throw new Error(`Le numéro ${data.phoneNumber} est déjà utilisé par un autre compte.`);
    }
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error(`Adresse e-mail invalide : ${email}`);
      data.email = email.toLowerCase();
      const pris = await prisma.user.findFirst({ where: { email: data.email, NOT: { id: compte.id } } });
      if (pris) throw new Error(`L'adresse ${data.email} est déjà utilisée par un autre compte.`);
    }
    if (changerMotDePasse) {
      const mdp = await demander('Nouveau mot de passe : ', true);
      const probleme = erreurMotDePasse(mdp);
      if (probleme) throw new Error(`Mot de passe refusé : ${probleme}`);
      if ((await demander('Confirmez le mot de passe : ', true)) !== mdp) throw new Error('Les deux saisies diffèrent.');
      data.passwordHash = await bcrypt.hash(mdp, 10);
      data.isActive = true;
    }

    console.log(`\nBase : ${base.hostname}`);
    console.log(`Compte : ${compte.fullName} (${compte.role.roleName}) — ${compte.email ?? '-'} / ${compte.phoneNumber}`);
    if (data.phoneNumber) console.log(`  téléphone → ${data.phoneNumber}`);
    if (data.email) console.log(`  e-mail → ${data.email}`);
    if (data.passwordHash) console.log('  mot de passe → nouveau (toutes les sessions seront fermées)');
    if ((await demander('Appliquer ces changements ? (oui/non) ')).toLowerCase() !== 'oui') {
      console.log("Annulé, rien n'a été modifié.");
      return;
    }

    await prisma.$transaction([
      prisma.user.update({ where: { id: compte.id }, data }),
      ...(data.passwordHash
        ? [prisma.refreshToken.updateMany({ where: { userId: compte.id, revokedAt: null }, data: { revokedAt: new Date() } })]
        : []),
    ]);
    console.log('Compte mis à jour.');
  } finally {
    rl.close();
    await prisma.$disconnect();
  }
}

main().catch((error) => {
  console.error(`Erreur : ${error instanceof Error ? error.message : error}`);
  process.exit(1);
});
